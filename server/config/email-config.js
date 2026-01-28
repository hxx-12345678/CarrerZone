/**
 * Production Email Configuration
 * Optimized email service for production deployment
 */

const nodemailer = require('nodemailer');

// Production email configuration
function getEmailConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Default configuration
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true' || false,
    auth: {
      user: process.env.SMTP_USER || 'hempatel777@yahoo.com',
      pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000,    // 5 seconds
    socketTimeout: 10000,     // 10 seconds
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 20000, // 20 seconds
    rateLimit: 5 // 5 emails per rateDelta
  };

  // Production optimizations
  if (isProduction) {
    config.pool = true;
    config.maxConnections = 10;
    config.maxMessages = 200;
    config.rateDelta = 10000; // 10 seconds
    config.rateLimit = 10; // 10 emails per rateDelta
  }

  return config;
}

// Create email transporter
function createEmailTransporter() {
  const config = getEmailConfig();
  
  try {
    const transporter = nodemailer.createTransporter(config);
    
    // Verify connection
    transporter.verify((error, success) => {
      if (error) {
        console.log('❌ Email service verification failed:', error.message);
      } else {
        console.log('✅ Email service is ready to send messages');
      }
    });
    
    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
    return null;
  }
}

// Email service wrapper with error handling
class EmailService {
  constructor() {
    this.transporter = createEmailTransporter();
    this.isAvailable = !!this.transporter;
  }

  async sendEmail(options) {
    if (!this.isAvailable) {
      console.warn('⚠️ Email service not available, skipping email send');
      return { success: false, error: 'Email service not available' };
    }

    try {
      const result = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        ...options
      });
      
      console.log('✅ Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Email send failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email - Job Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Email Address</h2>
          <p>Thank you for registering with our Job Portal!</p>
          <p>Please click the button below to verify your email address:</p>
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
      `
    });
  }

  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - Job Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>You requested to reset your password for your Job Portal account.</p>
          <p>Please click the button below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
        </div>
      `
    });
  }
}

module.exports = { getEmailConfig, createEmailTransporter, EmailService };
