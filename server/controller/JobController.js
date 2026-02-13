'use strict';

const { Op } = require('sequelize');
const Job = require('../models/Job');
const Company = require('../models/Company');
const User = require('../models/User');
const JobPhoto = require('../models/JobPhoto');
const ViewTrackingService = require('../services/viewTrackingService');
const EmployerActivityService = require('../services/employerActivityService');
const EmployerQuotaService = require('../services/employerQuotaService');
const NotificationService = require('../services/notificationService');
const JobPreferenceMatchingService = require('../services/jobPreferenceMatchingService');

/**
 * Create a new job
 */
exports.createJob = async (req, res, next) => {
  try {
    console.log('🔍 Creating job with data:', req.body);
    console.log('👤 Authenticated user:', req.user.id, req.user.email);
    console.log('📥 Received request body department:', req.body.department);
    console.log('📥 Received request body customBranding:', req.body.customBranding ? 'Present' : 'Missing');

    const {
      title,
      description,
      location,
      companyId,
      jobType = 'full-time',
      type, // Handle both jobType and type for compatibility
      experienceLevel,
      experience,
      experienceMin,
      experienceMax,
      salaryMin,
      salaryMax,
      salary,
      salaryCurrency = 'INR',
      salaryPeriod = 'yearly',
      isSalaryVisible = true,
      department,
      category,
      skills = [],
      benefits = [],
      remoteWork = 'on-site',
      travelRequired = false,
      shiftTiming = 'day',
      noticePeriod,
      education,
      certifications = [],
      languages = [],
      status = 'draft',
      isUrgent = false,
      isFeatured = false,
      isPremium = false,
      validTill,
      publishedAt,
      tags = [],
      metadata = {},
      city,
      state,
      country = 'India',
      latitude,
      longitude,
      requirements,
      responsibilities,
      region,
      // New fields from step 2
      role,
      industryType,
      roleCategory,
      employmentType,
      // Hot Vacancy Premium Features
      isHotVacancy = false,
      urgentHiring = false,
      multipleEmailIds = [],
      boostedSearch = false,
      searchBoostLevel = 'standard',
      citySpecificBoost = [],
      videoBanner,
      whyWorkWithUs,
      companyReviews = [],
      autoRefresh = false,
      refreshDiscount = 0,
      attachmentFiles = [],
      officeImages = [],
      companyProfile,
      proactiveAlerts = false,
      alertRadius = 50,
      alertFrequency = 'immediate',
      featuredKeywords = [],
      customBranding = {},
      superFeatured = false,
      tierLevel = 'basic',
      externalApplyUrl,
      hotVacancyPrice,
      hotVacancyCurrency = 'INR',
      hotVacancyPaymentStatus = 'pending',
      // CRITICAL PREMIUM HOT VACANCY FEATURES (from hot_vacancies table)
      urgencyLevel, // high, critical, immediate
      hiringTimeline, // immediate, 1-week, 2-weeks, 1-month
      maxApplications, // Application limit (50 for premium)
      applicationDeadline, // When applications close
      pricingTier, // basic, premium, enterprise, super-premium
      price, // Hot vacancy price (alias for hotVacancyPrice)
      currency, // Currency (alias for hotVacancyCurrency)
      paymentId, // Payment gateway transaction ID
      paymentDate, // When payment was completed
      priorityListing = false, // Show at top of listings
      featuredBadge = false, // Display featured badge
      unlimitedApplications = false, // No application limit
      advancedAnalytics = false, // Advanced metrics and insights
      candidateMatching = false, // AI-powered candidate matching
      directContact = false, // Allow direct contact
      seoTitle, // SEO optimized title
      seoDescription, // SEO optimized description
      keywords = [], // SEO keywords
      impressions = 0, // Hot vacancy specific impressions
      clicks = 0, // Hot vacancy specific clicks
      // AGENCY POSTING FIELDS
      isAgencyPosted = false, // Whether this job was posted by an agency
      hiringCompanyId, // The actual hiring company (for agency jobs)
      postedByAgencyId, // The agency that posted the job
      agencyDescription, // Short description about the agency
      authorizationId, // Link to the authorization record
      // CONSULTANCY POSTING FIELDS
      companyName, // Company name for display
      postingType = 'company', // 'company' or 'consultancy'
      consultancyName, // Name of the consultancy
      hiringCompanyName, // Company the consultancy is hiring for
      hiringCompanyIndustry, // Industry of hiring company
      hiringCompanyDescription, // Description of hiring company
      showHiringCompanyDetails = false // Whether to show hiring company details to candidates
    } = req.body || {};

    // Basic validation - only require fields for active jobs, not drafts
    const errors = [];
    
    // Validate education field type (must not be array or object) - FIX THIS FIRST
    if (education !== undefined && education !== null) {
      if (Array.isArray(education)) {
        // Convert array to string
        req.body.education = education.join(', ');
      } else if (typeof education === 'object') {
        errors.push('education cannot be an array or an object');
      }
    }
    
    if (status === 'active') {
      // For active jobs, require all essential fields
      if (!title || String(title).trim() === '') errors.push('Job title is required');
      if (!description || String(description).trim() === '') errors.push('Job description is required');
      if (!location || String(location).trim() === '') errors.push('Job location is required');
      if (!requirements || (Array.isArray(requirements) ? requirements.length === 0 : String(requirements).trim() === '')) errors.push('Job requirements are required');
      // Department is optional for Gulf region jobs
      if (region !== 'gulf' && (!department || String(department).trim() === '')) {
        errors.push('Department is required');
      }
      if (!type && !jobType) errors.push('Job type is required');
      if (!experience && !experienceLevel) errors.push('Experience level is required');
      if (!salary && !salaryMin && !salaryMax) errors.push('Salary information is required');
      
      // Hot vacancy specific validation
      if (isHotVacancy === true) {
        console.log('🔥 Validating hot vacancy requirements...');
        if (!hotVacancyPrice || hotVacancyPrice <= 0) {
          errors.push('Hot vacancy price is required and must be greater than 0');
        }
        if (!tierLevel) {
          console.log('⚠️ No tier level provided, using default: premium');
          req.body.tierLevel = 'premium';
        }
        // Ensure boosted search is enabled by default for hot vacancies
        if (boostedSearch === undefined) {
          console.log('✅ Enabling boosted search by default for hot vacancy');
          req.body.boostedSearch = true;
        }
      }
    } else {
      // For drafts, only require title (can be "Untitled Job")
      if (!title || String(title).trim() === '') {
        title = 'Untitled Job'; // Set default title for drafts
      }
    }
    
    if (errors.length) {
      console.error('❌ Validation errors:', errors);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors 
      });
    }

    // ========== CRITICAL: AGENCY JOB POSTING VALIDATION ==========
    // Validate agency job posting permissions and limits
    if (isAgencyPosted === true && hiringCompanyId) {
      console.log('🔒 Validating agency job posting authorization...');
      
      const { AgencyClientAuthorization } = require('../models');
      
      // Get the authorization record
      const authorization = await AgencyClientAuthorization.findOne({
        where: {
          agencyCompanyId: companyId || req.user.company_id,
          clientCompanyId: hiringCompanyId,
        },
        include: [
          {
            model: Company,
            as: 'ClientCompany',
            attributes: ['id', 'name', 'companyStatus']
          }
        ]
      });
      
      if (!authorization) {
        console.error('❌ No authorization found for client company');
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to post jobs for this company. Please add the client first.'
        });
      }
      
      // Check 1: Authorization must be active
      if (authorization.status !== 'active') {
        console.error(`❌ Authorization status is '${authorization.status}', not 'active'`);
        return res.status(403).json({
          success: false,
          message: `Client authorization is ${authorization.status}. Only active authorizations can post jobs.`
        });
      }
      
      // Check 2: Must have posting permission
      if (!authorization.canPostJobs) {
        console.error('❌ canPostJobs is false');
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to post jobs for this client.'
        });
      }
      
      // Check 3: Contract must be valid (not expired)
      if (authorization.contractEndDate) {
        const contractEndDate = new Date(authorization.contractEndDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Compare dates only
        contractEndDate.setHours(0, 0, 0, 0);
        
        if (contractEndDate < today) {
          console.error(`❌ Contract expired on ${authorization.contractEndDate}`);
          return res.status(403).json({
            success: false,
            message: `Client contract expired on ${new Date(authorization.contractEndDate).toLocaleDateString()}. Please renew the contract before posting jobs.`
          });
        }
      }
      
      // Check 4: Job limit (if set)
      if (authorization.maxActiveJobs && authorization.maxActiveJobs > 0) {
        const activeJobsCount = await Job.count({
          where: {
            hiringCompanyId: hiringCompanyId,
            postedByAgencyId: companyId || req.user.company_id,
            status: 'active'
          }
        });
        
        console.log(`📊 Active jobs for this client: ${activeJobsCount}/${authorization.maxActiveJobs}`);
        
        if (activeJobsCount >= authorization.maxActiveJobs) {
          console.error(`❌ Job limit reached: ${activeJobsCount}/${authorization.maxActiveJobs}`);
          return res.status(403).json({
            success: false,
            message: `Job limit reached for this client. Maximum ${authorization.maxActiveJobs} active jobs allowed. Please close existing jobs or request limit increase.`
          });
        }
      }
      
      // Check 5: Category restrictions (if set)
      if (authorization.jobCategories && authorization.jobCategories.length > 0) {
        const jobCategoryToCheck = category || roleCategory || department;
        
        if (jobCategoryToCheck) {
          const isAllowed = authorization.jobCategories.some(allowedCat => 
            allowedCat.toLowerCase() === jobCategoryToCheck.toLowerCase() ||
            jobCategoryToCheck.toLowerCase().includes(allowedCat.toLowerCase())
          );
          
          if (!isAllowed) {
            console.error(`❌ Category '${jobCategoryToCheck}' not in allowed list: ${authorization.jobCategories.join(', ')}`);
            return res.status(403).json({
              success: false,
              message: `Category '${jobCategoryToCheck}' is not allowed for this client. Allowed categories: ${authorization.jobCategories.join(', ')}`
            });
          }
        }
      }
      
      // Check 6: Location restrictions (if set)
      if (authorization.allowedLocations && authorization.allowedLocations.length > 0) {
        const jobLocation = location || city;
        
        if (jobLocation) {
          const isAllowed = authorization.allowedLocations.some(allowedLoc =>
            allowedLoc.toLowerCase() === 'all india' ||
            allowedLoc.toLowerCase() === 'all' ||
            jobLocation.toLowerCase().includes(allowedLoc.toLowerCase()) ||
            allowedLoc.toLowerCase().includes(jobLocation.toLowerCase())
          );
          
          if (!isAllowed) {
            console.error(`❌ Location '${jobLocation}' not in allowed list: ${authorization.allowedLocations.join(', ')}`);
            return res.status(403).json({
              success: false,
              message: `Location '${jobLocation}' is not allowed for this client. Allowed locations: ${authorization.allowedLocations.join(', ')}`
            });
          }
        }
      }
      
      console.log('✅ All agency authorization checks passed');
      
      // Store authorizationId for tracking
      authorizationId = authorization.id;
    }
    // ========== END AGENCY VALIDATION ==========

    // Get the authenticated user's company
    let userCompany = null;
    try {
      // First try to get company directly from user's company_id
      const user = await User.findByPk(req.user.id);
      
      if (user && user.company_id) {
        userCompany = await Company.findByPk(user.company_id);
        if (userCompany) {
          console.log('✅ Found user company:', userCompany.id, userCompany.name);
        }
      } else {
        console.log('⚠️ User has no associated company');
      }
    } catch (companyError) {
      console.error('❌ Error fetching user company:', companyError);
    }

    // CRITICAL: For consultancy postings, consultancy name MUST be the employer's company name
    // Override any provided consultancyName to ensure it matches the posting company
    if (postingType === 'consultancy') {
      if (userCompany && userCompany.name) {
        consultancyName = userCompany.name;
        console.log('✅ Auto-setting consultancy name to employer company:', consultancyName);
      } else {
        console.error('❌ Cannot set consultancy posting: User company not found');
        return res.status(400).json({
          success: false,
          message: 'Consultancy posting requires company association. Please ensure your account is linked to a company.',
          error: 'MISSING_COMPANY_ASSOCIATION'
        });
      }
    }

    // Use provided companyId or user's company ID
    const finalCompanyId = companyId || (userCompany ? userCompany.id : null);
    
    if (!finalCompanyId) {
      console.error('❌ No company ID available for job creation');
      return res.status(400).json({
        success: false,
        message: 'Company association required. Please ensure your account is linked to a company.',
        error: 'MISSING_COMPANY_ASSOCIATION'
      });
    }

    // Parse salary if provided as string
    let parsedSalaryMin = salaryMin;
    let parsedSalaryMax = salaryMax;

    if (salary && typeof salary === 'string') {
      // Handle salary ranges like "₹8-15 LPA" or "800000-1500000"
      const salaryMatch = salary.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
      if (salaryMatch) {
        parsedSalaryMin = parseFloat(salaryMatch[1]) * 100000; // Convert LPA to actual amount
        parsedSalaryMax = parseFloat(salaryMatch[2]) * 100000;
      } else {
        // Single salary value
        const singleSalary = parseFloat(salary.replace(/[^\d.]/g, ''));
        if (!isNaN(singleSalary)) {
          parsedSalaryMin = singleSalary * 100000;
        }
      }
    }

    // Sanitize numeric fields to avoid DECIMAL(10,2) overflow in DB
    const MAX_DECIMAL_10_2_ABS = 99999999.99; // absolute max allowed
    const coerceNumberOrNull = (value) => {
      if (value === undefined || value === null || value === '') return null;
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    };
    let safeSalaryMin = coerceNumberOrNull(parsedSalaryMin);
    let safeSalaryMax = coerceNumberOrNull(parsedSalaryMax);
    if (safeSalaryMin !== null) {
      safeSalaryMin = Math.max(0, Math.min(safeSalaryMin, MAX_DECIMAL_10_2_ABS));
    }
    if (safeSalaryMax !== null) {
      safeSalaryMax = Math.max(0, Math.min(safeSalaryMax, MAX_DECIMAL_10_2_ABS));
    }

    // Map experience level
    let mappedExperienceLevel = experienceLevel;
    if (experience && !experienceLevel) {
      const experienceMap = {
        'fresher': 'entry',
        'junior': 'junior', 
        'mid': 'mid',
        'senior': 'senior'
      };
      mappedExperienceLevel = experienceMap[experience] || 'entry';
    }

    // Use authenticated user's ID as employerId (matching the association)
    const createdBy = req.user.id;
    
    // Set region based on request body or user's region to ensure Gulf employers create Gulf jobs
    const jobRegion = region || req.user.region || 'india'; // Use request body region first, then user region, default to 'india'
    
    // VALIDATION: Prevent India companies from posting Gulf jobs
    // Only Gulf region users can post Gulf jobs
    if (jobRegion === 'gulf' && req.user.region !== 'gulf') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only Gulf region companies can post Gulf jobs. Your account is configured for India region.',
        error: 'REGION_MISMATCH'
      });
    }
    
    // Ensure associated company is marked as Gulf region for Gulf job postings
    if (jobRegion === 'gulf' && userCompany && userCompany.region !== 'gulf') {
      try {
        await userCompany.update({ region: 'gulf' });
        console.log('🌍 Company region updated to gulf for job posting:', userCompany.id);
      } catch (regionUpdateError) {
        console.warn('⚠️ Failed to update company region to gulf:', regionUpdateError?.message || regionUpdateError);
      }
    }
    
    // Generate slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-') + '-' + Date.now();
    
    // Determine publishedAt
    let resolvedPublishedAt = publishedAt;
    if (status === 'active' && !resolvedPublishedAt) {
      resolvedPublishedAt = new Date();
    }

    // CRITICAL: Calculate validTill based on applicationDeadline + super-admin configured days
    // If applicationDeadline is set: validTill = applicationDeadline + configured days
    // If no applicationDeadline: validTill = publishedAt + default days (or now + default days)
    let resolvedValidTill = validTill;
    if (status === 'active' && !resolvedValidTill) {
      const { calculateJobExpiry } = require('../utils/jobExpiryHelper');
      resolvedValidTill = await calculateJobExpiry(applicationDeadline, resolvedPublishedAt);
      console.log('📅 Calculated validTill:', {
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline).toISOString() : null,
        publishedAt: resolvedPublishedAt ? new Date(resolvedPublishedAt).toISOString() : null,
        calculatedValidTill: resolvedValidTill.toISOString()
      });
    }

    // Create record
    const jobData = {
      slug,
      title: String(title).trim(),
      description: String(description).trim(),
      location: String(location).trim(),
      companyId: finalCompanyId,
      employerId: createdBy, // Use employerId to match the association
      jobType: type || jobType, // Handle both field names
      experienceLevel: mappedExperienceLevel,
      experienceMin: experienceMin || null,
      experienceMax: experienceMax || null,
      salary: salary && salary.trim() ? salary.trim() : null,
      salaryMin: safeSalaryMin,
      salaryMax: safeSalaryMax,
      salaryCurrency,
      salaryPeriod,
      isSalaryVisible,
      department: department && department.trim() ? department : (region === 'gulf' ? 'General' : null),
      category,
      skills: Array.isArray(skills) ? skills : [],
      benefits: benefits ? (Array.isArray(benefits) ? benefits : (typeof benefits === 'string' ? benefits.split('\n').filter(b => b.trim()) : [])) : null,
      remoteWork: remoteWork && remoteWork.trim() ? remoteWork : 'on-site',
      travelRequired: Boolean(travelRequired),
      shiftTiming: shiftTiming && shiftTiming.trim() ? shiftTiming : 'day',
      noticePeriod,
      education: req.body.education && req.body.education.trim ? req.body.education.trim() : null, // Use converted value from validation
      certifications: Array.isArray(certifications) ? certifications : [],
      languages: Array.isArray(languages) ? languages : [],
      status,
      isUrgent: Boolean(isUrgent),
      isFeatured: Boolean(isFeatured),
      // New fields from step 2
      role: role && role.trim() ? role.trim() : null,
      // For consultancy jobs, use hiringCompanyIndustry if industryType is not provided
      industryType: (industryType && industryType.trim() ? industryType.trim() : null) || (postingType === 'consultancy' && hiringCompanyIndustry && hiringCompanyIndustry.trim() ? hiringCompanyIndustry.trim() : null),
      roleCategory: roleCategory && roleCategory.trim() ? roleCategory.trim() : null,
      employmentType: employmentType && employmentType.trim() ? employmentType.trim() : null,
      isPremium: Boolean(isPremium),
      // Hot Vacancy Premium Features
      isHotVacancy: Boolean(isHotVacancy),
      urgentHiring: Boolean(urgentHiring),
      multipleEmailIds: Array.isArray(multipleEmailIds) ? multipleEmailIds : [],
      boostedSearch: Boolean(boostedSearch),
      searchBoostLevel: searchBoostLevel || 'standard',
      citySpecificBoost: Array.isArray(citySpecificBoost) ? citySpecificBoost : [],
      videoBanner: videoBanner && videoBanner.trim() ? videoBanner.trim() : null,
      whyWorkWithUs: whyWorkWithUs && whyWorkWithUs.trim() ? whyWorkWithUs.trim() : null,
      companyReviews: Array.isArray(companyReviews) ? companyReviews : [],
      autoRefresh: Boolean(autoRefresh),
      refreshDiscount: refreshDiscount || 0,
      attachmentFiles: Array.isArray(attachmentFiles) ? attachmentFiles : [],
      officeImages: Array.isArray(officeImages) ? officeImages : [],
      companyProfile: companyProfile && companyProfile.trim() ? companyProfile.trim() : null,
      proactiveAlerts: Boolean(proactiveAlerts),
      alertRadius: alertRadius || 50,
      alertFrequency: alertFrequency || 'immediate',
      featuredKeywords: Array.isArray(featuredKeywords) ? featuredKeywords : [],
      customBranding: (customBranding && typeof customBranding === 'object' && !Array.isArray(customBranding)) ? customBranding : {},
      superFeatured: Boolean(superFeatured),
      tierLevel: tierLevel || 'basic',
      externalApplyUrl: externalApplyUrl && externalApplyUrl.trim() ? externalApplyUrl.trim() : null,
      hotVacancyPrice: hotVacancyPrice || price || null, // Support both field names
      hotVacancyCurrency: hotVacancyCurrency || currency || 'INR',
      hotVacancyPaymentStatus: hotVacancyPaymentStatus || 'pending',
      // CRITICAL PREMIUM HOT VACANCY FEATURES (from hot_vacancies table)
      urgencyLevel: urgencyLevel || null,
      hiringTimeline: hiringTimeline || null,
      maxApplications: maxApplications || null,
      applicationDeadline: applicationDeadline || null,
      pricingTier: pricingTier || null,
      paymentId: paymentId || null,
      paymentDate: paymentDate || null,
      priorityListing: Boolean(priorityListing),
      featuredBadge: Boolean(featuredBadge),
      unlimitedApplications: Boolean(unlimitedApplications),
      advancedAnalytics: Boolean(advancedAnalytics),
      candidateMatching: Boolean(candidateMatching),
      directContact: Boolean(directContact),
      seoTitle: seoTitle && seoTitle.trim() ? seoTitle.trim() : null,
      seoDescription: seoDescription && seoDescription.trim() ? seoDescription.trim() : null,
      keywords: Array.isArray(keywords) ? keywords : [],
      impressions: impressions || 0,
      clicks: clicks || 0,
      validTill: resolvedValidTill,
      publishedAt: resolvedPublishedAt,
      tags: Array.isArray(tags) ? tags : [],
      metadata: {
        ...metadata,
        // CONSULTANCY POSTING FIELDS - Store in metadata
        postingType: postingType || 'company',
        companyName: companyName && companyName.trim() ? companyName.trim() : null,
        ...(postingType === 'consultancy' && {
          // CRITICAL: consultancyName is always the employer's company name (auto-set above)
          consultancyName: consultancyName && consultancyName.trim() ? consultancyName.trim() : (userCompany ? userCompany.name : null),
          hiringCompany: {
            name: hiringCompanyName && hiringCompanyName.trim() ? hiringCompanyName.trim() : null,
            industry: hiringCompanyIndustry && hiringCompanyIndustry.trim() ? hiringCompanyIndustry.trim() : null,
            description: hiringCompanyDescription && hiringCompanyDescription.trim() ? hiringCompanyDescription.trim() : null
          },
          showHiringCompanyDetails: Boolean(showHiringCompanyDetails)
        })
      },
      city,
      state,
      country,
      latitude,
      longitude,
      requirements: requirements && (Array.isArray(requirements) ? requirements.length > 0 : requirements.trim()) ? 
        (Array.isArray(requirements) ? requirements.join('\n') : requirements) : null,
      responsibilities: responsibilities && (Array.isArray(responsibilities) ? responsibilities.length > 0 : responsibilities.trim()) ? 
        (Array.isArray(responsibilities) ? responsibilities.join('\n') : responsibilities) : null,
      region: jobRegion, // Set region based on user's region
      // AGENCY POSTING FIELDS
      isAgencyPosted: Boolean(isAgencyPosted),
      hiringCompanyId: hiringCompanyId || null,
      postedByAgencyId: postedByAgencyId || null,
      agencyDescription: agencyDescription && agencyDescription.trim() ? agencyDescription.trim() : null,
      authorizationId: authorizationId || null
    };

    console.log('📝 Creating job with data:', {
      title: jobData.title,
      company_id: jobData.companyId,
      employerId: jobData.employerId,
      jobType: jobData.jobType,
      department: jobData.department,
      customBranding: jobData.customBranding ? JSON.stringify(jobData.customBranding).substring(0, 100) : 'None',
      location: jobData.location,
      status: jobData.status
    });
    
    // Debug JSONB fields
    console.log('🔍 JSONB fields debug:', {
      skills: jobData.skills,
      certifications: jobData.certifications,
      languages: jobData.languages,
      tags: jobData.tags,
      metadata: jobData.metadata,
      multipleEmailIds: jobData.multipleEmailIds,
      citySpecificBoost: jobData.citySpecificBoost,
      companyReviews: jobData.companyReviews,
      attachmentFiles: jobData.attachmentFiles,
      officeImages: jobData.officeImages,
      featuredKeywords: jobData.featuredKeywords,
      customBranding: jobData.customBranding,
      keywords: jobData.keywords
    });
    
    console.log('✅ Final jobData before create - department:', jobData.department);
    console.log('✅ Final jobData before create - customBranding:', jobData.customBranding?.brandingMedia ? `${jobData.customBranding.brandingMedia.length} items` : 'empty');

    let job;
    try {
      job = await Job.create(jobData);
      console.log('✅ Job created successfully with department:', job.department);
      console.log('✅ Job created with customBranding:', job.customBranding?.brandingMedia ? `${job.customBranding.brandingMedia.length} items` : 'empty');
    } catch (createError) {
      console.error('❌ Job creation error:', createError);
      console.error('Error details:', {
        name: createError.name,
        message: createError.message,
        stack: createError.stack,
        code: createError.code
      });
      
      // Check if it's a JSON validation error
      if (createError.message && createError.message.includes('invalid input syntax for type json')) {
        console.error('🔍 JSON validation error detected. Checking JSONB fields...');
        // Log each JSONB field to identify the problematic one
        const jsonbFields = ['skills', 'certifications', 'languages', 'tags', 'metadata', 'multipleEmailIds', 'citySpecificBoost', 'companyReviews', 'attachmentFiles', 'officeImages', 'featuredKeywords', 'customBranding', 'keywords'];
        jsonbFields.forEach(field => {
          const value = jobData[field];
          console.error(`Field ${field}:`, {
            value,
            type: typeof value,
            isArray: Array.isArray(value),
            isObject: typeof value === 'object' && value !== null,
            stringified: JSON.stringify(value)
          });
        });
      }
      
      throw createError;
    }

    // Consume job posting quota
    try {
      console.log('🔍 Consuming job posting quota for employer:', createdBy, 'job:', job.id);
      const quotaResult = await EmployerQuotaService.checkAndConsume(createdBy, EmployerQuotaService.QUOTA_TYPES.JOB_POSTINGS, {
        activityType: 'job_post',
        details: { title: job.title, status: job.status },
        jobId: job.id,
        defaultLimit: 50
      });
      console.log('✅ Job posting quota consumed successfully:', quotaResult);
    } catch (e) {
      console.error('⚠️ Failed to consume job posting quota:', e?.message || e);
      // Don't fail the job creation if quota check fails
    }

    // Log employer activity: job posted
    try {
      await EmployerActivityService.logJobPost(createdBy, job.id, { title: job.title, status: job.status });
    } catch (e) {
      console.error('⚠️ Failed to log job_post activity:', e?.message || e);
    }

    console.log('✅ Job created successfully:', job.id);

    // Update agency authorization stats (increment jobsPosted counter)
    if (job.isAgencyPosted && job.authorizationId) {
      try {
        const { AgencyClientAuthorization } = require('../models');
        const auth = await AgencyClientAuthorization.findByPk(job.authorizationId);
        if (auth) {
          auth.jobsPosted = (auth.jobsPosted || 0) + 1;
          await auth.save();
          console.log(`✅ Updated authorization stats: jobsPosted = ${auth.jobsPosted}`);
        }
      } catch (authUpdateError) {
        console.error('⚠️ Failed to update authorization stats:', authUpdateError);
        // Don't fail the job creation if stats update fails
      }
    }

    // Send proactive alerts for hot vacancies
    if (job.isHotVacancy && job.proactiveAlerts && job.status === 'active') {
      try {
        const HotVacancyAlertService = require('../services/hotVacancyAlertService');
        const company = await Company.findByPk(finalCompanyId, {
          attributes: ['name']
        });
        
        const hotVacancyData = {
          ...job.toJSON(),
          companyName: company?.name || 'Company'
        };
        
        await HotVacancyAlertService.sendProactiveAlerts(job.id, hotVacancyData);
        console.log('🔥 Proactive alerts sent for hot vacancy job:', job.id);
      } catch (alertError) {
        console.error('❌ Error sending proactive alerts for hot vacancy:', alertError);
        // Don't fail the main request if alerts fail
      }
    }

    // Send notifications to users with matching preferences (only for active jobs)
    if (job.status === 'active') {
      try {
        console.log('🔔 Checking for users with matching job preferences...');
        
        // Prepare job data for matching
        const jobData = {
          title: job.title,
          companyName: userCompany?.name || 'Unknown Company',
          location: job.location,
          jobType: job.jobType,
          experienceLevel: job.experienceLevel,
          remoteWork: job.remoteWork,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salary: job.salary,
          skills: job.skills || [],
          industry: userCompany?.industries && userCompany.industries.length > 0 ? userCompany.industries[0] : 'Other',
          region: job.region
        };

        // Find users with matching preferences
        const matchingUserIds = await JobPreferenceMatchingService.findMatchingUsers(jobData);
        
        if (matchingUserIds.length > 0) {
          console.log(`🎯 Found ${matchingUserIds.length} users with matching preferences`);
          
          // Send notifications to matching users
          const notificationResult = await NotificationService.sendPreferredJobNotification(
            job.id,
            jobData,
            matchingUserIds
          );
          
          if (notificationResult.success) {
            console.log(`✅ Sent ${notificationResult.notificationsSent} preferred job notifications`);
          } else {
            console.error('❌ Failed to send preferred job notifications:', notificationResult.message);
          }
        } else {
          console.log('📝 No users found with matching job preferences');
        }
      } catch (notificationError) {
        console.error('❌ Error sending preferred job notifications:', notificationError);
        // Don't fail the job creation if notifications fail
      }

      // Send notification to employer about job creation
      try {
        const Notification = require('../models/Notification');
        
        await Notification.create({
          userId: req.user.id,
          type: 'company_update',
          title: `✅ Job Posted Successfully!`,
          message: `Your job "${job.title}" has been posted and is now live. Start receiving applications!`,
          shortMessage: `Job posted: ${job.title}`,
          priority: 'low',
          actionUrl: `/employer-dashboard/jobs/${job.id}`,
          actionText: 'View Job',
          icon: 'briefcase',
          metadata: {
            jobId: job.id,
            jobTitle: job.title,
            companyId: userCompany.id,
            companyName: userCompany.name,
            location: job.location,
            action: 'job_created'
          }
        });
        console.log(`✅ Job creation notification sent to employer ${req.user.id}`);
      } catch (notificationError) {
        console.error('❌ Failed to send job creation notification:', notificationError);
        // Don't fail the job creation if notification fails
      }

      // Send notifications to company followers
      try {
        console.log('🔔 Checking for company followers...');
        const CompanyFollow = require('../models/CompanyFollow');
        const Notification = require('../models/Notification');
        
        const followers = await CompanyFollow.findAll({
          where: { companyId: userCompany.id },
          attributes: ['userId', 'notificationPreferences']
        });

        if (followers && followers.length > 0) {
          console.log(`📢 Found ${followers.length} followers for company ${userCompany.name}`);
          
          let notificationsSent = 0;
          for (const follower of followers) {
            // Check if user wants job notifications
            const prefs = follower.notificationPreferences || {};
            if (prefs.newJobs !== false) {
              try {
                await Notification.create({
                  userId: follower.userId,
                  type: 'company_update',
                  title: `${userCompany.name} posted a new job!`,
                  message: `New position: "${job.title}" at ${userCompany.name} in ${job.location}. Apply now!`,
                  shortMessage: `New job: ${job.title}`,
                  priority: 'medium',
                  actionUrl: `/jobs/${job.id}`,
                  actionText: 'View Job',
                  icon: 'briefcase',
                  metadata: {
                    jobId: job.id,
                    companyId: userCompany.id,
                    companyName: userCompany.name,
                    jobTitle: job.title,
                    location: job.location,
                    fromFollowedCompany: true
                  }
                });
                notificationsSent++;
              } catch (notifError) {
                console.error(`⚠️ Failed to send notification to follower ${follower.userId}:`, notifError.message);
              }
            }
          }
          
          console.log(`✅ Sent ${notificationsSent} notifications to company followers`);
        } else {
          console.log('📝 No followers found for this company');
        }
      } catch (followError) {
        console.error('❌ Error sending notifications to followers:', followError);
        // Don't fail the job creation if notifications fail
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job
    });
  } catch (error) {
    console.error('❌ Job creation error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });

    // Handle specific database errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'A job with this title already exists',
        error: 'DUPLICATE_JOB_TITLE'
      });
    }

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid company or user reference',
        error: 'INVALID_FOREIGN_KEY'
      });
    }

    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeConnectionTimedOutError') {
      return res.status(503).json({
        success: false,
        message: 'Database connection error. Please try again later.',
        error: 'DATABASE_CONNECTION_ERROR'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create job. Please try again later.',
      error: error.message,
      details: error.name
    });
  }
};

