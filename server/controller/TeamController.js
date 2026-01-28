'use strict';

const { TeamInvitation, User, Company, Notification, Subscription, SubscriptionPlan } = require('../config');
const crypto = require('crypto');
const { Op } = require('sequelize');

/**
 * Generate a default password for invited users
 * Can be customized per invitation
 */
function generateDefaultPassword(customPassword = null) {
  if (customPassword) {
    return customPassword;
  }
  // Generate a secure random password: Name@123
  const adjectives = ['Player', 'Team', 'Star', 'Pro', 'Elite', 'Ace', 'Champ', 'Hero'];
  const numbers = '123456789';
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNum = numbers[Math.floor(Math.random() * numbers.length)];
  return `${randomAdj}@${randomNum}${randomNum}${randomNum}`;
}

/**
 * Get all team members for a company
 */
exports.getTeamMembers = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    // Verify user is admin
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view team members'
      });
    }

    // Get all users in the company (using model attribute companyId, Sequelize maps to company_id)
    const teamMembers = await User.findAll({
      where: {
        companyId: companyId
      },
      attributes: [
        'id', 'email', 'first_name', 'last_name', 'phone', 
        'user_type', 'designation', 'is_active', 'is_email_verified',
        'is_phone_verified', 'preferences', 'created_at', 'last_login_at'
      ],
      order: [['created_at', 'DESC']]
    });

    // Get pending invitations
    const pendingInvitations = await TeamInvitation.findAll({
      where: {
        companyId: companyId,
        status: 'pending',
        expiresAt: { [Op.gt]: new Date() }
      },
      include: [{
        model: User,
        as: 'inviter',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: {
        teamMembers: teamMembers.map(member => {
          // Admin users (super-users) should always show as email verified
          const isEmailVerified = member.user_type === 'admin' || member.user_type === 'superadmin' 
            ? true 
            : member.is_email_verified;
          
          return {
            id: member.id,
            email: member.email,
            firstName: member.first_name,
            lastName: member.last_name,
            phone: member.phone,
            userType: member.user_type,
            designation: member.designation,
            isActive: member.is_active,
            isEmailVerified: isEmailVerified,
            isPhoneVerified: member.is_phone_verified,
            permissions: member.preferences?.permissions || {},
            createdAt: member.created_at,
            lastLoginAt: member.last_login_at,
            isAdmin: member.user_type === 'admin' || member.user_type === 'superadmin'
          };
        }),
        pendingInvitations: pendingInvitations.map(inv => ({
          id: inv.id,
          email: inv.email,
          firstName: inv.firstName,
          lastName: inv.lastName,
          phone: inv.phone,
          designation: inv.designation,
          permissions: inv.permissions,
          status: inv.status,
          expiresAt: inv.expiresAt,
          createdAt: inv.created_at,
          invitedBy: inv.inviter ? {
            id: inv.inviter.id,
            name: `${inv.inviter.first_name} ${inv.inviter.last_name}`.trim(),
            email: inv.inviter.email
          } : null
        }))
      }
    });
  } catch (error) {
    console.error('❌ Get team members error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve team members',
      error: error.message
    });
  }
};

/**
 * Invite a new team member
 */
