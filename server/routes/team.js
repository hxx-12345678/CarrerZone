const express = require('express');
const router = express.Router();
const publicRouter = express.Router();
const jwt = require('jsonwebtoken');
const TeamController = require('../controller/TeamController');

const { authenticateToken } = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');

// Public routes (no authentication required)
publicRouter.get('/verify-invitation', TeamController.verifyInvitation);
publicRouter.post('/accept-invitation', TeamController.acceptInvitation);

// Apply authentication to all protected routes
router.use(authenticateToken);
router.use(checkPermission('settings'));

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
