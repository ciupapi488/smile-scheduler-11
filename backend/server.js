const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Services
const EmailService = require('./services/emailService');

const app = express();
app.use(cors());
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const emailService = new EmailService();

// ============================================
// PUBLIC ROUTES
// ============================================

// Health check
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server OK', timestamp: new Date().toISOString() });
});

// Get dentists (with mock fallback)
app.get('/api/dentists', async (req, res) => {
  try {
    const { data, error } = await supabase
      .rpc('get_available_dentists', { p_date: new Date().toISOString().split('T')[0] });
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      return res.json({ dentists: data });
    }
  } catch (err) {
    console.log('DB dentists failed, using mock data');
  }
  
  // Mock dentists fallback
  res.json({
    dentists: [
      { id: 'd1', first_name: 'Andrei', last_name: 'Ionescu', full_name: 'Andrei Ionescu', specialization: 'Stomatologie generala', bio: '10+ ani experienta', color_code: '#3B82F6', rating_avg: 4.8, total_reviews: 24, is_available: true },
      { id: 'd2', first_name: 'Maria', last_name: 'Popescu', full_name: 'Maria Popescu', specialization: 'Ortodontie', bio: 'Specialist Invisalign', color_code: '#10B981', rating_avg: 4.9, total_reviews: 18, is_available: true },
      { id: 'd3', first_name: 'Cristian', last_name: 'Marinescu', full_name: 'Cristian Marinescu', specialization: 'Chirurgie orala', bio: 'Expert implantologie', color_code: '#F59E0B', rating_avg: 4.7, total_reviews: 31, is_available: true }
    ]
  });
});

// Get available slots
app.get('/api/available-slots', async (req, res) => {
  const { date, dentist_id } = req.query;
  if (!date) return res.status(400).json({ error: 'Date required' });
  
  try {
    const allSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
    
    let query = supabase
      .from('appointment_slots')
      .select('slot_time')
      .eq('slot_date', date)
      .eq('status', 'booked');
    
    if (dentist_id) query = query.eq('dentist_id', dentist_id);
    
    const { data: bookedData } = await query;
    const bookedTimes = bookedData?.map(row => row.slot_time?.substring(0, 5)) || [];
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));
    
    res.json({ date, availableSlots, bookedSlots: bookedTimes });
  } catch (err) {
    console.error('Slots error:', err);
    res.json({ date, availableSlots: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'], bookedSlots: [] });
  }
});

