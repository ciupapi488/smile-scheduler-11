import { useEffect, useState } from 'react';
import { Clock, Calendar, Plus, Trash2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getWorkingSchedule, updateWorkingDay } from '@/api';

interface WorkingDay {
  id: string;
  day_of_week: number;
  day_name: string;
  is_working: boolean;
  start_time: string;
  end_time: string;
  break_start: string;
  break_end: string;
  slot_duration: number;
}

interface ExceptionDay {
  id: string;
  exception_date: string;
  type: 'holiday' | 'vacation' | 'special_hours';
  is_working: boolean;
  note?: string;
}

const dayNames = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];

export default function AdminSchedule() {
  const [schedule, setSchedule] = useState<WorkingDay[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [editedDays, setEditedDays] = useState<Record<number, Partial<WorkingDay>>>({});

  const loadSchedule = async () => {
    setLoading(true);
    const data = await getWorkingSchedule();
    // Adăugăm numele zilelor
    const withNames = data.map((day: WorkingDay) => ({
      ...day,
      day_name: dayNames[day.day_of_week]
    }));
    setSchedule(withNames);
    setLoading(false);
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const handleDayChange = (dayOfWeek: number, field: keyof WorkingDay, value: any) => {
    setEditedDays(prev => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        [field]: value
      }
    }));
  };

  const handleSaveDay = async (day: WorkingDay) => {
    const changes = editedDays[day.day_of_week];
    if (!changes) return;

    setSaving(day.day_of_week);
    
    const result = await updateWorkingDay(day.day_of_week, {
      is_working: changes.is_working ?? day.is_working,
      start_time: changes.start_time ?? day.start_time,
      end_time: changes.end_time ?? day.end_time,
      break_start: changes.break_start ?? day.break_start,
      break_end: changes.break_end ?? day.break_end,
      slot_duration: changes.slot_duration ?? day.slot_duration,
    });

    if (result.success) {
      setEditedDays(prev => {
        const updated = { ...prev };
        delete updated[day.day_of_week];
        return updated;
      });
      loadSchedule();
    }
    
    setSaving(null);
  };

  const hasChanges = (day: WorkingDay) => {
    return !!editedDays[day.day_of_week];
  };

  const getDisplayValue = (day: WorkingDay, field: keyof WorkingDay) => {
    const edited = editedDays[day.day_of_week]?.[field];
    return edited !== undefined ? edited : day[field];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Program de Lucru</h1>
        <p className="text-muted-foreground">
          Configurează orele de lucru și zilele libere
        </p>
      </div>

      {/* Working Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ore de Lucru
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {schedule.map((day) => (
                <div 
                  key={day.id} 
                  className={`p-4 border rounded-lg transition-all ${
                    hasChanges(day) ? 'border-blue-500 bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Day Name & Toggle */}
                    <div className="flex items-center justify-between lg:w-48">
                      <span className="font-medium text-lg">{day.day_name}</span>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={getDisplayValue(day, 'is_working')}
                          onCheckedChange={(checked) => 
                            handleDayChange(day.day_of_week, 'is_working', checked)
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          {getDisplayValue(day, 'is_working') ? 'Deschis' : 'Închis'}
                        </span>
                      </div>
                    </div>

                    {/* Time Inputs */}
                    {getDisplayValue(day, 'is_working') && (
                      <>
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex-1">
                            <Label className="text-xs">Deschidere</Label>
                            <Input
                              type="time"
                              value={getDisplayValue(day, 'start_time')?.substring(0, 5)}
                              onChange={(e) => 
                                handleDayChange(day.day_of_week, 'start_time', e.target.value + ':00')
                              }
                              className="mt-1"
                            />
                          </div>
                          
                          <span className="text-muted-foreground mt-6">→</span>
                          
                          <div className="flex-1">
                            <Label className="text-xs">Închidere</Label>
                            <Input
                              type="time"
                              value={getDisplayValue(day, 'end_time')?.substring(0, 5)}
                              onChange={(e) => 
                                handleDayChange(day.day_of_week, 'end_time', e.target.value + ':00')
                              }
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex-1">
                            <Label className="text-xs">Pauză început</Label>
                            <Input
                              type="time"
                              value={getDisplayValue(day, 'break_start')?.substring(0, 5)}
                              onChange={(e) => 
                                handleDayChange(day.day_of_week, 'break_start', e.target.value + ':00')
                              }
                              className="mt-1"
                            />
                          </div>
                          
                          <span className="text-muted-foreground mt-6">→</span>
                          
                          <div className="flex-1">
                            <Label className="text-xs">Pauză sfârșit</Label>
                            <Input
                              type="time"
                              value={getDisplayValue(day, 'break_end')?.substring(0, 5)}
                              onChange={(e) => 
                                handleDayChange(day.day_of_week, 'break_end', e.target.value + ':00')
                              }
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div className="w-32">
                          <Label className="text-xs">Durată slot (min)</Label>
                          <select
                            value={getDisplayValue(day, 'slot_duration')}
                            onChange={(e) => 
                              handleDayChange(day.day_of_week, 'slot_duration', parseInt(e.target.value))
                            }
                            className="w-full mt-1 h-10 px-3 rounded-md border border-input"
                          >
                            <option value={15}>15 min</option>
                            <option value={30}>30 min</option>
                            <option value={45}>45 min</option>
                            <option value={60}>60 min</option>
                            <option value={90}>90 min</option>
                            <option value={120}>120 min</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* Save Button */}
                    {hasChanges(day) && (
                      <Button
                        size="sm"
                        onClick={() => handleSaveDay(day)}
                        disabled={saving === day.day_of_week}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        {saving === day.day_of_week ? 'Salvare...' : 'Salvează'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exception Days */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Zile Excepție (Concedii, Sărbători)
          </CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Adaugă Zi Excepție
          </Button>
        </CardHeader>
        <CardContent>
          {exceptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nu există zile excepție configurate</p>
              <p className="text-sm">Adaugă concedii sau zile libere aici</p>
            </div>
          ) : (
            <div className="space-y-2">
              {exceptions.map((exception) => (
                <div
                  key={exception.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {new Date(exception.exception_date).toLocaleDateString('ro-RO', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      {exception.note && (
                        <p className="text-sm text-muted-foreground">{exception.note}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={exception.is_working ? 'default' : 'secondary'}>
                      {exception.is_working ? 'Ore speciale' : 'Închis'}
                    </Badge>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 Informații</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Modificările se aplică imediat pentru noile programări</li>
            <li>• Programările existente nu sunt afectate de modificări</li>
            <li>• Zilele excepție au prioritate față de programul normal</li>
            <li>• Durata slotului afectează intervalul dintre programări</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
