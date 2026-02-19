-- ============================================
-- MIGRARE: Phase 1 - Admin Dashboard Foundation
-- Data: 2026-02-18
-- Descriere: Extinde schema pentru dashboard admin,
-- management programări, servicii și program de lucru
-- ============================================

-- ============================================
-- 1. EXTINDERE TABELA APPOINTMENTS
-- ============================================

-- Statusuri programare
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed' 
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show'));

-- Notițe doctor (private)
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes TEXT;

-- Durata serviciului în minute
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;

-- Preț estimat
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);

-- Status plată
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' 
  CHECK (payment_status IN ('unpaid', 'partial', 'paid'));

-- Cine a creat programarea
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'patient_online' 
  CHECK (created_by IN ('patient_online', 'admin_manual', 'phone'));

-- Motiv anulare
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Reminder trimis
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- ID pacient (foreign key - creat mai jos)
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_id UUID;

-- ============================================
-- 2. TABELA PACIENȚI (CRM Light)
-- ============================================

CREATE TABLE IF NOT EXISTS patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Date personale
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    date_of_birth DATE,
    cnp TEXT,
    
    -- Adresă
    address TEXT,
    city TEXT,
    
    -- Date medicale (simplificat)
    allergies TEXT,
    medical_notes TEXT,
    
    -- Statistici auto-generate
    total_appointments INTEGER DEFAULT 0,
    no_show_count INTEGER DEFAULT 0,
    last_visit DATE,
    total_spent DECIMAL(10,2) DEFAULT 0,
    
    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pentru căutare rapidă
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_patients_created ON patients(created_at);

-- Trigger updated_at pentru patients
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Adăugare foreign key la appointments
ALTER TABLE appointments 
  ADD CONSTRAINT fk_appointments_patient 
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- ============================================
-- 3. TABELA SERVICII
-- ============================================

CREATE TABLE IF NOT EXISTS services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    base_price DECIMAL(10,2),
    color TEXT DEFAULT '#007bff',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_sort ON services(sort_order);

-- Trigger updated_at pentru services
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserare servicii implicite
INSERT INTO services (name, description, duration_minutes, base_price, color, sort_order) VALUES
    ('Consultație', 'Consultație stomatologică generală', 30, 150.00, '#007bff', 1),
    ('Detartraj', 'Curățare profesională a dinților', 45, 200.00, '#28a745', 2),
    ('Plombă', 'Tratament carie și plombare', 45, 250.00, '#ffc107', 3),
    ('Extracție', 'Extracție dentară', 60, 300.00, '#dc3545', 4),
    ('Albire dentară', 'Procedură de albire profesională', 90, 800.00, '#6f42c1', 5),
    ('Tratament canal', 'Tratament endodontic', 90, 500.00, '#fd7e14', 6),
    ('Coroană dentară', 'Protezare cu coroană', 60, 1200.00, '#20c997', 7),
    ('Implant dentar', 'Inserare implant', 90, 2500.00, '#6c757d', 8)
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. TABELA PROGRAM DE LUCRU
-- ============================================

CREATE TABLE IF NOT EXISTS working_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    is_working BOOLEAN DEFAULT TRUE,
    start_time TIME NOT NULL DEFAULT '09:00',
    end_time TIME NOT NULL DEFAULT '17:00',
    break_start TIME DEFAULT '12:00',
    break_end TIME DEFAULT '14:00',
    slot_duration INTEGER DEFAULT 60,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(day_of_week)
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_working_schedules_updated_at ON working_schedules;
CREATE TRIGGER update_working_schedules_updated_at
    BEFORE UPDATE ON working_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Populare zile implicite (Luni-Vineri 09:00-17:00, Sâmb-Dum închis)
