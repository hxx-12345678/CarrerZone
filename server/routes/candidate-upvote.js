const express = require('express');
const router = express.Router();
const { CandidateLike, User, Notification } = require('../config');
const DashboardService = require('../services/dashboardService');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middlewares/auth');
const checkPermission = require('../middlewares/checkPermission');


// Ensure only employers and admins can like
function ensureEmployer(req, res, next) {
	if (!req.user || (req.user.user_type !== 'employer' && req.user.user_type !== 'admin')) {
		return res.status(403).json({ success: false, message: 'Only employers and admins can like candidates' });
	}
	next();
}

// Get like count and whether current employer liked
router.get('/:candidateId', authenticateToken, checkPermission('resumeDatabase'), async (req, res) => {
	try {
		const { candidateId } = req.params;
		const likeCount = await CandidateLike.count({ where: { candidateId } });
		let likedByCurrent = false;
		if (req.user && req.user.user_type === 'employer') {
			const existing = await CandidateLike.findOne({ where: { employerId: req.user.id, candidateId } });
			likedByCurrent = !!existing;
		}
		return res.json({ success: true, data: { likeCount, likedByCurrent } });
	} catch (error) {
		console.error('Error fetching candidate likes:', error);
		return res.status(500).json({ success: false, message: 'Failed to fetch likes' });
	}
});

// Like a candidate
router.post('/:candidateId', authenticateToken, checkPermission('resumeDatabase'), ensureEmployer, async (req, res) => {
	try {
		const { candidateId } = req.params;
		const { requirementId } = req.body;

		if (candidateId === req.user.id) {
			return res.status(400).json({ success: false, message: 'Cannot like your own profile' });
		}
		// Ensure candidate exists and is jobseeker
		const candidate = await User.findByPk(candidateId);
		if (!candidate || candidate.user_type !== 'jobseeker') {
			return res.status(404).json({ success: false, message: 'Candidate not found' });
		}

		// Create like with requirement ID if provided
		const [like, created] = await CandidateLike.findOrCreate({
			where: requirementId
				? { employerId: req.user.id, candidateId, requirementId }
				: { employerId: req.user.id, candidateId },
			defaults: requirementId
				? { employerId: req.user.id, candidateId, requirementId }
				: { employerId: req.user.id, candidateId }
		});

		// Record jobseeker activity without revealing employer identity
		try {
			await DashboardService.recordActivity(candidateId, 'profile_like', { source: 'employer', requirementId });
			await Notification.create({
				userId: candidateId,
				type: 'profile_view',
				title: 'Your profile received an upvote',
				message: 'Someone upvoted your profile.',
				priority: 'medium',
				icon: 'arrow-up',
				metadata: { event: 'profile_like', requirementId }
			});
		} catch (activityErr) {
			console.warn('Failed to record profile_like activity:', activityErr?.message || activityErr);
		}
		return res.json({ success: true, data: { saved: true, requirementId, created } });
	} catch (error) {
		console.error('Error liking candidate:', error);
		return res.status(500).json({ success: false, message: 'Failed to like candidate' });
	}
});

// Unlike a candidate
router.delete('/:candidateId', authenticateToken, checkPermission('resumeDatabase'), ensureEmployer, async (req, res) => {
	try {
		const { candidateId } = req.params;
		const { requirementId } = req.query;

		const whereClause = requirementId
			? { employerId: req.user.id, candidateId, requirementId }
			: { employerId: req.user.id, candidateId };

		const deleted = await CandidateLike.destroy({ where: whereClause });
		return res.json({ success: true, data: { removed: deleted > 0, requirementId } });
	} catch (error) {
		console.error('Error unliking candidate:', error);
		return res.status(500).json({ success: false, message: 'Failed to unlike candidate' });
	}
});

module.exports = router;
