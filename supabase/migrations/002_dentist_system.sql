-- ============================================
-- MIGRARE: Sistem Complet Dentist
-- ============================================

-- 1. TABEL: Dentisti (profil complet)
CREATE TABLE IF NOT EXISTS dentists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Date autentificare
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- gestionat de Supabase Auth
    
    -- Date personale
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    
    -- Profil profesional
    specialization VARCHAR(200), -- ex: "Chirurgie dentara, Implantologie"
    bio TEXT, -- descriere profesionala
    education TEXT[], -- educatie: ['UMF Bucuresti 2010', 'Rezidentiat Chirurgie 2015']
    certifications TEXT[], -- certificari
    languages TEXT[], -- limbi vorbite: ['Romana', 'Engleza', 'Germana']
    years_experience INTEGER,
    
    -- Program de lucru implicit
    default_schedule JSONB DEFAULT '{
        "monday": {"start": "09:00", "end": "17:00", "is_working": true},
        "tuesday": {"start": "09:00", "end": "17:00", "is_working": true},
        "wednesday": {"start": "09:00", "end": "17:00", "is_working": true},
        "thursday": {"start": "09:00", "end": "17:00", "is_working": true},
        "friday": {"start": "09:00", "end": "17:00", "is_working": true},
        "saturday": {"start": null, "end": null, "is_working": false},
        "sunday": {"start": null, "end": null, "is_working": false}
    }'::jsonb,
    
    -- Setari
    appointment_duration_minutes INTEGER DEFAULT 60,
    max_appointments_per_day INTEGER DEFAULT 16,
    buffer_time_minutes INTEGER DEFAULT 15, -- pauza intre programari
    
    -- Notificari
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    daily_summary_email BOOLEAN DEFAULT true,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    role VARCHAR(50) DEFAULT 'dentist', -- 'dentist', 'admin', 'assistant'
    
    -- Metadata
    avatar_url TEXT,
    color_code VARCHAR(7) DEFAULT '#3B82F6', -- culoare in calendar
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Constrangeri
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 2. Adaugam dentist_id la appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS dentist_id UUID REFERENCES dentists(id) ON DELETE SET NULL;

