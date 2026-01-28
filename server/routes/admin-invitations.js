const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const emailService = require('../services/emailService');
const { requireAdmin } = require('../middlewares/auth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.endsWith('.csv') ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'), false);
    }
  }
});

// Validation middleware
const validateInvitationRequest = [
  body('emails')
    .isArray({ min: 1 })
    .withMessage('Emails array is required and must not be empty'),
  body('emails.*')
    .isEmail()
    .normalizeEmail()
    .withMessage('Each email must be a valid email address'),
  body('template')
    .isObject()
    .withMessage('Template object is required'),
  body('template.subject')
    .notEmpty()
    .withMessage('Template subject is required'),
  body('template.content')
    .notEmpty()
    .withMessage('Template content is required'),
  body('type')
    .isIn(['jobseeker', 'company'])
    .withMessage('Type must be either jobseeker or company')
];

// Default email templates
const defaultTemplates = {
  jobseeker: {
    subject: 'Join Our Job Portal - Find Your Dream Job Today!',
    content: `Dear Job Seeker,

We're excited to invite you to join our comprehensive job portal where thousands of opportunities await you!

🎯 **Why Join Us?**
• Access to 10,000+ verified job opportunities
• Direct connections with top employers
• Personalized job recommendations
• Career guidance and resources
• Free registration and profile creation

🚀 **Get Started Today:**
1. Create your account: {{signupUrl}}
2. Complete your profile
3. Start applying to jobs that match your skills

🔗 **Quick Links:**
• Sign Up: {{signupUrl}}
• Login: {{loginUrl}}
• Browse Jobs: {{jobsUrl}}

Don't miss out on your next career opportunity. Join thousands of successful job seekers who have found their dream jobs through our platform.

Best regards,
The Job Portal Team

---
This is an automated invitation. If you did not expect this email, please ignore it.`
  },
  company: {
    subject: 'Join Our Job Portal - Connect with Top Talent',
    content: `Dear Hiring Manager,

We invite you to join our premier job portal and connect with exceptional talent for your organization.

🏢 **Why Choose Our Platform?**
• Access to 50,000+ qualified candidates
• Advanced candidate matching technology
• Streamlined hiring process
• Employer branding opportunities
• Dedicated account management support

💼 **What You Get:**
• Post unlimited job openings
• Browse candidate profiles
• Schedule interviews directly
• Track application analytics
• Premium employer features

🚀 **Get Started:**
1. Create your company account: {{signupUrl}}
2. Verify your company details
3. Post your first job opening

🔗 **Quick Links:**
• Sign Up: {{signupUrl}}
• Login: {{loginUrl}}
• Post Jobs: {{postJobUrl}}

Join leading companies who trust us to find their next great hire.

Best regards,
The Job Portal Team

---
This is an automated invitation. If you did not expect this email, please ignore it.`
  }
};

// Helper function to process email template
function processEmailTemplate(template, type, invitationId = null) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  
  let processedContent = template.content;
  let processedSubject = template.subject;
  
  // Generate unique invitation ID if not provided
  if (!invitationId) {
    invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Replace placeholders with tracking URLs
  const replacements = {
    '{{signupUrl}}': `${backendUrl}/api/track/click/${invitationId}/signup`,
    '{{loginUrl}}': `${backendUrl}/api/track/click/${invitationId}/login`,
    '{{jobsUrl}}': `${backendUrl}/api/track/click/${invitationId}/jobs`,
    '{{postJobUrl}}': `${backendUrl}/api/track/click/${invitationId}/postjob`
  };
  
  Object.entries(replacements).forEach(([placeholder, url]) => {
    processedContent = processedContent.replace(new RegExp(placeholder, 'g'), url);
    processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), url);
  });
  
  // Add tracking pixel at the end of the email
  const trackingPixel = `<img src="${backendUrl}/api/track/open/${invitationId}" width="1" height="1" style="display:none;" alt="" />`;
  processedContent += `\n\n${trackingPixel}`;
  
  return {
    subject: processedSubject,
    content: processedContent,
    invitationId: invitationId
  };
}

