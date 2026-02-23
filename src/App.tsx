import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Index from './pages/Index';
import PatientLogin from './pages/patient/Login';
import PatientRegister from './pages/patient/Register';
import PatientDashboard from './pages/patient/Dashboard';
import VerifyEmail from './pages/patient/Verify';
import DentistLogin from './pages/dentist/Login';
import DentistDashboard from './pages/dentist/Dashboard';
import TeamPage from './pages/Team';
import GalleryPage from './pages/Gallery';
import ServicesPage from './pages/Services';
import BookingFormNew from './components/BookingFormNew';
import AdminLayout from './pages/admin';
import { ToothFairyKids } from './components/kids/ToothFairyKids';

function App() {
  return (
    <Router>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/rezervare" element={<BookingFormNew />} />
        <Route path="/echipa" element={<TeamPage />} />
        <Route path="/lucrari" element={<GalleryPage />} />
        <Route path="/servicii" element={<ServicesPage />} />
        
        {/* Patient */}
        <Route path="/pacient/login" element={<PatientLogin />} />
        <Route path="/pacient/inregistrare" element={<PatientRegister />} />
        <Route path="/pacient/verify" element={<VerifyEmail />} />
        <Route path="/pacient/dashboard" element={<PatientDashboard />} />
        
        {/* Dentist */}
        <Route path="/dentist/login" element={<DentistLogin />} />
        <Route path="/dentist/dashboard" element={<DentistDashboard />} />
        
        {/* Kids - Tooth Fairy */}
        <Route path="/zana-maseluta" element={<ToothFairyKids />} />
        
        {/* Admin */}
        <Route path="/admin/*" element={<AdminLayout />} />
      </Routes>
    </Router>
  );
}

export default App;
