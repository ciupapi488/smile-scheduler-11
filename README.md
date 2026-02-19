# 🦷 Smile Scheduler - Dental Clinic Booking System

## 🎯 Overview

**Smile Scheduler** is a comprehensive dental clinic booking system developed for **Clinica Dr. Lung**. The system features bilingual support (English/Romanian), multi-user portals (admin, dentist, patient), a dental work gallery, and a complete services catalog with pricing.

### ✨ Key Features

- ✅ **Bilingual (EN/RO)** - Instant language switching
- ✅ **Online Appointments** - Clients can book directly from the website
- ✅ **Race Condition Protection** - Prevents double booking the same slot
- ✅ **Real-time Updates** - Booked slots appear immediately (red strikethrough)
- ✅ **Email Confirmations** - Clients receive confirmation emails with details
- ✅ **Dedicated Portals:**
  - 👨‍💼 **Admin Portal** - User management, appointments, services
  - 🦷 **Dentist Portal** - View appointments, patient management
  - 👤 **Patient Portal** - Appointment history, new bookings
- ✅ **Work Gallery** - Before/after showcase with categories (whitening, veneers, implants, etc.)
- ✅ **Services & Pricing** - Complete price list with category filters
- ✅ **Responsive Design** - Works on mobile and desktop

---

## 🏗️ System Architecture

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
│ - Forms         │
│ - Portals       │
│ - Gallery       │
└─────────────────┘
```

### 📁 Project Structure

```
project/
│
├── backend/                    # Node.js/Express Server
│   ├── server.js              # Main backend logic
│   ├── services/
│   │   └── emailService.js    # Email sending service
│   ├── package.json           # Backend dependencies
│   └── .env                   # Configuration (DO NOT commit!)
│
├── src/                       # React Frontend
│   ├── components/
│   │   ├── Header.tsx         # Header with navigation
│   │   ├── Footer.tsx         # Site footer
│   │   ├── LanguageSwitcher.tsx  # EN/RO language switcher
│   │   ├── AuthNav.tsx        # Authentication buttons
│   │   └── BookingFormNew.tsx # New booking form
│   │
│   ├── hooks/
│   │   ├── useAuth.tsx        # Authentication hook
│   │   └── useLanguage.tsx    # Bilingual translations hook
│   │
│   ├── pages/
│   │   ├── Index.tsx          # Homepage
│   │   ├── Team.tsx           # Team page
│   │   ├── Gallery.tsx        # Dental work gallery
│   │   ├── Services.tsx       # Services & pricing
│   │   │
│   │   ├── admin/             # Admin Portal
│   │   │   ├── index.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Appointments.tsx
│   │   │   ├── Patients.tsx
│   │   │   ├── Schedule.tsx
│   │   │   ├── Services.tsx
│   │   │   └── EmailTemplates.tsx
│   │   │
│   │   ├── dentist/           # Dentist Portal
│   │   │   ├── Dashboard.tsx
│   │   │   └── Login.tsx
│   │   │
│   │   └── patient/           # Patient Portal
│   │       ├── Dashboard.tsx
│   │       ├── Login.tsx
│   │       ├── Register.tsx
│   │       ├── Verify.tsx
│   │       └── VerifyEmail.tsx
│   │
│   ├── api.ts                 # API functions
│   └── integrations/supabase/
│       ├── client.ts         # Supabase configuration
│       └── types.ts          # TypeScript types
│
├── supabase/
│   ├── schema.sql            # Database schema
│   ├── schema_simple.sql     # Simplified schema
│   ├── fix_rls.sql           # Fix RLS policies
│   └── migrations/           # Database migrations
│       ├── 001_phase1_admin_dashboard.sql
│       ├── 002_dentist_system.sql
│       └── 20240218_verification_tokens.sql
│
├── .env                       # Frontend environment variables
├── package.json              # Frontend dependencies
├── DOCUMENTATIE.md          # Documentation (Romanian)
└── README.md                # This file (English)
```

---

## 🚀 Installation & Setup

### 1. Prerequisites

- Node.js 18+ installed
- Gmail account (for sending emails)
- Supabase account (free database)

### 2. Supabase Setup (Database)

1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **SQL Editor** and run migration files in order:
   - `001_phase1_admin_dashboard.sql`
   - `002_dentist_system.sql`
   - `20240218_verification_tokens.sql`
4. Copy the URL and API keys from **Settings → API**

### 3. Backend Configuration

```bash
cd backend
copy .env.example .env
```

Edit `backend/.env`:
```env
# Email (Gmail)
EMAIL_USER=clinic.email@gmail.com
EMAIL_PASS=app_password

# Supabase
SUPABASE_URL=https://xxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci... (service_role key)

PORT=5000
```

**Note**: Generate an **App Password** from Google settings for `EMAIL_PASS`.

### 4. Frontend Configuration

Edit `.env` in the root folder:
```env
VITE_SUPABASE_URL=https://xxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbG... (anon key)
VITE_BACKEND_URL=http://localhost:5000
```

### 5. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in another terminal, from root)
npm install
```

### 6. Start the Application

Terminal 1 (Backend):
```bash
cd backend
npm start
```

Terminal 2 (Frontend):
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

---

## 🎮 How It Works

### For Patients (Frontend)

1. **Visit the website** and see the main page with clinic info
2. **Navigate** through the Header:
   - **Home** - Main page
   - **Book Now** - Appointment form
   - **Team** - Meet the doctors
   - **Gallery** - Before/after dental work
   - **Services** - Price list
3. **Click "Book Now"** → arrives at the booking form
4. **Fill in details** (name, email, phone)
5. **Select date** → sees all available time slots
   - Available slots: normal buttons
   - Booked slots: ~~red strikethrough~~ with ✕
