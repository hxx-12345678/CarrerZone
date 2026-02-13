'use strict';



const express = require('express');

const multer = require('multer');

const path = require('path');

const fs = require('fs');

const csv = require('csv-parser');

const xlsx = require('xlsx');

const jwt = require('jsonwebtoken');

const User = require('../models/User');

const Company = require('../models/Company');

const Job = require('../models/Job');

const { sequelize } = require('../config/sequelize');

const BulkJobImport = require('../models/BulkJobImport')(sequelize);

const JobTemplate = require('../models/JobTemplate');



const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();



// Health check endpoint for bulk import

router.get('/health', (req, res) => {

  res.json({

    status: 'ok',

    service: 'bulk-import',

    timestamp: new Date().toISOString(),

    cors: 'enabled'

  });

});



// Multer middleware for handling file uploads



// Configure multer for file uploads

const storage = multer.diskStorage({

  destination: function (req, file, cb) {

    const uploadDir = path.join(__dirname, '../uploads/bulk-imports');

    if (!fs.existsSync(uploadDir)) {

      fs.mkdirSync(uploadDir, { recursive: true });

    }

    cb(null, uploadDir);

  },

  filename: function (req, file, cb) {

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

    const extension = path.extname(file.originalname);

    const filename = 'bulk-import-' + uniqueSuffix + extension;

    cb(null, filename);

  }

});



const upload = multer({

  storage: storage,

  limits: {

    fileSize: 10 * 1024 * 1024 // 10MB limit

  },

  fileFilter: function (req, file, cb) {

    const allowedTypes = ['.csv', '.xlsx', '.xls', '.json'];

    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {

      cb(null, true);

    } else {

      cb(new Error('Only CSV, Excel, and JSON files are allowed'));

    }

  }

});







// Get all bulk imports for a company

router.get('/', authenticateToken, async (req, res) => {

  try {

    const { page = 1, limit = 10, status, importType } = req.query;

    const offset = (page - 1) * limit;



    const whereClause = {

      companyId: req.user.companyId || req.user.company_id

    };



    if (status) {

      whereClause.status = status;

    }



    if (importType) {

      whereClause.importType = importType;

    }



    const imports = await BulkJobImport.findAndCountAll({

      where: whereClause,

      order: [['created_at', 'DESC']],

      limit: parseInt(limit),

      offset: parseInt(offset)

      // Removed include to avoid association error

    });



    const normalizedRows = (imports.rows || []).map((r) => {
      const obj = typeof r.toJSON === 'function' ? r.toJSON() : r;
      return {
        ...obj,
        fileUrl: obj.fileUrl || obj.filePath || null
      };
    });

    res.json({

      success: true,

      data: {

        imports: normalizedRows,

        pagination: {

          total: imports.count,

          page: parseInt(page),

          limit: parseInt(limit),

          pages: Math.ceil(imports.count / limit)

        }

      }

    });

  } catch (error) {

    console.error('Get bulk imports error:', error);

    res.status(500).json({

      success: false,

      message: 'Failed to fetch bulk imports',

      error: error.message

    });

  }

});



// Get specific bulk import details

router.get('/:id', authenticateToken, async (req, res) => {

  try {

    const { id } = req.params;



    const importRecord = await BulkJobImport.findOne({

      where: {

        id: id,

        companyId: req.user.companyId || req.user.company_id

      }

      // Removed include to avoid association error

    });



    if (!importRecord) {

      return res.status(404).json({

        success: false,

        message: 'Bulk import not found'

      });

    }



    const recordObj = typeof importRecord.toJSON === 'function' ? importRecord.toJSON() : importRecord;

    res.json({

      success: true,

      data: {
        ...recordObj,
        fileUrl: recordObj.fileUrl || recordObj.filePath || null
      }

    });

  } catch (error) {

    console.error('Get bulk import error:', error);

    res.status(500).json({

      success: false,

      message: 'Failed to fetch bulk import',

      error: error.message

    });

  }

});



// Simple upload route for testing

router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {

  try {

    if (!req.file) {

      return res.status(400).json({

        success: false,

        message: 'No file uploaded'

      });

    }



    res.json({

      success: true,

      message: 'File uploaded successfully',

      file: {

        filename: req.file.filename,

        originalname: req.file.originalname,

        size: req.file.size,

        path: req.file.path

      }

    });

  } catch (error) {

    console.error('Upload error:', error);

    res.status(500).json({

      success: false,

      message: 'Failed to upload file',

      error: error.message

    });

  }

});



// Create new bulk import with proper multer handling

