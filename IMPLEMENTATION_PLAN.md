# 📋 Plan Complet de Implementare - Platformă Programări Stomatologice

> **Versiune:** 1.0  
> **Data:** 18 Februarie 2026  
> **Status:** Draft pentru aprobare

---

## 🎯 Scopul Documentului

Acest document prezintă planul complet de transformare a sistemului actual de programări stomatologice într-o **platformă comercială SaaS** (Software as a Service) care poate fi vândută cabinetelor stomatologice.

---

## 📊 Stadiul Actual al Proiectului

### ✅ Funcționalități Existente

| Modul | Funcționalitate | Status |
|-------|----------------|--------|
| **Frontend** | React + TypeScript + Vite | ✅ Implementat |
| **UI/UX** | shadcn/ui + Tailwind CSS | ✅ Implementat |
| **Backend** | Express.js + Node.js | ✅ Implementat |
| **Bază de Date** | Supabase PostgreSQL | ✅ Implementat |
| **Autentificare** | Supabase Auth | ✅ Implementat |
| **Roluri** | Admin/User detection | ✅ Implementat |
| **Programări** | Formular online cu selecție dată/oră | ✅ Implementat |
| **Disponibilitate** | Sloturi în timp real (3 sec refresh) | ✅ Implementat |
| **Securitate** | Protecție race-condition (PostgreSQL unique constraint) | ✅ Implementat |
| **Email** | Confirmare programare (Gmail SMTP) | ✅ Implementat |
| **Admin** | Vizualizare programări (tabel simplu) | ⚠️ Parțial |

### ❌ Funcționalități Lipsă pentru Platformă Comercială

- [ ] Dashboard administrativ cu statistici
- [ ] Management complet CRUD al programărilor
- [ ] Sistem de servicii și prețuri configurabil
- [ ] Program de lucru configurabil (ore, pauze, zile libere)
- [ ] Management pacienți (CRM light)
- [ ] Sistem de notificări multiple (reminder, confirmări)
- [ ] Anulare/reprogramare programări
- [ ] Securitate GDPR compliance
- [ ] Multi-tenancy (mai mulți doctori/clinici)
- [ ] Sistem de facturare și abonamente

---

## 🗺️ Faze de Implementare

### **Faza 1: Fundația Administrativă** ⭐ CRITICĂ
**Durată estimată:** 2-3 săptămâni  
**Prioritate:** FĂRĂ ACEASTĂ FAZĂ, PLATFORMA NU POATE FI VÂNDUTĂ

#### 1.1 Dashboard Admin Complet

**Structură fișiere noi:**
```
src/pages/admin/
├── Dashboard.tsx           # Overview cu statistici
├── Appointments.tsx        # Management programări
├── Patients.tsx            # Listă pacienți
├── Services.tsx            # Configurare servicii
├── Schedule.tsx            # Program de lucru
└── Settings.tsx            # Setări cabinet
```

**Funcționalități Dashboard Overview:**
- [ ] Card-uri statistice:
  - Programări azi / mâine
  - Venituri estimate (zi / săptămână / lună)
  - Pacienți noi vs. recurenți
  - Rata de anulare
- [ ] Grafic sloturi ocupate/libere (Recharts)
- [ ] Listă programări azi cu acțiuni rapide
- [ ] Alertă programări noi (notificare sonoră + badge)

#### 1.2 Management Programări (CRUD Complet)

**Extindere Schema Bază de Date:**

```sql
-- Alterări tabela appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed' 
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show'));

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' 
  CHECK (payment_status IN ('unpaid', 'partial', 'paid'));

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'patient_online' 
  CHECK (created_by IN ('patient_online', 'admin_manual', 'phone'));

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
```

**Acțiuni disponibile în Admin:**

| Acțiune | Descriere | Notificare Pacient |
|---------|-----------|-------------------|
| ✅ Confirmare | Marchează programarea ca confirmată | Email confirmare |
| ✏️ Editare | Modifică nume, telefon, serviciu | Email actualizare |
| 🔄 Reprogramare | Schimbă data/ora | Email noua programare |
| ❌ Anulare | Anulează cu motiv | Email anulare |
| 📋 Prezent | Marchează pacientul ca prezent | - |
| 📝 Notițe | Adaugă notițe private (doar admin) | - |

#### 1.3 Configurare Program de Lucru

**Tabelă nouă `working_schedules`:**

