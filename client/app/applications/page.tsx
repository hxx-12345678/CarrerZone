"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  FileText,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  X
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { toast } from 'sonner'
import { apiService, JobApplication } from '@/lib/api'
import { sampleJobManager } from '@/lib/sampleJobManager'
import { JobseekerAuthGuard } from '@/components/jobseeker-auth-guard'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'applied': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'reviewing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'shortlisted': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'interviewed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    case 'offered': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'hired': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'withdrawn': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
}

export default function ApplicationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please sign in to view your applications')
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && !loading) {
      fetchApplications()
    }
  }, [user, loading])

  const fetchApplications = async () => {
    try {
      setApplicationsLoading(true)
      
      // Get backend applications
      let backendApplications: any[] = []
      try {
        const response = await apiService.getApplications()
        if (response.success && response.data) {
          backendApplications = response.data
        }
      } catch (error) {
        console.error('Error fetching backend applications:', error)
      }
      
      // Get sample applications and combine with backend
      const sampleApplications = sampleJobManager.getApplications()
      const combinedApplications = [
        ...sampleApplications.map(app => ({
          ...app,
          isSample: true,
          id: `sample-${app.jobId}`,
          job: {
            id: app.jobId,
            title: app.jobTitle,
            company: { name: app.companyName },
            location: app.location,
            salary: app.salary,
            type: app.type
          }
        })),
        ...backendApplications
      ]
      setApplications(combinedApplications)
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setApplicationsLoading(false)
    }
  }

  const handleWithdrawApplication = async (application: any) => {
    try {
      // Only allow withdrawal for non-sample applications
      if (application.isSample) {
        toast.error('Cannot withdraw sample applications')
        return
      }

      // Only allow withdrawal for certain statuses
      if (!['applied', 'reviewing', 'shortlisted'].includes(application.status)) {
        toast.error('Cannot withdraw application in current status')
        return
      }

      const response = await apiService.updateApplicationStatus(application.id, 'withdrawn')
      if (response.success) {
        toast.success('Application withdrawn successfully')
        fetchApplications() // Refresh applications list
      } else {
        toast.error(response.message || 'Failed to withdraw application')
      }
    } catch (error) {
      console.error('Error withdrawing application:', error)
      toast.error('Failed to withdraw application')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-300">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <JobseekerAuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-auto">
      <Navbar />
      
      {/* Welcome Back Div Style Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Base gradient overlay matching welcome back div */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-200/45 via-blue-200/35 to-indigo-200/45"></div>
        <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-purple-300/10 to-blue-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-blue-300/10 to-indigo-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-indigo-300/10 to-purple-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        {/* Wide translucent gradient strip matching welcome back div */}
        <div className="absolute top-1/4 left-0 right-0 h-24 bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-indigo-400/20"></div>
      </div>
      
      <div className="pt-20 pb-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              My Applications
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Track the status of your job applications
            </p>
          </div>

          {applicationsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(90,0,242,0.06)] rounded-3xl">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : applications.length === 0 ? (
            <Card className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(90,0,242,0.06)] rounded-3xl">
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  No applications yet
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  Start applying to jobs to see your application history here
                </p>
                <Link href="/jobs">
                  <Button>Browse Jobs</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <Card key={application.id} className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(90,0,242,0.06)] rounded-3xl hover:shadow-[0_18px_60px_rgba(90,0,242,0.16)] transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {application.job?.title || 'Job Title'}
                          </h3>
                          <Badge className={getStatusColor(application.status)}>
                            <span className="capitalize">{application.status}</span>
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-300 mb-3">
                          <div className="flex items-center space-x-1">
                            <Building2 className="w-4 h-4" />
                            <span>{application.job?.company?.name || 'Company Name'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{application.job?.location || 'Location'}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Applied: {new Date(application.appliedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <Link href={`/jobs/${application.jobId}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View Job
                          </Button>
                        </Link>
                        {!(application as any).isSample && ['applied', 'reviewing', 'shortlisted'].includes(application.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWithdrawApplication(application)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-700"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Undo
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
    </JobseekerAuthGuard>
  )
}
