import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { API_URL } from '@/api';

// Mock dentists for testing without database
const MOCK_DENTISTS = [
  {
    id: 'mock-dentist-1',
    email: 'dr.ionescu@dentcare.ro',
    first_name: 'Andrei',
    last_name: 'Ionescu',
    phone: '0722333444',
    specialization: 'Stomatologie generala',
    bio: 'Dr. Andrei Ionescu are peste 10 ani de experienta in stomatologie generala si estetica dentara.',
    years_experience: 12,
    color_code: '#3B82F6',
    is_active: true
  },
  {
    id: 'mock-dentist-2',
    email: 'dr.popescu@dentcare.ro',
    first_name: 'Maria',
    last_name: 'Popescu',
    phone: '0722555666',
    specialization: 'Ortodontie',
    bio: 'Specialist in ortodontie cu focus pe aparate invizibile Invisalign.',
    years_experience: 8,
    color_code: '#10B981',
    is_active: true
  },
  {
    id: 'mock-dentist-3',
    email: 'dr.marinescu@dentcare.ro',
    first_name: 'Cristian',
    last_name: 'Marinescu',
    phone: '0722777888',
    specialization: 'Chirurgie orala, Implantologie',
    bio: 'Expert in implantologie si chirurgie orală.',
    years_experience: 15,
    color_code: '#F59E0B',
    is_active: true
  }
];

export default function DentistLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useMockMode, setUseMockMode] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check for mock mode credentials first
    const mockDentist = MOCK_DENTISTS.find(d => d.email === email);
    if (mockDentist && password === 'dentist123') {
      console.log('✅ Mock login successful:', mockDentist.email);
      localStorage.setItem('dentist', JSON.stringify(mockDentist));
      localStorage.setItem('dentist_mock_mode', 'true');
      navigate('/dentist/dashboard');
      setLoading(false);
      return;
    }

    // Try real backend login
    try {
      const url = `${API_URL}/api/dentist/login`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('dentist', JSON.stringify(data.dentist));
        localStorage.removeItem('dentist_mock_mode');
        navigate('/dentist/dashboard');
      } else {
        setError(data.error || 'Email sau parolă incorectă');
      }
    } catch (err: any) {
      console.error('Backend error:', err);
      setUseMockMode(true);
      setError('Serverul backend nu răspunde. Folosiți modul DEMO (mock data).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Înapoi la site
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Portal Doctor</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Clinica Dr. Lung</p>
            <CardDescription className="mt-2">
              Accesați contul pentru a gestiona programările
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant={useMockMode ? "default" : "destructive"} className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {useMockMode && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                <strong>💡 Modul DEMO este activat!</strong><br />
                Folosiți credențialele de mai jos pentru a testa interfața fără server.
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@dentcare.ro"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Parolă</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Se autentifică...' : useMockMode ? 'Autentificare DEMO' : 'Autentificare'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 text-center">
                <strong>Conturi de test:</strong><br />
                📧 dr.ionescu@dentcare.ro<br />
                📧 dr.popescu@dentcare.ro<br />
                📧 dr.marinescu@dentcare.ro<br />
                <span className="text-blue-600 font-semibold">🔑 Parolă: dentist123</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
