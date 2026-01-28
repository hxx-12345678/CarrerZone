const express = require('express');
const router = express.Router();
const publicRouter = express.Router();
const jwt = require('jsonwebtoken');
const TeamController = require('../controller/TeamController');

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { User } = require('../config');
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(403).json({ success: false, message: 'User not found' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      user_type: user.user_type,
      company_id: user.company_id,
      first_name: user.first_name,
      last_name: user.last_name
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Public routes (no authentication required)
publicRouter.get('/verify-invitation', TeamController.verifyInvitation);
publicRouter.post('/accept-invitation', TeamController.acceptInvitation);

// Apply authentication to all protected routes
router.use(authenticateToken);

// Get team members
router.get('/members', TeamController.getTeamMembers);

// Invite team member
router.post('/invite', TeamController.inviteTeamMember);

// Remove team member
router.delete('/members/:userId', TeamController.removeTeamMember);

// Cancel invitation
router.delete('/invitations/:invitationId', TeamController.cancelInvitation);

// Update team member permissions
router.put('/members/:userId/permissions', TeamController.updateTeamMemberPermissions);

// Update team member phone
router.put('/members/:userId/phone', TeamController.updateTeamMemberPhone);

module.exports = { router, publicRouter };
