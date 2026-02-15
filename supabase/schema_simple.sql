-- ============================================
-- VERSIUNE SIMPLIFICATĂ - Fără erori
-- ============================================

-- 1. TABELA: appointment_slots
CREATE TABLE IF NOT EXISTS appointment_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slot_date DATE NOT NULL,
    slot_time TIME NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
    patient_name TEXT,
    patient_phone TEXT,
    booked_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(slot_date, slot_time)
);

-- 2. TABELA: appointments
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slot_id UUID REFERENCES appointment_slots(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    service TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXURI
CREATE INDEX IF NOT EXISTS idx_appointment_slots_date ON appointment_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_status ON appointment_slots(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

-- 4. FUNCTIE: Rezervare atomica
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
BEGIN
    -- Rezervam slotul atomic
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
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Acest slot tocmai a fost rezervat de altcineva. Te rugam sa alegi alta data si ora.',
            'clear_date_time', true
        );
    END IF;
    
    -- Salvam programarea
    INSERT INTO appointments (slot_id, name, email, phone, service, appointment_date, appointment_time)
    VALUES (v_slot_id, p_name, p_email, p_phone, p_service, p_date, p_time);
    
    RETURN jsonb_build_object(
        'success', true,
        'slot_id', v_slot_id,
        'message', 'Programare confirmata!'
    );
END;
$$ LANGUAGE plpgsql;

-- 5. REALTIME - activam notificari live
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Adaugam tabelele la realtime doar daca nu sunt deja
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'appointment_slots'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE appointment_slots;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'appointments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
    END IF;
END $$;

-- 6. SECURITATE - politici de acces
ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Select sloturi" ON appointment_slots;
CREATE POLICY "Select sloturi" ON appointment_slots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Select programari" ON appointments;
CREATE POLICY "Select programari" ON appointments FOR SELECT USING (true);

-- GATA! 🎉
