import { supabase } from './integrations/supabase/client';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// ============================================
// API via Supabase (metoda recomandată - real-time)
// ============================================

/**
 * Obține sloturile disponibile pentru o anumită dată
 */
export const getAvailableSlots = async (date: string): Promise<string[]> => {
  try {
    const allSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
    
    console.log('📡 Caut sloturi ocupate pentru data:', date);
    
    const { data: bookedSlots, error } = await supabase
      .from('appointment_slots')
      .select('slot_time')
      .eq('slot_date', date)
      .eq('status', 'booked');
    
    if (error) {
      console.error('❌ Eroare Supabase:', error);
      throw error;
    }
    
    console.log('📊 Sloturi ocupate primite:', bookedSlots);
    
    // Normalizăm formatul orei (eliminăm secundele dacă există)
    const bookedTimes = bookedSlots?.map(row => {
      const time = row.slot_time;
      // Dacă e în format HH:MM:SS, transformăm în HH:MM
      return time?.length === 8 ? time.substring(0, 5) : time;
    }) || [];
    
    console.log('⏰ Ore ocupate (normalizate):', bookedTimes);
    
    const available = allSlots.filter(slot => !bookedTimes.includes(slot));
    console.log('✅ Ore disponibile:', available);
    
    return available;
  } catch (error) {
    console.error('❌ Eroare la obținerea sloturilor:', error);
    return allSlots; // Dacă e eroare, returnăm toate sloturile
  }
};

/**
 * Creează o programare nouă - cu protecție la concurență
 * Returnează: { success: boolean, error?: string, clearDateTime?: boolean }
 */
export const createAppointment = async (data: {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  service: string;
}): Promise<{ success: boolean; error?: string; clearDateTime?: boolean }> => {
  try {
    // METODA 1: Folosim funcția RPC PostgreSQL pentru atomicitate maximă
    const { data: result, error } = await supabase
      .rpc('book_appointment', {
        p_date: data.date,
        p_time: data.time,
        p_name: data.name,
        p_email: data.email,
        p_phone: data.phone,
        p_service: data.service
      });
    
    if (error) {
      console.error('Eroare RPC:', error);
      
      // Dacă funcția RPC nu există, fallback la metoda clasică
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        return createAppointmentFallback(data);
      }
      
      throw error;
    }
    
    // Rezultatul este un JSONB
    if (result && result.success) {
      return { success: true };
    } else if (result) {
      return { 
        success: false, 
        error: result.error,
        clearDateTime: result.clear_date_time 
      };
    }
    
    return { success: false, error: 'Eroare necunoscută' };
  } catch (error: any) {
    console.error('Eroare la crearea programării:', error);
    return { 
      success: false, 
      error: error.message || 'Eroare la server. Încearcă din nou.' 
    };
  }
};

/**
 * Metodă fallback dacă funcția RPC nu există
 * Folosește upsert pentru a evita race conditions
 */
const createAppointmentFallback = async (data: {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  service: string;
}): Promise<{ success: boolean; error?: string; clearDateTime?: boolean }> => {
  try {
    // Verificăm mai întâi dacă slotul e disponibil
    const { data: existingSlot, error: checkError } = await supabase
      .from('appointment_slots')
      .select('*')
      .eq('slot_date', data.date)
      .eq('slot_time', data.time)
      .eq('status', 'booked')
      .maybeSingle();
    
    if (checkError) throw checkError;
    
    if (existingSlot) {
      return {
        success: false,
        error: 'Acest slot tocmai a fost rezervat de altcineva. Te rugăm să alegi altă dată și oră.',
        clearDateTime: true
      };
    }
    
    // Încercăm să rezervăm slotul
    const { data: newSlot, error: insertError } = await supabase
      .from('appointment_slots')
      .upsert({
        slot_date: data.date,
        slot_time: data.time,
        status: 'booked',
        patient_name: data.name,
        patient_phone: data.phone,
        booked_by: data.email,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'slot_date,slot_time'
      })
      .select()
      .single();
    
    if (insertError) {
      if (insertError.code === '23505') { // Unique violation
        return {
          success: false,
          error: 'Acest slot tocmai a fost rezervat de altcineva. Te rugăm să alegi altă dată și oră.',
          clearDateTime: true
        };
      }
      throw insertError;
    }
    
    // Salvăm detaliile programării
    const { error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        slot_id: newSlot.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        service: data.service,
        appointment_date: data.date,
        appointment_time: data.time
      });
    
    if (appointmentError) throw appointmentError;
    
    return { success: true };
  } catch (error: any) {
    console.error('Eroare fallback:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Abonament real-time la modificări în sloturi
 */
export const subscribeToSlotChanges = (
  date: string,
  callback: (payload: any) => void
) => {
  console.log(`📡 Creating realtime subscription for date: ${date}`);
  
  const subscription = supabase
    .channel(`slots:${date}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'appointment_slots',
        filter: `slot_date=eq.${date}`
      },
      (payload) => {
        console.log('🔔 Realtime event received:', payload);
        callback(payload);
      }
    )
    .subscribe((status) => {
      console.log(`📡 Realtime subscription status: ${status}`);
    });
  
  return subscription;
};

/**
 * Obține toate programările (pentru admin)
 */
export const getAppointments = async () => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Eroare la obținerea programărilor:', error);
    return [];
  }
};

// ============================================
// API via Backend Express (metodă alternativă cu email)
// ============================================

/**
 * Creează programare prin backend (trimite și email)
 */
export const createAppointmentViaBackend = async (data: {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  service: string;
}): Promise<{ success: boolean; error?: string; clearDateTime?: boolean }> => {
  try {
    const response = await fetch(`${API_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      // HTTP 409 = Conflict (slot deja ocupat)
      if (response.status === 409) {
        return {
          success: false,
          error: result.error || 'Acest slot tocmai a fost rezervat.',
          clearDateTime: result.clearDateTime ?? true
        };
      }
      
      return {
        success: false,
        error: result.error || 'Eroare la server'
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Eroare la server:', error);
    return { success: false, error: 'Eroare de conexiune. Încearcă din nou.' };
  }
};