/**
 * Get all jobs (with optional filtering)
 */
exports.getAllJobs = async (req, res, next) => {
  try {
    const AGENCY_ENABLED = String(process.env.AGENCY_FEATURES || '').toLowerCase() === 'true';
    let {
      page = 1,
      limit = 10,
      status,
      companyId,
      location,
      jobType,
      experienceLevel,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      region,
      experienceRange,
      salaryMin,
      industry,
      industries, // Support plural from navbar
      department,
      departments, // Support plural from navbar
      role,
      roleCategories, // Support from navbar
      skills,
      companyType,
      workMode,
      education,
      companyName,
      recruiterType
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};
    const And = Op.and;
    const Or = Op.or;
    const OpLike = Op.iLike;
    const OpIn = Op.in;
    const OpGte = Op.gte;
    const OpLte = Op.lte;
    const OpNe = Op.ne;
    const andGroups = [];

    // Add region filtering to ensure proper job visibility
    if (region) {
      whereClause.region = region;
    } else {
      // Default behavior: exclude Gulf jobs from regular job listings
      // This ensures Gulf jobs are only visible through Gulf-specific endpoints
      whereClause.region = { [OpNe]: 'gulf' };
    }

    // Add filters
    if (status) {
      if (status === 'active') {
        whereClause.status = 'active';
      } else if (status === 'inactive') {
        whereClause.status = { [OpIn]: ['draft', 'paused', 'closed', 'expired'] };
      }
    } else {
      // CRITICAL: Default public listing: only active jobs that are NOT expired
      // Expired jobs (validTill < now) should NOT appear in public listings
      whereClause.status = 'active';
      const now = new Date();
      // Only show jobs where validTill is null (never expires) OR validTill >= now (not expired)
      andGroups.push({ [Or]: [{ validTill: null }, { validTill: { [OpGte]: now } }] });
      // CRITICAL: Also filter out jobs with passed application deadlines
      // Jobs must have either no applicationDeadline OR applicationDeadline >= now
      andGroups.push({ [Or]: [{ applicationDeadline: null }, { applicationDeadline: { [OpGte]: now } }] });
    }
    if (companyId) whereClause.company_id = companyId;
    if (location) {
      andGroups.push({
        [Or]: [
          { location: { [OpLike]: `%${location}%` } },
          { city: { [OpLike]: `%${location}%` } },
          { state: { [OpLike]: `%${location}%` } },
          { country: { [OpLike]: `%${location}%` } },
        ]
      });
    }
    if (jobType) {
      const types = String(jobType)
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
      if (types.length === 1) {
        whereClause.jobType = types[0];
      } else if (types.length > 1) {
        whereClause.jobType = { [OpIn]: types };
      }
    }
    if (experienceLevel) whereClause.experienceLevel = experienceLevel;

    // Experience range (e.g., "0-1,2-5,6-10") maps to experienceMin/Max
    if (experienceRange) {
      const ranges = String(experienceRange)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(r => {
          const [minStr, maxStr] = r.replace('+', '-100').split('-');
          const min = parseInt(minStr, 10);
          const max = parseInt(maxStr, 10);
          if (!isNaN(min) && !isNaN(max)) {
            return {
              [And]: [
                { experienceMin: { [OpGte]: min } },
                { experienceMax: { [OpLte]: max } }
              ]
            };
          }
          if (!isNaN(min) && isNaN(max)) {
            return { experienceMin: { [OpGte]: min } };
          }
          return null;
        })
        .filter(Boolean);
      if (ranges.length > 0) andGroups.push({ [Or]: ranges });
    }

    // Salary min/max
    if (salaryMin) whereClause.salaryMin = { [OpGte]: parseFloat(salaryMin) };
    if (req.query.salaryMax) whereClause.salaryMax = { [OpLte]: parseFloat(req.query.salaryMax) };

    // Department / Functional Area
    const deptFilter = department || departments;
    if (deptFilter) {
      const depts = String(deptFilter).split(',').map(s => s.trim()).filter(Boolean);
      if (depts.length > 0) {
        andGroups.push({
          [Or]: depts.map(d => ({ department: { [OpLike]: `%${d}%` } }))
        });
      }
    }

    // Role / Designation / Role Categories
    const roleFilter = role || roleCategories;
    if (roleFilter) {
      const roles = String(roleFilter).split(',').map(s => s.trim()).filter(Boolean);
      if (roles.length > 0) {
        andGroups.push({
          [Or]: [
            ...roles.map(r => ({ title: { [OpLike]: `%${r}%` } })),
            ...roles.map(r => ({ rolecategory: { [OpLike]: `%${r}%` } }))
          ]
        });
      }
    }

    // Skills / Keywords
    if (skills) {
      const sequelize = Job.sequelize;
      const skillTerms = String(skills)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      if (skillTerms.length > 0) {
        const jsonbLowerContains = skillTerms.map(term =>
          sequelize.where(
            sequelize.fn('LOWER', sequelize.cast(sequelize.col('skills'), 'text')),
            { [Op.like]: `%${term.toLowerCase()}%` }
          )
        );

        andGroups.push({
          [Or]: [
            { skills: { [Op.contains]: skillTerms } },
            ...jsonbLowerContains,
            { requirements: { [OpLike]: `%${skills}%` } },
            { description: { [OpLike]: `%${skills}%` } },
            { title: { [OpLike]: `%${skills}%` } }
          ]
        });
      }
    }

    // Work mode (remoteWork enum on jobs: on-site, remote, hybrid) with fallback to workMode text
    if (workMode) {
      const normalized = String(workMode).toLowerCase().includes('home') ? 'remote' : String(workMode).toLowerCase();
      const Or = Op.or;
      const OpLike = Op.iLike;
      andGroups.push({
        [Or]: [
          { remoteWork: normalized },
          { workMode: { [OpLike]: `%${normalized}%` } },
          ...(normalized === 'remote' ? [{ workMode: { [OpLike]: `%work from home%` } }] : [])
        ]
      });
    }

    // Education / Qualification
    if (education) whereClause.education = { [OpLike]: `%${education}%` };
    if (search) {
      andGroups.push({
        [Or]: [
          { title: { [OpLike]: `%${search}%` } },
          { description: { [OpLike]: `%${search}%` } },
          { requirements: { [OpLike]: `%${search}%` } },
          { location: { [OpLike]: `%${search}%` } }
        ]
      });
    }

    // Build include and company-based filters
    const include = [
      {
        model: Company,
        as: 'company',
        attributes: ['id', 'name', 'logo', 'industries', 'companySize', 'city', 'website', 'contactEmail', 'contactPhone', 'companyType'],
        required: Boolean(industry || companyType || companyName) || false,
        where: (() => {
          const where = {};
          const OpLike = Op.iLike;
          const Or = Op.or;
          const industryFilter = industry || industries;
          if (industryFilter) {
            const indArray = String(industryFilter).split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
            const industryTerms = [];
            indArray.forEach(ind => {
              if (ind.includes('information technology') || ind === 'it') {
                industryTerms.push('information technology', 'technology', 'tech', 'software', 'it', 'internet');
              } else {
                industryTerms.push(ind);
              }
            });
            // industries is a JSONB array column, while industrytype is a string column on Job
            where[Or] = industryTerms.map(t => ({ industries: { [Op.contains]: [t] } }));
          }
          if (companyType) where.companyType = String(companyType).toLowerCase();
          if (companyName) where.name = { [OpLike]: `%${String(companyName).toLowerCase()}%` };
          return where;
        })()
      },
      {
        model: User,
        as: 'employer',
        attributes: ['id', 'first_name', 'last_name', 'email', 'company_id'],
        required: Boolean(recruiterType) || false
      },
      {
        model: JobPhoto,
        as: 'photos',
        attributes: ['id', 'filename', 'fileUrl', 'altText', 'caption', 'displayOrder', 'isPrimary', 'isActive'],
        where: { isActive: true },
        required: false
      }
    ];

    // Include agency-related associations only if explicitly enabled (to avoid joining non-existent columns locally)
    if (AGENCY_ENABLED) {
      include.splice(1, 0,
        {
          model: Company,
          as: 'HiringCompany',
          attributes: ['id', 'name', 'logo', 'industries', 'city', 'companySize', 'website'],
          required: false
        },
        {
          model: Company,
          as: 'PostedByAgency',
          attributes: ['id', 'name', 'logo', 'companyAccountType', 'industry', 'city'],
          required: false
        }
      );
    }

    // Recruiter type: company (employer has companyId) or consultant (no companyId)
    if (recruiterType === 'company') {
      include[3] = { ...include[3], where: { companyId: { [OpNe]: null } }, required: true };
    } else if (recruiterType === 'consultant') {
      include[3] = { ...include[3], where: { companyId: null }, required: true };
    }

    const finalWhere = andGroups.length ? { [And]: [whereClause, ...andGroups] } : whereClause;
    
    // Enhanced sorting to prioritize hot vacancies
    const orderClauses = [];
    
    // ALWAYS prioritize hot vacancies with premium features first
    orderClauses.push(['isHotVacancy', 'DESC']); // Hot vacancies first
    orderClauses.push(['superFeatured', 'DESC']); // Super featured second
    orderClauses.push(['priorityListing', 'DESC']); // Priority listing third
    orderClauses.push(['urgentHiring', 'DESC']); // Urgent hiring fourth
    orderClauses.push(['boostedSearch', 'DESC']); // Boosted search fifth
    orderClauses.push(['featuredBadge', 'DESC']); // Featured badge sixth
    
    // Then apply user's requested sort - map camelCase to snake_case
    const sortByMapping = {
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'title': 'title',
      'status': 'status',
      'location': 'location'
    };
    const dbSortBy = sortByMapping[sortBy] || 'created_at';
    orderClauses.push([dbSortBy, sortOrder]);
    
    console.log('🔍 Using enhanced sorting for hot vacancy priority:', orderClauses);
    
    const { count, rows: jobs } = await Job.findAndCountAll({
      where: finalWhere,
      include,
      order: orderClauses,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      message: 'Jobs retrieved successfully',
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve jobs',
      error: error.message
    });
  }
};