```sql
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

-- Populare zile implicite
INSERT INTO working_schedules (day_of_week, is_working, start_time, end_time) VALUES
    (1, true, '09:00', '17:00'), -- Luni
    (2, true, '09:00', '17:00'), -- Marți
    (3, true, '09:00', '17:00'), -- Miercuri
    (4, true, '09:00', '17:00'), -- Joi
    (5, true, '09:00', '17:00'), -- Vineri
    (6, false, '00:00', '00:00'), -- Sâmbătă
    (0, false, '00:00', '00:00')  -- Duminică
ON CONFLICT (day_of_week) DO NOTHING;
```

**Tabelă `exception_days` (zile libere, concedii):**

```sql
CREATE TABLE IF NOT EXISTS exception_days (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exception_date DATE NOT NULL UNIQUE,
    type TEXT CHECK (type IN ('holiday', 'vacation', 'special_hours')),
    is_working BOOLEAN DEFAULT FALSE,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Impact pe frontend:**
- Formularul de programare va lua în considerare programul de lucru configurat
- Sloturile generate dinamic în funcție de orele de lucru și pauze

---

### **Faza 2: Sistem de Servicii și Prețuri**
**Durată estimată:** 1 săptămână

#### 2.1 Management Servicii

**Tabelă `services`:**

```sql
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

-- Servicii implicite
INSERT INTO services (name, description, duration_minutes, base_price, color, sort_order) VALUES
    ('Consultație', 'Consultație stomatologică generală', 30, 150.00, '#007bff', 1),
    ('Detartraj', 'Curățare profesională a dinților', 45, 200.00, '#28a745', 2),
    ('Plombă', 'Tratament carie și plombare', 45, 250.00, '#ffc107', 3),
    ('Extracție', 'Extracție dentară', 60, 300.00, '#dc3545', 4),
    ('Albire dentară', 'Procedură de albire profesională', 90, 800.00, '#6f42c1', 5),
    ('Tratament canal', 'Tratament endodontic', 90, 500.00, '#fd7e14', 6)
ON CONFLICT DO NOTHING;
```

**Funcționalități:**
- [ ] CRUD complet servicii în admin
- [ ] Setare durată (afectează sloturile disponibile)
- [ ] Setare preț (estimativ, afișat pacientului)
- [ ] Cod culoare pentru identificare vizuală în calendar
- [ ] Ordine sortare personalizabilă

#### 2.2 Actualizare Formular Programare

**Modificări:**
- Dropdown dinamic cu serviciile configurate
- Afișare preț estimat înainte de confirmare
- Durata slotului se ajustează automat (ex: serviciu 90 min = 2 sloturi consecutive)
- Validare disponibilitate în funcție de durată

---

### **Faza 3: Sistem de Notificări Avansat**
**Durată estimată:** 1-2 săptămâni

#### 3.1 Email-uri Automate

**Tabelă `email_templates`:**

```sql
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_key TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Template-uri implicite
INSERT INTO email_templates (template_key, subject, html_body) VALUES
('booking_confirmation', 
 'Confirmare Programare - Cabinet Stomatologic', 
 '<html>...</html>'),
('booking_reminder_24h', 
 'Reminder: Programare mâine', 
 '<html>...</html>'),
('booking_reminder_1h', 
 'Reminder: Programare în 1 oră', 
 '<html>...</html>'),
('booking_cancellation', 
 'Programare anulată', 
 '<html>...</html>'),
('booking_reschedule', 
 'Programare reprogramată', 
 '<html>...</html>');
