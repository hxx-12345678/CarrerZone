'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiService } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'
import { EmployerDashboardNavbar } from '@/components/employer-dashboard-navbar'
import { EmployerDashboardFooter } from '@/components/employer-dashboard-footer'

export default function UsagePulsePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [companyId, setCompanyId] = useState<string>('')
  const [summary, setSummary] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [activitiesTotal, setActivitiesTotal] = useState<number>(0)
  const [searchInsights, setSearchInsights] = useState<any[]>([])
  const [postingInsights, setPostingInsights] = useState<any[]>([])
  const [performance, setPerformance] = useState<any[]>([])
  const [filters, setFilters] = useState<{ recruiterId?: string; activityType?: string; from?: string; to?: string; page: number; limit: number }>({ page: 1, limit: 20 })

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }
    // Only company admins (admin with a companyId) can access Usage Pulse
    if (user.userType !== 'admin' || !user.companyId) { router.replace('/'); return }
    const cid = apiService.getCompanyFromStorage()?.id || user.companyId || ''
    setCompanyId(cid)
  }, [user, loading])

  useEffect(() => {
    const load = async () => {
      // ✅ No need to check companyId - backend will use authenticated user's company
      const [s, si, pi, rp] = await Promise.all([
        apiService.getUsageSummary(), // ✅ Remove companyId parameter
        apiService.getUsageSearchInsights({}), // ✅ Remove companyId parameter
        apiService.getUsagePostingInsights({}), // ✅ Remove companyId parameter
        apiService.getRecruiterPerformance({}) // ✅ Remove companyId parameter
      ])
      console.log('🔍 Admin usage pulse - getUsageSummary result:', s)
      if (s.success && s.data) {
        console.log('🔍 Admin usage pulse - setting summary data:', s.data)
        setSummary(s.data)
      }
      if (si.success && si.data) setSearchInsights(si.data)
      if (pi.success && pi.data) setPostingInsights(pi.data)
      if (rp.success && rp.data) setPerformance(rp.data)
    }
    load()
  }, []) // ✅ Remove companyId dependency

  useEffect(() => {
    const loadActivities = async () => {
      const res = await apiService.getUsageActivities({
        userId: filters.recruiterId,
        activityType: filters.activityType,
        from: filters.from,
        to: filters.to,
        limit: filters.limit,
        offset: (filters.page - 1) * filters.limit
      })
      if (res.success && res.data) {
        setActivities(res.data)
        // No total from API; approximate for client-side paging
        setActivitiesTotal(res.data.length < filters.limit ? (filters.page - 1) * filters.limit + res.data.length : filters.page * filters.limit + 1)
      }
    }
    loadActivities()
  }, [filters])

  // Map userId -> {email, name}
  const userIndex = useMemo(() => {
    const map = new Map<string, { email?: string; name?: string }>()
    ;(summary || []).forEach((r: any) => {
      map.set(r.userId, { email: r.email, name: r.name })
    })
    return map
  }, [summary])

  // Function to format quota type names
  const formatQuotaType = (quotaType: string) => {
    const typeMap: { [key: string]: string } = {
      // New field names
      'job_postings': 'Job Postings',
      'resume_views': 'Resume Views/Downloads',
      'requirements_posted': 'Requirements Posted',
      'profile_visits': 'Profile Visits',
      // Old field names (for backward compatibility)
      'resume_search': 'Resume Views/Downloads',
      'messages': 'Requirements Posted',
      'contact_views': 'Profile Visits'
    };
    return typeMap[quotaType] || quotaType;
  };

  const quotaChartData = useMemo(() => {
    console.log('🔍 Admin usage pulse - processing summary data:', summary)
    const result = summary.flatMap((r: any) => {
      console.log('🔍 Processing recruiter:', r)
      console.log('🔍 Recruiter quotas:', r.quotas)
      return (r.quotas || []).map((q: any) => ({
        recruiter: r.email || r.name,
        quotaType: q.quotaType,
        used: q.used,
        limit: q.limit,
        quotaLabel: `${r.email || r.name || r.userId} — ${formatQuotaType(q.quotaType)}`
      }))
    })
    console.log('🔍 Final quota chart data:', result)
    return result
  }, [summary])

  const postingSeries = useMemo(() => {
    // Aggregate by recruiter only as series; show total jobs vs applications
    const totals = postingInsights.reduce((acc: any, row: any) => {
      const id = row.recruiterId
      const recruiterEmail = userIndex.get(id)?.email || row.recruiterEmail || id
      acc[id] = acc[id] || { recruiterId: id, recruiterEmail, jobs: 0, applications: 0 }
      acc[id].jobs += row.totalJobs || 0
      acc[id].applications += row.totalApplications || 0
      return acc
    }, {})
    return Object.values(totals)
  }, [postingInsights, userIndex])

  if (loading) return <div className="p-6">Loading...</div>
  if (!user || user.userType !== 'admin' || !user.companyId) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-hidden">
      <EmployerDashboardNavbar />
      
      {/* Background Effects - Blue theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Base blue gradient overlay to ensure visible background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200/45 via-cyan-200/35 to-indigo-200/45"></div>
        <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-300/10 to-cyan-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-indigo-300/10 to-violet-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-cyan-300/10 to-blue-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        {/* Wide translucent blue gradient strip */}
        <div className="absolute top-1/3 left-0 right-0 h-24 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-indigo-400/20"></div>
      </div>
      
      <div className="relative z-10 pt-16 p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Usage Pulse</h1>
        </div>

      {/* Summary: Quota usage per recruiter */}
      <section className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)] p-4">
        <h2 className="text-lg font-medium mb-4">Quota Usage by Recruiter</h2>
        <div className="h-72 w-full rounded-xl bg-white/30 backdrop-blur-sm border border-white/20">
          <ResponsiveContainer>
            <BarChart data={quotaChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quotaLabel" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="used" name="Used" fill="#2563eb" />
              <Bar dataKey="limit" name="Limit" fill="#94a3b8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-sm rounded-lg bg-white/30 backdrop-blur-sm border border-white/20">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="p-2">Recruiter</th>
                <th className="p-2">Feature</th>
                <th className="p-2">Used</th>
                <th className="p-2">Limit</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotaChartData.map((row: any, idx: number) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{row.recruiter}</td>
                  <td className="p-2">{formatQuotaType(row.quotaType)}</td>
                  <td className="p-2">{row.used}</td>
                  <td className="p-2">{row.limit}</td>
                  <td className="p-2">
                    <button
                      className="px-2 py-1 border rounded text-xs"
                      onClick={async () => {
                        const recruiter = summary.find((r: any) => (r.email || r.name) === row.recruiter)
                        if (!recruiter) return
                        const current = Number(prompt(`Set limit for ${formatQuotaType(row.quotaType)} (${row.recruiter}). Current: ${row.limit}. Enter new limit:` , String(row.limit)))
                        if (!Number.isFinite(current)) return
                        const res = await apiService.updateQuota({ userId: recruiter.userId, quotaType: row.quotaType, limit: current })
                        if (res.success) {
                          // Refresh summary
                          const s = await apiService.getUsageSummary()
                          if (s.success) setSummary(s.data || [])
                        }
                      }}
                    >Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Activities table */}
      <section className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)] p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Activity Logs</h2>
          <div className="flex gap-2">
            <select
              className="border rounded px-2 py-1 text-sm"
              value={filters.recruiterId || ''}
              onChange={(e) => setFilters(f => ({ ...f, recruiterId: e.target.value || undefined, page: 1 }))}
            >
              <option value="">All recruiters</option>
              {summary.map((r: any) => (
                <option key={r.userId} value={r.userId}>{r.email || r.name}</option>
              ))}
            </select>
            <input className="border rounded px-2 py-1 text-sm" placeholder="Activity Type" value={filters.activityType || ''} onChange={(e) => setFilters(f => ({ ...f, activityType: e.target.value || undefined, page: 1 }))} />
            <input type="date" className="border rounded px-2 py-1 text-sm" value={filters.from || ''} onChange={(e) => setFilters(f => ({ ...f, from: e.target.value || undefined, page: 1 }))} />
            <input type="date" className="border rounded px-2 py-1 text-sm" value={filters.to || ''} onChange={(e) => setFilters(f => ({ ...f, to: e.target.value || undefined, page: 1 }))} />
          </div>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm rounded-lg bg-white/30 backdrop-blur-sm border border-white/20">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="p-2">Timestamp</th>
                <th className="p-2">User</th>
                <th className="p-2">Activity</th>
                <th className="p-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((a: any) => (
                <tr key={a.id} className="border-t">
                  <td className="p-2">{new Date(a.timestamp).toLocaleString()}</td>
                  <td className="p-2">
                    {a.user?.email || a.user?.name || userIndex.get(a.userId)?.email || userIndex.get(a.userId)?.name || a.userId}
                  </td>
                  <td className="p-2">{a.activityType}</td>
                  <td className="p-2">
                    <div className="text-sm">
                      {/* Show human-readable activity description if available */}
                      {a.activityDescription && (
                        <div className="font-medium text-gray-800 mb-2">
                          {a.activityDescription}
                        </div>
                      )}
                      
                      {/* Show job information */}
                      {a.job?.title && (
                        <div className="font-medium text-blue-600">Job: {a.job.title}</div>
                      )}
                      
                      {/* Show applicant information */}
                      {a.applicant && (
                        <div className="text-gray-700">Applicant: {a.applicant.name || a.applicant.email}</div>
                      )}
                      
                      {/* Show meaningful details only */}
                      {a.details && Object.keys(a.details).length > 0 && (
                        <div className="text-gray-600 mt-1">
                          {Object.entries(a.details)
                            .filter(([key, value]) => {
                              // Hide technical data and ID fields
                              const hiddenKeys = [
                                'jobId', 'applicationId', 'applicantId', 'candidateId', 'requirementId', 'interviewId',
                                'ipAddress', 'userAgent', 'sessionId', 'referrer',
                                'title' // Hide if we already show job title above
                              ];
                              return !hiddenKeys.includes(key) && value !== null && value !== undefined;
                            })
                            .map(([key, value]: [string, any]) => (
                            <div key={key}>
                              <span className="font-medium">{key}:</span> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-end gap-2 mt-3">
            <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={filters.page <= 1} onClick={() => setFilters(f => ({ ...f, page: Math.max(1, f.page - 1) }))}>Prev</button>
            <span className="text-sm">Page {filters.page}</span>
            <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={activities.length < filters.limit} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Next</button>
          </div>
        </div>
      </section>

      {/* Search insights */}
      <section className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)] p-4">
        <h2 className="text-lg font-medium mb-4">Top Search Keywords</h2>
        <ol className="list-decimal pl-6 space-y-1">
          {searchInsights.map((k: any, idx: number) => (
            <li key={idx} className="text-sm flex justify-between"><span>{k.keyword}</span><span className="text-gray-500">{k.count}</span></li>
          ))}
        </ol>
      </section>

      {/* Posting insights */}
      <section className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)] p-4">
        <h2 className="text-lg font-medium mb-4">Job Postings vs Applications</h2>
        <div className="h-72 w-full rounded-xl bg-white/30 backdrop-blur-sm border border-white/20">
          <ResponsiveContainer>
            <LineChart data={postingSeries as any[]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="recruiterEmail" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="jobs" name="Jobs" stroke="#2563eb" />
              <Line type="monotone" dataKey="applications" name="Applications" stroke="#16a34a" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Recruiter performance */}
      <section className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)] p-4">
        <h2 className="text-lg font-medium mb-4">Recruiter Leaderboard</h2>
        <table className="min-w-full text-sm rounded-lg bg-white/30 backdrop-blur-sm border border-white/20">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="p-2">Recruiter</th>
              <th className="p-2">Email</th>
              <th className="p-2">Activity Count</th>
            </tr>
          </thead>
          <tbody>
            {performance.map((r: any, idx: number) => (
              <tr key={idx} className="border-t">
                <td className="p-2">{r.name || r.userId}</td>
                <td className="p-2">{r.email}</td>
                <td className="p-2">{r.activityCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      </div>
      
      <EmployerDashboardFooter />
    </div>
  )
}