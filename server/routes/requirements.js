'use strict';

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { Op, QueryTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');
const CandidateLike = require('../models/CandidateLike');

const Requirement = require('../models/Requirement');
const User = require('../models/User');
const Company = require('../models/Company');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Resume = require('../models/Resume');

const { authenticateToken } = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');

// Create Requirement
router.post('/', authenticateToken, checkPermission('resumeDatabase'), async (req, res) => {
  try {
    const body = req.body || {};
    console.log('📝 Create Requirement request by user:', req.user?.id, 'companyId:', req.user?.companyId);
    console.log('📝 Payload:', JSON.stringify(body));

    // Only employers/admins can create requirements
    if (req.user.user_type !== 'employer' && req.user.user_type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only employers can create requirements' });
    }

    const errors = [];
    if (!body.title || String(body.title).trim() === '') errors.push('title is required');
    if (!body.description || String(body.description).trim() === '') errors.push('description is required');
    if (!body.location || String(body.location).trim() === '') errors.push('location is required');

    if (errors.length) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    // Normalize enums to backend values with safe fallbacks
    const jobTypeAllowed = new Set(['full-time', 'part-time', 'contract', 'internship', 'freelance']);
    let normalizedJobType = (body.jobType || 'full-time')
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-');
    if (!jobTypeAllowed.has(normalizedJobType)) normalizedJobType = 'full-time';

    const remoteWorkAllowed = new Set(['on-site', 'remote', 'hybrid']);
    let normalizedRemoteWork = (body.remoteWork || '')
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-');
    if (!remoteWorkAllowed.has(normalizedRemoteWork)) normalizedRemoteWork = null;

    const shiftTimingAllowed = new Set(['day', 'night', 'rotational', 'flexible']);
    let normalizedShiftTiming = (body.shiftTiming || '')
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-');
    if (!shiftTimingAllowed.has(normalizedShiftTiming)) normalizedShiftTiming = null;

    // Normalize travelRequired (UI may send 'No' | 'Occasionally' | 'Frequently')
    let normalizedTravelRequired = undefined;
    if (typeof body.travelRequired === 'string') {
      const v = body.travelRequired.toString().toLowerCase();
      if (v === 'no') normalizedTravelRequired = false; else normalizedTravelRequired = true;
    } else if (typeof body.travelRequired === 'boolean') {
      normalizedTravelRequired = body.travelRequired;
    }

    // Resolve companyId: admins can specify any companyId; employers default to their own
    let companyId = body.companyId || req.user.companyId;
    if (!companyId) {
      try {
        // Try from provided companyName
        let companyRecord = null;
        const providedCompanyName = (body.companyName || '').toString().trim();

        const generateSlug = async (name) => {
          let baseSlug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .substring(0, 50);
          if (!baseSlug) baseSlug = `company-${Date.now()}`;
          let slug = baseSlug;
          let counter = 1;
          // Ensure uniqueness
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const existing = await Company.findOne({ where: { slug } });
            if (!existing) break;
            slug = `${baseSlug}-${counter++}`;
          }
          return slug;
        };

        if (providedCompanyName) {
          const slug = await generateSlug(providedCompanyName);
          companyRecord = await Company.create({
            name: providedCompanyName,
            slug,
            industries: body.industries || ['Other'],
            companySize: body.companySize || '1-50',
            email: req.user.email,
            region: body.region || 'india',
            country: body.country || (body.region === 'gulf' ? 'UAE' : 'India'),
            contactPerson: `${req.user.first_name} ${req.user.last_name}`.trim(),
            contactEmail: req.user.email,
            companyStatus: 'pending_approval',
            isActive: true
          });
        } else {
          // Derive from email domain as a fallback
          const emailDomain = (req.user.email || '').split('@')[1] || '';
          const domainBase = emailDomain.replace(/\..*$/, '').replace(/[^a-zA-Z0-9]+/g, ' ');
          const derivedName = domainBase ? domainBase.charAt(0).toUpperCase() + domainBase.slice(1) : 'New Company';
          const slug = await generateSlug(derivedName);
          companyRecord = await Company.create({
            name: derivedName,
            slug,
            industry: 'Other',
            companySize: '1-50',
            email: req.user.email,
            region: body.region || 'india',
            country: body.country || (body.region === 'gulf' ? 'UAE' : 'India'),
            contactPerson: `${req.user.first_name} ${req.user.last_name}`.trim(),
            contactEmail: req.user.email,
            companyStatus: 'pending_approval',
            isActive: true
          });
        }

        // Attach to user for future requests and set as admin with Hiring Manager designation
        await req.user.update({
          companyId: companyRecord.id,
          user_type: 'admin', // User becomes admin when they create a company
          designation: 'Hiring Manager' // Set proper designation for company creators
        });
        companyId = companyRecord.id;
        console.log('🏢 Created and attached company to employer:', companyId);
      } catch (companyErr) {
        console.error('❌ Failed to resolve company for requirement creation:', companyErr);
        return res.status(400).json({ success: false, message: 'Unable to determine or create company for employer' });
      }
    }

    const normalizedLocation = (body.location !== undefined && body.location !== null)
      ? String(body.location).trim() || null
      : null;

    const requirement = await Requirement.create({
      title: String(body.title).trim(),
      description: String(body.description).trim(),
      location: normalizedLocation,
      companyId: companyId,
      createdBy: req.user.id,
      experience: body.experience || null,
      experienceMin: body.workExperienceMin || body.experienceMin || null,
      experienceMax: body.workExperienceMax || body.experienceMax || null,
      salary: body.salary || null,
      salaryMin: body.currentSalaryMin || body.salaryMin || null,
      salaryMax: body.currentSalaryMax || body.salaryMax || null,
      currency: body.currency || 'INR',
      jobType: normalizedJobType,
      skills: Array.isArray(body.skills) ? body.skills : [],
      keySkills: Array.isArray(body.keySkills) ? body.keySkills : [],
      education: body.education || null,
      validTill: body.validTill ? new Date(body.validTill) : null,
      noticePeriod: body.noticePeriod || null,
      remoteWork: normalizedRemoteWork || null,
      travelRequired: normalizedTravelRequired !== undefined ? normalizedTravelRequired : null,
      shiftTiming: normalizedShiftTiming || null,
      candidateLocations: Array.isArray(body.candidateLocations) ? body.candidateLocations : [],
      candidateDesignations: Array.isArray(body.candidateDesignations) ? body.candidateDesignations : [],
      includeWillingToRelocate: !!body.includeWillingToRelocate,
      includeNotMentioned: !!body.includeNotMentioned,
      benefits: Array.isArray(body.benefits) ? body.benefits : [],
      metadata: {
        ...(body.metadata || {}),
        region: body.region || 'india',
        // Store virtual fields in metadata so they persist
        jobType: normalizedJobType,
        education: body.education || null,
        noticePeriod: body.noticePeriod || null,
        travelRequired: normalizedTravelRequired,
        shiftTiming: normalizedShiftTiming,
        benefits: Array.isArray(body.benefits) ? body.benefits : [],
        candidateLocations: Array.isArray(body.candidateLocations) ? body.candidateLocations : [],
        excludeLocations: Array.isArray(body.excludeLocations) ? body.excludeLocations : (body.excludeLocations ? [body.excludeLocations] : []), // Locations to exclude
        candidateDesignations: Array.isArray(body.candidateDesignations) ? body.candidateDesignations : [],
        currentDesignation: body.currentDesignation || null, // Store current designation
        includeWillingToRelocate: !!body.includeWillingToRelocate,
        includeNotMentioned: !!body.includeNotMentioned,
        industry: body.industry || null,
        department: body.department || null,
        institute: body.institute || null,
        resumeFreshness: body.resumeFreshness ? new Date(body.resumeFreshness) : null,
        currentCompany: body.currentCompany || null,
        location: normalizedLocation, // Also store in metadata for redundancy
        experience: body.experience ? String(body.experience).trim() : null,
        salary: body.salary ? String(body.salary).trim() : null,
        // CRITICAL: Store salary and experience fields in metadata for matching
        workExperienceMin: body.workExperienceMin || body.experienceMin || null,
        workExperienceMax: body.workExperienceMax || body.experienceMax || null,
        currentSalaryMin: body.currentSalaryMin || body.salaryMin || null,
        currentSalaryMax: body.currentSalaryMax || body.salaryMax || null,
        // CRITICAL: Store includeSkills and excludeSkills for matching
        // IMPORTANT: Merge keySkills (Additional Skills) into includeSkills automatically
        includeSkills: (() => {
          const includeSkillsFromBody = Array.isArray(body.includeSkills) ? body.includeSkills : (body.includeSkills ? [body.includeSkills] : []);
          const keySkillsArray = Array.isArray(body.keySkills) ? body.keySkills : [];
          // Merge keySkills into includeSkills (all additional skills should be included)
          return [...new Set([...includeSkillsFromBody, ...keySkillsArray])].filter(Boolean);
        })(),
        excludeSkills: Array.isArray(body.excludeSkills) ? body.excludeSkills : (body.excludeSkills ? [body.excludeSkills] : []),
        diversityPreference: Array.isArray(body.diversityPreference) ? body.diversityPreference : (body.diversityPreference ? [body.diversityPreference] : null),
        lastActive: body.lastActive || null
      }
    });

    console.log('✅ Requirement created with id:', requirement.id);

    // Send notification to employer about requirement creation
    try {
      const { Notification } = require('../config/index');
      const { Company } = require('../config/index');

      // Check if notification already exists for this requirement (prevent duplicates)
      const existingNotification = await Notification.findOne({
        where: {
          userId: req.user.id,
          type: 'company_update',
          'metadata.requirementId': requirement.id,
          'metadata.action': 'requirement_created'
        }
      });

      if (!existingNotification) {
        // Get company info for notification
        const company = await Company.findByPk(requirement.companyId);
        const companyName = company?.name || 'Your Company';

        await Notification.create({
          userId: req.user.id,
          type: 'company_update',
          title: `✅ Requirement Posted Successfully!`,
          message: `Your requirement "${requirement.title}" has been posted. Start searching for candidates now!`,
          shortMessage: `Requirement posted: ${requirement.title}`,
          priority: 'low',
          actionUrl: `/employer-dashboard/candidate-requirement/${requirement.id}`,
          actionText: 'View Requirement',
          icon: 'briefcase',
          metadata: {
            requirementId: requirement.id,
            requirementTitle: requirement.title,
            companyId: requirement.companyId,
            companyName: companyName,
            action: 'requirement_created'
          }
        });
        console.log(`✅ Requirement creation notification sent to employer ${req.user.id}`);
      } else {
        console.log(`ℹ️ Notification already exists for requirement ${requirement.id}, skipping duplicate`);
      }
    } catch (notificationError) {
      console.error('❌ Failed to send requirement creation notification:', notificationError);
      // Don't fail the requirement creation if notification fails
    }

    // Check and consume quota for requirement posting
    try {
      const EmployerQuotaService = require('../services/employerQuotaService');
      await EmployerQuotaService.checkAndConsume(
        req.user.id,
        EmployerQuotaService.QUOTA_TYPES.REQUIREMENTS_POSTED,
        {
          activityType: 'requirement_posted',
          details: {
            requirementId: requirement.id,
            title: requirement.title,
            location: requirement.location,
            jobType: requirement.jobType,
            companyId: requirement.companyId
          },
          defaultLimit: 30
        }
      );
    } catch (quotaError) {
      console.error('Quota check failed for requirement posting:', quotaError);
      if (quotaError.code === 'QUOTA_LIMIT_EXCEEDED') {
        // Delete the requirement that was just created since quota exceeded
        await requirement.destroy();
        return res.status(429).json({
          success: false,
          message: 'You have reached your monthly requirement posting limit. Please upgrade your plan or contact our support team for assistance.',
          code: 'QUOTA_LIMIT_EXCEEDED',
          quotaInfo: {
            limit: quotaError.quotaInfo?.limit || 30,
            used: quotaError.quotaInfo?.used || 0,
            remaining: 0,
            resetDate: quotaError.quotaInfo?.resetDate
          }
        });
      }
      // For other quota errors, continue but log the issue
    }

    // Log requirement posting activity
    try {
      const EmployerActivityService = require('../services/employerActivityService');
      await EmployerActivityService.logActivity(
        req.user.id,
        'requirement_posted',
        {
          details: {
            requirementId: requirement.id,
            title: requirement.title,
            location: requirement.location,
            jobType: requirement.jobType,
            companyId: requirement.companyId,
            companyName: req.user.company?.name || 'Unknown Company'
          }
        }
      );
    } catch (activityError) {
      console.error('Failed to log requirement posting activity:', activityError);
      // Don't fail the creation if activity logging fails
    }

    return res.status(201).json({ success: true, message: 'Requirement created successfully', data: requirement });
  } catch (error) {
    console.error('❌ Requirement creation error:', error);
    console.error('❌ Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      errors: error?.errors
    });

    // Determine status code and message based on error type
    let statusCode = 500;
    let message = 'Failed to create requirement. Please try again.';

    if (error?.name === 'SequelizeUniqueConstraintError') {
      statusCode = 409;
      message = 'A requirement with similar details already exists.';
    } else if (error?.name === 'SequelizeValidationError') {
      statusCode = 400;
      message = 'Invalid data provided. Please check your inputs.';
    } else if (error?.message?.includes('unauthorized') || error?.message?.includes('permission')) {
      statusCode = 403;
      message = 'You do not have permission to create requirements.';
    }

    return res.status(statusCode).json({
      success: false,
      message: message,
      error: {
        name: error?.name,
        message: error?.message,
        details: error?.errors ? error.errors.map(e => e.message || e) : undefined
      }
    });
  }
});

// List Requirements for authenticated employer's company
router.get('/', authenticateToken, checkPermission('resumeDatabase'), async (req, res) => {
  try {
    console.log('🔍 Requirements API - User:', {
      id: req.user?.id,
      user_type: req.user?.user_type,
      companyId: req.user?.companyId
    });

    // Check if user is an employer or admin
    if (req.user.user_type !== 'employer' && req.user.user_type !== 'admin') {
      console.log('❌ Requirements API - User is not an employer or admin:', req.user.user_type);
      return res.status(403).json({ success: false, message: 'Access denied. Only employers and admins can view requirements.' });
    }

    // Admins can view another company's requirements via query.companyId
    const requestedCompanyId = req.query.companyId;
    const companyId = req.user.user_type === 'admin' ? (requestedCompanyId || req.user.companyId) : req.user.companyId;
    console.log('🔍 Requirements API - Company ID:', companyId);

    if (!companyId) {
      console.log('⚠️ Requirements API - No company ID, returning empty array');
      return res.status(200).json({ success: true, data: [] });
    }

    console.log('🔍 Requirements API - Fetching requirements for company:', companyId);

    // Build where clause
    const whereClause = { companyId: companyId };

    console.log('🔍 Requirements API - Where clause:', whereClause);
    const rows = await Requirement.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });

    console.log('✅ Requirements API - Found requirements:', rows.length);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('❌ List requirements error:', error);
    console.error('❌ Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch requirements',
      error: { name: error.name, message: error.message }
    });
  }
});

// Get single requirement by ID
router.get('/:id', authenticateToken, checkPermission('resumeDatabase'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is an employer or admin
    if (req.user.user_type !== 'employer' && req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only employers and admins can view requirements.'
      });
    }

    // Query requirement with raw SQL to get all fields
    // First try to get the requirement normally, then check for metadata
    const requirement = await Requirement.findOne({
      where: { id }
    });

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found'
      });
    }

    // Check ownership
    if (req.user.user_type !== 'admin' && String(requirement.companyId) !== String(req.user.companyId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This requirement belongs to another company.'
      });
    }

    // Get raw data to extract metadata if it exists
    const [results] = await sequelize.query(`
      SELECT * FROM requirements WHERE id = :id
    `, {
      replacements: { id },
      type: QueryTypes.SELECT
    });

    // results is an array of rows, get the first row
    const rawRequirement = Array.isArray(results) && results.length > 0 ? results[0] : (results || null);

    // Parse metadata if it exists
    let metadata = {};
    if (rawRequirement && rawRequirement.metadata) {
      try {
        if (typeof rawRequirement.metadata === 'string') {
          // Try parsing as JSON string
          metadata = JSON.parse(rawRequirement.metadata);
        } else if (typeof rawRequirement.metadata === 'object') {
          // Already an object (JSONB from PostgreSQL)
          metadata = rawRequirement.metadata;
        } else {
          console.warn('Unexpected metadata type:', typeof rawRequirement.metadata);
          metadata = {};
        }
        // Ensure metadata is an object
        if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
          console.warn('Invalid metadata format, resetting to empty object');
          metadata = {};
        }
      } catch (e) {
        console.error('Failed to parse metadata:', e);
        console.error('Raw metadata value:', rawRequirement.metadata);
        metadata = {};
      }
    }

    console.log('📦 Raw requirement from DB:', {
      hasMetadata: !!rawRequirement?.metadata,
      metadataType: typeof rawRequirement?.metadata,
      location: rawRequirement?.location,
      location_type: rawRequirement?.location_type
    });
    console.log('📦 Parsed metadata:', JSON.stringify(metadata, null, 2));
    console.log('📦 Metadata fields extracted:', {
      industry: metadata?.industry,
      department: metadata?.department,
      location: metadata?.location,
      jobType: metadata?.jobType,
      education: metadata?.education,
      noticePeriod: metadata?.noticePeriod
    });

    // Transform requirement to include all fields, extracting from metadata where needed
    const requirementData = requirement.toJSON();
    const transformedRequirement = {
      ...requirementData,
      // Location: try metadata first, then rawRequirement location, then requirementData location
      location: (metadata?.location && metadata.location.trim() !== '') ? metadata.location : (rawRequirement?.location || requirementData.location || null),
      // Experience: try metadata first, then requirementData, then rawRequirement
      experience: (metadata?.experience && metadata.experience.trim() !== '') ? metadata.experience : (requirementData.experience || rawRequirement?.experience || null),
      // Salary: try metadata first, then requirementData, then rawRequirement
      salary: (metadata?.salary && metadata.salary.trim() !== '') ? metadata.salary : (requirementData.salary || rawRequirement?.salary || null),
      // JobType: from metadata (normalized format like "full-time") - convert to display format
      jobType: metadata?.jobType || metadata?.job_type || requirementData.jobType || null,
      // Education: from metadata
      education: (metadata?.education && metadata.education.trim() !== '') ? metadata.education : (requirementData.education || null),
      // Industry: from metadata only (virtual field)
      industry: (metadata?.industry && metadata.industry.trim() !== '') ? metadata.industry : null,
      // Department: from metadata only (virtual field)
      department: (metadata?.department && metadata.department.trim() !== '') ? metadata.department : null,
      // RemoteWork: map from location_type column or metadata
      remoteWork: (() => {
        if (metadata?.remoteWork) return metadata.remoteWork;
        if (rawRequirement?.location_type) {
          // Convert database values to display format
          const locationType = rawRequirement.location_type.toLowerCase();
          if (locationType === 'remote') return 'remote';
          if (locationType === 'on-site' || locationType === 'onsite') return 'on-site';
          if (locationType === 'hybrid') return 'hybrid';
          return rawRequirement.location_type;
        }
        return requirementData.remoteWork || requirementData.location_type || null;
      })(),
      noticePeriod: metadata?.noticePeriod || metadata?.notice_period || requirementData.noticePeriod || null,
      travelRequired: metadata?.travelRequired !== undefined ? metadata.travelRequired : (metadata?.travel_required !== undefined ? metadata.travel_required : (requirementData.travelRequired !== undefined ? requirementData.travelRequired : null)),
      shiftTiming: metadata?.shiftTiming || metadata?.shift_timing || requirementData.shiftTiming || null,
      benefits: metadata?.benefits || requirementData.benefits || [],
      candidateDesignations: metadata?.candidateDesignations || metadata?.candidate_designations || requirementData.candidateDesignations || [],
      candidateLocations: metadata?.candidateLocations || metadata?.candidate_locations || requirementData.candidateLocations || [],
      excludeLocations: Array.isArray(metadata?.excludeLocations) ? metadata.excludeLocations : (metadata?.excludeLocations ? [metadata.excludeLocations] : (metadata?.exclude_locations ? (Array.isArray(metadata.exclude_locations) ? metadata.exclude_locations : [metadata.exclude_locations]) : [])), // Locations to exclude
      includeWillingToRelocate: metadata?.includeWillingToRelocate !== undefined ? metadata.includeWillingToRelocate : (metadata?.include_willing_to_relocate !== undefined ? metadata.include_willing_to_relocate : (requirementData.includeWillingToRelocate !== undefined ? requirementData.includeWillingToRelocate : false)),
      includeNotMentioned: metadata?.includeNotMentioned !== undefined ? metadata.includeNotMentioned : (metadata?.include_not_mentioned !== undefined ? metadata.include_not_mentioned : (requirementData.includeNotMentioned !== undefined ? requirementData.includeNotMentioned : false)),
      institute: metadata?.institute || null,
      resumeFreshness: metadata?.resumeFreshness || metadata?.resume_freshness ? new Date(metadata.resumeFreshness || metadata.resume_freshness) : null,
      currentCompany: metadata?.currentCompany || metadata?.current_company || null,
      // Additional fields from metadata
      currentDesignation: metadata?.currentDesignation || metadata?.current_designation || null,
      includeSkills: Array.isArray(metadata?.includeSkills) ? metadata.includeSkills : (metadata?.includeSkills ? [metadata.includeSkills] : []),
      excludeSkills: Array.isArray(metadata?.excludeSkills) ? metadata.excludeSkills : (metadata?.excludeSkills ? [metadata.excludeSkills] : []),
      diversityPreference: Array.isArray(metadata?.diversityPreference) ? metadata.diversityPreference : (metadata?.diversityPreference ? [metadata.diversityPreference] : []),
      experienceMin: metadata?.experienceMin !== undefined ? metadata.experienceMin : (metadata?.workExperienceMin !== undefined ? metadata.workExperienceMin : (requirementData.experienceMin || rawRequirement?.experience_min || null)),
      experienceMax: metadata?.experienceMax !== undefined ? metadata.experienceMax : (metadata?.workExperienceMax !== undefined ? metadata.workExperienceMax : (requirementData.experienceMax || rawRequirement?.experience_max || null)),
      salaryMin: metadata?.salaryMin !== undefined ? metadata.salaryMin : (metadata?.currentSalaryMin !== undefined ? metadata.currentSalaryMin : (requirementData.salaryMin || rawRequirement?.salary_min || null)),
      salaryMax: metadata?.salaryMax !== undefined ? metadata.salaryMax : (metadata?.currentSalaryMax !== undefined ? metadata.currentSalaryMax : (requirementData.salaryMax || rawRequirement?.salary_max || null)),
      currentSalaryMin: metadata?.currentSalaryMin !== undefined ? metadata.currentSalaryMin : (metadata?.salaryMin !== undefined ? metadata.salaryMin : (requirementData.currentSalaryMin || requirementData.salaryMin || rawRequirement?.salary_min || null)),
      currentSalaryMax: metadata?.currentSalaryMax !== undefined ? metadata.currentSalaryMax : (metadata?.salaryMax !== undefined ? metadata.salaryMax : (requirementData.currentSalaryMax || requirementData.salaryMax || rawRequirement?.salary_max || null)),
      lastActive: metadata?.lastActive !== undefined ? metadata.lastActive : (metadata?.last_active !== undefined ? metadata.last_active : null)
    };

    console.log('📤 Transformed requirement fields:', {
      industry: transformedRequirement.industry,
      department: transformedRequirement.department,
      location: transformedRequirement.location,
      jobType: transformedRequirement.jobType,
      education: transformedRequirement.education
    });

    return res.status(200).json({ success: true, data: transformedRequirement });
  } catch (error) {
    console.error('❌ Get requirement error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve requirement',
      details: error?.message || error?.stack
    });
  }
});

