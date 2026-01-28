const nodemailer = require('nodemailer');
require('dotenv').config();

// Try to load SendGrid if available
let sgMail = null;
try {
  sgMail = require('@sendgrid/mail');
} catch (e) {
  // SendGrid not installed, will use SMTP fallback
}

class EmailService {
  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || process.env.FROM_EMAIL || process.env.SMTP_USER || 'hempatel777@yahoo.com';
    this.fromName = process.env.FROM_NAME || 'Job Portal';
    this.transporter = null;
    this.initialized = false;
    this.initializeTransporter();
  }

  async initializeTransporter(forceReinitialize = false) {
    try {
      // If already initialized and not forcing reinitialize, skip
      if (this.initialized && !forceReinitialize) {
        return;
      }
      // Use SMTP providers with SendGrid as fallback
      console.log('📧 Using SMTP providers with SendGrid fallback');

      // Try multiple email providers in order of preference
      // Gmail is most reliable in production environments like Render.com
      const providers = [
        // Priority 1: Custom SMTP (supports any provider) - Check first since it's configured
        {
          name: 'Custom SMTP',
          host: process.env.SMTP_HOST,
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          tls: {
            rejectUnauthorized: false
          }
        },
        // Priority 2: Gmail SMTP (most reliable in production)
        {
          name: 'Gmail',
          host: 'smtp.gmail.com',
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
          port: 587,
          secure: false
        },
        // Priority 3: SendGrid (if API key is available)
        {
          name: 'SendGrid',
          apiKey: process.env.SENDGRID_API_KEY,
          fromEmail: process.env.SENDGRID_FROM_EMAIL
        },
        // Priority 3: Outlook/Hotmail
        {
          name: 'Outlook',
          host: 'smtp-mail.outlook.com',
          user: process.env.OUTLOOK_USER,
          pass: process.env.OUTLOOK_PASSWORD,
          port: 587,
          secure: false
        },
        // Priority 4: Yahoo SMTP (last resort - often blocked by hosting providers)
        {
          name: 'Yahoo (Port 587)',
          host: 'smtp.mail.yahoo.com',
          user: process.env.YAHOO_USER,
          pass: process.env.YAHOO_APP_PASSWORD,
          port: 587,
          secure: false
        },
        {
          name: 'Yahoo (Port 465)',
          host: 'smtp.mail.yahoo.com',
          user: process.env.YAHOO_USER,
          pass: process.env.YAHOO_APP_PASSWORD,
          port: 465,
          secure: true
        }
      ];

      console.log('\n📧 Email Service Configuration Check:');
      console.log('=====================================');
      if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        console.log('✓ Gmail SMTP credentials found (PRIORITY 1 - Most Reliable)');
        console.log(`  User: ${process.env.GMAIL_USER}`);
        console.log(`  Password: ${process.env.GMAIL_APP_PASSWORD ? '***' + process.env.GMAIL_APP_PASSWORD.slice(-4) : 'NOT SET'}`);
      }
      if (process.env.YAHOO_USER && process.env.YAHOO_APP_PASSWORD) {
        console.log('✓ Yahoo SMTP credentials found (BACKUP - Often Blocked)');
        console.log(`  User: ${process.env.YAHOO_USER}`);
        console.log(`  Password: ${process.env.YAHOO_APP_PASSWORD ? '***' + process.env.YAHOO_APP_PASSWORD.slice(-4) : 'NOT SET'}`);
      }
      // SendGrid disabled - using SMTP only
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        console.log('✓ Custom SMTP credentials found (BACKUP)');
        console.log(`  Host: ${process.env.SMTP_HOST}`);
        console.log(`  Port: ${process.env.SMTP_PORT || 587}`);
        console.log(`  User: ${process.env.SMTP_USER}`);
        console.log(`  Secure: ${process.env.SMTP_SECURE === 'true' ? 'Yes (TLS)' : 'No (STARTTLS)'}`);
        console.log(`  Password: ${process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET'}`);
      }
      if (process.env.YAHOO_USER) {
        console.log('✓ Yahoo credentials found');
        console.log(`  User: ${process.env.YAHOO_USER}`);
        console.log(`  Password: ${process.env.YAHOO_APP_PASSWORD ? '***' + process.env.YAHOO_APP_PASSWORD.slice(-4) : 'NOT SET'}`);
      }
      if (process.env.GMAIL_USER) {
        console.log('✓ Gmail credentials found');
        console.log(`  User: ${process.env.GMAIL_USER}`);
        console.log(`  Password: ${process.env.GMAIL_APP_PASSWORD ? '***' + process.env.GMAIL_APP_PASSWORD.slice(-4) : 'NOT SET'}`);
      }
      console.log('=====================================\n');

      for (const provider of providers) {
        console.log(`🔍 Checking provider: ${provider.name}`);
        console.log(`   Host: ${provider.host}`);
        console.log(`   User: ${provider.user}`);
        console.log(`   Pass: ${provider.pass ? '***' + provider.pass.slice(-4) : 'NOT SET'}`);
        
        if (provider.host && provider.user && provider.pass) {
          console.log(`🔄 Attempting to connect to ${provider.name}...`);
          console.log(`   Host: ${provider.host}:${provider.port}`);
          console.log(`   User: ${provider.user}`);
          
          try {
            this.transporter = await this.createTransporter(provider);
            console.log(`\n🎉 SUCCESS! ${provider.name} transporter initialized!`);
            console.log(`✅ Emails will be sent from: ${this.fromEmail}`);
            console.log(`✅ Ready to send password reset emails!\n`);
            this.initialized = true;
            return;
          } catch (error) {
            console.error(`❌ ${provider.name} connection failed:`);
            console.error(`   Error: ${error.message}`);
            console.error(`   Code: ${error.code || 'N/A'}`);
            continue;
          }
        }
      }

      // If all providers fail, use mock transporter
      this.transporter = this.createMockTransporter();
      console.log('\n⚠️  WARNING: All email providers failed!');
      console.log('=====================================');
      console.log('Using MOCK transporter - emails will NOT actually send!');
      console.log('');
      console.log('🚀 QUICK FIX - Use Gmail SMTP (Recommended):');
      console.log('1. Go to https://myaccount.google.com/apppasswords');
      console.log('2. Generate an app password for "Job Portal"');
      console.log('3. Add to Render.com environment variables:');
      console.log('   GMAIL_USER=your-gmail@gmail.com');
      console.log('   GMAIL_APP_PASSWORD=your-16-char-password');
      console.log('4. Restart your service');
      console.log('');
      console.log('📧 Alternative: Use SendGrid (Production Ready)');
      console.log('1. Sign up at https://sendgrid.com');
      console.log('2. Get API key and add:');
      console.log('   SENDGRID_API_KEY=your-api-key');
      console.log('   SENDGRID_FROM_EMAIL=your-verified-email');
      console.log('');
      console.log('See server/scripts/setup-gmail-smtp.js for detailed instructions');
      console.log('=====================================\n');
      this.initialized = true;

    } catch (error) {
      console.error('❌ Critical error initializing email service:', error.message);
      this.transporter = this.createMockTransporter();
      this.initialized = true;
    }
  }

  async createTransporter(provider) {
    // Special handling for Yahoo SMTP and Gmail
    const isYahoo = provider.host && provider.host.includes('yahoo');
    const isGmail = provider.host && provider.host.includes('gmail');
    
    const transporterOptions = {
      host: provider.host,
      port: provider.port,
      secure: provider.secure,
      auth: { 
        user: provider.user, 
        pass: provider.pass 
      },
      pool: false,
      maxConnections: 1,
      maxMessages: 1,
      connectionTimeout: isYahoo ? 45000 : 15000, // Extra aggressive timeout for Yahoo
      greetingTimeout: isYahoo ? 45000 : 15000,
      socketTimeout: isYahoo ? 45000 : 15000,
      requireTLS: !provider.secure,
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
        // Yahoo specific TLS settings
        ciphers: isYahoo ? 'SSLv3' : undefined,
        // Additional Yahoo optimizations
        ...(isYahoo && {
          servername: 'smtp.mail.yahoo.com',
          checkServerIdentity: () => true
        })
      },
      // Yahoo-specific connection options - more aggressive settings
      ...(isYahoo && {
        connectionTimeout: 45000, // 45 seconds
        greetingTimeout: 45000,   // 45 seconds
        socketTimeout: 45000,     // 45 seconds
        ignoreTLS: false,
        requireTLS: true,
        // Additional Yahoo optimizations
        pool: false,
        maxConnections: 1,
        maxMessages: 1
      }),
      debug: process.env.NODE_ENV === 'development',
      logger: process.env.NODE_ENV === 'development'
    };

    console.log(`📧 ${provider.name} Config:`, {
      host: provider.host,
      port: provider.port,
      secure: provider.secure,
      user: provider.user
    });
    
    const transporter = nodemailer.createTransport(transporterOptions);
    
    // For Yahoo, skip verification entirely to avoid timeout issues
    // For Gmail, also skip verification for faster initialization
    if (isYahoo || isGmail) {
      console.log(`✅ ${provider.name} transporter created (verification skipped for faster initialization)`);
      if (isYahoo) {
        console.log(`🔄 Yahoo SMTP verification skipped - will try to send emails anyway`);
        console.log(`   (Yahoo Mail sometimes fails verification but still works)`);
      }
      if (isGmail) {
        console.log(`🔄 Gmail SMTP verification skipped - will verify on first send`);
      }
      return transporter;
    }
    
    try {
      // Use a longer timeout for production stability for other providers
      const timeoutDuration = 20000; // 20 seconds for others
      const verifyPromise = transporter.verify();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Verification timeout')), timeoutDuration)
      );
      
      await Promise.race([verifyPromise, timeoutPromise]);
      console.log(`✅ ${provider.name} connection verified successfully`);
      return transporter;
    } catch (verifyError) {
      console.error(`⚠️  ${provider.name} verification failed:`, verifyError.message);
      console.log(`   Error Code: ${verifyError.code || 'N/A'}`);
      
      // For timeout errors on other providers, throw to try next provider
      if (verifyError.message.includes('timeout') || verifyError.code === 'ETIMEDOUT') {
        throw verifyError;
      }
      
      // For authentication errors, throw to try next provider
      if (verifyError.code === 'EAUTH' || verifyError.responseCode === 535) {
        console.error(`   Authentication failed - check username and password`);
        throw verifyError;
      }
      
      // For other errors, return transporter anyway (might still work)
      console.log(`🔄 Returning ${provider.name} transporter without verification...`);
      return transporter;
    }
  }

  createMockTransporter() {
    return {
      type: 'mock',
      sendMail: async (mailOptions) => {
        console.log('📧 Mock Email Sent (Development Mode):');
        console.log('   To:', mailOptions.to);
        console.log('   From:', mailOptions.from);
        console.log('   Subject:', mailOptions.subject);
        console.log('   Reset URL would be:', mailOptions.html?.match(/href="([^"]+)"/)?.[1] || 'Not found');
        console.log('💡 In production, configure SMTP settings to send real emails');
        return { 
          messageId: 'mock-' + Date.now(),
          success: true,
          method: 'mock'
        };
      }
    };
  }

  async sendPasswordResetEmail(toEmail, resetToken, userName = 'User') {
    // Wait for initialization if not ready
    if (!this.initialized) {
      console.log('⏳ Waiting for email service initialization...');
      let attempts = 0;
      while (!this.initialized && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const subject = 'Password Reset Request - Job Portal';
    const htmlContent = this.getPasswordResetEmailTemplate(userName, resetUrl);
    const textContent = this.getPasswordResetEmailText(userName, resetUrl);

    const mailOptions = {
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to: toEmail,
      subject: subject,
      text: textContent,
      html: htmlContent
    };

    if (!this.transporter) {
      throw new Error('No email service configured');
    }

    try {
      if (this.transporter.type === 'mock') {
        return await this.transporter.sendMail(mailOptions);
      } else if (this.transporter.type === 'sendgrid') {
        // SendGrid transporter
        console.log('📧 Sending email via SendGrid...');
        console.log('📧 Email details:', {
          to: mailOptions.to,
          from: mailOptions.from,
          subject: mailOptions.subject
        });
        
        const msg = {
          to: mailOptions.to,
          from: process.env.SENDGRID_FROM_EMAIL || mailOptions.from,
          subject: mailOptions.subject,
          text: mailOptions.text,
          html: mailOptions.html,
        };
        
        const response = await this.transporter.sgMail.send(msg);
        console.log('✅ Password reset email sent via SendGrid');
        console.log('📧 Response:', response[0].statusCode);
        return { success: true, method: 'sendgrid', messageId: response[0].headers['x-message-id'] };
      } else {
        // Standard SMTP transporter
        console.log('📧 Sending email via SMTP...');
        console.log('📧 Email details:', {
          to: mailOptions.to,
          from: mailOptions.from,
          subject: mailOptions.subject
        });
        
        const info = await this.transporter.sendMail(mailOptions);
        console.log('✅ Password reset email sent via SMTP');
        console.log('📧 Message ID:', info.messageId);
        console.log('📧 Response:', info.response);
        return { success: true, method: 'smtp', messageId: info.messageId };
      }
    } catch (error) {
      console.error('❌ Email send failed:', error?.message || error);
      console.error('❌ Error details:', {
        code: error?.code,
        command: error?.command,
        response: error?.response,
        responseCode: error?.responseCode
      });
      
      // Handle SMTP connection issues with retry
      if (error?.code === 'ETIMEDOUT' || error?.code === 'ECONNRESET') {
        console.log('🔄 SMTP connection issue detected, attempting to reinitialize...');
        try {
          await this.initializeTransporter(true); // Force reinitialize
          if (this.transporter && this.transporter.type !== 'mock') {
            console.log('🔄 Retrying email send with reinitialized SMTP provider...');
            const retryResult = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email sent successfully via SMTP retry');
            return { success: true, method: 'smtp-retry', messageId: retryResult.messageId };
          }
        } catch (retryError) {
          console.error('❌ SMTP retry also failed:', retryError.message);
        }
      }
      
      throw new Error(`Email send failed: ${error?.message || error}`);
    }
  }

  getPasswordResetEmailTemplate(userName, resetUrl) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Job Portal</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .title {
            color: #1f2937;
            font-size: 20px;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #1d4ed8;
          }
          .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Job Portal</div>
            <h1 class="title">Password Reset Request</h1>
          </div>
          
          <div class="content">
            <p>Hello ${userName},</p>
            
            <p>We received a request to reset your password for your Job Portal account. If you didn't make this request, you can safely ignore this email.</p>
            
            <p>To reset your password, click the button below:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
            
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this password reset, please ignore this email</li>
                <li>For security, this link can only be used once</li>
              </ul>
            </div>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <p>Best regards,<br>The Job Portal Team</p>
          </div>
          
          <div class="footer">
            <p>© 2024 Job Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordResetEmailText(userName, resetUrl) {
    return `
Password Reset Request - Job Portal

Hello ${userName},

We received a request to reset your password for your Job Portal account. If you didn't make this request, you can safely ignore this email.

To reset your password, visit this link:
${resetUrl}

Important:
- This link will expire in 1 hour
- If you didn't request this password reset, please ignore this email
- For security, this link can only be used once

If you have any questions, please contact our support team.

Best regards,
The Job Portal Team

© 2024 Job Portal. All rights reserved.
    `;
  }

  async sendOTPEmail(toEmail, otp) {
    // Wait for initialization if not ready
    if (!this.initialized) {
      console.log('⏳ Waiting for email service initialization...');
      let attempts = 0;
      while (!this.initialized && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
    }

    const subject = 'Cross-Portal Registration OTP - Job Portal';
    const htmlContent = this.getOTPEmailTemplate(otp);
    const textContent = this.getOTPEmailText(otp);

    const mailOptions = {
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to: toEmail,
      subject: subject,
      text: textContent,
      html: htmlContent
    };

    if (!this.transporter) {
      throw new Error('No email service configured');
    }

    try {
      if (this.transporter.type === 'mock') {
        return await this.transporter.sendMail(mailOptions);
      } else {
        // Standard SMTP transporter
        console.log('📧 Sending OTP email via SMTP...');
        console.log('📧 Email details:', {
          to: mailOptions.to,
          from: mailOptions.from,
          subject: mailOptions.subject
        });
        
        const info = await this.transporter.sendMail(mailOptions);
        console.log('✅ OTP email sent via SMTP');
        console.log('📧 Message ID:', info.messageId);
        console.log('📧 Response:', info.response);
        return { success: true, method: 'smtp', messageId: info.messageId };
      }
    } catch (error) {
      console.error('❌ OTP email send failed:', error?.message || error);
      console.error('❌ Error details:', {
        code: error?.code,
        command: error?.command,
        response: error?.response,
        responseCode: error?.responseCode
      });
      
      // Handle SMTP connection issues with retry
      if (error?.code === 'ETIMEDOUT' || error?.code === 'ECONNRESET') {
        console.log('🔄 SMTP connection issue detected, attempting to reinitialize...');
        try {
          await this.initializeTransporter(true); // Force reinitialize
          if (this.transporter && this.transporter.type !== 'mock') {
            console.log('🔄 Retrying OTP email send with reinitialized SMTP provider...');
            const retryResult = await this.transporter.sendMail(mailOptions);
            console.log('✅ OTP email sent successfully via SMTP retry');
            return { success: true, method: 'smtp-retry', messageId: retryResult.messageId };
          }
        } catch (retryError) {
          console.error('❌ SMTP retry also failed:', retryError.message);
        }
      }
      
      throw new Error(`OTP email send failed: ${error?.message || error}`);
    }
  }

  getOTPEmailTemplate(otp) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cross-Portal Registration OTP - Job Portal</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .title {
            color: #1f2937;
            font-size: 20px;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .otp-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 30px;
            border-radius: 10px;
            margin: 30px 0;
          }
          .otp-code {
            font-size: 48px;
            font-weight: bold;
            letter-spacing: 10px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
          }
          .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Job Portal</div>
            <h1 class="title">Cross-Portal Registration OTP</h1>
          </div>
          
          <div class="content">
            <p>Hello there!</p>
            
            <p>We received a request to register your existing account for an additional portal access. If you didn't make this request, you can safely ignore this email.</p>
            
            <div class="otp-box">
              <p style="margin: 0; opacity: 0.9; font-size: 14px;">Your verification code is:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 0; opacity: 0.9; font-size: 14px;">This code expires in 10 minutes</p>
            </div>
            
            <p><strong>Please enter this code in the verification dialog to complete your registration.</strong></p>
            
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>This OTP will expire in 10 minutes</li>
                <li>If you didn't request this registration, please ignore this email</li>
                <li>Never share your OTP with anyone</li>
                <li>Our team will never ask for your OTP via phone or email</li>
              </ul>
            </div>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <p>Best regards,<br>The Job Portal Team</p>
          </div>
          
          <div class="footer">
            <p>© 2024 Job Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getOTPEmailText(otp) {
    return `
Cross-Portal Registration OTP - Job Portal

Hello there!

We received a request to register your existing account for an additional portal access. If you didn't make this request, you can safely ignore this email.

Your verification code is:

${otp}

This code expires in 10 minutes

Please enter this code in the verification dialog to complete your registration.

Important:
- This OTP will expire in 10 minutes
- If you didn't request this registration, please ignore this email
- Never share your OTP with anyone
- Our team will never ask for your OTP via phone or email

If you have any questions, please contact our support team.

Best regards,
The Job Portal Team

© 2024 Job Portal. All rights reserved.
    `;
  }

  async sendMail(mailOptions) {
    // Wait for initialization if not ready
    if (!this.initialized) {
      console.log('⏳ Waiting for email service initialization...');
      let attempts = 0;
      while (!this.initialized && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
    }

    if (!this.transporter) {
      throw new Error('No email service configured');
    }

    try {
      if (this.transporter.type === 'mock') {
        return await this.transporter.sendMail(mailOptions);
      } else {
        // Standard SMTP transporter
        console.log('📧 Sending email via SMTP...');
        console.log('📧 Email details:', {
          to: mailOptions.to,
          from: mailOptions.from,
          subject: mailOptions.subject
        });
        
        const info = await this.transporter.sendMail(mailOptions);
        console.log('✅ Email sent via SMTP');
        console.log('📧 Message ID:', info.messageId);
        console.log('📧 Response:', info.response);
        return { success: true, method: 'smtp', messageId: info.messageId };
      }
    } catch (error) {
      console.error('❌ Email send failed:', error?.message || error);
      console.error('❌ Error details:', {
        code: error?.code,
        command: error?.command,
        response: error?.response,
        responseCode: error?.responseCode
      });
      throw new Error(`Email send failed: ${error?.message || error}`);
    }
  }

  async testEmailService() {
    try {
      // Wait for initialization if not ready
      if (!this.initialized) {
        console.log('⏳ Waiting for email service initialization...');
        let attempts = 0;
        while (!this.initialized && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
      }

      const testEmail = 'test@example.com';
      const result = await this.sendPasswordResetEmail(testEmail, 'test-token-123', 'Test User');
      return { success: true, message: 'Email service is working correctly', method: result.method || 'smtp' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Send client verification email for agency authorization
   */
  async sendClientVerificationEmail(options) {
    try {
      const {
        clientEmail,
        clientCompanyName,
        agencyName,
        agencyEmail,
        contractStartDate,
        contractEndDate,
        maxActiveJobs,
        authorizationId,
        verificationToken
      } = options;

      const APP_URL = process.env.APP_URL || 'http://localhost:3000';
      
      // Read HTML template
      const templatePath = path.join(__dirname, '../templates/client-verification-email.html');
      let htmlContent = '';
      
      try {
        htmlContent = await fs.readFile(templatePath, 'utf-8');
      } catch (error) {
        console.error('Error reading email template:', error);
        // Fallback to plain text
        htmlContent = `<p>Please verify authorization request from ${agencyName}</p>`;
      }

      // Replace placeholders
      htmlContent = htmlContent
        .replace(/{{CLIENT_COMPANY_NAME}}/g, clientCompanyName)
        .replace(/{{AGENCY_NAME}}/g, agencyName)
        .replace(/{{AGENCY_EMAIL}}/g, agencyEmail)
        .replace(/{{REQUEST_DATE}}/g, new Date().toLocaleDateString())
        .replace(/{{CONTRACT_START_DATE}}/g, new Date(contractStartDate).toLocaleDateString())
        .replace(/{{CONTRACT_END_DATE}}/g, new Date(contractEndDate).toLocaleDateString())
        .replace(/{{MAX_JOBS}}/g, maxActiveJobs || 'Unlimited')
        .replace(/{{APPROVE_URL}}/g, `${APP_URL}/client/verify-authorization?token=${verificationToken}&action=approve`)
        .replace(/{{REJECT_URL}}/g, `${APP_URL}/client/verify-authorization?token=${verificationToken}&action=reject`)
        .replace(/{{VIEW_DETAILS_URL}}/g, `${APP_URL}/client/authorization-details?id=${authorizationId}`)
        .replace(/{{CLIENT_CONTACT_EMAIL}}/g, clientEmail);

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: clientEmail,
        subject: '🔔 Verify Recruiting Agency Authorization - Action Required',
        html: htmlContent,
        text: `Dear ${clientCompanyName},

A recruiting agency has requested authorization to post jobs on your behalf.

Agency: ${agencyName}
Requested by: ${agencyEmail}
Contract Period: ${new Date(contractStartDate).toLocaleDateString()} to ${new Date(contractEndDate).toLocaleDateString()}

⚠️ ACTION REQUIRED:
If you authorized this agency, approve the request:
${APP_URL}/client/verify-authorization?token=${verificationToken}&action=approve

If you did NOT authorize this, reject immediately:
${APP_URL}/client/verify-authorization?token=${verificationToken}&action=reject

This is a security measure to prevent unauthorized job postings.

Job Portal Security Team
support@jobportal.com`
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Client verification email sent successfully to:', clientEmail);
      
      return { 
        success: true, 
        message: 'Client verification email sent successfully',
        messageId: result.messageId
      };
    } catch (error) {
      console.error('❌ Error sending client verification email:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  }

  // Send support response email
  async sendSupportResponse(supportMessage, response, adminName = 'Support Team') {
    try {
      console.log('📧 EmailService: Starting support response email...');
      console.log('📧 EmailService: Support message data:', {
        firstName: supportMessage.firstName,
        lastName: supportMessage.lastName,
        email: supportMessage.email,
        subject: supportMessage.subject,
        category: supportMessage.category
      });
      
      await this.initializeTransporter();
      
      const { firstName, lastName, email, subject, category } = supportMessage;
      
      const mailOptions = {
        from: `"${this.fromName} Support" <${this.fromEmail}>`,
        to: email,
        subject: `Re: ${subject} - Support Response`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Support Response</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Job Portal Support Team</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef;">
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                Dear ${firstName} ${lastName},
              </p>
              
              <p style="color: #555; font-size: 14px; margin-bottom: 20px;">
                Thank you for contacting our support team. We have reviewed your ${category} inquiry and here is our response:
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Response from ${adminName}:</h3>
                <div style="color: #555; line-height: 1.6; white-space: pre-wrap;">${response}</div>
              </div>
              
              <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h4 style="color: #1976d2; margin-top: 0;">Original Inquiry:</h4>
                <p style="color: #555; margin: 0; font-size: 14px;"><strong>Subject:</strong> ${subject}</p>
                <p style="color: #555; margin: 5px 0 0 0; font-size: 14px;"><strong>Category:</strong> ${category}</p>
              </div>
              
              <p style="color: #555; font-size: 14px; margin-bottom: 20px;">
                If you have any further questions or need additional assistance, please don't hesitate to contact us.
              </p>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="mailto:support@jobportal.com" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Contact Support
                </a>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
              <p>This is an automated response from Job Portal Support Team</p>
              <p>© 2025 Job Portal. All rights reserved.</p>
            </div>
          </div>
        `,
        text: `
Support Response - Job Portal

Dear ${firstName} ${lastName},

Thank you for contacting our support team. We have reviewed your ${category} inquiry and here is our response:

Response from ${adminName}:
${response}

Original Inquiry:
Subject: ${subject}
Category: ${category}

If you have any further questions or need additional assistance, please don't hesitate to contact us at support@jobportal.com.

Best regards,
Job Portal Support Team

This is an automated response from Job Portal Support Team
© 2025 Job Portal. All rights reserved.
        `
      };

      console.log('📧 EmailService: Sending email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });
      
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ EmailService: Support response email sent successfully to:', email);
      console.log('✅ EmailService: Email result:', result);
      
      return { 
        success: true, 
        message: 'Support response email sent successfully',
        messageId: result.messageId
      };
    } catch (error) {
      console.error('❌ Error sending support response email:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  }

  // Send invitation email
  async sendInvitationEmail(email, subject, content, type = 'jobseeker') {
    try {
      console.log(`📧 Sending ${type} invitation email to: ${email}`);
      
      const result = await this.sendMail({
        from: this.fromEmail || process.env.SMTP_USER || 'noreply@jobportal.com',
        to: email,
        subject: subject,
        html: this.formatHtmlEmail(content),
        text: content
      });
      
      if (result.success) {
        console.log(`✅ ${type} invitation email sent successfully to: ${email}`);
        return { success: true, messageId: result.messageId };
      } else {
        console.error(`❌ Failed to send ${type} invitation email to: ${email}`, result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error(`❌ Error sending ${type} invitation email to: ${email}`, error);
      return { success: false, error: error.message };
    }
  }

  // Format content as HTML email
  formatHtmlEmail(content) {
    // Convert markdown-style formatting to HTML
    let html = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/•/g, '&bull;')
      .replace(/\n/g, '<br>')
      .replace(/---/g, '<hr>');
    
    // Wrap in proper HTML structure
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Job Portal Invitation</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .container {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .content {
            margin-bottom: 30px;
          }
          .cta-button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 10px 5px;
          }
          .cta-button:hover {
            background-color: #1d4ed8;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
          }
          hr {
            border: none;
            border-top: 1px solid #e5e7eb;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Job Portal</div>
            <p>Your Gateway to Career Success</p>
          </div>
          <div class="content">
            ${html}
          </div>
          <div class="footer">
            <p>This is an automated invitation. If you did not expect this email, please ignore it.</p>
            <p>&copy; ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

const path = require('path');
const fs = require('fs').promises;

module.exports = new EmailService();
