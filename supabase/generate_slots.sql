-- Generează sloturi pentru următoarele 30 de zile
-- Rulează asta în SQL Editor din Supabase

INSERT INTO appointment_slots (slot_date, slot_time, status)
SELECT 
    CURRENT_DATE + i AS slot_date,
    t.slot_time::TIME AS slot_time,
    'available' AS status
FROM generate_series(0, 30) AS i
CROSS JOIN (
    VALUES 
        ('09:00'),
        ('10:00'),
        ('11:00'),
        ('12:00'),
        ('14:00'),
        ('15:00'),
        ('16:00'),
        ('17:00')
) AS t(slot_time)
WHERE (CURRENT_DATE + i) NOT IN (
    SELECT slot_date FROM appointment_slots WHERE slot_date = CURRENT_DATE + i
)
ON CONFLICT (slot_date, slot_time) DO NOTHING;

-- Verifică câte sloturi avem
SELECT slot_date, COUNT(*) as numar_sloturi 
FROM appointment_slots 
WHERE slot_date >= CURRENT_DATE 
GROUP BY slot_date 
ORDER BY slot_date;
