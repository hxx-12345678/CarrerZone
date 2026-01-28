"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { apiService } from '@/lib/api'
import { GulfJobseekerAuthGuard } from '@/components/gulf-jobseeker-auth-guard'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import {
  ArrowLeft,
  FileText,
  Building2,
  MapPin,
  Calendar,
  Clock,
  X,
  Filter,
  Search,
} from 'lucide-react'

type GulfApplication = {
  id: string
  jobId: string
  status: string
  appliedAt: string
  job?: {
    id?: string
    title?: string
    location?: string
    company?: { name?: string }
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'applied': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'reviewing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'shortlisted': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'interview_scheduled':
    case 'interviewed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    case 'offered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'hired': return 'bg-green-200 text-green-900 dark:bg-green-900/40 dark:text-green-300'
    case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'withdrawn': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
}

export default function GulfApplicationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [applications, setApplications] = useState<GulfApplication[]>([])
  const [loadingApps, setLoadingApps] = useState(true)
  const [withdrawingIds, setWithdrawingIds] = useState<Set<string>>(new Set())

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('recent')

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please sign in to view Gulf applications')
      router.replace('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && !loading) {
      fetchApplications()
    }
  }, [user, loading])

  const fetchApplications = async () => {
    try {
      setLoadingApps(true)
      const resp = await apiService.getGulfJobApplications()
      if (resp && resp.success && resp.data) {
        const apps = (resp.data.applications || resp.data) as GulfApplication[]
        setApplications(apps)
      } else {
        setApplications([])
      }
    } catch (error) {
      console.error('Error loading Gulf applications:', error)
      toast.error('Failed to load Gulf applications')
      setApplications([])
    } finally {
      setLoadingApps(false)
    }
  }

  const canWithdraw = (status: string) => ['applied', 'reviewing', 'shortlisted', 'interview_scheduled'].includes(status)

  const handleWithdraw = async (application: GulfApplication) => {
    if (!canWithdraw(application.status)) {
      toast.error('Cannot withdraw application in current status')
      return
    }

    if (withdrawingIds.has(application.id)) return
    setWithdrawingIds(prev => new Set([...prev, application.id]))
    try {
      const resp = await apiService.updateApplicationStatus(application.id, 'withdrawn')
      if (resp && resp.success) {
        toast.success('Application withdrawn successfully')
        // Refresh the list
        await fetchApplications()
      } else {
        toast.error(resp?.message || 'Failed to withdraw application')
      }
    } catch (err) {
      console.error('Withdraw error:', err)
      toast.error('Failed to withdraw application')
    } finally {
      setWithdrawingIds(prev => {
        const next = new Set(prev)
        next.delete(application.id)
        return next
      })
    }
  }

  const filteredApplications = useMemo(() => {
    let list = [...applications]

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter(app => app.status === statusFilter)
    }

    // Search by job title/company/location
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(app => {
        const title = app.job?.title || ''
        const company = app.job?.company?.name || ''
        const loc = app.job?.location || ''
        return (
          title.toLowerCase().includes(q) ||
          company.toLowerCase().includes(q) ||
          loc.toLowerCase().includes(q)
        )
      })
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        list.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
        break
      case 'status':
        list.sort((a, b) => a.status.localeCompare(b.status))
        break
    }

    return list
  }, [applications, statusFilter, searchQuery, sortBy])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/30 to-teal-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-300">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <GulfJobseekerAuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/30 to-teal-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Navbar />

      <div className="pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link href="/jobseeker-gulf-dashboard">
                <Button variant="ghost" size="sm" className="text-green-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Gulf Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              My Gulf Applications
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Track and manage your applications for Gulf region jobs
            </p>
          </div>

          {/* Controls */}
          <Card className="mb-6 bg-white/80 dark:bg-slate-800/80 border-green-200 dark:border-green-800">
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by job, company, or location"
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                  <SelectItem value="interviewed">Interviewed</SelectItem>
                  <SelectItem value="offered">Offered</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* List */}
          {loadingApps ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <Card key={i} className="bg-white/80 dark:bg-slate-800/80 border-green-200 dark:border-green-800">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredApplications.length === 0 ? (
            <Card className="bg-white/80 dark:bg-slate-800/80 border-green-200 dark:border-green-800">
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Gulf applications yet</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">Start applying to Gulf jobs to see them here</p>
                <Link href="/gulf-jobs">
                  <Button className="bg-green-600 hover:bg-green-700">Find Gulf Jobs</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((app) => (
                <Card key={app.id} className="bg-white/80 dark:bg-slate-800/80 border-green-200 dark:border-green-800">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                            {app.job?.title || 'Job Title'}
                          </h3>
                          <Badge className={getStatusBadge(app.status)}>
                            <span className="capitalize">{app.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-300 mb-2">
                          <div className="flex items-center space-x-1">
                            <Building2 className="w-4 h-4" />
                            <span>{app.job?.company?.name || 'Company'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{app.job?.location || 'Location'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Applied: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '—'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        {/* Note: Gulf job details page may not exist; link to listing */}
                        <Link href="/gulf-jobs">
                          <Button variant="outline" size="sm" className="border-green-200 text-green-700">
                            View Jobs
                          </Button>
                        </Link>
                        {canWithdraw(app.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWithdraw(app)}
                            disabled={withdrawingIds.has(app.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-700"
                          >
                            <X className="w-4 h-4 mr-1" />
                            {withdrawingIds.has(app.id) ? 'Withdrawing...' : 'Undo'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </GulfJobseekerAuthGuard>
  )
}


