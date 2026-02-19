import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { API_URL } from '@/api';
import { useLanguage } from '@/hooks/useLanguage';

export default function PatientLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNeedsVerification(false);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed') || error.message.includes('not confirmed')) {
          setNeedsVerification(true);
          setError(t("login.verificationNeeded"));
        } else if (error.message.includes('Invalid login')) {
          setError(t("login.invalidCredentials"));
        } else {
          setError(error.message);
        }
        setLoading(false);
        return;
      }

      if (data.user && !data.user.email_confirmed_at) {
        setNeedsVerification(true);
        setError(t("login.verificationNeeded"));
        setLoading(false);
        return;
      }

      if (data.user) {
        const redirectTo = (location.state as any)?.redirect || '/pacient/dashboard';
        navigate(redirectTo);
      }
    } catch (err: any) {
      setError('Eroare la autentificare. Încercați din nou.');
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!email) {
      setError(t("login.email"));
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/auth/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (result.success) {
        setError('');
        alert(t("login.resend"));
      } else {
        setError('Nu s-a putut retrimite emailul: ' + (result.error || 'Eroare necunoscută'));
      }
    } catch (err) {
      setError('Eroare de conexiune. Asigurați-vă că serverul rulează.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("login.back")}
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <CardTitle className="text-2xl">{t("hero.title")}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">{t("hero.subtitle")}</p>
            <CardDescription className="mt-2">
              {t("login.description")}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {needsVerification && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 mb-2">
                  {t("login.verificationNeeded")}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resendVerificationEmail}
                  className="w-full"
                >
                  {t("login.resend")}
                </Button>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">{t("login.email")}</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nume@email.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">{t("login.password")}</Label>
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
                {loading ? t("login.signingIn") : t("login.signIn")}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">{t("login.noAccount")} </span>
              <Link 
                to="/pacient/inregistrare" 
                state={{ redirect: (location.state as any)?.redirect }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {t("login.createAccount")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