/**
 * Get job by ID
 */
exports.getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const job = await Job.findByPk(id, {
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'logo', 'industries', 'companySize', 'city', 'website', 'contactEmail', 'contactPhone'],
          required: false // Make it optional since companyId can be NULL
        },
        // Removed HiringCompany and PostedByAgency includes as they use VIRTUAL fields
        // These can be added back if the database columns exist
        {
          model: User,
          as: 'employer',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          required: false
        },
        {
          model: JobPhoto,
          as: 'photos',
          attributes: ['id', 'filename', 'fileUrl', 'altText', 'caption', 'displayOrder', 'isPrimary', 'isActive'],
          where: { isActive: true },
          required: false
        }
      ],
      attributes: {
        exclude: ['hiringCompanyId', 'postedByAgencyId'] // Exclude VIRTUAL fields from SELECT
      }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Visibility rules: paused jobs are not visible to jobseekers (non-owners)
    const isOwner = req.user && job.employerId === req.user.id;
    if (job.status === 'paused' && !isOwner) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Track the view (async, don't wait for it)
    ViewTrackingService.trackView({
      viewerId: req.user?.id || null, // null for anonymous users
      viewedUserId: job.employerId, // Track profile view for the job poster
      jobId: job.id,
      viewType: 'job_view',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID,
      referrer: req.get('Referer'),
      metadata: {
        jobTitle: job.title,
        jobLocation: job.location,
        companyName: job.company?.name
      }
    }).catch(error => {
      console.error('Error tracking job view:', error);
    });

    return res.status(200).json({
      success: true,
      message: 'Job retrieved successfully',
      data: job
    });
  } catch (error) {
    console.error('Get job error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve job',
      error: error.message
    });
  }
};