```

**Tipuri de email-uri:**

| Tip | Trigger | Conținut |
|-----|---------|----------|
| **Confirmare** | După programare | Detalii + buton "Adaugă în Calendar" (.ics) |
| **Reminder 24h** | Cu 24h înainte | Reamintire + link anulare rapidă |
| **Reminder 1h** | Cu 1h înainte | Ultimă reamintire + adresă cabinet |
| **Reprogramare** | După modificare | Noua dată/oră + confirmare |
| **Anulare** | După anulare | Confirmare + scuze + link reprogramare |
| **Recenzie** | 24h după vizită | Link recenzie Google/Facebook |
| **Aniversare** | Ziua de naștere pacient | Ofertă specială/Felicitare |

#### 3.2 Notificări SMS (Opțional - Phase 3.5)

**Provider recomandat:** SMSLink, Twilio, Vonage

**SMS-uri:**
- Reminder 24h: "Reminder: Aveți programare mâine la ora 10:00 la Cabinetul Dr. X. Pentru anulare, sunați la 0722XXX"
- Confirmare anulare

#### 3.3 Notificări Real-time Admin

**Implementare:**
- Badge "Programări noi" în navbar
- Notificare sonoră la programare nouă
- Toast notification pentru acțiuni pacient (confirmare/anulare)

---

### **Faza 4: Management Pacienți (CRM Light)**
**Durată estimată:** 1-2 săptămâni

#### 4.1 Extindere Tabela Pacienți

```sql
-- Alterări tabela appointments pentru a separa pacienții
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
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
```

#### 4.2 Funcționalități Pacienți

**Pagină Pacienți Admin:**
- [ ] Listă cu paginare și căutare (nume, telefon, email)
- [ ] Filtrare: toți / pacienți fideli / cu restanțe
- [ ] Card profil pacient:
  - Date personale + istoric vizite
  - Statistici: total programări, bani cheltuiți
  - Notițe medicale (vizibile doar admin)
- [ ] Etichete: "VIP", "Copil", "Restanțier", "Alergic la X"
- [ ] Buton "Programează rapid" din profil

#### 4.3 Auto-creare Pacient

La fiecare programare nouă:
1. Caută pacient după email/telefon
2. Dacă există, actualizează datele și incrementează counter
3. Dacă nu există, creează profil nou

---

### **Faza 5: Securitate și GDPR Compliance**
**Durată estimată:** 1 săptămână

#### 5.1 Audit Logging

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL CHECK (action IN ('view', 'create', 'update', 'delete', 'export', 'login', 'logout')),
    table_name TEXT,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

**Loghează:**
- Toate acțiunile pe date pacient (view, edit, delete)
- Logări/ieșiri din sistem
- Exporturi de date
- Modificări setări sistem

#### 5.2 Consimțământ Pacient

```sql
CREATE TABLE IF NOT EXISTS patient_consents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    consent_type TEXT CHECK (consent_type IN ('data_processing', 'marketing', 'medical_records')),
    granted BOOLEAN DEFAULT FALSE,
    granted_at TIMESTAMPTZ,
    ip_address INET,
    document_version TEXT DEFAULT '1.0'
);
```

#### 5.3 Implementări GDPR

**Pagini necesare:**
- [ ] `/privacy-policy` - Politică de confidențialitate detaliată
- [ ] `/terms` - Termeni și condiții
- [ ] `/gdpr` - Drepturile utilizatorului

**Funcționalități:**
- [ ] Checkbox consimțământ obligatoriu în formular programare
- [ ] Link "Descarcă datele mele" (export JSON/PDF)
- [ ] Link "Șterge contul" (Right to be forgotten)
- [ ] Anonizare date după X ani (configurabil)

#### 5.4 Securitate Adițională

- [ ] Rate limiting: max 5 încercări login / minut
- [ ] Rate limiting: max 10 programări / IP / oră
- [ ] Validare input avansată (XSS protection)
- [ ] Password policy: min 8 caractere, 1 majusculă, 1 cifră
- [ ] 2FA opțional pentru admin
- [ ] Session timeout după 30 minute inactivitate

---

### **Faza 6: Utilizator Final (Pacient) - Îmbunătățiri**
**Durată estimată:** 1 săptămână

#### 6.1 Cont Pacient

**Structură pagini:**
```
src/pages/patient/
├── Login.tsx
├── Register.tsx
├── Dashboard.tsx           # Programările mele
├── Profile.tsx             # Profil + istoric medical
├── AppointmentDetails.tsx  # Detalii programare
└── NewAppointment.tsx      # Programare nouă
```

**Funcționalități Dashboard Pacient:**
- [ ] Lista programări active (card-uri cu status)
- [ ] Istoric programări trecute
- [ ] Buton "Anulează" (cu limită de timp - ex: cu 4h înainte)
- [ ] Buton "Reprogramează"
- [ ] Buton "Adaugă în Calendar" (download .ics)
- [ ] Editare date personale

#### 6.2 Îmbunătățiri UX/UI

- [ ] Design modern, profesional (stomatologic)
- [ ] Dark mode
- [ ] Animations și micro-interacțiuni
- [ ] Accessibility: WCAG 2.1 AA compliance
- [ ] PWA (Progressive Web App):
  - Instalabil pe Android/iOS
  - Offline capability (vizualizare programări)
  - Push notifications

---

### **Faza 7: Multi-Tenancy (Scalare)**
**Durată estimată:** 2-3 săptămâni

#### 7.1 Arhitectură Multi-Tenant

**Tabelă `clinics`:**

```sql
CREATE TABLE IF NOT EXISTS clinics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Identificare
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    
    -- Branding
    logo_url TEXT,
    primary_color TEXT DEFAULT '#007bff',
    favicon_url TEXT,
    
    -- Contact
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    
    -- Setări
    timezone TEXT DEFAULT 'Europe/Bucharest',
    currency TEXT DEFAULT 'RON',
    language TEXT DEFAULT 'ro',
    
    -- Abonament
    subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'pro')),
    subscription_expires_at TIMESTAMPTZ,
    max_doctors INTEGER DEFAULT 1,
    
    -- Limite
    max_appointments_per_month INTEGER DEFAULT 50,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabelă de legătură utilizatori-clinică