router.post('/', authenticateToken, upload.single('file'), async (req, res) => {

  try {

    console.log('🔍 Bulk import POST request received');

    console.log('📊 Request headers:', req.headers);

    console.log('📊 Content-Type:', req.get('Content-Type'));

    console.log('📊 Request body:', req.body);

    console.log('📊 Request file:', req.file);

    console.log('📊 User:', req.user ? req.user.id : 'No user');

    console.log('📊 Raw body type:', typeof req.body);

    console.log('📊 Raw body length:', req.body ? Object.keys(req.body).length : 0);

    console.log('📊 Raw body content:', req.body);

    console.log('📊 Request method:', req.method);

    console.log('📊 Request URL:', req.url);



    // Safely extract form data with fallbacks

    const importName = req.body?.importName || '';

    const importType = req.body?.importType || 'csv';

    const templateId = req.body?.templateId || null;

    const defaultValues = req.body?.defaultValues || '{}';

    const mappingConfig = req.body?.mappingConfig || '{}';

    const validationRules = req.body?.validationRules || '{}';

    const isScheduled = req.body?.isScheduled || 'false';

    const scheduledAt = req.body?.scheduledAt || null;

    const notificationEmail = req.body?.notificationEmail || null;



    if (!req.file) {

      return res.status(400).json({

        success: false,

        message: 'No file uploaded'

      });

    }



    // Parse default values and mapping config from JSON strings (with error handling)

    let parsedDefaultValues = {};

    let parsedMappingConfig = {};

    let parsedValidationRules = {};



    try {

      parsedDefaultValues = defaultValues ? JSON.parse(defaultValues) : {};

    } catch (error) {

      console.warn('Failed to parse defaultValues:', error.message);

      parsedDefaultValues = {};

    }



    try {

      parsedMappingConfig = mappingConfig ? JSON.parse(mappingConfig) : {};

    } catch (error) {

      console.warn('Failed to parse mappingConfig:', error.message);

      parsedMappingConfig = {};

    }



    try {

      parsedValidationRules = validationRules ? JSON.parse(validationRules) : {};

    } catch (error) {

      console.warn('Failed to parse validationRules:', error.message);

      parsedValidationRules = {};

    }



    // CRITICAL: Prioritize user's company_id first (most reliable source)
    // This ensures bulk imports use the user's actual company association
    const userCompanyId = req.user.company_id || req.user.companyId;

    // Create bulk import record
    // Some production databases might not have file_url column yet.
    // Attempt normal create first; if it fails due to missing file_url, retry using filePath.

    let bulkImport;
    try {
      bulkImport = await BulkJobImport.create({
        importName,
        importType: importType || path.extname(req.file.originalname).substring(1),
        fileUrl: `/uploads/bulk-imports/${req.file.filename}`,
        fileSize: req.file.size,
        mappingConfig: parsedMappingConfig,
        validationRules: parsedValidationRules,
        defaultValues: parsedDefaultValues,
        templateId: templateId || null,
        isScheduled: isScheduled === 'true',
        scheduledAt: isScheduled === 'true' ? new Date(scheduledAt) : null,
        notificationEmail,
        createdBy: req.user.id,
        companyId: userCompanyId || null
      });
    } catch (createErr) {
      const msg = createErr?.parent?.message || createErr?.message || '';
      const missingFileUrlColumn = /column\s+"?file_url"?\s+does not exist/i.test(msg);
      if (!missingFileUrlColumn) throw createErr;

      console.warn('⚠️ bulk_job_imports.file_url missing; retrying create using filePath');
      bulkImport = await BulkJobImport.create({
        importName,
        importType: importType || path.extname(req.file.originalname).substring(1),
        filePath: `/uploads/bulk-imports/${req.file.filename}`,
        fileSize: req.file.size,
        mappingConfig: parsedMappingConfig,
        validationRules: parsedValidationRules,
        defaultValues: parsedDefaultValues,
        templateId: templateId || null,
        isScheduled: isScheduled === 'true',
        scheduledAt: isScheduled === 'true' ? new Date(scheduledAt) : null,
        notificationEmail,
        createdBy: req.user.id,
        companyId: userCompanyId || null
      });
    }



    // If not scheduled, start processing immediately

    if (!isScheduled || isScheduled === 'false') {

      // Start processing in background

      processBulkImport(bulkImport.id).catch(error => {

        console.error('Background processing error:', error);

      });

    }



    res.json({

      success: true,

      message: 'Bulk import created successfully',

      data: bulkImport

    });

  } catch (error) {

    console.error('Create bulk import error:', error);

    console.error('Error stack:', error.stack);



    // Determine appropriate status code

    let statusCode = 500;

    let errorMessage = 'Failed to create bulk import';



    if (error.name === 'ValidationError') {

      statusCode = 400;

      errorMessage = 'Validation error: ' + error.message;

    } else if (error.name === 'SequelizeValidationError') {

      statusCode = 400;

      errorMessage = 'Database validation error: ' + error.message;

    } else if (error.name === 'SequelizeUniqueConstraintError') {

      statusCode = 409;

      errorMessage = 'Duplicate entry error: ' + error.message;

    }



    res.status(statusCode).json({

      success: false,

      message: errorMessage,

      error: error.message,

      details: process.env.NODE_ENV === 'development' ? error.stack : undefined

    });

  }

});



// Cancel bulk import

router.post('/:id/cancel', authenticateToken, async (req, res) => {

  try {

    const { id } = req.params;


    // Prioritize user's company_id first
    const userCompanyId = req.user.company_id || req.user.companyId;


    const importRecord = await BulkJobImport.findOne({

      where: {

        id: id,

        companyId: userCompanyId || null
      }

    });



    if (!importRecord) {

      return res.status(404).json({

        success: false,

        message: 'Bulk import not found'

      });

    }



    if (importRecord.status === 'completed') {

      return res.status(400).json({

        success: false,

        message: 'Cannot cancel completed import'

      });

    }



    await importRecord.update({

      status: 'cancelled',

      cancelledAt: new Date()

    });



    res.json({

      success: true,

      message: 'Bulk import cancelled successfully'

    });

  } catch (error) {

    console.error('Cancel bulk import error:', error);

    res.status(500).json({

      success: false,

      message: 'Failed to cancel bulk import',

      error: error.message

    });

  }

});



// Retry failed bulk import

