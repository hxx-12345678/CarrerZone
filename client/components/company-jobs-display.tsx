"use client"

import { useState, useEffect } from "react"
import { Briefcase, MapPin, Clock, IndianRupee, Users, Eye, Edit, Trash2, Plus, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { apiService } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"

interface CompanyJobsDisplayProps {
  companyId: string
  onJobUpdated: () => void
}

export function CompanyJobsDisplay({ companyId, onJobUpdated }: CompanyJobsDisplayProps) {
  const router = useRouter()
  const { user } = useAuth()
  const basePath = user?.region === 'gulf' ? '/gulf-dashboard' : '/employer-dashboard'
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setIsLoading] = useState(true)
  const [deletingJob, setDeletingJob] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadCompanyJobs()
  }, [companyId])

  const loadCompanyJobs = async () => {
    // Prevent multiple simultaneous refresh calls
    if (isRefreshing) {
      console.log('🔄 Company jobs refresh already in progress, skipping...')
      return
    }
    
    try {
      setIsRefreshing(true)
      setIsLoading(true)
      const response = await apiService.getCompanyJobs(companyId)
      if (response.success && response.data) {
        const allJobs = response.data.jobs || response.data || []
        // Filter to show only active (non-expired) jobs in the display
        // CRITICAL: Only show jobs that are active AND not expired
        const now = new Date()
        const activeJobs = allJobs.filter((job: any) => {
          if (job.status !== 'active') return false
          // If validTill is set and has passed, job is expired (even if status is 'active')
          if (job.validTill && new Date(job.validTill) < now) return false
          return true
        })
        setJobs(activeJobs)
      } else {
        toast.error("Failed to load company jobs")
      }
    } catch (error: any) {
      console.error("Error loading company jobs:", error)
      
      // Handle rate limiting specifically
      if (error.message && error.message.includes('Rate limit exceeded')) {
        toast.error('Too many requests. Please wait a moment before refreshing.')
      } else {
        toast.error("Failed to load company jobs")
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return
    
    try {
      setDeletingJob(jobId)
      const response = await apiService.deleteJob(jobId)
      if (response.success) {
        toast.success("Job deleted successfully")
        setJobs(jobs.filter(job => job.id !== jobId))
        onJobUpdated()
      } else {
        toast.error(response.message || "Failed to delete job")
      }
    } catch (error: any) {
      console.error("Error deleting job:", error)
      toast.error("Failed to delete job")
    } finally {
      setDeletingJob(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'closed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'paused':
        return 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <Card className="bg-white/50 backdrop-blur-xl border-white/40">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading company jobs...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/50 backdrop-blur-xl border-white/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Company Jobs</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {jobs.length} job{jobs.length !== 1 ? 's' : ''} posted
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadCompanyJobs}
              disabled={loading || isRefreshing}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              title={isRefreshing ? "Refresh in progress..." : "Refresh jobs"}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Button onClick={() => router.push(`${basePath}/post-job`)}>
              <Plus className="w-4 h-4 mr-2" />
              Post New Job
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No jobs posted yet
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Start posting jobs to attract talented candidates to your company
            </p>
            <Button onClick={() => router.push(`${basePath}/post-job`)}>
              <Plus className="w-4 h-4 mr-2" />
              Post Your First Job
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="rounded-xl p-4 bg-white/50 backdrop-blur-md border border-white/40 hover:bg-white/60 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {job.title}
                      </h3>
                      <Badge className={getStatusColor(job.status)}>
                        {job.status || 'Unknown'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                      <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location || 'Remote'}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300">
                        <Clock className="w-4 h-4" />
                        <span>{job.jobType || 'Full-time'}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300">
                        <IndianRupee className="w-4 h-4" />
                        <span>
                          {job.salary ? (job.salary.includes('LPA') ? job.salary : `${job.salary} LPA`) : job.salaryMin && job.salaryMax 
                            ? `${(job.salaryMin / 100000).toFixed(0)}-${(job.salaryMax / 100000).toFixed(0)} LPA` 
                            : 'Not specified'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300">
                        <Users className="w-4 h-4" />
                        <span>{job.applicationsCount || 0} applications</span>
                      </div>
                    </div>
                    
                    <p className="text-slate-700 dark:text-slate-300 text-sm line-clamp-2 mb-3">
                      {job.description || 'No description provided'}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                      <span>Posted: {formatDate(job.createdAt || job.created_at || job.postedDate || job.posted_date)}</span>
                      {job.validTill && (
                        <span>
                          {new Date() > new Date(job.validTill)
                            ? `Applications closed: ${formatDate(job.validTill)}`
                            : `Valid till: ${formatDate(job.validTill)}`}
                        </span>
                      )}
                      <span>Views: {job.views || 0}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`${basePath}/manage-jobs/${job.id}`)}
                      title="View Job Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`${basePath}/post-job?draft=${job.id}`)}
                      title="Edit Job"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteJob(job.id)}
                      disabled={deletingJob === job.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingJob === job.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
