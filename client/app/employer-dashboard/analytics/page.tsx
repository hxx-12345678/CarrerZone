"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"
import { apiService } from "@/lib/api"
import { EmployerDashboardNavbar } from "@/components/employer-dashboard-navbar"
import { EmployerDashboardFooter } from "@/components/employer-dashboard-footer"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LineChart, Line } from "recharts"

export default function EmployerAnalyticsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Recruiter-level
  const [myActivitiesCount, setMyActivitiesCount] = useState({ accessed: 0, hired: 0, shortlisted: 0 })

  // Company-admin level
  const [companyTotals, setCompanyTotals] = useState({ accessed: 0, hired: 0, shortlisted: 0 })
  const [perRecruiter, setPerRecruiter] = useState<Array<{ userId: string; name?: string; email?: string; accessed: number; hired: number; shortlisted: number }>>([])

  // Shared charts
  const [recruiterPerformance, setRecruiterPerformance] = useState<any[]>([])

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace("/login"); return }

    // Both recruiters and admins can access analytics, but scope differs
    if (user.userType !== "employer" && user.userType !== "admin") {
      router.replace("/")
      return
    }

    // Load data
    void loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading])

  const loadData = async () => {
    try {
      // Recruiter (self) activity snapshot
      // Using usage activities with filters for current user to derive quick counts.
      // Backend returns activities array; we count by type if available.
      const myActs = await apiService.getUsageActivities({ userId: user?.id, limit: 1000 })
      if (myActs.success && Array.isArray(myActs.data)) {
        const counts = { accessed: 0, hired: 0, shortlisted: 0 }
        const shortlistedKeys = new Set<string>()
        const hiredKeys = new Set<string>()
        const shortlistedDebugSelf: Array<{ appKey: string; activityType: string; activityId?: string; candidate?: any; details?: any }>=[]
        const accessedSet = new Set([
          'profile_viewed', 'resume_view', 'resume_downloaded', 'profile_visits',
          'resume_view', 'candidate_view', 'profile_view', 'candidate_profile_view',
          'application_viewed', 'application_reviewed', 'view_resume', 'view_profile'
        ])
        const hiredSet = new Set([
          'application_hired', 'candidate_hired', 'hired'
        ])
        const shortlistedSet = new Set([
          // most likely shortlist events
          'application_shortlisted', 'candidate_shortlisted', 'requirement_shortlist',
          // common status change pattern
          'application_status_changed',
          // fallback generic
          'shortlisted'
        ])

        const accessedKeys = new Set<string>()
        for (const a of myActs.data) {
          const t = String(a.activityType || '').toLowerCase()
          // Only count when tied to a concrete application/candidate; do NOT fallback to log id
          const appKey = (a.applicationId || a.details?.applicationId || a.details?.candidateId || a.details?.viewedUserId || '').toString()
          const candidateKey = (a.details?.candidateId || a.details?.viewedUserId || appKey || '').toString()
          
          // Count unique candidates accessed (profile views, resume views, etc.)
          if (accessedSet.has(t) && candidateKey && !accessedKeys.has(candidateKey)) {
            accessedKeys.add(candidateKey)
            counts.accessed += 1
          }
          
          const newStatus = (a.details && (a.details.newStatus || a.details.status))?.toString().toLowerCase()
          if (hiredSet.has(t) && appKey && !hiredKeys.has(appKey)) { hiredKeys.add(appKey); counts.hired += 1 }
          // Only count shortlist events if not an 'under_review' state; if status present, require 'shortlisted'
          if (shortlistedSet.has(t) && appKey && !shortlistedKeys.has(appKey)) {
            if (newStatus && newStatus !== 'shortlisted') {
              // skip counting non-shortlisted status changes (e.g., under_review)
      } else {
              shortlistedKeys.add(appKey); counts.shortlisted += 1; shortlistedDebugSelf.push({ appKey, activityType: t, activityId: a.id, candidate: a.applicant || a.details?.candidate, details: a.details })
            }
          }
          // Status change payloads
          if (newStatus === 'hired' && appKey && !hiredKeys.has(appKey)) { hiredKeys.add(appKey); counts.hired += 1 }
          if (newStatus === 'shortlisted' && appKey && !shortlistedKeys.has(appKey)) { shortlistedKeys.add(appKey); counts.shortlisted += 1; shortlistedDebugSelf.push({ appKey, activityType: 'status_change', activityId: a.id, candidate: a.applicant || a.details?.candidate, details: a.details }) }
        }
        const selfNames = shortlistedDebugSelf.map(e => {
          const c = e.candidate || {};
          const n = (c.first_name && c.last_name) ? `${c.first_name} ${c.last_name}` : (c.name || c.email || c.fullName);
          return n || 'Unknown Candidate';
        })
        console.log('🔍 Self shortlisted candidates (names):', Array.from(new Set(selfNames)))
        setMyActivitiesCount(counts)
      }

      // Recruiter leaderboard: show only for company admins
      if (user?.userType === 'admin' && user.companyId) {
        const perf = await apiService.getRecruiterPerformance({})
        if (perf.success && Array.isArray(perf.data)) {
          setRecruiterPerformance(perf.data)
        }
      } else {
        setRecruiterPerformance([])
      }

      // Company admin view: compute totals and per recruiter aggregations from usage summary + activities
      if (user?.userType === "admin" && user.companyId) {
        const summary = await apiService.getUsageSummary()
        const activities = await apiService.getUsageActivities({ limit: 2000 })

        if (activities.success && Array.isArray(activities.data)) {
          // Build perRecruiter rollup
          const byRecruiter: Record<string, { userId: string; name?: string; email?: string; accessed: number; hired: number; shortlisted: number; hiredKeys: Set<string>; shortlistedKeys: Set<string>; accessedKeys: Set<string>; }> = {}
          const shortlistedDebugCompany: Array<{ recruiterId: string; recruiterEmail?: string; appKey: string; activityType: string; activityId?: string; candidate?: any; details?: any }>=[]
          const accessedSet = new Set([
            'profile_viewed', 'resume_view', 'resume_downloaded', 'profile_visits',
            'candidate_view', 'profile_view', 'candidate_profile_view',
            'application_viewed', 'application_reviewed', 'view_resume', 'view_profile'
          ])
          const hiredSet = new Set([
            'application_hired', 'candidate_hired', 'hired'
          ])
          const shortlistedSet = new Set([
            'application_shortlisted', 'candidate_shortlisted', 'requirement_shortlist',
            'application_status_changed',
            'shortlisted'
          ])
          const companyAccessedKeys = new Set<string>()
          for (const a of activities.data) {
            const uid = a.userId || a.user?.id
            if (!uid) continue
            if (!byRecruiter[uid]) {
              byRecruiter[uid] = { userId: uid, name: a.user?.name, email: a.user?.email, accessed: 0, hired: 0, shortlisted: 0, hiredKeys: new Set(), shortlistedKeys: new Set(), accessedKeys: new Set() }
            }
            const t = String(a.activityType || '').toLowerCase()
            // Only count when tied to a concrete application/candidate; do NOT fallback to log id
            const appKey = (a.applicationId || a.details?.applicationId || a.details?.candidateId || a.details?.viewedUserId || '').toString()
            const candidateKey = (a.details?.candidateId || a.details?.viewedUserId || appKey || '').toString()
            
            // Count unique candidates accessed per recruiter and company total
            if (accessedSet.has(t) && candidateKey) {
              if (!byRecruiter[uid].accessedKeys) {
                byRecruiter[uid].accessedKeys = new Set()
              }
              if (!byRecruiter[uid].accessedKeys.has(candidateKey)) {
                byRecruiter[uid].accessedKeys.add(candidateKey)
                byRecruiter[uid].accessed += 1
              }
              // Count for company total (unique candidates across all recruiters)
              if (!companyAccessedKeys.has(candidateKey)) {
                companyAccessedKeys.add(candidateKey)
              }
            }
            
            if (hiredSet.has(t) && appKey && !byRecruiter[uid].hiredKeys.has(appKey)) { byRecruiter[uid].hiredKeys.add(appKey); byRecruiter[uid].hired += 1 }
            const newStatus = (a.details && (a.details.newStatus || a.details.status))?.toString().toLowerCase()
            if (shortlistedSet.has(t) && appKey && !byRecruiter[uid].shortlistedKeys.has(appKey)) {
              if (newStatus && newStatus !== 'shortlisted') {
                // skip non-shortlisted (e.g., under_review)
              } else {
                byRecruiter[uid].shortlistedKeys.add(appKey); byRecruiter[uid].shortlisted += 1; shortlistedDebugCompany.push({ recruiterId: uid, recruiterEmail: a.user?.email, appKey, activityType: t, activityId: a.id, candidate: a.applicant || a.details?.candidate, details: a.details })
              }
            }
            // reuse newStatus from above
            if (newStatus === 'hired' && appKey && !byRecruiter[uid].hiredKeys.has(appKey)) { byRecruiter[uid].hiredKeys.add(appKey); byRecruiter[uid].hired += 1 }
            if (newStatus === 'shortlisted' && appKey && !byRecruiter[uid].shortlistedKeys.has(appKey)) { byRecruiter[uid].shortlistedKeys.add(appKey); byRecruiter[uid].shortlisted += 1; shortlistedDebugCompany.push({ recruiterId: uid, recruiterEmail: a.user?.email, appKey, activityType: 'status_change', activityId: a.id, candidate: a.applicant || a.details?.candidate, details: a.details }) }
          }
          
          const rows = Object.values(byRecruiter).map(r => ({ userId: r.userId, name: r.name, email: r.email, accessed: r.accessed, hired: r.hired, shortlisted: r.shortlisted }))
          const companyNames = shortlistedDebugCompany.map(e => {
            const c = e.candidate || {};
            const n = (c.first_name && c.last_name) ? `${c.first_name} ${c.last_name}` : (c.name || c.email || c.fullName);
            return n || 'Unknown Candidate';
          })
          console.log('🔍 Company shortlisted candidates (names):', Array.from(new Set(companyNames)))
          setPerRecruiter(rows)

          // Set company totals based on unique candidates accessed (not summing per-recruiter counts which can duplicate)
          setCompanyTotals({
            accessed: companyAccessedKeys.size,
            hired: Array.from(new Set(Array.from(Object.values(byRecruiter)).flatMap(r => Array.from(r.hiredKeys)))).length,
            shortlisted: Array.from(new Set(Array.from(Object.values(byRecruiter)).flatMap(r => Array.from(r.shortlistedKeys)))).length
          })
        }

        // Optionally merge recruiter identity from summary
        if (summary.success && Array.isArray(summary.data)) {
          const identityIndex = new Map(summary.data.map((r: any) => [r.userId, { name: r.name, email: r.email }]))
          setPerRecruiter(prev => prev.map(r => ({ ...r, ...identityIndex.get(r.userId) })))
        }
      }
    } catch (e) {
      // Fail silently to avoid breaking existing flows
      // console.error(e)
    }
  }

  const perRecruiterChart = useMemo(() => perRecruiter.map(r => ({ recruiter: r.email || r.name || r.userId, accessed: r.accessed, hired: r.hired, shortlisted: r.shortlisted })), [perRecruiter])

  if (loading) return <div className="p-6">Loading...</div>
  if (!user || (user.userType !== "employer" && user.userType !== "admin")) return null

  const isCompanyAdmin = user.userType === "admin" && !!user.companyId

  return (
    <EmployerAuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-auto">
      <EmployerDashboardNavbar />
      
      {/* Background Effects - Blue theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Base blue gradient overlay to ensure visible background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200/45 via-cyan-200/35 to-indigo-200/45"></div>
        <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-300/10 to-cyan-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-indigo-300/10 to-violet-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-cyan-300/10 to-blue-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        {/* Wide translucent blue gradient strip */}
        <div className="absolute top-[22%] left-0 right-0 h-24 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-indigo-400/20"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-8">
        <div className="space-y-8">
              <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <div className="text-sm text-gray-600">{isCompanyAdmin ? "Company Admin View" : "Recruiter View"}</div>
        </div>

        {/* Recruiter (self) quick stats */}
        <section className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(59,130,246,0.06)] rounded-3xl p-6">
          <h2 className="text-xl font-semibold mb-6 text-slate-900">Your Activity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white/50 backdrop-blur-md border border-white/30 rounded-2xl p-4 hover:bg-white/70 transition-colors">
              <div className="text-slate-600 text-sm font-medium">Candidates Accessed</div>
              <div className="text-3xl font-bold text-slate-900 mt-2">{myActivitiesCount.accessed}</div>
            </div>
            <div className="bg-white/50 backdrop-blur-md border border-white/30 rounded-2xl p-4 hover:bg-white/70 transition-colors">
              <div className="text-slate-600 text-sm font-medium">Candidates Hired</div>
              <div className="text-3xl font-bold text-slate-900 mt-2">{myActivitiesCount.hired}</div>
            </div>
            <div className="bg-white/50 backdrop-blur-md border border-white/30 rounded-2xl p-4 hover:bg-white/70 transition-colors">
              <div className="text-slate-600 text-sm font-medium">Candidates Shortlisted</div>
              <div className="text-3xl font-bold text-slate-900 mt-2">{myActivitiesCount.shortlisted}</div>
            </div>
          </div>
        </section>

        {/* Recruiter leaderboard (company admin only) */}
        {isCompanyAdmin && (
        <section className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(59,130,246,0.06)] rounded-3xl p-6">
          <h2 className="text-xl font-semibold mb-6 text-slate-900">Recruiter Performance</h2>
          <div className="h-72 w-full bg-white/30 backdrop-blur-md rounded-2xl p-4">
            <ResponsiveContainer>
              <LineChart data={recruiterPerformance as any[]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="email" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="activityCount" name="Activities" stroke="#2563eb" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        )}

        {/* Company admin only: company-wide analytics */}
        {isCompanyAdmin && (
          <section className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(59,130,246,0.06)] rounded-3xl p-6">
            <h2 className="text-xl font-semibold mb-6 text-slate-900">Company-wide Analytics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
              <div className="bg-white/50 backdrop-blur-md border border-white/30 rounded-2xl p-4 hover:bg-white/70 transition-colors">
                <div className="text-slate-600 text-sm font-medium">Total Accessed</div>
                <div className="text-3xl font-bold text-slate-900 mt-2">{companyTotals.accessed}</div>
              </div>
              <div className="bg-white/50 backdrop-blur-md border border-white/30 rounded-2xl p-4 hover:bg-white/70 transition-colors">
                <div className="text-slate-600 text-sm font-medium">Total Hired</div>
                <div className="text-3xl font-bold text-slate-900 mt-2">{companyTotals.hired}</div>
              </div>
              <div className="bg-white/50 backdrop-blur-md border border-white/30 rounded-2xl p-4 hover:bg-white/70 transition-colors">
                <div className="text-slate-600 text-sm font-medium">Total Shortlisted</div>
                <div className="text-3xl font-bold text-slate-900 mt-2">{companyTotals.shortlisted}</div>
              </div>
            </div>

            <div className="h-80 w-full bg-white/30 backdrop-blur-md rounded-2xl p-4">
              <ResponsiveContainer>
                <BarChart data={perRecruiterChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="recruiter" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="accessed" name="Accessed" fill="#60a5fa" />
                  <Bar dataKey="hired" name="Hired" fill="#34d399" />
                  <Bar dataKey="shortlisted" name="Shortlisted" fill="#fbbf24" />
                </BarChart>
              </ResponsiveContainer>
                          </div>
          </section>
        )}
        </div>
      </div>
      
      <EmployerDashboardFooter />
    </div>
    </EmployerAuthGuard>
  )
}


