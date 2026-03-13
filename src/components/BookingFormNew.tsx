import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, CheckCircle, AlertCircle, Loader2, Stethoscope, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { API_URL } from '@/api';
import { useLanguage } from '@/hooks/useLanguage';

const ALL_TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

const getServices = (t: (key: string) => string) => [
  { id: '1', name: t('booking.service.consultation'), duration: '30 min', price: '150 RON' },
  { id: '2', name: t('booking.service.detartraj'), duration: '45 min', price: '200 RON' },
  { id: '3', name: t('booking.service.plomba'), duration: '45 min', price: '250 RON' },
  { id: '4', name: t('booking.service.extractie'), duration: '60 min', price: '300 RON' },
  { id: '5', name: t('booking.service.albire'), duration: '90 min', price: '800 RON' },
];

const MOCK_DENTISTS = [
  { id: 'd1', first_name: 'Andrei', last_name: 'Ionescu', full_name: 'Andrei Ionescu', specialization: 'Stomatologie generală', bio: '10+ ani experienta', color_code: '#3B82F6', rating_avg: 4.8, total_reviews: 24, is_available: true },
  { id: 'd2', first_name: 'Maria', last_name: 'Popescu', full_name: 'Maria Popescu', specialization: 'Ortodonție', bio: 'Specialist Invisalign', color_code: '#10B981', rating_avg: 4.9, total_reviews: 18, is_available: true },
  { id: 'd3', first_name: 'Cristian', last_name: 'Marinescu', full_name: 'Cristian Marinescu', specialization: 'Chirurgie orală', bio: 'Expert implantologie', color_code: '#F59E0B', rating_avg: 4.7, total_reviews: 31, is_available: true }
];

interface Dentist {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  specialization: string;
  bio: string;
  color_code: string;
  rating_avg: number;
  total_reviews: number;
  is_available: boolean;
}