/**
 * ULTRA-ADVANCED Similar Jobs Recommendation Algorithm v2.0
 * 
 * This is a production-grade algorithm that handles ALL edge cases and provides
 * intelligent job recommendations using multiple sophisticated techniques:
 * 
 * CORE FEATURES:
 * - Multi-dimensional weighted scoring (15+ factors)
 * - Semantic text analysis with fuzzy matching
 * - Geographic proximity with city/state/country intelligence
 * - Salary compatibility with range overlap analysis
 * - Skills matching with importance weighting
 * - Experience level compatibility matrix
 * - Company industry and size matching
 * - Job type and work mode preferences
 * - Featured/premium job boosting
 * - Recency and popularity factors
 * - Same-company job promotion
 * - Career progression path analysis
 * - Diversity and inclusion factors
 * 
 * EDGE CASES HANDLED:
 * - Missing or incomplete job data
 * - Invalid job IDs
 * - No similar jobs found
 * - Database connection issues
 * - Malformed data
 * - Empty arrays and null values
 * - Special characters in text
 * - Case sensitivity issues
 * - Date/time edge cases
 * - Salary format variations
 * - Location format variations
 * - Skills array variations
 * - Company data inconsistencies
 * - Performance optimization
 * - Memory management
 * - Error recovery
 * - Fallback mechanisms
 */
