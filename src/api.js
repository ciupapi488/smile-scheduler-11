// src/api.js - Comunicarea cu backend-ul

const API_URL = 'http://localhost:5000';

// Trimite o programare nouă
export const createAppointment = async (appointmentData) => {
  try {
    const response = await fetch(`${API_URL}/api/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Eroare:', error);
    return { error: 'Nu s-a putut conecta la server' };
  }
};

// Obține toate programările (pentru admin)
export const getAppointments = async () => {
  try {
    const response = await fetch(`${API_URL}/api/appointments`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Eroare:', error);
    return [];
  }
};