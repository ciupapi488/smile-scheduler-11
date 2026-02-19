# AGENTS.md - Dental Appointment Booking System

> This file contains project-specific information for AI coding agents working on this codebase.
> Language: Romanian (RO) - The project uses Romanian in UI and documentation.

---

## 📋 Project Overview

This is a **Dental Appointment Booking System** ("Sistem de Programări Stomatologice") - a full-stack web application for dental clinics to accept online appointments. The system features real-time slot availability, race-condition protection, and email confirmations.

### Key Features
- ✅ Online appointment booking with date/time selection
- ✅ Real-time slot availability (auto-refreshes every 3 seconds)
- ✅ Race condition protection - prevents double-booking of the same slot
- ✅ Email confirmations via Gmail SMTP
- ✅ Anti-reply protection - replies go to a separate address
- ✅ Admin dashboard for viewing appointments
- ✅ Responsive UI for mobile and desktop

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   FRONTEND      │────▶│    BACKEND      │────▶│   SUPABASE      │
│   (React/Vite)  │     │   (Express.js)  │     │  (PostgreSQL)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────┐
        │               │   GMAIL SMTP    │
        │               │  (Send Email)   │
        │               └─────────────────┘
```

### Technology Stack

**Frontend:**
- React 18.3 + TypeScript 5.8
- Vite 5.4 (build tool, port 8080)
- React Router DOM 6.30 (client-side routing)
- shadcn/ui + Radix UI primitives
- Tailwind CSS 3.4
- TanStack Query 5.83 (React Query)
- Supabase JavaScript client 2.93
- Zod (validation)
- React Hook Form 7.61
- Lucide React (icons)
- date-fns, Recharts, Embla Carousel

**Backend:**
- Node.js + Express.js 5.2
- Supabase client 2.39 (@supabase/supabase-js)
- Nodemailer 8.0 (email)
- CORS, dotenv
- nodemon (dev)

**Database:**
- Supabase (PostgreSQL)
- Real-time subscriptions
- Row Level Security (RLS)

---

## 📁 Project Structure

```
project/
├── .env                          # Frontend environment variables
├── package.json                  # Frontend dependencies
├── vite.config.ts                # Vite configuration
├── vitest.config.ts              # Vitest test configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── eslint.config.js              # ESLint configuration
├── tsconfig.json                 # TypeScript configuration
├── components.json               # shadcn/ui configuration
│
├── backend/                      # Express.js backend
│   ├── server.js                 # Main server entry point
│   ├── package.json              # Backend dependencies
│   ├── .env                      # Backend environment (DO NOT COMMIT)
│   └── .env.example              # Template for backend env
│
├── src/                          # Frontend source code
│   ├── App.tsx                   # Root component with routing
│   ├── main.tsx                  # Application entry point
│   ├── index.css                 # Global styles
│   ├── api.ts                    # API functions (Supabase + Backend)
│   ├── api.js                    # Legacy JS API file
│
│   ├── components/               # React components
│   │   ├── BookingForm.tsx       # Main booking form component
│   │   ├── Header.tsx            # Navigation header
│   │   ├── Footer.tsx            # Page footer
│   │   ├── NavLink.tsx           # Navigation link component
│   │   ├── ui/                   # shadcn/ui components (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   └── ... (40+ components)
│   │   ├── booking/              # Booking-related components
│   │   │   ├── BookingModal.tsx
│   │   │   ├── TimeSlotPicker.tsx
│   │   │   └── WeeklyCalendar.tsx
│   │   ├── admin/                # Admin components
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── ScheduleView.tsx
│   │   │   └── SlotGenerator.tsx
│   │   └── dashboard/            # Dashboard components
│   │       └── AppointmentCard.tsx
│
│   ├── pages/                    # Page components
│   │   ├── Index.tsx             # Homepage with hero section
│   │   ├── Admin.tsx             # Admin dashboard
│   │   ├── Auth.tsx              # Authentication page
│   │   ├── Dashboard.tsx         # User dashboard
│   │   └── NotFound.tsx          # 404 page
│
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-toast.ts          # Toast notifications
│   │   ├── use-mobile.tsx        # Mobile detection
│   │   └── useAuth.tsx           # Authentication hook
│
│   ├── lib/                      # Utility libraries
│   │   └── utils.ts              # CN utility (clsx + tailwind-merge)
│
│   ├── integrations/             # Third-party integrations
│   │   └── supabase/
│   │       ├── client.ts         # Supabase client configuration
│   │       └── types.ts          # TypeScript types for database
│
│   └── test/                     # Test files
│       ├── setup.ts              # Test setup (jsdom mocks)
│       └── example.test.ts       # Sample test
│
├── supabase/                     # Database schema and migrations
│   ├── schema.sql                # Main database schema
│   ├── schema_simple.sql         # Simplified schema
│   ├── fix_rls.sql               # RLS fix script
│   ├── generate_slots.sql        # Slot generation helper
│   ├── config.toml               # Supabase config
│   └── migrations/               # Database migrations
│
├── public/                       # Static assets
└── index.html                    # HTML entry point
```

---

## 🚀 Build and Development Commands

### Frontend

```bash
# Install dependencies
npm install