router.post('/:id/retry', authenticateToken, async (req, res) => {

  try {

    const { id } = req.params;


    // Prioritize user's company_id first
    const userCompanyId = req.user.company_id || req.user.companyId;


    const importRecord = await BulkJobImport.findOne({

      where: {

        id: id,

        companyId: userCompanyId || null
      }

    });



    if (!importRecord) {

      return res.status(404).json({

        success: false,

        message: 'Bulk import not found'

      });

    }



    if (importRecord.status !== 'failed') {

      return res.status(400).json({

        success: false,

        message: 'Can only retry failed imports'

      });

    }



    // Reset import status

    await importRecord.update({

      status: 'pending',

      processedRecords: 0,

      successfulImports: 0,

      failedImports: 0,

      skippedRecords: 0,

      progress: 0,

      startedAt: null,

      completedAt: null,

      errorLog: [],

      successLog: []

    });



    // Start processing in background

    processBulkImport(importRecord.id).catch(error => {

      console.error('Background processing error:', error);

    });



    res.json({

      success: true,

      message: 'Bulk import retry initiated'

    });

  } catch (error) {

    console.error('Retry bulk import error:', error);

    res.status(500).json({

      success: false,

      message: 'Failed to retry bulk import',

      error: error.message

    });

  }

});


// Delete single bulk import (and associated jobs if requested)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteJobs = false } = req.query; // Optional: delete associated jobs

    // Prioritize user's company_id first
    const userCompanyId = req.user.company_id || req.user.companyId;

    const importRecord = await BulkJobImport.findOne({
      where: {
        id: id,
        companyId: userCompanyId || null
      }
    });

    if (!importRecord) {
      return res.status(404).json({
        success: false,
        message: 'Bulk import not found'
      });
    }

    // If deleteJobs is true, delete all jobs created by this import
    if (deleteJobs === 'true' || deleteJobs === true) {
      // Find jobs created by this import (we'll need to track this via successLog or metadata)
      const jobsToDelete = await Job.findAll({
        where: {
          employerId: importRecord.createdBy,
          companyId: userCompanyId || null,
          // Find jobs created around the import time window
          createdAt: {
            [require('sequelize').Op.gte]: importRecord.createdAt || new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        limit: 1000 // Safety limit
      });

      if (jobsToDelete.length > 0) {
        console.log(`🗑️ Deleting ${jobsToDelete.length} jobs associated with bulk import ${id}`);
        for (const job of jobsToDelete) {
          await job.destroy(); // This will cascade delete related records
        }
      }
    }

    // Delete the uploaded file if it exists
    if (importRecord.fileUrl) {
      const filePath = path.join(__dirname, '../uploads/bulk-imports', path.basename(importRecord.fileUrl));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted file: ${filePath}`);
      }
    }

    // Delete the bulk import record
    await importRecord.destroy();

    res.json({
      success: true,
      message: deleteJobs ? 'Bulk import and associated jobs deleted successfully' : 'Bulk import deleted successfully'
    });
  } catch (error) {
    console.error('Delete bulk import error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bulk import',
      error: error.message
    });
  }
});

// Delete all bulk imports for the user's company
router.delete('/', authenticateToken, async (req, res) => {
  try {
    // Prioritize user's company_id first
    const userCompanyId = req.user.company_id || req.user.companyId;
    const { deleteJobs = false } = req.query;

    // Find all bulk imports for this company
    const imports = await BulkJobImport.findAll({
      where: {
        companyId: userCompanyId || null
      }
    });

    if (imports.length === 0) {
      return res.json({
        success: true,
        message: 'No bulk imports found to delete',
        deletedCount: 0
      });
    }

    let deletedJobsCount = 0;
    let deletedFilesCount = 0;

    // Delete associated jobs if requested
    if (deleteJobs === 'true' || deleteJobs === true) {
      for (const importRecord of imports) {
        const jobsToDelete = await Job.findAll({
          where: {
            employerId: importRecord.createdBy,
            companyId: userCompanyId || null,
            createdAt: {
              [require('sequelize').Op.gte]: importRecord.createdAt || new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          },
          limit: 1000
        });

        for (const job of jobsToDelete) {
          await job.destroy();
          deletedJobsCount++;
        }
      }
    }

    // Delete files and records
    for (const importRecord of imports) {
      if (importRecord.fileUrl) {
        const filePath = path.join(__dirname, '../uploads/bulk-imports', path.basename(importRecord.fileUrl));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          deletedFilesCount++;
        }
      }
      await importRecord.destroy();
    }

    res.json({
      success: true,
      message: `Deleted ${imports.length} bulk import(s)${deleteJobs ? ` and ${deletedJobsCount} job(s)` : ''}`,
      deletedCount: imports.length,
      deletedJobsCount: deleteJobs ? deletedJobsCount : 0,
      deletedFilesCount
    });
  } catch (error) {
    console.error('Delete all bulk imports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bulk imports',
      error: error.message
    });
  }
});


// Download template

router.get('/template/:type', authenticateToken, async (req, res) => {

  try {

    const { type } = req.params;



    // Create template based on type

    const template = createJobTemplate(type);


    // CRITICAL: Double-check that no hot vacancy fields are present before generating template
    const finalTemplate = filterHotVacancyFields(template);


    if (type === 'csv') {

      // Generate CSV file

      res.setHeader('Content-Type', 'text/csv');

      res.setHeader('Content-Disposition', `attachment; filename="job-import-template.csv"`);



      // Convert template to CSV

      const csvContent = convertToCSV(finalTemplate);
      res.send(csvContent);

    } else {

      // Generate Excel file

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      res.setHeader('Content-Disposition', `attachment; filename="job-import-template-${type}.xlsx"`);



      const workbook = xlsx.utils.book_new();

      const worksheet = xlsx.utils.json_to_sheet(finalTemplate);
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Jobs');

      const buffer = xlsx.write(workbook, { type: 'buffer' });

      res.send(buffer);

    }

  } catch (error) {

    console.error('Download template error:', error);

    res.status(500).json({

      success: false,

      message: 'Failed to generate template',

      error: error.message

    });

  }

});



// Helper function to parse and normalize salary fields
// Handles both formats: "30-40 LPA" (LPA format) or "3000000-4000000" (raw rupee amounts)
function parseSalaryFields(record) {
  let salaryMin = record.salaryMin ? parseFloat(record.salaryMin) : null;
  let salaryMax = record.salaryMax ? parseFloat(record.salaryMax) : null;
  let formattedSalary = record.salary || '';

  // If salary string is provided, parse it
  if (record.salary && typeof record.salary === 'string') {
    // Remove currency symbols and extra spaces
    const cleanSalary = record.salary.replace(/[₹,]/g, '').trim();

    // Check if it's in LPA format (contains "LPA" or "lpa")
    const isLPAFormat = /lpa/i.test(cleanSalary);

    // Extract numbers from range like "30-40" or "3000000-4000000"
    const salaryMatch = cleanSalary.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);

    if (salaryMatch) {
      let min = parseFloat(salaryMatch[1]);
      let max = parseFloat(salaryMatch[2]);

      // Determine if numbers are in LPA or raw rupees
      // If contains "LPA" OR numbers are small (< 1000), assume LPA format
      if (isLPAFormat || (min < 1000 && max < 1000)) {
        // Convert LPA to actual rupees (multiply by 100000)
        salaryMin = min * 100000;
        salaryMax = max * 100000;
        // Format for display (in LPA) - already in LPA format
        formattedSalary = `${min}-${max} LPA`;
      } else {
        // Already in rupees, use as-is, but format display in LPA
        salaryMin = min;
        salaryMax = max;
        // Convert to LPA for display
        const minLPA = (min / 100000).toFixed(0);
        const maxLPA = (max / 100000).toFixed(0);
        formattedSalary = `${minLPA}-${maxLPA} LPA`;
      }
    } else {
      // Single value
      const singleValue = parseFloat(cleanSalary.replace(/[^\d.]/g, ''));
      if (!isNaN(singleValue)) {
        if (isLPAFormat || singleValue < 1000) {
          salaryMin = singleValue * 100000;
          formattedSalary = `${singleValue} LPA`;
        } else {
          salaryMin = singleValue;
          formattedSalary = `${(singleValue / 100000).toFixed(0)} LPA`;
        }
      }
    }
  }

  // If salaryMin/salaryMax are provided directly, ensure they're in rupees
  // If they're small numbers (< 100000), assume they're in LPA format
  if (salaryMin !== null && !isNaN(salaryMin)) {
    if (salaryMin < 100000 && salaryMin > 0) {
      // Likely in LPA format, convert to rupees
      salaryMin = salaryMin * 100000;
    }
  }

  if (salaryMax !== null && !isNaN(salaryMax)) {
    if (salaryMax < 100000 && salaryMax > 0) {
      // Likely in LPA format, convert to rupees
      salaryMax = salaryMax * 100000;
    }
  }

  // If both salaryMin and salaryMax exist but no formatted string, create one
  if (salaryMin !== null && salaryMax !== null && !formattedSalary) {
    const minLPA = (salaryMin / 100000).toFixed(0);
    const maxLPA = (salaryMax / 100000).toFixed(0);
    formattedSalary = `${minLPA}-${maxLPA} LPA`;
  }

  // Sanitize to avoid database overflow (DECIMAL(10,2) max is 99999999.99)
  const MAX_DECIMAL_VALUE = 99999999.99;
  if (salaryMin !== null && salaryMin > MAX_DECIMAL_VALUE) {
    salaryMin = MAX_DECIMAL_VALUE;
  }
  if (salaryMax !== null && salaryMax > MAX_DECIMAL_VALUE) {
    salaryMax = MAX_DECIMAL_VALUE;
  }

  return {
    salaryMin: salaryMin !== null && !isNaN(salaryMin) ? salaryMin : null,
    salaryMax: salaryMax !== null && !isNaN(salaryMax) ? salaryMax : null,
    formattedSalary: formattedSalary
  };
}

// Background processing function

async function processBulkImport(importId) {

  try {

    const importRecord = await BulkJobImport.findByPk(importId);

    if (!importRecord) {

      throw new Error('Import record not found');

    }



    // Update status to processing

    await importRecord.update({

      status: 'processing',

      startedAt: new Date()

    });



    const filePath = path.join(__dirname, '../uploads/bulk-imports', path.basename(importRecord.fileUrl));



    if (!fs.existsSync(filePath)) {

      throw new Error('Import file not found');

    }



    const records = await parseImportFile(filePath, importRecord.importType);

    const totalRecords = records.length;



    await importRecord.update({

      totalRecords: totalRecords

    });



    let processedRecords = 0;

    let successfulImports = 0;

    let failedImports = 0;

    let skippedRecords = 0;

    const errorLog = [];

    const successLog = [];



    // Process each record

    for (const record of records) {

      try {

        // Validate record

        const validationResult = validateJobRecord(record, importRecord.validationRules);

        if (!validationResult.isValid) {

          errorLog.push({

            record: record,

            error: validationResult.errors,

            timestamp: new Date()

          });

          failedImports++;

          processedRecords++;

          continue;

        }


        // Get user for region and companyId
        const user = await User.findByPk(importRecord.createdBy);
        if (!user) {
          throw new Error('User not found');
        }

        // CRITICAL: companyId is REQUIRED for Job model - prioritize user's company_id FIRST
        // Priority: user.company_id > importRecord.companyId > user.companyId
        // User's company_id is the most reliable source as it represents their actual company association
        let companyId = user.company_id || user.companyId || importRecord.companyId;
        if (!companyId) {
          throw new Error('Company ID is required. User must be associated with a company. Please ensure your account is linked to a company before importing jobs.');
        }

        // CRITICAL: Get company information for consultancy name auto-setting
        const userCompany = await Company.findByPk(companyId);
        if (!userCompany) {
          throw new Error('Company not found. User must be associated with a valid company.');
        }

        // Get company for region if user doesn't have one
        let region = user.region || 'india';
        if (!region && userCompany && userCompany.region) {
          region = userCompany.region;
        }


        // Check for duplicates

        const existingJob = await Job.findOne({

          where: {

            title: record.title,

            companyId: companyId,
            location: record.location

          }

        });



        if (existingJob) {

          skippedRecords++;

          processedRecords++;

          continue;

        }



        // Generate slug from title

        const slug = record.title.toLowerCase()

          .replace(/[^a-z0-9\s-]/g, '')

          .replace(/\s+/g, '-')

          .replace(/-+/g, '-')

          .replace(/^-+|-+$/g, '') + '-' + Date.now();



        // Map CSV/Excel fields to Job model fields properly
        // Handle type vs jobType mapping
        const jobType = record.type || record.jobType || 'full-time';

        // Map experience to experienceLevel
        const experienceLevelMap = {
          'fresher': 'entry',
          'entry': 'entry',
          'junior': 'junior',
          'mid': 'mid',
          'senior': 'senior'
        };
        const experienceLevel = record.experienceLevel ||
          (record.experience ? experienceLevelMap[record.experience] : 'entry');

        // Handle employmentType mapping (if provided, otherwise derive from jobType)
        let employmentType = record.employmentType || record.employment_type || '';
        if (!employmentType && jobType) {
          // Derive employmentType from jobType if not provided
          if (jobType === 'full-time') employmentType = 'Full Time, Permanent';
          else if (jobType === 'part-time') employmentType = 'Part Time, Permanent';
          else if (jobType === 'contract') employmentType = 'Full Time, Contract';
        }

        // Process skills - ensure it's an array or string
        let skillsArray = [];
        if (record.skills) {
          if (typeof record.skills === 'string') {
            skillsArray = record.skills.split(',').map(s => s.trim()).filter(s => s);
          } else if (Array.isArray(record.skills)) {
            skillsArray = record.skills;
          }
        }

        // Process benefits - ensure it's JSONB compatible
        let benefitsData = null;
        if (record.benefits) {
          if (typeof record.benefits === 'string') {
            benefitsData = record.benefits.split(',').map(b => b.trim()).filter(b => b);
          } else if (Array.isArray(record.benefits)) {
            benefitsData = record.benefits;
          }
        }

        // Process education - ensure it's a string (not array)
        let educationStr = '';
        if (record.education) {
          if (Array.isArray(record.education)) {
            educationStr = record.education.join(', ');
          } else {
            educationStr = String(record.education);
          }
        }

        // Process tags - ensure it's an array
        let tagsArray = [];
        if (record.tags) {
          if (typeof record.tags === 'string') {
            tagsArray = record.tags.split(',').map(t => t.trim()).filter(t => t);
          } else if (Array.isArray(record.tags)) {
            tagsArray = record.tags;
          }
        }

        // Handle consultancy posting fields
        const postingType = record.postingType || record.posting_type || 'company';

        // CRITICAL: For consultancy postings, consultancy name MUST be the employer's company name
        // Auto-set consultancyName to the company name, ignoring any value from the import file
        let consultancyName = null;
        if (postingType === 'consultancy') {
          if (userCompany && userCompany.name) {
            consultancyName = userCompany.name;
            console.log('✅ Auto-setting consultancy name to employer company:', consultancyName);
          } else {
            throw new Error('Cannot create consultancy posting: Employer company name not found');
          }
        }

        const metadata = {
          postingType: postingType,
          companyName: record.companyName || record.company_name || null,
          ...(postingType === 'consultancy' && {
            // CRITICAL: consultancyName is always the employer's company name (auto-set above)
            consultancyName: consultancyName,
            hiringCompany: {
              name: record.hiringCompanyName || record.hiring_company_name || null,
              industry: record.hiringCompanyIndustry || record.hiring_company_industry || null,
              description: record.hiringCompanyDescription || record.hiring_company_description || null
            },
            showHiringCompanyDetails: record.showHiringCompanyDetails === 'true' || record.showHiringCompanyDetails === true || false
          })
        };

        // Create job with proper field mapping
        const jobData = {

          title: record.title || '',
          description: record.description || '',
          location: record.location || '',
          city: record.city || '',
          state: record.state || '',
          country: record.country || 'India',
          region: record.region || region || 'india', // CRITICAL: Must set region
          requirements: record.requirements || '',
          responsibilities: record.responsibilities || '',
          type: jobType,
          jobType: jobType, // Set both for compatibility
          experienceLevel: experienceLevel,
          experience: record.experience || 'fresher',
          experienceMin: record.experienceMin || null,
          experienceMax: record.experienceMax || null,
          // Parse and normalize salary fields - handles both "30-40 LPA" and "3000000-4000000" formats
          ...(() => {
            const parsed = parseSalaryFields(record);
            return {
              salary: parsed.formattedSalary || '',
              salaryMin: parsed.salaryMin,
              salaryMax: parsed.salaryMax
            };
          })(),
          salaryCurrency: record.salaryCurrency || 'INR',
          salaryPeriod: record.salaryPeriod || 'yearly',
          department: record.department || '',
          category: record.category || '',
          industryType: record.industryType || record.industry_type || '',
          roleCategory: record.roleCategory || record.role_category || '',
          role: record.role || '', // CRITICAL: Role field from Step 2
          employmentType: employmentType, // CRITICAL: Employment Type from Step 2
          skills: skillsArray,
          education: educationStr,
          benefits: benefitsData,
          remoteWork: record.remoteWork || 'on-site',
          shiftTiming: record.shiftTiming || 'day',
          tags: tagsArray,
          isUrgent: record.isUrgent === 'true' || record.isUrgent === true || false,
          isFeatured: record.isFeatured === 'true' || record.isFeatured === true || false,
          isPremium: record.isPremium === 'true' || record.isPremium === true || false,
          applicationDeadline: record.applicationDeadline ? new Date(record.applicationDeadline) : null,
          // Company associations - CRITICAL
          companyId: companyId, // Use validated companyId
          employerId: importRecord.createdBy,

          // CRITICAL: Status must be 'active' for jobs to appear in listings
          status: 'active',
          slug: slug,
          publishedAt: new Date(), // CRITICAL: Set publishedAt for active jobs
          // CRITICAL: Set validTill for public visibility (default 21 days from now if not provided)
          validTill: record.validTill ? new Date(record.validTill) : new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          // CONSULTANCY METADATA - Store consultancy posting fields in metadata
          metadata: metadata,
          // Merge any default values from import
          ...importRecord.defaultValues

        };



        const job = await Job.create(jobData);



        successLog.push({

          jobId: job.id,

          title: job.title,

          timestamp: new Date()

        });



        successfulImports++;

        processedRecords++;



        // Update progress

        const progress = Math.round((processedRecords / totalRecords) * 100);

        await importRecord.update({

          processedRecords,

          successfulImports,

          failedImports,

          skippedRecords,

          progress,

          errorLog,

          successLog

        });



      } catch (error) {

        console.error('Error processing record:', error);

        errorLog.push({

          record: record,

          error: error.message,

          timestamp: new Date()

        });

        failedImports++;

        processedRecords++;

      }

    }



    // Mark as completed

    await importRecord.update({

      status: 'completed',

      completedAt: new Date(),

      progress: 100

    });



    // Send notification email if configured

    if (importRecord.notificationEmail) {

      // TODO: Send notification email

      console.log('Sending notification email to:', importRecord.notificationEmail);

    }



  } catch (error) {

    console.error('Bulk import processing error:', error);



    try {

      await BulkJobImport.update({

        status: 'failed',

        completedAt: new Date(),

        errorLog: [{ error: error.message, timestamp: new Date() }]

      }, {

        where: { id: importId }

      });

    } catch (updateError) {

      console.error('Failed to update import status:', updateError);

    }

  }

}



// Parse import file based on type

async function parseImportFile(filePath, importType) {

  return new Promise((resolve, reject) => {

    const records = [];



    if (importType === 'csv') {

      fs.createReadStream(filePath)

        .pipe(csv())

        .on('data', (data) => records.push(data))

        .on('end', () => resolve(records))

        .on('error', reject);

    } else if (importType === 'xlsx' || importType === 'xls') {

      try {

        const workbook = xlsx.readFile(filePath);

        const sheetName = workbook.SheetNames[0];

        const worksheet = workbook.Sheets[sheetName];

        const data = xlsx.utils.sheet_to_json(worksheet);

        resolve(data);

      } catch (error) {

        reject(error);

      }

    } else if (importType === 'json') {

      try {

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        resolve(Array.isArray(data) ? data : [data]);

      } catch (error) {

        reject(error);

      }

    } else {

      reject(new Error('Unsupported file type'));

    }

  });

}



// Validate job record

function validateJobRecord(record, validationRules) {

  const errors = [];



  // Required fields

  const requiredFields = ['title', 'description', 'location'];

  for (const field of requiredFields) {

    if (!record[field] || record[field].toString().trim() === '') {

      errors.push(`${field} is required`);

    }

  }



  // Custom validation rules

  if (validationRules) {

    // Add custom validation logic here

  }



  return {

    isValid: errors.length === 0,

    errors: errors

  };

}



// Convert array of objects to CSV

function convertToCSV(data) {

  if (!data || data.length === 0) return '';



  // Get headers from the first object

  const headers = Object.keys(data[0]);



  // Create CSV header row

  const csvHeader = headers.join(',');



  // Create CSV data rows

  const csvRows = data.map(row => {

    return headers.map(header => {

      const value = row[header];

      // Escape commas and quotes in values

      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {

        return `"${value.replace(/"/g, '""')}"`;

      }

      return value;

    }).join(',');

  });



  return [csvHeader, ...csvRows].join('\n');

}



