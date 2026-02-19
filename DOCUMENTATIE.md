# 📚 Documentație - Sistem de Programări Stomatologice "Clinica Dr. Lung"

## 🎯 Prezentare Generală

Acesta este un sistem complet de programări online pentru cabinete stomatologice, dezvoltat pentru **Clinica Dr. Lung**. Sistemul include suport bilingv (Română/Engleză), management multi-utilizator (admin, dentist, pacient), galerie de lucrări și listă de servicii cu prețuri.

### ✨ Caracteristici Principale

- ✅ **Bilingv (RO/EN)** - Comutare instantanee între limbi
- ✅ **Programări online** - Clienții pot rezerva direct de pe site
- ✅ **Protecție la concurență** - Nu se pot programa 2 persoane la aceeași oră
- ✅ **Actualizări live** - Orele ocupate apar imediat (tăiate cu roșu)
- ✅ **Email de confirmare** - Clientul primește email cu detaliile
- ✅ **Portale dedicate:**
  - 👨‍⚕️ **Portal Admin** - Management utilizatori, programări, servicii
  - 🦷 **Portal Dentist** - Vizualizare programări, pacienți
  - 👤 **Portal Pacient** - Istoric programări, programare nouă
- ✅ **Galerie lucrări** - Before/after cu categorii (albire, fațete, implanturi, etc.)
- ✅ **Servicii și prețuri** - Listă completă cu filtrare pe categorii
- ✅ **Interfață responsive** - Funcționează pe mobil și desktop

---

## 🏗️ Arhitectura Sistemului

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   FRONTEND      │────▶│    BACKEND      │────▶│   SUPABASE      │
│   (React)       │     │   (Express)     │     │  (PostgreSQL)   │
│   Vite + TS     │     │   Node.js       │     │  + Auth         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────┐
        │               │   GMAIL SMTP    │
        │               │  (Send Email)   │
        │               └─────────────────┘
        ▼
┌─────────────────┐
│   BROWSER       │
│ - Header nav    │
│ - Formular      │
│ - Portale       │
│ - Galerie       │
└─────────────────┘
```

### 📁 Structura Proiectului

```
proiect/
│
├── backend/                    # Server Node.js/Express
│   ├── server.js              # Logica principală backend
│   ├── services/
│   │   └── emailService.js    # Serviciu trimitere email
│   ├── package.json           # Dependențe backend
│   └── .env                   # Configurare (NU comiteți!)
│
├── src/                       # Frontend React
│   ├── components/
│   │   ├── Header.tsx         # Header cu navigație
│   │   ├── Footer.tsx         # Footer site
│   │   ├── LanguageSwitcher.tsx  # Comutator RO/EN
│   │   ├── AuthNav.tsx        # Butoane autentificare
│   │   └── BookingFormNew.tsx # Formular programare nou
│   │
│   ├── hooks/
│   │   ├── useAuth.tsx        # Hook autentificare
│   │   └── useLanguage.tsx    # Hook traduceri bilingv
│   │
│   ├── pages/
│   │   ├── Index.tsx          # Pagina principală
│   │   ├── Team.tsx           # Pagina echipă
│   │   ├── Gallery.tsx        # Pagina galerie lucrări
│   │   ├── Services.tsx       # Pagina servicii
│   │   │
│   │   ├── admin/             # Portal Admin
│   │   │   ├── index.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Appointments.tsx
│   │   │   ├── Patients.tsx
│   │   │   ├── Schedule.tsx
│   │   │   ├── Services.tsx
│   │   │   └── EmailTemplates.tsx
│   │   │
│   │   ├── dentist/           # Portal Dentist
│   │   │   ├── Dashboard.tsx
│   │   │   └── Login.tsx
│   │   │
│   │   └── patient/           # Portal Pacient
│   │       ├── Dashboard.tsx
│   │       ├── Login.tsx
│   │       ├── Register.tsx
│   │       ├── Verify.tsx
│   │       └── VerifyEmail.tsx
│   │
│   ├── api.ts                 # Funcții API
│   └── integrations/supabase/
│       ├── client.ts         # Configurare Supabase
│       └── types.ts          # Tipuri TypeScript
│
├── supabase/
│   ├── schema.sql            # Schema bazei de date
│   ├── schema_simple.sql     # Schema simplificată
│   ├── fix_rls.sql           # Fix politici RLS
│   └── migrations/           # Migrări bazei de date
│       ├── 001_phase1_admin_dashboard.sql
│       ├── 002_dentist_system.sql
│       └── 20240218_verification_tokens.sql
│
├── .env                       # Variabile frontend (NU comiteți!)
├── package.json              # Dependențe frontend
├── DOCUMENTATIE.md          # Acest fișier (RO)
└── README.md                # Documentație (EN)
```

---

## 🚀 Instalare și Configurare

### 1. Pre-rechizite

- Node.js 18+ instalat
- Cont Gmail (pentru trimiterea emailurilor)
- Cont Supabase (bază de date gratuită)

### 2. Configurare Supabase (Bază de Date)

1. Creează cont pe [supabase.com](https://supabase.com)
2. Creează un nou proiect
3. Mergi la **SQL Editor** și rulează fișierele din `supabase/migrations/` în ordine:
   - `001_phase1_admin_dashboard.sql`
   - `002_dentist_system.sql`
   - `20240218_verification_tokens.sql`
4. Copiază URL-ul și cheile API din **Settings → API**

### 3. Configurare Backend

```bash
cd backend
copy .env.example .env
```

Editează `backend/.env`:
```env
# Email (Gmail)
EMAIL_USER=clinica.drlung@gmail.com
EMAIL_PASS=parola_sau_app_password

