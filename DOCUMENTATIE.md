# 📚 Documentație - Sistem de Programări Stomatologice

## 🎯 Prezentare Generală

Acesta este un sistem complet de programări online pentru cabinete stomatologice, cu protecție la concurență, actualizări în timp real și trimitere de email-uri.

### ✨ Caracteristici Principale

- ✅ **Programări online** - Clienții pot rezerva direct de pe site
- ✅ **Protecție la concurență** - Nu se pot programa 2 persoane la aceeași oră
- ✅ **Actualizări live** - Orele ocupate apar imediat (tăiate cu roșu)
- ✅ **Email de confirmare** - Clientul primește email cu detaliile
- ✅ **Protecție anti-reply** - Reply-urile se duc la o adresă separată
- ✅ **Interfață responsive** - Funcționează pe mobil și desktop

---

## 🏗️ Arhitectura Sistemului

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   FRONTEND      │────▶│    BACKEND      │────▶│   SUPABASE      │
│   (React)       │     │   (Express)     │     │  (PostgreSQL)   │
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
│ - Formular      │
│ - Sloturi live  │
│ - Status ocupat │
└─────────────────┘
```

### 📁 Structura Fișierelor

```
proiect/
│
├── backend/                    # Server Node.js/Express
│   ├── server.js              # Logica principală backend
│   ├── package.json           # Dependențe backend
│   └── .env                   # Configurare (NU comiteți!)
│
├── src/                       # Frontend React
│   ├── components/
│   │   └── BookingForm.tsx   # Formularul de programare
│   ├── api.ts                 # Funcții API
│   ├── pages/
│   │   ├── Index.tsx         # Pagina principală
│   │   └── Admin.tsx         # Pagina admin (opțional)
│   └── integrations/supabase/
│       ├── client.ts         # Configurare Supabase
│       └── types.ts          # Tipuri TypeScript
│
├── supabase/
│   └── schema_simple.sql     # Schema bazei de date
│
├── .env                       # Variabile frontend (NU comiteți!)
├── package.json              # Dependențe frontend
└── DOCUMENTATIE.md          # Acest fișier
```

---

## 🚀 Instalare și Configurare

### 1. Pre-rechizite

- Node.js instalat
- Cont Gmail (pentru trimiterea emailurilor)
- Cont Supabase (bază de date gratuită)

### 2. Configurare Supabase (Bază de Date)

1. Creează cont pe [supabase.com](https://supabase.com)
2. Creează un nou proiect
3. Mergi la **SQL Editor** și rulează fișierul `supabase/schema_simple.sql`
4. Copiază URL-ul și cheile API din **Settings → API**

### 3. Configurare Backend

```bash
cd backend
copy .env.example .env
```

Editează `backend/.env`:
```env
# Email (Gmail)
EMAIL_USER=dentistulMeu@gmail.com
EMAIL_PASS=parola_sau_app_password

# No-Reply (unde merg reply-urile)
NO_REPLY_USER=popescuiustinian2@gmail.com

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

Aplicația va fi disponibilă la `http://localhost:5173`

---

## 🎮 Cum Funcționează

### Pentru Client (Frontend)

1. **Accesează site-ul** și vede pagina principală
2. **Click "Book Your Appointment"** → ajunge la formular
3. **Completează datele** (nume, email, telefon)
4. **Selectează data** → vede toate orele
   - Orele libere: butoane normale
   - Orele ocupate: ~~tăiate cu roșu~~ și cu ✕
5. **Selectează ora disponibilă**
6. **Click "Confirmă Programarea"**
7. **Primește email** de confirmare cu toate detaliile

### Pentru Admin (Backend/Supabase)

1. **Mergi în Supabase Dashboard** → Table Editor
2. Vezi toate programările în tabela `appointments`
3. Poți șterge/modifica manual dacă e necesar

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

### 2. Protecție Anti-Reply la Email

```
Client primește email
        │
        ▼
From: Cabinet Stomatologic <dentist@gmail.com>
Reply-To: popescuiustinian2@gmail.com  ← Reply-urile vin aici!
        │
        ▼
Client dă Reply
        │
        ▼
Emailul se duce la popescuiustinian2@gmail.com
        │
        ▼
Dentistul NU primește spam! ✅
```

### 3. Validări

- Toate câmpurile obligatorii
- Validare format email
- Verificare disponibilitate înainte de confirmare
- Protecție SQL Injection (via Supabase/PostgreSQL)

---

## 📊 Schema Bazei de Date

### Tabela `appointment_slots`

| Coloană | Tip | Descriere |
|---------|-----|-----------|
| `id` | UUID | ID unic |
| `slot_date` | DATE | Data programării |
| `slot_time` | TIME | Ora programării |
| `status` | TEXT | 'available', 'booked', 'blocked' |
| `patient_name` | TEXT | Numele pacientului |
| `patient_phone` | TEXT | Telefon pacient |
| `booked_by` | TEXT | Email pacient |
| `created_at` | TIMESTAMP | Când a fost creat |

**Constraint unic:** `(slot_date, slot_time)`

### Tabela `appointments`

| Coloană | Tip | Descriere |
|---------|-----|-----------|
| `id` | UUID | ID unic |
| `slot_id` | UUID | Referință la slot |
| `name` | TEXT | Numele pacientului |
| `email` | TEXT | Email pacient |
| `phone` | TEXT | Telefon pacient |
| `service` | TEXT | Tipul serviciului |
| `appointment_date` | DATE | Data |
| `appointment_time` | TIME | Ora |

---

## 🔧 API Endpoints

### Backend Express

| Endpoint | Metodă | Descriere |
|----------|--------|-----------|
| `/api/test` | GET | Test server |
| `/api/available-slots?date=YYYY-MM-DD` | GET | Obține sloturi libere |
| `/api/appointments` | POST | Creează programare + trimite email |

### Frontend API Functions

```typescript
// Obține sloturi disponibile
getAvailableSlots(date: string): Promise<string[]>

// Creează programare (via backend)
createAppointmentViaBackend(data: FormData): Promise<Result>
```

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
3. Deploy!

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

---

## 📞 Contact și Suport

Pentru probleme sau întrebări:
- Verifică consolele browser-ului (F12) și terminalul pentru erori
- Consultă documentația Supabase: https://supabase.com/docs
- Documentație Nodemailer: https://nodemailer.com/

---

## 📄 Licență

Acest proiect este proprietatea cabinetului stomatologic.

**Creat cu ❤️ pentru dentistul tău!** 🦷