// List of hot vacancy fields that should NEVER appear in bulk import template
const HOT_VACANCY_FIELDS = [
  'isHotVacancy',
  'urgentHiring',
  'multipleEmailIds',
  'boostedSearch',
  'searchBoostLevel',
  'citySpecificBoost',
  'videoBanner',
  'whyWorkWithUs',
  'companyReviews',
  'autoRefresh',
  'refreshDiscount',
  'attachmentFiles',
  'officeImages',
  'companyProfile',
  'proactiveAlerts',
  'alertRadius',
  'alertFrequency',
  'featuredKeywords',
  'customBranding',
  'superFeatured',
  'tierLevel',
  'externalApplyUrl',
  'hotVacancyPrice',
  'hotVacancyCurrency',
  'hotVacancyPaymentStatus',
  'urgencyLevel',
  'hiringTimeline',
  'maxApplications',
  'pricingTier',
  'price',
  'currency',
  'paymentId',
  'paymentDate',
  'priorityListing',
  'featuredBadge',
  'unlimitedApplications',
  'advancedAnalytics',
  'candidateMatching',
  'directContact',
  'seoTitle',
  'seoDescription',
  'keywords',
  'impressions',
  'clicks'
];

// Filter out hot vacancy fields from template data
function filterHotVacancyFields(templateArray) {
  return templateArray.map(record => {
    const filtered = {};
    Object.keys(record).forEach(key => {
      // Exclude any hot vacancy fields
      if (!HOT_VACANCY_FIELDS.includes(key)) {
        filtered[key] = record[key];
      }
    });
    return filtered;
  });
}

