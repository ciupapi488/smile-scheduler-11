# 📋 Instrucțiuni Configurare Aplicație Programări Stomatologice

## 🎯 Ce am rezolvat

### ❌ Problemele identificate:
1. **Eroare de sintaxă** în `backend/server.js` - cod duplicat
2. **Bază de date locală (SQLite)** - nu permite live updates
3. **Lipsă protecție la concurență** - două persoane puteau rezerva același slot
4. **URL hardcodat** - funcționa doar local

### ✅ Soluțiile implementate:
1. **Reparat eroarea de sintaxă** din backend
2. **Migrat la Supabase (PostgreSQL)** - bază de date în cloud cu real-time
3. **Implementat protecție atomică** la rezervări (unique constraint + upsert)
4. **Adăugat real-time subscriptions** - sloturile se actualizează live
5. **Logica de ștergere data/ora** când apare conflict

---

## 🚀 Pași de configurare

### PASUL 1: Configurare Supabase (Database)

1. **Creează cont pe [Supabase](https://supabase.com)**
2. **Creează un nou proiect**
3. **Deschide SQL Editor** (din sidebar)
4. **Copiază și rulează** conținutul din `supabase/schema.sql`
5. **Verifică tabelele create** în Table Editor

### PASUL 2: Configurare Email (Gmail)

Pentru a trimite emailuri de confirmare:

#### Opțiunea A: App Password (Recomandat)
1. Intră în [Google Account Settings](https://myaccount.google.com/)
2. Securitate → Verificare în 2 pași (activează dacă nu e activ)
3. Securitate → App passwords
4. Generează o parolă pentru "Mail" pe device "Other"
5. Copiază parola generată (16 caractere)

#### Opțiunea B: Less Secure Apps (Mai puțin sigur)
1. Intră în [Google Account Settings](https://myaccount.google.com/)
2. Securitate → Less secure app access → Enable

### PASUL 3: Configurare Backend

1. **Copiază fișierul de environment:**
   ```bash
   cd backend
   copy .env.example .env
   ```

2. **Editează `.env` și completează:**
   ```env
   EMAIL_USER=emailul_tau@gmail.com
   EMAIL_PASS=parola_sau_app_password
   
   SUPABASE_URL=https://xxxxxx.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   PORT=5000
   ```

3. **Instalează dependențele:**
   ```bash
   cd backend
   npm install
   ```

4. **Pornește serverul:**
   ```bash
   npm run dev
   # sau
   npm start
   ```

### PASUL 4: Configurare Frontend

1. **Verifică variabilele din `.env` (root):**
   ```env
   VITE_SUPABASE_URL=https://xxxxxx.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
   VITE_BACKEND_URL=http://localhost:5000
   ```

2. **Instalează dependențele (dacă nu sunt deja):**
   ```bash
   npm install
   ```

3. **Pornește aplicația:**
   ```bash
   npm run dev
   ```

---

## 📁 Structura Proiectului

```
proiect/
├── backend/
│   ├── server.js           # Server Express cu Supabase
│   ├── package.json        # Dependențe backend
│   └── .env.example        # Template variabile mediu
├── src/
│   ├── components/
│   │   └── BookingForm.tsx # Formular cu real-time
│   ├── api.ts              # Funcții API Supabase
│   └── integrations/
│       └── supabase/
│           ├── client.ts   # Configurare Supabase
│           └── types.ts    # Tipuri TypeScript
├── supabase/
│   └── schema.sql          # Schema bazei de date
├── .env                    # Variabile frontend
└── INSTRUCTIUNI_SETUP.md   # Acest fișier
```

---

## 🔒 Mecanismul de Protecție la Concurență

### Cum funcționează:

```
Utilizatorul A                    Utilizatorul B
     |                                  |
     |--- Selectează 10:00 ------------|
     |                                  |
     |--- Apasă "Confirmă"             |
     |    |                             |
     |    | Verifică disponibilitatea  |
     |    | ✅ Liber                   |
     |    |                             |
     |---|    |--- Apasă "Confirmă"    |
     |   |    |    |                    |
     |   |    |    | Verifică...       |
     |   |    |    | ✅ Liber (încă)   |
     |   |    |    |                    |
     | INSERT (reușește)                |
     |   |    |    |                    |
     |   |    | INSERT (eșuează!)      |
     |   |    |    | ❌ Conflict       |
     |   |    |    |                    |
     |   |    |--- Șterge data+ora ---|
     |   |         "Alege altă oră"    |
```

### Implementare tehnică:
1. **Constraint unic** pe `(slot_date, slot_time)` în PostgreSQL
2. **UPSERT cu `onConflict`** - încercăm inserarea, dacă există deja → eroare
3. **Funcție RPC PostgreSQL** `book_appointment()` - operațiune atomică
4. **Real-time subscriptions** - actualizare instant la modificări

---

## 🌐 Deploy în Producție

### Backend (Render.com):
1. Creează cont pe [Render](https://render.com)
2. New → Web Service → Connect GitHub repo
3. Setări:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:** Adaugă toate variabilele din `.env`

### Frontend (Vercel/Netlify):
1. Creează cont pe [Vercel](https://vercel.com)
2. Import project din GitHub
3. Set Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_BACKEND_URL` (URL-ul de la Render)

---

## ⚠️ Note Importante

### Securitate:
- **NICIODATĂ** nu comite fișierele `.env` în Git!
- `SUPABASE_SERVICE_KEY` este secret - folosește-l doar în backend
- `VITE_SUPABASE_PUBLISHABLE_KEY` este public - poate fi folosit în frontend

### Testare concurență:
1. Deschide aplicația în 2 browsere diferite (Chrome + Firefox)
2. Selectează aceeași dată și oră în ambele
3. Apasă "Confirmă" aproape simultan
4. Primul reușește, al doilea primește eroare și trebuie să reselecteze

---

## 🆘 Troubleshooting

### "Cannot find module '@supabase/supabase-js'"
```bash
cd backend
npm install @supabase/supabase-js
```

### "relation 'appointment_slots' does not exist"
- Rulează din nou `supabase/schema.sql` în SQL Editor

### "Invalid login: 535-5.7.8 Username and Password not accepted"
- Verifică EMAIL_USER și EMAIL_PASS în `backend/.env`
- Dacă folosești Gmail, generează App Password

### "Failed to fetch" sau "Network Error"
- Verifică că backend-ul rulează pe portul 5000
- Verifică `VITE_BACKEND_URL` în `.env`

---

## 📞 Contact

Pentru probleme sau întrebări, verifică:
- [Supabase Docs](https://supabase.com/docs)
- [Nodemailer Docs](https://nodemailer.com/)
