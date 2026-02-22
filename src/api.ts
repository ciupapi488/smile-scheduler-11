// ============================================
// API Configuration
// ============================================
// Use relative URL in development (goes through Vite proxy)
// Use env variable in production
export const API_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_BACKEND_URL || '');

// ============================================
// Types
// ============================================
export interface Appointment {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  appointment_date: string;
  appointment_time: string;
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  price?: number;
}

export interface Dentist {
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

// ============================================
// API Functions
// ============================================

export const getDentists = async (): Promise<Dentist[]> => {
  const response = await fetch(`${API_URL}/api/dentists`);
  const data = await response.json();
  return data.dentists || [];
};

export const getAvailableSlots = async (date: string, dentistId?: string): Promise<string[]> => {
  const url = new URL(`${API_URL}/api/available-slots`);
  url.searchParams.append('date', date);
  if (dentistId) url.searchParams.append('dentist_id', dentistId);
  
  const response = await fetch(url);
  const data = await response.json();
  return data.availableSlots || [];
};

export const createAppointment = async (payload: {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  service: string;
  dentist_id?: string;
}): Promise<{ success: boolean; error?: string }> => {
  const response = await fetch(`${API_URL}/api/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    return { success: false, error: data.error || 'Eroare la programare' };
  }
  
  return { success: true };
};

// Admin APIs
export const getAdminAppointments = async (): Promise<Appointment[]> => {
  const response = await fetch(`${API_URL}/api/admin/appointments`);
  const data = await response.json();
  return data.appointments || [];
};

export const updateAppointmentStatus = async (
  id: string, 
  status: string
): Promise<boolean> => {
  const response = await fetch(`${API_URL}/api/admin/appointments/${id}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return response.ok;
};

export const deleteAppointment = async (id: string): Promise<boolean> => {
  const response = await fetch(`${API_URL}/api/admin/appointments/${id}`, {
    method: 'DELETE',
  });
  return response.ok;
};

// Services management
export interface Service {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  base_price?: number;
  color?: string;
  is_active: boolean;
}

export const getServices = async (): Promise<Service[]> => {
  const response = await fetch(`${API_URL}/api/admin/services`);
  const data = await response.json();
  return data || [];
};

export const createService = async (service: Partial<Service>): Promise<boolean> => {
  const response = await fetch(`${API_URL}/api/admin/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(service),
  });
  return response.ok;
};

export const updateService = async (id: string, updates: Partial<Service>): Promise<boolean> => {
  const response = await fetch(`${API_URL}/api/admin/services/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return response.ok;
};

export const deleteService = async (id: string): Promise<boolean> => {
  const response = await fetch(`${API_URL}/api/admin/services/${id}`, {
    method: 'DELETE',
  });
  return response.ok;
};

// Schedule management
export interface WorkingDay {
  day_of_week: number;
  day_name: string;
  is_working: boolean;
  start_time: string;
  end_time: string;
}

export const getWorkingSchedule = async (): Promise<WorkingDay[]> => {
  const response = await fetch(`${API_URL}/api/admin/schedule`);
  const data = await response.json();
  return data || [];
};

export const updateWorkingDay = async (
  dayOfWeek: number, 
  updates: Partial<WorkingDay>
): Promise<boolean> => {
  const response = await fetch(`${API_URL}/api/admin/schedule/${dayOfWeek}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return response.ok;
};

// AI Symptom Checker
export interface SymptomCheckResult {
  urgency: string;
  possibleCause: string;
  recommendedService: string;
  confidence: number;
  color: 'red' | 'orange' | 'blue';
}

export const checkSymptoms = async (symptoms: string, language: string = 'ro'): Promise<SymptomCheckResult> => {
  const response = await fetch(`${API_URL}/api/ai/symptom-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symptoms, language }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Error analyzing symptoms');
  }
  
  return data;
};

// Dashboard stats (simplified)
export interface DashboardStats {
  today_count: number;
  tomorrow_count: number;
  week_count: number;
  month_count: number;
}

export interface OccupancyData {
  date: string;
  booked: number;
  available: number;
  occupancyRate: number;
}

export const getDashboardData = async (): Promise<{
  stats: DashboardStats;
  todayAppointments: Appointment[];
  occupancyChart: OccupancyData[];
}> => {
  const response = await fetch(`${API_URL}/api/dashboard/stats`);
  if (!response.ok) {
    // Return mock data if endpoint fails
    return {
      stats: { today_count: 0, tomorrow_count: 0, week_count: 0, month_count: 0 },
      todayAppointments: [],
      occupancyChart: []
    };
  }
  return await response.json();
};
