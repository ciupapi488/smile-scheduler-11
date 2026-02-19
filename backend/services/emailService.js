const nodemailer = require('nodemailer');
const crypto = require('crypto');

class EmailService {
  constructor() {
    const emailPass = (process.env.EMAIL_PASS || '').replace(/\s/g, '');
    
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: emailPass
      },
      tls: { rejectUnauthorized: false }
    });
    
    this.enabled = !!(process.env.EMAIL_USER && emailPass);
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
  }

  generateToken(email) {
    return crypto
      .createHash('sha256')
      .update(`${email}:${Date.now()}:${process.env.EMAIL_SECRET || 'dentcare-secret'}`)
      .digest('hex');
  }

  async sendVerificationEmail(email, firstName, token) {
    if (!this.enabled) {
      console.error('❌ Email service not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const verifyUrl = `${this.frontendUrl}/pacient/verify?token=${token}&email=${encodeURIComponent(email)}`;

    // Simple email with just a link
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Hello ${firstName || 'there'},</h2>
        <p>Please click the link below to verify your email address:</p>
        <p>
          <a href="${verifyUrl}" style="color: #3B82F6; font-size: 16px;">
            ${verifyUrl}
          </a>
        </p>
        <p>If you did not create this account, please ignore this email.</p>
        <p style="color: #666; font-size: 12px;">This link expires in 24 hours.</p>
      </body>
      </html>
    `;

    try {
      console.log('📧 Sending verification email to:', email);
      
      const result = await this.transporter.sendMail({
        from: { 
          name: 'DentCare', 
          address: process.env.EMAIL_USER 
        },
        to: email,
        subject: 'Verify Your Email - DentCare',
        html,
        text: `Hello,\n\nPlease click this link to verify your email:\n${verifyUrl}\n\nThis link expires in 24 hours.`
      });
      
      console.log('✅ Verification email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send verification email:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendBookingConfirmation(appointment) {
    if (!this.enabled) {
      console.log('Email disabled - would send to:', appointment.email);
      return { success: false, error: 'Email not configured' };
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1>✓ Appointment Confirmed</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
          <p>Hello <strong>${appointment.name}</strong>,</p>
          <p>Your appointment has been confirmed!</p>
          <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p><strong>📅 Date:</strong> ${appointment.appointment_date}</p>
            <p><strong>🕐 Time:</strong> ${appointment.appointment_time?.substring(0, 5)}</p>
            <p><strong>🦷 Service:</strong> ${appointment.service}</p>
          </div>
          <p style="color: #666; font-size: 13px;">For questions, call: 0722 123 456</p>
        </div>
      </div>
    `;

    try {
      const result = await this.transporter.sendMail({
        from: { name: 'DentCare', address: process.env.EMAIL_USER },
        to: appointment.email,
        subject: `Appointment Confirmation - ${appointment.appointment_date}`,
        html
      });
      
      console.log('✅ Booking email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Email failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = EmailService;