// Update requirement
router.put('/:id', authenticateToken, checkPermission('resumeDatabase'), async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    console.log('📝 Update Requirement request by user:', req.user?.id, 'requirementId:', id);
    console.log('📝 Payload:', JSON.stringify(body, null, 2));

    // Check if user is an employer or admin
    if (req.user.user_type !== 'employer' && req.user.user_type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only employers can update requirements' });
    }

    // Find requirement
    const requirement = await Requirement.findOne({ where: { id } });

    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found' });
    }

    // If not admin, enforce ownership
    if (req.user.user_type !== 'admin' && String(requirement.companyId) !== String(req.user.companyId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This requirement belongs to another company.'
      });
    }

    // Get raw requirement to check existing metadata
    const [rawResults] = await sequelize.query(`
      SELECT * FROM requirements WHERE id = :id
    `, {
      replacements: { id },
      type: QueryTypes.SELECT
    });
    const rawRequirement = rawResults && rawResults.length > 0 ? rawResults[0] : null;

    // Parse existing metadata
    let existingMetadata = {};
    if (rawRequirement && rawRequirement.metadata) {
      try {
        if (typeof rawRequirement.metadata === 'string') {
          existingMetadata = JSON.parse(rawRequirement.metadata);
        } else {
          existingMetadata = rawRequirement.metadata;
        }
      } catch (e) {
        console.warn('Failed to parse existing metadata:', e);
      }
    }

    // Normalize enums to backend values with safe fallbacks (same as create)
    const jobTypeAllowed = new Set(['full-time', 'part-time', 'contract', 'internship', 'freelance']);
    // Get existing jobType from metadata or requirement
    const existingJobType = existingMetadata.jobType || existingMetadata.job_type || null;
    let normalizedJobType = body.jobType ? body.jobType.toString().toLowerCase().replace(/\s+/g, '-') : existingJobType;
    if (normalizedJobType && !jobTypeAllowed.has(normalizedJobType)) {
      normalizedJobType = existingJobType || 'full-time';
    }

    const remoteWorkAllowed = new Set(['on-site', 'remote', 'hybrid']);
    // Get existing remoteWork from requirement (it's stored as location_type in DB)
    const existingRemoteWork = requirement.remoteWork || null;
    let normalizedRemoteWork = body.remoteWork ? body.remoteWork.toString().toLowerCase().replace(/\s+/g, '-') : existingRemoteWork;
    if (normalizedRemoteWork && !remoteWorkAllowed.has(normalizedRemoteWork)) {
      normalizedRemoteWork = existingRemoteWork || null;
    }

    const shiftTimingAllowed = new Set(['day', 'night', 'rotational', 'flexible']);
    const existingShiftTiming = existingMetadata.shiftTiming || existingMetadata.shift_timing || null;
    let normalizedShiftTiming = body.shiftTiming ? body.shiftTiming.toString().toLowerCase().replace(/\s+/g, '-') : existingShiftTiming;
    if (normalizedShiftTiming && !shiftTimingAllowed.has(normalizedShiftTiming)) {
      normalizedShiftTiming = existingShiftTiming || null;
    }

    // Normalize travelRequired
    const existingTravelRequired = existingMetadata.travelRequired !== undefined ? existingMetadata.travelRequired : (existingMetadata.travel_required !== undefined ? existingMetadata.travel_required : null);
    let normalizedTravelRequired = body.travelRequired;
    if (normalizedTravelRequired !== undefined && normalizedTravelRequired !== null) {
      if (typeof normalizedTravelRequired === 'string') {
        const lower = normalizedTravelRequired.toLowerCase();
        if (lower === 'no' || lower === 'false') normalizedTravelRequired = false;
        else if (lower === 'occasionally' || lower === 'sometimes') normalizedTravelRequired = true;
        else if (lower === 'frequently' || lower === 'often' || lower === 'yes' || lower === 'true') normalizedTravelRequired = true;
      }
    } else {
      normalizedTravelRequired = existingTravelRequired;
    }

    // Build update data
    const updateData = {};
    if (body.title !== undefined) updateData.title = String(body.title).trim();
    if (body.description !== undefined) updateData.description = String(body.description).trim();
    if (body.location !== undefined) {
      const rawLocationValue = body.location === null ? '' : String(body.location);
      const normalizedLocationUpdate = rawLocationValue.trim();
      if (!normalizedLocationUpdate || normalizedLocationUpdate.toLowerCase() === 'undefined' || normalizedLocationUpdate.toLowerCase() === 'null') {
        updateData.location = null;
      } else {
        updateData.location = normalizedLocationUpdate;
      }
    }
    if (body.experience !== undefined) updateData.experience = body.experience || null;
    if (body.workExperienceMin !== undefined || body.experienceMin !== undefined) {
      updateData.experienceMin = body.workExperienceMin || body.experienceMin || null;
    }
    if (body.workExperienceMax !== undefined || body.experienceMax !== undefined) {
      updateData.experienceMax = body.workExperienceMax || body.experienceMax || null;
    }
    if (body.salary !== undefined) updateData.salary = body.salary || null;
    if (body.currentSalaryMin !== undefined || body.salaryMin !== undefined) {
      updateData.salaryMin = body.currentSalaryMin || body.salaryMin || null;
    }
    if (body.currentSalaryMax !== undefined || body.salaryMax !== undefined) {
      updateData.salaryMax = body.currentSalaryMax || body.salaryMax || null;
    }
    if (body.currency !== undefined) updateData.currency = body.currency || 'INR';
    // Don't update virtual fields directly - they're stored in metadata
    // if (normalizedJobType) updateData.jobType = normalizedJobType; // VIRTUAL - store in metadata
    if (body.skills !== undefined) updateData.skills = Array.isArray(body.skills) ? body.skills : [];
    if (body.keySkills !== undefined) updateData.keySkills = Array.isArray(body.keySkills) ? body.keySkills : [];
    // Don't update virtual fields directly - they're stored in metadata
    // if (body.education !== undefined) updateData.education = body.education || null; // VIRTUAL - store in metadata
    if (body.validTill !== undefined) updateData.validTill = body.validTill ? new Date(body.validTill) : null;
    // Don't update virtual fields directly - they're stored in metadata
    // if (body.noticePeriod !== undefined) updateData.noticePeriod = body.noticePeriod || null; // VIRTUAL - store in metadata
    if (normalizedRemoteWork) updateData.remoteWork = normalizedRemoteWork; // This is stored as location_type in DB
    // Don't update virtual fields directly - they're stored in metadata
    // if (normalizedTravelRequired !== undefined) updateData.travelRequired = normalizedTravelRequired; // VIRTUAL - store in metadata
    // if (normalizedShiftTiming) updateData.shiftTiming = normalizedShiftTiming; // VIRTUAL - store in metadata
    // if (body.candidateLocations !== undefined) updateData.candidateLocations = Array.isArray(body.candidateLocations) ? body.candidateLocations : []; // VIRTUAL - store in metadata
    // if (body.candidateDesignations !== undefined) updateData.candidateDesignations = Array.isArray(body.candidateDesignations) ? body.candidateDesignations : []; // VIRTUAL - store in metadata
    // if (body.includeWillingToRelocate !== undefined) updateData.includeWillingToRelocate = !!body.includeWillingToRelocate; // VIRTUAL - store in metadata
    // if (body.includeNotMentioned !== undefined) updateData.includeNotMentioned = !!body.includeNotMentioned; // VIRTUAL - store in metadata
    // if (body.benefits !== undefined) updateData.benefits = Array.isArray(body.benefits) ? body.benefits : []; // VIRTUAL - store in metadata

    // Update metadata with virtual fields that need to persist
    // IMPORTANT: Always update metadata with the latest values, even if body field is undefined
    // This ensures that when user explicitly clears a field, it gets cleared in metadata too
    const updatedMetadata = {
      ...existingMetadata,
      region: body.region !== undefined && body.region !== null
        ? String(body.region).trim() || 'india'
        : (existingMetadata.region || 'india'),
      // Store virtual fields in metadata so they persist
      jobType: normalizedJobType !== undefined && normalizedJobType !== null ? normalizedJobType : (existingMetadata.jobType || null),
      education: body.education !== undefined ? (body.education || null) : (existingMetadata.education || null),
      noticePeriod: body.noticePeriod !== undefined ? (body.noticePeriod || null) : (existingMetadata.noticePeriod || null),
      travelRequired: normalizedTravelRequired !== undefined ? normalizedTravelRequired : (existingMetadata.travelRequired !== undefined ? existingMetadata.travelRequired : null),
      shiftTiming: normalizedShiftTiming !== undefined && normalizedShiftTiming !== null ? normalizedShiftTiming : (existingMetadata.shiftTiming || null),
      benefits: body.benefits !== undefined ? (Array.isArray(body.benefits) ? body.benefits : []) : (Array.isArray(existingMetadata.benefits) ? existingMetadata.benefits : []),
      candidateLocations: body.candidateLocations !== undefined ? (Array.isArray(body.candidateLocations) ? body.candidateLocations : []) : (Array.isArray(existingMetadata.candidateLocations) ? existingMetadata.candidateLocations : []),
      excludeLocations: body.excludeLocations !== undefined ? (Array.isArray(body.excludeLocations) ? body.excludeLocations : (body.excludeLocations ? [body.excludeLocations] : [])) : (Array.isArray(existingMetadata.excludeLocations) ? existingMetadata.excludeLocations : (existingMetadata.excludeLocations ? [existingMetadata.excludeLocations] : [])), // Locations to exclude
      candidateDesignations: body.candidateDesignations !== undefined ? (Array.isArray(body.candidateDesignations) ? body.candidateDesignations : []) : (Array.isArray(existingMetadata.candidateDesignations) ? existingMetadata.candidateDesignations : []),
      includeWillingToRelocate: body.includeWillingToRelocate !== undefined ? !!body.includeWillingToRelocate : (existingMetadata.includeWillingToRelocate !== undefined ? existingMetadata.includeWillingToRelocate : false),
      includeNotMentioned: body.includeNotMentioned !== undefined ? !!body.includeNotMentioned : (existingMetadata.includeNotMentioned !== undefined ? existingMetadata.includeNotMentioned : false),
      industry: body.industry !== undefined ? (body.industry ? String(body.industry).trim() : null) : (existingMetadata.industry || null),
      department: body.department !== undefined ? (body.department ? String(body.department).trim() : null) : (existingMetadata.department || null),
      institute: body.institute !== undefined ? (body.institute ? String(body.institute).trim() : null) : (existingMetadata.institute || null),
      resumeFreshness: body.resumeFreshness !== undefined ? (body.resumeFreshness ? new Date(body.resumeFreshness).toISOString() : null) : (existingMetadata.resumeFreshness ? existingMetadata.resumeFreshness : null),
      currentCompany: body.currentCompany !== undefined ? (body.currentCompany ? String(body.currentCompany).trim() : null) : (existingMetadata.currentCompany || null),
      // CRITICAL: Store salary and experience fields in metadata for matching
      workExperienceMin: (body.workExperienceMin !== undefined || body.experienceMin !== undefined)
        ? (body.workExperienceMin || body.experienceMin || null)
        : (existingMetadata.workExperienceMin || existingMetadata.experienceMin || null),
      workExperienceMax: (body.workExperienceMax !== undefined || body.experienceMax !== undefined)
        ? (body.workExperienceMax || body.experienceMax || null)
        : (existingMetadata.workExperienceMax || existingMetadata.experienceMax || null),
      currentSalaryMin: (body.currentSalaryMin !== undefined || body.salaryMin !== undefined)
        ? (body.currentSalaryMin || body.salaryMin || null)
        : (existingMetadata.currentSalaryMin || existingMetadata.salaryMin || null),
      currentSalaryMax: (body.currentSalaryMax !== undefined || body.salaryMax !== undefined)
        ? (body.currentSalaryMax || body.salaryMax || null)
        : (existingMetadata.currentSalaryMax || existingMetadata.salaryMax || null),
      diversityPreference: body.diversityPreference !== undefined
        ? (Array.isArray(body.diversityPreference) ? body.diversityPreference : (body.diversityPreference ? [body.diversityPreference] : null))
        : (existingMetadata.diversityPreference || null),
      lastActive: body.lastActive !== undefined
        ? (body.lastActive || null)
        : (existingMetadata.lastActive !== undefined ? existingMetadata.lastActive : null),
      // CRITICAL: Store includeSkills and excludeSkills for matching
      // IMPORTANT: Merge keySkills (Additional Skills) into includeSkills automatically
      includeSkills: (() => {
        const includeSkillsFromBody = body.includeSkills !== undefined
          ? (Array.isArray(body.includeSkills) ? body.includeSkills : (body.includeSkills ? [body.includeSkills] : []))
          : (Array.isArray(existingMetadata.includeSkills) ? existingMetadata.includeSkills : []);
        const keySkillsArray = body.keySkills !== undefined
          ? (Array.isArray(body.keySkills) ? body.keySkills : [])
          : (Array.isArray(existingMetadata.keySkills) ? existingMetadata.keySkills : []);
        // Merge keySkills into includeSkills (all additional skills should be included)
        return [...new Set([...includeSkillsFromBody, ...keySkillsArray])].filter(Boolean);
      })(),
      excludeSkills: body.excludeSkills !== undefined
        ? (Array.isArray(body.excludeSkills) ? body.excludeSkills : (body.excludeSkills ? [body.excludeSkills] : []))
        : (Array.isArray(existingMetadata.excludeSkills) ? existingMetadata.excludeSkills : []),
      location: (() => {
        if (body.location !== undefined) {
          const rawLocationValue = body.location === null ? '' : String(body.location);
          const normalizedLocationValue = rawLocationValue.trim();
          if (!normalizedLocationValue || normalizedLocationValue.toLowerCase() === 'undefined' || normalizedLocationValue.toLowerCase() === 'null') {
            return null;
          }
          return normalizedLocationValue;
        }
        return existingMetadata.location || rawRequirement?.location || null;
      })(),
      experience: body.experience !== undefined ? (body.experience ? String(body.experience).trim() : null) : (existingMetadata.experience || rawRequirement?.experience || null),
      salary: body.salary !== undefined ? (body.salary ? String(body.salary).trim() : null) : (existingMetadata.salary || rawRequirement?.salary || null)
    };

    updateData.metadata = updatedMetadata;

    console.log('📝 Update data metadata:', JSON.stringify(updatedMetadata, null, 2));
    console.log('📝 Update data:', JSON.stringify(updateData, null, 2));

    // Update requirement
    await requirement.update(updateData);

    console.log('✅ Requirement updated with id:', requirement.id);
    console.log('✅ Requirement metadata after update:', JSON.stringify(requirement.metadata, null, 2));

    // Log activity
    try {
      const EmployerActivityService = require('../services/employerActivityService');
      await EmployerActivityService.logActivity(
        req.user.id,
        'requirement_updated',
        {
          details: {
            requirementId: requirement.id,
            title: requirement.title,
            location: requirement.location,
            jobType: requirement.jobType,
            companyId: requirement.companyId
          }
        }
      );
    } catch (activityError) {
      console.error('Failed to log requirement update activity:', activityError);
    }

    return res.status(200).json({
      success: true,
      message: 'Requirement updated successfully',
      data: requirement
    });
  } catch (error) {
    console.error('❌ Update requirement error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update requirement',
      details: error?.message || error?.stack
    });
  }
});

// Delete requirement
router.delete('/:id', authenticateToken, checkPermission('resumeDatabase'), async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Delete Requirement request by user:', req.user?.id, 'requirementId:', id);

    // Check if user is an employer or admin
    if (req.user.user_type !== 'employer' && req.user.user_type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only employers can delete requirements' });
    }

    // Find requirement
    const requirement = await Requirement.findOne({ where: { id } });

    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found' });
    }

    // If not admin, enforce ownership
    if (req.user.user_type !== 'admin' && String(requirement.companyId) !== String(req.user.companyId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This requirement belongs to another company.'
      });
    }

    // Store requirement details for logging
    const requirementDetails = {
      id: requirement.id,
      title: requirement.title,
      location: requirement.location,
      jobType: requirement.jobType,
      companyId: requirement.companyId
    };

    // Delete requirement
    await requirement.destroy();

    console.log('✅ Requirement deleted:', id);

    // Log activity
    try {
      const EmployerActivityService = require('../services/employerActivityService');
      await EmployerActivityService.logActivity(
        req.user.id,
        'requirement_deleted',
        {
          details: requirementDetails
        }
      );
    } catch (activityError) {
      console.error('Failed to log requirement deletion activity:', activityError);
    }

    return res.status(200).json({
      success: true,
      message: 'Requirement deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete requirement error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete requirement',
      details: error?.message || error?.stack
    });
  }
});

