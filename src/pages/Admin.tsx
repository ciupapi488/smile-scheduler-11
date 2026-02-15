// src/pages/Admin.tsx
import { useEffect, useState } from 'react';
import { getAppointments } from '../api';

export default function Admin() {
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    loadAppointments();
    const interval = setInterval(loadAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAppointments = async () => {
    const data = await getAppointments();
    setAppointments(data);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>📋 Programări</h1>
      <button onClick={loadAppointments} style={{ marginBottom: '20px' }}>Reîmprospătează</button>
      
      <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f0f0f0' }}>
          <tr>
            <th>Data</th>
            <th>Ora</th>
            <th>Nume</th>
            <th>Telefon</th>
            <th>Serviciu</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((app) => (
            <tr key={app.id}>
              <td>{app.date}</td>
              <td>{app.time}</td>
              <td>{app.name}</td>
              <td>{app.phone}</td>
              <td>{app.service}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}