-- Adaugam index pentru performanta
CREATE INDEX IF NOT EXISTS idx_appointments_dentist_id ON appointments(dentist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_dentist ON appointments(appointment_date, dentist_id);

-- 3. TABEL: Fisiere medicale ale pacientilor (pentru dentist)
CREATE TABLE IF NOT EXISTS patient_medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    dentist_id UUID REFERENCES dentists(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    
    -- Diagnostic si tratament
    diagnosis TEXT,
    treatment TEXT,
    notes TEXT,
    prescriptions TEXT[],
    
    -- Fisiere atasate
    attachments JSONB DEFAULT '[]'::jsonb, -- [{name, url, type, uploaded_at}]
    
    -- Dinti tratati
    treated_teeth INTEGER[], -- [11, 12, 21] - coduri FDI
    
    -- Costuri
    treatment_cost DECIMAL(10,2),
    materials_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    
    -- Status tratament
    treatment_status VARCHAR(50) DEFAULT 'completed', -- 'planned', 'in_progress', 'completed', 'cancelled'
    follow_up_needed BOOLEAN DEFAULT false,
    follow_up_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON patient_medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_dentist ON patient_medical_records(dentist_id);

-- 4. TABEL: Istoric medical general pacient
CREATE TABLE IF NOT EXISTS patient_health_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Alergii si contraindicatii
    allergies TEXT[],
    chronic_conditions TEXT[], -- diabet, hipertensiune, etc
    current_medications TEXT[],
    
    -- Istoric stomatologic
    previous_treatments TEXT[],
    dental_anxieties TEXT,
    
    -- Date importante
    last_xray_date DATE,
    blood_type VARCHAR(5),
    
    -- Contact urgent
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    
    updated_by UUID REFERENCES dentists(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_patient_health UNIQUE (patient_id)
);

-- 5. TABEL: Recenzii pacienti pentru dentisti
CREATE TABLE IF NOT EXISTS dentist_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dentist_id UUID REFERENCES dentists(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    
    -- Moderare
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES dentists(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_review_per_appointment UNIQUE (appointment_id)
);

-- 6. TABEL: Zile libere/concedii dentisti
CREATE TABLE IF NOT EXISTS dentist_leave_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dentist_id UUID REFERENCES dentists(id) ON DELETE CASCADE,
    
    leave_date DATE NOT NULL,
    leave_type VARCHAR(50) DEFAULT 'vacation', -- 'vacation', 'sick', 'training', 'other'
    reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_days_dentist ON dentist_leave_days(dentist_id, leave_date);

-- 7. VIEW: Programari cu detalii complete pentru dentist
CREATE OR REPLACE VIEW dentist_appointments_view AS
SELECT 
    a.*,
    d.first_name as dentist_first_name,
    d.last_name as dentist_last_name,
    d.email as dentist_email,
    d.specialization,
    d.color_code as dentist_color,
    p.first_name as patient_first_name,
    p.last_name as patient_last_name,
    p.phone as patient_phone,
    p.total_appointments as patient_total_visits,
    mr.diagnosis as last_diagnosis,
    mr.treatment as last_treatment,
    mr.treatment_status
FROM appointments a
LEFT JOIN dentists d ON a.dentist_id = d.id
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN LATERAL (
    SELECT * FROM patient_medical_records 
    WHERE patient_id = a.patient_id 
    ORDER BY created_at DESC 
    LIMIT 1
) mr ON true;

-- 8. FUNCTIE: Obtine dentisti activi pentru booking
CREATE OR REPLACE FUNCTION get_available_dentists(p_date DATE)
RETURNS TABLE (
    id UUID,
    first_name VARCHAR,
    last_name VARCHAR,
    full_name TEXT,
    specialization VARCHAR,
    bio TEXT,
    avatar_url TEXT,
    color_code VARCHAR,
    rating_avg NUMERIC,
    total_reviews BIGINT,
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.first_name,
        d.last_name,
        d.first_name || ' ' || d.last_name as full_name,
        d.specialization,
        d.bio,
        d.avatar_url,
        d.color_code,
        COALESCE(AVG(dr.rating), 0) as rating_avg,
        COUNT(dr.id) as total_reviews,
        -- Verificam daca dentistul are concediu in ziua respectiva
        NOT EXISTS (
            SELECT 1 FROM dentist_leave_days ld 
            WHERE ld.dentist_id = d.id AND ld.leave_date = p_date
        ) as is_available
    FROM dentists d
    LEFT JOIN dentist_reviews dr ON d.id = dr.dentist_id AND dr.is_approved = true
    WHERE d.is_active = true
    GROUP BY d.id
    ORDER BY d.first_name, d.last_name;
END;
$$ LANGUAGE plpgsql;

-- 9. FUNCTIE: Obtine programul zilei pentru un dentist
CREATE OR REPLACE FUNCTION get_dentist_day_schedule(p_dentist_id UUID, p_date DATE)
RETURNS TABLE (
    slot_time TIME,
    is_available BOOLEAN,
    appointment_id UUID,
    patient_name VARCHAR,
    service VARCHAR,
    status VARCHAR
) AS $$
DECLARE
    v_start_time TIME;
    v_end_time TIME;
    v_slot_interval INTERVAL;
    v_day_name TEXT;
BEGIN
    -- Obtinem programul dentistului pentru ziua respectiva
    v_day_name := lower(to_char(p_date, 'day'));
    
    SELECT 
        (default_schedule->v_day_name->>'start')::TIME,
        (default_schedule->v_day_name->>'end')::TIME
    INTO v_start_time, v_end_time
    FROM dentists
    WHERE id = p_dentist_id;
    
    -- Interval implicit 60 minute daca nu e setat
    v_slot_interval := '60 minutes'::INTERVAL;
    
    RETURN QUERY
    WITH time_slots AS (
        SELECT generate_series(
            p_date + v_start_time,
            p_date + v_end_time - v_slot_interval,
            v_slot_interval
        )::TIME as slot_time
    )
    SELECT 
        ts.slot_time,
        NOT EXISTS (
            SELECT 1 FROM appointments a 
            WHERE a.dentist_id = p_dentist_id 
            AND a.appointment_date = p_date
            AND a.appointment_time = ts.slot_time
            AND a.status NOT IN ('cancelled', 'no_show')
        ) as is_available,
        a.id as appointment_id,
        a.name::VARCHAR as patient_name,
        a.service,
        a.status
    FROM time_slots ts
    LEFT JOIN appointments a ON a.dentist_id = p_dentist_id 
        AND a.appointment_date = p_date 
        AND a.appointment_time = ts.slot_time
    ORDER BY ts.slot_time;
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger pentru updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dentists_updated_at
    BEFORE UPDATE ON dentists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at
    BEFORE UPDATE ON patient_medical_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 11. Date test (doar pentru dezvoltare)
-- Inseram cativa dentisti de test
INSERT INTO dentists (email, first_name, last_name, phone, specialization, bio, years_experience, color_code, is_active)
VALUES 
    ('dr.ionescu@dentcare.ro', 'Andrei', 'Ionescu', '0722333444', 'Stomatologie generala', 'Dr. Andrei Ionescu are peste 10 ani de experienta in stomatologie generala si estetica dentara.', 12, '#3B82F6', true),
    ('dr.popescu@dentcare.ro', 'Maria', 'Popescu', '0722555666', 'Ortodontie', 'Specialist in ortodontie cu focus pe aparate invizibile Invisalign.', 8, '#10B981', true),
    ('dr.marinescu@dentcare.ro', 'Cristian', 'Marinescu', '0722777888', 'Chirurgie orala, Implantologie', 'Expert in implantologie si chirurgie orală.', 15, '#F59E0B', true)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- MIGRARE FINALIZATA
-- ============================================
