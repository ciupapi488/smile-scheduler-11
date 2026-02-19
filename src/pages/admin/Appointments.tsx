import { useEffect, useState } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Clock,
  Phone,
  Mail,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getAdminAppointments, updateAppointmentStatus, deleteAppointment, Appointment } from '@/api';

const statusOptions = [
  { value: 'all', label: 'Toate' },
  { value: 'confirmed', label: 'Confirmate' },
  { value: 'pending', label: 'În așteptare' },
  { value: 'completed', label: 'Finalizate' },
  { value: 'cancelled', label: 'Anulate' },
  { value: 'no_show', label: 'No-show' },
];

function StatusBadge({ status }: { status?: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    confirmed: { className: 'bg-blue-100 text-blue-800 hover:bg-blue-100', label: 'Confirmată' },
    pending: { className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100', label: 'În așteptare' },
    completed: { className: 'bg-green-100 text-green-800 hover:bg-green-100', label: 'Finalizată' },
    cancelled: { className: 'bg-red-100 text-red-800 hover:bg-red-100', label: 'Anulată' },
    no_show: { className: 'bg-gray-100 text-gray-800 hover:bg-gray-100', label: 'No-show' },
  };
  
  const config = variants[status || 'confirmed'];
  return (
    <Badge className={config.className} variant="secondary">
      {config.label}
    </Badge>
  );
}

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const loadAppointments = async () => {
    setLoading(true);
    const filters: { status?: string; page: number; limit: number } = {
      page: pagination.page,
      limit: pagination.limit
    };
    
    if (statusFilter !== 'all') {
      filters.status = statusFilter;
    }
    
    const data = await getAdminAppointments(filters);
    setAppointments(data.appointments);
    setPagination(data.pagination);
    setLoading(false);
  };

  useEffect(() => {
    loadAppointments();
  }, [statusFilter, pagination.page]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const result = await updateAppointmentStatus(id, newStatus);
    if (result.success) {
      loadAppointments();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Ești sigur că vrei să ștergi această programare?')) {
      const result = await deleteAppointment(id);
      if (result.success) {
        loadAppointments();
      }
    }
  };

  const filteredAppointments = appointments.filter(apt => 
    apt.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.phone?.includes(searchQuery) ||
    apt.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Programări</h1>
          <p className="text-muted-foreground">
            Gestionare programări pacienți
          </p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Programare Nouă
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută după nume, telefon sau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Listă Programări 
            <span className="text-muted-foreground font-normal ml-2">
              ({filteredAppointments.length} rezultate)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nu există programări</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Date & Time */}
                    <div className="text-center min-w-[80px] p-2 bg-gray-100 rounded-lg">
                      <div className="text-xs text-muted-foreground uppercase">
                        {new Date(appointment.appointment_date).toLocaleDateString('ro-RO', { month: 'short' })}
                      </div>
                      <div className="text-xl font-bold">
                        {new Date(appointment.appointment_date).getDate()}
                      </div>
                      <div className="text-xs font-medium">
                        {appointment.appointment_time?.substring(0, 5)}
                      </div>
                    </div>

                    {/* Patient Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{appointment.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Phone className="h-3 w-3" />
                        {appointment.phone}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {appointment.service}
                        </Badge>
                        {appointment.price && (
                          <span className="text-xs text-green-600">
                            {appointment.price} RON
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <StatusBadge status={appointment.status} />
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedAppointment(appointment)}
                        >
                          Detalii
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Detalii Programare</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-muted-foreground">Pacient</label>
                              <p className="font-medium">{appointment.name}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Telefon</label>
                              <p>{appointment.phone}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Email</label>
                              <p>{appointment.email || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Data & Ora</label>
                              <p>{formatDate(appointment.appointment_date)} la {appointment.appointment_time?.substring(0, 5)}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Serviciu</label>
                              <p>{appointment.service}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Status</label>
                              <div className="mt-1">
                                <StatusBadge status={appointment.status} />
                              </div>
                            </div>
                          </div>
                          
                          {appointment.notes && (
                            <div>
                              <label className="text-sm text-muted-foreground">Notițe</label>
                              <p className="text-sm mt-1 p-2 bg-gray-50 rounded">
                                {appointment.notes}
                              </p>
                            </div>
                          )}

                          {appointment.cancellation_reason && (
                            <div>
                              <label className="text-sm text-muted-foreground">Motiv anulare</label>
                              <p className="text-sm mt-1 p-2 bg-red-50 text-red-700 rounded">
                                {appointment.cancellation_reason}
                              </p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {appointment.status !== 'confirmed' && appointment.status !== 'cancelled' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, 'confirmed')}>
                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            Confirmă
                          </DropdownMenuItem>
                        )}
                        {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, 'completed')}>
                            <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                            Marchează finalizată
                          </DropdownMenuItem>
                        )}
                        {appointment.status !== 'cancelled' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, 'cancelled')}>
                            <XCircle className="h-4 w-4 mr-2 text-red-600" />
                            Anulează
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Editează
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(appointment.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Șterge
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