CREATE TABLE IF NOT EXISTS clinic_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'doctor' CHECK (role IN ('owner', 'admin', 'doctor', 'assistant')),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clinic_id, user_id)
);
```

#### 7.2 Izolare Date

**Modificări RLS policies:**

```sql
-- Exemplu pentru appointment_slots
ALTER TABLE appointment_slots ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id);

DROP POLICY IF EXISTS "Vizualizare sloturi disponibile" ON appointment_slots;
CREATE POLICY "Vizualizare sloturi disponibile" ON appointment_slots
    FOR SELECT USING (clinic_id = current_setting('app.current_clinic')::UUID);
```

#### 7.3 Routing și Branding

**Opțiuni:**
1. **Subdomenii:** `dr-popescu.dentistapp.ro`
2. **Path-based:** `dentistapp.ro/c/dr-popescu`
3. **Custom domain:** `programari.drpopescu.ro` (CNAME)

**Branding per clinică:**
- Logo personalizat
- Culoare temă
- Email templates cu branding
- URL public personalizat

---

### **Faza 8: Facturare și Abonamente**
**Durată estimată:** 2 săptămâni

#### 8.1 Planuri de Preț

| Plan | Preț/lună | Programări | Doctori | Funcționalități |
|------|-----------|------------|---------|-----------------|
| **Free** | 0 RON | 50/lună | 1 | Branding platformă, funcții de bază |
| **Basic** | 99 RON | Nelimitat | 2 | Branding propriu, rapoarte de bază |
| **Pro** | 199 RON | Nelimitat | 5 | SMS, API, rapoarte avansate, support prioritar |
| **Enterprise** | Custom | Nelimitat | Nelimitat | SLA, dedicated support, custom dev |

#### 8.2 Integrare Plăți

**Provideri:**
- **Internațional:** Stripe
- **România:** Netopia, EuPlatesc, MobilPay

**Funcționalități:**
- [ ] Abonament recurent (lună/an)
- [ ] Upgrade/downgrade automat
- [ ] Trial 14 zile (Pro)
- [ ] Notificare 7 zile înainte de expirare
- [ ] Suspendare automată la neplată

#### 8.3 Facturare

**Tabelă `invoices`:**

```sql
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID REFERENCES clinics(id),
    invoice_number TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'RON',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
    paid_at TIMESTAMPTZ,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### **Faza 9: API și Integrări**
**Durată estimată:** 1-2 săptămâni

#### 9.1 API REST Public

**Endpoints:**

```yaml
/api/v1/appointments:
  get:
    summary: Listează programări
    parameters:
      - start_date
      - end_date
      - status
      - patient_id
  post:
    summary: Creează programare

/api/v1/patients:
  get:
    summary: Listează pacienți
  post:
    summary: Creează pacient
  get /{id}:
    summary: Detalii pacient

/api/v1/slots/available:
  get:
    summary: Sloturi disponibile pentru dată
    parameters:
      - date (required)
      - service_id (optional)
      - duration (optional)

/api/v1/services:
  get:
    summary: Lista servicii
```

**Autentificare API:** API Keys (per clinică)

#### 9.2 Integrări Third-Party

| Integrare | Utilitate | Dificultate |
|-----------|-----------|-------------|
| **Google Calendar** | Sync 2-way | Medie |
| **WhatsApp Business** | Notificări pacient | Medie |
| **Google Maps** | Locație + reviews | Ușoară |
| **Facebook Booking** | Programare direct din FB | Medie |
| **Google Analytics** | Tracking conversii | Ușoară |

