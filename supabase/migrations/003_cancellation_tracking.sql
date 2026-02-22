-- ============================================
-- MIGRARE: Tracking anulări pacienți
-- ============================================

-- Tabel pentru numărarea anulărilor per pacient
CREATE TABLE IF NOT EXISTS patient_cancellations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    count INTEGER DEFAULT 0,
    last_cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pentru căutare rapidă după email
CREATE INDEX IF NOT EXISTS idx_patient_cancellations_email ON patient_cancellations(email);

-- Trigger pentru actualizare automată updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_patient_cancellations_updated_at ON patient_cancellations;
CREATE TRIGGER update_patient_cancellations_updated_at
    BEFORE UPDATE ON patient_cancellations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Politici RLS (Row Level Security)
ALTER TABLE patient_cancellations ENABLE ROW LEVEL SECURITY;

-- Permite citire/scriere pentru toți utilizatorii autentificați (simplificat)
DROP POLICY IF EXISTS patient_cancellations_all ON patient_cancellations;
CREATE POLICY patient_cancellations_all ON patient_cancellations
    FOR ALL USING (true);