// Create job template matching Job model structure
// This template includes ALL fields from /post-job page (excluding hot-vacancy specific fields)
// Supports both company posting and consultancy posting
// CRITICAL: NO hot vacancy fields are included in this template
function createJobTemplate(type) {

  const baseTemplate = [

    {

      // ========== STEP 1: BASIC INFO ==========
      // Required fields
      title: 'Senior Software Engineer',

      description: 'We are looking for a highly skilled Senior Software Engineer to lead our development team. The ideal candidate will have extensive experience in full-stack development and a strong understanding of scalable architectures.',

      location: 'Mumbai, Maharashtra',


      // Location details
      city: 'Mumbai',

      state: 'Maharashtra',

      country: 'India',

      region: 'india', // Options: 'india', 'gulf', 'other'

      // Job type and experience
      jobType: 'full-time', // Options: 'full-time', 'part-time', 'contract'
      type: 'full-time', // Alias for jobType
      experienceLevel: 'senior', // Options: 'entry', 'junior', 'mid', 'senior'
      experience: 'senior', // Alias: 'fresher', 'junior', 'mid', 'senior'
      experienceMin: 5,

      experienceMax: 10,


      // Salary details - IMPORTANT: Use LPA format (e.g., "30-40 LPA" or "3-4 LPA")
      // The system will automatically convert to rupee amounts for storage
      // Examples: "3-4 LPA", "30-40 LPA", "500000-800000" (raw rupees also supported)
      salary: '30-40 LPA', // Format: "min-max LPA" (e.g., "30-40 LPA") or raw rupees (e.g., "3000000-4000000")
      // NOTE: If using salaryMin/salaryMax, enter in LPA format (e.g., 30 for 30 LPA = 3000000 rupees)
      salaryMin: 30, // In LPA format (will be converted to 3000000 rupees automatically)
      salaryMax: 40, // In LPA format (will be converted to 4000000 rupees automatically)
      salaryCurrency: 'INR', // Options: 'INR', 'USD', 'EUR', etc.
      salaryPeriod: 'yearly', // Options: 'yearly', 'monthly', 'hourly'

      // Department, category, industry, and role category
      department: 'Engineering - Software & QA',
      category: 'Technology',

      industryType: 'Software Product (532)', // Industry type from Step 1 dropdown (include number for matching)
      roleCategory: 'Software Development', // Role category from Step 2 dropdown

      // Role and Employment Type (Step 2 - CRITICAL FIELDS)
      role: 'Senior Software Engineer', // CRITICAL: Specific role title (e.g., Security Administrator, Software Engineer, Data Analyst)
      employmentType: 'Full Time, Permanent', // CRITICAL: Options: 'Full Time, Permanent', 'Part Time, Permanent', 'Full Time, Contract', 'Part Time, Contract', 'Freelance', 'Temporary'

      // Skills and requirements
      skills: 'JavaScript,React,Node.js,TypeScript,PostgreSQL,AWS,Docker,Kubernetes', // Comma-separated
      requirements: "Bachelor's or Master's degree in Computer Science or related field, 5+ years of experience in software development, Proven leadership skills",

      responsibilities: 'Lead a team of software engineers,Design and implement scalable software solutions,Mentor junior developers,Collaborate with product and design teams',


      // Work details
      remoteWork: 'hybrid', // Options: 'on-site', 'remote', 'hybrid'
      shiftTiming: 'day', // Options: 'day', 'night', 'rotating'

      // Education and benefits
      education: "Bachelor's Degree", // String (not array in database)
      benefits: 'Health Insurance,401k,Remote Work,Paid Time Off,Performance Bonus,Learning Budget', // Comma-separated

      // Tags and metadata
      tags: 'javascript,react,fullstack,senior,leadership', // Comma-separated
      isUrgent: false, // true/false
      isFeatured: true, // true/false
      isPremium: false, // true/false

      // Dates
      validTill: '2024-12-31', // Format: YYYY-MM-DD
      applicationDeadline: '2024-12-31', // Format: YYYY-MM-DD

      // ========== POSTING TYPE: Company or Consultancy ==========
      postingType: 'company', // CRITICAL: Options: 'company' or 'consultancy'
      companyName: 'Tech Solutions Inc.', // REQUIRED if postingType='company'

      // Consultancy Fields (ONLY required if postingType='consultancy')
      // NOTE: consultancyName is AUTO-SET to your company name - do not include this column
      hiringCompanyName: '', // Company the consultancy is hiring for (REQUIRED if postingType='consultancy')
      hiringCompanyIndustry: 'Software Product (532)', // Industry of hiring company - use dropdown format with number (REQUIRED if postingType='consultancy')
      hiringCompanyDescription: '', // Description of hiring company (REQUIRED if postingType='consultancy')
      showHiringCompanyDetails: 'false' // "true" or "false" - whether to show hiring company details to candidates
    },

    {

      title: 'Marketing Manager',

      description: 'We are seeking a dynamic Marketing Manager to develop and execute comprehensive marketing strategies. This role requires a creative thinker with strong analytical skills and a proven track record in digital marketing.',

      location: 'Delhi, NCR',

      city: 'Delhi',

      state: 'Delhi',

      country: 'India',

      region: 'india',
      jobType: 'full-time',

      type: 'full-time',
      experienceLevel: 'mid',

      experience: 'mid',
      experienceMin: 3,

      experienceMax: 7,

      // Salary details - IMPORTANT: Use LPA format
      salary: '8-12 LPA', // Format: "min-max LPA" (e.g., "8-12 LPA") or raw rupees (e.g., "800000-1200000")
      salaryMin: 8, // In LPA format (will be converted to 800000 rupees automatically)
      salaryMax: 12, // In LPA format (will be converted to 1200000 rupees automatically)
      salaryCurrency: 'INR',

      salaryPeriod: 'yearly',

      department: 'Marketing & Communication', // Must match dropdown option
      category: 'Marketing',

      industryType: 'Internet (246)', // Industry type with number format
      roleCategory: 'Marketing',
      role: 'Marketing Manager', // CRITICAL: Role field
      employmentType: 'Full Time, Permanent', // CRITICAL: Employment Type
      skills: 'Digital Marketing,SEO,SEM,Content Marketing,Social Media,Analytics,Team Management',

      requirements: "Bachelor's degree in Marketing or Business, 3+ years of experience in marketing management, Strong communication and leadership skills",

      responsibilities: 'Develop and implement marketing campaigns,Manage digital marketing channels,Analyze market trends and competitor activities,Oversee content creation',

      remoteWork: 'remote',

      shiftTiming: 'day',

      education: "Bachelor's Degree",

      benefits: 'Health Insurance,Performance Bonus,Professional Development,Paid Time Off,Work from Home',
      tags: 'marketing,digital,seo,content,strategy',
      isUrgent: false,

      isFeatured: false,

      isPremium: false,

      validTill: '2024-12-31',

      applicationDeadline: '2024-12-31',

      // Company/Consultancy Posting Type
      postingType: 'company',
      companyName: 'Global Marketing Agency',


      // Consultancy Fields (ONLY required if postingType=consultancy)
      // NOTE: consultancyName is AUTO-SET to your company name - do not include this column
      hiringCompanyName: '',
      hiringCompanyIndustry: '',
      hiringCompanyDescription: '',
      showHiringCompanyDetails: 'false'
    },
    {
      // EXAMPLE: Consultancy Job
      title: 'Senior Developer (via Consultancy)',
      description: 'A leading consultancy is seeking a Senior Developer for one of our premium clients. This is an excellent opportunity to work with cutting-edge technology in a dynamic environment.',
      location: 'Bangalore, Karnataka',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      region: 'india',
      jobType: 'full-time',
      type: 'full-time',
      experienceLevel: 'senior',
      experience: 'senior',
      experienceMin: 5,
      experienceMax: 10,
      salary: '15-25 LPA',
      salaryMin: 1500000,
      salaryMax: 2500000,
      salaryCurrency: 'INR',
      salaryPeriod: 'yearly',
      department: 'Engineering - Software & QA',
      category: 'Technology',
      industryType: 'Software Product (532)', // Industry type (required even for consultancy)
      roleCategory: 'Software Development', // Role category
      role: 'Senior Developer', // CRITICAL: Role field
      employmentType: 'Full Time, Permanent', // CRITICAL: Employment Type
      skills: 'Java,Spring Boot,Microservices,AWS,React,TypeScript',
      requirements: "Bachelor's degree in Computer Science, 5+ years of experience in software development",
      responsibilities: 'Develop and maintain enterprise applications,Lead technical initiatives,Collaborate with cross-functional teams',
      remoteWork: 'hybrid',
      shiftTiming: 'day',
      education: "Bachelor's Degree",
      benefits: 'Health Insurance,Performance Bonus,Learning Budget',
      tags: 'java,spring,microservices,consultancy',
      isUrgent: false,
      isFeatured: false,
      isPremium: false,
      validTill: '2024-12-31',
      applicationDeadline: '2024-12-31',


      // ========== POSTING TYPE: Consultancy ==========
      postingType: 'consultancy', // CRITICAL: Set to 'consultancy' for consultancy postings
      companyName: '', // Leave empty for consultancy (only used for company postings)
      // NOTE: consultancyName is AUTO-SET to your company name - do not include this column
      hiringCompanyName: 'Fortune 500 Tech Corp', // REQUIRED: Company the consultancy is hiring for
      hiringCompanyIndustry: 'Software Product (532)', // REQUIRED: Industry of hiring company - use dropdown format with number
      hiringCompanyDescription: 'A leading software product company with global presence', // REQUIRED: Description of the hiring company
      showHiringCompanyDetails: 'true' // "true" or "false" - whether to show hiring company details to candidates
    }

  ];



  // CRITICAL: Filter out any hot vacancy fields to ensure they never appear in the template
  const filteredTemplate = filterHotVacancyFields(baseTemplate);

  return filteredTemplate;
}



module.exports = router;