exports.getSimilarJobs = async (req, res, next) => {
  const startTime = Date.now();
  let debugInfo = {
    algorithm: 'ultra-advanced-similarity-v2',
    startTime: new Date().toISOString(),
    steps: []
  };

  try {
    // Input validation and sanitization
    const { id } = req.params;
    const { limit = 3, debug = false } = req.query;
    
    // Validate job ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      debugInfo.steps.push('Invalid job ID format');
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format',
        debug: debug ? debugInfo : undefined
      });
    }

    // Sanitize limit parameter
    const sanitizedLimit = Math.min(Math.max(parseInt(limit) || 3, 1), 10);
    debugInfo.steps.push(`Processing request for job ${id} with limit ${sanitizedLimit}`);

    // Fetch the current job with comprehensive data
    const currentJob = await Job.findByPk(id, {
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'industries', 'companySize', 'website', 'isFeatured', 'rating', 'totalReviews'],
          required: false
        },
        {
          model: User,
          as: 'employer',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          required: false
        }
      ]
    });

    if (!currentJob) {
      debugInfo.steps.push('Job not found in database');
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        debug: debug ? debugInfo : undefined
      });
    }

    debugInfo.steps.push(`Found job: ${currentJob.title} at ${currentJob.company?.name || 'Unknown Company'}`);

    // Advanced text similarity using multiple algorithms
    const calculateAdvancedTextSimilarity = (text1, text2) => {
      if (!text1 || !text2) return 0;
      
      // Normalize text
      const normalize = (text) => text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')  // Remove special characters
        .replace(/\s+/g, ' ')      // Normalize whitespace
        .trim();
      
      const norm1 = normalize(text1);
      const norm2 = normalize(text2);
      
      if (norm1 === norm2) return 1.0;
      
      // Jaccard similarity
      const words1 = new Set(norm1.split(' ').filter(w => w.length > 2));
      const words2 = new Set(norm2.split(' ').filter(w => w.length > 2));
      const intersection = new Set([...words1].filter(x => words2.has(x)));
      const union = new Set([...words1, ...words2]);
      const jaccard = union.size === 0 ? 0 : intersection.size / union.size;
      
      // Levenshtein distance for fuzzy matching
      const levenshtein = (str1, str2) => {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
          matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
          matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
          for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
              matrix[i][j] = matrix[i - 1][j - 1];
            } else {
              matrix[i][j] = Math.min(
                matrix[i - 1][j - 1] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j] + 1
              );
            }
          }
        }
        return matrix[str2.length][str1.length];
      };
      
      const maxLen = Math.max(norm1.length, norm2.length);
      const editDistance = levenshtein(norm1, norm2);
      const levenshteinScore = maxLen === 0 ? 1 : 1 - (editDistance / maxLen);
      
      // Weighted combination
      return (jaccard * 0.7) + (levenshteinScore * 0.3);
    };

    // Advanced array similarity with importance weighting
    const calculateAdvancedArraySimilarity = (arr1, arr2, weights = null) => {
      if (!arr1 || !arr2 || !Array.isArray(arr1) || !Array.isArray(arr2)) return 0;
      if (arr1.length === 0 && arr2.length === 0) return 1.0;
      if (arr1.length === 0 || arr2.length === 0) return 0;
      
      const normalizeItem = (item) => {
        if (typeof item === 'string') {
          return item.toLowerCase().trim().replace(/[^\w\s]/g, '');
        }
        return String(item).toLowerCase().trim();
      };
      
      const set1 = new Set(arr1.map(normalizeItem).filter(item => item.length > 0));
      const set2 = new Set(arr2.map(normalizeItem).filter(item => item.length > 0));
      
      if (set1.size === 0 && set2.size === 0) return 1.0;
      if (set1.size === 0 || set2.size === 0) return 0;
      
      const intersection = new Set([...set1].filter(x => set2.has(x)));
      const union = new Set([...set1, ...set2]);
      
      let baseScore = intersection.size / union.size;
      
      // Apply importance weighting if provided
      if (weights && typeof weights === 'object') {
        let weightedScore = 0;
        let totalWeight = 0;
        
        for (const item of intersection) {
          const weight = weights[item] || 1;
          weightedScore += weight;
          totalWeight += weight;
        }
        
        if (totalWeight > 0) {
          baseScore = weightedScore / totalWeight;
        }
      }
      
      return Math.min(1, baseScore);
    };

    // Advanced salary compatibility analysis
    const calculateAdvancedSalaryCompatibility = (job) => {
      const currentMin = parseFloat(currentJob.salaryMin) || 0;
      const currentMax = parseFloat(currentJob.salaryMax) || Infinity;
      const jobMin = parseFloat(job.salaryMin) || 0;
      const jobMax = parseFloat(job.salaryMax) || Infinity;
      
      // Handle edge cases
      if (currentMin === 0 && currentMax === Infinity && jobMin === 0 && jobMax === Infinity) {
        return 0.5; // Both have no salary info
      }
      
      if (currentMin === 0 && currentMax === Infinity) {
        return 0.3; // Current job has no salary, other does
      }
      
      if (jobMin === 0 && jobMax === Infinity) {
        return 0.3; // Other job has no salary, current does
      }
      
      // Calculate overlap
      const overlapMin = Math.max(currentMin, jobMin);
      const overlapMax = Math.min(currentMax, jobMax);
      
      if (overlapMax < overlapMin) return 0; // No overlap
      
      const overlapRange = overlapMax - overlapMin;
      const currentRange = currentMax - currentMin;
      const jobRange = jobMax - jobMin;
      
      // Multiple scoring factors
      const overlapScore = currentRange > 0 ? overlapRange / currentRange : 0.5;
      const rangeSimilarity = Math.min(currentRange, jobRange) / Math.max(currentRange, jobRange);
      const midpointProximity = 1 - Math.abs((currentMin + currentMax) / 2 - (jobMin + jobMax) / 2) / Math.max((currentMin + currentMax) / 2, (jobMin + jobMax) / 2);
      
      // Weighted combination
      return (overlapScore * 0.5) + (rangeSimilarity * 0.3) + (midpointProximity * 0.2);
    };

    // Advanced location proximity with geographic intelligence
    const calculateAdvancedLocationProximity = (job) => {
      if (!currentJob.location || !job.location) return 0;
      
      const normalizeLocation = (location) => {
        return location.toLowerCase()
          .replace(/[^\w\s,]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      };
      
      const currentLoc = normalizeLocation(currentJob.location);
      const jobLoc = normalizeLocation(job.location);
      
      if (currentLoc === jobLoc) return 1.0;
      
      // Parse location components
      const currentParts = currentLoc.split(',').map(p => p.trim()).filter(p => p.length > 0);
      const jobParts = jobLoc.split(',').map(p => p.trim()).filter(p => p.length > 0);
      
      if (currentParts.length === 0 || jobParts.length === 0) return 0;
      
      // City match (highest priority)
      if (currentParts[0] === jobParts[0]) return 0.95;
      
      // State match
      if (currentParts.length > 1 && jobParts.length > 1 && currentParts[1] === jobParts[1]) {
        return 0.75;
      }
      
      // Country match
      const currentCountry = currentParts[currentParts.length - 1];
      const jobCountry = jobParts[jobParts.length - 1];
      if (currentCountry === jobCountry) {
        return 0.4;
      }
      
      // Partial word matches
      const currentWords = new Set(currentParts.flatMap(p => p.split(' ')));
      const jobWords = new Set(jobParts.flatMap(p => p.split(' ')));
      const commonWords = new Set([...currentWords].filter(x => jobWords.has(x)));
      
      if (commonWords.size > 0) {
        return Math.min(0.3, commonWords.size * 0.1);
      }
      
      return 0;
    };

    // Advanced experience level compatibility matrix
    const calculateAdvancedExperienceCompatibility = (job) => {
      const experienceMatrix = {
        'entry': { 'entry': 1.0, 'junior': 0.8, 'mid': 0.4, 'senior': 0.1, 'lead': 0.05, 'executive': 0.02 },
        'junior': { 'entry': 0.7, 'junior': 1.0, 'mid': 0.8, 'senior': 0.3, 'lead': 0.1, 'executive': 0.05 },
        'mid': { 'entry': 0.3, 'junior': 0.7, 'mid': 1.0, 'senior': 0.8, 'lead': 0.4, 'executive': 0.1 },
        'senior': { 'entry': 0.1, 'junior': 0.3, 'mid': 0.7, 'senior': 1.0, 'lead': 0.8, 'executive': 0.3 },
        'lead': { 'entry': 0.05, 'junior': 0.1, 'mid': 0.4, 'senior': 0.7, 'lead': 1.0, 'executive': 0.7 },
        'executive': { 'entry': 0.02, 'junior': 0.05, 'mid': 0.1, 'senior': 0.3, 'lead': 0.7, 'executive': 1.0 }
      };
      
      const currentLevel = currentJob.experienceLevel?.toLowerCase();
      const jobLevel = job.experienceLevel?.toLowerCase();
      
      if (!currentLevel && !jobLevel) return 0.5;
      if (!currentLevel || !jobLevel) return 0.3;
      
      return experienceMatrix[currentLevel]?.[jobLevel] || 0.2;
    };

    // Fetch candidate jobs with comprehensive filtering
    const candidateJobs = await Job.findAll({
        where: {
        id: { [Op.ne]: id },
          status: 'active',
        region: currentJob.region || 'india',
        [Op.or]: [
          { validTill: null },
          { validTill: { [Op.gte]: new Date() } }
        ]
        },
        include: [
          {
            model: Company,
            as: 'company',
          attributes: ['id', 'name', 'industries', 'companySize', 'website', 'isFeatured', 'rating', 'totalReviews'],
            required: false
          },
          {
            model: User,
            as: 'employer',
            attributes: ['id', 'first_name', 'last_name', 'email'],
            required: false
          }
        ],
      limit: 200, // Increased for better selection
      order: [['created_at', 'DESC']] // Start with recent jobs (using database column name)
    });

    debugInfo.steps.push(`Found ${candidateJobs.length} candidate jobs for analysis`);

    if (candidateJobs.length === 0) {
      debugInfo.steps.push('No candidate jobs found');
      return res.status(200).json({
        success: true,
        message: 'No similar jobs found',
        data: [],
        metadata: {
          totalCandidates: 0,
          returnedJobs: 0,
          algorithm: 'ultra-advanced-similarity-v2',
          processingTime: Date.now() - startTime
        },
        debug: debug ? debugInfo : undefined
      });
    }

    // Advanced scoring with comprehensive factors
    const scoredJobs = candidateJobs.map(job => {
      let score = 0;
      const factorScores = {};
      
      // Define weights for different factors
      const weights = {
        titleSimilarity: 0.18,        // 18% - Job title relevance
        skillsMatch: 0.16,            // 16% - Skills overlap
        locationProximity: 0.14,      // 14% - Location nearness
        salaryCompatibility: 0.12,    // 12% - Salary range match
        experienceMatch: 0.12,        // 12% - Experience level
        industryMatch: 0.08,          // 8% - Industry alignment
        jobTypeMatch: 0.06,           // 6% - Job type compatibility
        departmentMatch: 0.05,        // 5% - Department similarity
        workModeMatch: 0.04,          // 4% - Remote/hybrid preference
        companySizeMatch: 0.02,       // 2% - Company size similarity
        featuredBoost: 0.02,          // 2% - Featured/premium boost
        recencyBoost: 0.01            // 1% - Recency factor
      };

      // 1. Advanced Title Similarity
      const titleScore = calculateAdvancedTextSimilarity(currentJob.title, job.title);
      score += titleScore * weights.titleSimilarity;
      factorScores.titleSimilarity = titleScore;

      // 2. Advanced Skills Match with importance weighting
      if (currentJob.skills && job.skills) {
        // Define skill importance weights (can be customized)
        const skillWeights = {
          'javascript': 1.2, 'react': 1.2, 'node.js': 1.2, 'python': 1.1,
          'java': 1.1, 'sql': 1.0, 'aws': 1.1, 'docker': 1.0
        };
        const skillsScore = calculateAdvancedArraySimilarity(currentJob.skills, job.skills, skillWeights);
        score += skillsScore * weights.skillsMatch;
        factorScores.skillsMatch = skillsScore;
      }

      // 3. Advanced Location Proximity
      const locationScore = calculateAdvancedLocationProximity(job);
      score += locationScore * weights.locationProximity;
      factorScores.locationProximity = locationScore;

      // 4. Advanced Salary Compatibility
      const salaryScore = calculateAdvancedSalaryCompatibility(job);
      score += salaryScore * weights.salaryCompatibility;
      factorScores.salaryCompatibility = salaryScore;

      // 5. Advanced Experience Match
      const experienceScore = calculateAdvancedExperienceCompatibility(job);
      score += experienceScore * weights.experienceMatch;
      factorScores.experienceMatch = experienceScore;

      // 6. Industry Match with fuzzy matching
      if (currentJob.company?.industries && job.company?.industries) {
        const currentIndustry = currentJob.company.industries.length > 0 ? currentJob.company.industries[0] : '';
        const jobIndustry = job.company.industries.length > 0 ? job.company.industries[0] : '';
        if (currentIndustry && jobIndustry) {
          const industryScore = calculateAdvancedTextSimilarity(
            currentIndustry, 
            jobIndustry
          );
          score += industryScore * weights.industryMatch;
          factorScores.industryMatch = industryScore;
        }
      }

      // 7. Job Type Match with compatibility matrix
      const jobTypeCompatibility = {
        'full-time': { 'full-time': 1.0, 'part-time': 0.3, 'contract': 0.6, 'internship': 0.2, 'freelance': 0.4 },
        'part-time': { 'full-time': 0.3, 'part-time': 1.0, 'contract': 0.4, 'internship': 0.5, 'freelance': 0.7 },
        'contract': { 'full-time': 0.6, 'part-time': 0.4, 'contract': 1.0, 'internship': 0.3, 'freelance': 0.6 },
        'internship': { 'full-time': 0.2, 'part-time': 0.5, 'contract': 0.3, 'internship': 1.0, 'freelance': 0.2 },
        'freelance': { 'full-time': 0.4, 'part-time': 0.7, 'contract': 0.6, 'internship': 0.2, 'freelance': 1.0 }
      };
      
      if (currentJob.jobType && job.jobType) {
        const jobTypeScore = jobTypeCompatibility[currentJob.jobType]?.[job.jobType] || 0.2;
        score += jobTypeScore * weights.jobTypeMatch;
        factorScores.jobTypeMatch = jobTypeScore;
      }

      // 8. Department Match with fuzzy matching
      if (currentJob.department && job.department) {
        const deptScore = calculateAdvancedTextSimilarity(currentJob.department, job.department);
        score += deptScore * weights.departmentMatch;
        factorScores.departmentMatch = deptScore;
      }

      // 9. Work Mode Match
      const workModeCompatibility = {
        'on-site': { 'on-site': 1.0, 'remote': 0.2, 'hybrid': 0.7 },
        'remote': { 'on-site': 0.2, 'remote': 1.0, 'hybrid': 0.8 },
        'hybrid': { 'on-site': 0.7, 'remote': 0.8, 'hybrid': 1.0 }
      };
      
      if (currentJob.remoteWork && job.remoteWork) {
        const workModeScore = workModeCompatibility[currentJob.remoteWork]?.[job.remoteWork] || 0.3;
        score += workModeScore * weights.workModeMatch;
        factorScores.workModeMatch = workModeScore;
      }

      // 10. Company Size Match
      if (currentJob.company?.companySize && job.company?.companySize) {
        const sizeScore = currentJob.company.companySize === job.company.companySize ? 1.0 : 0.3;
        score += sizeScore * weights.companySizeMatch;
        factorScores.companySizeMatch = sizeScore;
      }

      // 11. Featured/Premium Boost
      let featuredBoost = 0;
      if (job.isFeatured || job.isPremium) featuredBoost += 0.5;
      if (job.company?.isFeatured) featuredBoost += 0.3;
      if (job.company?.rating > 4.0) featuredBoost += 0.2;
      score += Math.min(featuredBoost, 1.0) * weights.featuredBoost;
      factorScores.featuredBoost = featuredBoost;

      // 12. Recency Factor
      const daysSincePosted = (new Date() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24);
      const recencyScore = daysSincePosted < 1 ? 1.0 : 
                          daysSincePosted < 7 ? 0.8 : 
                          daysSincePosted < 30 ? 0.6 : 
                          daysSincePosted < 90 ? 0.4 : 0.2;
      score += recencyScore * weights.recencyBoost;
      factorScores.recencyBoost = recencyScore;

      // 13. Same Company Boost (significant boost for same company)
      if (currentJob.companyId && job.companyId === currentJob.companyId) {
        score *= 1.25; // 25% boost
        factorScores.sameCompanyBoost = 0.25;
      }

      // 14. Popularity Factor (based on views and applications)
      const popularityScore = Math.min(1.0, (job.views || 0) / 1000 + (job.applications || 0) / 100);
      score += popularityScore * 0.01; // 1% weight
      factorScores.popularityScore = popularityScore;

      // 15. Career Progression Factor
      const currentExpIndex = ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'].indexOf(currentJob.experienceLevel);
      const jobExpIndex = ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'].indexOf(job.experienceLevel);
      
      if (currentExpIndex !== -1 && jobExpIndex !== -1) {
        const progressionScore = jobExpIndex > currentExpIndex ? 0.1 : 0; // Slight boost for higher level jobs
        score += progressionScore;
        factorScores.careerProgression = progressionScore;
      }

      return {
        job,
        score: Math.min(1.0, score), // Cap at 1.0
        factorScores,
        debugInfo: {
          titleScore: titleScore.toFixed(3),
          locationScore: locationScore.toFixed(3),
          experienceScore: experienceScore.toFixed(3),
          salaryScore: salaryScore.toFixed(3),
          totalScore: score.toFixed(3)
        }
      };
    });

    // Sort by score and apply diversity filter
    scoredJobs.sort((a, b) => b.score - a.score);
    
    // Apply diversity filter to avoid too many jobs from same company
    const diversifiedJobs = [];
    const companyCounts = {};
    const maxPerCompany = Math.ceil(sanitizedLimit / 2); // Max 2 jobs per company for limit 3
    
    for (const scoredJob of scoredJobs) {
      const companyId = scoredJob.job.companyId;
      const currentCount = companyCounts[companyId] || 0;
      
      if (currentCount < maxPerCompany || diversifiedJobs.length < sanitizedLimit) {
        diversifiedJobs.push(scoredJob);
        companyCounts[companyId] = currentCount + 1;
        
        if (diversifiedJobs.length >= sanitizedLimit) break;
      }
    }
    
    const topJobs = diversifiedJobs.slice(0, sanitizedLimit);
    debugInfo.steps.push(`Selected ${topJobs.length} jobs after diversity filtering`);

    // Format the response with comprehensive data
    const formattedJobs = topJobs.map(({ job, score, factorScores }) => ({
      id: job.id,
      title: job.title,
      company: job.company?.name || 'Company not specified',
      companyId: job.companyId,
      companyLogo: job.company?.logo,
      location: job.location,
      salary: job.salary || (job.salaryMin && job.salaryMax ? 
        `₹${(job.salaryMin / 100000).toFixed(1)}-${(job.salaryMax / 100000).toFixed(1)} LPA` : 
        'Salary not disclosed'),
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      type: job.jobType,
      experienceLevel: job.experienceLevel,
      department: job.department,
      skills: job.skills || [],
      remoteWork: job.remoteWork,
      posted: new Date(job.createdAt).toLocaleDateString(),
      postedDate: job.createdAt,
      applications: typeof job.applications === 'number' && job.applications > 0 ? job.applications : 0,
      views: typeof job.views === 'number' && job.views > 0 ? job.views : 0,
      isFeatured: job.isFeatured,
      isPremium: job.isPremium,
      description: job.description?.substring(0, 150) + (job.description?.length > 150 ? '...' : ''),
      companyInfo: {
        industry: job.company?.industries && job.company.industries.length > 0 ? job.company.industries[0] : 'Other',
        size: job.company?.companySize,
        website: job.company?.website,
        isFeatured: job.company?.isFeatured,
        rating: job.company?.rating,
        totalReviews: job.company?.totalReviews
      },
      similarityScore: isNaN(score) || !isFinite(score) ? '0.0' : (score * 100).toFixed(1),
      factorScores: debug ? factorScores : undefined
    }));

    const processingTime = Date.now() - startTime;
    debugInfo.steps.push(`Processing completed in ${processingTime}ms`);
    debugInfo.processingTime = processingTime;
    debugInfo.totalCandidates = candidateJobs.length;
    debugInfo.returnedJobs = formattedJobs.length;

    return res.status(200).json({
      success: true,
      message: 'Similar jobs retrieved successfully',
      data: formattedJobs,
      metadata: {
        totalCandidates: candidateJobs.length,
        returnedJobs: formattedJobs.length,
        algorithm: 'ultra-advanced-similarity-v2',
        processingTime: processingTime,
        diversityApplied: true,
        maxPerCompany: maxPerCompany
      },
      debug: debug ? debugInfo : undefined
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    debugInfo.steps.push(`Error occurred: ${error.message}`);
    debugInfo.processingTime = processingTime;
    
    console.error('Ultra-advanced similar jobs error:', error);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve similar jobs',
      error: error.message,
      debug: debug ? debugInfo : undefined
    });
  }
};