# Supabase
SUPABASE_URL=https://xxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci... (service_role key)

PORT=5000
```

**Notă**: Pentru `EMAIL_PASS`, generează un **App Password** din setările Google.

### 4. Configurare Frontend

Editează `.env` în folderul principal:
```env
VITE_SUPABASE_URL=https://xxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbG... (anon key)
VITE_BACKEND_URL=http://localhost:5000
```

### 5. Instalare Dependențe

```bash
# Backend
cd backend
npm install

# Frontend (în alt terminal, din root)
npm install
```

### 6. Pornire Aplicație

Terminal 1 (Backend):
```bash
cd backend
npm start
```

Terminal 2 (Frontend):
```bash
npm run dev
```

Aplicația va fi disponibilă la `http://localhost:8080`

---

## 🎮 Cum Funcționează

### Pentru Pacient (Frontend)

1. **Accesează site-ul** și vede pagina principală cu info clinică
2. **Navigare** prin Header:
   - **Acasă** - Pagina principală
   - **Programează-te** - Formular de programare
   - **Echipa** - Prezentare medici
   - **Lucrări** - Galerie before/after
   - **Servicii** - Listă prețuri
3. **Click "Programează-te"** → ajunge la formular
4. **Completează datele** (nume, email, telefon)
5. **Selectează data** → vede toate orele
   - Orele libere: butoane normale
   - Orele ocupate: ~~tăiate cu roșu~~ și cu ✕
6. **Selectează ora disponibilă**
7. **Click "Confirmă Programarea"**
8. **Primește email** de confirmare cu toate detaliile

### Pentru Dentist

1. Accesează `/dentist/login`
2. Login cu credențiale:
   - Email: `dr.ionescu@dentcare.ro`
   - Parolă: `dentist123`
3. **Dashboard** - Vede programările zilei
4. Poate marca programări ca "completate"
5. Poate vizualiza istoric pacienți

### Pentru Admin

1. Accesează `/admin` (autentificare necesară)
2. **Dashboard** - Statistici programări
3. **Programări** - Management toate programările
4. **Pacienți** - Listă pacienți
5. **Orar** - Configurare sloturi disponibile
6. **Servicii** - Management servicii și prețuri
7. **Email-uri** - Șabloane email

---

## 🔒 Mecanisme de Securitate

### 1. Protecție la Concurență (Race Condition)

```
Utilizatorul A                    Utilizatorul B
     │                                  │
     │--- Selectează 10:00 ------------│
     │                                  │
     │--- Apasă "Confirmă"             │
     │    │                             │
     │    │ UPDATE slot SET status='booked'
     │    │ WHERE date='x' AND time='10:00'
     │    │ AND status='available'      │
     │◀───┘ ✅ Succes!                 │
     │                                  │
     │                              Apasă "Confirmă"
     │                                  │
     │                              UPDATE... WHERE status='available'
     │◀─────────────────────────────────┘ ❌ Eșuează! (slot deja 'booked')
     │                                  │
     │                              Primeste eroare: "Slot ocupat"
```

**Implementare tehnică:**
- Constraint unic pe `(slot_date, slot_time)` în PostgreSQL
- UPDATE atomic cu condiție `status='available'`
- Verificare înainte de inserare

### 2. Autentificare și Autorizare

- **Supabase Auth** pentru autentificare securizată
- **RLS (Row Level Security)** pentru protecția datelor
- **Role-based access** - admin, dentist, patient
- **Email verification** pentru noi conturi

### 3. Validări

- Toate câmpurile obligatorii
- Validare format email
- Verificare disponibilitate înainte de confirmare
- Protecție SQL Injection (via Supabase/PostgreSQL)

