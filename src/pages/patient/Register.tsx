import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { API_URL } from '@/api';
import { useLanguage } from '@/hooks/useLanguage';

export default function PatientRegister() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const redirectTo = (location.state as any)?.redirect || '/pacient/dashboard';
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t("register.passwordMismatch"));
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError(t("register.passwordShort"));
      setLoading(false);
      return;
    }

    if (!acceptTerms) {
      setError(t("register.termsRequired"));
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            user_type: 'patient'
          },
          emailRedirectTo: `${window.location.origin}/pacient/login`
        }
      });

      if (error) throw error;

      if (data.user) {
        await supabase.from('patients').insert({
          id: data.user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          total_appointments: 0,
          no_show_count: 0,
          total_spent: 0
        });

        try {
          await fetch(`${API_URL}/api/auth/send-verification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: formData.email,
              firstName: formData.firstName
            })
          });
        } catch (err) {
          console.error('Error sending verification email:', err);
        }

        setRegisteredEmail(formData.email);
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Eroare la înregistrare');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t("register.success.title")}</h2>
            <p className="text-gray-600 mb-4">
              {t("register.success.sentTo")}
            </p>
            <p className="font-semibold text-lg text-blue-600 mb-4">{registeredEmail}</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-yellow-800">
                <strong>{t("register.success.steps")}</strong>
              </p>
              <ol className="text-sm text-yellow-700 mt-2 space-y-1 list-decimal list-inside">
                <li>{t("register.success.step1")}</li>
                <li>{t("register.success.step2")}</li>
                <li>{t("register.success.step3")}</li>
              </ol>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              {t("register.success.checkSpam")}
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate(redirectTo)} className="w-full">
                {t("register.success.continue")}
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                {t("register.success.back")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <CardTitle className="text-2xl">{t("register.title")}</CardTitle>
            <CardDescription>
              {t("register.subtitle")}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">{t("register.firstName")}</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Ion"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="lastName">{t("register.lastName")}</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Popescu"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">{t("login.email")}</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="nume@email.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">{t("register.phone")}</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0722 123 456"
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
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t("register.passwordHint")}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">{t("register.confirmPassword")}</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                />
                <label htmlFor="terms" className="text-sm text-gray-600 leading-none">
                  {t("register.acceptTerms")}{' '}
                  <Link to="/termeni" className="text-blue-600 hover:underline">
                    {t("register.terms")}
                  </Link>{' '}
                  {t("register.and")}{' '}
                  <Link to="/privacy" className="text-blue-600 hover:underline">
                    {t("register.privacy")}
                  </Link>
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("register.creating") : t("register.create")}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">{t("register.hasAccount")} </span>
              <Link 
                to="/pacient/login" 
                state={{ redirect: redirectTo }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {t("register.signIn")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
