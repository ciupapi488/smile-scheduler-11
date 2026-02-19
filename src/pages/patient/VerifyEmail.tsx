import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Se verifică email-ul...');

  useEffect(() => {
    verifyEmail();
  }, []);

  const verifyEmail = async () => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (!token || type !== 'signup') {
      setStatus('error');
      setMessage('Link invalid sau expirat.');
      return;
    }

    try {
      // The verification is handled automatically by Supabase when the link is clicked
      // But we can verify the session was created
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        setStatus('error');
        setMessage('Nu s-a putut verifica email-ul. Link-ul poate fi expirat.');
        return;
      }

      setStatus('success');
      setMessage('Email verificat cu succes! Contul dumneavoastră este acum activ.');
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/pacient/dashboard');
      }, 3000);
    } catch (error) {
      setStatus('error');
      setMessage('A apărut o eroare. Vă rugăm să încercați din nou.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {status === 'verifying' && (
            <>
              <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold mb-2">Se verifică...</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2 text-green-700">Email Verificat!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500">Veți fi redirecționat automat...</p>
              <Button className="mt-4" onClick={() => navigate('/pacient/dashboard')}>
                Continuă către Dashboard
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2 text-red-700">Eroare</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-2">
                <Button onClick={() => navigate('/pacient/login')}>
                  Mergi la Login
                </Button>
                <Button variant="outline" onClick={() => navigate('/pacient/inregistrare')}>
                  Încearcă din nou
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
