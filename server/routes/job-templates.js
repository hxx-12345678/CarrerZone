const express = require('express');
const router = express.Router();
const { JobTemplate, User, Company } = require('../models');
const { authenticateToken } = require('../middlewares/auth');
const { Op } = require('sequelize');

// Get public templates (no authentication required)
router.get('/public', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {
      isPublic: true,
      isActive: true
    };

    if (category && category !== 'all') {
      whereClause.category = category;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { tags: { [Op.contains]: [search] } }
      ];
    }

    const { count, rows: templates } = await JobTemplate.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching public templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public templates',
      error: error.message
    });
  }
});

// Get all job templates with filtering and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      search,
      isPublic,
      companyId,
      createdBy
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {
      isActive: true
    };

    // Filter by category
    if (category && category !== 'all') {
      whereClause.category = category;
    }

    // Filter by public/private
    if (isPublic !== undefined) {
      whereClause.isPublic = isPublic === 'true';
    }

    // Filter by company
    if (companyId) {
      whereClause.companyId = companyId;
    }

    // Filter by creator
    if (createdBy) {
      whereClause.createdBy = createdBy;
    }

    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { tags: { [Op.contains]: [search] } }
      ];
    }

    const { count, rows: templates } = await JobTemplate.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'logo']
        }
      ],
      order: [
        ['usageCount', 'DESC'],
        ['lastUsedAt', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching job templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job templates',
      error: error.message
    });
  }
});

// Get a specific job template by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const template = await JobTemplate.findOne({
      where: {
        id,
        isActive: true
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'logo']
        }
      ]
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Job template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching job template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job template',
      error: error.message
    });
  }
});

// Create a new job template
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      isPublic = false,
      tags = [],
      templateData = {}
    } = req.body;

    // Validate required fields
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name and category are required'
      });
    }

    // Validate template data structure
    const requiredFields = [
      'title', 'department', 'location', 'type', 'experience',
      'salary', 'description', 'requirements', 'benefits', 'skills',
      'role', 'industryType', 'roleCategory', 'education', 'employmentType'
    ];

    const missingFields = requiredFields.filter(field => 
      !templateData[field] || 
      (Array.isArray(templateData[field]) && templateData[field].length === 0)
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required template fields: ${missingFields.join(', ')}`
      });
    }

    // Create the template
    const template = await JobTemplate.create({
      name,
      description,
      category,
      isPublic,
      tags,
      templateData,
      createdBy: req.user.id,
      companyId: req.user.companyId
    });

    // Fetch the created template with associations
    const createdTemplate = await JobTemplate.findByPk(template.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'logo']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: createdTemplate,
      message: 'Job template created successfully'
    });
  } catch (error) {
    console.error('Error creating job template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job template',
      error: error.message
    });
  }
});

// Update a job template
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      isPublic,
      tags,
      templateData
    } = req.body;

    // Find the template
    const template = await JobTemplate.findOne({
      where: {
        id,
        createdBy: req.user.id, // Only allow creator to update
        isActive: true
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Job template not found or you do not have permission to update it'
      });
    }

    // Update the template
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (tags !== undefined) updateData.tags = tags;
    if (templateData !== undefined) updateData.templateData = templateData;

    await template.update(updateData);

    // Fetch the updated template with associations
    const updatedTemplate = await JobTemplate.findByPk(template.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'logo']
        }
      ]
    });

    res.json({
      success: true,
      data: updatedTemplate,
      message: 'Job template updated successfully'
    });
  } catch (error) {
    console.error('Error updating job template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job template',
      error: error.message
    });
  }
});

// Delete a job template (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const template = await JobTemplate.findOne({
      where: {
        id,
        createdBy: req.user.id, // Only allow creator to delete
        isActive: true
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Job template not found or you do not have permission to delete it'
      });
    }

    // Soft delete
    await template.update({ isActive: false });

    res.json({
      success: true,
      message: 'Job template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job template',
      error: error.message
    });
  }
});

// Toggle template public/private status
router.patch('/:id/toggle-public', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const template = await JobTemplate.findOne({
      where: {
        id,
        createdBy: req.user.id, // Only allow creator to toggle
        isActive: true
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Job template not found or you do not have permission to modify it'
      });
    }

    await template.update({ isPublic: !template.isPublic });

    res.json({
      success: true,
      data: { isPublic: !template.isPublic },
      message: `Template is now ${!template.isPublic ? 'private' : 'public'}`
    });
  } catch (error) {
    console.error('Error toggling template visibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle template visibility',
      error: error.message
    });
  }
});

// Record template usage
router.post('/:id/use', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const template = await JobTemplate.findOne({
      where: {
        id,
        isActive: true
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Job template not found'
      });
    }

    // Update usage count and last used date
    await template.update({
      usageCount: template.usageCount + 1,
      lastUsedAt: new Date()
    });

    res.json({
      success: true,
      data: {
        usageCount: template.usageCount + 1,
        lastUsedAt: new Date()
      },
      message: 'Template usage recorded'
    });
  } catch (error) {
    console.error('Error recording template usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record template usage',
      error: error.message
    });
  }
});

// Get template data for job creation
router.post('/:id/apply', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const template = await JobTemplate.findOne({
      where: {
        id,
        isActive: true
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Job template not found'
      });
    }

    // Check if template is public or belongs to the user
    if (!template.isPublic && template.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to use this template'
      });
    }

    // Record usage
    await template.update({
      usageCount: template.usageCount + 1,
      lastUsedAt: new Date()
    });

    res.json({
      success: true,
      data: {
        prefill: template.templateData,
        templateName: template.name,
        templateId: template.id
      },
      message: 'Template data retrieved successfully'
    });
  } catch (error) {
    console.error('Error applying template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply template',
      error: error.message
    });
  }
});

// Get user's templates
router.get('/user/my-templates', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {
      createdBy: req.user.id,
      isActive: true
    };

    if (category && category !== 'all') {
      whereClause.category = category;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { tags: { [Op.contains]: [search] } }
      ];
    }

    const { count, rows: templates } = await JobTemplate.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'logo']
        }
      ],
      order: [
        ['usageCount', 'DESC'],
        ['lastUsedAt', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user templates',
      error: error.message
    });
  }
});

module.exports = router;