const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/adminAuth');
const { Company, AgencyClientAuthorization, User } = require('../models');
const { Op } = require('sequelize');

// ============================================
// ADMIN: AGENCY VERIFICATION ROUTES
// ============================================

/**
 * @route   GET /api/admin/agency-verifications
 * @desc    Get all agency verifications (both agency KYC and client authorizations)
 * @access  Private (Admin)
 */
router.get('/agency-verifications', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, type, search, limit = 20, offset = 0 } = req.query;
    
    let results = { agencies: [], clientAuthorizations: [] };
    
    // Get agency KYC verifications
    if (!type || type === 'agency') {
      const agencyWhere = {
        companyAccountType: {
          [Op.in]: ['recruiting_agency', 'consulting_firm']
        }
      };
      
      if (status) {
        agencyWhere.verificationStatus = status;
      }
      
      if (search) {
        agencyWhere.name = {
          [Op.iLike]: `%${search}%`
        };
      }
      
      const agencies = await Company.findAll({
        where: agencyWhere,
        attributes: [
          'id',
          'name',
          'slug',
          'logo',
          'industry',
          'companyAccountType',
          'verificationStatus',
          'agencyDocuments',
          'verifiedAt',
          'verificationMethod',
          'created_at',
          'updatedAt'
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      results.agencies = agencies;
    }
    
    // Get client authorization requests
    if (!type || type === 'client') {
      const authWhere = {};
      
      if (status) {
        authWhere.status = status;
      }
      
      const clientAuths = await AgencyClientAuthorization.findAll({
        where: authWhere,
        include: [
          {
            model: Company,
            as: 'AgencyCompany',
            attributes: ['id', 'name', 'logo', 'companyAccountType', 'verificationStatus'],
            where: search ? {
              [Op.or]: [
                { name: { [Op.iLike]: `%${search}%` } }
              ]
            } : undefined
          },
          {
            model: Company,
            as: 'ClientCompany',
            attributes: ['id', 'name', 'logo', 'industry', 'city'],
            where: search ? {
              [Op.or]: [
                { name: { [Op.iLike]: `%${search}%` } }
              ]
            } : undefined
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      results.clientAuthorizations = clientAuths;
    }
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Get agency verifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get agency verifications',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/agency-verifications/stats
 * @desc    Get verification statistics for admin dashboard
 * @access  Private (Admin)
 */
router.get('/agency-verifications/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Agency KYC stats
    const totalAgencies = await Company.count({
      where: {
        companyAccountType: {
          [Op.in]: ['recruiting_agency', 'consulting_firm']
        }
      }
    });
    
    const pendingAgencies = await Company.count({
      where: {
        companyAccountType: {
          [Op.in]: ['recruiting_agency', 'consulting_firm']
        },
        verificationStatus: {
          [Op.in]: ['pending', 'pending_manual_review']
        }
      }
    });
    
    const verifiedAgencies = await Company.count({
      where: {
        companyAccountType: {
          [Op.in]: ['recruiting_agency', 'consulting_firm']
        },
        verificationStatus: 'verified'
      }
    });
    
    const rejectedAgencies = await Company.count({
      where: {
        companyAccountType: {
          [Op.in]: ['recruiting_agency', 'consulting_firm']
        },
        verificationStatus: 'rejected'
      }
    });
    
    // Client authorization stats
    const totalClientAuths = await AgencyClientAuthorization.count();
    
    const pendingClientAuths = await AgencyClientAuthorization.count({
      where: {
        status: {
          [Op.in]: ['pending_client_confirm', 'pending_admin_review', 'pending_documents']
        }
      }
    });
    
    const activeClientAuths = await AgencyClientAuthorization.count({
      where: {
        status: 'active'
      }
    });
    
    const expiredClientAuths = await AgencyClientAuthorization.count({
      where: {
        status: {
          [Op.in]: ['expired', 'revoked']
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        agencies: {
          total: totalAgencies,
          pending: pendingAgencies,
          verified: verifiedAgencies,
          rejected: rejectedAgencies
        },
        clientAuthorizations: {
          total: totalClientAuths,
          pending: pendingClientAuths,
          active: activeClientAuths,
          expired: expiredClientAuths
        }
      }
    });
  } catch (error) {
    console.error('Get verification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get verification statistics',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/agency-verifications/agency/:agencyId/approve
 * @desc    Approve agency KYC verification
 * @access  Private (Admin)
 */
router.post('/agency-verifications/agency/:agencyId/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { agencyId } = req.params;
    const { verificationMethod = 'manual_admin_review', notes } = req.body;
    
    const agency = await Company.findByPk(agencyId);
    
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }
    
    if (!agency.isAgency()) {
      return res.status(400).json({
        success: false,
        message: 'Company is not an agency'
      });
    }
    
    // Update agency verification status
    agency.verificationStatus = 'verified';
    agency.verifiedAt = new Date();
    agency.verificationMethod = verificationMethod;
    
    if (notes) {
      const agencyDocs = agency.agencyDocuments || {};
      agencyDocs.adminNotes = notes;
      agencyDocs.verifiedBy = req.user.id;
      agencyDocs.verifiedByAdmin = req.user.email;
      agency.agencyDocuments = agencyDocs;
    }
    
    await agency.save();
    
    // TODO: Send email notification to agency
    
    res.json({
      success: true,
      message: 'Agency verification approved successfully',
      data: agency
    });
  } catch (error) {
    console.error('Approve agency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve agency verification',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/agency-verifications/agency/:agencyId/reject
 * @desc    Reject agency KYC verification
 * @access  Private (Admin)
 */
router.post('/agency-verifications/agency/:agencyId/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { agencyId } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const agency = await Company.findByPk(agencyId);
    
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }
    
    // Update agency verification status
    agency.verificationStatus = 'rejected';
    
    const agencyDocs = agency.agencyDocuments || {};
    agencyDocs.rejectionReason = reason;
    agencyDocs.rejectedBy = req.user.id;
    agencyDocs.rejectedByAdmin = req.user.email;
    agencyDocs.rejectedAt = new Date();
    agency.agencyDocuments = agencyDocs;
    
    await agency.save();
    
    // TODO: Send email notification to agency
    
    res.json({
      success: true,
      message: 'Agency verification rejected',
      data: agency
    });
  } catch (error) {
    console.error('Reject agency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject agency verification',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/agency-verifications/client/:authorizationId/approve
 * @desc    Approve client authorization
 * @access  Private (Admin)
 */
router.post('/agency-verifications/client/:authorizationId/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { authorizationId } = req.params;
    const { notes } = req.body;
    
    const authorization = await AgencyClientAuthorization.findByPk(authorizationId, {
      include: [
        {
          model: Company,
          as: 'AgencyCompany'
        },
        {
          model: Company,
          as: 'ClientCompany'
        }
      ]
    });
    
    if (!authorization) {
      return res.status(404).json({
        success: false,
        message: 'Client authorization not found'
      });
    }
    
    // Update authorization status
    authorization.status = 'active';
    authorization.canPostJobs = true;
    authorization.verifiedAt = new Date();
    authorization.verifiedBy = req.user.id;
    authorization.adminNotes = notes || null;
    
    await authorization.save();
    
    // TODO: Send email notifications to both agency and client
    
    res.json({
      success: true,
      message: 'Client authorization approved successfully',
      data: authorization
    });
  } catch (error) {
    console.error('Approve client authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve client authorization',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/agency-verifications/client/:authorizationId/reject
 * @desc    Reject client authorization
 * @access  Private (Admin)
 */
router.post('/agency-verifications/client/:authorizationId/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { authorizationId } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const authorization = await AgencyClientAuthorization.findByPk(authorizationId, {
      include: [
        {
          model: Company,
          as: 'AgencyCompany'
        },
        {
          model: Company,
          as: 'ClientCompany'
        }
      ]
    });
    
    if (!authorization) {
      return res.status(404).json({
        success: false,
        message: 'Client authorization not found'
      });
    }
    
    // Update authorization status
    authorization.status = 'rejected';
    authorization.canPostJobs = false;
    authorization.rejectionReason = reason;
    authorization.rejectedBy = req.user.id;
    authorization.rejectedAt = new Date();
    
    await authorization.save();
    
    // TODO: Send email notifications to agency and client
    
    res.json({
      success: true,
      message: 'Client authorization rejected',
      data: authorization
    });
  } catch (error) {
    console.error('Reject client authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject client authorization',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/agency-verifications/agency/:agencyId
 * @desc    Get detailed agency verification information
 * @access  Private (Admin)
 */
router.get('/agency-verifications/agency/:agencyId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { agencyId } = req.params;
    
    const agency = await Company.findByPk(agencyId, {
      attributes: [
        'id',
        'name',
        'slug',
        'logo',
        'industry',
        'city',
        'companySize',
        'website',
        'email',
        'phone',
        'companyAccountType',
        'agencyLicense',
        'agencySpecialization',
        'agencyDocuments',
        'verificationStatus',
        'verifiedAt',
        'verificationMethod',
        'created_at',
        'updatedAt'
      ]
    });
    
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: 'Agency not found'
      });
    }
    
    // Get agency's client authorizations
    const clientAuthorizations = await AgencyClientAuthorization.findAll({
      where: {
        agencyCompanyId: agencyId
      },
      include: [
        {
          model: Company,
          as: 'ClientCompany',
          attributes: ['id', 'name', 'logo', 'industry', 'city']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // Get agency users
    const agencyUsers = await User.findAll({
      where: {
        companyId: agencyId
      },
      attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'created_at']
    });
    
    res.json({
      success: true,
      data: {
        agency,
        clientAuthorizations,
        users: agencyUsers
      }
    });
  } catch (error) {
    console.error('Get agency details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get agency details',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/agency-verifications/client/:authorizationId
 * @desc    Get detailed client authorization information
 * @access  Private (Admin)
 */
router.get('/agency-verifications/client/:authorizationId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { authorizationId } = req.params;
    
    const authorization = await AgencyClientAuthorization.findByPk(authorizationId, {
      include: [
        {
          model: Company,
          as: 'AgencyCompany',
          attributes: ['id', 'name', 'logo', 'companyAccountType', 'verificationStatus', 'email', 'phone']
        },
        {
          model: Company,
          as: 'ClientCompany',
          attributes: ['id', 'name', 'logo', 'industry', 'city', 'website', 'email']
        }
      ]
    });
    
    if (!authorization) {
      return res.status(404).json({
        success: false,
        message: 'Client authorization not found'
      });
    }
    
    res.json({
      success: true,
      data: authorization
    });
  } catch (error) {
    console.error('Get authorization details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get authorization details',
      error: error.message
    });
  }
});

module.exports = router;