6. **Select available time**
7. **Click "Confirm Appointment"**
8. **Receives email** confirmation with all details

### For Dentists

1. Access `/dentist/login`
2. Login with credentials:
   - Email: `dr.ionescu@dentcare.ro`
   - Password: `dentist123`
3. **Dashboard** - View today's appointments
4. Can mark appointments as "completed"
5. Can view patient history

### For Admins

1. Access `/admin` (authentication required)
2. **Dashboard** - Appointment statistics
3. **Appointments** - Manage all appointments
4. **Patients** - Patient list
5. **Schedule** - Configure available slots
6. **Services** - Manage services and prices
7. **Emails** - Email templates

---

## 🔒 Security Features

### 1. Race Condition Protection

```
User A                           User B
  │                                │
  │--- Selects 10:00 -------------│
  │                                │
  │--- Clicks "Confirm"           │
  │    │                           │
  │    │ Checks availability      │
  │    │ ✅ Available             │
  │    │                           │
  │---│    │--- Clicks "Confirm"  │
  │   │    │    │                  │
  │   │    │    │ Checks...       │
  │   │    │    │ ✅ Still free   │
  │   │    │    │                  │
  │ INSERT (succeeds)              │
  │   │    │    │                  │
  │   │    │ INSERT (fails!)      │
  │   │    │    │ ❌ Conflict     │
  │   │    │    │                  │
  │   │    │--- Deletes date/time-│
  │   │         "Choose another"   │
```

**Technical Implementation:**
- Unique constraint on `(slot_date, slot_time)` in PostgreSQL
- Atomic UPDATE with `status='available'` condition
- Pre-insertion availability check

### 2. Authentication & Authorization

- **Supabase Auth** for secure authentication
- **RLS (Row Level Security)** for data protection
- **Role-based access** - admin, dentist, patient
- **Email verification** for new accounts

### 3. Validations

- All fields required
- Email format validation
- Availability check before confirmation
- SQL Injection protection (via Supabase/PostgreSQL)

---

## 📊 Database Schema

### Main Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (patients, doctors, admin) |
| `appointment_slots` | Available appointment slots |
| `appointments` | Confirmed appointments |
| `services` | Dental services with prices |
| `gallery_items` | Gallery before/after items |
| `verification_tokens` | Email verification tokens |

### Table `profiles`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | User ID (linked to auth.users) |
| `role` | TEXT | 'admin', 'dentist', 'patient' |
| `first_name` | TEXT | First name |
| `last_name` | TEXT | Last name |
| `phone` | TEXT | Phone number |
| `created_at` | TIMESTAMP | Creation date |

### Table `services`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique ID |
| `name_ro` | TEXT | Name in Romanian |
| `name_en` | TEXT | Name in English |
| `category` | TEXT | Service category |
| `price` | INTEGER | Price in RON |
| `duration_minutes` | INTEGER | Duration in minutes |

---

## 🔧 API Endpoints

### Backend Express

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/test` | GET | Server test |
| `/api/available-slots?date=YYYY-MM-DD` | GET | Get available slots |
| `/api/appointments` | POST | Create appointment + send email |
| `/api/auth/login` | POST | Login |
| `/api/auth/register` | POST | Register |

### Frontend Routes

| Route | Description |
|-------|-------------|
| `/` | Homepage |
| `/rezervare` | Booking form |
| `/echipa` | Team page |
| `/lucrari` | Work gallery |
| `/servicii` | Services & pricing |
| `/pacient/login` | Patient login |
| `/pacient/dashboard` | Patient dashboard |
| `/dentist/login` | Dentist login |
| `/dentist/dashboard` | Dentist dashboard |
| `/admin/*` | Admin portal |

---

## 🌐 Production Deployment

### Backend (Render/Railway)

1. Push code to GitHub
2. Connect repo in Render/Railway
3. Set Environment Variables (from `.env`)
4. Deploy!

### Frontend (Vercel/Netlify)

1. Import project from GitHub
2. Set `VITE_BACKEND_URL` to the deployed backend URL
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy!

**Note**: Don't forget to change `VITE_BACKEND_URL` in production `.env` to the production backend URL.

---

## 🐛 Troubleshooting

### "No slots available"

**Cause**: No slots exist in the database for that date.

**Solution**: Run in SQL Editor:
```sql
INSERT INTO appointment_slots (slot_date, slot_time, status) VALUES
('2026-02-16', '09:00', 'available'),
('2026-02-16', '10:00', 'available'),
-- ... etc
```

### "Invalid API key"

**Cause**: Wrong Supabase key or from another project.

**Solution**: Copy the `anon` key again from Supabase Dashboard → API.

### Emails not sending

**Cause**: Gmail blocks "less secure" apps.

**Solution**: 
1. Enable 2-Factor Authentication in Google
2. Generate App Password
3. Use App Password instead of regular password

### Port already in use

**Error**: `Port 5000 is already in use`

**Solution**: Change port in `backend/.env`:
```env
PORT=5001
```

And in root `.env`:
```env
VITE_BACKEND_URL=http://localhost:5001
```

### TypeScript "NodeJS.Timeout" errors

**Cause**: Code written for Node.js but running in browser

**Solution**: Use `ReturnType<typeof setTimeout>` instead of `NodeJS.Timeout`

---

## 📞 Support

For issues or questions:
- Check browser console (F12) and terminal for errors
- Consult Supabase documentation: https://supabase.com/docs
- Nodemailer documentation: https://nodemailer.com/

---

## 📄 License

This project is property of **Clinica Dr. Lung**.

**Created with ❤️ for your dental health!** 🦷