INSERT INTO working_schedules (day_of_week, is_working, start_time, end_time, break_start, break_end, slot_duration) VALUES
    (1, true, '09:00', '17:00', '12:00', '14:00', 60),
    (2, true, '09:00', '17:00', '12:00', '14:00', 60),
    (3, true, '09:00', '17:00', '12:00', '14:00', 60),
    (4, true, '09:00', '17:00', '12:00', '14:00', 60),
    (5, true, '09:00', '17:00', '12:00', '14:00', 60),
    (6, false, '09:00', '17:00', '12:00', '14:00', 60),
    (0, false, '09:00', '17:00', '12:00', '14:00', 60)
ON CONFLICT (day_of_week) DO NOTHING;

-- ============================================
-- 5. TABELA ZILE EXCEPȚIE (concedii, sărbători)
-- ============================================

CREATE TABLE IF NOT EXISTS exception_days (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exception_date DATE NOT NULL UNIQUE,
    type TEXT CHECK (type IN ('holiday', 'vacation', 'special_hours')),
    is_working BOOLEAN DEFAULT FALSE,
    start_time TIME,
    end_time TIME,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exception_days_date ON exception_days(exception_date);

-- ============================================
-- 6. TABELA AUDIT LOGS (GDPR & Securitate)
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('view', 'create', 'update', 'delete', 'export', 'login', 'logout')),
    table_name TEXT,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- ============================================
-- 7. TABELA EMAIL TEMPLATES
-- ============================================

CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_key TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. RLS POLICIES PENTRU TABELE NOI
-- ============================================

-- Patients: Admin poate tot, pacientul doar propriul profil
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access patients" ON patients;
CREATE POLICY "Admin full access patients" ON patients
    USING (true)
    WITH CHECK (true);

-- Services: Toți pot vedea, doar admin poate modifica
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vizualizare servicii active" ON services;
CREATE POLICY "Vizualizare servicii active" ON services
    FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Admin full access services" ON services;
CREATE POLICY "Admin full access services" ON services
    USING (true)
    WITH CHECK (true);

-- Working schedules: Toți pot vedea, admin poate modifica
ALTER TABLE working_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vizualizare program lucru" ON working_schedules;
CREATE POLICY "Vizualizare program lucru" ON working_schedules
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admin edit program lucru" ON working_schedules;
CREATE POLICY "Admin edit program lucru" ON working_schedules
    USING (true)
    WITH CHECK (true);

-- Exception days
ALTER TABLE exception_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vizualizare zile exceptie" ON exception_days;
CREATE POLICY "Vizualizare zile exceptie" ON exception_days
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admin edit zile exceptie" ON exception_days;
CREATE POLICY "Admin edit zile exceptie" ON exception_days
    USING (true)
    WITH CHECK (true);

-- Audit logs: Doar admin
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin view audit logs" ON audit_logs;
CREATE POLICY "Admin view audit logs" ON audit_logs
    FOR SELECT
    USING (true);

-- Email templates: Doar admin
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access email templates" ON email_templates;
CREATE POLICY "Admin full access email templates" ON email_templates
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 9. FUNCȚII HELPER PENTRU DASHBOARD
-- ============================================

-- Funcție: Statistici programări pentru dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_today_count INTEGER;
    v_tomorrow_count INTEGER;
    v_week_count INTEGER;
    v_month_count INTEGER;
    v_new_patients INTEGER;
    v_total_revenue DECIMAL;
