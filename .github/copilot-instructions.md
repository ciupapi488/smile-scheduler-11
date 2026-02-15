# Ciupapi Project Guidelines

## Code Style

- **Language**: TypeScript with lenient settings (lenient null checks, implicit any allowed) - see [tsconfig.json](tsconfig.json)
- **Component Pattern**: React functional components with hooks - see [BookingForm.tsx](src/components/BookingForm.tsx)
- **UI Components**: Use shadcn/ui components from `src/components/ui/` - these are pre-configured with Radix UI and Tailwind
- **Styling**: Tailwind CSS with component classes (no inline styles)
- **File Extensions**: `.tsx` for React components, `.ts` for utilities/hooks
- **Naming**: PascalCase for components, camelCase for functions/variables

## Architecture

### Project Structure
- **Frontend** (`src/`): Vite-based React app
  - `pages/`: Full-page components (Auth, Dashboard, Admin, Index, NotFound)
  - `components/`: Reusable UI components organized by feature (admin, booking, dashboard, ui)
  - `hooks/`: Custom React hooks (useAuth, useToast, use-mobile)
  - `integrations/supabase/`: Supabase client and types (auto-generated)
  - `lib/`: Utility functions and helpers

- **Backend** (`backend/`): Express.js server
  - Runs on port 5000
  - Manages appointments in SQLite database
  - Handles email notifications via Nodemailer

### Key Services & Integration Points
- **Supabase**: Authentication, user roles, database (see [supabase/client.ts](src/integrations/supabase/client.ts))
  - Client initialized with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
  - Auth state managed via [useAuth.tsx](src/hooks/useAuth.tsx) context provider
  - User roles checked for admin access

- **Backend API**: RESTful endpoints at `http://localhost:5000`
  - `POST /api/appointments`: Create appointment
  - `GET /api/appointments`: List appointments
  - `GET /api/available-slots`: Get available time slots for a date
  - Uses environment variables: `EMAIL_USER`, `EMAIL_PASS` (Gmail SMTP)

- **Frontend-to-Backend**: Fetch API calls only (see [api.ts](src/api.ts)) - no axios or other HTTP libraries

## Build and Test

### Development
```sh
# Frontend
npm install
npm run dev          # Start Vite dev server on port 8080

# Backend
cd backend
npm install
npm run dev          # Runs with nodemon (restart on changes)
```

### Production
```sh
npm run build        # Build frontend for production
npm run build:dev    # Build with development optimizations
npm run preview      # Preview production build locally
```

### Testing
```sh
npm test             # Run tests once with Vitest
npm run test:watch   # Watch mode testing
```

### Linting
```sh
npm run lint         # Check code with ESLint
```

## Project Conventions

- **State Management**: Use React hooks (useState, useContext) - no Redux or Zustand
- **Auth Pattern**: All protected pages/features use `useAuth()` hook to get user and admin status
- **Error Handling**: Wrap fetch calls in try-catch, return error objects with shape `{ error: string }`
- **API Responses**: Backend returns JSON with `availableSlots`, `error`, or appointment data objects
- **Form Handling**: Use standard HTML form elements with useState for form data (see [BookingForm.tsx](src/components/BookingForm.tsx) for pattern)
- **Component Exports**: Use `export default` for page/feature components
- **Comments**: Romanian comments used in backend/server.js - maintain consistency

## Integration Points

- **Environment Variables**:
  - Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (.env.local)
  - Backend: `EMAIL_USER`, `EMAIL_PASS` (.env)

- **CORS**: Backend configured to accept requests from frontend (see backend/server.js)

- **Database**: 
  - SQLite file at `backend/programari.db` (auto-created)
  - Supabase tables: `appointments`, `user_roles`

## Security

- **Email Credentials**: Never commit `.env` with real credentials - use environment variables
- **Admin Check**: Always verify `isAdmin` from `useAuth()` before showing admin features
- **Supabase RLS**: (Optional) Implement Row Level Security policies for database tables
- **CORS**: Frontend origin not hardcoded - uses localhost in development, verify for production