/**
 * Get job by ID for editing (with employer verification)
 */
exports.getJobForEdit = async (req, res, next) => {
  try {
    const { id } = req.params;

    const job = await Job.findByPk(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Verify that the job belongs to the authenticated employer
    if (job.employerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own jobs'
      });
    }

    // Include latest applications count for this job
    let applicationsCount = 0;
    try {
      const { JobApplication } = require('../config/index');
      applicationsCount = await JobApplication.count({ where: { jobId: id } });
    } catch (countErr) {
      console.warn('⚠️ Failed to count applications for job', id, countErr?.message || countErr);
    }

    // Attach to response without mutating model definition
    const jobData = job.toJSON ? job.toJSON() : job;
    jobData.applicationsCount = applicationsCount;

    return res.status(200).json({
      success: true,
      message: 'Job retrieved successfully for editing',
      data: jobData
    });
  } catch (error) {
    console.error('Get job for edit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve job for editing',
      error: error.message
    });
  }
};

/**
 * Update job
 */
exports.updateJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const job = await Job.findByPk(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // CRITICAL: Verify that the job belongs to the authenticated employer
    const userCompanyId = req.user.company_id || req.user.companyId;
    const isOwner = job.employerId === req.user.id || (userCompanyId && job.companyId === userCompanyId);
    
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own jobs'
      });
    }

    // Validate and convert education field (same as createJob)
    if (updateData.education !== undefined && updateData.education !== null) {
      if (Array.isArray(updateData.education)) {
        // Convert array to string
        updateData.education = updateData.education.join(', ');
      } else if (typeof updateData.education === 'object') {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: ['education cannot be an array or an object']
        });
      }
    }

    // Handle consultancy metadata fields
    const {
      companyName,
      postingType,
      consultancyName,
      hiringCompanyName,
      hiringCompanyIndustry,
      hiringCompanyDescription,
      showHiringCompanyDetails,
      industryType,
      ...otherUpdateData
    } = updateData;

    // Prepare metadata update
    const existingMetadata = job.metadata || {};
    const metadataUpdate = {
      ...existingMetadata,
      postingType: postingType || existingMetadata.postingType || 'company',
      companyName: companyName || existingMetadata.companyName || null,
    };

    // Add consultancy fields if postingType is 'consultancy'
    if (postingType === 'consultancy' || existingMetadata.postingType === 'consultancy') {
      metadataUpdate.consultancyName = consultancyName || existingMetadata.consultancyName || null;
      metadataUpdate.hiringCompany = {
        name: hiringCompanyName || existingMetadata.hiringCompany?.name || null,
        industry: hiringCompanyIndustry || (existingMetadata.hiringCompany?.industries && existingMetadata.hiringCompany.industries.length > 0 ? existingMetadata.hiringCompany.industries[0] : null) || null,
        description: hiringCompanyDescription || existingMetadata.hiringCompany?.description || null
      };
      metadataUpdate.showHiringCompanyDetails = showHiringCompanyDetails !== undefined 
        ? Boolean(showHiringCompanyDetails) 
        : existingMetadata.showHiringCompanyDetails || false;
    }

    // CRITICAL: Recalculate validTill when:
    // 1. Status changes to 'active' and validTill is missing/expired
    // 2. applicationDeadline is being changed
    const newStatus = updateData.status;
    const applicationDeadlineChanged = updateData.applicationDeadline !== undefined && 
                                       updateData.applicationDeadline !== job.applicationDeadline;
    
    if ((newStatus === 'active' && job.status !== 'active') || applicationDeadlineChanged) {
      const { calculateJobExpiry } = require('../utils/jobExpiryHelper');
      
      // Job is being activated - set publishedAt if not already set
      if (newStatus === 'active' && job.status !== 'active' && !job.publishedAt) {
        otherUpdateData.publishedAt = new Date();
        console.log('📅 Setting publishedAt for newly activated job');
      }
      
      // Recalculate validTill based on applicationDeadline + super-admin configured days
      const newApplicationDeadline = updateData.applicationDeadline !== undefined 
        ? updateData.applicationDeadline 
        : job.applicationDeadline;
      const publishedAtToUse = otherUpdateData.publishedAt || job.publishedAt || new Date();
      
      otherUpdateData.validTill = await calculateJobExpiry(newApplicationDeadline, publishedAtToUse);
      console.log('📅 Recalculated validTill for job update:', {
        jobId: job.id,
        applicationDeadline: newApplicationDeadline ? new Date(newApplicationDeadline).toISOString() : null,
        publishedAt: publishedAtToUse ? new Date(publishedAtToUse).toISOString() : null,
        calculatedValidTill: otherUpdateData.validTill.toISOString(),
        reason: applicationDeadlineChanged ? 'applicationDeadline changed' : 'status changed to active'
      });
    }

    // Prepare final update data with metadata
    const finalUpdateData = {
      ...otherUpdateData,
      metadata: metadataUpdate,
      // For consultancy jobs, use hiringCompanyIndustry if industryType is not provided
      industryType: (industryType && industryType.trim() ? industryType.trim() : null) || 
                    (postingType === 'consultancy' && hiringCompanyIndustry && hiringCompanyIndustry.trim() ? hiringCompanyIndustry.trim() : null) ||
                    job.industryType,
      // Ensure department is properly set
      department: updateData.department !== undefined ? (updateData.department && updateData.department.trim() ? updateData.department.trim() : null) : job.department
    };
    
    console.log('🔄 Update job data:', {
      department: finalUpdateData.department,
      hasCustomBranding: !!finalUpdateData.customBranding,
      brandingMediaCount: finalUpdateData.customBranding?.brandingMedia?.length || 0,
      publishedAt: finalUpdateData.publishedAt ? new Date(finalUpdateData.publishedAt).toISOString() : 'not set'
    });

    await job.update(finalUpdateData);
    
    // Reload to get updated values
    await job.reload();
    console.log('✅ Job updated successfully with department:', job.department);
    console.log('✅ Job updated with customBranding:', job.customBranding?.brandingMedia ? `${job.customBranding.brandingMedia.length} items` : 'empty');

    return res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: job
    });
  } catch (error) {
    console.error('Update job error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update job',
      error: error.message
    });
  }
};

