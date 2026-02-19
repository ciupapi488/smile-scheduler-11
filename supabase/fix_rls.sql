-- ============================================
-- FIX RLS - Permite inserarea programărilor
-- ============================================

-- Dezactivăm RLS temporar pentru a putea modifica politicile
ALTER TABLE appointment_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

-- Re-activăm RLS
ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Ștergem toate politicile existente (pentru curățenie)
DROP POLICY IF EXISTS "Select sloturi" ON appointment_slots;
DROP POLICY IF EXISTS "Insert sloturi" ON appointment_slots;
DROP POLICY IF EXISTS "Update sloturi" ON appointment_slots;
DROP POLICY IF EXISTS "Delete sloturi" ON appointment_slots;

DROP POLICY IF EXISTS "Select programari" ON appointments;
DROP POLICY IF EXISTS "Insert programari" ON appointments;
DROP POLICY IF EXISTS "Update programari" ON appointments;
DROP POLICY IF EXISTS "Delete programari" ON appointments;

-- ============================================
-- POLITICI PENTRU appointment_slots
-- ============================================

-- Toată lumea poate vedea sloturile
CREATE POLICY "Select sloturi" 
ON appointment_slots 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Toată lumea poate insera sloturi (pentru a crea sloturi noi)
CREATE POLICY "Insert sloturi" 
ON appointment_slots 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Toată lumea poate actualiza sloturile (pentru a rezerva)
CREATE POLICY "Update sloturi" 
ON appointment_slots 
FOR UPDATE 
TO anon, authenticated 
USING (true);

-- ============================================
-- POLITICI PENTRU appointments
-- ============================================

-- Toată lumea poate vedea programările
CREATE POLICY "Select programari" 
ON appointments 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Toată lumea poate crea programări (AICI ERA PROBLEMA!)
CREATE POLICY "Insert programari" 
ON appointments 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- ============================================
-- VERIFICARE
-- ============================================
SELECT 'appointment_slots policies:' as info;
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'appointment_slots';

SELECT 'appointments policies:' as info;
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'appointments';

-- GATA! ✅
