"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Users,
  Eye,
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  GraduationCap,
  Briefcase,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  User,
  FileText,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EmployerDashboardNavbar } from "@/components/employer-dashboard-navbar"
import { EmployerFooter } from "@/components/employer-footer"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"
import { InterviewSchedulingDialog } from "@/components/interview-scheduling-dialog"
import { useAuth } from "@/hooks/useAuth"
import { apiService } from "@/lib/api"
import { toast } from "sonner"
import Link from "next/link"

export default function ApplicationsPage() {
  const { user, loading: authLoading } = useAuth()

  return (
    <EmployerAuthGuard>
      <ApplicationsPageContent user={user} authLoading={authLoading} />
    </EmployerAuthGuard>
  )
}

function ApplicationsPageContent({ user, authLoading }: { user: any; authLoading: boolean }) {
  const searchParams = useSearchParams()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false)
  const [interviewApplication, setInterviewApplication] = useState<any>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Read status from URL parameters on component mount
  useEffect(() => {
    const statusFromUrl = searchParams.get('status')
    if (statusFromUrl) {
      setStatusFilter(statusFromUrl)
    }
  }, [searchParams])

  useEffect(() => {
    if (user && !authLoading) {
      fetchApplications()
    }
  }, [user, authLoading, searchQuery, statusFilter, pagination.page])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Fetching employer applications for user:', user?.id, 'type:', user?.user_type)
      
      const response = await apiService.getEmployerApplications()
      
      console.log('📊 Employer applications API response:', response)
      
      if (response.success) {
        console.log('✅ Applications fetched successfully:', response.data)
        console.log('📋 Number of applications:', response.data?.length || 0)
        setApplications(response.data || [])
      } else {
        console.error('❌ Failed to fetch applications:', response)
        setError(response.message || 'Failed to fetch applications')
        toast.error(response.message || 'Failed to fetch applications')
      }
    } catch (error: any) {
      console.error('❌ Error fetching applications:', error)
      setError('Failed to fetch applications')
      toast.error('Failed to fetch applications')
    } finally {
      setLoading(false)
    }
  }


  const exportApplications = async () => {
    try {
      if (applications.length === 0) {
        toast.error('No applications to export')
        return
      }

      // Create CSV content
      const headers = [
        'Application ID',
        'Candidate Name',
        'Email',
        'Phone',
        'Job Title',
        'Company',
        'Status',
        'Applied Date',
        'Expected Salary',
        'Notice Period',
        'Cover Letter'
      ]

      const csvContent = [
        headers.join(','),
        ...applications.map(app => [
          app.id || '',
          `${app.user?.first_name || ''} ${app.user?.last_name || ''}`.trim() || 'N/A',
          app.user?.email || 'N/A',
          app.user?.phone || 'N/A',
          app.job?.title || 'N/A',
          app.job?.company?.name || 'N/A',
          app.status || 'N/A',
          app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A',
          app.expectedSalary || 'N/A',
          app.noticePeriod || 'N/A',
          app.coverLetter ? `"${app.coverLetter.replace(/"/g, '""')}"` : 'N/A'
        ].join(','))
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `applications_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(`Exported ${applications.length} applications successfully`)
    } catch (error) {
      console.error('❌ Export error:', error)
      toast.error('Failed to export applications')
    }
  }

  const handleDownloadCoverLetter = async (coverLetter: any) => {
    try {
      // Try direct file URL first if available
      const direct = (selectedApplication?.jobCoverLetter?.metadata?.fileUrl || selectedApplication?.jobCoverLetter?.fileUrl) as string | undefined
      if (direct) {
        const abs = direct.match(/^https?:\/\//i) ? direct : `${process.env.NEXT_PUBLIC_API_URL || ''}${direct}`
        const a = document.createElement('a')
        a.href = abs
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        return
      }

      // Fallback: application-scoped download to enforce access checks
      const response = await apiService.downloadApplicationCoverLetter(selectedApplication?.id || '')
      const contentDisposition = response.headers.get('content-disposition')
      let filename = coverLetter?.metadata?.filename || `${coverLetter?.title || 'CoverLetter'}.pdf`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) filename = match[1]
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Cover letter downloaded successfully')
    } catch (error) {
      console.error('Error downloading cover letter:', error)
      toast.error('Failed to download cover letter')
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      applied: "bg-blue-100 text-blue-800",
      reviewing: "bg-yellow-100 text-yellow-800",
      shortlisted: "bg-green-100 text-green-800",
      interview_scheduled: "bg-purple-100 text-purple-800",
      interviewed: "bg-indigo-100 text-indigo-800",
      offered: "bg-emerald-100 text-emerald-800",
      hired: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      withdrawn: "bg-gray-100 text-gray-800"
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      applied: Clock,
      reviewing: Eye,
      shortlisted: Star,
      interview_scheduled: Calendar,
      interviewed: CheckCircle,
      offered: Award,
      hired: CheckCircle,
      rejected: XCircle,
      withdrawn: AlertCircle
    }
    return icons[status as keyof typeof icons] || Clock
  }

  const filteredApplications = applications
    .filter(app => {
      const matchesSearch = !searchQuery || 
        app.applicant?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.job?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.applicant?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || app.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      // Sort premium users first
      const aIsPremium = a.applicant && (
        a.applicant.verification_level === 'premium' || 
        a.applicant.verificationLevel === 'premium' || 
        a.applicant?.preferences?.premium
      )
      const bIsPremium = b.applicant && (
        b.applicant.verification_level === 'premium' || 
        b.applicant.verificationLevel === 'premium' || 
        b.applicant?.preferences?.premium
      )
      
      // Premium users come first
      if (aIsPremium && !bIsPremium) return -1
      if (!aIsPremium && bIsPremium) return 1
      
      // Within same premium status, sort by application date (newest first)
      return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    })

  const handleViewDetails = async (application: any) => {
    try {
      const response = await apiService.getEmployerApplicationDetails(application.id)
      if (response.success) {
        setSelectedApplication(response.data)
        setIsDetailModalOpen(true)
      } else {
        toast.error('Failed to load application details')
      }
    } catch (error) {
      console.error('Error fetching application details:', error)
      toast.error('Failed to load application details')
    }
  }

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      const response = await apiService.updateEmployerApplicationStatus(applicationId, newStatus)
      if (response.success) {
        if (newStatus === 'rejected') {
          // Remove rejected application from the list
          setApplications(prevApplications => 
            prevApplications.filter(app => app.id !== applicationId)
          )
          toast.success('Application rejected and removed from list')
        } else {
          // For other status updates, check if the new status matches the current filter
          if (statusFilter === 'all' || statusFilter === newStatus) {
            // Update the application in the list if it should still be visible
            setApplications(prevApplications => 
              prevApplications.map(app => 
                app.id === applicationId 
                  ? { ...app, status: newStatus }
                  : app
              )
            )
          } else {
            // Remove the application from the list if it no longer matches the filter
            setApplications(prevApplications => 
              prevApplications.filter(app => app.id !== applicationId)
            )
          }
          toast.success('Application status updated successfully')
        }
      } else {
        toast.error('Failed to update application status')
      }
    } catch (error) {
      console.error('Error updating application status:', error)
      toast.error('Failed to update application status')
    }
  }

  const handleScheduleInterview = (application: any) => {
    console.log('🔍 Application data for interview scheduling:', application)
    console.log('🔍 Application keys:', Object.keys(application || {}))
    console.log('🔍 Has candidate:', !!application?.candidate)
    console.log('🔍 Has applicant:', !!application?.applicant)
    console.log('🔍 Candidate data:', application?.candidate)
    console.log('🔍 Applicant data:', application?.applicant)
    
    if (application && (application.candidate || application.applicant)) {
      const candidate = application.candidate || application.applicant;
      const candidateName = candidate?.name || candidate?.fullName || (candidate?.first_name && candidate?.last_name);
      
      if (candidateName) {
        setInterviewApplication(application)
        setIsInterviewDialogOpen(true)
      } else {
        console.error('❌ Missing candidate name:', candidate)
        toast.error('Invalid application data - missing candidate name information')
      }
    } else {
      console.error('❌ Invalid application data:', application)
      toast.error('Invalid application data - missing candidate/applicant information')
    }
  }

  const handleInterviewScheduled = () => {
    fetchApplications() // Refresh the applications list
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-auto">
        <EmployerDashboardNavbar />
        
        {/* Background Effects - Blue theme */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-200/45 via-cyan-200/35 to-indigo-200/45"></div>
          <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-300/10 to-cyan-300/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-indigo-300/10 to-violet-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center bg-white/50 backdrop-blur-xl border-white/40 rounded-3xl p-8 shadow-[0_8px_30px_rgba(59,130,246,0.06)]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading applications...</p>
            </div>
          </div>
        </div>
        <EmployerFooter />
      </div>
    )
  }

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
      
      <div className="relative z-10 container mx-auto px-4 pt-16 pb-8">
        {/* Header */}
        <div className="mb-8">
          {statusFilter !== 'all' && (
            <div className="mb-4">
              <Link href="/employer-dashboard">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {statusFilter === 'all' ? 'Job Applications' : 
                 statusFilter === 'reviewing' ? 'Applications Under Review' :
                 statusFilter === 'shortlisted' ? 'Shortlisted Candidates' :
                 statusFilter === 'interview_scheduled' ? 'Interview Scheduled' :
                 statusFilter === 'hired' ? 'Hired Candidates' :
                 statusFilter === 'rejected' ? 'Rejected Applications' :
                 statusFilter === 'applied' ? 'New Applications' :
                 'Job Applications'}
              </h1>
              <p className="text-gray-600 mt-2">
                {statusFilter === 'all' ? 'Manage and review applications from job seekers' :
                 statusFilter === 'reviewing' ? 'Applications currently being reviewed' :
                 statusFilter === 'shortlisted' ? 'Candidates who have been shortlisted' :
                 statusFilter === 'interview_scheduled' ? 'Candidates with scheduled interviews' :
                 statusFilter === 'hired' ? 'Successfully hired candidates' :
                 statusFilter === 'rejected' ? 'Applications that have been rejected' :
                 statusFilter === 'applied' ? 'Recently submitted applications' :
                 'Manage and review applications from job seekers'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={exportApplications}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Link href="/employer-dashboard/manage-jobs">
                <Button variant="outline" size="sm">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Manage Jobs
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by candidate name, job title, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="reviewing">Under Review</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                  <SelectItem value="interviewed">Interviewed</SelectItem>
                  <SelectItem value="offered">Offer Made</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Premium Priority Notice */}
        {filteredApplications.some(app => {
          const applicant = app.applicant
          return applicant && (
            applicant.verification_level === 'premium' || 
            applicant.verificationLevel === 'premium' || 
            applicant?.preferences?.premium
          )
        }) && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  <strong>Premium Priority:</strong> Premium candidates are shown at the top of the list and highlighted with a golden border.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications found</h3>
                <p className="text-gray-600">
                  {searchQuery || statusFilter !== "all" 
                    ? "No applications match your current filters."
                    : "You haven't received any job applications yet."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredApplications.map((application) => {
              const StatusIcon = getStatusIcon(application.status)
              const applicant = application.applicant
              const job = application.job
              
              // Check if applicant is premium
              const isPremium = applicant && (
                applicant.verification_level === 'premium' || 
                applicant.verificationLevel === 'premium' || 
                applicant?.preferences?.premium
              )
              
              return (
                <Card key={application.id} className={`rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] ${isPremium ? 'ring-2 ring-yellow-200' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={applicant?.avatar} />
                          <AvatarFallback>
                            {applicant?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {applicant?.fullName || 'Unknown Candidate'}
                            </h3>
                            {/* Premium badge */}
                            {applicant && (applicant.verification_level === 'premium' || (applicant as any).verificationLevel === 'premium' || (applicant as any)?.preferences?.premium) && (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Premium</Badge>
                            )}
                            <Badge className={getStatusColor(application.status)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {application.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-gray-600">
                                <Briefcase className="w-4 h-4 mr-2" />
                                <span className="truncate">
                                  {job?.title || application.metadata?.requirementTitle || 'Unknown Position'}
                                </span>
                                {application.metadata?.shortlistedFrom === 'requirements' && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    From Requirements
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="w-4 h-4 mr-2" />
                                <span className="truncate">{applicant?.email || 'No email'}</span>
                              </div>
                              {applicant?.phone && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="w-4 h-4 mr-2" />
                                  <span>{applicant.phone}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              {applicant?.current_location && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <MapPin className="w-4 h-4 mr-2" />
                                  <span>{applicant.current_location}</span>
                                </div>
                              )}
                              {applicant?.totalExperienceDisplay && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Clock className="w-4 h-4 mr-2" />
                                  <span>{applicant.totalExperienceDisplay} experience</span>
                                </div>
                              )}
                              {applicant?.highestEducation && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <GraduationCap className="w-4 h-4 mr-2" />
                                  <span className="truncate">{applicant.highestEducation.fullDegree}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {applicant?.headline && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {applicant.headline}
                            </p>
                          )}
                          
                          {applicant?.allSkills && applicant.allSkills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {applicant.allSkills.slice(0, 5).map((skill: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {applicant.allSkills.length > 5 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{applicant.allSkills.length - 5} more
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            Applied {new Date(application.appliedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(application)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStatusUpdate(application.id, 'reviewing')}>
                              Mark as Reviewing
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(application.id, 'shortlisted')}>
                              {application.status === 'shortlisted' ? 'Remove from Shortlist' : 'Shortlist'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleScheduleInterview(application)}>
                              Schedule Interview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(application.id, 'rejected')}>
                              Reject
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Application Detail Modal */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-blue-50/95 via-cyan-50/90 to-indigo-50/95 backdrop-blur-2xl border-blue-200/40 shadow-[0_20px_50px_rgba(59,130,246,0.15)]">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
            </DialogHeader>
            
            {selectedApplication && (
              <ApplicationDetailView 
                application={selectedApplication} 
                onDownloadCoverLetter={handleDownloadCoverLetter}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Interview Scheduling Dialog */}
        {interviewApplication && (
          <InterviewSchedulingDialog
            isOpen={isInterviewDialogOpen}
            onClose={() => setIsInterviewDialogOpen(false)}
            application={interviewApplication}
            onSuccess={handleInterviewScheduled}
          />
        )}
      </div>
      
      <EmployerFooter />
    </div>
  )
}

function ApplicationDetailView({ application, onDownloadCoverLetter }: { application: any; onDownloadCoverLetter: (coverLetter: any) => void }) {
  const applicant = application.applicant
  const job = application.job
  const jobResume = application.jobResume

  const handleDownloadResume = async (resume: any) => {
    if (!resume?.id) {
      toast.error('Resume not available for download')
      return
    }

    try {
      console.log('🔍 Attempting to download resume:', { resumeId: resume.id, applicationId: application.id })

      // Try direct URL first if present
      const direct = (resume?.metadata?.fileUrl || resume?.fileUrl) as string | undefined
      if (direct) {
        const abs = direct.match(/^https?:\/\//i) ? direct : `${process.env.NEXT_PUBLIC_API_URL || ''}${direct}`
        const a = document.createElement('a')
        a.href = abs
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        return
      }

      // Fallback: application-based download
      const response = await apiService.downloadApplicationResume(resume.id, application.id)
      
      console.log('🔍 Download response:', { status: response.status, ok: response.ok })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Download failed:', { status: response.status, statusText: response.statusText, errorText })
        throw new Error(`Download failed: ${response.status} ${response.statusText}`)
      }
      
      // Get the filename from the response headers or use a default
      const contentDisposition = response.headers.get('content-disposition')
      let filename = resume.metadata?.filename || `${resume.title || 'Resume'}.pdf`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      console.log('🔍 Downloading file:', filename)
      
      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)
      
      toast.success('Resume downloaded successfully')
    } catch (error) {
      console.error('Error downloading resume:', error)
      toast.error(`Failed to download resume: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleViewResume = async (resume: any) => {
    if (!resume?.id) {
      toast.error('Resume not available for viewing')
      return
    }

    try {
      console.log('🔍 Attempting to view resume:', { resumeId: resume.id, applicationId: application.id })
      
      // First log the resume view activity
      try {
        await apiService.viewApplicationResume(application.id)
      } catch (activityError) {
        console.error('Failed to log resume view activity:', activityError)
        // Don't fail the view if activity logging fails
      }

      // First try to use the metadata fileUrl if available
      if (resume.metadata?.fileUrl) {
        console.log('🔍 Using direct file URL:', resume.metadata.fileUrl)
        window.open(resume.metadata.fileUrl, '_blank', 'noopener,noreferrer')
        return
      }

      // If no direct URL, fetch the resume file and create a blob URL for viewing
      const response = await apiService.downloadApplicationResume(resume.id, application.id)
      
      console.log('🔍 View response:', { status: response.status, ok: response.ok })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        
        console.log('🔍 Opening resume in new tab')
        
        // Open the resume in a new tab
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
        
        // Clean up the blob URL after a delay to allow the browser to load it
        setTimeout(() => {
          window.URL.revokeObjectURL(url)
        }, 10000)
        
        if (!newWindow) {
          toast.error('Please allow popups to view the resume')
        }
      } else {
        const errorText = await response.text()
        console.error('❌ View failed:', { status: response.status, statusText: response.statusText, errorText })
        toast.error(`Failed to load resume for viewing: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error viewing resume:', error)
      toast.error(`Failed to view resume: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Candidate Overview */}
      <Card className="rounded-3xl bg-white/60 backdrop-blur-xl border-white/50 shadow-[0_8px_28px_rgba(59,130,246,0.12)]">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{job?.title || 'Job Application'}</h3>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600">Application ID: {application.id}</p>
                {applicant && (applicant.verification_level === 'premium' || (applicant as any).verificationLevel === 'premium' || (applicant as any)?.preferences?.premium) && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Premium</Badge>
                )}
              </div>
            </div>
            <Avatar className="w-16 h-16">
              <AvatarImage src={applicant?.avatar} />
              <AvatarFallback>
                {applicant?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </CardHeader>
        <CardContent>
          {applicant?.summary && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
              <p className="text-gray-600">{applicant.summary}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{applicant?.totalExperienceYears || 0}</div>
              <div className="text-sm text-gray-600">Years Experience</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{applicant?.allSkills?.length || 0}</div>
              <div className="text-sm text-gray-600">Skills</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{applicant?.profile_completion || 0}%</div>
              <div className="text-sm text-gray-600">Profile Complete</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      {(applicant?.social_links?.linkedin || applicant?.social_links?.github || applicant?.socialLinks?.linkedin || applicant?.socialLinks?.github) && (
        <Card className="rounded-3xl bg-white/60 backdrop-blur-xl border-white/50 shadow-[0_8px_28px_rgba(59,130,246,0.12)]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ExternalLink className="w-5 h-5 mr-2" />
              Social Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(applicant?.social_links?.linkedin || applicant?.socialLinks?.linkedin) && (
                <div className="flex items-center text-sm text-gray-700">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  <a
                    href={`${String(applicant?.social_links?.linkedin || applicant?.socialLinks?.linkedin).startsWith('http') ? '' : 'https://'}${applicant?.social_links?.linkedin || applicant?.socialLinks?.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    LinkedIn Profile
                  </a>
                </div>
              )}
              {(applicant?.social_links?.github || applicant?.socialLinks?.github) && (
                <div className="flex items-center text-sm text-gray-700">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  <a
                    href={`${String(applicant?.social_links?.github || applicant?.socialLinks?.github).startsWith('http') ? '' : 'https://'}${applicant?.social_links?.github || applicant?.socialLinks?.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    GitHub Profile
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work Experience */}
      {applicant?.workExperiences && applicant.workExperiences.length > 0 && (
        <Card className="rounded-3xl bg-white/60 backdrop-blur-xl border-white/50 shadow-[0_8px_28px_rgba(59,130,246,0.12)]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              Work Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applicant.workExperiences.map((exp: any, index: number) => (
                <div key={index} className="border-l-2 border-blue-200 pl-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{exp.jobTitle}</h4>
                      <p className="text-gray-600">{exp.companyName}</p>
                      <p className="text-sm text-gray-500">{exp.formattedPeriod}</p>
                    </div>
                    {exp.isCurrent && (
                      <Badge variant="secondary">Current</Badge>
                    )}
                  </div>
                  {exp.description && (
                    <p className="text-gray-600 mt-2">{exp.description}</p>
                  )}
                  {exp.skills && exp.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {exp.skills.map((skill: string, skillIndex: number) => (
                        <Badge key={skillIndex} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {applicant?.educations && applicant.educations.length > 0 && (
        <Card className="rounded-3xl bg-white/60 backdrop-blur-xl border-white/50 shadow-[0_8px_28px_rgba(59,130,246,0.12)]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <GraduationCap className="w-5 h-5 mr-2" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applicant.educations.map((edu: any, index: number) => (
                <div key={index} className="border-l-2 border-green-200 pl-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{edu.fullDegree}</h4>
                      <p className="text-gray-600">{edu.institution}</p>
                      <p className="text-sm text-gray-500">{edu.formattedPeriod}</p>
                    </div>
                    {edu.gradeDisplay && (
                      <Badge variant="secondary">{edu.gradeDisplay}</Badge>
                    )}
                  </div>
                  {edu.description && (
                    <p className="text-gray-600 mt-2">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {applicant?.allSkills && applicant.allSkills.length > 0 && (
        <Card className="rounded-3xl bg-white/60 backdrop-blur-xl border-white/50 shadow-[0_8px_28px_rgba(59,130,246,0.12)]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {applicant.allSkills.map((skill: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Application Details */}
      <Card className="rounded-3xl bg-white/60 backdrop-blur-xl border-white/50 shadow-[0_8px_28px_rgba(59,130,246,0.12)]">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Application Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Job Applied For</h4>
              <p className="text-gray-600">{job?.title}</p>
              <p className="text-sm text-gray-500">{job?.company?.name}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Application Date</h4>
              <p className="text-gray-600">{new Date(application.appliedAt).toLocaleDateString()}</p>
            </div>
            {application.expectedSalary && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Expected Salary</h4>
                <p className="text-gray-600">₹{application.expectedSalary.toLocaleString()} LPA</p>
              </div>
            )}
            {application.noticePeriod && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Notice Period</h4>
                <p className="text-gray-600">{application.noticePeriod} days</p>
              </div>
            )}
          </div>
          
          {application.coverLetter && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">Cover Letter</h4>
                {application.jobCoverLetter?.metadata?.fileUrl && (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={application.jobCoverLetter.metadata.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-4 h-4 mr-2" />
                        View File
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownloadCoverLetter(application.jobCoverLetter)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 whitespace-pre-wrap">{application.coverLetter}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resume */}
      {jobResume && (
        <Card className="rounded-3xl bg-white/60 backdrop-blur-xl border-white/50 shadow-[0_8px_28px_rgba(59,130,246,0.12)]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Resume/CV
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewResume(jobResume)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadResume(jobResume)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">{jobResume.title}</h4>
                {jobResume.summary && (
                  <p className="text-gray-600 mt-2">{jobResume.summary}</p>
                )}
              </div>
              
              {jobResume.skills && jobResume.skills.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Resume Skills</h5>
                  <div className="flex flex-wrap gap-1">
                    {jobResume.skills.map((skill: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-1" />
                Last updated: {new Date(jobResume.lastUpdated).toLocaleDateString()}
              </div>
              
              {jobResume.metadata?.filename && (
                <div className="flex items-center text-sm text-gray-500">
                  <FileText className="w-4 h-4 mr-1" />
                  File: {jobResume.metadata.filename}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