export default function BookingFormNew() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const services = getServices(t);
  const [step, setStep] = useState(1);
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);
  const [dentists, setDentists] = useState<Dentist[]>(MOCK_DENTISTS);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>(ALL_TIME_SLOTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuth();
    loadDentists();
  }, []);

  const checkAuth = async () => {
    setCheckingAuth(true);
    try {
      // First check session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        setCheckingAuth(false);
        return;
      }
      
      // If no session, check user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user);
      } else {
        // Only redirect if we're sure there's no user
        navigate('/pacient/login', { state: { redirect: '/rezervare' } });
      }
    } catch (err) {
      console.error('Auth check error:', err);
      navigate('/pacient/login', { state: { redirect: '/rezervare' } });
    } finally {
      setCheckingAuth(false);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setCheckingAuth(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        navigate('/pacient/login', { state: { redirect: '/rezervare' } });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadDentists = async () => {
    try {
      const baseUrl = import.meta.env.DEV ? 'http://localhost:5001' : API_URL;
      const response = await fetch(`${baseUrl}/api/dentists`);
      const data = await response.json();
      if (data.dentists?.length > 0) setDentists(data.dentists);
    } catch (err) {
      console.log('Using mock dentists');
    }
  };

  const loadSlots = async (date: Date, dentistId: string) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const baseUrl = import.meta.env.DEV ? 'http://localhost:5001' : API_URL;
      const response = await fetch(`${baseUrl}/api/available-slots?date=${dateStr}&dentist_id=${dentistId}`);
      const data = await response.json();
      setAvailableSlots(data.availableSlots || ALL_TIME_SLOTS);
    } catch (err) {
      setAvailableSlots(ALL_TIME_SLOTS);
    }
  };

  const handleDentistSelect = (dentist: Dentist) => {
    setSelectedDentist(dentist);
    setStep(2);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date || !selectedDentist) return;
    setSelectedDate(date);
    loadSlots(date, selectedDentist.id);
    setStep(3);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(4);
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setStep(5);
  };

  const handleConfirm = async () => {
    if (!selectedDentist || !selectedDate || !selectedTime || !selectedService || !user) {
      setError('Completează toate câmpurile!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const service = services.find(s => s.id === selectedService);
      
      const baseUrl = import.meta.env.DEV ? 'http://localhost:5001' : API_URL;
      const response = await fetch(`${baseUrl}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email,
          email: user.email,
          phone: user.user_metadata?.phone || '0000000000',
          date: dateStr,
          time: selectedTime,
          service: service?.name || 'Consultație',
          dentist_id: selectedDentist.id
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(true);
      } else if (result.code === 'ACCOUNT_BLOCKED') {
        setError(t('booking.accountBlocked') || 'Contul dumneavoastră este blocat din cauza anulărilor excesive. Contactați clinica.');
      } else if (result.code === 'DOUBLE_BOOKING') {
        setError(t('booking.doubleBooking') || 'Aveți deja o programare în această zi.');
      } else if (result.code === 'SLOT_TAKEN') {
        setError(t('booking.slotTaken') || 'Acest interval orar este deja rezervat. Selectați altul.');
      } else {
        setError(result.error || t('booking.error') || 'Eroare la programare');
      }
    } catch (err: any) {
      setError(t('booking.connectionError') || 'Eroare de conexiune');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (first: string, last: string) => `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
  
  const formatDate = (date: Date) => date.toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };
  
  const isSunday = (date: Date) => date.getDay() === 0;

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Se verifică autentificarea...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-600 mb-4">Trebuie să fiți autentificat pentru a face o programare.</p>
        <Button onClick={() => navigate('/pacient/login', { state: { redirect: '/rezervare' } })}>
          Mergi la Login
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="text-center py-12">
          <CardContent>
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Programare Confirmată!</h2>
            <p className="text-gray-600 mb-2">Doctor: <strong>Dr. {selectedDentist?.first_name} {selectedDentist?.last_name}</strong></p>
            <p className="text-gray-600 mb-2">Data: <strong>{selectedDate && formatDate(selectedDate)}</strong></p>
            <p className="text-gray-600 mb-2">Ora: <strong>{selectedTime}</strong></p>
            <p className="text-gray-600 mb-6">{t('booking.serviceLabel') || 'Serviciu'}: <strong>{services.find(s => s.id === selectedService)?.name}</strong></p>
            <Button onClick={() => navigate('/pacient/dashboard')} size="lg">Vezi Programările</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-6 w-6" />
              Programează-te Online
            </CardTitle>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className={`w-8 h-2 rounded-full ${s === step ? 'bg-blue-600' : s < step ? 'bg-green-500' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Select Dentist */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Alege Doctorul</h3>
              <div className="grid gap-4">
                {dentists.map((dentist) => (
                  <div
                    key={dentist.id}
                    onClick={() => handleDentistSelect(dentist)}
                    className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <Avatar className="h-16 w-16" style={{ backgroundColor: dentist.color_code }}>
                      <AvatarFallback className="text-white text-xl">
                        {getInitials(dentist.first_name, dentist.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-lg">Dr. {dentist.first_name} {dentist.last_name}</h4>
                        {dentist.rating_avg > 0 && (
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="text-sm">{dentist.rating_avg}</span>
                            <span className="text-gray-400 text-xs">({dentist.total_reviews})</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary" className="mt-1">{dentist.specialization}</Badge>
                      <p className="text-sm text-gray-500 mt-1">{dentist.bio}</p>
                    </div>
                    <div className="text-blue-600">→</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Date */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>← Înapoi la doctori</Button>
              </div>
              <h3 className="text-lg font-semibold mb-2">Alege Data</h3>
              <p className="text-gray-500 mb-4">
                Doctor selectat: <strong>Dr. {selectedDentist?.first_name} {selectedDentist?.last_name}</strong>
              </p>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate || undefined}
                  onSelect={handleDateSelect}
                  disabled={(date) => isPastDate(date) || isSunday(date)}
                  className="rounded-md border"
                />
              </div>
            </div>
          )}

          {/* Step 3: Select Time */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => setStep(2)}>← Înapoi la dată</Button>
              </div>
              <h3 className="text-lg font-semibold mb-2">Alege Ora</h3>
              <p className="text-gray-500 mb-4">
                {selectedDate && formatDate(selectedDate)}
              </p>
              <div className="grid grid-cols-4 gap-3">
                {availableSlots.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    onClick={() => handleTimeSelect(time)}
                    className="w-full"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Select Service */}
          {step === 4 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => setStep(3)}>← Înapoi la ore</Button>
              </div>
              <h3 className="text-lg font-semibold mb-4">Alege Serviciul</h3>
              <div className="grid gap-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceSelect(service.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedService === service.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{service.name}</h4>
                        <p className="text-sm text-gray-500">Durată: {service.duration}</p>
                      </div>
                      <Badge variant="secondary">{service.price}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Confirm */}
          {step === 5 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => setStep(4)}>← Înapoi la serviciu</Button>
              </div>
              <h3 className="text-lg font-semibold mb-4">Confirmă Programarea</h3>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Doctor:</span>
                  <span className="font-medium">Dr. {selectedDentist?.first_name} {selectedDentist?.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data:</span>
                  <span className="font-medium">{selectedDate && formatDate(selectedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ora:</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Serviciu:</span>
                  <span className="font-medium">{services.find(s => s.id === selectedService)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Preț:</span>
                  <span className="font-medium">{services.find(s => s.id === selectedService)?.price}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Anulează
                </Button>
                <Button 
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Se procesează...
                    </>
                  ) : (
                    'Confirmă Programarea'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
