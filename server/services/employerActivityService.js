const UserActivityLog = require('../models/UserActivityLog');

class EmployerActivityService {
  static async logActivity(userId, activityType, options = {}) {
    try {
      if (!userId || !activityType) return null;

      // Validate UUIDs
      const isValidUUID = (str) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
      };

      const payload = {
        userId,
        activityType,
        details: options.details || {},
        jobId: (options.jobId && isValidUUID(options.jobId)) ? options.jobId : null,
        applicationId: (options.applicationId && isValidUUID(options.applicationId)) ? options.applicationId : null,
        timestamp: options.timestamp || new Date()
      };

      return await UserActivityLog.create(payload);
    } catch (error) {
      console.error('EmployerActivityService.logActivity error:', error?.message || error);
      return null; // Do not block controller flow
    }
  }

  static async logCandidateSearch(userId, { keywords, filters = {}, resultsCount, context = {} } = {}) {
    const details = {
      keywords: keywords || filters?.query || null,
      filters,
      resultsCount: typeof resultsCount === 'number' ? resultsCount : null,
      ...('ipAddress' in context ? { ipAddress: context.ipAddress } : {}),
      ...('userAgent' in context ? { userAgent: context.userAgent } : {})
    };
    return this.logActivity(userId, 'candidate_search', { details });
  }

  static async logCandidateProfileView(userId, candidateId, context = {}) {
    const details = {
      candidateId,
      ...('ipAddress' in context ? { ipAddress: context.ipAddress } : {}),
      ...('userAgent' in context ? { userAgent: context.userAgent } : {})
    };
    return this.logActivity(userId, 'candidate_profile_view', { details });
  }

  static async logJobPost(userId, jobId, extra = {}) {
    const details = { jobId, ...extra };
    return this.logActivity(userId, 'job_post', { jobId, details });
  }

  static async logApplicationReceived(userId, applicationId, jobId, extra = {}) {
    const details = { applicationId, jobId, ...extra };
    return this.logActivity(userId, 'application_received', { applicationId, jobId, details });
  }

  static async logLogin(userId, context = {}) {
    const details = {
      ...('ipAddress' in context ? { ipAddress: context.ipAddress } : {}),
      ...('userAgent' in context ? { userAgent: context.userAgent } : {}),
      method: context.method || 'password'
    };
    return this.logActivity(userId, 'login', { details });
  }

  static async logResumeDownload(userId, resumeId, candidateId, context = {}) {
    const details = {
      resumeId,
      candidateId,
      ...('ipAddress' in context ? { ipAddress: context.ipAddress } : {}),
      ...('userAgent' in context ? { userAgent: context.userAgent } : {}),
      ...('applicationId' in context ? { applicationId: context.applicationId } : {})
    };
    return this.logActivity(userId, 'resume_download', { details });
  }

  static async logResumeView(userId, resumeId, candidateId, context = {}) {
    const details = {
      resumeId,
      candidateId,
      ...('ipAddress' in context ? { ipAddress: context.ipAddress } : {}),
      ...('userAgent' in context ? { userAgent: context.userAgent } : {}),
      ...('applicationId' in context ? { applicationId: context.applicationId } : {})
    };
    return this.logActivity(userId, 'resume_view', { details });
  }

  static async logCandidateShortlist(userId, candidateId, context = {}) {
    const details = {
      candidateId,
      ...('requirementId' in context ? { requirementId: context.requirementId } : {}),
      ...('applicationId' in context ? { applicationId: context.applicationId } : {}),
      ...('jobId' in context ? { jobId: context.jobId } : {}),
      ...('requirementTitle' in context ? { requirementTitle: context.requirementTitle } : {}),
      ...('candidateName' in context ? { candidateName: context.candidateName } : {}),
      ...('companyName' in context ? { companyName: context.companyName } : {})
    };
    return this.logActivity(userId, 'candidate_shortlisted', { details });
  }

  static async logApplicationStatusChange(userId, applicationId, oldStatus, newStatus, context = {}) {
    const details = {
      applicationId,
      oldStatus,
      newStatus,
      ...('candidateId' in context ? { candidateId: context.candidateId } : {}),
      ...('jobId' in context ? { jobId: context.jobId } : {}),
      ...('reason' in context ? { reason: context.reason } : {}),
      ...('notes' in context ? { notes: context.notes } : {}),
      ...('ipAddress' in context ? { ipAddress: context.ipAddress } : {}),
      ...('userAgent' in context ? { userAgent: context.userAgent } : {})
    };
    return this.logActivity(userId, 'application_status_changed', { details, applicationId });
  }

  static async logInterviewScheduled(userId, interviewId, candidateId, context = {}) {
    const details = {
      interviewId,
      candidateId,
      ...('applicationId' in context ? { applicationId: context.applicationId } : {}),
      ...('jobId' in context ? { jobId: context.jobId } : {}),
      ...('scheduledAt' in context ? { scheduledAt: context.scheduledAt } : {}),
      ...('interviewType' in context ? { interviewType: context.interviewType } : {}),
      ...('location' in context ? { location: context.location } : {}),
      ...('meetingLink' in context ? { meetingLink: context.meetingLink } : {}),
      ...('candidateName' in context ? { candidateName: context.candidateName } : {}),
      ...('jobTitle' in context ? { jobTitle: context.jobTitle } : {}),
      ...('companyName' in context ? { companyName: context.companyName } : {})
    };
    return this.logActivity(userId, 'interview_scheduled', { details, applicationId: context.applicationId, jobId: context.jobId });
  }

  static async logInterviewUpdated(userId, interviewId, candidateId, context = {}) {
    const details = {
      interviewId,
      candidateId,
      ...('applicationId' in context ? { applicationId: context.applicationId } : {}),
      ...('jobId' in context ? { jobId: context.jobId } : {}),
      ...('oldStatus' in context ? { oldStatus: context.oldStatus } : {}),
      ...('newStatus' in context ? { newStatus: context.newStatus } : {}),
      ...('changes' in context ? { changes: context.changes } : {}),
      ...('ipAddress' in context ? { ipAddress: context.ipAddress } : {}),
      ...('userAgent' in context ? { userAgent: context.userAgent } : {})
    };
    return this.logActivity(userId, 'interview_updated', { details, applicationId: context.applicationId, jobId: context.jobId });
  }
}

module.exports = EmployerActivityService;


