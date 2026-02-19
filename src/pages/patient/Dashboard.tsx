import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  User,
  LogOut,
  XCircle,
  RefreshCw,
  Download,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { API_URL } from '@/api';
import { useLanguage } from '@/hooks/useLanguage';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  service: string;
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  price?: number;
  notes?: string;
}

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      await checkUser();
    };
    init();
  }, []);

  const checkUser = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        navigate('/pacient/login');
        return;
      }

      setUser({
        id: user.id,
        email: user.email || '',
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        phone: user.user_metadata?.phone || ''
      });

      await loadAppointments(user.email || '');
    } catch (err) {
      console.error('Error checking user:', err);
      setError(t("dashboard.loading"));
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async (userEmail: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/appointments?limit=100`);
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      
      const userAppointments = (data.appointments || []).filter(
        (apt: any) => apt.email === userEmail
      );
      
      setAppointments(userAppointments);
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError(t("dashboard.loading"));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleCancel = async (appointmentId: string) => {
    if (!confirm(t("dashboard.cancel") + '?')) return;

    setCancelling(appointmentId);
    try {
      const response = await fetch(`${API_URL}/api/admin/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Anulat de pacient' })
      });

      if (response.ok) {
        if (user?.email) {
          await loadAppointments(user.email);
        }
      } else {
        setError(t("dashboard.cancel"));
      }
    } catch (err) {
      setError(t("dashboard.cancel"));
    }
    setCancelling(null);
  };

  const downloadICS = (appointment: Appointment) => {
    const startDate = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const endDate = new Date(startDate.getTime() + 60 * 60000);
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${t("dashboard.title")} - ${appointment.service}
DESCRIPTION:${t("hero.title")}
LOCATION:Strada Caracal 29, Cluj-Napoca
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'programare.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  const upcomingAppointments = appointments.filter(
    apt => new Date(apt.appointment_date) >= new Date() && apt.status !== 'cancelled'
  );

  const pastAppointments = appointments.filter(
    apt => new Date(apt.appointment_date) < new Date() || apt.status === 'cancelled'
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-gray-100 text-gray-800'
    };
    return <Badge className={styles[status]}>{t(`dashboard.status.${status}`)}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("dashboard.loading")}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{t("dashboard.notAuthenticated")}</p>
          <Button onClick={() => navigate('/pacient/login')}>
            {t("dashboard.goToLogin")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">L</span>
              </div>
              <span className="font-bold text-xl">{t("hero.title")}</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <span className="text-sm text-gray-600 hidden sm:block">
                {user?.first_name} {user?.last_name}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                {t("nav.signOut")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Profile */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-10 w-10 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold">
                    {user?.first_name} {user?.last_name}
                  </h2>
                  <p className="text-gray-500 text-sm">{user?.email}</p>
                  <p className="text-gray-500 text-sm">{user?.phone}</p>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t("dashboard.total")}</span>
                    <span className="font-semibold">{appointments.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t("dashboard.future")}</span>
                    <span className="font-semibold">{upcomingAppointments.length}</span>
                  </div>
                </div>

                <Button className="w-full mt-6" asChild>
                  <Link to="/rezervare">
                    <Calendar className="h-4 w-4 mr-2" />
                    {t("hero.cta")}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Contact */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm font-medium">{t("dashboard.contact")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a href="tel:0722123456" className="flex items-center gap-3 text-sm hover:text-blue-600">
                  <Phone className="h-4 w-4" />
                  0722 123 456
                </a>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <span>{t("location.street")}, {t("location.city")}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Appointments */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t("dashboard.upcoming")}
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => user?.email && loadAppointments(user.email)}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>{t("dashboard.noAppointments")}</p>
                    <Button className="mt-4" asChild>
                      <Link to="/rezervare">{t("dashboard.bookNow")}</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments.map((apt) => (
                      <div key={apt.id} className="border rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="bg-blue-100 rounded-lg p-3 text-center min-w-[70px]">
                              <div className="text-xs text-blue-600 uppercase">
                                {new Date(apt.appointment_date).toLocaleDateString(t("lang.ro") === "Română" ? 'ro-RO' : 'en-US', { month: 'short' })}
                              </div>
                              <div className="text-xl font-bold text-blue-700">
                                {new Date(apt.appointment_date).getDate()}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="font-semibold">
                                  {apt.appointment_time?.substring(0, 5)}
                                </span>
                                {getStatusBadge(apt.status)}
                              </div>
                              <p className="font-medium mt-1">{apt.service}</p>
                              {apt.price && (
                                <p className="text-sm text-green-600">{apt.price} RON</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => downloadICS(apt)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              {t("dashboard.calendar")}
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleCancel(apt.id)}
                              disabled={cancelling === apt.id}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              {cancelling === apt.id ? t("dashboard.loading") : t("dashboard.cancel")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