exports.inviteTeamMember = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    // Verify user is admin
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can invite team members'
      });
    }

    const { email, firstName, lastName, phone, designation, permissions, defaultPassword } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user already exists with this email
    const existingUser = await User.findOne({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      if (existingUser.companyId === companyId) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of this company'
        });
      } else if (existingUser.companyId) {
        return res.status(400).json({
          success: false,
          message: 'User is already associated with another company'
        });
      }
    }

    // Check subscription limits (optional - only enforce if subscription exists)
    let maxUsers = 10; // Default limit for testing
    
    try {
      const activeSubscription = await Subscription.findOne({
        where: {
          userId: req.user.id,
          status: 'active'
        },
        include: [{
          model: SubscriptionPlan,
          as: 'plan'
        }]
      });

      if (activeSubscription?.plan) {
        // Check plan features for maxUsers or maxTeamMembers
        const planFeatures = activeSubscription.plan.features || {};
        maxUsers = planFeatures.maxUsers || planFeatures.maxTeamMembers || planFeatures.teamMembers || 10;
        
        // If maxUsers is 0 or null, treat as unlimited
        if (maxUsers === 0 || maxUsers === null || maxUsers === undefined) {
          maxUsers = 999999; // Unlimited
        }
      }
    } catch (subscriptionError) {
      console.warn('⚠️ Could not check subscription limits:', subscriptionError.message);
      // Continue with default limit
    }

    // Get current team member count
    const currentMemberCount = await User.count({
      where: { companyId: companyId }
    });

    // Check pending invitations count
    const pendingInvitationsCount = await TeamInvitation.count({
      where: {
        companyId: companyId,
        status: 'pending',
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    const totalUsers = currentMemberCount + pendingInvitationsCount;
    
    // Only enforce limit if it's not unlimited
    if (maxUsers < 999999 && totalUsers >= maxUsers) {
      return res.status(403).json({
        success: false,
        message: `Team member limit reached. Your subscription allows ${maxUsers} team members. Please upgrade your subscription or remove existing members.`,
        currentCount: totalUsers,
        maxUsers: maxUsers
      });
    }

    // Check for existing pending invitation
    const existingInvitation = await TeamInvitation.findOne({
      where: {
        email: email.toLowerCase(),
        companyId: companyId,
        status: 'pending'
      }
    });

    if (existingInvitation && !existingInvitation.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'Invitation already sent to this email'
      });
    }

    // Generate invitation token
    const token = TeamInvitation.generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // Generate default password for the user (use provided or generate)
    const userDefaultPassword = defaultPassword || generateDefaultPassword();
    
    // Store password hash in invitation metadata (we'll use it when accepting)
    const invitationData = {
      companyId: companyId,
      invitedBy: req.user.id,
      email: email.toLowerCase(),
      firstName: firstName,
      lastName: lastName,
      phone: phone,
      token: token,
      status: 'pending',
      expiresAt: expiresAt,
      designation: designation || 'Recruiter',
      permissions: permissions || {
        jobPosting: true,
        resumeDatabase: true,
        analytics: true,
        featuredJobs: false,
        hotVacancies: false,
        applications: true,
        requirements: true,
        settings: false
      }
    };

    // Store default password in permissions metadata (temporary storage)
    if (!invitationData.permissions) {
      invitationData.permissions = {};
    }
    invitationData.permissions._defaultPassword = userDefaultPassword;

    // Create invitation
    const invitation = await TeamInvitation.create(invitationData);

    // Generate invitation link
    const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invitation?token=${token}`;

    // Generate email content with password
    const emailContent = {
      to: email.toLowerCase(),
      subject: `Team Invitation - Join ${(await Company.findByPk(companyId)).name}`,
      html: `
        <h2>You've been invited to join the team!</h2>
        <p>Hello ${firstName || 'there'},</p>
        <p>You have been invited to join ${(await Company.findByPk(companyId)).name} as a ${designation || 'Recruiter'}.</p>
        <p><strong>Your default password:</strong> <code>${userDefaultPassword}</code></p>
        <p>Click the link below to accept the invitation and set up your account:</p>
        <p><a href="${invitationLink}">${invitationLink}</a></p>
        <p><strong>Important:</strong> After accepting, you can login with:</p>
        <ul>
          <li>Email: ${email.toLowerCase()}</li>
          <li>Password: ${userDefaultPassword}</li>
        </ul>
        <p>This invitation expires on ${expiresAt.toLocaleDateString()}.</p>
        <p>If you did not request this invitation, please ignore this email.</p>
      `
    };

    // TODO: Send email via email service
    console.log(`📧 Invitation email would be sent to ${email}:`);
    console.log(`   Subject: ${emailContent.subject}`);
    console.log(`   Password: ${userDefaultPassword}`);
    console.log(`   Link: ${invitationLink}`);
    
    // Return default password in response so admin can share it
    const responseData = {
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
        invitationLink: invitationLink,
        defaultPassword: userDefaultPassword // Include password in response
      }
    };

    // Create notification
    try {
      await Notification.create({
        userId: req.user.id,
        type: 'team_invitation_sent',
        title: 'Team Member Invited',
        message: `Invitation sent to ${email}`,
        data: {
          invitationId: invitation.id,
          email: email
        }
      });
    } catch (notificationError) {
      console.error('❌ Failed to create notification:', notificationError);
    }

    return res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          expiresAt: invitation.expiresAt,
          invitationLink: invitationLink,
          defaultPassword: userDefaultPassword // Include password in response for admin to share
        }
      }
    });
  } catch (error) {
    console.error('❌ Invite team member error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to invite team member',
      error: error.message
    });
  }
};

/**
 * Remove a team member
 */
exports.removeTeamMember = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { userId } = req.params;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    // Verify user is admin
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can remove team members'
      });
    }

    // Cannot remove yourself
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove yourself from the team'
      });
    }

    // Find the user
    const userToRemove = await User.findOne({
      where: {
        id: userId,
        companyId: companyId
      }
    });

    if (!userToRemove) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Cannot remove other admins (only superadmin can)
    if (userToRemove.user_type === 'admin' && req.user.user_type !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can remove admin users'
      });
    }

    // Remove user from company (using companyId, Sequelize maps to company_id)
    await userToRemove.update({
      companyId: null,
      user_type: 'jobseeker' // Revert to jobseeker
    });

    // Cancel any pending invitations for this user's email
    await TeamInvitation.update(
      { status: 'cancelled' },
      {
        where: {
          email: userToRemove.email,
          companyId: companyId,
          status: 'pending'
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Team member removed successfully'
    });
  } catch (error) {
    console.error('❌ Remove team member error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove team member',
      error: error.message
    });
  }
};

/**
 * Cancel an invitation
 */
exports.cancelInvitation = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { invitationId } = req.params;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    // Verify user is admin
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can cancel invitations'
      });
    }

    const invitation = await TeamInvitation.findOne({
      where: {
        id: invitationId,
        companyId: companyId
      }
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending invitations can be cancelled'
      });
    }

    await invitation.update({ status: 'cancelled' });

    return res.status(200).json({
      success: true,
      message: 'Invitation cancelled successfully'
    });
  } catch (error) {
    console.error('❌ Cancel invitation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel invitation',
      error: error.message
    });
  }
};

/**
 * Verify invitation token
 */
exports.verifyInvitation = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Invitation token is required'
      });
    }

    const invitation = await TeamInvitation.findOne({
      where: { token },
      include: [{
        model: Company,
        as: 'company',
        attributes: ['id', 'name', 'logo']
      }]
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invitation token'
      });
    }

    if (!invitation.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Invitation has expired or been cancelled'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          firstName: invitation.firstName,
          lastName: invitation.lastName,
          designation: invitation.designation,
          company: invitation.company
        }
      }
    });
  } catch (error) {
    console.error('❌ Verify invitation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify invitation',
      error: error.message
    });
  }
};

/**
 * Accept invitation and create user account
 */
exports.acceptInvitation = async (req, res) => {
  try {
    const { token, password, firstName, lastName, phone } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Invitation token is required'
      });
    }

    const invitation = await TeamInvitation.findOne({
      where: { token },
      include: [{
        model: Company,
        as: 'company'
      }]
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invitation token'
      });
    }

    if (!invitation.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Invitation has expired or been cancelled'
      });
    }

    // Check if user already exists
    let user = await User.findOne({
      where: { email: invitation.email.toLowerCase() }
    });

    if (user && (user.companyId || user.company_id)) {
      return res.status(400).json({
        success: false,
        message: 'User is already associated with a company'
      });
    }

    // Use provided password or default password from invitation
    let userPassword = password;
    if (!userPassword && invitation.permissions?._defaultPassword) {
      userPassword = invitation.permissions._defaultPassword;
      console.log(`🔑 Using default password from invitation for ${invitation.email}`);
    }
    
    if (!userPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password is required. Please provide a password or use the default password from your invitation email.'
      });
    }

    // Pass plain password - User model hooks will hash it automatically
    if (user) {
      // Update existing user (use companyId model attribute, Sequelize maps to company_id)
      // Pass plain password - hook will hash it
      await user.update({
        password: userPassword, // Plain password - hook will hash
        first_name: firstName || invitation.firstName || user.first_name,
        last_name: lastName || invitation.lastName || user.last_name,
        phone: phone || invitation.phone || user.phone,
        companyId: invitation.companyId,
        user_type: 'employer',
        designation: invitation.designation,
        is_email_verified: true,
        preferences: {
          ...user.preferences,
          permissions: invitation.permissions,
          employerRole: 'recruiter'
        }
      });
    } else {
      // Create new user (use companyId model attribute, Sequelize maps to company_id)
      // Pass plain password - hook will hash it automatically
      user = await User.create({
        email: invitation.email.toLowerCase(),
        password: userPassword, // Plain password - hook will hash
        first_name: firstName || invitation.firstName,
        last_name: lastName || invitation.lastName,
        phone: phone || invitation.phone,
        companyId: invitation.companyId,
        user_type: 'employer',
        designation: invitation.designation,
        is_email_verified: true,
        preferences: {
          permissions: invitation.permissions,
          employerRole: 'recruiter'
        }
      });
    }

    // Update invitation
    await invitation.update({
      status: 'accepted',
      acceptedAt: new Date(),
      userId: user.id
    });

    // Remove password from response metadata
    if (invitation.permissions?._defaultPassword) {
      delete invitation.permissions._defaultPassword;
      await invitation.update({ permissions: invitation.permissions });
    }

    return res.status(200).json({
      success: true,
      message: 'Invitation accepted successfully. You can now login with your email and password.',
      data: {
        userId: user.id,
        email: user.email,
        password: userPassword // Return password so frontend can show it (or send via email)
      }
    });
  } catch (error) {
    console.error('❌ Accept invitation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to accept invitation',
      error: error.message
    });
  }
};

/**
 * Update team member permissions
 */
exports.updateTeamMemberPermissions = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { userId } = req.params;
    const { permissions, designation } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    // Verify user is admin
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update permissions'
      });
    }

    const teamMember = await User.findOne({
      where: {
        id: userId,
        companyId: companyId
      }
    });

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    const updateData = {};
    
    if (permissions) {
      updateData.preferences = {
        ...teamMember.preferences,
        permissions: permissions
      };
    }

    if (designation) {
      updateData.designation = designation;
    }

    await teamMember.update(updateData);

    return res.status(200).json({
      success: true,
      message: 'Team member permissions updated successfully'
    });
  } catch (error) {
    console.error('❌ Update team member permissions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update permissions',
      error: error.message
    });
  }
};

/**
 * Update team member phone number (admin can update)
 */
exports.updateTeamMemberPhone = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { userId } = req.params;
    const { phone } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'User must be associated with a company'
      });
    }

    // Verify user is admin
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update phone numbers'
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const teamMember = await User.findOne({
      where: {
        id: userId,
        companyId: companyId
      }
    });

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    await teamMember.update({
      phone: phone,
      is_phone_verified: false // Reset verification when phone is updated
    });

    return res.status(200).json({
      success: true,
      message: 'Phone number updated successfully'
    });
  } catch (error) {
    console.error('❌ Update team member phone error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update phone number',
      error: error.message
    });
  }
};

