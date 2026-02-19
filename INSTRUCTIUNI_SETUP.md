# 📋 Instrucțiuni Configurare Aplicație "Clinica Dr. Lung"

## 🎯 Prezentare Generală

Aceasta este aplicația completă pentru **Clinica Dr. Lung** - un sistem de programări stomatologice cu:
- Suport bilingv (RO/EN)
- Portaluri pentru Admin, Dentist și Pacient
- Galerie de lucrări before/after
- Listă completă de servicii cu prețuri

---

## ✅ Ce include sistemul

### Funcționalități pentru Pacienți:
- Programări online cu selecție dată/oră
- Vizualizare galerie lucrări stomatologice
- Consultare listă servicii și prețuri
- Vizualizare echipa medicală

### Funcționalități pentru Medici:
- Dashboard cu programările zilei
- Vizualizare istoric pacienți
- Marcarea programărilor ca finalizate

### Funcționalități pentru Admin:
- Management utilizatori
- Management programări
- Configurare orar și sloturi
- Management servicii și prețuri
- Șabloane email

---

## 🚀 Pași de Configurare

### PASUL 1: Configurare Supabase (Baza de Date)

1. **Creează cont pe [Supabase](https://supabase.com)**
2. **Creează un nou proiect**
3. **Deschide SQL Editor** (din sidebar)
4. **Rulează migrările în ordine:**
   - `supabase/migrations/001_phase1_admin_dashboard.sql`
   - `supabase/migrations/002_dentist_system.sql`
   - `supabase/migrations/20240218_verification_tokens.sql`
5. **Verifică tabelele create** în Table Editor

### PASUL 2: Configurare Email (Gmail)

Pentru a trimite emailuri de confirmare:

#### Opțiunea A: App Password (Recomandat)
1. Intră în [Google Account Settings](https://myaccount.google.com/)
2. Securitate → Verificare în 2 pași (activează dacă nu e activ)
3. Securitate → App passwords
4. Generează o parolă pentru "Mail" pe device "Other"
5. Copiază parola generată (16 caractere)

### PASUL 3: Configurare Backend

1. **Copiază fișierul de environment:**
   ```bash
   cd backend
   copy .env.example .env
   ```

2. **Editează `.env` și completează:**
   ```env
   # Email (Gmail)
   EMAIL_USER=clinica.drlung@gmail.com
   EMAIL_PASS=app_password_aici
   
   # Supabase
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
   npm start
   # sau
   npm run dev
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

4. **Accesează în browser:**
   - Site principal: http://localhost:8080
   - Admin: http://localhost:8080/admin
   - Dentist: http://localhost:8080/dentist/login
   - Pacient: http://localhost:8080/pacient/login

---

## 📁 Structura Proiectului Actualizată

```
proiect/
├── backend/
│   ├── server.js              # Server Express
│   ├── services/
│   │   └── emailService.js    # Serviciu email
│   ├── package.json
│   └── .env.example
│
├── src/
│   ├── components/
│   │   ├── Header.tsx         # Header cu navigație nouă
│   │   ├── Footer.tsx
│   │   ├── LanguageSwitcher.tsx  # RO/EN
│   │   ├── AuthNav.tsx
│   │   └── BookingFormNew.tsx    # Formular programare
│   │
│   ├── hooks/
│   │   ├── useAuth.tsx
│   │   └── useLanguage.tsx    # Traduceri bilingv
│   │
│   ├── pages/
│   │   ├── Index.tsx          # Acasă
│   │   ├── Team.tsx           # Echipa
│   │   ├── Gallery.tsx        # Galerie lucrări
│   │   ├── Services.tsx       # Servicii & prețuri
│   │   ├── admin/             # Portal Admin
│   │   ├── dentist/           # Portal Dentist
│   │   └── patient/           # Portal Pacient
│   │
│   ├── api.ts
│   └── integrations/supabase/
│       ├── client.ts
│       └── types.ts
│
├── supabase/
│   ├── schema.sql
│   ├── schema_simple.sql
│   ├── fix_rls.sql
│   └── migrations/            # Migrări baze de date
│       ├── 001_phase1_admin_dashboard.sql
│       ├── 002_dentist_system.sql
│       └── 20240218_verification_tokens.sql
│
├── .env
├── DOCUMENTATIE.md           # Documentație completă RO
├── README.md                 # Documentație EN
└── INSTRUCTIUNI_SETUP.md     # Acest fișier
```

---

## 🔒 Securitate

### Mecanismul de Protecție la Concurență

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

### Conturi de Test

#### Dentist:
- Email: `dr.ionescu@dentcare.ro`
- Parolă: `dentist123`

#### Admin:
- Se creează primul utilizator cu `role='admin'` în Supabase

---

## 🌐 Deploy în Producție

### Backend (Render.com):
1. Creează cont pe [Render](https://render.com)
2. New → Web Service → Connect GitHub repo
3. Setări:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:** Adaugă toate variabilele din `.env`

### Frontend (Vercel):
1. Creează cont pe [Vercel](https://vercel.com)
2. Import project din GitHub
3. Set Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_BACKEND_URL` (URL-ul de la Render)
4. Build Settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`

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
- Rulează din nou migrările din `supabase/migrations/` în SQL Editor

### "Invalid login: 535-5.7.8 Username and Password not accepted"
- Verifică EMAIL_USER și EMAIL_PASS în `backend/.env`
- Dacă folosești Gmail, generează App Password

### "Failed to fetch" sau "Network Error"
- Verifică că backend-ul rulează pe portul 5000
- Verifică `VITE_BACKEND_URL` în `.env`

### Ecran alb (white screen)
- Verifică consolele browser-ului (F12) pentru erori
- Probabil e o eroare de sintaxă în React - verifică fișierele recent modificate

---

## 📞 Contact

Pentru probleme sau întrebări:
- [Supabase Docs](https://supabase.com/docs)
- [Nodemailer Docs](https://nodemailer.com/)
- [React Docs](https://react.dev/)