# Start development server (port 8080)
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Preview production build
npm run preview

# Run linter
npm run lint

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

### Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start server (production mode)
npm start

# Start with auto-reload (development)
npm run dev
```

### Running Full Application Locally

**Terminal 1 (Backend):**
```bash
cd backend
npm start
# Server runs on port 5000 or 5001 (see .env)
```

**Terminal 2 (Frontend):**
```bash
npm run dev
# Frontend runs on port 8080
```

Access the application at `http://localhost:8080`

---

## ⚙️ Environment Configuration

### Frontend (.env in root)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbG... (anon/public key)
VITE_BACKEND_URL=http://localhost:5000   # or 5001 if port is occupied
```

### Backend (backend/.env)

```env
# Email (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password  # App Password, not regular password
NO_REPLY_USER=reply_to_address@gmail.com  # Where replies go

# Supabase (use service_role key - keep secret!)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG... (service_role key - SECRET!)

# Server
PORT=5000
```

**Security Notes:**
- NEVER commit `.env` files to Git
- `SUPABASE_SERVICE_KEY` is a secret - only use in backend
- `VITE_SUPABASE_PUBLISHABLE_KEY` is safe for frontend
- Use Gmail App Password (not regular password) for EMAIL_PASS

---

## 🗄️ Database Schema

### Tables

**appointment_slots** - Stores available/booked time slots
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| slot_date | DATE | Appointment date |
| slot_time | TIME | Appointment time (HH:MM format) |
| status | TEXT | 'available', 'booked', or 'blocked' |
| patient_name | TEXT | Name of patient (when booked) |
| patient_phone | TEXT | Phone number |
| booked_by | TEXT | Patient email |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**appointments** - Stores detailed appointment records
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| slot_id | UUID | Foreign key to appointment_slots |
| name | TEXT | Patient name |
| email | TEXT | Patient email |
| phone | TEXT | Patient phone |
| service | TEXT | Type of dental service |
| appointment_date | DATE | Date of appointment |
| appointment_time | TIME | Time of appointment |
| created_at | TIMESTAMPTZ | Creation timestamp |

### Key Constraints

- **Unique constraint** on `(slot_date, slot_time)` - prevents double booking
- **Foreign key** from appointments.slot_id → appointment_slots.id

### Database Functions

- `generate_appointment_slots(start_date, end_date)` - Auto-generate slots
- `book_appointment(date, time, name, email, phone, service)` - Atomic booking with race condition protection

---

## 🔌 API Endpoints

### Backend API (Express)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/test` | GET | Health check |
| `/api/available-slots?date=YYYY-MM-DD` | GET | Get available slots for date |
| `/api/appointments` | POST | Create new appointment + send email |
| `/api/appointments` | GET | Get all appointments (admin) |

### Frontend API Functions (src/api.ts)

```typescript
// Test Supabase connection
testSupabaseConnection(): Promise<{ success: boolean; error?: string }>

// Get available time slots for a date
getAvailableSlots(date: string): Promise<string[]>

// Create appointment (direct via Supabase)
createAppointment(data: AppointmentData): Promise<Result>

// Create appointment via backend (with email)
createAppointmentViaBackend(data: AppointmentData): Promise<Result>

// Get all appointments (admin)
getAppointments(): Promise<Appointment[]>
```