BEGIN
    -- Programări azi
    SELECT COUNT(*) INTO v_today_count
    FROM appointments
    WHERE appointment_date = p_date
      AND status NOT IN ('cancelled');
    
    -- Programări mâine
    SELECT COUNT(*) INTO v_tomorrow_count
    FROM appointments
    WHERE appointment_date = p_date + 1
      AND status NOT IN ('cancelled');
    
    -- Programări săptămâna aceasta
    SELECT COUNT(*) INTO v_week_count
    FROM appointments
    WHERE appointment_date >= DATE_TRUNC('week', p_date)
      AND appointment_date < DATE_TRUNC('week', p_date) + INTERVAL '7 days'
      AND status NOT IN ('cancelled');
    
    -- Programări luna aceasta
    SELECT COUNT(*) INTO v_month_count
    FROM appointments
    WHERE appointment_date >= DATE_TRUNC('month', p_date)
      AND appointment_date < DATE_TRUNC('month', p_date) + INTERVAL '1 month'
      AND status NOT IN ('cancelled');
    
    -- Pacienți noi (luna curentă)
    SELECT COUNT(*) INTO v_new_patients
    FROM patients
    WHERE created_at >= DATE_TRUNC('month', p_date);
    
    -- Venituri estimate luna curentă
    SELECT COALESCE(SUM(price), 0) INTO v_total_revenue
    FROM appointments
    WHERE appointment_date >= DATE_TRUNC('month', p_date)
      AND appointment_date < DATE_TRUNC('month', p_date) + INTERVAL '1 month'
      AND status = 'completed';
    
    RETURN jsonb_build_object(
        'today_count', v_today_count,
        'tomorrow_count', v_tomorrow_count,
        'week_count', v_week_count,
        'month_count', v_month_count,
        'new_patients', v_new_patients,
        'month_revenue', v_total_revenue,
        'date', p_date
    );
END;
$$ LANGUAGE plpgsql;

-- Funcție: Sloturi disponibile bazate pe program de lucru
CREATE OR REPLACE FUNCTION get_available_slots_for_date(p_date DATE)
RETURNS TABLE(slot_time TIME, is_available BOOLEAN) AS $$
DECLARE
    v_day_of_week INTEGER;
    v_is_exception BOOLEAN;
    v_exception_working BOOLEAN;
    v_work_start TIME;
    v_work_end TIME;
    v_break_start TIME;
    v_break_end TIME;
    v_slot_duration INTEGER;
    v_current_time TIME;
BEGIN
    v_day_of_week := EXTRACT(DOW FROM p_date);
    
    -- Verificăm dacă există excepție pentru data respectivă
    SELECT TRUE, is_working, start_time, end_time 
    INTO v_is_exception, v_exception_working, v_work_start, v_work_end
    FROM exception_days
    WHERE exception_date = p_date;
    
    -- Dacă există excepție și nu se lucrează, returnăm gol
    IF v_is_exception AND NOT v_exception_working THEN
        RETURN;
    END IF;
    
    -- Dacă există excepție cu ore speciale, folosim acele ore
    IF v_is_exception THEN
        v_break_start := NULL;
        v_break_end := NULL;
        v_slot_duration := 60;
    ELSE
        -- Altfel luăm programul normal
        SELECT start_time, end_time, break_start, break_end, slot_duration
        INTO v_work_start, v_work_end, v_break_start, v_break_end, v_slot_duration
        FROM working_schedules
        WHERE day_of_week = v_day_of_week AND is_working = TRUE;
        
        -- Dacă nu se lucrează în ziua respectivă
        IF v_work_start IS NULL THEN
            RETURN;
        END IF;
    END IF;
    
    -- Generăm sloturile
    v_current_time := v_work_start;
    
    WHILE v_current_time <= v_work_end LOOP
        -- Sărim peste pauză
        IF v_break_start IS NOT NULL AND v_break_end IS NOT NULL THEN
            IF v_current_time >= v_break_start AND v_current_time < v_break_end THEN
                v_current_time := v_break_end;
                CONTINUE;
            END IF;
        END IF;
        
        -- Verificăm dacă slotul e disponibil
        slot_time := v_current_time;
        is_available := NOT EXISTS (
            SELECT 1 FROM appointment_slots
            WHERE slot_date = p_date
              AND slot_time = v_current_time
              AND status = 'booked'
        );
        
        RETURN NEXT;
        
        v_current_time := v_current_time + (v_slot_duration || ' minutes')::INTERVAL;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. ACTUALIZARE REALTIME PUBLICATION
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE patients;
ALTER PUBLICATION supabase_realtime ADD TABLE services;
ALTER PUBLICATION supabase_realtime ADD TABLE working_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE exception_days;

-- ============================================
-- SFÂRȘIT MIGRARE
-- ============================================