---

### **Faza 10: Deployment și DevOps**
**Durată estimată:** 1 săptămână

#### 10.1 Arhitectură Infrastructură

```
┌─────────────────────────────────────────────┐
│         Cloudflare (CDN + DNS + SSL)        │
│         - DDoS protection                   │
│         - Edge caching                      │
└─────────────────┬───────────────────────────┘
                  ▼
┌─────────────────────────────────────────────┐
│         Vercel (Frontend)                   │
│         - Edge deployment                   │
│         - Preview deployments               │
└─────────────────┬───────────────────────────┘
                  ▼
┌─────────────────────────────────────────────┐
│         Railway / Render (Backend)          │
│         - Auto-deploy from Git              │
│         - Environment variables             │
└─────────────────┬───────────────────────────┘
                  ▼
┌─────────────────────────────────────────────┐
│         Supabase (PostgreSQL + Auth)        │
│         - Managed database                  │
│         - Real-time subscriptions           │
│         - Storage (fișiere, logo-uri)       │
└─────────────────────────────────────────────┘
```

#### 10.2 Monitoring și Logging

| Tool | Scop | Preț |
|------|------|------|
| **Sentry** | Error tracking | Free - 5k events/lună |
| **LogRocket** | Session replay | Free - 1k sessions/lună |
| **BetterUptime** | Uptime monitoring | Free - 10 monitors |
| **Plausible** | Privacy-focused analytics | 9 EUR/lună |

#### 10.3 Backup și Disaster Recovery

- [ ] Backup zilnic automat baza de date (Supabase Point-in-Time Recovery)
- [ ] Backup săptămânal export complet
- [ ] Runbook Disaster Recovery (timp recuperare < 1h)

---

## 📅 Timeline Implementare

### MVP Comercial (Vinde imediat) - Luna 1-2

| Sprint | Perioada | Deliverable |
|--------|----------|-------------|
| S1 | Săptămâna 1 | Dashboard admin, statistici de bază |
| S2 | Săptămâna 2 | CRUD programări complet, calendar vizual |
| S3 | Săptămâna 3 | Configurare servicii, program de lucru |
| S4 | Săptămâna 4 | Email-uri multiple, CRM pacienți basic |

**După S4:** Platforma poate fi vândută primului client!

### V1.0 Profesional - Luna 3

| Sprint | Perioada | Deliverable |
|--------|----------|-------------|
| S5 | Săptămâna 5-6 | Cont pacient, anulare/reprogramare online |
| S6 | Săptămâna 7-8 | GDPR compliance, audit logs, securitate |
| S7 | Săptămâna 9-10 | Rapoarte avansate, PWA, dark mode |

### V2.0 Scale - Luna 4-6

| Sprint | Perioada | Deliverable |
|--------|----------|-------------|
| S8-S9 | Luna 4 | Multi-tenancy, white-label |
| S10 | Luna 5 | Sistem abonamente și facturare |
| S11-S12 | Luna 6 | API public, integrări third-party |

---

## 💰 Model de Venit și Prețuri

### Prețuri Abonamente (România)

| Plan | Preț/lună | Preț/an | Target |
|------|-----------|---------|--------|
| **Starter** | 49 RON | 499 RON | Cabinete mici, 1 dentist |
| **Professional** | 149 RON | 1.499 RON | Cabinete medii, 2-3 dentiști |
| **Enterprise** | 299 RON | 2.999 RON | Clinici, multiple locații |

### Servicii Adiționale

| Serviciu | Preț | Descriere |
|----------|------|-----------|
| Setup inițial | 500-1.000 RON | Configurare completă, import date |
| Training | 200 RON/oră | Training personal admin |
| Custom development | 100 EUR/oră | Dezvoltări la cerere |
| Import date | 300-800 RON | Migrare din sistem existent |
| Support prioritar | 100 RON/lună | Răspuns < 4 ore |

### Proiecție Venituri (Anul 1)

| Luna | Clienți | Venit mediu/client | Venit total |
|------|---------|-------------------|-------------|
| 3 | 1 | 149 RON | 149 RON |
| 6 | 5 | 149 RON | 745 RON |
| 9 | 15 | 149 RON | 2.235 RON |
| 12 | 30 | 149 RON | 4.470 RON |

**Anul 1 total:** ~22.000 RON  
**Anul 2 proiecție:** 100.000+ RON (scalare națională)

---