---

## 🧪 Testing Strategy

### Test Setup
- **Framework:** Vitest
- **Environment:** jsdom
- **Testing Library:** @testing-library/react, @testing-library/jest-dom

### Running Tests
```bash
# Run all tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

### Test Files
- `src/test/setup.ts` - Test environment setup (matchMedia mock)
- `src/test/example.test.ts` - Sample test file

### Adding New Tests
Tests should be co-located with components or in `src/test/` directory:
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("ComponentName", () => {
  it("should render correctly", () => {
    // Test code
  });
});
```

---

## 🎨 Code Style Guidelines

### TypeScript
- Use TypeScript for all new code
- Prefer explicit types over `any`
- Use interfaces for object shapes
- The project has relaxed strict settings (`strictNullChecks: false`)

### Components
- Use functional components with hooks
- Components are in PascalCase (e.g., `BookingForm.tsx`)
- Utility files are in camelCase (e.g., `useAuth.tsx`)
- shadcn/ui components go in `src/components/ui/`

### Imports
- Use path alias `@/` for imports from src
- Examples: `import { Button } from "@/components/ui/button"`

### Styling
- Use Tailwind CSS for styling
- Custom CSS variables for theming (see `src/index.css`)
- Status colors: `status-available`, `status-booked`, `status-late`, `status-cancelled`

### Naming Conventions
- React components: PascalCase
- Hooks: camelCase with `use` prefix
- Utilities: camelCase
- Database tables: snake_case

---

## 🔒 Security Considerations

### Environment Variables
- Never commit `.env` files
- Backend uses `SUPABASE_SERVICE_KEY` (admin privileges) - keep secret
- Frontend uses `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key) - safe to expose

### Race Condition Protection
The system prevents double-booking through:
1. PostgreSQL unique constraint on `(slot_date, slot_time)`
2. UPSERT with `onConflict` handling
3. Atomic UPDATE with `status = 'available'` check
4. If conflict occurs, user must reselect date/time

### Email Security
- Uses `replyTo` header to redirect replies to separate address
- Headers set: `Precedence: bulk`, `X-Auto-Response-Suppress: OOF, AutoReply`

### CORS
Backend allows cross-origin requests - configured for development.

---

## 🐛 Common Issues & Troubleshooting

### "Port already in use"
Change port in `backend/.env` and update `VITE_BACKEND_URL` in root `.env`.

### "Cannot find module '@supabase/supabase-js'"
```bash
cd backend
npm install @supabase/supabase-js
```

### "relation 'appointment_slots' does not exist"
Run the schema file in Supabase SQL Editor: `supabase/schema.sql`

### "Invalid login: Username and Password not accepted"
- Use Gmail App Password (not regular password)
- Enable 2FA in Google account first
- Generate App Password at: Google Account → Security → 2-Step Verification → App passwords

### Database Connection Issues
Check Supabase URL and keys in both `.env` files.

---

## 📝 Important Files

| File | Purpose |
|------|---------|
| `src/api.ts` | All API communication with Supabase and backend |
| `src/components/BookingForm.tsx` | Main booking UI component |
| `backend/server.js` | Express server with booking logic |
| `supabase/schema.sql` | Database schema definition |
| `src/integrations/supabase/client.ts` | Supabase client setup |
| `src/integrations/supabase/types.ts` | TypeScript types for DB |

---

## 🌐 Deployment

### Backend (Render/Railway)
1. Push code to GitHub
2. Connect repo to Render/Railway
3. Set environment variables from `.env`
4. Start command: `npm start`

### Frontend (Vercel/Netlify)
1. Import from GitHub
2. Set build command: `npm run build`
3. Set environment variables (use production backend URL)
4. Deploy

---

## 📚 Additional Documentation

- `README.md` - Basic setup and project info
- `DOCUMENTATIE.md` - Detailed documentation in Romanian
- `INSTRUCTIUNI_SETUP.md` - Setup instructions in Romanian

---

## 🆘 Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

---

*Last updated: 2026-02-18*
