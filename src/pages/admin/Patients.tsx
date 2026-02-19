import { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  Calendar,
  TrendingUp,
  AlertCircle,
  User,
  FileText,
  Plus,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { getAdminAppointments } from '@/api';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  allergies?: string;
  medical_notes?: string;
  total_appointments: number;
  no_show_count: number;
  last_visit?: string;
  total_spent: number;
  created_at: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  service: string;
  status: string;
  price?: number;
  notes?: string;
}

const statusColors: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-gray-100 text-gray-800',
};

export default function AdminPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Load patients from appointments (since we don't have a direct patients API yet)
  const loadPatients = async () => {
    setLoading(true);
    try {
      // Get all appointments to extract unique patients
      const data = await getAdminAppointments({ limit: 1000 });
      
      // Create a map of unique patients from appointments
      const patientMap = new Map<string, Patient>();
      
      data.appointments.forEach((apt: any) => {
        const key = apt.email || apt.phone;
        if (!patientMap.has(key)) {
          patientMap.set(key, {
            id: apt.patient_id || apt.id,
            first_name: apt.name?.split(' ')[0] || apt.name,
            last_name: apt.name?.split(' ').slice(1).join(' ') || '',
            email: apt.email,
            phone: apt.phone,
            total_appointments: 1,
            no_show_count: apt.status === 'no_show' ? 1 : 0,
            last_visit: apt.appointment_date,
            total_spent: apt.price || 0,
            created_at: apt.created_at,
          });
        } else {
          const patient = patientMap.get(key)!;
          patient.total_appointments++;
          if (apt.status === 'no_show') patient.no_show_count++;
          if (apt.appointment_date > (patient.last_visit || '')) {
            patient.last_visit = apt.appointment_date;
          }
          patient.total_spent += apt.price || 0;
        }
      });
      
      const patientList = Array.from(patientMap.values());
      setPatients(patientList);
      setPagination({
        ...pagination,
        total: patientList.length,
        totalPages: Math.ceil(patientList.length / pagination.limit)
      });
      
      // Also save appointments for later use
      setAppointments(data.appointments);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleViewDetails = async (patient: Patient) => {
    setSelectedPatient(patient);
    setLoadingDetails(true);
    
    // Filter appointments for this patient
    const patientApts = appointments.filter(apt => 
      apt.email === patient.email || apt.phone === patient.phone
    );
    
    setPatientAppointments(patientApts);
    setLoadingDetails(false);
  };

  const filteredPatients = patients.filter(patient => 
    patient.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone?.includes(searchQuery) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedPatients = filteredPatients.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  );

  const getInitials = (patient: Patient) => {
    return `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`.toUpperCase();
  };

  const getNoShowRate = (patient: Patient) => {
    if (patient.total_appointments === 0) return 0;
    return Math.round((patient.no_show_count / patient.total_appointments) * 100);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacienți</h1>
          <p className="text-muted-foreground">
            Gestionare bază de date pacienți
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Pacient Nou
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pacienți</p>
                <h3 className="text-2xl font-bold">{patients.length}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pacienți Noi (Luna)</p>
                <h3 className="text-2xl font-bold">
                  {patients.filter(p => {
                    const created = new Date(p.created_at);
                    const now = new Date();
                    return created.getMonth() === now.getMonth() && 
                           created.getFullYear() === now.getFullYear();
                  }).length}
                </h3>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">No-Show Rate Mediu</p>
                <h3 className="text-2xl font-bold">
                  {patients.length > 0 
                    ? Math.round(patients.reduce((acc, p) => acc + getNoShowRate(p), 0) / patients.length)
                    : 0}%
                </h3>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Venit Total</p>
                <h3 className="text-2xl font-bold">
                  {patients.reduce((acc, p) => acc + p.total_spent, 0).toLocaleString('ro-RO')} RON
                </h3>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută după nume, telefon sau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Listă Pacienți
            <span className="text-muted-foreground font-normal ml-2">
              ({filteredPatients.length} rezultate)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : paginatedPatients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nu există pacienți</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleViewDetails(patient)}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getInitials(patient)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <p className="font-medium text-lg">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {patient.phone}
                        </span>
                        {patient.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {patient.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Programări</p>
                      <p className="font-semibold">{patient.total_appointments}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">No-Shows</p>
                      <p className={`font-semibold ${getNoShowRate(patient) > 20 ? 'text-red-600' : ''}`}>
                        {getNoShowRate(patient)}%
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Cheltuit</p>
                      <p className="font-semibold text-green-600">
                        {patient.total_spent.toLocaleString('ro-RO')} RON
                      </p>
                    </div>

                    <Button variant="ghost" size="sm">
                      Detalii
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Pagina {pagination.page} din {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
              >
                Următor
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Details Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fișă Pacient</DialogTitle>
          </DialogHeader>
          
          {selectedPatient && (
            <Tabs defaultValue="info" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Informații</TabsTrigger>
                <TabsTrigger value="history">Istoric Programări</TabsTrigger>
                <TabsTrigger value="medical">Date Medicale</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                      {getInitials(selectedPatient)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </h3>
                    <p className="text-muted-foreground">
                      Pacient din {new Date(selectedPatient.created_at).toLocaleDateString('ro-RO')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-muted-foreground">Telefon</label>
                      <p className="font-medium">{selectedPatient.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Email</label>
                      <p className="font-medium">{selectedPatient.email || '-'}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-muted-foreground">Total Programări</label>
                      <p className="font-medium">{selectedPatient.total_appointments}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Ultima Vizită</label>
                      <p className="font-medium">
                        {selectedPatient.last_visit 
                          ? new Date(selectedPatient.last_visit).toLocaleDateString('ro-RO')
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3">Statistici</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedPatient.total_appointments}
                      </p>
                      <p className="text-sm text-muted-foreground">Programări</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${getNoShowRate(selectedPatient) > 20 ? 'text-red-600' : 'text-green-600'}`}>
                        {getNoShowRate(selectedPatient)}%
                      </p>
                      <p className="text-sm text-muted-foreground">No-Show Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {selectedPatient.total_spent.toLocaleString('ro-RO')} RON
                      </p>
                      <p className="text-sm text-muted-foreground">Total Cheltuit</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                {loadingDetails ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : patientAppointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nu există programări</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {patientAppointments.map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {new Date(apt.appointment_date).toLocaleDateString('ro-RO')} 
                            {' '}la {apt.appointment_time?.substring(0, 5)}
                          </p>
                          <p className="text-sm text-muted-foreground">{apt.service}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {apt.price && (
                            <span className="text-sm font-medium text-green-600">
                              {apt.price} RON
                            </span>
                          )}
                          <Badge className={statusColors[apt.status] || 'bg-gray-100'}>
                            {apt.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="medical" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Alergii</label>
                    <div className="p-3 bg-gray-50 rounded-lg mt-1">
                      <p>{selectedPatient.allergies || 'Nu sunt înregistrate alergii'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground">Notițe Medicale</label>
                    <div className="p-3 bg-gray-50 rounded-lg mt-1">
                      <p>{selectedPatient.medical_notes || 'Nu există notițe medicale'}</p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>⚠️ Notă:</strong> Aceste informații sunt confidențiale și 
                      ar trebui accesate doar de personalul medical autorizat.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
