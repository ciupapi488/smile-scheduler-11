const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Conectare la Supabase (PostgreSQL în cloud)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Service key pentru operațiuni admin
);

// Configurare email (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Ruta de test
app.get('/api/test', (req, res) => {
  res.json({ message: 'Serverul funcționează!' });
});

// Obține sloturile disponibile pentru o anumită dată
app.get('/api/available-slots', async (req, res) => {
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({ error: 'Data este necesară' });
  }
  
  // Toate sloturile posibile (09:00 - 17:00, din oră în oră)
  const allSlots = [
    '09:00', '10:00', '11:00', '12:00', 
    '14:00', '15:00', '16:00', '17:00'
  ];
  
  try {
    // Căutăm sloturile ocupate pentru data respectivă din Supabase
    const { data: bookedSlots, error } = await supabase
      .from('appointment_slots')
      .select('slot_time')
      .eq('slot_date', date)
      .eq('status', 'booked');
    
    if (error) throw error;
    
    const bookedTimes = bookedSlots.map(row => row.slot_time);
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));
    
    res.json({ 
      date: date,
      availableSlots: availableSlots,
      bookedSlots: bookedTimes 
    });
  } catch (err) {
    console.error('Eroare la obținerea sloturilor:', err);
    res.status(500).json({ error: err.message });
  }
});

// Ruta pentru a primi programări - cu protecție la concurență
app.post('/api/appointments', async (req, res) => {
  const { name, email, phone, date, time, service } = req.body;
  
  if (!name || !email || !phone || !date || !time || !service) {
    return res.status(400).json({ 
      error: 'Toate câmpurile sunt obligatorii',
      clearDateTime: false 
    });
  }
  
  try {
    // PAS 1: Verificăm dacă slotul e deja ocupat
    const { data: existingSlot, error: checkError } = await supabase
      .from('appointment_slots')
      .select('*')
      .eq('slot_date', date)
      .eq('slot_time', time)
      .eq('status', 'booked')
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows
      throw checkError;
    }
    
    if (existingSlot) {
      // Slotul e deja ocupat - returnăm eroare specială
      return res.status(409).json({ 
        error: 'Acest slot tocmai a fost rezervat de altcineva. Te rugăm să alegi altă dată și oră.',
        clearDateTime: true,  // Semnal pentru frontend să șteargă data și ora
        conflict: true
      });
    }
    
    // PAS 2: Încercăm să inserăm cu UPSERT pentru a evita race condition
    // Folosim o coloană unică compusă (slot_date, slot_time) în baza de date
    const { data: newSlot, error: insertError } = await supabase
      .from('appointment_slots')
      .upsert({
        slot_date: date,
        slot_time: time,
        status: 'booked',
        patient_name: name,
        patient_phone: phone,
        booked_by: email,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'slot_date,slot_time', // Coloane unice definite în Supabase
        ignoreDuplicates: false // Dacă există deja, va returna eroare
      })
      .select()
      .single();
    
    if (insertError) {
      // Dacă inserarea a eșuat din cauza conflictului
      if (insertError.code === '23505') { // PostgreSQL unique violation
        return res.status(409).json({ 
          error: 'Acest slot tocmai a fost rezervat de altcineva. Te rugăm să alegi altă dată și oră.',
          clearDateTime: true,
          conflict: true
        });
      }
      throw insertError;
    }
    
    // PAS 3: Salvăm detaliile programării în tabela appointments
    const { error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        slot_id: newSlot.id,
        name: name,
        email: email,
        phone: phone,
        service: service,
        appointment_date: date,
        appointment_time: time
      });
    
    if (appointmentError) throw appointmentError;
    
    // PAS 4: Trimitere email de confirmare
    // Adresa no-reply - reply-urile vor merge aici și pot fi ignorate
    const noReplyAddress = process.env.NO_REPLY_USER || process.env.EMAIL_USER;
    
    const mailOptions = {
      from: {
        name: 'Cabinet Stomatologic (Nu răspundeți)',
        address: process.env.EMAIL_USER
      },
      to: email,
      replyTo: noReplyAddress, // Reply-urile vor merge aici
      subject: 'Confirmare Programare - Cabinet Stomatologic',
      // Header-e pentru a preveni reply-urile automate
      headers: {
        'Precedence': 'bulk',
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
        'X-No-Reply': 'true',
        'X-Mailer': 'CabinetStomatologic-AutoMailer',
        'List-Unsubscribe': `<mailto:${noReplyAddress}?subject=unsubscribe>`
      },
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff;">Confirmare Programare</h2>
          <p>Bună <strong>${name}</strong>,</p>
          <p>Programarea ta a fost confirmată cu succes!</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Detalii programare:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">
                <strong>📅 Data:</strong> ${date}
              </li>
              <li style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">
                <strong>🕐 Ora:</strong> ${time}
              </li>
              <li style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">
                <strong>🦷 Serviciu:</strong> ${service}
              </li>
              <li style="padding: 8px 0;">
                <strong>📞 Telefon:</strong> ${phone}
              </li>
            </ul>
          </div>
          
          <p>Te așteptăm la cabinet!</p>
          
          <!-- Notificare importantă în email -->
          <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>⚠️ Acesta este un email automat.</strong><br>
              Nu răspundeți la acest mesaj. Pentru întrebări sau modificări, vă rugăm să ne contactați telefonic.
            </p>
          </div>
          
          <p style="color: #6c757d; font-size: 14px;">
            Dacă dorești să anulezi sau să modifici programarea, te rugăm să ne contactezi telefonic.
          </p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({ 
      success: true, 
      message: 'Programare confirmată! Verifică email-ul.',
      appointment: newSlot
    });
    
  } catch (err) {
    console.error('Eroare la procesarea programării:', err);
    res.status(500).json({ 
      error: 'Eroare internă. Încearcă din nou.',
      clearDateTime: false 
    });
  }
});

// Ruta pentru a vedea toate programările (pentru admin)
app.get('/api/appointments', async (req, res) => {
  try {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });
    
    if (error) throw error;
    
    res.json(appointments);
  } catch (err) {
    console.error('Eroare la obținerea programărilor:', err);
    res.status(500).json({ error: err.message });
  }
});

// Webhook pentru a asculta modificări în timp real (opțional)
app.post('/webhook/slot-update', (req, res) => {
  // Aici poți implementa logica pentru notificări real-time
  res.json({ received: true });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serverul rulează pe portul ${PORT}`);
});