---

## 📊 Schema Bazei de Date

### Tabele Principale

| Tabelă | Descriere |
|--------|-----------|
| `profiles` | Profiluri utilizatori (pacienți, medici, admin) |
| `appointment_slots` | Sloturi disponibile pentru programări |
| `appointments` | Programări confirmate |
| `services` | Servicii stomatologice cu prețuri |
| `gallery_items` | Elemente galerie before/after |
| `verification_tokens` | Token-uri verificare email |

### Tabela `profiles`

| Coloană | Tip | Descriere |
|---------|-----|-----------|
| `id` | UUID | ID utilizator (legat de auth.users) |
| `role` | TEXT | 'admin', 'dentist', 'patient' |
| `first_name` | TEXT | Prenume |
| `last_name` | TEXT | Nume |
| `phone` | TEXT | Telefon |
| `created_at` | TIMESTAMP | Data creării |

### Tabela `services`

| Coloană | Tip | Descriere |
|---------|-----|-----------|
| `id` | UUID | ID unic |
| `name_ro` | TEXT | Denumire RO |
| `name_en` | TEXT | Denumire EN |
| `category` | TEXT | Categorie serviciu |
| `price` | INTEGER | Preț în RON |
| `duration_minutes` | INTEGER | Durată în minute |

---

## 🔧 API Endpoints

### Backend Express

| Endpoint | Metodă | Descriere |
|----------|--------|-----------|
| `/api/test` | GET | Test server |
| `/api/available-slots?date=YYYY-MM-DD` | GET | Obține sloturi libere |
| `/api/appointments` | POST | Creează programare + trimite email |
| `/api/auth/login` | POST | Autentificare |
| `/api/auth/register` | POST | Înregistrare |

### Frontend Routes

| Route | Descriere |
|-------|-----------|
| `/` | Pagina principală |
| `/rezervare` | Formular programare |
| `/echipa` | Pagina echipă |
| `/lucrari` | Galerie lucrări |
| `/servicii` | Listă servicii și prețuri |
| `/pacient/login` | Login pacient |
| `/pacient/dashboard` | Dashboard pacient |
| `/dentist/login` | Login dentist |
| `/dentist/dashboard` | Dashboard dentist |
| `/admin/*` | Portal admin |

---

## 🌐 Deploy în Producție

### Backend (Render/Railway)

1. Push codul pe GitHub
2. Conectează repo-ul în Render/Railway
3. Setează Environment Variables (din `.env`)
4. Deploy!

### Frontend (Vercel/Netlify)

1. Import proiect din GitHub
2. Setează `VITE_BACKEND_URL` cu URL-ul backend-ului deployat
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy!

**Notă**: Nu uita să schimbi `VITE_BACKEND_URL` din `.env` local în URL-ul de producție.

---

## 🐛 Troubleshooting

### "Nu mai sunt locuri disponibile"

**Cauză**: Nu există sloturi în baza de date pentru acea dată.

**Soluție**: Rulează în SQL Editor:
```sql
INSERT INTO appointment_slots (slot_date, slot_time, status) VALUES
('2026-02-16', '09:00', 'available'),
('2026-02-16', '10:00', 'available'),
-- ... etc
```

### "Invalid API key"

**Cauză**: Cheia Supabase e greșită sau de la alt proiect.

**Soluție**: Copiază din nou `anon` key din Supabase Dashboard → API.

### Email-urile nu se trimit

**Cauză**: Gmail blochează aplicațiile "less secure".

**Soluție**: 
1. Activează 2-Factor Authentication în Google
2. Generează App Password
3. Folosește App Password în loc de parola normală

### Portul e ocupat

**Eroare**: `Port 5000 is already in use`

**Soluție**: Schimbă portul în `backend/.env`:
```env
PORT=5001
```

Și în `.env` din root:
```env
VITE_BACKEND_URL=http://localhost:5001
```

### Erori TypeScript "NodeJS.Timeout"

**Cauză**: Cod scris pentru Node.js dar rulat în browser

**Soluție**: Folosește `ReturnType<typeof setTimeout>` în loc de `NodeJS.Timeout`

---

## 📞 Contact și Suport

Pentru probleme sau întrebări:
- Verifică consolele browser-ului (F12) și terminalul pentru erori
- Consultă documentația Supabase: https://supabase.com/docs
- Documentație Nodemailer: https://nodemailer.com/

---

## 📄 Licență

Acest proiect este proprietatea **Clinicii Dr. Lung**.

**Creat cu ❤️ pentru sănătatea dinților tăi!** 🦷