/**
 * Delete job
 */
exports.deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    const job = await Job.findByPk(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Delete related records first to avoid foreign key constraint violations
    const { JobApplication, JobBookmark, Interview, UserActivityLog, sequelize } = require('../config/index');
    
    console.log('🗑️ Starting job deletion process for job ID:', id);
    
    // First, get all job applications for this job
    const jobApplications = await JobApplication.findAll({ where: { jobId: id } });
    console.log('🔍 Found', jobApplications.length, 'job applications to delete');
    
    // Delete user activity logs that reference these applications
    for (const application of jobApplications) {
      await UserActivityLog.destroy({ where: { applicationId: application.id } });
    }
    console.log('✅ Deleted user activity logs for applications');
    
    // Delete user activity logs that reference this job directly
    await UserActivityLog.destroy({ where: { jobId: id } });
    console.log('✅ Deleted user activity logs for job');
    
    // Now delete job applications
    await JobApplication.destroy({ where: { jobId: id } });
    console.log('✅ Deleted job applications');
    
    // Delete job bookmarks
    await JobBookmark.destroy({ where: { jobId: id } });
    console.log('✅ Deleted job bookmarks');
    
    // Delete interviews related to this job
    await Interview.destroy({ where: { jobId: id } });
    console.log('✅ Deleted interviews');
    
    // Now delete the job
    await job.destroy();
    console.log('✅ Deleted job successfully');

    return res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete job',
      error: error.message
    });
  }
};

