import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { API_URL } from '@/api';
import { useLanguage } from '@/hooks/useLanguage';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const [status, setStatus] = useState<'loading' | 'confirm' | 'verifying' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState(t("verify.loading"));
  const [email, setEmail] = useState('');

  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  useEffect(() => {
    if (!token || !emailParam) {
      setStatus('error');
      setMessage(t("verify.errorMessage"));
      return;
    }

    setEmail(emailParam);
    setStatus('confirm');
    setMessage('');
  }, [token, emailParam, t]);

  const handleYesClick = async () => {
    if (!token || !email) return;
    
    setStatus('verifying');
    setMessage(t("verify.verifying"));

    try {
      const response = await fetch(
        `${API_URL}/api/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage(t("verify.successMessage"));
      } else {
        setStatus('error');
        setMessage(data.error || t("verify.errorMessage"));
      }
    } catch (err) {
      setStatus('error');
      setMessage(t("verify.errorMessage"));
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold">{t("verify.loading")}</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'confirm') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserCheck className="h-10 w-10 text-blue-600" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">{t("verify.confirmTitle")}</h2>
            <p className="text-gray-600 mb-6">
              Email: <strong>{email}</strong>
            </p>

            <Button 
              onClick={handleYesClick} 
              className="w-full text-lg py-6"
              size="lg"
            >
              {t("verify.yes")}
            </Button>

            <p className="text-xs text-gray-400 mt-6">
              {t("verify.notYou")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold">{t("verify.verifying")}</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-green-700">{t("verify.success")}</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/pacient/login')} className="w-full">
                {t("verify.goLogin")}
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                {t("verify.goHome")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-red-700">{t("verify.error")}</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="space-y-3">
            <Button onClick={() => navigate('/pacient/inregistrare')} className="w-full">
              {t("verify.createNew")}
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              {t("verify.goHome")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