// Get requirement statistics
router.get('/:id/stats', authenticateToken, checkPermission('resumeDatabase'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is an employer or admin
    if (req.user.user_type !== 'employer' && req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only employers and admins can view requirement statistics.'
      });
    }

    // Check if requirement exists and belongs to employer's company
    const requirement = await Requirement.findOne({
      where: {
        id: id
      }
    });

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found'
      });
    }
    // If not admin, enforce ownership
    if (req.user.user_type !== 'admin' && String(requirement.companyId) !== String(req.user.companyId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Use the SAME candidate matching logic as the /requirements/:id/candidates endpoint
    // This ensures consistency between the stats count and the actual candidates shown
    const { User } = require('../config/index');
    const { sequelize } = require('../config/sequelize');

    // ========== EXTRACT ALL FIELDS FROM METADATA (SAME AS CANDIDATES ENDPOINT) ==========
    // Many fields are stored in metadata JSONB, extract them first
    const metadata = typeof requirement.metadata === 'string'
      ? JSON.parse(requirement.metadata)
      : (requirement.metadata || {});

    // Extract all metadata fields that might be used for matching
    // CRITICAL: These are VIRTUAL fields, so they MUST come from metadata
    const currentCompany = metadata.currentCompany || requirement.currentCompany || null;
    const institute = metadata.institute || requirement.institute || null;
    const resumeFreshness = metadata.resumeFreshness ? new Date(metadata.resumeFreshness) : (requirement.resumeFreshness ? new Date(requirement.resumeFreshness) : null);
    const diversityPreference = metadata.diversityPreference || requirement.diversityPreference || null;
    const lastActive = metadata.lastActive !== undefined && metadata.lastActive !== null
      ? metadata.lastActive
      : (requirement.lastActive !== undefined && requirement.lastActive !== null ? requirement.lastActive : null);
    const includeWillingToRelocate = metadata.includeWillingToRelocate !== undefined
      ? metadata.includeWillingToRelocate
      : (requirement.includeWillingToRelocate !== undefined ? requirement.includeWillingToRelocate : false);
    const includeNotMentioned = metadata.includeNotMentioned !== undefined
      ? metadata.includeNotMentioned
      : (requirement.includeNotMentioned !== undefined ? requirement.includeNotMentioned : false);

    // Extract experience from metadata - CRITICAL: Check multiple formats
    // Format 1: workExperienceMin/workExperienceMax (numeric)
    // Format 2: experienceMin/experienceMax (numeric)
    // Format 3: experience (string like "1", "3-5", "3 years", etc.)
    let workExperienceMin = metadata.workExperienceMin || metadata.experienceMin || requirement.workExperienceMin || requirement.experienceMin || null;
    let workExperienceMax = metadata.workExperienceMax || metadata.experienceMax || requirement.workExperienceMax || requirement.experienceMax || null;

    // If not found, try parsing from experience string (CRITICAL: This is how old requirements store it)
    if ((workExperienceMin === null || workExperienceMin === undefined) && metadata.experience) {
      const expStr = String(metadata.experience).trim();
      // Parse formats like "1", "3-5", "3 years", etc.
      const expMatch = expStr.match(/(\d+)(?:\s*-\s*(\d+))?/);
      if (expMatch) {
        workExperienceMin = parseInt(expMatch[1]);
        if (expMatch[2]) {
          workExperienceMax = parseInt(expMatch[2]);
        }
      }
    }

    // Extract salary from metadata - CRITICAL: Check multiple formats
    // Format 1: currentSalaryMin/currentSalaryMax (numeric)
    // Format 2: salaryMin/salaryMax (numeric)
    // Format 3: salary (string like "10-12", "10 LPA", etc.)
    let currentSalaryMin = metadata.currentSalaryMin || metadata.salaryMin || requirement.currentSalaryMin || requirement.salaryMin || null;
    let currentSalaryMax = metadata.currentSalaryMax || metadata.salaryMax || requirement.currentSalaryMax || requirement.salaryMax || null;

    // If not found, try parsing from salary string (CRITICAL: This is how old requirements store it)
    if ((currentSalaryMin === null || currentSalaryMin === undefined) && metadata.salary) {
      const salStr = String(metadata.salary).trim();
      // Parse formats like "10-12", "10-12 LPA", "10 LPA", etc.
      const salMatch = salStr.match(/(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?/);
      if (salMatch) {
        currentSalaryMin = parseFloat(salMatch[1]);
        if (salMatch[2]) {
          currentSalaryMax = parseFloat(salMatch[2]);
        }
      }
    }

    // Extract candidate locations and designations from metadata if not set
    // CRITICAL: These are VIRTUAL fields, prioritize metadata
    const candidateLocations = (metadata.candidateLocations && metadata.candidateLocations.length > 0)
      ? metadata.candidateLocations
      : ((requirement.candidateLocations && requirement.candidateLocations.length > 0) ? requirement.candidateLocations : []);
    const candidateDesignations = (metadata.candidateDesignations && metadata.candidateDesignations.length > 0)
      ? metadata.candidateDesignations
      : ((requirement.candidateDesignations && requirement.candidateDesignations.length > 0) ? requirement.candidateDesignations : []);

    // Extract education and notice period from metadata if not set
    // CRITICAL: These are VIRTUAL fields, prioritize metadata
    const education = metadata.education || requirement.education || null;
    const noticePeriod = metadata.noticePeriod || requirement.noticePeriod || null;
    const remoteWork = metadata.remoteWork || requirement.remoteWork || null;

    // For backward compatibility, also set experienceMin/Max (used in some legacy code)
    const experienceMin = workExperienceMin;
    const experienceMax = workExperienceMax;

    // Build the SAME matching logic as used in the candidates endpoint
    const whereClause = {
      user_type: 'jobseeker',
      is_active: true,
      account_status: 'active'
    };

    const matchingConditions = [];
    const allAndConditions = []; // For combining all top-level AND conditions (same as candidates endpoint)
    const appliedFilters = [];

    // 1. EXPERIENCE RANGE MATCHING (add to allAndConditions, same as candidates endpoint)
    if (workExperienceMin !== null && workExperienceMin !== undefined) {
      const minExp = Number(workExperienceMin);
      const maxExp = workExperienceMax !== null && workExperienceMax !== undefined
        ? Number(workExperienceMax) : 50;

      allAndConditions.push({
        experience_years: {
          [Op.and]: [
            { [Op.gte]: minExp },
            { [Op.lte]: maxExp }
          ]
        }
      });
    }

    // 2. SALARY RANGE MATCHING (add to allAndConditions, same as candidates endpoint)
    // CRITICAL: Allow NULL salaries - candidates may not have salary info
    // If salary is specified, match candidates with salary in range OR NULL salary
    if (currentSalaryMin !== null && currentSalaryMin !== undefined) {
      const minSalary = Number(currentSalaryMin);
      const maxSalary = currentSalaryMax !== null && currentSalaryMax !== undefined
        ? Number(currentSalaryMax) : 200; // Max 200 LPA

      // Build salary match based on range
      const salaryRangeMatch = {
        current_salary: {
          [Op.and]: [
            { [Op.gte]: minSalary },
            { [Op.lte]: maxSalary }
          ]
        }
      };

      if (includeNotMentioned) {
        allAndConditions.push({
          [Op.or]: [
            salaryRangeMatch,
            { current_salary: null },
            { current_salary: { [Op.is]: null } }
          ]
        });
      } else {
        allAndConditions.push(salaryRangeMatch);
      }
    } else if (includeNotMentioned) {
      // If includeNotMentioned is true, also include candidates with no salary specified
      // This is handled by not adding salary filter, so all candidates pass
    }

    // 3. LOCATION MATCHING (candidateLocations + excludeLocations + willing to relocate)
    // Extract exclude locations for stats endpoint
    const statsExcludeLocations = Array.isArray(metadata.excludeLocations) ? metadata.excludeLocations : (metadata.excludeLocations ? [metadata.excludeLocations] : (metadata.exclude_locations ? (Array.isArray(metadata.exclude_locations) ? metadata.exclude_locations : [metadata.exclude_locations]) : []));

    // CRITICAL: If no candidateLocations specified, allow ANY location (don't filter)
    // Only filter by location if candidateLocations array has values
    // IMPORTANT: Exclude locations are applied AFTER include locations (they filter out candidates)

    // 3.1. LOCATION INCLUDE (candidateLocations)
    if (candidateLocations && candidateLocations.length > 0) {
      const locationConditions = candidateLocations.flatMap(location => ([
        // Match current location
        { current_location: { [Op.iLike]: `%${location}%` } },
        // Match preferred locations (JSONB array)
        sequelize.where(
          sequelize.cast(sequelize.col('preferred_locations'), 'text'),
          { [Op.iLike]: `%${location}%` }
        )
      ]));

      // Include candidates willing to relocate if requirement allows
      if (includeWillingToRelocate) {
        locationConditions.push({ willing_to_relocate: true });
      }

      matchingConditions.push({ [Op.or]: locationConditions });
      appliedFilters.push(`Location (Include): ${candidateLocations.join(', ')}${includeWillingToRelocate ? ' (including willing to relocate)' : ''}`);
    } else {
      // No location filter specified - allow any location candidate
    }

    // 3.2. LOCATION EXCLUDE (excludeLocations)
    // CRITICAL: Exclude candidates from these locations (applied as NOT conditions)
    if (statsExcludeLocations && statsExcludeLocations.length > 0) {
      const excludeLocationConditions = statsExcludeLocations.flatMap(location => ([
        // Exclude if current location matches
        { current_location: { [Op.notILike]: `%${location}%` } },
        // Exclude if preferred locations match
        sequelize.where(
          sequelize.cast(sequelize.col('preferred_locations'), 'text'),
          { [Op.notILike]: `%${location}%` }
        )
      ]));

      // For exclude, we need ALL conditions to be true (candidate must NOT be in ANY excluded location)
      // So we add them as AND conditions
      allAndConditions.push({
        [Op.and]: excludeLocationConditions
      });
      appliedFilters.push(`Location (Exclude): ${statsExcludeLocations.join(', ')}`);
      console.log(`✅ Added location exclude filter in stats: ${statsExcludeLocations.join(', ')}`);
    }

    // 4. SKILLS & KEY SKILLS MATCHING (comprehensive)
    const statsIncludeSkills = metadata.includeSkills || requirement.includeSkills || [];
    // Merge includeSkills with keySkills (in case keySkills weren't merged yet in old requirements)
    const allStatsIncludeSkills = [...new Set([
      ...(Array.isArray(statsIncludeSkills) ? statsIncludeSkills : []),
      ...(requirement.keySkills || [])
    ])].filter(Boolean);

    const statsRequiredSkills = [
      ...(requirement.skills || []),
      ...allStatsIncludeSkills
    ].filter(Boolean);

    // CRITICAL: Exclude skills (same as candidates endpoint)
    const statsExcludeSkills = metadata.excludeSkills || requirement.excludeSkills || [];

    // Check if requirement title strongly matches candidate title/headline
    const reqTitle = (requirement.title || '').trim();
    const hasStrongTitleMatch = reqTitle.length > 2;
    let titleMatchConditions = [];

    if (hasStrongTitleMatch) {
      const titleWords = reqTitle
        .split(/\s+/)
        .filter(word => word.length > 2)
        .map(word => word.toLowerCase());

      if (titleWords.length > 0) {
        titleMatchConditions = titleWords.flatMap(word => [
          { headline: { [Op.iLike]: `%${word}%` } },
          { designation: { [Op.iLike]: `%${word}%` } },
          { current_role: { [Op.iLike]: `%${word}%` } }
        ]);
      }
    }

    // TRACK IF ANY CRITERIA ARE APPLIED
    let hasAnyFilterAppliedForStats = false;

    if (statsRequiredSkills.length > 0) {
      hasAnyFilterAppliedForStats = true;
      const skillConditions = statsRequiredSkills.flatMap(skill => ([
        { skills: { [Op.contains]: [skill] } },
        sequelize.where(sequelize.cast(sequelize.col('skills'), 'text'), { [Op.iLike]: `%${skill}%` }),
        { key_skills: { [Op.contains]: [skill] } },
        sequelize.where(sequelize.cast(sequelize.col('key_skills'), 'text'), { [Op.iLike]: `%${skill}%` }),
        { headline: { [Op.iLike]: `%${skill}%` } },
        { summary: { [Op.iLike]: `%${skill}%` } }
      ]));

      if (titleMatchConditions.length > 0) {
        matchingConditions.push({
          [Op.or]: [
            { [Op.or]: skillConditions },
            { [Op.or]: titleMatchConditions }
          ]
        });
      } else {
        matchingConditions.push({ [Op.or]: skillConditions });
      }
    } else if (titleMatchConditions.length > 0) {
      hasAnyFilterAppliedForStats = true;
      matchingConditions.push({ [Op.or]: titleMatchConditions });
    }

    // Add other criteria to hasAnyFilterApplied check
    if (workExperienceMin !== null || currentSalaryMin !== null || candidateLocations.length > 0 || (Array.isArray(statsExcludeSkills) && statsExcludeSkills.length > 0) || currentDesignationForStats || (candidateDesignations && candidateDesignations.length > 0) || education || institute || currentCompany || noticePeriod || resumeFreshness || diversityPreference || lastActive) {
      hasAnyFilterAppliedForStats = true;
    }

    // CRITICAL: Exclude skills - candidates MUST NOT have these skills (add to allAndConditions)
    // Fixed: Use raw SQL to avoid Sequelize operator nesting issues
    if (Array.isArray(statsExcludeSkills) && statsExcludeSkills.length > 0 && statsExcludeSkills.filter(s => s).length > 0) {
      const excludeConditions = statsExcludeSkills.filter(s => s).map((excludeSkill, index) => {
        return sequelize.where(
          sequelize.literal(`
            (
              (skills IS NULL OR NOT CAST(skills AS TEXT) ILIKE '%${excludeSkill}%') AND
              (key_skills IS NULL OR NOT CAST(key_skills AS TEXT) ILIKE '%${excludeSkill}%') AND
              (headline IS NULL OR headline NOT ILIKE '%${excludeSkill}%') AND
              (summary IS NULL OR summary NOT ILIKE '%${excludeSkill}%')
            )
          `),
          {}
        );
      });

      if (excludeConditions.length > 0) {
        allAndConditions.push({ [Op.and]: excludeConditions });
      }
      console.log(`✅ Added exclude skills filter in stats: ${statsExcludeSkills.filter(s => s).join(', ')}`);
    }

    // 4.6. CURRENT DESIGNATION MATCHING (from metadata) - same as candidates endpoint
    const currentDesignationForStats = metadata.currentDesignation || requirement.currentDesignation || null;
    if (currentDesignationForStats) {
      matchingConditions.push({
        [Op.or]: [
          { designation: { [Op.iLike]: `%${currentDesignationForStats}%` } },
          { headline: { [Op.iLike]: `%${currentDesignationForStats}%` } },
          { current_role: { [Op.iLike]: `%${currentDesignationForStats}%` } }
        ]
      });
      console.log(`✅ Added current designation filter in stats: ${currentDesignationForStats}`);
    }

    // 5. REQUIREMENT TITLE MATCHING (OPTIONAL - only if no skills specified)
    // CRITICAL: Title is optional when skills are specified (skills are more important)
    // Title matching is handled in post-query filtering with lenient logic
    // DO NOT add title to query-level matchingConditions when skills are present
    // This matches the candidates endpoint logic
    // Title filtering happens later in post-query filtering and is lenient (skills override title)

    // 6. DESIGNATION MATCHING (candidateDesignations)
    if (candidateDesignations && candidateDesignations.length > 0) {
      const designationConditions = candidateDesignations.flatMap(des => [
        { designation: { [Op.iLike]: `%${des}%` } },
        { headline: { [Op.iLike]: `%${des}%` } },
        { current_role: { [Op.iLike]: `%${des}%` } }
      ]);

      matchingConditions.push({ [Op.or]: designationConditions });
    }

    // 6. EDUCATION MATCHING (OPTIONAL - only if no skills specified)
    // CRITICAL: Education is a nice-to-have, not a must-have
    // If skills are specified, education is optional (skills are more important)
    // Only filter by education if NO skills are specified
    const hasSkillsForEducationCheck = statsRequiredSkills && statsRequiredSkills.length > 0;

    if ((education || institute) && !hasSkillsForEducationCheck) {
      // No skills specified - education is required filter
      if (education) {
        matchingConditions.push({
          [Op.or]: [
            sequelize.where(sequelize.cast(sequelize.col('education'), 'text'), { [Op.iLike]: `%${education}%` }),
            { highest_education: { [Op.iLike]: `%${education}%` } },
            { field_of_study: { [Op.iLike]: `%${education}%` } },
            { headline: { [Op.iLike]: `%${education}%` } },
            { summary: { [Op.iLike]: `%${education}%` } }
          ]
        });
        console.log(`✅ Added education filter in stats: ${education} (no skills specified, so education is required)`);
      }

      // 8. INSTITUTE MATCHING (only if no skills)
      if (institute) {
        matchingConditions.push({
          [Op.or]: [
            sequelize.where(sequelize.cast(sequelize.col('education'), 'text'), { [Op.iLike]: `%${institute}%` }),
            { headline: { [Op.iLike]: `%${institute}%` } },
            { summary: { [Op.iLike]: `%${institute}%` } }
          ]
        });
        console.log(`✅ Added institute filter in stats: ${institute} (no skills specified, so institute is required)`);
      }
    } else if (education || institute) {
      // Skills are specified - education is optional for scoring only
      console.log(`ℹ️ Education specified (${education || ''}) but skills also present (${statsRequiredSkills?.length || 0}), so Education is OPTIONAL for scoring only - NOT adding to query`);
    }

    // 9. CURRENT COMPANY MATCHING
    if (currentCompany) {
      matchingConditions.push({
        [Op.or]: [
          { current_company: { [Op.iLike]: `%${currentCompany}%` } },
          { headline: { [Op.iLike]: `%${currentCompany}%` } },
          { summary: { [Op.iLike]: `%${currentCompany}%` } }
        ]
      });
    }

    // 10. NOTICE PERIOD MATCHING - CRITICAL: <= logic (add to allAndConditions)
    if (noticePeriod && noticePeriod !== 'Any' && noticePeriod !== 'any') {
      const noticePeriodMap = {
        'Immediately': 0,
        'Immediate': 0,
        '15 days': 15,
        '30 days': 30,
        '60 days': 60,
        '90 days': 90
      };

      const maxNoticeDays = noticePeriodMap[noticePeriod];
      if (maxNoticeDays !== undefined) {
        allAndConditions.push({
          notice_period: { [Op.lte]: maxNoticeDays }
        });
        console.log(`✅ Added notice period filter in stats: <= ${maxNoticeDays} days`);
      }
    }

    // 11. RESUME FRESHNESS (if specified) - add to allAndConditions
    if (resumeFreshness) {
      allAndConditions.push({
        last_profile_update: { [Op.gte]: resumeFreshness }
      });
    }

    // 12. DIVERSITY PREFERENCE (Gender) - CRITICAL (add to allAndConditions)
    if (diversityPreference && Array.isArray(diversityPreference) && diversityPreference.length > 0) {
      const validPreferences = diversityPreference.filter(p => p && p !== 'all' && ['male', 'female', 'other'].includes(p));
      if (validPreferences.length > 0 && !diversityPreference.includes('all')) {
        allAndConditions.push({
          gender: { [Op.in]: validPreferences }
        });
        console.log(`✅ Added gender filter in stats: ${validPreferences.join(', ')}`);
      }
    }

    // 13. LAST ACTIVE (if specified) - add to allAndConditions
    if (lastActive !== null && lastActive !== undefined) {
      const daysAgo = Number(lastActive);
      if (!isNaN(daysAgo) && daysAgo > 0) {
        const activeDate = new Date();
        activeDate.setDate(activeDate.getDate() - daysAgo);
        allAndConditions.push({
          last_login_at: { [Op.gte]: activeDate }
        });
      }
    }

    // CRITICAL FIX: Combine matching conditions with AND logic (same as candidates endpoint)
    // Add matching conditions (skills, locations, designations) to allAndConditions
    if (matchingConditions.length > 0) {
      allAndConditions.push({ [Op.and]: matchingConditions });
    }

    // Apply all AND conditions to whereClause
    if (allAndConditions.length > 0) {
      whereClause[Op.and] = allAndConditions;
    } else if (!hasAnyFilterAppliedForStats) {
      // CRITICAL: If no filters are applied, return 0 instead of matching everyone
      console.log(`⚠️ No requirement filters applied for Req ${requirement.id}. Returning 0 matches to avoid global count.`);
      return res.status(200).json({
        success: true,
        data: {
          totalCandidates: 0,
          accessedCandidates: 0,
          cvAccessLeft: 100,
          fallbackApplied: false,
          requirement: {
            id: requirement.id,
            title: requirement.title,
            status: requirement.status
          }
        }
      });
    }

    console.log(`🔍 Req ${requirement.id} Stats Where:`, JSON.stringify(whereClause));
    const matchingCandidates = await User.findAll({
      where: whereClause,
      attributes: ['id'],
      limit: 10000 // Reasonable limit to get all matching candidates
    });

    const matchingCandidateIds = matchingCandidates.map(c => c.id);

    // CRITICAL: Apply STRICT title filtering (same logic as candidates endpoint)
    // Check if we have strict criteria (same as candidates endpoint)
    const hasStrictCriteriaForStats = (
      (statsRequiredSkills.length > 0) ||
      (Array.isArray(statsExcludeSkills) && statsExcludeSkills.length > 0 && statsExcludeSkills.filter(s => s).length > 0) ||
      (candidateLocations.length > 0) ||
      (candidateDesignations.length > 0) ||
      (currentDesignationForStats !== null) ||
      (workExperienceMin !== null) ||
      (currentSalaryMin !== null) ||
      (education !== null) ||
      (currentCompany !== null) ||
      (institute !== null) ||
      (noticePeriod !== null && noticePeriod !== 'Any' && noticePeriod !== 'any') ||
      (diversityPreference && Array.isArray(diversityPreference) && diversityPreference.length > 0 && !diversityPreference.includes('all'))
    );

    let finalCandidateIds = matchingCandidateIds;

    // Apply lenient title filtering - skills override title
    const hasStatsSkills = statsRequiredSkills.length > 0;
    const hasMultipleStatsCriteria = (
      (statsRequiredSkills.length > 0 ? 1 : 0) +
      (candidateLocations.length > 0 ? 1 : 0) +
      (candidateDesignations.length > 0 ? 1 : 0) +
      (workExperienceMin !== null ? 1 : 0) +
      (currentSalaryMin !== null ? 1 : 0)
    ) > 1;

    // Only filter by title if we have multiple criteria AND no skills (skills override title)
    if (hasStrictCriteriaForStats && requirement.title && requirement.title.trim().length > 3 && matchingCandidateIds.length > 0 && hasMultipleStatsCriteria && !hasStatsSkills) {
      const titleWords = requirement.title
        .split(/\s+/)
        .filter(word => word.length > 2) // More lenient
        .map(word => word.toLowerCase());

      if (titleWords.length > 0) {
        const titleMatchedCandidates = await User.findAll({
          where: {
            id: { [Op.in]: matchingCandidateIds },
            [Op.or]: [
              ...titleWords.map(keyword => ({ headline: { [Op.iLike]: `%${keyword}%` } })),
              ...titleWords.map(keyword => ({ designation: { [Op.iLike]: `%${keyword}%` } })),
              ...titleWords.map(keyword => ({ current_role: { [Op.iLike]: `%${keyword}%` } }))
            ]
          },
          attributes: ['id']
        });

        if (titleMatchedCandidates.length > 0) {
          finalCandidateIds = titleMatchedCandidates.map(c => c.id);
          console.log(`📊 TITLE FILTER (lenient): ${finalCandidateIds.length} candidates with title match`);
        } else {
          // No title matches, but keep candidates matching other criteria
          console.log(`⚠️ TITLE FILTER: No title matches, keeping ${matchingCandidateIds.length} candidates matching other criteria`);
          finalCandidateIds = matchingCandidateIds;
        }
      } else {
        finalCandidateIds = matchingCandidateIds;
      }
    } else if (hasStatsSkills) {
      // If skills are specified, title is optional
      console.log(`✅ Skills specified in stats - title matching is optional. Keeping ${matchingCandidateIds.length} candidates.`);
      finalCandidateIds = matchingCandidateIds;
    } else {
      // No title filtering
      finalCandidateIds = matchingCandidateIds;
    }

    // Post-query final validations (mirror /candidates endpoint):
    // 1) Exclude any candidates that have excluded skills (final safety check)
    // 2) Apply currentDesignation matching using work_experiences (lenient, prefers current role)
    // This ensures stats total matches the /requirements/:id/candidates endpoint exactly
    // Note: `statsExcludeSkills` is declared earlier in this handler; reuse the existing variable for final validation.

    if (Array.isArray(statsExcludeSkills) && statsExcludeSkills.length > 0 && finalCandidateIds.length > 0) {
      try {
        const candidateRows = await User.findAll({
          where: { id: { [Op.in]: finalCandidateIds } },
          attributes: ['id', 'skills', 'key_skills', 'headline', 'summary'],
          raw: true
        });

        const excludeSet = new Set();
        candidateRows.forEach((c) => {
          const combined = `${c.skills ? JSON.stringify(c.skills) : ''} ${c.key_skills ? JSON.stringify(c.key_skills) : ''} ${c.headline || ''} ${c.summary || ''}`.toLowerCase();
          for (const skill of statsExcludeSkills.filter(s => s)) {
            if (skill && combined.includes(skill.toLowerCase())) {
              excludeSet.add(String(c.id));
              break;
            }
          }
        });

        if (excludeSet.size > 0) {
          finalCandidateIds = finalCandidateIds.filter(id => !excludeSet.has(String(id)));
          console.log(`⚠️ Removed ${excludeSet.size} candidates due to excluded skills in stats`);
        }
      } catch (esError) {
        console.warn('⚠️ Could not apply excludeSkills filter in stats endpoint:', esError.message || esError);
      }
    }

    // Apply currentDesignation filter (lenient) using work_experiences when specified
    // Reuse existing `currentDesignationForStats` declared earlier in the handler
    if (currentDesignationForStats && finalCandidateIds.length > 0) {
      try {
        const workExpRows = await sequelize.query(`
          SELECT user_id, title, is_current
          FROM work_experiences
          WHERE user_id IN (:ids)
          ORDER BY user_id, is_current DESC, start_date DESC
        `, { replacements: { ids: finalCandidateIds }, type: QueryTypes.SELECT });

        const workMap = new Map();
        workExpRows.forEach(w => {
          const uid = String(w.user_id);
          if (!workMap.has(uid)) workMap.set(uid, []);
          workMap.get(uid).push(w);
        });

        const designationLower = currentDesignationForStats.toLowerCase().trim();
        const keepSet = new Set();

        finalCandidateIds.forEach(id => {
          const uid = String(id);
          const userWork = workMap.get(uid) || [];

          // Check current experience first
          const currentExp = userWork.find(exp => exp.is_current === true || String(exp.is_current).toLowerCase() === 'true');
          if (currentExp && currentExp.title && currentExp.title.toLowerCase().includes(designationLower)) {
            keepSet.add(uid);
            return;
          }

          // Fallback: check any work experience title
          const anyMatch = userWork.some(exp => exp.title && exp.title.toLowerCase().includes(designationLower));
          if (anyMatch) {
            keepSet.add(uid);
            return;
          }

          // Also allow if user table fields already matched (we didn't fetch them here), so be lenient and keep by default
          // We'll only remove users if we found work experiences and none of them matched
          if (userWork.length === 0) {
            keepSet.add(uid);
          }
        });

        // Filter finalCandidateIds to only those kept
        const beforeCount = finalCandidateIds.length;
        finalCandidateIds = finalCandidateIds.filter(id => keepSet.has(String(id)));
        const removed = beforeCount - finalCandidateIds.length;
        if (removed > 0) {
          console.log(`🎯 Current designation filter removed ${removed} candidates from stats set`);
        }
      } catch (weErr) {
        console.warn('⚠️ Could not apply currentDesignation work_experience filter in stats endpoint:', weErr.message || weErr);
      }
    }

    // Apply relaxed fallback if no strict matches (same logic as candidates endpoint)
    let relaxedCandidateIds = [];
    let fallbackApplied = false;

    if (finalCandidateIds.length === 0 && hasStrictCriteriaForStats) {
      try {
        // Build relaxed matching: keep skills, locations, designations but remove experience and salary constraints
        const baseWhere = {
          user_type: 'jobseeker',
          is_active: true,
          account_status: 'active'
        };

        const relaxedAnds = [];

        // Skills (statsRequiredSkills)
        const relaxedSkillConds = [];
        (statsRequiredSkills || []).forEach(s => {
          if (!s) return;
          relaxedSkillConds.push({
            [Op.or]: [
              sequelize.where(sequelize.cast(sequelize.col('key_skills'), 'text'), { [Op.iLike]: `%${s}%` }),
              sequelize.where(sequelize.cast(sequelize.col('skills'), 'text'), { [Op.iLike]: `%${s}%` }),
              { summary: { [Op.iLike]: `%${s}%` } }
            ]
          });
        });
        if (relaxedSkillConds.length > 0) relaxedAnds.push({ [Op.or]: relaxedSkillConds });

        // Locations (candidateLocations)
        const relaxedLocationConds = [];
        (candidateLocations || []).forEach(loc => {
          if (!loc) return;
          relaxedLocationConds.push({ current_location: { [Op.iLike]: `%${loc}%` } });
          relaxedLocationConds.push(sequelize.where(sequelize.cast(sequelize.col('preferred_locations'), 'text'), { [Op.iLike]: `%${loc}%` }));
        });
        if (relaxedLocationConds.length > 0) relaxedAnds.push({ [Op.or]: relaxedLocationConds });

        // Designations (candidateDesignations)
        const relaxedDesignationConds = [];
        (candidateDesignations || []).forEach(d => {
          if (!d) return;
          relaxedDesignationConds.push({ designation: { [Op.iLike]: `%${d}%` } });
        });
        if (relaxedDesignationConds.length > 0) relaxedAnds.push({ [Op.or]: relaxedDesignationConds });

        // Build final relaxed where
        const relaxedWhere = { ...baseWhere };
        if (relaxedAnds.length > 0) {
          relaxedWhere[Op.and] = relaxedAnds;

          // Only execute fallback query if we actually have some relaxed criteria 
          // (otherwise we'd match ALL candidates, which is not useful)
          const relaxedMatches = await User.findAll({ where: relaxedWhere, attributes: ['id'], limit: 10000 });
          if (Array.isArray(relaxedMatches) && relaxedMatches.length > 0) {
            relaxedCandidateIds = relaxedMatches.map(m => m.id);
            fallbackApplied = true;
          }
        }
      } catch (fallbackErr) {
        // Silently handle fallback errors
      }
    }

    // Use relaxed candidates if fallback was applied, otherwise use strict matches
    let finalCandidateIdsForCount = fallbackApplied ? relaxedCandidateIds : finalCandidateIds;

    // ===== Apply the SAME post-filters as /requirements/:id/candidates (to keep totals consistent) =====
    // 1) Lenient title filter (only when strict criteria applies and NO skills are specified)
    try {
      const statsIncludeSkillsForTitle = metadata.includeSkills || requirement.includeSkills || [];
      const statsKeySkillsForTitle = requirement.keySkills || [];
      const allStatsIncludeSkillsForTitle = [...new Set([
        ...(Array.isArray(statsIncludeSkillsForTitle) ? statsIncludeSkillsForTitle : []),
        ...(Array.isArray(statsKeySkillsForTitle) ? statsKeySkillsForTitle : [])
      ])].filter(Boolean);

      const statsRequiredSkillsForTitle = [
        ...(Array.isArray(requirement.skills) ? requirement.skills : []),
        ...allStatsIncludeSkillsForTitle
      ].filter(Boolean);

      const hasStatsSkillsForTitleCheck = statsRequiredSkillsForTitle.length > 0;
      const hasMultipleStatsCriteriaForTitle = (
        (statsRequiredSkillsForTitle.length > 0 ? 1 : 0) +
        (candidateLocations.length > 0 ? 1 : 0) +
        (candidateDesignations.length > 0 ? 1 : 0) +
        (workExperienceMin !== null ? 1 : 0) +
        (currentSalaryMin !== null ? 1 : 0)
      ) > 1;

      if (
        hasStrictCriteriaForStats &&
        !hasStatsSkillsForTitleCheck &&
        hasMultipleStatsCriteriaForTitle &&
        requirement.title &&
        requirement.title.trim().length > 3 &&
        Array.isArray(finalCandidateIdsForCount) &&
        finalCandidateIdsForCount.length > 0
      ) {
        const titleWords = requirement.title
          .split(/\s+/)
          .filter(w => w.length > 2)
          .map(w => w.toLowerCase());

        if (titleWords.length > 0) {
          const titleMatchedCandidates = await User.findAll({
            where: {
              id: { [Op.in]: finalCandidateIdsForCount },
              [Op.or]: [
                ...titleWords.map(keyword => ({ headline: { [Op.iLike]: `%${keyword}%` } })),
                ...titleWords.map(keyword => ({ designation: { [Op.iLike]: `%${keyword}%` } })),
                ...titleWords.map(keyword => ({ current_role: { [Op.iLike]: `%${keyword}%` } }))
              ]
            },
            attributes: ['id'],
            raw: true
          });

          if (Array.isArray(titleMatchedCandidates) && titleMatchedCandidates.length > 0) {
            finalCandidateIdsForCount = titleMatchedCandidates.map(c => c.id);
          }
        }
      }
    } catch (_) {
      // Keep original candidate ids if title filtering fails
    }

    // 2) Exclude skills final safety filter (apply to the FINAL candidate set)
    const statsExcludeSkillsForValidation = metadata.excludeSkills || requirement.excludeSkills || [];
    if (
      Array.isArray(statsExcludeSkillsForValidation) &&
      statsExcludeSkillsForValidation.length > 0 &&
      statsExcludeSkillsForValidation.filter(s => s).length > 0 &&
      Array.isArray(finalCandidateIdsForCount) &&
      finalCandidateIdsForCount.length > 0
    ) {
      try {
        const candidateRows = await User.findAll({
          where: { id: { [Op.in]: finalCandidateIdsForCount } },
          attributes: ['id', 'skills', 'key_skills', 'headline', 'summary'],
          raw: true
        });

        const excludeSet = new Set();
        candidateRows.forEach((c) => {
          const combined = `${c.skills ? JSON.stringify(c.skills) : ''} ${c.key_skills ? JSON.stringify(c.key_skills) : ''} ${c.headline || ''} ${c.summary || ''}`.toLowerCase();
          for (const skill of statsExcludeSkillsForValidation.filter(s => s)) {
            if (skill && combined.includes(String(skill).toLowerCase())) {
              excludeSet.add(String(c.id));
              break;
            }
          }
        });

        if (excludeSet.size > 0) {
          finalCandidateIdsForCount = finalCandidateIdsForCount.filter(idVal => !excludeSet.has(String(idVal)));
        }
      } catch (_) {
        // Keep original candidate ids if excludeSkills filter fails
      }
    }

    // 3) Current designation filter using work_experiences (apply to FINAL candidate set)
    const currentDesignationForStatsFinal = metadata.currentDesignation || requirement.currentDesignation || null;
    if (currentDesignationForStatsFinal && Array.isArray(finalCandidateIdsForCount) && finalCandidateIdsForCount.length > 0) {
      try {
        const workExpRows = await sequelize.query(`
          SELECT user_id, title, is_current
          FROM work_experiences
          WHERE user_id = ANY(:userIds)
        `, {
          replacements: { userIds: finalCandidateIdsForCount },
          type: QueryTypes.SELECT
        });

        const designationLower = String(currentDesignationForStatsFinal).toLowerCase().trim();
        const matchSet = new Set();

        // Prefer current roles, but allow any title if none marked current
        (workExpRows || []).forEach((row) => {
          const title = String(row.title || '').toLowerCase();
          if (title && designationLower && title.includes(designationLower)) {
            matchSet.add(String(row.user_id));
          }
        });

        if (matchSet.size > 0) {
          finalCandidateIdsForCount = finalCandidateIdsForCount.filter(idVal => matchSet.has(String(idVal)));
        }
      } catch (_) {
        // Keep original ids if work experience filter fails
      }
    }

    // Final total after post-query validations (including relaxed fallback)
    const totalCandidates = Array.isArray(finalCandidateIdsForCount) ? finalCandidateIdsForCount.length : 0;

    // Get accessed candidates count - should match /requirements/:id/candidates (distinct views on final set)
    const { ViewTracking } = require('../config/index');
    let accessedCandidates = 0;
    if (Array.isArray(finalCandidateIdsForCount) && finalCandidateIdsForCount.length > 0) {
      try {
        accessedCandidates = await ViewTracking.count({
          where: {
            viewerId: req.user.id,
            viewedUserId: { [Op.in]: finalCandidateIdsForCount },
            viewType: 'profile_view'
          },
          distinct: true,
          col: 'viewedUserId'
        });
      } catch (_) {
        accessedCandidates = 0;
      }
    }

    // ABSOLUTE FINAL VALIDATION - Force to 0 if ANY doubt
    // Convert to integer and validate - MULTIPLE SAFETY CHECKS
    let finalAccessedCount = 0;

    // Convert to number first
    const numValue = Number(accessedCandidates);

    // Only accept if:
    // 1. It's a valid integer
    // 2. It's >= 0
    // 3. It's not NaN or Infinity
    // 4. We have matching candidates to check against
    if (Number.isInteger(numValue) &&
      numValue >= 0 &&
      isFinite(numValue) &&
      finalCandidateIdsForCount.length > 0) {
      finalAccessedCount = numValue;
    } else {
      finalAccessedCount = 0;
    }

    // CRITICAL SAFETY: If no matching candidates, accessed MUST be 0
    if (finalCandidateIdsForCount.length === 0) {
      finalAccessedCount = 0;
    }

    // DOUBLE SAFETY: If count > 0 but no matching candidates, force to 0
    if (finalAccessedCount > 0 && finalCandidateIdsForCount.length === 0) {
      finalAccessedCount = 0;
    }

    // TRIPLE SAFETY: Ensure it's never anything other than 0 for new requirements
    if (!Number.isInteger(finalAccessedCount) || finalAccessedCount < 0) {
      finalAccessedCount = 0;
    }

    accessedCandidates = finalAccessedCount;

    // Get CV access left (this would come from subscription/usage data)
    // For now, we'll use a placeholder - in real implementation this would be from subscription service
    const cvAccessLeft = 100; // This should be fetched from subscription/usage service

    res.json({
      success: true,
      data: {
        totalCandidates: Number(totalCandidates) || 0,
        accessedCandidates: Number(accessedCandidates) || 0,
        cvAccessLeft,
        fallbackApplied: fallbackApplied || false,
        requirement: {
          id: requirement.id,
          title: requirement.title,
          status: requirement.status
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching requirement statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requirement statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get jobseekers based on requirement criteria
router.get('/:id/candidates', authenticateToken, checkPermission('resumeDatabase'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 50,
      search,
      sortBy = 'relevance',
      // Additional filter parameters
      experienceMin: filterExperienceMin,
      experienceMax: filterExperienceMax,
      salaryMin: filterSalaryMin,
      salaryMax: filterSalaryMax,
      locationInclude: filterLocationInclude,
      locationExclude: filterLocationExclude,
      skillsInclude: filterSkillsInclude,
      skillsExclude: filterSkillsExclude,
      keyword: filterKeyword,
      education: filterEducation,
      availability: filterAvailability,
      verification: filterVerification,
      lastActive: filterLastActive,
      saved: filterSaved,
      accessed: filterAccessed
    } = req.query;

    // Check if user is an employer or admin
    if (req.user.user_type !== 'employer' && req.user.user_type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Only employers and admins can view candidates.' });
    }

    // Get the requirement
    const requirement = await Requirement.findOne({
      where: {
        id
      }
    });

    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found' });
    }
    if (req.user.user_type !== 'admin' && String(requirement.companyId) !== String(req.user.companyId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    console.log('🔍 Searching candidates for requirement:', requirement.title);

    // ========== EXTRACT ALL FIELDS FROM METADATA ==========
    // Many fields are stored in metadata JSONB, extract them first
    const metadata = typeof requirement.metadata === 'string'
      ? JSON.parse(requirement.metadata)
      : (requirement.metadata || {});

    // Extract all metadata fields that might be used for matching
    // CRITICAL: These are VIRTUAL fields, so they MUST come from metadata
    const currentCompany = metadata.currentCompany || requirement.currentCompany || null;
    const institute = metadata.institute || requirement.institute || null;
    const resumeFreshness = metadata.resumeFreshness ? new Date(metadata.resumeFreshness) : (requirement.resumeFreshness ? new Date(requirement.resumeFreshness) : null);
    const diversityPreference = metadata.diversityPreference || requirement.diversityPreference || null;
    const lastActive = metadata.lastActive !== undefined && metadata.lastActive !== null
      ? metadata.lastActive
      : (requirement.lastActive !== undefined && requirement.lastActive !== null ? requirement.lastActive : null);
    const includeWillingToRelocate = metadata.includeWillingToRelocate !== undefined
      ? metadata.includeWillingToRelocate
      : (requirement.includeWillingToRelocate !== undefined ? requirement.includeWillingToRelocate : false);
    const includeNotMentioned = metadata.includeNotMentioned !== undefined
      ? metadata.includeNotMentioned
      : (requirement.includeNotMentioned !== undefined ? requirement.includeNotMentioned : false);

    // Extract experience from metadata - CRITICAL: Check multiple formats
    // Format 1: workExperienceMin/workExperienceMax (numeric)
    // Format 2: experienceMin/experienceMax (numeric)
    // Format 3: experience (string like "1", "3-5", "3 years", etc.)
    let workExperienceMin = metadata.workExperienceMin || metadata.experienceMin || requirement.workExperienceMin || requirement.experienceMin || null;
    let workExperienceMax = metadata.workExperienceMax || metadata.experienceMax || requirement.workExperienceMax || requirement.experienceMax || null;

    // If not found, try parsing from experience string (CRITICAL: This is how old requirements store it)
    if ((workExperienceMin === null || workExperienceMin === undefined) && metadata.experience) {
      const expStr = String(metadata.experience).trim();
      // Parse formats like "1", "3-5", "3 years", etc.
      const expMatch = expStr.match(/(\d+)(?:\s*-\s*(\d+))?/);
      if (expMatch) {
        workExperienceMin = parseInt(expMatch[1]);
        if (expMatch[2]) {
          workExperienceMax = parseInt(expMatch[2]);
        }
        console.log(`📊 Parsed experience from metadata.experience: ${workExperienceMin}${workExperienceMax ? '-' + workExperienceMax : '+'} years`);
      }
    }

    // Extract salary from metadata - CRITICAL: Check multiple formats
    // Format 1: currentSalaryMin/currentSalaryMax (numeric)
    // Format 2: salaryMin/salaryMax (numeric)
    // Format 3: salary (string like "10-12", "10 LPA", etc.)
    let currentSalaryMin = metadata.currentSalaryMin || metadata.salaryMin || requirement.currentSalaryMin || requirement.salaryMin || null;
    let currentSalaryMax = metadata.currentSalaryMax || metadata.salaryMax || requirement.currentSalaryMax || requirement.salaryMax || null;

    // If not found, try parsing from salary string (CRITICAL: This is how old requirements store it)
    if ((currentSalaryMin === null || currentSalaryMin === undefined) && metadata.salary) {
      const salStr = String(metadata.salary).trim();
      // Parse formats like "10-12", "10-12 LPA", "10 LPA", etc.
      const salMatch = salStr.match(/(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?/);
      if (salMatch) {
        currentSalaryMin = parseFloat(salMatch[1]);
        if (salMatch[2]) {
          currentSalaryMax = parseFloat(salMatch[2]);
        }
        console.log(`📊 Parsed salary from metadata.salary: ${currentSalaryMin}${currentSalaryMax ? '-' + currentSalaryMax : '+'} LPA`);
      }
    }

    // ========== INITIALIZE SEARCH ARRAYS ==========
    const allRequiredSkills = [
      ...(requirement.skills || []),
      ...(requirement.keySkills || [])
    ].filter(Boolean);
    const excludeSkills = metadata.excludeSkills || requirement.excludeSkills || [];
    const candidateLocations = (metadata.candidateLocations && metadata.candidateLocations.length > 0)
      ? [...metadata.candidateLocations]
      : ((requirement.candidateLocations && requirement.candidateLocations.length > 0) ? [...requirement.candidateLocations] : []);
    const excludeLocations = Array.isArray(metadata.excludeLocations) ? [...metadata.excludeLocations] : (metadata.excludeLocations ? [metadata.excludeLocations] : (metadata.exclude_locations ? (Array.isArray(metadata.exclude_locations) ? [...metadata.exclude_locations] : [metadata.exclude_locations]) : []));

    const candidateDesignations = (metadata.candidateDesignations && metadata.candidateDesignations.length > 0)
      ? [...metadata.candidateDesignations]
      : ((requirement.candidateDesignations && requirement.candidateDesignations.length > 0) ? [...requirement.candidateDesignations] : []);

    const education = metadata.education || requirement.education || null;
    const noticePeriod = metadata.noticePeriod || requirement.noticePeriod || null;
    const remoteWork = metadata.remoteWork || requirement.remoteWork || null;

    console.log('🔍 Requirement criteria:', {
      skills: requirement.skills,
      keySkills: requirement.keySkills,
      experienceMin: workExperienceMin,
      experienceMax: workExperienceMax,
      currentSalaryMin,
      currentSalaryMax,
      education,
      jobType: requirement.jobType,
      candidateLocations,
      candidateDesignations,
      currentCompany,
      institute,
      resumeFreshness,
      diversityPreference,
      lastActive,
      noticePeriod,
      remoteWork,
      includeWillingToRelocate,
      includeNotMentioned
    });

    // ========== APPLY ADDITIONAL FILTERS FROM QUERY PARAMETERS ==========
    // These filters override or supplement the requirement-based filters

    // Override experience range if provided in query
    if (filterExperienceMin !== undefined && filterExperienceMax !== undefined) {
      workExperienceMin = Number(filterExperienceMin);
      workExperienceMax = Number(filterExperienceMax);
      console.log(`🔍 Applying experience filter: ${workExperienceMin}-${workExperienceMax} years`);
    }

    // Override salary range if provided in query
    if (filterSalaryMin !== undefined && filterSalaryMax !== undefined) {
      currentSalaryMin = Number(filterSalaryMin);
      currentSalaryMax = Number(filterSalaryMax);
      console.log(`🔍 Applying salary filter: ${currentSalaryMin}-${currentSalaryMax} LPA`);
    }

    // Override location filters if provided in query
    if (filterLocationInclude) {
      const includeLocations = filterLocationInclude.split(',').map(loc => loc.trim()).filter(Boolean);
      if (includeLocations.length > 0) {
        candidateLocations.length = 0; // Clear requirement locations
        candidateLocations.push(...includeLocations);
        console.log(`🔍 Applying location include filter: ${includeLocations.join(', ')}`);
      }
    }

    if (filterLocationExclude) {
      const eLocations = filterLocationExclude.split(',').map(loc => loc.trim()).filter(Boolean);
      if (eLocations.length > 0) {
        excludeLocations.length = 0; // Clear requirement exclude locations
        excludeLocations.push(...eLocations);
        console.log(`🔍 Applying location exclude filter: ${eLocations.join(', ')}`);
      }
    }

    // Override skills filters if provided in query
    if (filterSkillsInclude) {
      const includeSkills = filterSkillsInclude.split(',').map(skill => skill.trim()).filter(Boolean);
      if (includeSkills.length > 0) {
        allRequiredSkills.length = 0; // Clear requirement skills
        allRequiredSkills.push(...includeSkills);
        console.log(`🔍 Applying skills include filter: ${includeSkills.join(', ')}`);
      }
    }

    if (filterSkillsExclude) {
      const eSkillsList = filterSkillsExclude.split(',').map(skill => skill.trim()).filter(Boolean);
      if (eSkillsList.length > 0) {
        excludeSkills.length = 0; // Clear requirement exclude skills
        excludeSkills.push(...eSkillsList);
        console.log(`🔍 Applying skills exclude filter: ${eSkillsList.join(', ')}`);
      }
    }

    // Apply keyword filter
    if (filterKeyword) {
      console.log(`🔍 Applying keyword filter: ${filterKeyword}`);
      // This will be added to search conditions
    }

    // Apply education filter
    if (filterEducation && Array.isArray(filterEducation)) {
      console.log(`🔍 Applying education filter: ${filterEducation.join(', ')}`);
      // This will be added to education conditions
    }

    // Apply availability filter (notice period)
    if (filterAvailability && Array.isArray(filterAvailability)) {
      console.log(`🔍 Applying availability filter: ${filterAvailability.join(', ')}`);
      // This will override notice period
    }

    // Apply verification filter
    if (filterVerification && Array.isArray(filterVerification)) {
      console.log(`🔍 Applying verification filter: ${filterVerification.join(', ')}`);
      // This will be added to where clause
    }

    // Apply last active filter
    if (filterLastActive && Array.isArray(filterLastActive)) {
      console.log(`🔍 Applying last active filter: ${filterLastActive.join(', ')}`);
      // This will be added to where clause
    }

    // ========== IMPROVED CANDIDATE MATCHING AL ==========
    // Build comprehensive search criteria based on ALL requirement fields

    const whereClause = {
      user_type: 'jobseeker',
      is_active: true,
      account_status: 'active'
    };

    // Track which filters are applied for better logging
    const appliedFilters = [];

    // Build matching conditions - use OR for flexibility (candidates matching ANY criteria)
    const matchingConditions = [];
    // CRITICAL: Declare allAndConditions early - it's used for combining all AND conditions
    const allAndConditions = [];

    // 1. EXPERIENCE RANGE MATCHING (workExperienceMin/Max)
    if (workExperienceMin !== null && workExperienceMin !== undefined) {
      const minExp = Number(workExperienceMin);
      const maxExp = workExperienceMax !== null && workExperienceMax !== undefined
        ? Number(workExperienceMax) : 50;

      whereClause.experience_years = {
        [Op.and]: [
          { [Op.gte]: minExp },
          { [Op.lte]: maxExp }
        ]
      };
      appliedFilters.push(`Experience: ${minExp}-${maxExp} years`);
    }

    // 2. SALARY RANGE MATCHING (currentSalaryMin/Max)
    // CRITICAL: Allow NULL salaries - candidates may not have salary info
    if (currentSalaryMin !== null && currentSalaryMin !== undefined) {
      const minSalary = Number(currentSalaryMin);
      const maxSalary = currentSalaryMax !== null && currentSalaryMax !== undefined
        ? Number(currentSalaryMax) : 200; // Max 200 LPA

      // Build salary match based on range
      const salaryRangeMatch = {
        current_salary: {
          [Op.and]: [
            { [Op.gte]: minSalary },
            { [Op.lte]: maxSalary }
          ]
        }
      };

      if (includeNotMentioned) {
        matchingConditions.push({
          [Op.or]: [
            salaryRangeMatch,
            { current_salary: null },
            { current_salary: { [Op.is]: null } }
          ]
        });
      } else {
        matchingConditions.push(salaryRangeMatch);
      }
      appliedFilters.push(`Salary: ${minSalary}-${maxSalary} LPA (includeNotMentioned: ${includeNotMentioned})`);
    } else if (includeNotMentioned) {
      // If includeNotMentioned is true, also include candidates with no salary specified
      // This is handled by not adding salary filter, so all candidates pass
      appliedFilters.push(`Salary: Any (including not mentioned)`);
    }

    // 3. LOCATION MATCHING (candidateLocations + excludeLocations + willing to relocate)
    // CRITICAL: If no candidateLocations specified, allow ANY location (don't filter)
    // Only filter by location if candidateLocations array has values
    // IMPORTANT: Exclude locations are applied AFTER include locations (they filter out candidates)

    // 3.1. LOCATION INCLUDE (candidateLocations)
    if (candidateLocations && candidateLocations.length > 0) {
      const locationConditions = candidateLocations.flatMap(location => ([
        // Match current location
        { current_location: { [Op.iLike]: `%${location}%` } },
        // Match preferred locations (JSONB array)
        sequelize.where(
          sequelize.cast(sequelize.col('preferred_locations'), 'text'),
          { [Op.iLike]: `%${location}%` }
        )
      ]));

      // Include candidates willing to relocate if requirement allows
      if (includeWillingToRelocate) {
        locationConditions.push({ willing_to_relocate: true });
      }

      matchingConditions.push({ [Op.or]: locationConditions });
      appliedFilters.push(`Location (Include): ${candidateLocations.join(', ')}${includeWillingToRelocate ? ' (including willing to relocate)' : ''}`);
    } else {
      // No location filter specified - allow any location candidate
      console.log('✅ No location include filter specified - allowing candidates from any location');
    }

    // 3.2. LOCATION EXCLUDE (excludeLocations)
    // CRITICAL: Exclude candidates from these locations (applied as NOT conditions)
    if (excludeLocations && excludeLocations.length > 0) {
      const excludeLocationConditions = excludeLocations.flatMap(location => ([
        // Exclude if current location matches
        { current_location: { [Op.not]: { [Op.iLike]: `%${location}%` } } },
        // Exclude if preferred locations match
        sequelize.where(
          sequelize.cast(sequelize.col('preferred_locations'), 'text'),
          { [Op.not]: { [Op.iLike]: `%${location}%` } }
        )
      ]));

      // For exclude, we need ALL conditions to be true (candidate must NOT be in ANY excluded location)
      // So we add them as AND conditions
      allAndConditions.push({
        [Op.and]: excludeLocationConditions
      });
      appliedFilters.push(`Location (Exclude): ${excludeLocations.join(', ')}`);
      console.log(`✅ Added location exclude filter: ${excludeLocations.join(', ')}`);
    }

    // 4. SKILLS & KEY SKILLS MATCHING (comprehensive)
    // CRITICAL: Include includeSkills from metadata (frontend sends this as "must have" skills)
    // IMPORTANT: keySkills (Additional Skills) are automatically merged into includeSkills during create/update
    const includeSkills = metadata.includeSkills || requirement.includeSkills || [];
    // Get keySkills separately for backward compatibility, but prioritize includeSkills
    const keySkillsFromRequirement = requirement.keySkills || [];
    // Merge includeSkills with keySkills (in case keySkills weren't merged yet in old requirements)
    const allIncludeSkills = [...new Set([
      ...(Array.isArray(includeSkills) ? includeSkills : []),
      ...(Array.isArray(keySkillsFromRequirement) ? keySkillsFromRequirement : [])
    ])].filter(Boolean);

    // Check if requirement title strongly matches candidate title/headline
    // If title matches strongly, skills become optional (title is more important)
    // Consolidate skills from requirement and includeSkills
    const mergedSkills = [...new Set([
      ...allRequiredSkills,
      ...allIncludeSkills
    ])];
    allRequiredSkills.length = 0;
    allRequiredSkills.push(...mergedSkills);

    // Update excludeSkills with metadata if not already merged
    const mergedExclude = [...new Set([
      ...excludeSkills,
      ...(metadata.excludeSkills || requirement.excludeSkills || [])
    ])].filter(Boolean);
    excludeSkills.length = 0;
    excludeSkills.push(...mergedExclude);

    const reqTitleCand = (requirement.title || '').trim();
    const hasStrongTitleMatch = reqTitleCand.length > 2;
    let titleMatchConditions = [];


    if (hasStrongTitleMatch) {
      const titleWords = requirement.title
        .split(/\s+/)
        .filter(word => word.length > 2)
        .map(word => word.toLowerCase());

      if (titleWords.length > 0) {
        // Create title matching conditions (used as alternative to skills)
        titleMatchConditions = titleWords.flatMap(word => [
          { headline: { [Op.iLike]: `%${word}%` } },
          { designation: { [Op.iLike]: `%${word}%` } },
          { current_role: { [Op.iLike]: `%${word}%` } }
        ]);
      }
    }

    if (allRequiredSkills.length > 0) {
      const skillConditions = allRequiredSkills.flatMap(skill => ([
        // Match in skills array (exact and case-insensitive)
        { skills: { [Op.contains]: [skill] } },
        sequelize.where(sequelize.cast(sequelize.col('skills'), 'text'), { [Op.iLike]: `%${skill}%` }),
        // Match in key_skills array
        { key_skills: { [Op.contains]: [skill] } },
        sequelize.where(sequelize.cast(sequelize.col('key_skills'), 'text'), { [Op.iLike]: `%${skill}%` }),
        // Match in headline (job title often mentions key skills)
        { headline: { [Op.iLike]: `%${skill}%` } },
        // Match in summary
        { summary: { [Op.iLike]: `%${skill}%` } }
      ]));

      // If we have title matching conditions, make skills OR title match (title can override skills)
      if (titleMatchConditions.length > 0) {
        matchingConditions.push({
          [Op.or]: [
            { [Op.or]: skillConditions }, // Skills match
            { [Op.or]: titleMatchConditions } // OR strong title match
          ]
        });
        appliedFilters.push(`Skills (Must Have) OR Title Match: ${allRequiredSkills.slice(0, 3).join(', ')}${allRequiredSkills.length > 3 ? '...' : ''} OR "${requirement.title}"`);
      } else {
        matchingConditions.push({ [Op.or]: skillConditions });
        appliedFilters.push(`Skills (Must Have): ${allRequiredSkills.slice(0, 3).join(', ')}${allRequiredSkills.length > 3 ? '...' : ''}`);
      }
    } else if (titleMatchConditions.length > 0) {
      // No skills but have title - use title matching
      matchingConditions.push({ [Op.or]: titleMatchConditions });
      appliedFilters.push(`Title Match: "${requirement.title}"`);
    }

    // CRITICAL: Exclude skills - candidates MUST NOT have these skills in ANY field
    // Fixed: Use simpler syntax to avoid Sequelize Symbol serialization issues
    if (Array.isArray(excludeSkills) && excludeSkills.length > 0 && excludeSkills.filter(s => s).length > 0) {
      // For each exclude skill, candidate must NOT have it in ANY field
      // Using raw SQL to avoid complex operator nesting issues
      const excludeConditions = excludeSkills.filter(s => s).map((excludeSkill, index) => {
        const paramName = `excludeSkill${index}`;
        return sequelize.where(
          sequelize.literal(`
            (
              (skills IS NULL OR NOT CAST(skills AS TEXT) ILIKE '%${excludeSkill}%') AND
              (key_skills IS NULL OR NOT CAST(key_skills AS TEXT) ILIKE '%${excludeSkill}%') AND
              (headline IS NULL OR headline NOT ILIKE '%${excludeSkill}%') AND
              (summary IS NULL OR summary NOT ILIKE '%${excludeSkill}%')
            )
          `),
          {}
        );
      });

      // Add all exclude conditions with AND logic
      if (excludeConditions.length > 0) {
        allAndConditions.push({ [Op.and]: excludeConditions });
      }
      appliedFilters.push(`Skills (Must NOT Have): ${excludeSkills.filter(s => s).slice(0, 3).join(', ')}${excludeSkills.filter(s => s).length > 3 ? '...' : ''}`);
      console.log(`✅ Added exclude skills filter: ${excludeSkills.filter(s => s).join(', ')}`);
    }

    // 4.5. CURRENT DESIGNATION MATCHING (from metadata) - LENIENT MATCHING
    // Match against user table fields AND work experience titles (most accurate)
    const currentDesignation = metadata.currentDesignation || requirement.currentDesignation || null;
    if (currentDesignation) {
      // Lenient matching: check user table fields (designation, headline, current_role)
      // Work experience matching will be done in post-query filtering for accuracy
      matchingConditions.push({
        [Op.or]: [
          { designation: { [Op.iLike]: `%${currentDesignation}%` } },
          { headline: { [Op.iLike]: `%${currentDesignation}%` } },
          { current_role: { [Op.iLike]: `%${currentDesignation}%` } }
        ]
      });
      appliedFilters.push(`Current Designation (lenient): ${currentDesignation}`);
    }

    // 5. REQUIREMENT TITLE MATCHING (OPTIONAL - only if no skills specified)
    // CRITICAL: If skills are specified, title is optional (skills are more important than title)
    // Only add title matching to query if no skills are specified
    // Title matching is still applied in post-query filtering, but it's lenient (skills override title)
    // DO NOT add title to query-level matchingConditions - this makes it too strict
    // Title filtering happens later in post-query filtering and is lenient
    // Removed: Title matching from query-level conditions (was too strict)

    // 5. DESIGNATION MATCHING (candidateDesignations)
    if (candidateDesignations && candidateDesignations.length > 0) {
      const designationConditions = candidateDesignations.flatMap(designation => ([
        { designation: { [Op.iLike]: `%${designation}%` } },
        { headline: { [Op.iLike]: `%${designation}%` } },
        { summary: { [Op.iLike]: `%${designation}%` } },
        { current_role: { [Op.iLike]: `%${designation}%` } }
      ]));

      matchingConditions.push({ [Op.or]: designationConditions });
      appliedFilters.push(`Designation: ${candidateDesignations.join(', ')}`);
    }

    // 6. EDUCATION MATCHING (OPTIONAL - only if no skills specified)
    // CRITICAL: Education is a nice-to-have, not a must-have
    // If skills are specified, education is optional (skills are more important)
    // Only filter by education if NO skills are specified
    // Education will still be used for relevance scoring
    if ((education || institute) && allRequiredSkills.length === 0) {
      const educationConditions = [];

      if (education) {
        educationConditions.push(
          // Search in education JSONB array
          sequelize.where(
            sequelize.cast(sequelize.col('education'), 'text'),
            { [Op.iLike]: `%${education}%` }
          ),
          // Search in highest_education field
          { highest_education: { [Op.iLike]: `%${education}%` } },
          // Search in field_of_study
          { field_of_study: { [Op.iLike]: `%${education}%` } },
          // Search in headline and summary
          { headline: { [Op.iLike]: `%${education}%` } },
          { summary: { [Op.iLike]: `%${education}%` } }
        );
      }

      if (institute) {
        educationConditions.push(
          // Search for institute name in education JSONB
          sequelize.where(
            sequelize.cast(sequelize.col('education'), 'text'),
            { [Op.iLike]: `%${institute}%` }
          ),
          // Search in summary (people often mention their university)
          { summary: { [Op.iLike]: `%${institute}%` } }
        );
      }

      if (educationConditions.length > 0) {
        matchingConditions.push({ [Op.or]: educationConditions });
        appliedFilters.push(`Education: ${education || ''} ${institute || ''}`);
      }
    } else if (education || institute) {
      // Education specified but skills also specified - mark as optional for scoring
      appliedFilters.push(`Education (optional): ${education || ''} ${institute || ''}`);
    }

    // 7. CURRENT COMPANY MATCHING
    if (currentCompany) {
      matchingConditions.push({
        [Op.or]: [
          // Search in current_company field
          { current_company: { [Op.iLike]: `%${currentCompany}%` } },
          { headline: { [Op.iLike]: `%${currentCompany}%` } },
          { summary: { [Op.iLike]: `%${currentCompany}%` } }
        ]
      });
      appliedFilters.push(`Company: ${currentCompany}`);
    }

    // 8. NOTICE PERIOD MATCHING
    // CRITICAL: Notice period is OPTIONAL - should not exclude candidates
    // If skills match, notice period is secondary to skills
    // Only filter if NO skills are specified, otherwise make it optional for scoring
    if (noticePeriod && noticePeriod !== 'Any' && noticePeriod !== 'any') {
      // Convert notice period to days for comparison
      const noticePeriodMap = {
        'Immediately': 0,
        'Immediate': 0,
        '15 days': 15,
        '30 days': 30,
        '60 days': 60,
        '90 days': 90
      };

      const maxNoticeDays = noticePeriodMap[noticePeriod];
      if (maxNoticeDays !== undefined) {
        // CRITICAL FIX: Don't add to whereClause - notice period should NOT exclude candidates
        // Instead, apply as an optional matching condition that can be overridden by skills
        // This ensures candidates with matching skills are not excluded just because of notice period
        matchingConditions.push({
          [Op.or]: [
            { notice_period: { [Op.lte]: maxNoticeDays } },
            { notice_period: null } // Include candidates who haven't specified notice period
          ]
        });
        appliedFilters.push(`Notice Period (Optional): ≤${noticePeriod}`);
      }
    }

    // 10. RESUME FRESHNESS (if specified)
    if (resumeFreshness) {
      const freshnessDate = new Date(resumeFreshness);
      whereClause.last_profile_update = {
        [Op.gte]: freshnessDate
      };
      appliedFilters.push(`Resume Updated After: ${freshnessDate.toLocaleDateString()}`);
    }

    // 11. REMOTE WORK PREFERENCE (OPTIONAL - only if no skills specified)
    // CRITICAL: Remote work is a nice-to-have, not a must-have
    // If skills are specified, remote work is optional (skills are more important)
    // Only filter by remote work if NO skills are specified
    // Remote work will still be used for relevance scoring
    if (remoteWork && remoteWork !== 'Any' && remoteWork !== 'any' && allRequiredSkills.length === 0) {
      matchingConditions.push({
        [Op.or]: [
          sequelize.where(
            sequelize.cast(sequelize.col('preferences'), 'text'),
            { [Op.iLike]: `%${remoteWork}%` }
          ),
          { headline: { [Op.iLike]: `%${remoteWork}%` } }
        ]
      });
      appliedFilters.push(`Remote Work: ${remoteWork}`);
    } else if (remoteWork && remoteWork !== 'Any' && remoteWork !== 'any') {
      // Remote work specified but skills also specified - mark as optional for scoring
      appliedFilters.push(`Remote Work (optional): ${remoteWork}`);
    }

    // 11. DIVERSITY PREFERENCE (Gender) - CRITICAL
    if (diversityPreference && Array.isArray(diversityPreference) && diversityPreference.length > 0) {
      // Filter out 'all' - if 'all' is selected, don't filter by gender
      const validPreferences = diversityPreference.filter(p => p && p !== 'all' && ['male', 'female', 'other'].includes(p));
      if (validPreferences.length > 0 && !diversityPreference.includes('all')) {
        allAndConditions.push({
          gender: { [Op.in]: validPreferences }
        });
        appliedFilters.push(`Gender: ${validPreferences.join(', ')}`);
        console.log(`✅ Added gender filter: ${validPreferences.join(', ')}`);
      } else {
        console.log('ℹ️ Gender filter: All selected (no gender filter applied)');
      }
    }

    // 13. LAST ACTIVE (if specified) - candidates who were active within last X days
    if (lastActive !== null && lastActive !== undefined) {
      const daysAgo = Number(lastActive);
      if (!isNaN(daysAgo) && daysAgo > 0) {
        const activeDate = new Date();
        activeDate.setDate(activeDate.getDate() - daysAgo);
        whereClause.last_login_at = {
          [Op.gte]: activeDate
        };
        appliedFilters.push(`Last Active: Within ${daysAgo} days`);
      }
    }

    console.log('🎯 Applied Filters:', appliedFilters.join(' | '));

    // CRITICAL FIX: Use AND logic to combine ALL conditions including experience/salary
    // This ensures candidates must match ALL specified criteria
    // If skills are specified, candidate MUST have at least one of those skills
    // If locations are specified, candidate MUST match at least one location
    // Experience and salary filters are also part of the AND logic
    // NOTE: allAndConditions is already declared earlier (line 1754)

    // Add experience filter if present
    if (whereClause.experience_years) {
      allAndConditions.push({ experience_years: whereClause.experience_years });
      delete whereClause.experience_years; // Remove from top level
    }

    // Add salary filter if present
    if (whereClause.current_salary) {
      allAndConditions.push({ current_salary: whereClause.current_salary });
      delete whereClause.current_salary; // Remove from top level
    }

    // Add notice period filter if present
    if (whereClause.notice_period) {
      allAndConditions.push({ notice_period: whereClause.notice_period });
      delete whereClause.notice_period; // Remove from top level
    }

    // Add resume freshness filter if present
    if (whereClause.last_profile_update) {
      allAndConditions.push({ last_profile_update: whereClause.last_profile_update });
      delete whereClause.last_profile_update; // Remove from top level
    }

    // Add last active filter if present
    if (whereClause.last_login_at) {
      allAndConditions.push({ last_login_at: whereClause.last_login_at });
      delete whereClause.last_login_at; // Remove from top level
    }

    // Add gender filter if present (diversity preference)
    if (whereClause.gender) {
      allAndConditions.push({ gender: whereClause.gender });
      delete whereClause.gender; // Remove from top level
    }

    // Add matching conditions (skills, locations, designations, etc.)
    // CRITICAL FIX: Wrap matchingConditions in Op.and to combine them properly
    // matchingConditions contains objects like { [Op.or]: [...] } for skills, locations, etc.
    // We need to combine them with AND logic: (skills match) AND (locations match) AND ...
    if (matchingConditions.length > 0) {
      allAndConditions.push({ [Op.and]: matchingConditions });
    }

    // Apply ALL conditions with AND logic
    if (allAndConditions.length > 0) {
      whereClause[Op.and] = allAndConditions;
      console.log(`✅ Applied ${allAndConditions.length} AND conditions (experience, salary, skills, locations, designations, etc.)`);
      console.log(`   This ensures candidates must match ALL specified criteria - NO irrelevant candidates`);
    }

    // Add search query if provided (narrows down results further)
    // Search should be combined with AND logic to further filter results
    const searchQuery = search || filterKeyword; // Use either search or keyword filter
    if (searchQuery) {
      const searchConditions = [
        { first_name: { [Op.iLike]: `%${searchQuery}%` } },
        { last_name: { [Op.iLike]: `%${searchQuery}%` } },
        { headline: { [Op.iLike]: `%${searchQuery}%` } },
        { designation: { [Op.iLike]: `%${searchQuery}%` } },
        { summary: { [Op.iLike]: `%${searchQuery}%` } },
        sequelize.where(sequelize.cast(sequelize.col('skills'), 'text'), { [Op.iLike]: `%${searchQuery}%` }),
        sequelize.where(sequelize.cast(sequelize.col('key_skills'), 'text'), { [Op.iLike]: `%${searchQuery}%` })
      ];

      // Add search as an AND condition
      whereClause[Op.and] = whereClause[Op.and] || [];
      whereClause[Op.and].push({ [Op.or]: searchConditions });
      appliedFilters.push(`Search: "${searchQuery}"`);
    }

    console.log('🔍 Final where clause (simplified):', {
      baseFilters: {
        user_type: whereClause.user_type,
        is_active: whereClause.is_active,
        account_status: whereClause.account_status
      },
      experienceRange: whereClause.experience_years,
      salaryRange: whereClause.current_salary,
      noticePeriodMax: whereClause.notice_period,
      resumeUpdatedAfter: whereClause.last_profile_update,
      matchingConditionsCount: whereClause[Op.or] ? whereClause[Op.or].length : 0,
      searchApplied: whereClause[Op.and] ? true : false,
      allAndConditionsCount: whereClause[Op.and] ? whereClause[Op.and].length : 0
    });

    // DEBUG: Log the actual query being executed
    console.log('🔍 DEBUG: Extracted values for this query:');
    console.log(`   workExperienceMin: ${workExperienceMin}, workExperienceMax: ${workExperienceMax}`);
    console.log(`   currentSalaryMin: ${currentSalaryMin}, currentSalaryMax: ${currentSalaryMax}`);
    console.log(`   allRequiredSkills:`, allRequiredSkills);
    console.log(`   candidateLocations:`, candidateLocations);
    console.log(`   noticePeriod: ${noticePeriod}`);
    console.log(`   whereClause keys:`, Object.keys(whereClause));
    console.log(`   whereClause[Op.and] length:`, whereClause[Op.and] ? whereClause[Op.and].length : 0);

    // Determine sort order - simplified
    let orderClause = [['last_profile_update', 'DESC']]; // Prioritize recent profiles

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (isNaN(pageNum) ? 0 : (pageNum - 1)) * (isNaN(limitNum) ? 50 : limitNum);

    // DEBUG: Test query without pagination first to see total count
    console.log('\n🔍 ========== DEBUG: QUERY CONSTRUCTION ==========');
    console.log('📊 Extracted Values:');
    console.log(`   workExperienceMin: ${workExperienceMin}, workExperienceMax: ${workExperienceMax}`);
    console.log(`   currentSalaryMin: ${currentSalaryMin}, currentSalaryMax: ${currentSalaryMax}`);
    console.log(`   allRequiredSkills:`, allRequiredSkills);
    console.log(`   candidateLocations:`, candidateLocations);
    console.log(`   noticePeriod: ${noticePeriod}`);
    console.log(`   whereClause structure:`, JSON.stringify(whereClause, null, 2).substring(0, 1000));
    console.log(`   allAndConditions count:`, allAndConditions.length);
    console.log(`   matchingConditions count:`, matchingConditions.length);

    const testCount = await User.count({ where: whereClause });
    console.log(`🔍 DEBUG: Total count before pagination: ${testCount}`);

    if (testCount === 0) {
      console.log('❌ PROBLEM: Query returns 0 candidates!');
      console.log('   Checking individual filters...');

      // Test each filter individually
      const baseWhere = {
        user_type: 'jobseeker',
        is_active: true,
        account_status: 'active'
      };

      const baseCount = await User.count({ where: baseWhere });
      console.log(`   Base count (no filters): ${baseCount}`);

      if (workExperienceMin !== null) {
        const expWhere = { ...baseWhere, experience_years: { [Op.gte]: Number(workExperienceMin), [Op.lte]: Number(workExperienceMax || 50) } };
        const expCount = await User.count({ where: expWhere });
        console.log(`   With experience filter: ${expCount}`);
      }

      if (currentSalaryMin !== null) {
        const salWhere = { ...baseWhere, current_salary: { [Op.gte]: Number(currentSalaryMin), [Op.lte]: Number(currentSalaryMax || 200) } };
        const salCount = await User.count({ where: salWhere });
        console.log(`   With salary filter: ${salCount}`);
      }

      if (allRequiredSkills.length > 0) {
        const skillConditions = allRequiredSkills.flatMap(skill => [
          sequelize.where(sequelize.cast(sequelize.col('skills'), 'text'), { [Op.iLike]: `%${skill}%` }),
          sequelize.where(sequelize.cast(sequelize.col('key_skills'), 'text'), { [Op.iLike]: `%${skill}%` }),
          { headline: { [Op.iLike]: `%${skill}%` } }
        ]);
        const skillWhere = { ...baseWhere, [Op.or]: skillConditions };
        const skillCount = await User.count({ where: skillWhere });
        console.log(`   With skills filter (any skill): ${skillCount}`);
      }
    }

    // Fetch candidates with comprehensive attributes
    const { count, rows: candidates } = await User.findAndCountAll({
      where: whereClause,
      order: orderClause,
      limit: limitNum,
      offset,
      attributes: [
        'id', 'first_name', 'last_name', 'email', 'phone', 'avatar',
        'current_location', 'headline', 'summary', 'skills', 'key_skills', 'languages',
        'current_salary', 'expected_salary', 'notice_period', 'willing_to_relocate',
        'experience_years', 'preferred_locations', 'education', 'designation',
        'profile_completion', 'last_login_at', 'last_profile_update',
        'is_email_verified', 'is_phone_verified', 'created_at',
        'preferences', 'certifications', 'highest_education', 'field_of_study',
        'current_role', 'current_company', 'gender'
      ]
    });

    console.log(`✅ Found ${count} total candidates matching requirement criteria (page has ${candidates.length} candidates)`);
    console.log('🔍 ========== END DEBUG ==========\n');

    if (count === 0 && testCount === 0) {
      console.log('⚠️  WARNING: Query returned 0 candidates. Checking if this is correct...');
      console.log('   If the database test found candidates, there might be a query construction issue.');
    }

    // Send notification to employer if new candidates are found
    if (count > 0) {
      try {
        const { Notification } = require('../config/index');
        const { Company } = require('../config/index');

        // Get company info for notification
        const company = await Company.findByPk(requirement.companyId);
        const companyName = company?.name || 'Your Company';

        // Check if we already sent a notification for this requirement recently (within 24 hours)
        const recentNotification = await Notification.findOne({
          where: {
            userId: req.user.id,
            type: 'company_update',
            metadata: {
              requirementId: requirement.id
            },
            created_at: {
              [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
            }
          }
        });

        if (!recentNotification) {
          await Notification.create({
            userId: req.user.id,
            type: 'company_update',
            title: `🎯 New Candidates Found for Your Requirement!`,
            message: `Found ${count} matching candidates for "${requirement.title}" position. Review and contact them now!`,
            shortMessage: `${count} new candidates for ${requirement.title}`,
            priority: 'medium',
            actionUrl: `/employer-dashboard/candidate-requirement/${requirement.id}`,
            actionText: 'View Candidates',
            icon: 'users',
            metadata: {
              requirementId: requirement.id,
              requirementTitle: requirement.title,
              candidateCount: count,
              companyId: requirement.companyId,
              companyName: companyName
            }
          });
          console.log(`✅ Candidate recommendation notification sent to employer ${req.user.id}`);
        } else {
          console.log(`ℹ️ Skipping notification - already sent recently for requirement ${requirement.id}`);
        }
      } catch (notificationError) {
        console.error('❌ Failed to send candidate recommendation notification:', notificationError);
        // Don't fail the candidate search if notification fails
      }
    }

    // CRITICAL: NO FALLBACK - Only show candidates that match ALL strict criteria
    // This ensures we NEVER show irrelevant candidates
    let finalCandidates = candidates;
    let finalCount = count;
    let fallbackApplied = false;

    // Check if we have strict criteria
    const hasStrictCriteria = (
      (allRequiredSkills.length > 0) ||
      (candidateLocations.length > 0) ||
      (candidateDesignations.length > 0) ||
      (workExperienceMin !== null) ||
      (currentSalaryMin !== null) ||
      (education !== null) ||
      (currentCompany !== null) ||
      (institute !== null)
    );

    // If strict criteria produced zero matches, attempt a controlled fallback
    if (finalCount === 0 && hasStrictCriteria) {
      console.log(`⚠️ No candidates matched strict criteria. Attempting controlled relaxed fallback (remove experience/salary constraints).`);

      try {
        // Build relaxed matching: keep skills, locations, designations but remove experience and salary constraints
        const baseWhere = {
          user_type: 'jobseeker',
          is_active: true,
          account_status: 'active'
        };

        const relaxedAnds = [];

        // Skills (includeSkills from metadata or requirement fields)
        const relaxedSkillConds = [];
        const reqSkills = (metadata && metadata.includeSkills && metadata.includeSkills.length > 0) ? metadata.includeSkills : (requirement.skills || []);
        (reqSkills || []).forEach(s => {
          if (!s) return;
          relaxedSkillConds.push({
            [Op.or]: [
              sequelize.where(sequelize.cast(sequelize.col('key_skills'), 'text'), { [Op.iLike]: `%${s}%` }),
              sequelize.where(sequelize.cast(sequelize.col('skills'), 'text'), { [Op.iLike]: `%${s}%` }),
              { summary: { [Op.iLike]: `%${s}%` } }
            ]
          });
        });
        if (relaxedSkillConds.length > 0) relaxedAnds.push({ [Op.or]: relaxedSkillConds });

        // Locations (candidateLocations)
        const relaxedLocationConds = [];
        (candidateLocations || []).forEach(loc => {
          if (!loc) return;
          relaxedLocationConds.push({ current_location: { [Op.iLike]: `%${loc}%` } });
          relaxedLocationConds.push(sequelize.where(sequelize.cast(sequelize.col('preferred_locations'), 'text'), { [Op.iLike]: `%${loc}%` }));
        });
        if (relaxedLocationConds.length > 0) relaxedAnds.push({ [Op.or]: relaxedLocationConds });

        // Designations (candidateDesignations)
        const relaxedDesignationConds = [];
        (candidateDesignations || []).forEach(d => {
          if (!d) return;
          relaxedDesignationConds.push({ designation: { [Op.iLike]: `%${d}%` } });
        });
        if (relaxedDesignationConds.length > 0) relaxedAnds.push({ [Op.or]: relaxedDesignationConds });

        // Build final relaxed where
        const relaxedWhere = { ...baseWhere };
        if (relaxedAnds.length > 0) {
          relaxedWhere[Op.and] = relaxedAnds;

          const relaxedMatches = await User.findAll({ where: relaxedWhere, attributes: ['id'], limit: 10000 });
          if (Array.isArray(relaxedMatches) && relaxedMatches.length > 0) {
            finalCandidates = await User.findAll({ where: { id: { [Op.in]: relaxedMatches.map(m => m.id) } }, limit: 100, order: [['profile_completion', 'DESC']] });
            finalCount = relaxedMatches.length;
            fallbackApplied = true;
            console.log(`✅ Relaxed fallback succeeded: ${finalCount} candidates found after removing experience/salary filters.`);
          } else {
            console.log(`⚠️ Relaxed fallback returned no candidates. Keeping strict-empty result.`);
            finalCandidates = [];
            finalCount = 0;
          }
        } else {
          console.log(`⚠️ Fallback skipped for Req ${id}: No relaxed criteria available (would match all candidates)`);
          finalCandidates = [];
          finalCount = 0;
        }
      } catch (fallbackErr) {
        console.error('❌ Error while performing relaxed fallback:', fallbackErr);
        finalCandidates = [];
        finalCount = 0;
      }
    }

    // ========== IMPROVED RELEVANCE SCORING ALGORITHM ==========
    // Calculate comprehensive relevance score for each candidate (max 100 points)
    // CRITICAL: Use extracted values from metadata, not VIRTUAL fields
    const calculateRelevanceScore = (candidate, reqData) => {
      let score = 0;
      let matchReasons = [];

      // Helper function for case-insensitive array matching
      const matchSkill = (requiredSkill, candidateSkills = []) => {
        return candidateSkills.some(cs =>
          cs.toLowerCase() === requiredSkill.toLowerCase() ||
          cs.toLowerCase().includes(requiredSkill.toLowerCase()) ||
          requiredSkill.toLowerCase().includes(cs.toLowerCase())
        );
      };

      // 1. SKILLS MATCHING (35 points max - high priority, but lower than title match)
      const allRequiredSkills = [
        ...(reqData.skills || []),
        ...(reqData.keySkills || [])
      ].filter(Boolean);

      if (allRequiredSkills.length > 0) {
        const candidateSkills = [
          ...(candidate.skills || []),
          ...(candidate.key_skills || [])
        ];

        const matchingSkills = allRequiredSkills.filter(skill =>
          matchSkill(skill, candidateSkills)
        );

        if (matchingSkills.length > 0) {
          const matchPercentage = (matchingSkills.length / allRequiredSkills.length) * 100;
          const skillScore = Math.min(35, (matchPercentage / 100) * 35);
          score += skillScore;
          matchReasons.push(`${matchingSkills.length}/${allRequiredSkills.length} skills match (${Math.round(matchPercentage)}%)`);
        }
      }

      // 2. LOCATION MATCHING (15 points)
      if (reqData.candidateLocations && reqData.candidateLocations.length > 0) {
        const candidateLocation = (candidate.current_location || '').toLowerCase();
        const preferredLocs = (candidate.preferred_locations || []).map(l => l.toLowerCase());

        const hasExactLocationMatch = reqData.candidateLocations.some(loc =>
          candidateLocation.includes(loc.toLowerCase()) ||
          preferredLocs.some(pl => pl.includes(loc.toLowerCase()))
        );

        if (hasExactLocationMatch) {
          score += 15;
          matchReasons.push('Preferred location');
        } else if (candidate.willing_to_relocate && reqData.includeWillingToRelocate) {
          score += 8;
          matchReasons.push('Open to relocate');
        }
      }

      // 3. EXPERIENCE MATCHING (15 points)
      if (reqData.workExperienceMin !== null && reqData.workExperienceMin !== undefined) {
        const minExp = Number(reqData.workExperienceMin);
        const maxExp = reqData.workExperienceMax !== null && reqData.workExperienceMax !== undefined
          ? Number(reqData.workExperienceMax) : 50;
        const candidateExp = Number(candidate.experience_years) || 0;

        if (candidateExp >= minExp && candidateExp <= maxExp) {
          // Perfect match - within range
          score += 15;
          matchReasons.push(`Experience: ${candidateExp} yrs (fits ${minExp}-${maxExp} yrs)`);
        } else if (candidateExp > maxExp && candidateExp <= maxExp + 2) {
          // Slightly over-qualified (within 2 years)
          score += 10;
          matchReasons.push(`Experience: ${candidateExp} yrs (slightly over)`);
        } else if (candidateExp < minExp && candidateExp >= minExp - 2) {
          // Slightly under-qualified (within 2 years)
          score += 8;
          matchReasons.push(`Experience: ${candidateExp} yrs (slightly under)`);
        }
      }

      // 4. SALARY EXPECTATION MATCHING (10 points)
      if (reqData.currentSalaryMin !== null && reqData.currentSalaryMin !== undefined) {
        const minSalary = Number(reqData.currentSalaryMin);
        const maxSalary = reqData.currentSalaryMax || 200;
        const candidateSalary = Number(candidate.current_salary) || 0;

        if (candidateSalary >= minSalary && candidateSalary <= maxSalary) {
          score += 10;
          matchReasons.push(`Salary: ${candidateSalary} LPA (fits ${minSalary}-${maxSalary} LPA)`);
        } else if (candidateSalary > 0) {
          // Partial points if salary is specified but outside range
          score += 3;
        }
      }

      // 5. EDUCATION MATCHING (10 points)
      if (reqData.education || reqData.institute) {
        const candidateEducation = JSON.stringify(candidate.education || []).toLowerCase();
        const candidateText = `${candidate.headline || ''} ${candidate.summary || ''} ${candidate.highest_education || ''} ${candidate.field_of_study || ''}`.toLowerCase();
        let educationMatch = false;

        if (reqData.education &&
          (candidateEducation.includes(reqData.education.toLowerCase()) ||
            candidateText.includes(reqData.education.toLowerCase()))) {
          educationMatch = true;
        }

        if (reqData.institute &&
          (candidateEducation.includes(reqData.institute.toLowerCase()) ||
            candidateText.includes(reqData.institute.toLowerCase()))) {
          score += 10;
          matchReasons.push(`Institute: ${reqData.institute}`);
          educationMatch = true;
        }

        if (educationMatch && !matchReasons.some(r => r.includes('Institute'))) {
          score += 8;
          matchReasons.push('Education qualification match');
        }
      }

      // 6. DESIGNATION MATCHING (8 points)
      if (reqData.candidateDesignations && reqData.candidateDesignations.length > 0) {
        const candidateTitle = `${candidate.designation || ''} ${candidate.headline || ''} ${candidate.current_role || ''}`.toLowerCase();
        const hasDesignationMatch = reqData.candidateDesignations.some(des =>
          candidateTitle.includes(des.toLowerCase())
        );

        if (hasDesignationMatch) {
          score += 8;
          matchReasons.push('Designation match');
        }
      }

      // 7. CURRENT COMPANY MATCHING (5 points - bonus for target company exp)
      if (reqData.currentCompany) {
        const candidateText = `${candidate.current_company || ''} ${candidate.headline || ''} ${candidate.summary || ''}`.toLowerCase();

        if (candidateText.includes(reqData.currentCompany.toLowerCase())) {
          score += 5;
          matchReasons.push(`Worked at: ${reqData.currentCompany}`);
        }
      }

      // 8. NOTICE PERIOD MATCHING (4 points)
      if (reqData.noticePeriod && reqData.noticePeriod !== 'Any' && reqData.noticePeriod !== 'any') {
        const noticePeriodMap = {
          'Immediately': 0,
          'Immediate': 0,
          '15 days': 15,
          '30 days': 30,
          '60 days': 60,
          '90 days': 90
        };

        const maxNoticeDays = noticePeriodMap[reqData.noticePeriod];
        const candidateNoticeDays = Number(candidate.notice_period) || 90;

        if (maxNoticeDays !== undefined && candidateNoticeDays <= maxNoticeDays) {
          score += 4;
          matchReasons.push(`Notice: ${candidateNoticeDays} days (≤${maxNoticeDays})`);
        }
      }

      // 9. PROFILE QUALITY BONUSES (8 points max)
      // Profile completion
      if (candidate.profile_completion >= 90) {
        score += 4;
        matchReasons.push('Complete profile (90%+)');
      } else if (candidate.profile_completion >= 70) {
        score += 2;
      }

      // Verification status
      if (candidate.is_email_verified && candidate.is_phone_verified) {
        score += 3;
        matchReasons.push('Verified contact');
      }

      // Recent activity
      const daysSinceUpdate = candidate.last_profile_update
        ? Math.floor((Date.now() - new Date(candidate.last_profile_update).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      if (daysSinceUpdate <= 30) {
        score += 1;
        matchReasons.push('Recently active');
      }

      return { score: Math.min(100, Math.round(score)), matchReasons };
    };

    // Fetch ATS scores for candidates
    const candidateIds = finalCandidates.map(c => c.id);
    let atsScoresMap = {};

    if (candidateIds.length > 0) {
      try {
        console.log('🔍 Fetching ATS scores for requirement:', id);
        console.log('🔍 Candidate IDs:', candidateIds);

        const atsScores = await sequelize.query(`
          SELECT 
            user_id as "userId",
            requirement_id as "requirementId",
            ats_score as "atsScore",
            last_calculated as "lastCalculated"
          FROM candidate_analytics
          WHERE user_id IN (:candidateIds) AND requirement_id = :requirementId
        `, {
          replacements: { candidateIds, requirementId: id },
          type: QueryTypes.SELECT
        });

        // Create a map for quick lookup
        atsScores.forEach(score => {
          atsScoresMap[score.userId] = {
            score: score.atsScore,
            lastCalculated: score.lastCalculated,
            requirementId: score.requirementId
          };
        });

        console.log('🔍 ATS scores fetched for requirement', id, ':', {
          totalCandidates: candidateIds.length,
          atsScoresFound: atsScores.length,
          atsScoresMap: Object.keys(atsScoresMap).length
        });

        // Debug: Log specific ATS scores for known candidates
        console.log('🔍 ATS scores details for debugging:');
        atsScores.forEach(score => {
          console.log(`  - User ${score.userId}: Score ${score.atsScore} for requirement ${score.requirementId} (${score.lastCalculated})`);
        });

        // Verify all scores match the current requirement
        const mismatchedScores = atsScores.filter(score => score.requirementId !== id);
        if (mismatchedScores.length > 0) {
          console.log('⚠️ Found ATS scores for different requirements:', mismatchedScores);
        }

      } catch (atsError) {
        console.log('⚠️ Could not fetch ATS scores:', atsError.message);
        console.log('🔍 ATS Error details:', atsError);
      }
    }

    // CRITICAL: Apply LENIENT title filtering
    // If skills match, title is optional. Only filter if NO skills specified.
    let filteredFinalCandidates = finalCandidates;

    const hasSkills = allRequiredSkills.length > 0;
    const hasMultipleCriteria = (
      (allRequiredSkills.length > 0 ? 1 : 0) +
      (candidateLocations.length > 0 ? 1 : 0) +
      (candidateDesignations.length > 0 ? 1 : 0) +
      (workExperienceMin !== null ? 1 : 0) +
      (currentSalaryMin !== null ? 1 : 0)
    ) > 1;

    // Only apply title filtering if we have multiple criteria AND no skills (skills override title)
    if (hasStrictCriteria && requirement.title && requirement.title.trim().length > 3 && hasMultipleCriteria && !hasSkills) {
      const titleWords = requirement.title
        .split(/\s+/)
        .filter(word => word.length > 2) // More lenient
        .map(word => word.toLowerCase());

      if (titleWords.length > 0) {
        const titleMatched = finalCandidates.filter(candidate => {
          const headline = (candidate.headline || '').toLowerCase();
          const designation = (candidate.designation || '').toLowerCase();
          const currentRole = (candidate.current_role || '').toLowerCase();
          const combined = `${headline} ${designation} ${currentRole}`;
          return titleWords.some(keyword => combined.includes(keyword));
        });

        if (titleMatched.length > 0) {
          filteredFinalCandidates = titleMatched;
          console.log(`🎯 TITLE FILTER (lenient): ${titleMatched.length} candidates with title match`);
        } else {
          // No title matches, but keep candidates if they match other criteria
          console.log(`⚠️ TITLE FILTER: No title matches, but keeping ${finalCandidates.length} candidates matching other criteria`);
        }
      }
    } else if (hasSkills) {
      // If skills are specified, title is optional - skills are the primary filter
      console.log(`✅ Skills specified - title matching is optional. Keeping ${finalCandidates.length} candidates with matching skills.`);
    }

    // CRITICAL FIX: Don't double-validate - database query already filtered correctly
    // Only check exclude skills as a final safety net (database query might miss edge cases)
    const excludeSkillsForValidation = metadata.excludeSkills || requirement.excludeSkills || [];
    if (filteredFinalCandidates.length > 0 && Array.isArray(excludeSkillsForValidation) && excludeSkillsForValidation.length > 0 && excludeSkillsForValidation.filter(s => s).length > 0) {
      const beforeCount = filteredFinalCandidates.length;
      filteredFinalCandidates = filteredFinalCandidates.filter(candidate => {
        const candidateSkills = [
          ...(candidate.skills || []),
          ...(candidate.key_skills || []),
          candidate.headline || '',
          candidate.summary || ''
        ].join(' ').toLowerCase();

        return !excludeSkillsForValidation.filter(s => s).some(skill =>
          candidateSkills.includes(skill.toLowerCase())
        );
      });

      const removedCount = beforeCount - filteredFinalCandidates.length;
      if (removedCount > 0) {
        console.log(`⚠️  Removed ${removedCount} candidates with excluded skills (final safety check)`);
      }
    }

    // CRITICAL: Apply CURRENT DESIGNATION matching with work experience (LENIENT)
    // If currentDesignation is specified, match against work experience titles (most accurate)
    const currentDesignationForFilter = metadata.currentDesignation || requirement.currentDesignation || null;
    if (currentDesignationForFilter && filteredFinalCandidates.length > 0) {
      // This will be applied after work experience is fetched
      // For now, we'll do a lenient match on user table fields
      // Work experience matching will happen after we fetch work experience data
      console.log(`🔍 Current Designation filter will be applied with work experience matching: ${currentDesignationForFilter}`);
    }

    console.log(`✅ Final candidate count after all filters: ${filteredFinalCandidates.length}`);

    // Helper function to convert values to arrays
    const toArray = (value, fallback = []) => {
      if (Array.isArray(value)) return value;
      if (!value) return fallback;
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        return Array.isArray(parsed) ? parsed : fallback;
      } catch (_) {
        return fallback;
      }
    };

    // Fetch education details and work experience for all candidates
    const allCandidateIds = filteredFinalCandidates.map(c => c.id);
    const { Education } = require('../config/index');
    let educationMap = new Map();
    let workExperienceMap = new Map(); // Map of userId -> work experiences

    if (allCandidateIds.length > 0) {
      try {
        // Fetch education using raw query with snake_case column names
        const educationResults = await sequelize.query(`
          SELECT 
            id,
            user_id,
            degree,
            institution,
            field_of_study,
            start_date,
            end_date,
            is_current,
            location,
            gpa as cgpa,
            percentage,
            grade,
            relevant_courses
          FROM educations 
          WHERE user_id IN (:allCandidateIds)
          ORDER BY user_id, is_current DESC, end_date DESC NULLS LAST
        `, {
          replacements: { allCandidateIds },
          type: QueryTypes.SELECT
        });

        // Group education by user_id
        educationResults.forEach((edu) => {
          const userId = edu.user_id;
          if (!educationMap.has(userId)) {
            educationMap.set(userId, []);
          }
          // Parse relevant_courses if it's a JSON string
          let relevantCourses = [];
          if (edu.relevant_courses) {
            if (typeof edu.relevant_courses === 'string') {
              try {
                relevantCourses = JSON.parse(edu.relevant_courses);
              } catch (e) {
                relevantCourses = [];
              }
            } else if (Array.isArray(edu.relevant_courses)) {
              relevantCourses = edu.relevant_courses;
            }
          }

          educationMap.get(userId).push({
            id: edu.id,
            degree: edu.degree,
            institution: edu.institution,
            fieldOfStudy: edu.field_of_study,
            startDate: edu.start_date,
            endDate: edu.end_date,
            isCurrent: edu.is_current || false,
            location: edu.location,
            cgpa: edu.cgpa,
            percentage: edu.percentage,
            grade: edu.grade,
            relevantCourses: relevantCourses
          });
        });
      } catch (eduError) {
        console.warn('⚠️ Could not fetch education details:', eduError?.message || eduError);
      }

      // Fetch work experience for all candidates to get current/previous company info
      // CRITICAL: Fetch ALL work experiences to accurately determine current/previous company
      try {
        const workExpResults = await sequelize.query(`
          SELECT 
            id,
            user_id,
            title,
            company,
            is_current,
            start_date,
            end_date,
            description
          FROM work_experiences 
          WHERE user_id IN (:allCandidateIds)
          ORDER BY user_id, is_current DESC, start_date DESC
        `, {
          replacements: { allCandidateIds },
          type: QueryTypes.SELECT
        });

        // Group work experience by user_id and extract currentDesignation from description
        workExpResults.forEach((exp) => {
          const userId = exp.user_id;
          if (!workExperienceMap.has(userId)) {
            workExperienceMap.set(userId, []);
          }

          // Extract currentDesignation from description if present
          // Format: "Designation: {currentDesignation}\n\n{description}"
          let currentDesignation = null;
          let description = exp.description || '';

          if (description && description.startsWith('Designation: ')) {
            const lines = description.split('\n\n');
            const designationLine = lines[0];
            currentDesignation = designationLine.replace('Designation: ', '').trim();
            // Keep the rest of description for potential future use
            description = lines.slice(1).join('\n\n');
          }

          workExperienceMap.get(userId).push({
            ...exp,
            currentDesignation: currentDesignation || null,
            description: description || null
          });
        });

        console.log(`✅ Fetched work experience for ${workExperienceMap.size} candidates`);
      } catch (weError) {
        console.warn('⚠️ Could not fetch work experience for company info:', weError?.message || weError);
      }
    }

    // CRITICAL: Apply CURRENT DESIGNATION matching with work experience (LENIENT)
    // Match against work experience titles where is_current = true (most accurate)
    if (currentDesignationForFilter && filteredFinalCandidates.length > 0 && workExperienceMap.size > 0) {
      const beforeCount = filteredFinalCandidates.length;
      const designationLower = currentDesignationForFilter.toLowerCase().trim();

      filteredFinalCandidates = filteredFinalCandidates.filter(candidate => {
        // First check user table fields (already done in query, but keep for safety)
        const userFieldsMatch =
          (candidate.designation && candidate.designation.toLowerCase().includes(designationLower)) ||
          (candidate.headline && candidate.headline.toLowerCase().includes(designationLower)) ||
          (candidate.current_role && candidate.current_role.toLowerCase().includes(designationLower));

        if (userFieldsMatch) {
          return true; // Already matched in query
        }

        // Check work experience titles (most accurate - prioritize is_current = true)
        const candidateWorkExps = workExperienceMap.get(candidate.id) || [];
        if (candidateWorkExps.length > 0) {
          // First check current work experience (is_current = true)
          const currentExp = candidateWorkExps.find(exp =>
            exp.is_current === true ||
            exp.is_current === 'true' ||
            exp.is_current === 1 ||
            String(exp.is_current).toLowerCase() === 'true'
          );

          if (currentExp && currentExp.title) {
            const titleLower = currentExp.title.toLowerCase();
            if (titleLower.includes(designationLower) || designationLower.includes(titleLower)) {
              return true; // Match found in current work experience title
            }
          }

          // Also check all work experiences for lenient matching
          const anyExpMatch = candidateWorkExps.some(exp => {
            if (exp.title) {
              const titleLower = exp.title.toLowerCase();
              return titleLower.includes(designationLower) || designationLower.includes(titleLower);
            }
            return false;
          });

          if (anyExpMatch) {
            return true; // Match found in any work experience title
          }
        }

        return false; // No match found
      });

      const removedCount = beforeCount - filteredFinalCandidates.length;
      if (removedCount > 0) {
        console.log(`🎯 Current Designation filter (work experience): Removed ${removedCount} candidates, kept ${filteredFinalCandidates.length} with matching designation`);
      } else {
        console.log(`✅ Current Designation filter (work experience): All ${filteredFinalCandidates.length} candidates match designation`);
      }
    }

    // Helper function to format education
    const formatEducation = (candidate) => {
      const educations = educationMap.get(candidate.id) || [];
      if (educations.length > 0) {
        const firstEdu = educations[0];
        const parts = [];
        if (firstEdu.degree) parts.push(firstEdu.degree);
        if (firstEdu.institution && firstEdu.institution !== 'Not specified') parts.push(firstEdu.institution);
        return parts.length > 0 ? parts.join(' - ') : 'Not specified';
      }
      if (candidate.highest_education) {
        return candidate.highest_education;
      }
      if (candidate.education && Array.isArray(candidate.education) && candidate.education.length > 0) {
        return candidate.education.map((edu) => edu.degree || edu.course).join(', ');
      }
      return 'Not specified';
    };

    // Helper function to combine skills
    const combineSkills = (candidate) => {
      const skills = toArray(candidate.skills, []);
      const keySkills = toArray(candidate.key_skills, []);
      const allSkills = [...new Set([...skills, ...keySkills])];
      return allSkills.filter(s => s && String(s).trim() !== '');
    };

    // Prepare requirement data for relevance scoring (use extracted values from metadata)
    const reqDataForScoring = {
      skills: requirement.skills || [],
      keySkills: requirement.keySkills || [],
      candidateLocations: candidateLocations,
      candidateDesignations: candidateDesignations,
      workExperienceMin: workExperienceMin,
      workExperienceMax: workExperienceMax,
      currentSalaryMin: currentSalaryMin,
      currentSalaryMax: currentSalaryMax,
      education: education,
      institute: institute,
      currentCompany: currentCompany,
      noticePeriod: noticePeriod,
      includeWillingToRelocate: includeWillingToRelocate,
      title: requirement.title
    };

    // Transform candidates data for frontend with relevance scoring and ATS scores
    const transformedCandidates = filteredFinalCandidates.map(candidate => {
      const { score, matchReasons } = calculateRelevanceScore(candidate, reqDataForScoring);
      const atsData = atsScoresMap[candidate.id];

      // Only include ATS score if it matches the current requirement
      const validAtsData = atsData && atsData.requirementId === id ? atsData : null;

      // Debug: Log ATS data for specific candidates
      if (candidate.id === '4200f403-25dc-4aa6-bcc9-1363adf0ee7b' || candidate.id === '10994ba4-1e33-45c3-b522-2f56a873e1e2') {
        console.log(`🔍 Candidate ${candidate.id} (${candidate.first_name} ${candidate.last_name}) ATS data:`, {
          atsData: atsData,
          validAtsData: validAtsData,
          currentRequirementId: id,
          atsRequirementId: atsData ? atsData.requirementId : 'none',
          atsScore: validAtsData ? validAtsData.score : null,
          atsCalculatedAt: validAtsData ? validAtsData.lastCalculated : null
        });
      }

      // Get current and previous company from work experience
      // CRITICAL: Always prioritize work experience data (most accurate and up-to-date)
      const candidateWorkExps = workExperienceMap.get(candidate.id) || [];
      let currentCompany = null;
      let currentDesignation = null;
      let previousCompany = null;

      // Extract from work experience - prioritize is_current = true
      if (candidateWorkExps.length > 0) {
        // First, try to find experience with is_current = true (boolean or string 'true')
        const currentExp = candidateWorkExps.find(exp =>
          exp.is_current === true ||
          exp.is_current === 'true' ||
          exp.is_current === 1 ||
          String(exp.is_current).toLowerCase() === 'true'
        );

        if (currentExp && currentExp.company) {
          // Always use work experience data if current experience exists
          currentCompany = currentExp.company;
          // CRITICAL: Use currentDesignation from description if available, otherwise use title
          // currentDesignation is extracted from description field in the format "Designation: {currentDesignation}\n\n{description}"
          currentDesignation = (currentExp.currentDesignation && currentExp.currentDesignation.trim())
            ? currentExp.currentDesignation.trim()
            : (currentExp.title || null);
          console.log(`✅ Candidate ${candidate.id}: Using work experience - Company: ${currentCompany}, Designation: ${currentDesignation} (from ${currentExp.currentDesignation ? 'currentDesignation field' : 'title'})`);
        } else {
          // Fallback: use first experience if no current experience marked (sorted by start_date DESC)
          const firstExp = candidateWorkExps[0];
          if (firstExp && firstExp.company) {
            currentCompany = firstExp.company;
            // CRITICAL: Use currentDesignation from description if available, otherwise use title
            currentDesignation = (firstExp.currentDesignation && firstExp.currentDesignation.trim())
              ? firstExp.currentDesignation.trim()
              : (firstExp.title || null);
            console.log(`⚠️ Candidate ${candidate.id}: No current experience marked, using first experience - Company: ${currentCompany}, Designation: ${currentDesignation}`);
          }
        }

        // Get previous company (first non-current experience, sorted by start_date DESC)
        const previousExps = candidateWorkExps.filter(exp =>
          exp.is_current === false ||
          exp.is_current === 'false' ||
          exp.is_current === 0 ||
          String(exp.is_current).toLowerCase() === 'false' ||
          (exp.is_current !== true && exp.is_current !== 'true' && exp.is_current !== 1)
        );
        if (previousExps.length > 0) {
          // Sort by start_date DESC to get most recent previous company
          previousExps.sort((a, b) => {
            const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
            const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
            return dateB - dateA;
          });
          previousCompany = previousExps[0].company || null;
        }
      }

      // Fallback to user table fields only if no work experience found
      if (!currentCompany) {
        currentCompany = candidate.current_company || null;
      }
      if (!currentDesignation) {
        currentDesignation = candidate.current_role || candidate.designation || candidate.headline || null;
      }

      return {
        id: candidate.id,
        name: `${candidate.first_name} ${candidate.last_name}`,
        designation: candidate.designation || candidate.headline || 'Job Seeker',
        currentDesignation: currentDesignation,
        experience: candidate.experience_years ? `${candidate.experience_years} years` : 'Not specified',
        experienceYears: candidate.experience_years ? Number(candidate.experience_years) : null,
        location: candidate.current_location || 'Not specified',
        education: formatEducation(candidate),
        educationDetails: educationMap.get(candidate.id) || [],
        keySkills: combineSkills(candidate),
        preferredLocations: candidate.preferred_locations && candidate.preferred_locations.length > 0 ?
          candidate.preferred_locations :
          (candidate.willing_to_relocate ? ['Open to relocate'] : [candidate.current_location]),
        avatar: candidate.avatar || '/placeholder.svg?height=80&width=80',
        isAttached: true,
        lastModified: candidate.last_profile_update ?
          new Date(candidate.last_profile_update).toLocaleDateString() : 'Not specified',
        activeStatus: candidate.last_login_at ?
          new Date(candidate.last_login_at).toLocaleDateString() : 'Not specified',
        additionalInfo: candidate.summary || 'No summary available',
        phoneVerified: candidate.is_phone_verified || false,
        emailVerified: candidate.is_email_verified || false,
        currentSalary: candidate.current_salary ? `${candidate.current_salary} LPA` : 'Not specified',
        expectedSalary: candidate.expected_salary ? `${candidate.expected_salary} LPA` : 'Not specified',
        noticePeriod: candidate.notice_period ? `${candidate.notice_period} days` : 'Not specified',
        profileCompletion: candidate.profile_completion || 0,
        currentCompany: currentCompany,
        previousCompany: previousCompany,
        relevanceScore: score,
        matchReasons: matchReasons,
        atsScore: validAtsData ? validAtsData.score : null,
        atsCalculatedAt: validAtsData ? validAtsData.lastCalculated : null
      };
    });

    // Debug: Log final transformed candidates with ATS scores
    console.log('🔍 Final transformed candidates with ATS scores:');
    transformedCandidates.forEach(candidate => {
      if (candidate.id === '4200f403-25dc-4aa6-bcc9-1363adf0ee7b' || candidate.id === '10994ba4-1e33-45c3-b522-2f56a873e1e2') {
        console.log(`  - ${candidate.name} (${candidate.id}): ATS Score ${candidate.atsScore} (${candidate.atsCalculatedAt})`);
      }
    });

    // Enrich transformed candidates with like counts, current employer like status, and viewed status
    try {
      const candidateIds = transformedCandidates.map(c => c.id);
      if (candidateIds.length > 0) {
        const counts = await CandidateLike.findAll({
          attributes: ['candidate_id', [sequelize.fn('COUNT', sequelize.col('id')), 'cnt']],
          where: { candidate_id: candidateIds },
          group: ['candidate_id']
        });
        const idToCount = new Map(counts.map(r => [r.get('candidate_id'), parseInt(String(r.get('cnt')))]));

        const liked = await CandidateLike.findAll({
          attributes: ['candidate_id'],
          where: { employer_id: req.user.id, candidate_id: candidateIds }
        });
        const likedSet = new Set(liked.map(r => r.get('candidate_id')));

        // Get requirement-specific saved candidates
        const savedForRequirement = await CandidateLike.findAll({
          attributes: ['candidate_id'],
          where: { employer_id: req.user.id, candidate_id: candidateIds, requirement_id: id }
        });
        const savedSet = new Set(savedForRequirement.map(r => r.get('candidate_id')));

        // Check which candidates have been viewed by this employer FOR THIS REQUIREMENT
        // CRITICAL: Only mark as viewed if viewed from THIS requirement
        // NOTE: Use camelCase in where clause (Sequelize maps to snake_case columns)
        // For attributes with raw: true, use sequelize.col() to reference database columns
        const { ViewTracking } = require('../config/index');
        const viewedCandidates = await ViewTracking.findAll({
          attributes: [[sequelize.literal('"ViewTracking"."viewed_user_id"'), 'viewed_user_id']], // Use literal for raw queries
          where: {
            viewerId: req.user.id, // Use camelCase - Sequelize maps to viewer_id
            viewedUserId: { [Op.in]: candidateIds }, // Use camelCase - Sequelize maps to viewed_user_id
            viewType: 'profile_view', // Use camelCase - Sequelize maps to view_type
            [Op.or]: [
              // NOTE: Don't check jobId for requirements - it references jobs table, not requirements
              // Check metadata.requirementId instead (below)
              sequelize.where(
                sequelize.cast(sequelize.col('metadata'), 'text'),
                { [Op.iLike]: `%"requirementId":"${id}"%` }
              ), // Or requirementId in metadata
              sequelize.where(
                sequelize.cast(sequelize.col('metadata'), 'text'),
                { [Op.iLike]: `%"requirementId": "${id}"%` }
              ) // Or requirementId with space
            ]
          },
          raw: true // Returns snake_case column names
        });
        // Map results using snake_case (raw: true returns database column names directly)
        const viewedSet = new Set(viewedCandidates.map(v => v.viewed_user_id));
        console.log(`✅ Found ${viewedCandidates.length} candidates viewed for requirement ${id}`);

        transformedCandidates.forEach(c => {
          c.likeCount = idToCount.get(c.id) || 0;
          c.likedByCurrent = likedSet.has(c.id);
          c.isSaved = savedSet.has(c.id); // Use requirement-specific saved state
          c.isViewed = viewedSet.has(c.id); // Mark as viewed if profile was viewed
        });
      }
    } catch (likeErr) {
      console.warn('Failed to enrich candidates with like/viewed data:', likeErr?.message || likeErr);
    }

    // Sort candidates based on sortBy parameter from query
    const sortByOption = sortBy || 'relevance';

    if (sortByOption === 'ats' || sortByOption === 'ats:desc') {
      // Sort by ATS score (highest first), nulls last
      console.log('🔄 Sorting by ATS score (descending)');
      console.log('📊 Candidates before ATS sort:', transformedCandidates.map(c => ({ name: c.name, atsScore: c.atsScore })));

      transformedCandidates.sort((a, b) => {
        if (a.atsScore === null && b.atsScore === null) return 0;
        if (a.atsScore === null) return 1;
        if (b.atsScore === null) return -1;
        return b.atsScore - a.atsScore;
      });

      console.log('📊 Candidates after ATS sort:', transformedCandidates.map(c => ({ name: c.name, atsScore: c.atsScore })));
    } else if (sortByOption === 'ats:asc') {
      // Sort by ATS score (lowest first), nulls last
      transformedCandidates.sort((a, b) => {
        if (a.atsScore === null && b.atsScore === null) return 0;
        if (a.atsScore === null) return 1;
        if (b.atsScore === null) return -1;
        return a.atsScore - b.atsScore;
      });
    } else {
      // Default: Sort by relevance score (highest first)
      transformedCandidates.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    // Log final results summary
    console.log('\n📊 ========== CANDIDATE MATCHING SUMMARY ==========');
    console.log(`📌 Requirement: ${requirement.title} (ID: ${requirement.id})`);
    console.log(`📌 Applied Filters: ${appliedFilters.length > 0 ? appliedFilters.join(' | ') : 'None (showing all active jobseekers)'}`);
    const finalCountForLogging = filteredFinalCandidates.length;
    console.log(`📌 Total Candidates Found: ${finalCountForLogging}`);
    console.log(`📌 Page ${pageNum} of ${Math.ceil(finalCountForLogging / limitNum)}`);
    console.log(`📌 Showing: ${transformedCandidates.length} candidates`);
    console.log(`📌 Fallback Applied: ${fallbackApplied ? 'Yes (relaxed filters)' : 'No (strict matching)'}`);
    console.log(`📌 Top 5 Candidates by Relevance:`);
    transformedCandidates.slice(0, 5).forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} - Relevance: ${c.relevanceScore}% - ATS: ${c.atsScore || 'N/A'}`);
    });
    console.log('==================================================\n');

    // Calculate accessed candidates count for the current filtered list
    let accessedCount = 0;
    try {
      const { ViewTracking } = require('../config/index');

      if (filteredFinalCandidates.length > 0) {
        const candidateIds = filteredFinalCandidates.map(c => c.id);

        // Count distinct profile views for these candidates by this employer
        const result = await ViewTracking.count({
          where: {
            viewerId: req.user.id,
            viewedUserId: { [Op.in]: candidateIds },
            viewType: 'profile_view'
          },
          distinct: true,
          col: 'viewedUserId'
        });

        accessedCount = result || 0;
        console.log(`📌 Accessed Candidates (Filtered): ${accessedCount}`);
      }
    } catch (metricError) {
      console.warn('⚠️ Failed to count accessed candidates:', metricError.message);
      // Default to 0 on error
    }

    const finalCountForResponse = filteredFinalCandidates.length;
    return res.status(200).json({
      success: true,
      data: {
        candidates: transformedCandidates,
        requirement: {
          id: requirement.id,
          title: requirement.title,
          totalCandidates: finalCountForResponse, // Total count of all matching candidates
          appliedFilters: appliedFilters,
          fallbackApplied: fallbackApplied,
          accessedCandidates: accessedCount
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: finalCountForResponse, // Total count of all matching candidates (not just this page)
          pages: Math.ceil(finalCountForResponse / limitNum),
          showing: transformedCandidates.length // Count of candidates on this page
        },
        metadata: {
          sortBy: sortByOption,
          filtersApplied: appliedFilters.length,
          strictMatches: finalCountForResponse,
          relaxedMatches: fallbackApplied ? (finalCandidates.length - candidates.length) : 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching candidates for requirement:', error);
    console.error('❌ Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      errors: error?.errors
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch candidates',
      error: {
        name: error?.name,
        message: error?.message,
        details: error?.errors || error?.stack
      }
    });
  }
});

// Get detailed candidate profile
router.get('/:requirementId/candidates/:candidateId', authenticateToken, async (req, res) => {
  try {
    const { requirementId, candidateId } = req.params;

    // Check if user is an employer or admin
    if (req.user.user_type !== 'employer' && req.user.user_type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Only employers and admins can view candidate profiles.' });
    }

    // Check if requirement exists (more flexible check)
    console.log(`🔍 Looking for requirement ${requirementId}`);
    const requirement = await Requirement.findOne({
      where: { id: requirementId }
    });

    if (!requirement) {
      console.log(`❌ Requirement not found: ${requirementId}`);
      return res.status(404).json({
        success: false,
        message: 'Requirement not found'
      });
    }

    // Log requirement details for debugging
    console.log(`✅ Requirement found: ${requirement.title} (Company: ${requirement.companyId})`);

    console.log('🔍 Fetching detailed profile for candidate:', candidateId);

    // Get candidate details
    const candidate = await User.findOne({
      where: {
        id: candidateId,
        user_type: 'jobseeker',
        is_active: true,
        account_status: 'active'
      },
      attributes: [
        'id', 'first_name', 'last_name', 'email', 'phone', 'avatar',
        'current_location', 'headline', 'summary', 'skills', 'key_skills', 'languages',
        'current_salary', 'expected_salary', 'notice_period', 'willing_to_relocate',
        'profile_completion', 'last_login_at', 'last_profile_update',
        'is_email_verified', 'is_phone_verified', 'created_at',
        'date_of_birth', 'gender', 'social_links', 'certifications',
        'highest_education', 'field_of_study', 'experience_years',
        'current_company', 'current_role', 'designation'
      ]
    });

    if (!candidate) {
      console.log(`❌ Candidate not found: ${candidateId}`);
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
        details: 'The candidate either does not exist or is not active'
      });
    }

    // Get work experience using raw query with correct column names
    let workExperience = [];
    try {
      // Use snake_case column names (actual database columns)
      const workExpResults = await sequelize.query(`
        SELECT 
          id,
          user_id,
          title,
          company,
          description,
          start_date,
          end_date,
          is_current,
          location,
          employment_type,
          skills,
          achievements,
          salary,
          salary_currency
        FROM work_experiences 
        WHERE user_id = :userId 
        ORDER BY is_current DESC, start_date DESC
      `, {
        replacements: { userId: candidateId },
        type: QueryTypes.SELECT
      });
      workExperience = workExpResults || [];

      console.log(`💼 Found ${workExperience.length} work experience entries for candidate ${candidateId}`);
      if (workExperience.length > 0) {
        console.log('💼 Sample work experience:', JSON.stringify(workExperience[0], null, 2));
      }
    } catch (expError) {
      console.error('⚠️ Could not fetch work experience:', expError);
      console.error('⚠️ Work experience error details:', expError.message, expError.stack);
      workExperience = [];
    }

    // Get education details using raw query with correct column names
    let education = [];
    try {
      // Use snake_case column names (actual database columns)
      const eduResults = await sequelize.query(`
        SELECT 
          id,
          user_id,
          degree,
          institution,
          field_of_study,
          start_date,
          end_date,
          is_current,
          location,
          grade,
          percentage,
          gpa as cgpa,
          description,
          relevant_courses,
          achievements,
          education_type
        FROM educations 
        WHERE user_id = :userId 
        ORDER BY is_current DESC, end_date DESC
      `, {
        replacements: { userId: candidateId },
        type: QueryTypes.SELECT
      });
      education = eduResults || [];

      console.log(`🎓 Found ${education.length} education entries for candidate ${candidateId}`);
      if (education.length > 0) {
        console.log('🎓 Sample education:', JSON.stringify(education[0], null, 2));
      }
    } catch (eduError) {
      console.error('⚠️ Could not fetch education:', eduError);
      console.error('⚠️ Education error details:', eduError.message, eduError.stack);
      education = [];
    }

    // Get resumes using raw query with correct column names
    let resumes = [];
    try {
      const resumeResults = await sequelize.query(`
            SELECT 
              id,
              user_id as "userId",
              title,
              summary,
          is_primary as "isDefault",
          is_public as "isPublic",
          view_count as "views",
          download_count as "downloads",
          updated_at as "lastUpdated",
          created_at as "createdAt",
          metadata,
          file_url as "fileUrl",
          file_type as "fileType",
          file_size as "fileSize",
          skills
            FROM resumes 
            WHERE user_id = :userId 
        ORDER BY is_primary DESC, created_at DESC
          `, {
        replacements: { userId: candidateId },
        type: QueryTypes.SELECT
      });

      resumes = resumeResults || [];
      console.log(`📄 Found ${resumes.length} resumes for candidate ${candidateId}`);
      if (resumes.length > 0) {
        console.log('📄 Sample resume data:', JSON.stringify(resumes[0], null, 2));
      }
    } catch (resumeError) {
      console.log('⚠️ Could not fetch resumes:', resumeError.message);
      resumes = [];
    }

    // Fetch cover letters for the candidate
    let coverLetters = [];
    try {
      console.log(`📝 Fetching cover letters for candidate ${candidateId}`);
      const { CoverLetter } = require('../config/index');

      // Use raw queries to be resilient to column naming differences
      let coverLetterResults = await sequelize.query(`
        SELECT 
          id,
          "userId",
          title,
          content,
          summary,
          "isDefault",
          "isPublic",
          views,
          downloads,
          "lastUpdated",
          metadata,
          "createdAt",
          "updatedAt"
        FROM cover_letters 
        WHERE "userId" = :userId 
        ORDER BY "isDefault" DESC, "lastUpdated" DESC
      `, {
        replacements: { userId: candidateId },
        type: QueryTypes.SELECT
      });
      if (!coverLetterResults || coverLetterResults.length === 0) {
        const alt = await sequelize.query(`
          SELECT 
            id,
            user_id as "userId",
            title,
            content,
            summary,
            "isDefault",
            "isPublic",
            views,
            downloads,
            last_updated as "lastUpdated",
            metadata,
            createdAt as "createdAt",
            updatedAt as "updatedAt"
          FROM cover_letters 
          WHERE user_id = :userId 
          ORDER BY "isDefault" DESC, "lastUpdated" DESC
        `, {
          replacements: { userId: candidateId },
          type: QueryTypes.SELECT
        });
        coverLetterResults = alt || [];
      }
      coverLetters = coverLetterResults || [];
      console.log(`📝 Found ${coverLetters.length} cover letters for candidate ${candidateId}`);
      if (coverLetters.length > 0) {
        console.log(`📝 First cover letter metadata:`, JSON.stringify(coverLetters[0].metadata, null, 2));
      }
    } catch (coverLetterError) {
      console.log('⚠️ Could not fetch cover letters (primary query):', coverLetterError.message);
      try {
        const coverLetterResults = await sequelize.query(`
          SELECT 
            id,
            user_id as "userId",
            title,
            content,
            summary,
            "isDefault",
            "isPublic",
            views,
            downloads,
            last_updated as "lastUpdated",
            createdAt as "createdAt",
            metadata
          FROM cover_letters 
          WHERE user_id = :userId 
          ORDER BY "isDefault" DESC, "lastUpdated" DESC
        `, {
          replacements: { userId: candidateId },
          type: QueryTypes.SELECT
        });
        coverLetters = coverLetterResults || [];
        console.log(`📝 Found ${coverLetters.length} cover letters for candidate ${candidateId} (fallback)`);
      } catch (altError) {
        console.log('⚠️ Could not fetch cover letters (fallback query):', altError.message);
      }
    }

    console.log(`✅ Found detailed profile for candidate: ${candidate.first_name} ${candidate.last_name}`);
    console.log(`📄 Resumes found: ${resumes.length}`);
    console.log(`📝 Cover letters found: ${coverLetters.length}`);
    if (resumes.length > 0) {
      console.log(`📄 First resume metadata:`, JSON.stringify(resumes[0].metadata, null, 2));
      console.log(`📄 First resume full data:`, JSON.stringify(resumes[0], null, 2));
    }
    if (coverLetters.length > 0) {
      console.log(`📝 First cover letter metadata:`, JSON.stringify(coverLetters[0].metadata, null, 2));
    }

    // Build absolute URL helper for files served from /uploads
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const toAbsoluteUrl = (maybePath) => {
      if (!maybePath) return null;
      // If it's already an absolute URL, return as is
      if (typeof maybePath === 'string' && /^https?:\/\//i.test(maybePath)) {
        return maybePath;
      }
      // Ensure leading slash
      const pathStr = String(maybePath).startsWith('/') ? String(maybePath) : `/${String(maybePath)}`;
      return `${baseUrl}${pathStr}`;
    };

    // Helpers to make transformations resilient
    const toArray = (value, fallback = []) => {
      if (Array.isArray(value)) return value;
      if (!value) return fallback;
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        return Array.isArray(parsed) ? parsed : fallback;
      } catch (_) {
        return fallback;
      }
    };
    const safeDateString = (value, defaultLabel = 'Not specified') => {
      if (!value) return defaultLabel;
      const d = new Date(value);
      return isNaN(d.getTime()) ? defaultLabel : d.toLocaleDateString();
    };
    const getProp = (obj, key, defaultVal = null) => (obj && obj[key] !== undefined && obj[key] !== null ? obj[key] : defaultVal);

    // Transform candidate data for frontend
    let transformedCandidate;
    try {
      console.log(`🔄 Starting candidate transformation for ${candidate.first_name} ${candidate.last_name}`);
      console.log(`🔄 Resumes to transform: ${resumes.length}`);
      // Calculate total experience from workExperience array or use experience_years
      const calculateTotalExperience = () => {
        // First try to use experience_years from database
        if (candidate.experience_years !== null && candidate.experience_years !== undefined) {
          const expYears = Number(candidate.experience_years);
          if (!isNaN(expYears) && expYears >= 0) {
            return expYears;
          }
        }

        // Fallback: Calculate from workExperience array
        if (Array.isArray(workExperience) && workExperience.length > 0) {
          let totalMonths = 0;
          workExperience.forEach((exp) => {
            const startDate = exp.start_date;
            const endDate = exp.end_date;
            const isCurrent = exp.is_current || false;

            if (startDate) {
              try {
                const start = new Date(startDate);
                const end = isCurrent ? new Date() : (endDate ? new Date(endDate) : new Date());
                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                  totalMonths += Math.max(0, months);
                }
              } catch (e) {
                // Ignore invalid dates
              }
            }
          });
          return Math.round((totalMonths / 12) * 10) / 10; // Round to 1 decimal place
        }

        return 0;
      };

      const totalExperienceYears = calculateTotalExperience();
      const experienceDisplay = totalExperienceYears > 0
        ? `${totalExperienceYears} ${totalExperienceYears === 1 ? 'year' : 'years'}`
        : 'Fresher';

      // Format current salary properly
      const formatCurrentSalary = () => {
        if (candidate.current_salary !== null && candidate.current_salary !== undefined) {
          const salary = Number(candidate.current_salary);
          if (!isNaN(salary) && salary > 0) {
            return `${salary} LPA`;
          }
        }
        return 'Not specified';
      };

      transformedCandidate = {
        id: candidate.id,
        name: `${candidate.first_name} ${candidate.last_name}`,
        designation: candidate.headline || candidate.designation || 'Job Seeker',
        experience: experienceDisplay,
        experienceYears: totalExperienceYears, // Add numeric value for calculations and display
        location: candidate.current_location || 'Not specified',
        education: (() => {
          // Get education from education array or highest_education field
          if (Array.isArray(education) && education.length > 0) {
            const firstEdu = education[0];
            return firstEdu.degree || firstEdu.course || firstEdu.fieldOfStudy || 'Not specified';
          }
          if (candidate.highest_education) {
            return candidate.highest_education;
          }
          return 'Not specified';
        })(),
        keySkills: (() => {
          // Combine skills and key_skills arrays
          const skills = toArray(candidate.skills, []);
          const keySkills = toArray(candidate.key_skills, []);
          // Merge and remove duplicates
          const allSkills = [...new Set([...skills, ...keySkills])];
          return allSkills.filter(s => s && String(s).trim() !== '');
        })(),
        preferredLocations: (() => {
          const prefLocs = toArray(candidate.preferred_locations, []);
          if (prefLocs.length > 0) return prefLocs;
          if (candidate.willing_to_relocate) return ['Open to relocate'];
          return [candidate.current_location || 'Not specified'];
        })(),
        avatar: candidate.avatar || '/placeholder.svg?height=120&width=120',
        isAttached: true,
        lastModified: safeDateString(candidate.last_profile_update),
        activeStatus: safeDateString(candidate.last_login_at),
        additionalInfo: candidate.summary || 'No summary available',
        phoneVerified: candidate.is_phone_verified || false,
        emailVerified: candidate.is_email_verified || false,
        currentSalary: formatCurrentSalary(),
        expectedSalary: candidate.expected_salary ? `${candidate.expected_salary} LPA` : 'Not specified',
        noticePeriod: candidate.notice_period ? `${candidate.notice_period} days` : 'Not specified',
        profileCompletion: candidate.profile_completion || 0,

        // Contact information
        email: candidate.email,
        phone: candidate.phone,
        linkedin: getProp(candidate.social_links || {}, 'linkedin', null),
        github: getProp(candidate.social_links || {}, 'github', null),
        portfolio: getProp(candidate.social_links || {}, 'portfolio', null),

        // Detailed information
        about: candidate.summary || 'No summary available',

        // Work experience - use actual database column names from query
        workExperience: toArray(workExperience, []).map(exp => {
          const startDate = exp.start_date;
          const endDate = exp.end_date;
          const isCurrent = exp.is_current || false;
          const startDateStr = startDate ? safeDateString(startDate) : 'Not specified';
          const endDateStr = isCurrent ? 'Present' : (endDate ? safeDateString(endDate) : 'Not specified');

          // Parse skills if it's a JSON string
          let skillsArray = [];
          if (exp.skills) {
            if (typeof exp.skills === 'string') {
              try {
                skillsArray = JSON.parse(exp.skills);
              } catch (e) {
                skillsArray = [exp.skills];
              }
            } else if (Array.isArray(exp.skills)) {
              skillsArray = exp.skills;
            }
          }

          // Parse achievements if it's a JSON string
          let achievementsArray = [];
          if (exp.achievements) {
            if (typeof exp.achievements === 'string') {
              try {
                achievementsArray = JSON.parse(exp.achievements);
              } catch (e) {
                achievementsArray = [];
              }
            } else if (Array.isArray(exp.achievements)) {
              achievementsArray = exp.achievements;
            }
          }

          return {
            id: exp.id || `exp_${Math.random()}`,
            title: exp.title || 'Not specified',
            company: exp.company || 'Not specified',
            duration: `${startDateStr} - ${endDateStr}`,
            startDate: startDate,
            endDate: endDate,
            isCurrent: isCurrent,
            location: exp.location || 'Not specified',
            description: exp.description || '',
            skills: toArray(skillsArray, []),
            employmentType: exp.employment_type || 'full-time',
            salary: exp.salary ? `${exp.salary} ${exp.salary_currency || 'INR'}` : null,
            achievements: toArray(achievementsArray, [])
          };
        }),

        // Education details - include highest_education and field_of_study from user profile
        educationDetails: (() => {
          const eduArray = toArray(education, []);
          // If no education details from educations table but user has highest_education/field_of_study, create entry
          if (eduArray.length === 0 && (candidate.highest_education || candidate.field_of_study)) {
            return [{
              id: 'profile_education',
              degree: candidate.highest_education || 'Not specified',
              institution: 'Not specified',
              fieldOfStudy: candidate.field_of_study || 'Not specified',
              duration: 'Not specified',
              location: 'Not specified',
              grade: null,
              percentage: null,
              cgpa: null
            }];
          }
          return eduArray.map(edu => {
            // Format degree name properly
            const formatDegree = (degreeStr) => {
              if (!degreeStr || degreeStr.toLowerCase() === 'not specified') return '';
              const deg = String(degreeStr).trim();
              const degLower = deg.toLowerCase();

              // Map common variations
              const degreeMappings = {
                'bachelor': "Bachelor's Degree",
                'bachelors': "Bachelor's Degree",
                'btech': 'B.Tech',
                'b.tech': 'B.Tech',
                'be': 'B.E.',
                'b.e.': 'B.E.',
                'bsc': 'B.Sc',
                'b.sc': 'B.Sc',
                'ba': 'B.A.',
                'b.a.': 'B.A.',
                'master': "Master's Degree",
                'masters': "Master's Degree",
                'mtech': 'M.Tech',
                'm.tech': 'M.Tech',
                'me': 'M.E.',
                'm.e.': 'M.E.',
                'msc': 'M.Sc',
                'm.sc': 'M.Sc',
                'ma': 'M.A.',
                'm.a.': 'M.A.',
                'mba': 'MBA',
                'phd': 'Ph.D',
                'ph.d': 'Ph.D',
                'diploma': 'Diploma',
                'certification': 'Certification'
              };

              // Check exact match
              if (degreeMappings[degLower]) {
                return degreeMappings[degLower];
              }

              // Check if contains any key
              for (const [key, value] of Object.entries(degreeMappings)) {
                if (degLower.includes(key)) {
                  return value;
                }
              }

              // Capitalize properly
              return deg.split(' ').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              ).join(' ');
            };

            const degreeValue = edu.degree || candidate.highest_education || '';
            const formattedDegree = formatDegree(degreeValue);
            const institutionValue = edu.institution || '';
            const fieldOfStudyValue = edu.field_of_study || candidate.field_of_study || '';
            const locationValue = edu.location || '';

            // Build duration string
            let startYear = '';
            let endYear = '';
            if (edu.start_date) {
              try {
                const startDate = new Date(edu.start_date);
                if (!isNaN(startDate.getTime())) {
                  startYear = startDate.getFullYear();
                }
              } catch (e) {
                // Ignore invalid dates
              }
            }
            if (edu.end_date) {
              try {
                const endDate = new Date(edu.end_date);
                if (!isNaN(endDate.getTime())) {
                  endYear = endDate.getFullYear();
                }
              } catch (e) {
                // Ignore invalid dates
              }
            } else if (edu.is_current) {
              endYear = 'Present';
            }
            const durationStr = startYear && endYear ? `${startYear} - ${endYear}` : (startYear ? `${startYear} - Present` : '');

            // Parse relevant courses if it's a JSON string
            let relevantCourses = [];
            if (edu.relevant_courses) {
              if (typeof edu.relevant_courses === 'string') {
                try {
                  relevantCourses = JSON.parse(edu.relevant_courses);
                } catch (e) {
                  relevantCourses = [];
                }
              } else if (Array.isArray(edu.relevant_courses)) {
                relevantCourses = edu.relevant_courses;
              }
            }

            return {
              id: edu.id || `edu_${Math.random()}`,
              degree: formattedDegree,
              institution: institutionValue,
              fieldOfStudy: fieldOfStudyValue,
              duration: durationStr,
              location: locationValue,
              grade: edu.grade || null,
              percentage: edu.percentage || null,
              cgpa: edu.cgpa || null,
              relevantCourses: relevantCourses
            };
          });
        })(),

        // Certifications
        certifications: toArray(candidate.certifications, []),

        // Languages
        languages: toArray(candidate.languages, [
          { name: "English", proficiency: "Professional" },
          { name: "Hindi", proficiency: "Native" }
        ]),

        // Resume information - return API endpoints instead of absolute file paths
        resumes: (() => {
          try {
            const resumeArray = toArray(resumes, []);
            console.log(`🔄 Transforming ${resumeArray.length} resumes`);
            console.log(`🔄 First resume before transform - isDefault: ${resumeArray[0]?.isDefault}, is_primary: ${resumeArray[0]?.is_primary}`);
            return resumeArray.map((resume, index) => {
              const metadata = resume.metadata || {};
              const filename = metadata.originalName || metadata.filename || `${candidate.first_name}_${candidate.last_name}_Resume.pdf`;
              const fileSize = metadata.fileSize ? `${(metadata.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Unknown size';
              const viewUrl = `/api/requirements/${requirement.id}/candidates/${candidate.id}/resume/${resume.id}/view`;
              const downloadUrl = `/api/requirements/${requirement.id}/candidates/${candidate.id}/resume/${resume.id}/download`;

              // Determine if this is the default resume - check multiple possible field names
              // Backend orders by is_primary DESC, so first resume (index 0) should be default
              const isDefaultResume = resume.isDefault === true ||
                resume.isDefault === 'true' ||
                resume.is_primary === true ||
                resume.is_primary === 'true' ||
                (index === 0 && resume.is_primary !== false && resume.is_primary !== 'false'); // First resume if ordered by is_primary DESC

              const transformedResume = {
                id: resume.id,
                title: resume.title || 'Resume',
                filename: filename,
                fileSize: fileSize,
                uploadDate: resume.createdAt || resume.created_at,
                lastUpdated: resume.lastUpdated || resume.updated_at,
                isDefault: isDefaultResume, // Use camelCase for frontend
                is_default: isDefaultResume, // Also include snake_case for backward compatibility
                isPublic: resume.isPublic ?? resume.is_public ?? true,
                views: resume.views || resume.view_count || 0,
                downloads: resume.downloads || resume.download_count || 0,
                summary: resume.summary || '',
                skills: resume.skills || [],
                viewUrl,
                downloadUrl,
                fileUrl: downloadUrl,
                metadata: resume.metadata || {}
              };

              console.log(`📄 Transformed resume [${index}]:`, transformedResume.id, 'isDefault:', transformedResume.isDefault);
              return transformedResume;
            });
          } catch (resumeErr) {
            console.error('❌ Resume transformation error:', resumeErr);
            return [];
          }
        })(),

        // Cover letter information - return API endpoints instead of absolute file paths
        coverLetters: (() => {
          try {
            const coverLetterArray = toArray(coverLetters, []);
            console.log(`🔄 Transforming ${coverLetterArray.length} cover letters`);
            return coverLetterArray.map(coverLetter => {
              const metadata = coverLetter.metadata || {};
              const filename = metadata.originalName || metadata.filename || `${candidate.first_name}_${candidate.last_name}_CoverLetter.pdf`;
              const fileSize = metadata.fileSize ? `${(metadata.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Unknown size';
              const downloadUrl = `/api/cover-letters/${coverLetter.id}/download`;

              const transformedCoverLetter = {
                id: coverLetter.id,
                title: coverLetter.title || 'Cover Letter',
                content: coverLetter.content || '',
                summary: coverLetter.summary || '',
                filename: filename,
                fileSize: fileSize,
                uploadDate: coverLetter.createdAt || coverLetter.createdAt,
                lastUpdated: coverLetter.lastUpdated || coverLetter.last_updated,
                is_default: coverLetter.isDefault ?? coverLetter.is_default ?? false,
                isPublic: coverLetter.isPublic ?? coverLetter.is_public ?? true,
                downloadUrl,
                fileUrl: downloadUrl,
                metadata: metadata
              };

              console.log(`📝 Transformed cover letter:`, transformedCoverLetter);
              return transformedCoverLetter;
            });
          } catch (coverLetterErr) {
            console.error('❌ Cover letter transformation error:', coverLetterErr);
            return [];
          }
        })()
      };

      console.log(`📄 Transformed candidate resumes:`, JSON.stringify(transformedCandidate.resumes, null, 2));
      console.log(`📝 Transformed candidate cover letters:`, JSON.stringify(transformedCandidate.coverLetters, null, 2));
    } catch (transformErr) {
      console.warn('⚠️ Candidate transform failed, returning minimal profile:', transformErr?.message || transformErr);
      transformedCandidate = {
        id: candidate.id,
        name: `${candidate.first_name} ${candidate.last_name}`,
        designation: candidate.headline || 'Job Seeker',
        avatar: candidate.avatar || '/placeholder.svg?height=120&width=120',
        email: candidate.email,
        phone: candidate.phone,
        keySkills: [],
        preferredLocations: [candidate.current_location || 'Not specified'],
        location: candidate.current_location || 'Not specified',
        experience: 'Not specified',
        education: 'Not specified',
        about: candidate.summary || 'No summary available',
        workExperience: [],
        educationDetails: [],
        certifications: [],
        languages: [
          { name: 'English', proficiency: 'Professional' }
        ],
        resumes: (() => {
          try {
            const resumeArray = toArray(resumes, []);
            return resumeArray.map((resume, index) => {
              const metadata = resume.metadata || {};
              const filename = metadata.originalName || metadata.filename || `${candidate.first_name}_${candidate.last_name}_Resume.pdf`;
              const fileSize = metadata.fileSize ? `${(metadata.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Unknown size';
              const viewUrl = `/api/requirements/${requirement.id}/candidates/${candidate.id}/resume/${resume.id}/view`;
              const downloadUrl = `/api/requirements/${requirement.id}/candidates/${candidate.id}/resume/${resume.id}/download`;

              // Determine if this is the default resume - check multiple possible field names
              // Backend orders by is_primary DESC, so first resume (index 0) should be default
              const isDefaultResume = resume.isDefault === true ||
                resume.isDefault === 'true' ||
                resume.is_primary === true ||
                resume.is_primary === 'true' ||
                (index === 0 && resume.is_primary !== false && resume.is_primary !== 'false'); // First resume if ordered by is_primary DESC

              return {
                id: resume.id,
                title: resume.title || 'Resume',
                filename: filename,
                fileSize: fileSize,
                uploadDate: resume.createdAt || resume.created_at,
                lastUpdated: resume.lastUpdated || resume.updated_at,
                isDefault: isDefaultResume, // Use camelCase for frontend
                is_default: isDefaultResume, // Also include snake_case for backward compatibility
                isPublic: resume.isPublic ?? resume.is_public ?? true,
                views: resume.views || resume.view_count || 0,
                downloads: resume.downloads || resume.download_count || 0,
                summary: resume.summary || '',
                skills: resume.skills || [],
                viewUrl,
                downloadUrl,
                fileUrl: downloadUrl,
                metadata: resume.metadata || {}
              };
            });
          } catch (resumeErr) {
            console.error('❌ Fallback resume transformation error:', resumeErr);
            return [];
          }
        })(),
        coverLetters: (() => {
          try {
            const coverLetterArray = toArray(coverLetters, []);
            return coverLetterArray.map(coverLetter => {
              const metadata = coverLetter.metadata || {};
              const filename = metadata.originalName || metadata.filename || `${candidate.first_name}_${candidate.last_name}_CoverLetter.pdf`;
              const fileSize = metadata.fileSize ? `${(metadata.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Unknown size';
              const downloadUrl = `/api/cover-letters/${coverLetter.id}/download`;

              return {
                id: coverLetter.id,
                title: coverLetter.title || 'Cover Letter',
                content: coverLetter.content || '',
                summary: coverLetter.summary || '',
                filename: filename,
                fileSize: fileSize,
                uploadDate: coverLetter.createdAt || coverLetter.createdAt,
                lastUpdated: coverLetter.lastUpdated || coverLetter.last_updated,
                is_default: coverLetter.isDefault ?? coverLetter.is_default ?? false,
                isPublic: coverLetter.isPublic ?? coverLetter.is_public ?? true,
                downloadUrl,
                fileUrl: downloadUrl,
                metadata: metadata
              };
            });
          } catch (coverLetterErr) {
            console.error('❌ Fallback cover letter transformation error:', coverLetterErr);
            return [];
          }
        })()
      };
    }

    // Check if candidate is already shortlisted for this requirement
    let isShortlisted = false;
    try {
      const { JobApplication } = require('../config/index');
      const existingShortlist = await JobApplication.findOne({
        where: {
          // Use model attribute names (userId/employerId) instead of non-existent user_id/employer_id
          userId: candidateId,
          employerId: req.user.id,
          source: 'requirement_shortlist'
        }
      });

      if (existingShortlist && existingShortlist.metadata) {
        try {
          const metadata = typeof existingShortlist.metadata === 'string'
            ? JSON.parse(existingShortlist.metadata)
            : existingShortlist.metadata;
          isShortlisted = metadata.requirementId === requirementId && existingShortlist.status === 'shortlisted';
        } catch (parseError) {
          console.warn('⚠️ Could not parse metadata for shortlist check:', parseError.message);
        }
      }
    } catch (shortlistError) {
      console.warn('⚠️ Could not check shortlist status:', shortlistError.message);
    }

    // Add shortlist status to candidate data
    transformedCandidate.isShortlisted = isShortlisted;

    // Track profile view for this requirement (if not already tracked)
    // CRITICAL: Update existing views without jobId to include requirementId
    try {
      const { ViewTracking } = require('../config/index');
      const ViewTrackingService = require('../services/viewTrackingService');

      // CRITICAL: Due to unique constraint on (viewer_id, viewed_user_id, view_type),
      // there can only be ONE view per viewer/candidate/viewType combination.
      // So we need to find ANY existing view and update it to include this requirementId.
      // We always update jobId to the current requirementId (most recent view).
      const anyExistingView = await ViewTracking.findOne({
        where: {
          viewerId: req.user.id,
          viewedUserId: candidateId,
          viewType: 'profile_view'
        }
      });

      if (anyExistingView) {
        // View exists - update it to include this requirementId
        const existingMetadata = anyExistingView.metadata || {};
        const existingRequirementIds = Array.isArray(existingMetadata.requirementIds)
          ? [...existingMetadata.requirementIds]
          : [];

        // Add this requirementId if not already present
        if (!existingRequirementIds.includes(requirementId)) {
          existingRequirementIds.push(requirementId);
        }

        // NOTE: Don't update jobId - it has a foreign key constraint to jobs table, not requirements
        // Store requirementId only in metadata, and queries check metadata.requirementId
        await anyExistingView.update({
          // jobId remains unchanged (NULL or existing job ID) - foreign key constraint prevents requirement IDs
          metadata: {
            ...existingMetadata,
            source: 'requirement_candidate_profile',
            requirementId: requirementId, // Current requirementId
            requirementTitle: requirement.title,
            companyId: requirement.companyId,
            requirementIds: existingRequirementIds, // Keep all requirementIds
            lastViewedRequirement: requirementId,
            lastViewedAt: new Date().toISOString()
          }
        });
        console.log(`✅ Updated existing view with requirementId ${requirementId} (total requirements: ${existingRequirementIds.length})`);
      } else {
        // No existing view, create new one
        const result = await ViewTrackingService.trackView({
          viewerId: req.user.id,
          viewedUserId: candidateId,
          jobId: null, // Don't store requirementId in jobId - foreign key constraint to jobs table
          viewType: 'profile_view',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          sessionId: req.sessionID,
          referrer: req.get('Referer'),
          metadata: {
            source: 'requirement_candidate_profile',
            requirementId: requirementId, // Also store in metadata as backup
            requirementTitle: requirement.title,
            companyId: requirement.companyId,
            requirementIds: [requirementId]
          }
        });

        if (result.success) {
          console.log(`✅ Profile view tracked for candidate ${candidateId} from requirement ${requirementId}`);
        } else {
          console.log(`⚠️ View tracking result: ${result.message}`);
        }
      }
    } catch (viewError) {
      console.warn('⚠️ Failed to track profile view:', viewError?.message || viewError);
      // Don't fail the request if view tracking fails
    }

    return res.status(200).json({
      success: true,
      data: {
        candidate: transformedCandidate,
        requirement: {
          id: requirement.id,
          title: requirement.title
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching candidate profile:', error);
    console.error('❌ Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      errors: error?.errors
    });

    // Fallback: try to return a minimal candidate profile to avoid blocking the UI
    try {
      const { requirementId, candidateId } = req.params || {};
      let requirement = null;
      try {
        requirement = await Requirement.findByPk(requirementId);
      } catch (_) { }

      let candidate = null;
      try {
        candidate = await User.findByPk(candidateId, {
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'avatar', 'current_location', 'headline', 'summary']
        });
      } catch (_) { }

      if (candidate) {
        return res.status(200).json({
          success: true,
          data: {
            candidate: {
              id: candidate.id,
              name: `${candidate.first_name} ${candidate.last_name}`,
              designation: candidate.headline || 'Job Seeker',
              avatar: candidate.avatar || '/placeholder.svg?height=120&width=120',
              email: candidate.email,
              phone: candidate.phone,
              location: candidate.current_location || 'Not specified',
              about: candidate.summary || 'No summary available',
              keySkills: [],
              preferredLocations: [candidate.current_location || 'Not specified'],
              workExperience: [],
              educationDetails: [],
              projects: [],
              certifications: [],
              languages: [
                { name: 'English', proficiency: 'Professional' }
              ],
              resumes: []
            },
            requirement: requirement ? { id: requirement.id, title: requirement.title } : null
          }
        });
      }
    } catch (fallbackErr) {
      console.warn('⚠️ Minimal fallback also failed:', fallbackErr?.message || fallbackErr);
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch candidate profile',
      error: {
        name: error?.name,
        message: error?.message,
        details: error?.errors || error?.stack
      }
    });
  }
});

// Shortlist/Unshortlist candidate
router.post('/:requirementId/candidates/:candidateId/shortlist', authenticateToken, async (req, res) => {
  try {
    const { requirementId, candidateId } = req.params;

    // Check if user is an employer or admin
    if (req.user.user_type !== 'employer' && req.user.user_type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Only employers and admins can shortlist candidates.' });
    }

    // Verify the requirement belongs to the employer's company
    const requirement = await Requirement.findOne({
      where: {
        id: requirementId,
        companyId: req.user.companyId || req.user.companyId
      }
    });

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found or access denied'
      });
    }

    // Verify candidate exists
    const candidate = await User.findOne({
      where: {
        id: candidateId,
        user_type: 'jobseeker',
        is_active: true,
        account_status: 'active'
      }
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Create a virtual job application for this requirement shortlisting
    // This allows the candidate to appear in the shortlisted page
    const { JobApplication, Job } = require('../config/index');

    // Check if there's already a shortlist entry for this candidate and requirement
    // Use raw query for metadata search since Sequelize doesn't handle nested JSON queries well
    const existingShortlist = await JobApplication.findOne({
      where: {
        // Use camelCase model fields; underlying columns are snake_case
        userId: candidateId,
        employerId: req.user.id,
        source: 'requirement_shortlist'
      }
    });

    // Check if the metadata contains the requirementId
    let isExistingForRequirement = false;
    if (existingShortlist && existingShortlist.metadata) {
      try {
        const metadata = typeof existingShortlist.metadata === 'string'
          ? JSON.parse(existingShortlist.metadata)
          : existingShortlist.metadata;
        isExistingForRequirement = metadata.requirementId === requirementId;
      } catch (parseError) {
        console.warn('⚠️ Could not parse metadata:', parseError.message);
      }
    }

    if (existingShortlist && isExistingForRequirement) {
      // Toggle shortlist status
      const previousStatus = existingShortlist.status;
      const newStatus = previousStatus === 'shortlisted' ? 'applied' : 'shortlisted';
      await existingShortlist.update({
        status: newStatus,
        updated_at: new Date()
      });

      console.log(`✅ Candidate ${candidateId} ${newStatus === 'shortlisted' ? 'shortlisted' : 'unshortlisted'} by employer ${req.user.id} for requirement ${requirementId}`);

      // Handle notifications based on status change
      try {
        const NotificationService = require('../services/notificationService');

        if (newStatus === 'shortlisted') {
          // Send notification when shortlisting
          await NotificationService.sendShortlistingNotification(
            candidateId,
            req.user.id,
            null, // jobId (not applicable for requirements)
            requirementId,
            {
              applicationId: existingShortlist.id,
              requirementTitle: requirement.title,
              companyName: req.user.company?.name || 'Unknown Company'
            }
          );
          console.log(`✅ Shortlisting notification sent to candidate ${candidateId}`);
        } else if (newStatus === 'applied' && previousStatus === 'shortlisted') {
          // Remove notification when unshortlisting
          await NotificationService.removeShortlistingNotification(
            candidateId,
            req.user.id,
            null, // jobId (not applicable for requirements)
            requirementId,
            {
              applicationId: existingShortlist.id,
              requirementTitle: requirement.title,
              companyName: req.user.company?.name || 'Unknown Company'
            }
          );
          console.log(`✅ Shortlisting notification removed for candidate ${candidateId}`);
        }
      } catch (notificationError) {
        console.error('Failed to handle shortlisting notification:', notificationError);
        // Don't fail the shortlisting if notification fails
      }

      return res.status(200).json({
        success: true,
        message: newStatus === 'shortlisted' ? 'Candidate shortlisted successfully' : 'Candidate removed from shortlist',
        data: {
          candidateId,
          requirementId,
          shortlisted: newStatus === 'shortlisted',
          status: newStatus
        }
      });
    } else {
      // Find or create a placeholder job for requirement-based shortlisting
      // IMPORTANT: We store isPlaceholder inside the metadata JSONB field
      // because the Job model doesn't have a dedicated isPlaceholder column.
      // This allows us to filter placeholder jobs out of normal listings.
      const Sequelize = require('sequelize');
      const { Op: SeqOp } = Sequelize;
      const companyId = req.user.companyId || req.user.company_id;

      let placeholderJob = await Job.findOne({
        where: {
          companyId,
          title: 'Requirement Shortlist',
          [SeqOp.and]: [
            // JSONB equality checks on objects are too strict here; use a JSON path condition instead.
            Sequelize.literal("metadata->>'isPlaceholder' = 'true'")
          ]
        }
      });

      if (!placeholderJob) {
        // Create a placeholder job for requirement-based shortlisting
        placeholderJob = await Job.create({
          title: 'Requirement Shortlist',
          slug: 'requirement-shortlist-' + Date.now(),
          description: 'Internal placeholder for requirement-based candidate shortlisting. This job is hidden from listings.',
          companyId,
          employerId: req.user.id,
          location: 'Remote',
          country: 'India',
          status: 'draft',
          jobType: 'full-time',
          // DB constraint: jobs.experience_level is NOT NULL in your environment
          // Use a valid enum value from Job model: entry|junior|mid|senior|lead|executive
          experienceLevel: 'entry',
          // Keep these minimal but consistent
          experienceMin: 0,
          experienceMax: 0,
          locationType: 'on-site',
          remoteWork: 'on-site',
          // CRITICAL: Store isPlaceholder in metadata so it persists to DB
          metadata: { isPlaceholder: true, purpose: 'requirement_shortlist' }
        });
        console.log('📌 Created placeholder job for requirement shortlisting:', placeholderJob.id);
      }

      // Check if application already exists, if so update it, otherwise create new one
      const [shortlistApplication, created] = await JobApplication.findOrCreate({
        where: {
          userId: candidateId,
          jobId: placeholderJob.id
        },
        defaults: {
          employerId: req.user.id,
          status: 'shortlisted',
          source: 'requirement_shortlist',
          appliedAt: new Date(),
          lastUpdatedAt: new Date(),
          metadata: {
            requirementId: requirementId,
            requirementTitle: requirement.title,
            shortlistedFrom: 'requirements'
          }
        }
      });

      // If application already existed, update its status to shortlisted
      if (!created) {
        await shortlistApplication.update({
          status: 'shortlisted',
          lastUpdatedAt: new Date(),
          metadata: {
            ...shortlistApplication.metadata,
            requirementId: requirementId,
            requirementTitle: requirement.title,
            shortlistedFrom: 'requirements'
          }
        });
      }

      console.log(`✅ Candidate ${candidateId} shortlisted by employer ${req.user.id} for requirement ${requirementId}`);

      // Log candidate shortlisting activity
      try {
        const EmployerActivityService = require('../services/employerActivityService');
        await EmployerActivityService.logCandidateShortlist(
          req.user.id,
          candidateId,
          {
            requirementId: requirementId,
            applicationId: shortlistApplication.id,
            jobId: placeholderJob.id,
            requirementTitle: requirement.title,
            candidateName: candidate.first_name + ' ' + candidate.last_name,
            companyName: req.user.company?.name || 'Unknown Company'
          }
        );
      } catch (activityError) {
        console.error('Failed to log candidate shortlisting activity:', activityError);
        // Don't fail the shortlisting if activity logging fails
      }

      // Send notification to candidate
      try {
        const NotificationService = require('../services/notificationService');
        await NotificationService.sendShortlistingNotification(
          candidateId,
          req.user.id,
          null, // jobId (not applicable for requirements)
          requirementId,
          {
            applicationId: shortlistApplication.id,
            requirementTitle: requirement.title,
            companyName: req.user.company?.name || 'Unknown Company'
          }
        );
        console.log(`✅ Shortlisting notification sent to candidate ${candidateId}`);
      } catch (notificationError) {
        console.error('Failed to send shortlisting notification:', notificationError);
        // Don't fail the shortlisting if notification fails
      }

      return res.status(200).json({
        success: true,
        message: 'Candidate shortlisted successfully',
        data: {
          candidateId,
          requirementId,
          shortlisted: true,
          applicationId: shortlistApplication.id
        }
      });
    }

  } catch (error) {
    console.error('❌ Error shortlisting candidate:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to shortlist candidate',
      error: {
        name: error?.name,
        message: error?.message
      }
    });
  }
});

// Contact candidate
router.post('/:requirementId/candidates/:candidateId/contact', authenticateToken, async (req, res) => {
  try {
    const { requirementId, candidateId } = req.params;
    const { message, subject } = req.body;

    // Check if user is an employer or admin
    if (req.user.user_type !== 'employer' && req.user.user_type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Only employers and admins can contact candidates.' });
    }

    // Verify the requirement belongs to the employer's company
    const requirement = await Requirement.findOne({
      where: {
        id: requirementId,
        companyId: req.user.companyId
      }
    });

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found or access denied'
      });
    }

    // Verify candidate exists
    const candidate = await User.findOne({
      where: {
        id: candidateId,
        user_type: 'jobseeker',
        is_active: true,
        account_status: 'active'
      }
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Create or find conversation between employer and candidate
    let conversation = await Conversation.findOne({
      where: {
        [Op.or]: [
          { participant1Id: req.user.id, participant2Id: candidateId },
          { participant1Id: candidateId, participant2Id: req.user.id }
        ],
        conversationType: 'general'
      }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participant1Id: req.user.id,
        participant2Id: candidateId,
        conversationType: 'general',
        title: `Job Opportunity: ${requirement.title}`,
        metadata: {
          requirementId: requirementId,
          jobTitle: requirement.title,
          companyName: requirement.company?.name || 'Company'
        }
      });
    }

    // Create the message
    const messageContent = `Subject: ${subject || 'Job Opportunity'}\n\n${message || 'No message provided'}`;

    const newMessage = await Message.create({
      conversationId: conversation.id,
      senderId: req.user.id,
      receiverId: candidateId,
      messageType: 'text',
      content: messageContent,
      metadata: {
        requirementId: requirementId,
        jobTitle: requirement.title,
        companyName: requirement.company?.name || 'Company',
        originalSubject: subject || 'Job Opportunity'
      }
    });

    // Update conversation with last message info
    await conversation.update({
      lastMessageId: newMessage.id,
      lastMessageAt: new Date(),
      unreadCount: sequelize.literal('unread_count + 1')
    });

    console.log(`✅ Message sent to candidate ${candidateId} by employer ${req.user.id} for requirement ${requirementId}`);
    console.log(`📧 Subject: ${subject || 'Job Opportunity'}`);
    console.log(`📧 Message: ${message || 'No message provided'}`);
    console.log(`💬 Conversation ID: ${conversation.id}, Message ID: ${newMessage.id}`);

    return res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        conversationId: conversation.id,
        messageId: newMessage.id,
        candidateId,
        requirementId,
        employer_id: req.user.id,
        subject: subject || 'Job Opportunity',
        message: message || 'No message provided'
      }
    });

  } catch (error) {
    console.error('❌ Error contacting candidate:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send contact request',
      error: {
        name: error?.name,
        message: error?.message
      }
    });
  }
});

// View candidate resume (for employers) - increment view count and log activity
router.get('/:requirementId/candidates/:candidateId/resume/:resumeId/view', attachTokenFromQuery, authenticateToken, async (req, res) => {
  try {
    const { requirementId, candidateId, resumeId } = req.params;

    // Check if user is an employer
    if (req.user.user_type !== 'employer' && req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only employers can view candidate resumes.'
      });
    }

    // Verify requirement: admins can access any requirement; employers must own it
    const requirement = await Requirement.findOne({
      where: req.user.user_type === 'admin'
        ? { id: requirementId }
        : { id: requirementId, companyId: req.user.companyId }
    });

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found or access denied'
      });
    }

    // Get the resume
    // Primary check: resume must belong to this candidate
    let resume = await Resume.findOne({
      where: {
        id: resumeId,
        userId: candidateId
      }
    });

    // Fallback: in some legacy data, the candidateId / userId relationship may not
    // match exactly even though the resume exists and is linked via applications.
    // In that case, try to find by id only, but still ensure it's a real resume.
    if (!resume) {
      console.warn('⚠️ Resume not found with strict candidate match, falling back to id-only lookup', {
        requirementId,
        candidateId,
        resumeId
      });

      resume = await Resume.findOne({ where: { id: resumeId } });
    }

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Increment view count
    await resume.update({
      views: resume.views + 1
    });

    // Check and consume quota for resume view
    try {
      const EmployerQuotaService = require('../services/employerQuotaService');
      await EmployerQuotaService.checkAndConsume(
        req.user.id,
        EmployerQuotaService.QUOTA_TYPES.RESUME_VIEWS,
        {
          activityType: 'resume_view',
          details: {
            resumeId: resume.id,
            candidateId: candidateId,
            requirementId: requirementId
          },
          defaultLimit: 100
        }
      );
    } catch (quotaError) {
      console.error('Quota check failed for resume view:', quotaError);
      if (quotaError.code === 'QUOTA_LIMIT_EXCEEDED') {
        return res.status(429).json({
          success: false,
          message: 'Resume view quota exceeded. Please contact your administrator.'
        });
      }
      // For other quota errors, continue with view but log the issue
    }

    // Log resume view activity
    try {
      const EmployerActivityService = require('../services/employerActivityService');
      await EmployerActivityService.logResumeView(
        req.user.id,
        resume.id,
        candidateId,
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requirementId: requirementId
        }
      );
    } catch (activityError) {
      console.error('Failed to log resume view activity:', activityError);
      // Don't fail the view if activity logging fails
    }

    // Get file path or URL for serving the PDF
    const metadata = resume.metadata || {};
    const filename = metadata.filename || metadata.originalName || `resume-${resume.id}.pdf`;
    const originalName = metadata.originalName || filename;

    console.log('🔍 Resume metadata:', JSON.stringify(metadata, null, 2));
    console.log('🔍 Filename from metadata:', filename);

    // If fileUrl is an HTTP(S) URL, redirect directly
    if (metadata.fileUrl && typeof metadata.fileUrl === 'string' && /^https?:\/\//i.test(metadata.fileUrl)) {
      console.log('🔁 Redirecting resume view to external fileUrl:', metadata.fileUrl);
      return res.redirect(metadata.fileUrl);
    }

    // If filePath itself is an HTTP(S) URL, also redirect
    if (metadata.filePath && typeof metadata.filePath === 'string' && /^https?:\/\//i.test(metadata.filePath)) {
      console.log('🔁 Redirecting resume view to external filePath URL:', metadata.filePath);
      return res.redirect(metadata.filePath);
    }

    // Otherwise, try to find the file on local/attached storage.
    // Mirror the robust search used by the download endpoint so that
    // any resume that can be downloaded can also be previewed.
    let filePath = null;
    const possiblePaths = [
      // Production paths (Render.com)
      path.join('/opt/render/project/src/uploads/resumes', filename),
      path.join('/opt/render/project/src/server/uploads/resumes', filename),
      path.join('/tmp/uploads/resumes', filename),
      // Development paths
      path.join(__dirname, '../uploads/resumes', filename),
      path.join(process.cwd(), 'server', 'uploads', 'resumes', filename),
      path.join(process.cwd(), 'uploads', 'resumes', filename),
      path.join('/tmp', 'uploads', 'resumes', filename),
      path.join('/var', 'tmp', 'uploads', 'resumes', filename),
      // Metadata-based paths
      metadata.filePath ? path.join(process.cwd(), metadata.filePath.replace(/^\//, '')) : null,
      metadata.filePath ? path.join('/', metadata.filePath.replace(/^\//, '')) : null,
      // Direct metadata filePath
      metadata.filePath ? metadata.filePath : null,
      // Public URL-style path within app
      metadata.filename ? `/uploads/resumes/${metadata.filename}` : null
    ].filter(Boolean);

    console.log('🔍 [view] Trying possible file paths:', possiblePaths);

    // Find the first existing file
    for (const testPath of possiblePaths) {
      try {
        if (testPath && fs.existsSync(testPath)) {
          filePath = testPath;
          break;
        }
      } catch (e) {
        console.log('⚠️ [view] Error checking path', testPath, e.message);
      }
    }

    if (!filePath) {
      console.log('❌ File does not exist in any of the expected locations');
      console.log('🔍 Checked paths:', possiblePaths);
      // Fallback: redirect to stored public path if present
      if (metadata.filePath) {
        return res.redirect(metadata.filePath);
      }
      // Try to find the file by searching common directories
      const searchDirs = [
        path.join(__dirname, '../uploads'),
        path.join(process.cwd(), 'uploads'),
        path.join(process.cwd(), 'server', 'uploads'),
        '/tmp/uploads',
        '/var/tmp/uploads'
      ];
      for (const searchDir of searchDirs) {
        try {
          if (fs.existsSync(searchDir)) {
            const files = fs.readdirSync(searchDir, { recursive: true });
            const found = files.find(f => typeof f === 'string' && f.includes(filename));
            if (found) {
              filePath = path.join(searchDir, found);
              break;
            }
          }
        } catch (error) {
          console.log(`🔍 Could not search in ${searchDir}:`, error.message);
        }
      }
      if (!filePath) {
        return res.status(404).json({
          success: false,
          message: 'Resume file not found on server. The file may have been lost during server restart. Please ask the candidate to re-upload their resume.',
          code: 'FILE_NOT_FOUND'
        });
      }
    }

    console.log('✅ File found at:', filePath);

    // Set headers for PDF viewing (inline display)
    res.setHeader('Content-Disposition', `inline; filename="${originalName || filename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Send file
    console.log('📤 Sending file for view:', filePath);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error viewing resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to view resume',
      error: error.message
    });
  }
});

// Helper to attach token from query when Authorization header is missing
function attachTokenFromQuery(req, _res, next) {
  try {
    const qToken = req.query && (req.query.token || req.query.access_token);
    console.log('🔍 attachTokenFromQuery - Query token:', qToken ? 'Present' : 'Missing');
    console.log('🔍 attachTokenFromQuery - Existing auth header:', req.headers?.authorization ? 'Present' : 'Missing');

    if (!req.headers?.authorization && qToken) {
      req.headers.authorization = `Bearer ${qToken}`;
      console.log('✅ attachTokenFromQuery - Added token to headers');
    }
  } catch (error) {
    console.error('❌ attachTokenFromQuery error:', error);
  }
  next();
}

// Download candidate resume (for employers)
router.get('/:requirementId/candidates/:candidateId/resume/:resumeId/download', attachTokenFromQuery, authenticateToken, async (req, res) => {
  try {
    const { requirementId, candidateId, resumeId } = req.params;
    console.log('🔍 Download request - requirementId:', requirementId, 'candidateId:', candidateId, 'resumeId:', resumeId);
    console.log('🔍 Download request - user:', req.user?.email, req.user?.user_type);

    // Check if user is an employer or admin
    if (req.user.user_type !== 'employer' && req.user.user_type !== 'admin') {
      console.log('❌ Download request - Access denied for user type:', req.user.user_type);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only employers and admins can download candidate resumes.'
      });
    }

    // Verify requirement: admins can access any requirement; employers must own it
    const requirement = await Requirement.findOne({
      where: req.user.user_type === 'admin'
        ? { id: requirementId }
        : { id: requirementId, companyId: req.user.companyId }
    });

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found or access denied'
      });
    }

    // Get the resume
    console.log('🔍 Looking for resume with ID:', resumeId, 'for candidate:', candidateId);
    const resume = await Resume.findOne({
      where: {
        id: resumeId,
        userId: candidateId
      }
    });

    if (!resume) {
      console.log('❌ Resume not found for ID:', resumeId, 'candidate:', candidateId);
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    console.log('✅ Resume found:', resume.id, 'filename:', resume.metadata?.filename);
    console.log('🔍 Full resume data:', JSON.stringify(resume.dataValues, null, 2));
    const metadata = resume.metadata || {};
    console.log('🔍 Resume metadata:', JSON.stringify(metadata, null, 2));
    const filename = metadata.filename || metadata.originalName || metadata.original_name || `resume-${resume.id}.pdf`;
    const originalName = metadata.originalName || metadata.original_name || filename;

    console.log('🔍 Filename resolved:', filename);
    console.log('🔍 Original name resolved:', originalName);

    // Try multiple possible file paths
    let filePath;
    const possiblePaths = [
      // Production paths (Render.com)
      path.join('/opt/render/project/src/uploads/resumes', filename),
      path.join('/opt/render/project/src/server/uploads/resumes', filename),
      path.join('/tmp/uploads/resumes', filename),
      // Development paths
      path.join(__dirname, '../uploads/resumes', filename),
      path.join(process.cwd(), 'server', 'uploads', 'resumes', filename),
      path.join(process.cwd(), 'uploads', 'resumes', filename),
      path.join('/tmp', 'uploads', 'resumes', filename),
      path.join('/var', 'tmp', 'uploads', 'resumes', filename),
      // Metadata-based paths
      metadata.filePath ? path.join(process.cwd(), metadata.filePath.replace(/^\//, '')) : null,
      metadata.filePath ? path.join('/', metadata.filePath.replace(/^\//, '')) : null,
      // Direct metadata filePath
      metadata.filePath ? metadata.filePath : null,
      // Public URL path
      metadata.filename ? `/uploads/resumes/${metadata.filename}` : null
    ].filter(Boolean);

    console.log('🔍 Trying possible file paths:', possiblePaths);

    // Find the first existing file
    filePath = possiblePaths.find(p => fs.existsSync(p));

    if (!filePath) {
      console.log('❌ File does not exist in any of the expected locations');
      console.log('🔍 Checked paths:', possiblePaths);
      // Fallback: redirect to stored public path if present
      if (metadata.filePath) {
        return res.redirect(metadata.filePath);
      }
      // Try to find the file by searching common directories
      const searchDirs = [
        path.join(__dirname, '../uploads'),
        path.join(process.cwd(), 'uploads'),
        path.join(process.cwd(), 'server', 'uploads'),
        '/tmp/uploads',
        '/var/tmp/uploads'
      ];
      for (const searchDir of searchDirs) {
        try {
          if (fs.existsSync(searchDir)) {
            const files = fs.readdirSync(searchDir, { recursive: true });
            const found = files.find(f => typeof f === 'string' && f.includes(filename));
            if (found) {
              filePath = path.join(searchDir, found);
              break;
            }
          }
        } catch (error) {
          console.log(`🔍 Could not search in ${searchDir}:`, error.message);
        }
      }
      if (!filePath) {
        console.log('⚠️ IMPORTANT: File not found - Render free tier ephemeral storage issue');
        console.log('📋 Filename sought:', filename);
        console.log('💡 Solution: Re-upload resume OR migrate to cloud storage');
        return res.status(404).json({
          success: false,
          message: 'Resume file not found. On Render free tier, uploaded files are stored in ephemeral storage and are deleted when the server restarts. Please re-upload the resume or migrate to cloud storage (AWS S3, Cloudinary) for production.',
          code: 'FILE_NOT_FOUND',
          filename: filename,
          technicalNote: 'Render free tier uses ephemeral filesystem'
        });
      }
    }

    console.log('✅ File found at:', filePath);

    // Increment download count
    await resume.update({
      downloads: resume.downloads + 1
    });

    // Check and consume quota for resume download
    try {
      const EmployerQuotaService = require('../services/employerQuotaService');
      await EmployerQuotaService.checkAndConsume(
        req.user.id,
        EmployerQuotaService.QUOTA_TYPES.RESUME_VIEWS,
        {
          activityType: 'resume_download',
          details: {
            resumeId: resume.id,
            candidateId: candidateId,
            requirementId: requirementId
          },
          defaultLimit: 100
        }
      );
    } catch (quotaError) {
      console.error('Quota check failed for resume download:', quotaError);
      if (quotaError.code === 'QUOTA_LIMIT_EXCEEDED') {
        return res.status(429).json({
          success: false,
          message: 'Resume download quota exceeded. Please contact your administrator.'
        });
      }
      // For other quota errors, continue with download but log the issue
    }

    // Log resume download activity
    try {
      const EmployerActivityService = require('../services/employerActivityService');
      await EmployerActivityService.logResumeDownload(
        req.user.id,
        resume.id,
        candidateId,
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requirementId: requirementId
        }
      );
    } catch (activityError) {
      console.error('Failed to log resume download activity:', activityError);
      // Don't fail the download if activity logging fails
    }

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${originalName || filename}"`);
    res.setHeader('Content-Type', metadata.mimeType || 'application/octet-stream');

    // Send file
    console.log('📤 Sending file:', filePath);
    res.sendFile(filePath);
  } catch (error) {
    console.error('❌ Error downloading candidate resume:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to download resume',
      error: error.message
    });
  }
});

// ATS Calculate endpoint - STREAMING VERSION with Intelligent Pooling
router.post('/:id/calculate-ats', authenticateToken, async (req, res) => {
  try {
    const requirementId = req.params.id;
    const { candidateIds, page = 1, limit = 20, processAll = false } = req.body;

    console.log(`🎯 ATS calculation requested for requirement ${requirementId}`);
    console.log(`📄 Pagination params: page=${page}, limit=${limit}, processAll=${processAll}`);

    // Check if user is an employer or admin
    if (req.user.user_type !== 'employer' && req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only employers can calculate ATS scores.'
      });
    }

    // Verify requirement ownership
    const requirement = await Requirement.findOne({
      where: req.user.user_type === 'admin'
        ? { id: requirementId }
        : { id: requirementId, companyId: req.user.companyId }
    });

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found or access denied'
      });
    }

    // Import pooling service
    const atsPoolingService = require('../services/atsPoolingService');

    let targetCandidateIds = candidateIds;
    let totalCandidates = 0;
    let hasMorePages = false;

    if (processAll) {
      // Get all candidate IDs for the requirement
      console.log('📋 Fetching ALL candidates for requirement (processAll=true)...');
      const allCandidatesData = await atsPoolingService.getAllCandidateIdsForRequirement(
        requirementId,
        page,
        limit
      );

      targetCandidateIds = allCandidatesData.candidateIds;
      totalCandidates = allCandidatesData.totalCandidates;
      hasMorePages = allCandidatesData.hasMorePages;

      console.log(`📊 Found ${totalCandidates} total candidates, processing page ${page} with ${targetCandidateIds.length} candidates`);
    } else {
      // Process only current page candidates
      if (!targetCandidateIds || targetCandidateIds.length === 0) {
        // Get candidates for current page using the same logic as candidates endpoint
        const allCandidatesData = await atsPoolingService.getAllCandidateIdsForRequirement(
          requirementId,
          page,
          limit
        );

        targetCandidateIds = allCandidatesData.candidateIds;
        totalCandidates = allCandidatesData.totalCandidates;
        hasMorePages = allCandidatesData.hasMorePages;

        console.log(`📄 Processing current page ${page}: ${targetCandidateIds.length} candidates`);
      } else {
        // Validate provided candidates
        const validatedCandidates = await User.findAll({
          where: {
            id: { [Op.in]: candidateIds },
            user_type: 'jobseeker',
            account_status: 'active',
            is_active: true
          },
          attributes: ['id']
        });

        targetCandidateIds = validatedCandidates.map(c => c.id);
        totalCandidates = targetCandidateIds.length;

        console.log(`✅ Validated ${targetCandidateIds.length} candidates for ATS calculation`);
      }
    }

    if (targetCandidateIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No candidates found for this requirement'
      });
    }

    console.log(`📊 Starting STREAMING ATS calculation for ${targetCandidateIds.length} candidates`);
    console.log(`🔧 Using intelligent pooling with max ${atsPoolingService.CONFIG.MAX_CANDIDATES_PER_BATCH} concurrent requests`);

    // Return immediately with streaming configuration
    // The frontend will then call individual candidate endpoints
    return res.status(200).json({
      success: true,
      message: 'ATS calculation started - streaming mode with intelligent pooling',
      data: {
        streaming: true,
        totalCandidates: targetCandidateIds.length,
        candidateIds: targetCandidateIds,
        requirementId: requirementId,
        status: 'started',
        pagination: {
          currentPage: parseInt(page),
          limit: parseInt(limit),
          totalCandidates,
          hasMorePages,
          processed: targetCandidateIds.length
        },
        pooling: {
          maxConcurrent: atsPoolingService.CONFIG.MAX_CANDIDATES_PER_BATCH,
          estimatedTime: Math.ceil(targetCandidateIds.length / atsPoolingService.CONFIG.MAX_CANDIDATES_PER_BATCH) * 2 // Rough estimate in seconds
        }
      }
    });

  } catch (error) {
    console.error('❌ ATS calculate error:', error);
    return res.status(500).json({
      success: false,
      message: 'ATS calculation failed',
      error: error.message
    });
  }
});

// Individual Candidate ATS Calculation Endpoint - For Streaming
router.post('/:requirementId/calculate-candidate-ats/:candidateId', authenticateToken, async (req, res) => {
  try {
    const { requirementId, candidateId } = req.params;

    console.log(`🎯 Individual ATS calculation: ${candidateId} for requirement ${requirementId}`);

    // Check if user is an employer or admin
    if (req.user.user_type !== 'employer' && req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only employers can calculate ATS scores.'
      });
    }

    // Verify requirement ownership
    const requirement = await Requirement.findOne({
      where: req.user.user_type === 'admin'
        ? { id: requirementId }
        : { id: requirementId, companyId: req.user.companyId }
    });

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found or access denied'
      });
    }

    // Verify candidate exists and is active
    const candidate = await User.findOne({
      where: {
        id: candidateId,
        user_type: 'jobseeker',
        account_status: 'active',
        is_active: true
      }
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found or inactive'
      });
    }

    // Import ATS service
    const atsService = require('../services/atsService');

    // Calculate ATS score for this specific candidate
    console.log(`🚀 Calculating ATS score for candidate ${candidateId}...`);

    let atsResult;
    try {
      atsResult = await atsService.calculateATSScore(candidateId, requirementId);
      console.log(`📊 ATS service returned:`, {
        hasResult: !!atsResult,
        candidateId: atsResult?.candidateId,
        requirementId: atsResult?.requirementId,
        atsScore: atsResult?.atsScore,
        hasAnalysis: !!atsResult?.analysis
      });
    } catch (atsError) {
      console.error('❌ ATS service error:', atsError);
      throw atsError;
    }

    if (atsResult && atsResult.atsScore !== undefined) {
      console.log(`✅ ATS score calculated for ${candidateId}: ${atsResult.atsScore}`);

      return res.status(200).json({
        success: true,
        message: 'ATS score calculated successfully',
        data: {
          candidateId: candidateId,
          requirementId: requirementId,
          atsScore: atsResult.atsScore,
          atsAnalysis: atsResult.analysis,
          calculatedAt: atsResult.calculatedAt || new Date().toISOString(),
          candidate: {
            id: candidate.id,
            name: `${candidate.first_name} ${candidate.last_name}`,
            designation: candidate.designation || candidate.headline || 'Job Seeker'
          }
        }
      });
    } else {
      console.log(`❌ ATS calculation failed for ${candidateId}: Invalid result structure`);

      return res.status(500).json({
        success: false,
        message: 'ATS calculation failed for this candidate',
        data: {
          candidateId: candidateId,
          requirementId: requirementId,
          error: 'Invalid ATS calculation result'
        }
      });
    }

  } catch (error) {
    console.error('❌ Individual ATS calculation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Individual ATS calculation failed',
      error: error.message
    });
  }
});

module.exports = router;