/**
 * Get jobs by employer (authenticated user)
 */
exports.getJobsByEmployer = async (req, res, next) => {
  try {
    console.log('🔍 Fetching jobs for employer:', req.user.id, req.user.email);
    console.log('🔍 User companyId:', req.user.companyId);
    console.log('🔍 Query parameters:', req.query);
    
    const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * limit;
    
    // Filter by companyId if user has one (employers/admins), otherwise by employerId
    // CRITICAL: Prioritize company_id (database field) over companyId (model property)
    const userCompanyId = req.user.company_id || req.user.companyId;
    const whereClause = {};
    if (userCompanyId) {
      // Employers and admins see all jobs from their company
      whereClause.companyId = userCompanyId;
      console.log('🔍 Filtering by companyId:', userCompanyId);
    } else {
      // Fallback to employerId for users without companyId
      whereClause.employerId = req.user.id;
      console.log('🔍 Filtering by employerId:', req.user.id);
    }
    
    // Add region filtering to ensure Gulf employers only see Gulf jobs
    if (req.user.region === 'gulf') {
      whereClause.region = 'gulf';
    } else if (req.user.region === 'india') {
      whereClause.region = 'india';
    } else if (req.user.region === 'other') {
      whereClause.region = 'other';
    }
    // If user has no region set, show all jobs (backward compatibility)
    
    // Add filters
    if (status && status !== 'all') {
      if (status === 'draft') {
        // For drafts, show draft jobs
        whereClause.status = 'draft';
      } else if (status === 'active') {
        // For active jobs, show active jobs
        whereClause.status = 'active';
      } else {
        // For other statuses, use exact status match
        whereClause.status = status;
      }
      console.log('🔍 Filtering by status:', status);
    }
    
    console.log('🔍 Final where clause:', whereClause);
    if (search) {
      whereClause[Or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } },
        { department: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Map camelCase sortBy to snake_case database columns
    const sortByMapping = {
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'title': 'title',
      'status': 'status',
      'location': 'location'
    };
    
    const dbSortBy = sortByMapping[sortBy] || 'created_at';

    const { count, rows: jobs } = await Job.findAndCountAll({
      where: whereClause,
      order: [[dbSortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log(`✅ Found ${count} jobs for employer ${req.user.id}`);
    // Attach applicationsCount per job
    let jobsWithCounts = jobs;
    try {
      const { JobApplication } = require('../config/index');
      const jobIds = jobs.map(j => j.id);
      if (jobIds.length > 0) {
        const Sequelize = Job.sequelize;
        const [rowsCount] = await Sequelize.query(
          'SELECT job_id as "jobId", COUNT(*)::int as cnt FROM job_applications WHERE job_id = ANY($1) GROUP BY job_id',
          { bind: [jobIds] }
        );
        const map = new Map(rowsCount.map(r => [r.jobId, r.cnt]));
        jobsWithCounts = jobs.map(j => ({ ...(j.toJSON ? j.toJSON() : j), applicationsCount: map.get(j.id) || 0 }));
      }
    } catch (e) {
      console.warn('⚠️ Failed to compute applicationsCount for employer jobs:', e?.message || e);
      jobsWithCounts = jobs.map(j => ({ ...(j.toJSON ? j.toJSON() : j), applicationsCount: 0 }));
    }

    return res.status(200).json({
      success: true,
      message: 'Employer jobs retrieved successfully',
      data: jobsWithCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    }); 
  } catch (error) {
    console.error('❌ Get employer jobs error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    // Handle specific database errors
    if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeConnectionTimedOutError') {
      return res.status(503).json({
        success: false,
        message: 'Database connection error. Please try again later.',
        error: 'DATABASE_CONNECTION_ERROR'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve employer jobs',
      error: error.message
    });
  }
};

/**
 * Get jobs by company
 */
exports.getJobsByCompany = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { companyId: companyId };

    if (status) {
      if (status === 'active') {
        whereClause.status = 'active';
      } else if (status === 'expired') {
        whereClause.status = 'expired';
      } else if (status === 'inactive') {
        whereClause.status = { [OpIn]: ['draft', 'paused', 'closed', 'expired'] };
      }
    } else {
      // CRITICAL: Public company page: only show active jobs that are NOT expired
      // Expired jobs should NOT appear in public listings
      whereClause.status = 'active';
      const now = new Date();
      // Only show jobs where validTill is null (never expires) OR validTill >= now (not expired)
      whereClause[Op.and] = [
        ...(whereClause[Op.and] || []),
        { [Op.or]: [{ validTill: null }, { validTill: { [Op.gte]: now } }] }
      ];
    }

    const { count, rows: jobs } = await Job.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'industries', 'companySize'],
          required: false // Make it optional since companyId can be NULL
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      message: 'Company jobs retrieved successfully',
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get company jobs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve company jobs',
      error: error.message
    });
  }
};

/**
 * Update job status
 */
exports.updateJobStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const job = await Job.findByPk(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // CRITICAL: Calculate validTill based on applicationDeadline + super-admin configured days
    // If setting to active, recalculate validTill if missing or expired
    const updates = { status };
    if (status === 'active') {
      const now = new Date();
      // Set publishedAt when job becomes active
      if (!job.publishedAt) {
        updates.publishedAt = now;
      }
      // Recalculate validTill if missing or expired
      if (!job.validTill || now > new Date(job.validTill)) {
        const { calculateJobExpiry } = require('../utils/jobExpiryHelper');
        updates.validTill = await calculateJobExpiry(job.applicationDeadline, job.publishedAt || now);
        console.log('📅 Recalculated validTill for job status update:', {
          jobId: job.id,
          applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString() : null,
          publishedAt: job.publishedAt ? new Date(job.publishedAt).toISOString() : null,
          calculatedValidTill: updates.validTill.toISOString()
        });
      }
    }
    const prevStatus = job.status;
    await job.update(updates);

    // If set to active (idempotent), notify watchers
    try {
      if (status === 'active') {
        const sequelize = Job.sequelize;
        console.log('🔔 Reactivation for job', job.id, 'prevStatus=', prevStatus, '-> active');
        const [watchers] = await sequelize.query('SELECT user_id FROM job_bookmarks WHERE job_id = $1', { bind: [job.id] });
        console.log('🔔 Found watchers:', Array.isArray(watchers) ? watchers.length : 0);
        if (Array.isArray(watchers) && watchers.length > 0) {
          const EmailService = require('../services/emailService');
          for (const w of watchers) {
            try {
              // Send notification email (jsonTransport in dev)
              const watcher = await User.findByPk(w.user_id);
              console.log('🔔 Notifying watcher user_id=', w.user_id, 'email=', watcher?.email || 'n/a');
              if (watcher?.email) {
                await EmailService.sendPasswordResetEmail(
                  watcher.email,
                  'job-reopened',
                  watcher.first_name || 'Job Seeker'
                );
              }
              // Create in-app notification
              try {
                const Notification = require('../models/Notification');
                await Notification.create({
                  userId: w.user_id,
                  type: 'system',
                  title: 'Tracked job reopened',
                  message: `${job.title} is open again. Apply now!`,
                  priority: 'medium',
                  actionUrl: `/jobs/${job.id}`,
                  actionText: 'View job',
                  icon: 'briefcase',
                  metadata: { jobId: job.id, companyId: job.companyId }
                });
                console.log('✅ In-app notification persisted for', w.user_id);
              } catch (notifErr) {
                console.warn('Failed to create in-app notification', notifErr?.message || notifErr);
              }
            } catch (e) {
              console.warn('Failed to notify watcher', w.userId, e?.message || e);
            }
          }
        } else {
          console.log('ℹ️ No watchers to notify for job', job.id);
        }
      }
    } catch (notifyErr) {
      console.warn('Watcher notification failed:', notifyErr?.message || notifyErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Job status updated successfully',
      data: job
    });
  } catch (error) {
    console.error('Update job status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update job status',
      error: error.message
    });
  }
};