// Helper function to extract emails from uploaded file
async function extractEmailsFromFile(filePath, fileType) {
  return new Promise((resolve, reject) => {
    const emails = [];
    
    try {
      if (fileType === 'csv') {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => {
            // Look for email in any column
            Object.values(row).forEach(value => {
              if (typeof value === 'string' && value.includes('@')) {
                const emailMatch = value.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                if (emailMatch) {
                  emails.push(emailMatch[1].toLowerCase());
                }
              }
            });
          })
          .on('end', () => {
            resolve([...new Set(emails)]); // Remove duplicates
          })
          .on('error', reject);
      } else {
        // Handle Excel files
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);
        
        data.forEach(row => {
          Object.values(row).forEach(value => {
            if (typeof value === 'string' && value.includes('@')) {
              const emailMatch = value.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
              if (emailMatch) {
                emails.push(emailMatch[1].toLowerCase());
              }
            }
          });
        });
        
        resolve([...new Set(emails)]); // Remove duplicates
      }
    } catch (error) {
      reject(error);
    }
  });
}

// Send invitations endpoint
router.post('/send-invitations', requireAdmin, validateInvitationRequest, async (req, res) => {
  try {
    console.log('📧 Admin invitation request received:', {
      emailCount: req.body.emails.length,
      type: req.body.type,
      hasTemplate: !!req.body.template
    });

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { emails, template, type } = req.body;
    
    // Process the email template
    const processedTemplate = processEmailTemplate(template, type);
    
    // Send emails
    const results = [];
    let successCount = 0;
    let failureCount = 0;
    
    for (const email of emails) {
      try {
        const result = await emailService.sendInvitationEmail(
          email,
          processedTemplate.subject,
          processedTemplate.content,
          type
        );
        
        if (result.success) {
          successCount++;
          results.push({ email, status: 'success', messageId: result.messageId });
        } else {
          failureCount++;
          results.push({ email, status: 'failed', error: result.error });
        }
      } catch (error) {
        failureCount++;
        results.push({ email, status: 'failed', error: error.message });
      }
    }
    
    console.log(`✅ Invitation sending completed: ${successCount} success, ${failureCount} failed`);
    
    res.json({
      success: true,
      message: `Successfully sent ${successCount} out of ${emails.length} invitations`,
      results: {
        total: emails.length,
        success: successCount,
        failed: failureCount,
        details: results
      }
    });
    
  } catch (error) {
    console.error('❌ Error sending invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invitations',
      error: error.message
    });
  }
});

// Upload and process file endpoint
router.post('/upload-file', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('📁 File upload received:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    const filePath = req.file.path;
    const fileType = req.file.originalname.endsWith('.csv') ? 'csv' : 'excel';
    
    // Extract emails from file
    const emails = await extractEmailsFromFile(filePath, fileType);
    
    // Clean up temporary file
    fs.unlinkSync(filePath);
    
    if (emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid email addresses found in the uploaded file'
      });
    }
    
    console.log(`✅ Extracted ${emails.length} emails from file`);
    
    res.json({
      success: true,
      message: `Successfully extracted ${emails.length} email addresses`,
      emails: emails,
      count: emails.length
    });
    
  } catch (error) {
    console.error('❌ Error processing uploaded file:', error);
    
    // Clean up temporary file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to process uploaded file',
      error: error.message
    });
  }
});

// Get default templates endpoint
router.get('/templates', requireAdmin, (req, res) => {
  try {
    res.json({
      success: true,
      templates: defaultTemplates
    });
  } catch (error) {
    console.error('❌ Error fetching templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates',
      error: error.message
    });
  }
});

// Get invitation statistics endpoint
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    // This would typically fetch from a database
    // For now, return mock data with realistic numbers
    const stats = {
      totalSent: 150,
      totalOpened: 89,
      totalClicked: 45,
      jobseekerInvitations: {
        sent: 100,
        opened: 62,
        clicked: 28
      },
      companyInvitations: {
        sent: 50,
        opened: 27,
        clicked: 17
      }
    };
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('❌ Error fetching invitation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitation statistics',
      error: error.message
    });
  }
});

// Test email endpoint
router.post('/test-email', requireAdmin, [
  body('email').isEmail().normalizeEmail(),
  body('type').isIn(['jobseeker', 'company'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, type } = req.body;
    const template = defaultTemplates[type];
    const processedTemplate = processEmailTemplate(template, type);
    
    const result = await emailService.sendInvitationEmail(
      email,
      processedTemplate.subject,
      processedTemplate.content,
      type
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
        result: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

module.exports = router;
