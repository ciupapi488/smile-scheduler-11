import { useEffect, useState } from 'react';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getDashboardData, DashboardStats, Appointment, OccupancyData } from '@/api';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
};

function StatCard({ title, value, description, icon, color = 'blue' }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-2">{value}</h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    confirmed: { variant: 'default', label: 'Confirmată' },
    pending: { variant: 'secondary', label: 'În așteptare' },
    completed: { variant: 'default', label: 'Finalizată' },
    cancelled: { variant: 'destructive', label: 'Anulată' },
    no_show: { variant: 'outline', label: 'No-show' },
  };
  
  const config = variants[status || 'confirmed'];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Simple bar chart component
function OccupancyChart({ data }: { data: OccupancyData[] }) {
  const maxValue = Math.max(...data.map(d => d.booked + d.available), 1);
  
  return (
    <div className="space-y-3">
      {data.map((day, idx) => {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('ro-RO', { weekday: 'short' });
        const dayDate = date.getDate();
        const total = day.booked + day.available;
        const occupancyRate = total > 0 ? (day.booked / total) * 100 : 0;
        
        return (
          <div key={day.date} className="flex items-center gap-3">
            <div className="w-12 text-sm text-muted-foreground">
              {dayName} {dayDate}
            </div>
            <div className="flex-1">
              <div className="h-8 bg-gray-100 rounded-md overflow-hidden flex">
                <div 
                  className="bg-primary transition-all duration-500"
                  style={{ width: `${(day.booked / maxValue) * 100}%` }}
                />
                <div 
                  className="bg-gray-200 transition-all duration-500"
                  style={{ width: `${(day.available / maxValue) * 100}%` }}
                />
              </div>
            </div>
            <div className="w-16 text-right text-sm">
              <span className="font-medium">{Math.round(occupancyRate)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [occupancyChart, setOccupancyChart] = useState<OccupancyData[]>([]);

  const loadDashboardData = async () => {
    setLoading(true);
    const data = await getDashboardData();
    setStats(data.stats);
    setTodayAppointments(data.todayAppointments);
    setOccupancyChart(data.occupancyChart);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview și statistici pentru azi, {new Date().toLocaleDateString('ro-RO', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadDashboardData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reîmprospătează
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Programări Azi"
          value={stats?.today_count || 0}
          description={`${stats?.tomorrow_count || 0} programări mâine`}
          icon={<Calendar className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="Pacienți Noi (Luna)"
          value={stats?.new_patients || 0}
          description="Total pacienți noi"
          icon={<Users className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          title="Venituri Estimate (Luna)"
          value={formatCurrency(stats?.month_revenue || 0)}
          description={`${stats?.month_count || 0} programări`}
          icon={<DollarSign className="h-5 w-5" />}
          color="purple"
        />
        <StatCard
          title="Programări Săptămână"
          value={stats?.week_count || 0}
          description="Această săptămână"
          icon={<TrendingUp className="h-5 w-5" />}
          color="yellow"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Programări Azi
              <Badge variant="secondary" className="ml-2">
                {todayAppointments.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nu există programări pentru azi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <div className="text-lg font-bold">
                          {appointment.appointment_time?.substring(0, 5)}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">{appointment.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.service} • {appointment.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={appointment.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Occupancy Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ocupare (7 zile)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OccupancyChart data={occupancyChart} />
            <div className="flex items-center justify-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded" />
                <span>Ocupat</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-200 rounded" />
                <span>Liber</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-lg text-white">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">Confirmări Rapide</h4>
                <p className="text-sm text-blue-700">
                  {todayAppointments.filter(a => a.status === 'pending').length} programări în așteptare
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-lg text-white">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-green-900">Sloturi Libere Azi</h4>
                <p className="text-sm text-green-700">
                  Verifică disponibilitatea
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500 rounded-lg text-white">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-red-900">Anulări</h4>
                <p className="text-sm text-red-700">
                  {todayAppointments.filter(a => a.status === 'cancelled').length} anulări azi
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