## 🛠️ Stack Tehnologic Complet

### Core (Existent)
- **Frontend:** React 18, TypeScript 5, Vite 5
- **UI:** shadcn/ui, Tailwind CSS, Radix UI
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth
- **Real-time:** Supabase Realtime

### Adiții pentru V1.0
- **Charts:** Recharts / Tremor
- **Forms:** React Hook Form + Zod
- **State:** TanStack Query + Zustand
- **Testing:** Vitest + React Testing Library + Playwright

### Adiții pentru V2.0
- **Email:** SendGrid / AWS SES (scabil)
- **SMS:** Twilio / SMSLink
- **Payments:** Stripe / Netopia
- **Storage:** Supabase Storage
- **Monitoring:** Sentry, LogRocket
- **Analytics:** Plausible

---

## ✅ Checklist Pre-Lansare

### Testare (Obligatoriu)
- [ ] Unit tests: min 70% coverage
- [ ] E2E tests: flow-urile critice (programare, login, plată)
- [ ] Load testing: 100 req/s fără degradare
- [ ] Cross-browser: Chrome, Firefox, Safari, Edge
- [ ] Mobile: iOS Safari, Android Chrome
- [ ] Security audit: OWASP Top 10
- [ ] GDPR compliance review

### Documentație
- [ ] Manual utilizare admin (PDF)
- [ ] FAQ pacienți (pagină web)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] SLA (Service Level Agreement)

### Marketing și Vânzări
- [ ] Landing page convingătoare
- [ ] Demo video (2-3 minute)
- [ ] 2-3 case studies (clienți pilot)
- [ ] Pricing page clar cu comparație planuri
- [ ] Blog cu conținut util (SEO)
- [ ] Google My Business pentru platformă

### Legal
- [ ] Termeni și condiții
- [ ] Politică de confidențialitate
- [ ] Contract de prestări servicii (pentru clienți B2B)
- [ ] Protecție date personale (DPO desemnat)

---

## 🎯 Indicatori de Succes (KPIs)

### Tehnici
- **Uptime:** 99.9%+
- **Timp mediu de încărcare:** < 2 secunde
- **Bug-uri critice:** 0 în producție
- **Timp rezolvare incidente:** < 4 ore

### Business (Luna 6)
- **Clienți activi:** 10+
- **Churn rate:** < 5%/lună
- **NPS (Net Promoter Score):** > 50
- **CAC (Customer Acquisition Cost):** < 200 RON
- **LTV (Lifetime Value):** > 2.000 RON

### Utilizare
- **Programări/lună:** 100+
- **Utilizare cont pacient:** 30%+
- **Rata anulare:** < 10%

---

## 📞 Suport și Mentenanță

### Niveluri Suport

| Nivel | Timp răspuns | Canal | Preț |
|-------|-------------|-------|------|
| **Standard** | 24-48 ore | Email | Inclus |
| **Prioritar** | 4-8 ore | Email + Chat | +100 RON/lună |
| **Enterprise** | 1-4 ore | Email + Chat + Telefon | Custom |

### Mentenanță Programată
- **Updates de securitate:** Immediat
- **Feature updates:** Lunar
- **Maintenance window:** Duminică 02:00-04:00

---

## 🚀 Next Steps (Acțiuni Imediat)

### Săptămâna Aceasta
1. [ ] Revizuire și aprobare plan
2. [ ] Setup proiect Jira/Linear pentru tracking
3. [ ] Creare branch-uri Git pentru fiecare fază
4. [ ] Începere **Faza 1: Dashboard Admin**

### Resurse Necesare
- **Dezvoltator full-stack:** 1 (acoperit)
- **Designer UI/UX:** Opțional (poate folosi shadcn/ui)
- **QA/Testing:** 0.5 FTE (automation)
- **Support:** 0.25 FTE (inițial founder)

---

## 📝 Notă Finală

Acest plan este conceput pentru a livra **valoare rapid** și a permite începerea vânzărilor încă din **Luna 2** (după MVP Comercial). Fiecare fază adaugă funcționalități care permit creșterea prețului și atragerea unor segmente mai largi de clienți.

**Recomandare strategică:** Începeți cu 2-3 cabinete pilot (discount 50% primul an) pentru a valida produsul și a colecta feedback real înainte de scalare națională.

---

**Document pregătit de:** AI Assistant  
**Versiune:** 1.0  
**Ultima actualizare:** 18 Februarie 2026
