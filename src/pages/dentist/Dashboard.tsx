import { useEffect, useState, Component, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, Users, TrendingUp, LogOut, CheckCircle, XCircle, AlertCircle,
  FileText, UserCircle, ChevronLeft, ChevronRight, Phone, Mail, RefreshCw,
  Search, Filter, Stethoscope, FilePlus, ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { API_URL } from '@/api';
import { useLanguage } from '@/hooks/useLanguage';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

// Mock appointments for demo mode
const MOCK_APPOINTMENTS = [
  {
    id: 'apt-1',
    name: 'Popescu Ion',
    email: 'ion.popescu@email.ro',
    phone: '0722123456',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '09:00:00',
    service: 'Consultație',
    status: 'confirmed' as const,
    patient_total_visits: 3,
    last_diagnosis: 'Carie superficială',
    last_treatment: 'Plombă compozit'
  },
  {
    id: 'apt-2',
    name: 'Maria Georgescu',
    email: 'maria.g@email.ro',
    phone: '0722987654',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '10:00:00',
    service: 'Detartraj',
    status: 'confirmed' as const,
    patient_total_visits: 1
  },
  {
    id: 'apt-3',
    name: 'Andrei Vasilescu',
    email: 'andrei.v@email.ro',
    phone: '0722345678',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '11:00:00',
    service: 'Extracție',
    status: 'completed' as const,
    patient_total_visits: 5,
    last_diagnosis: 'Molar de minte inclus',
    last_treatment: 'Extracție chirurgicală'
  },
  {
    id: 'apt-4',
    name: 'Elena Dumitrescu',
    email: 'elena.d@email.ro',
    phone: '0722567890',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '14:00:00',
    service: 'Albire dentară',
    status: 'confirmed' as const,
    patient_total_visits: 2
  },
  {
    id: 'apt-5',
    name: 'Cristian Stan',
    email: 'cristian.s@email.ro',
    phone: '0722789012',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '15:00:00',
    service: 'Plombă',
    status: 'no_show' as const,
    patient_total_visits: 1
  }
];

interface Appointment {
  id: string;
  name: string;
  email: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
  service: string;
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  patient_total_visits?: number;
  last_diagnosis?: string;
  last_treatment?: string;
}

interface Dentist {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialization: string;
  color_code: string;
}

export default function DentistDashboard() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [dentist, setDentist] = useState<Dentist | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);
  const [medicalRecord, setMedicalRecord] = useState({
    diagnosis: '',
    treatment: '',
    notes: '',
    prescriptions: '',
    treatment_cost: ''
  });

  useEffect(() => {
    console.log('[Dashboard] Loading dentist data...');
    try {
      const stored = localStorage.getItem('dentist');
      console.log('[Dashboard] Stored dentist:', stored);
      if (!stored) {
        console.log('[Dashboard] No dentist data found, redirecting to login');
        navigate('/dentist/login');
        return;
      }
      const parsed = JSON.parse(stored);
      console.log('[Dashboard] Parsed dentist:', parsed);
      setDentist(parsed);
      setIsMockMode(localStorage.getItem('dentist_mock_mode') === 'true');
    } catch (err) {
      console.error('[Dashboard] Error loading dentist data:', err);
      localStorage.removeItem('dentist');
      navigate('/dentist/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (dentist) {
      loadData();
    }
  }, [dentist, selectedDate]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchQuery, statusFilter]);

  const loadData = async () => {
    if (!dentist) return;
    setLoading(true);

    // If in mock mode, use mock data
    if (isMockMode) {
      console.log('Using mock data');
      setAppointments(MOCK_APPOINTMENTS);
      setLoading(false);
      return;
    }

    const dateStr = selectedDate.toISOString().split('T')[0];

    try {
      const apptRes = await fetch(`${API_URL}/api/dentist/appointments?dentist_id=${dentist.id}&date=${dateStr}`);
      const apptData = await apptRes.json();
      setAppointments(apptData.appointments || []);
    } catch (err) {
      console.error('Error loading data:', err);
      // Fallback to mock data on error
      setAppointments(MOCK_APPOINTMENTS);
      setIsMockMode(true);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        (a.name?.toLowerCase().includes(query) || false) ||
        (a.email?.toLowerCase().includes(query) || false) ||
        (a.phone?.includes(query) || false) ||
        (a.service?.toLowerCase().includes(query) || false)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    setFilteredAppointments(filtered);
  };

  const handleLogout = () => {
    localStorage.removeItem('dentist');
    localStorage.removeItem('dentist_mock_mode');
    navigate('/dentist/login');
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    if (isMockMode) {
      // Update locally in mock mode
      setAppointments(prev => prev.map(a => 
        a.id === appointmentId ? { ...a, status: newStatus as any } : a
      ));
      return;
    }

    try {
      await fetch(`${API_URL}/api/dentist/appointments/${appointmentId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      loadData();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleSaveMedicalRecord = async () => {
    if (!selectedAppointment) return;

    if (isMockMode) {
      console.log('Mock save medical record:', medicalRecord);
      setSelectedAppointment(null);
      setMedicalRecord({ diagnosis: '', treatment: '', notes: '', prescriptions: '', treatment_cost: '' });
      handleStatusChange(selectedAppointment.id, 'completed');
      return;
    }

    try {
      await fetch(`${API_URL}/api/dentist/medical-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: selectedAppointment.id,
          diagnosis: medicalRecord.diagnosis,
          treatment: medicalRecord.treatment,
          notes: medicalRecord.notes,
          prescriptions: medicalRecord.prescriptions.split('\n').filter(p => p.trim()),
          treatment_cost: parseFloat(medicalRecord.treatment_cost) || 0,
        })
      });

      await handleStatusChange(selectedAppointment.id, 'completed');
      setSelectedAppointment(null);
      setMedicalRecord({ diagnosis: '', treatment: '', notes: '', prescriptions: '', treatment_cost: '' });
    } catch (err) {
      console.error('Error saving medical record:', err);
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      completed: 'bg-green-100 text-green-800 hover:bg-green-200',
      cancelled: 'bg-red-100 text-red-800 hover:bg-red-200',
      no_show: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    };
    const labels: Record<string, string> = {
      confirmed: t('dashboard.status.confirmed'),
      completed: t('dashboard.status.completed'),
      cancelled: t('dashboard.status.cancelled'),
      no_show: t('dashboard.status.no_show') || 'No-show'
    };
    return <Badge className={styles[status]}>{labels[status] || status}</Badge>;
  };

  const formatDate = (date: Date) => {
    const locale = language === 'ro' ? 'ro-RO' : 'en-US';
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Translate service names
  const translateService = (serviceName: string): string => {
    const serviceMap: Record<string, string> = {
      'Consultație': t('booking.service.consultation'),
      'Detartraj': t('booking.service.detartraj'),
      'Plombă': t('booking.service.plomba'),
      'Extracție': t('booking.service.extractie'),
      'Albire dentară': t('booking.service.albire'),
      'Implant dentar': t('booking.service.implant'),
      'Ortodonție': t('booking.service.ortodontie'),
    };
    return serviceMap[serviceName] || serviceName;
  };

  // Calculate stats from current appointments
  const stats = {
    todayCount: appointments.length,
    monthCount: 24, // Mock
    uniquePatients: 18, // Mock
    completed: appointments.filter(a => a.status === 'completed').length
  };

  if (renderError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Eroare / Error</h1>
          <p className="text-gray-700 mb-4">{renderError}</p>
          <Button onClick={() => { localStorage.removeItem('dentist'); navigate('/dentist/login'); }}>
            Înapoi la login / Back to login
          </Button>
        </div>
      </div>
    );
  }

  if (!dentist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Se încarcă... / Loading...</p>
        </div>
      </div>
    );
  }

  // Validate dentist data
  if (!dentist.first_name || !dentist.last_name) {
    console.error('Invalid dentist data:', dentist);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Eroare / Error</h1>
          <p className="text-gray-700 mb-4">Date doctor incomplete / Incomplete doctor data</p>
          <Button onClick={() => { localStorage.removeItem('dentist'); window.location.href = '/dentist/login'; }}>
            Înapoi la login / Back to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: dentist.color_code }}
              >
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Dr. {dentist.first_name} {dentist.last_name}</h1>
                <p className="text-xs text-gray-500">{dentist.specialization}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              {isMockMode && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  DEMO MODE
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                {t("nav.signOut")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t("dentist.today")}</p>
                  <p className="text-2xl font-bold">{stats.todayCount}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t("dentist.thisMonth")}</p>
                  <p className="text-2xl font-bold">{stats.monthCount}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t("dentist.uniquePatients")}</p>
                  <p className="text-2xl font-bold">{stats.uniquePatients}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t("dentist.completed")}</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Date Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => changeDate(-1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t("lang.ro") === "Română" ? "Ieri" : "Yesterday"}
              </Button>
              <div className="text-center">
                <h2 className="text-xl font-bold">{formatDate(selectedDate)}</h2>
                <p className="text-sm text-gray-500">{appointments.length} programări</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => changeDate(1)}>
                {t("lang.ro") === "Română" ? "Mâine" : "Tomorrow"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("dentist.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">{t("dentist.all")}</option>
            <option value="confirmed">{t("dashboard.status.confirmed")}</option>
            <option value="completed">{t("dashboard.status.completed")}</option>
            <option value="cancelled">{t("dashboard.status.cancelled")}</option>
            <option value="no_show">{t("dashboard.status.noShow")}</option>
          </select>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Appointments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              {t("dentist.appointments")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{t("dashboard.noAppointments")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">{t("lang.ro") === "Română" ? "Ora" : "Time"}</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">{t("lang.ro") === "Română" ? "Pacient" : "Patient"}</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">{t("lang.ro") === "Română" ? "Serviciu" : "Service"}</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">{t("location.contact")}</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">{t("lang.ro") === "Română" ? "Acțiuni" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((apt) => (
                      <tr key={apt.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">
                          {apt.appointment_time?.substring(0, 5)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <UserCircle className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium">{apt.name}</p>
                              {apt.patient_total_visits && apt.patient_total_visits > 1 && (
                                <p className="text-xs text-gray-500">
                                  {apt.patient_total_visits} {t("lang.ro") === "Română" ? "vizite" : "visits"}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{translateService(apt.service)}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col text-sm">
                            <a href={`tel:${apt.phone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {apt.phone}
                            </a>
                            <span className="text-gray-400 text-xs">{apt.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(apt.status)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {apt.status === 'confirmed' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600"
                                  onClick={() => setSelectedAppointment(apt)}
                                >
                                  <FilePlus className="h-4 w-4 mr-1" />
                                  {t("lang.ro") === "Română" ? "Fișa" : "Record"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600"
                                  onClick={() => handleStatusChange(apt.id, 'no_show')}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {apt.status === 'completed' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedAppointment(apt)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Medical Record Dialog */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">{t("dentist.medicalRecord")} - {selectedAppointment.name}</h2>
            </div>
            
            <div className="p-6 space-y-4">
              {selectedAppointment.last_diagnosis && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>{t("lang.ro") === "Română" ? "Ultimul diagnostic" : "Last diagnosis"}:</strong> {selectedAppointment.last_diagnosis}
                  </p>
                  {selectedAppointment.last_treatment && (
                    <p className="text-sm text-blue-800 mt-1">
                      <strong>{t("lang.ro") === "Română" ? "Tratament" : "Treatment"}:</strong> {selectedAppointment.last_treatment}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-medium">{t("dentist.diagnosis")}</label>
                <Input
                  value={medicalRecord.diagnosis}
                  onChange={(e) => setMedicalRecord({ ...medicalRecord, diagnosis: e.target.value })}
                  placeholder={t("lang.ro") === "Română" ? "Ex: Carie profunda molar 36" : "Ex: Deep cavity molar 36"}
                />
              </div>

              <div>
                <label className="text-sm font-medium">{t("dentist.treatment")}</label>
                <Textarea
                  value={medicalRecord.treatment}
                  onChange={(e) => setMedicalRecord({ ...medicalRecord, treatment: e.target.value })}
                  placeholder={t("lang.ro") === "Română" ? "Descrieti tratamentul efectuat..." : "Describe the treatment performed..."}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">{t("dentist.prescriptions")}</label>
                <Textarea
                  value={medicalRecord.prescriptions}
                  onChange={(e) => setMedicalRecord({ ...medicalRecord, prescriptions: e.target.value })}
                  placeholder={t("lang.ro") === "Română" ? "O rețetă per linie..." : "One prescription per line..."}
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium">{t("dentist.notes")}</label>
                <Textarea
                  value={medicalRecord.notes}
                  onChange={(e) => setMedicalRecord({ ...medicalRecord, notes: e.target.value })}
                  placeholder={t("lang.ro") === "Română" ? "Observații suplimentare..." : "Additional notes..."}
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium">{t("dentist.cost")}</label>
                <Input
                  type="number"
                  value={medicalRecord.treatment_cost}
                  onChange={(e) => setMedicalRecord({ ...medicalRecord, treatment_cost: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveMedicalRecord} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t("dentist.save")}
                </Button>
                <Button variant="outline" onClick={() => setSelectedAppointment(null)}>
                  {t("dentist.cancel")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
