-- Schema pentru aplicația de programări stomatologice
-- Rulează acest fișier în SQL Editor din Supabase Dashboard

-- ============================================
-- TABELA: appointment_slots (sloturile disponibile/ocupate)
-- ============================================
CREATE TABLE IF NOT EXISTS appointment_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slot_date DATE NOT NULL,
    slot_time TIME NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
    patient_name TEXT,
    patient_phone TEXT,
    booked_by TEXT, -- email
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constrângere unică pentru a preveni dubla rezervare
    UNIQUE(slot_date, slot_time)
);

-- Index pentru căutări rapide
CREATE INDEX IF NOT EXISTS idx_appointment_slots_date ON appointment_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_status ON appointment_slots(status);

-- ============================================
-- TABELA: appointments (detaliile programărilor)
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slot_id UUID REFERENCES appointment_slots(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    service TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_email ON appointments(email);

-- ============================================
-- TRIGGER: Actualizare updated_at automat
-- ============================================
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_appointment_slots_updated_at ON appointment_slots;
CREATE TRIGGER update_appointment_slots_updated_at
    BEFORE UPDATE ON appointment_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Politici de securitate
-- ============================================

-- Activăm RLS pe tabele
ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Politică: Toată lumea poate vedea sloturile disponibile
DROP POLICY IF EXISTS "Vizualizare sloturi disponibile" ON appointment_slots;
CREATE POLICY "Vizualizare sloturi disponibile" ON appointment_slots
    FOR SELECT
    USING (true);

-- Politică: Doar utilizatorii autentificați ca admin pot modifica sloturile
DROP POLICY IF EXISTS "Modificare sloturi doar de admin" ON appointment_slots;
CREATE POLICY "Modificare sloturi doar de admin" ON appointment_slots
    FOR ALL
    USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');

-- Politică: Toată lumea poate vedea programările (pentru verificare disponibilitate)
DROP POLICY IF EXISTS "Vizualizare programări" ON appointments;
CREATE POLICY "Vizualizare programări" ON appointments
    FOR SELECT
    USING (true);

-- ============================================
-- REALTIME - Abonamente la modificări în timp real
-- ============================================

-- Adăugăm tabela la publicația realtime
BEGIN;
  -- Dacă publicația realtime nu există, o creăm
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
      CREATE PUBLICATION supabase_realtime;
    END IF;
  END $$;
  
  -- Adăugăm tabelele la publicație
  ALTER PUBLICATION supabase_realtime ADD TABLE appointment_slots;
  ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
COMMIT;

-- ============================================
-- FUNCȚIE: Generare sloturi pentru o perioadă
-- ============================================
DROP FUNCTION IF EXISTS generate_appointment_slots(DATE, DATE, TIME, TIME, INTEGER);

CREATE OR REPLACE FUNCTION generate_appointment_slots(
    p_start_date DATE,
    p_end_date DATE,
    p_start_time TIME DEFAULT '09:00',
    p_end_time TIME DEFAULT '17:00',
    p_interval_minutes INTEGER DEFAULT 60
)
RETURNS INTEGER AS $$
DECLARE
    v_current_date DATE := p_start_date;
    v_current_time TIME;
    v_slot_count INTEGER := 0;
BEGIN
    WHILE v_current_date <= p_end_date LOOP
        v_current_time := p_start_time;
        
        WHILE v_current_time <= p_end_time LOOP
            -- Sărim peste pauza de prânz (12:00 - 14:00)
            IF v_current_time < '12:00' OR v_current_time >= '14:00' THEN
                INSERT INTO appointment_slots (slot_date, slot_time, status)
                VALUES (v_current_date, v_current_time, 'available')
                ON CONFLICT (slot_date, slot_time) DO NOTHING;
                
                v_slot_count := v_slot_count + 1;
            END IF;
            
            v_current_time := v_current_time + (p_interval_minutes || ' minutes')::INTERVAL;
        END LOOP;
        
        v_current_date := v_current_date + 1;
    END LOOP;
    
    RETURN v_slot_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCȚIE: Verificare și rezervare atomică
-- ============================================
DROP FUNCTION IF EXISTS book_appointment(DATE, TIME, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION book_appointment(
    p_date DATE,
    p_time TIME,
    p_name TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_service TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_slot_id UUID;
    v_result JSONB;
BEGIN
    -- Încercăm să rezervăm slotul atomic
    UPDATE appointment_slots
    SET status = 'booked',
        patient_name = p_name,
        patient_phone = p_phone,
        booked_by = p_email,
        updated_at = NOW()
    WHERE slot_date = p_date 
      AND slot_time = p_time 
      AND status = 'available'
    RETURNING id INTO v_slot_id;
    
    IF v_slot_id IS NULL THEN
        -- Slotul e deja ocupat
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Acest slot tocmai a fost rezervat de altcineva. Te rugăm să alegi altă dată și oră.',
            'clear_date_time', true
        );
    END IF;
    
    -- Creăm programarea
    INSERT INTO appointments (slot_id, name, email, phone, service, appointment_date, appointment_time)
    VALUES (v_slot_id, p_name, p_email, p_phone, p_service, p_date, p_time);
    
    RETURN jsonb_build_object(
        'success', true,
        'slot_id', v_slot_id,
        'message', 'Programare confirmată!'
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DATE DE TEST (opțional)
-- ============================================
-- Generăm sloturi pentru următoarele 30 de zile
-- Debifează liniile de mai jos dacă vrei să generezi sloturi automat
-- SELECT generate_appointment_slots(
--     CURRENT_DATE,
--     CURRENT_DATE + INTERVAL '30 days'
-- );
