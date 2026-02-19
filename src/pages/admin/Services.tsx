import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Clock, DollarSign, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { getServices, createService, updateService, deleteService } from '@/api';

interface Service {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  base_price?: number;
  color: string;
  is_active: boolean;
  sort_order: number;
}

const colorOptions = [
  '#007bff', '#28a745', '#ffc107', '#dc3545', 
  '#6f42c1', '#fd7e14', '#20c997', '#6c757d',
  '#e83e8c', '#17a2b8'
];

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    base_price: '',
    color: '#007bff',
    sort_order: 0
  });

  const loadServices = async () => {
    setLoading(true);
    const data = await getServices(false);
    setServices(data);
    setLoading(false);
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name: formData.name,
      description: formData.description,
      duration_minutes: parseInt(String(formData.duration_minutes)),
      base_price: formData.base_price ? parseFloat(formData.base_price) : undefined,
      color: formData.color,
      sort_order: formData.sort_order
    };

    let result;
    if (editingService) {
      result = await updateService(editingService.id, payload);
    } else {
      result = await createService(payload);
    }

    if (result.success) {
      setIsDialogOpen(false);
      setEditingService(null);
      resetForm();
      loadServices();
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      base_price: service.base_price?.toString() || '',
      color: service.color,
      sort_order: service.sort_order
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingService) return;
    
    const result = await deleteService(deletingService.id);
    if (result.success) {
      setDeletingService(null);
      loadServices();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration_minutes: 60,
      base_price: '',
      color: '#007bff',
      sort_order: 0
    });
  };

  const handleAddNew = () => {
    setEditingService(null);
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Servicii</h1>
          <p className="text-muted-foreground">
            Gestionare servicii și tarife
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Serviciu Nou
        </Button>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-48">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Card 
              key={service.id} 
              className={`relative overflow-hidden ${!service.is_active ? 'opacity-60' : ''}`}
            >
              {/* Color Strip */}
              <div 
                className="h-1.5 w-full"
                style={{ backgroundColor: service.color }}
              />
              
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{service.name}</h3>
                      {!service.is_active && (
                        <Badge variant="secondary">Inactiv</Badge>
                      )}
                    </div>
                    
                    {service.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {service.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{service.duration_minutes} min</span>
                      </div>
                      
                      {service.base_price && (
                        <div className="flex items-center gap-1.5 text-sm">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-green-600">
                            {service.base_price} RON
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(service)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingService(service)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Editează Serviciu' : 'Serviciu Nou'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nume serviciu *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Consultație"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descriere</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descriere scurtă"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Durată (minute) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min={15}
                  step={15}
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="price">Preț (RON)</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <Label>Culoare</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color ? 'border-gray-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Anulează
              </Button>
              <Button type="submit">
                {editingService ? 'Salvează' : 'Creează'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingService} onOpenChange={() => setDeletingService(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ești sigur?</AlertDialogTitle>
            <AlertDialogDescription>
              Serviciul "{deletingService?.name}" va fi dezactivat. 
              Programările existente nu vor fi afectate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">
              Dezactivează
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
