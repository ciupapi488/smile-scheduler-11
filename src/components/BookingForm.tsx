import { useState, useEffect, useCallback } from 'react';
import { 
  getAvailableSlots, 
  createAppointmentViaBackend 
} from '../api.ts';

interface FormData {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  service: string;
}

const ALL_TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

export default function BookingForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    service: 'Consultație'
  });
  
  const [availableSlots, setAvailableSlots] = useState<string[]>(ALL_TIME_SLOTS); // Presupunem toate libere la început
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // ============================================
  // Încărcare sloturi
  // ============================================
  const loadSlots = useCallback(async (date: string) => {
    if (!date) return;
    
    console.log('📡 Încărcare sloturi pentru:', date);
    
    try {
      const slots = await getAvailableSlots(date);
      console.log('✅ Sloturi primite:', slots);
      
      setAvailableSlots(slots);
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Eroare:', error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (formData.date) {
      setIsLoading(true);
      loadSlots(formData.date);
    }
  }, [formData.date, loadSlots]);

  useEffect(() => {
    if (!formData.date) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Reîncărcare automată...');
      loadSlots(formData.date);
    }, 3000);

    return () => clearInterval(interval);
  }, [formData.date, loadSlots]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setStatus(null);
  };

  const handleTimeSelect = (time: string) => {
    if (!availableSlots.includes(time)) return;
    setFormData(prev => ({ ...prev, time }));
    setStatus(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: 'info', message: 'Se procesează programarea...' });
    
    if (!formData.name || !formData.email || !formData.phone || !formData.date || !formData.time) {
      setStatus({ type: 'error', message: 'Toate câmpurile sunt obligatorii!' });
      setLoading(false);
      return;
    }

    try {
      const result = await createAppointmentViaBackend(formData);
      
      if (result.success) {
        setStatus({ type: 'success', message: '✅ Programare confirmată!' });
        await loadSlots(formData.date);
        setFormData({ name: '', email: '', phone: '', date: '', time: '', service: 'Consultație' });
        setAvailableSlots(ALL_TIME_SLOTS);
      } else {
        if (result.clearDateTime) {
          setFormData(prev => ({ ...prev, date: '', time: '' }));
          setAvailableSlots(ALL_TIME_SLOTS);
        }
        setStatus({ type: 'error', message: '❌ ' + (result.error || 'Eroare') });
      }
    } catch (error) {
      setStatus({ type: 'error', message: '❌ Eroare de conexiune.' });
    } finally {
      setLoading(false);
    }
  };

  const getNext30Days = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ro-RO', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center' }}>Programează-te Online</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Nume */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
            Nume complet: *
          </label>
          <input 
            type="text" name="name" value={formData.name}
            onChange={handleChange} required
            placeholder="Ex: Popescu Maria"
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
            Email: *
          </label>
          <input 
            type="email" name="email" value={formData.email}
            onChange={handleChange} required
            placeholder="Ex: maria@email.com"
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
          />
        </div>

        {/* Telefon */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
            Telefon: *
          </label>
          <input 
            type="tel" name="phone" value={formData.phone}
            onChange={handleChange} required
            placeholder="Ex: 0722 123 456"
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
          />
        </div>

        {/* Data */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
            Alege data: *
          </label>
          <select 
            name="date" value={formData.date}
            onChange={handleChange} required
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
          >
            <option value="">Selectează data</option>
            {getNext30Days().map(date => (
              <option key={date} value={date}>{formatDate(date)}</option>
            ))}
          </select>
        </div>

        {/* Ore */}
        {formData.date && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 500 }}>
              Alege ora: * 
              {!isLoading && (
                <span style={{ fontSize: '13px', color: '#28a745', marginLeft: '8px' }}>
                  ({availableSlots.length}/{ALL_TIME_SLOTS.length} libere)
                </span>
              )}
            </label>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {ALL_TIME_SLOTS.map(slot => {
                const isAvailable = availableSlots.includes(slot);
                const isSelected = formData.time === slot;
                
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleTimeSelect(slot)}
                    disabled={!isAvailable}
                    style={{
                      padding: '12px',
                      backgroundColor: isSelected ? '#007bff' : (isAvailable ? '#f8f9fa' : '#ffcdd2'),
                      color: isSelected ? 'white' : (isAvailable ? '#333' : '#b71c1c'),
                      border: '2px solid ' + (isSelected ? '#007bff' : (isAvailable ? '#dee2e6' : '#ef9a9a')),
                      borderRadius: '8px',
                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      textDecoration: isAvailable ? 'none' : 'line-through',
                      opacity: isAvailable ? 1 : 0.6,
                      position: 'relative'
                    }}
                  >
                    {slot}
                    {!isAvailable && (
                      <span style={{
                        position: 'absolute',
                        top: '2px',
                        right: '4px',
                        fontSize: '10px',
                        color: '#b71c1c'
                      }}>
                        ✕
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Serviciu */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
            Serviciu:
          </label>
          <select 
            name="service" value={formData.service}
            onChange={handleChange}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
          >
            <option value="Consultație">Consultație</option>
            <option value="Detartraj">Detartraj</option>
            <option value="Plombă">Plombă</option>
            <option value="Extracție">Extracție</option>
            <option value="Albire">Albire dentară</option>
          </select>
        </div>

        {/* Buton submit */}
        <button 
          type="submit" 
          disabled={!formData.time || loading}
          style={{ 
            width: '100%', 
            padding: '14px', 
            backgroundColor: (!formData.time || loading) ? '#ccc' : '#007bff', 
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: (!formData.time || loading) ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {loading ? '⏳ Se procesează...' : '📅 Confirmă Programarea'}
        </button>
      </form>

      {/* Status */}
      {status && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: status.type === 'success' ? '#d4edda' : '#f8d7da',
          borderRadius: '8px',
          color: status.type === 'success' ? '#155724' : '#721c24'
        }}>
          {status.message}
        </div>
      )}
    </div>
  );
}
