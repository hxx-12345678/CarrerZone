function isApplicationsClosed(job, now = new Date()) {
  if (!job) return true;
  const hasValidTill = job.validTill ? new Date(job.validTill) : null;
  const hasDeadline = job.applicationDeadline ? new Date(job.applicationDeadline) : null;
  if (hasValidTill && now > hasValidTill) return true;
  if (hasDeadline && now > hasDeadline) return true;
  return false;
}

module.exports = { isApplicationsClosed };


