import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import BookingForm from './components/BookingForm';
import Admin from './pages/Admin';
import Index from './pages/Index';

function App() {
  return (
    <Router>
      <nav style={{ padding: '20px', background: '#f8f9fa' }}>
        <Link to="/" style={{ marginRight: '20px', textDecoration: 'none' }}>Acasă</Link>
        <Link to="/rezervare" style={{ marginRight: '20px', textDecoration: 'none' }}>Programează-te</Link>
        <Link to="/admin" style={{ textDecoration: 'none' }}>Admin</Link>
      </nav>
      
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/rezervare" element={<BookingForm />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;