// Create appointment
app.post('/api/appointments', async (req, res) => {
  const { name, email, phone, date, time, service, dentist_id } = req.body;
  
  if (!name || !email || !phone || !date || !time || !service) {
    return res.status(400).json({ error: 'All fields required' });
  }
  
  try {
    // Check existing appointment same day
    const { data: existing } = await supabase
      .from('appointments')
      .select('id')
      .eq('appointment_date', date)
      .eq('email', email)
      .not('status', 'eq', 'cancelled')
      .maybeSingle();
    
    if (existing) {
      return res.status(409).json({ error: 'Already have an appointment this day', code: 'DOUBLE_BOOKING' });
    }
    
    // Create slot
    const slotData = {
      slot_date: date,
      slot_time: time,
      status: 'booked',
      patient_name: name,
      patient_phone: phone,
      booked_by: email
    };
    if (dentist_id) slotData.dentist_id = dentist_id;
    
    const { data: newSlot, error: slotError } = await supabase
      .from('appointment_slots')
      .upsert(slotData, { onConflict: dentist_id ? 'slot_date,slot_time,dentist_id' : 'slot_date,slot_time' })
      .select()
      .single();
    
    if (slotError) throw slotError;
    
    // Create appointment
    const apptData = {
      slot_id: newSlot.id,
      name,
      email,
      phone,
      service,
      appointment_date: date,
      appointment_time: time,
      status: 'confirmed',
      created_by: 'patient_online'
    };
    if (dentist_id) apptData.dentist_id = dentist_id;
    
    await supabase.from('appointments').insert(apptData);
    
    // Send email (don't block on failure)
    emailService.sendBookingConfirmation({
      name, email, phone, appointment_date: date, appointment_time: time, service
    }).catch(err => console.log('Email failed:', err.message));
    
    res.json({ success: true, message: 'Appointment confirmed' });
    
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// DENTIST ROUTES
// ============================================

const TEST_DENTIST_PASSWORDS = {
  'dr.ionescu@dentcare.ro': 'dentist123',
  'dr.popescu@dentcare.ro': 'dentist123',
  'dr.marinescu@dentcare.ro': 'dentist123'
};

const MOCK_DENTISTS = [
  { id: 'd1', email: 'dr.ionescu@dentcare.ro', first_name: 'Andrei', last_name: 'Ionescu', specialization: 'Stomatologie generala', color_code: '#3B82F6' },
  { id: 'd2', email: 'dr.popescu@dentcare.ro', first_name: 'Maria', last_name: 'Popescu', specialization: 'Ortodontie', color_code: '#10B981' },
  { id: 'd3', email: 'dr.marinescu@dentcare.ro', first_name: 'Cristian', last_name: 'Marinescu', specialization: 'Chirurgie orala', color_code: '#F59E0B' }
];

app.post('/api/dentist/login', (req, res) => {
  const { email, password } = req.body;
  const dentist = MOCK_DENTISTS.find(d => d.email === email);
  
  if (!dentist || TEST_DENTIST_PASSWORDS[email] !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  res.json({ success: true, dentist });
});

app.get('/api/dentist/appointments', async (req, res) => {
  const { date } = req.query;
  
  // Mock appointments for demo
  const mockAppointments = [
    { id: '1', name: 'Popescu Ion', email: 'ion@email.ro', phone: '0722123456', appointment_date: date, appointment_time: '09:00:00', service: 'Consultatie', status: 'confirmed', patient_total_visits: 3 },
    { id: '2', name: 'Maria Georgescu', email: 'maria@email.ro', phone: '0722987654', appointment_date: date, appointment_time: '10:00:00', service: 'Detartraj', status: 'confirmed' },
    { id: '3', name: 'Andrei Vasilescu', email: 'andrei@email.ro', phone: '0722345678', appointment_date: date, appointment_time: '11:00:00', service: 'Extractie', status: 'completed', patient_total_visits: 5 }
  ];
  
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('appointment_date', date)
      .order('appointment_time');
    
    if (error || !data || data.length === 0) {
      return res.json({ appointments: mockAppointments });
    }
    
    res.json({ appointments: data });
  } catch (err) {
    res.json({ appointments: mockAppointments });
  }
});

// ============================================
// EMAIL VERIFICATION ROUTES
// ============================================

// Send verification email
app.post('/api/auth/send-verification', async (req, res) => {
  const { email, firstName } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }
  
  try {
    // Generate token
    const token = emailService.generateToken(email);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // Store in database
    const { error: dbError } = await supabase
      .from('verification_tokens')
      .upsert({
        email: email.toLowerCase().trim(),
        token,
        expires_at: expiresAt.toISOString(),
        used: false,
        created_at: new Date().toISOString()
      }, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      });
    
    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Failed to store token' });
    }
    
    // Send email
    const result = await emailService.sendVerificationEmail(email, firstName, token);
    
    if (result.success) {
      console.log('✅ Verification email sent to:', email);
      res.json({ success: true, message: 'Verification email sent' });
    } else {
      console.error('❌ Failed to send email:', result.error);
      res.status(500).json({ error: 'Failed to send email', details: result.error });
    }
  } catch (err) {
    console.error('Send verification error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Verify email endpoint
app.get('/api/auth/verify', async (req, res) => {
  const { token, email } = req.query;
  
  if (!token || !email) {
    return res.status(400).json({ error: 'Token and email required' });
  }
  
  try {
    // Check token
    const { data: tokenData, error: tokenError } = await supabase
      .from('verification_tokens')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('token', token)
      .eq('used', false)
      .single();
    
    if (tokenError || !tokenData) {
      console.log('Token not found or already used');
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    // Check expiration
    if (new Date(tokenData.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Token expired. Please request a new verification email.' });
    }
    
    // Mark token as used
    await supabase
      .from('verification_tokens')
      .update({ used: true, verified_at: new Date().toISOString() })
      .eq('email', email.toLowerCase().trim());
    
    // Confirm email in Supabase using admin API
    // First, get user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('List users error:', listError);
      return res.status(500).json({ error: 'Failed to find user' });
    }
    
    const user = users?.find(u => u.email?.toLowerCase() === email.toLowerCase().trim());
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user to confirm email
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );
    
    if (updateError) {
      console.error('Update user error:', updateError);
      return res.status(500).json({ error: 'Failed to confirm email' });
    }
    
    console.log('✅ Email verified for:', email);
    res.json({ success: true, message: 'Email verified successfully. You can now log in.' });
    
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Check verification status
app.get('/api/auth/check-verification', async (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }
  
  try {
    const { data, error } = await supabase
      .from('verification_tokens')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('used', true)
      .single();
    
    res.json({ verified: !!data });
  } catch (err) {
    res.json({ verified: false });
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

const adminAuth = (req, res, next) => next(); // Simplified auth

app.get('/api/admin/appointments', adminAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: false })
      .limit(100);
    res.json({ appointments: data || [] });
  } catch (err) {
    res.json({ appointments: [] });
  }
});

app.post('/api/admin/appointments/:id/status', adminAuth, async (req, res) => {
  try {
    await supabase.from('appointments').update({ status: req.body.status }).eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/appointments/:id', adminAuth, async (req, res) => {
  try {
    await supabase.from('appointments').delete().eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/services', adminAuth, async (req, res) => {
  try {
    const { data } = await supabase.from('services').select('*').order('name');
    res.json(data || []);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/admin/services', adminAuth, async (req, res) => {
  try {
    await supabase.from('services').insert(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/services/:id', adminAuth, async (req, res) => {
  try {
    await supabase.from('services').update(req.body).eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/services/:id', adminAuth, async (req, res) => {
  try {
    await supabase.from('services').delete().eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/schedule', adminAuth, async (req, res) => {
  try {
    const { data } = await supabase.from('working_schedules').select('*').order('day_of_week');
    res.json(data || []);
  } catch (err) {
    res.json([]);
  }
});

app.put('/api/admin/schedule/:dayOfWeek', adminAuth, async (req, res) => {
  try {
    await supabase.from('working_schedules').update(req.body).eq('day_of_week', req.params.dayOfWeek);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard/stats', adminAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data: todayAppts } = await supabase.from('appointments').select('*').eq('appointment_date', today);
    const { data: allAppts } = await supabase.from('appointments').select('*').limit(100);
    
    res.json({
      stats: {
        today_count: todayAppts?.length || 0,
        tomorrow_count: 0,
        week_count: allAppts?.length || 0,
        month_count: allAppts?.length || 0
      },
      todayAppointments: todayAppts || [],
      occupancyChart: []
    });
  } catch (err) {
    res.json({
      stats: { today_count: 0, tomorrow_count: 0, week_count: 0, month_count: 0 },
      todayAppointments: [],
      occupancyChart: []
    });
  }
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
