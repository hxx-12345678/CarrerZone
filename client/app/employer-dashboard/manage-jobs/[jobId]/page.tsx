"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Calendar,
  DollarSign,
  Users,
  Eye,
  Share2,
  Bookmark,
  Building2,
  Clock,
  CheckCircle,
  Star,
  ExternalLink,
  Download,
  Mail,
  Phone,
  Globe,
  Linkedin,
  Github,
  Edit,
  Loader2,
  Video,
  Award,
  GraduationCap,
  FileText,
  Calendar as CalendarIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import { EmployerDashboardNavbar } from "@/components/employer-dashboard-navbar"
import { EmployerFooter } from "@/components/employer-footer"
import { apiService } from "@/lib/api"
import { toast } from "sonner"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companyJobs, setCompanyJobs] = useState<any[]>([])
  const [companyJobsLoading, setCompanyJobsLoading] = useState(false)
  const [applications, setApplications] = useState<any[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const fetchJobDetails = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching job details for ID:', params.jobId)
      const response = await apiService.getJobForEdit(params.jobId as string)
      
      if (response.success && response.data) {
        console.log('✅ Job details fetched:', response.data)
        console.log('🔍 Benefits data:', response.data.benefits, 'Type:', typeof response.data.benefits)
        
        // Extract consultancy metadata
        const metadata = response.data.metadata || {};
        const enrichedJob = {
          ...response.data,
          isConsultancy: metadata.postingType === 'consultancy',
          consultancyName: metadata.consultancyName || null,
          hiringCompany: metadata.hiringCompany || null,
          showHiringCompanyDetails: metadata.showHiringCompanyDetails || false,
          companyName: metadata.companyName || response.data.company?.name || null,
          industryType: response.data.industryType || metadata.hiringCompany?.industry || response.data.company?.industry || null,
        };
        
        setJob(enrichedJob)
        
        // Fetch other jobs from same company - will be handled in a separate effect
        // Store companyId for later fetching
        const companyId = (response.data as any).companyId || response.data?.company?.id
        if (companyId) {
          // Call fetchCompanyJobs separately to avoid circular dependency
          setCompanyJobsLoading(true)
          try {
            const jobsResponse = await apiService.getCompanyJobs(companyId, { limit: 5 })
            if (jobsResponse.success && jobsResponse.data) {
              const jobs = (jobsResponse.data.jobs || jobsResponse.data || []) as any[]
              const filtered = jobs.filter(j => String(j.id) !== String(params.jobId))
              setCompanyJobs(filtered)
            }
          } catch (error) {
            setCompanyJobs([])
          } finally {
            setCompanyJobsLoading(false)
          }
        }
      } else {
        console.error('❌ Failed to fetch job details:', response)
        setError(response.message || 'Failed to fetch job details')
        toast.error(response.message || 'Failed to fetch job details')
      }
    } catch (error: any) {
      console.error('❌ Error fetching job details:', error)
      setError('Failed to fetch job details')
      toast.error('Failed to fetch job details')
    } finally {
      setLoading(false)
    }
  }, [params.jobId])

  const fetchJobApplications = useCallback(async () => {
    try {
      setApplicationsLoading(true)
      const response = await apiService.getEmployerApplications()
      if (response.success && Array.isArray(response.data)) {
        const list = (response.data as any[]).filter(app => String(app.jobId) === String(params.jobId))
        setApplications(list)
      } else {
        setApplications([])
      }
    } catch (e) {
      setApplications([])
    } finally {
      setApplicationsLoading(false)
    }
  }, [params.jobId])

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

  useEffect(() => {
    if (params.jobId) {
      fetchJobDetails()
      fetchJobApplications()
    }
  }, [params.jobId, fetchJobDetails, fetchJobApplications])

  // Transform job data for display (only if job exists)
  const transformedJob = job ? {
    id: job.id,
    title: job.title || 'Untitled Job',
    // Company name - check for consultancy first
    company: job.isConsultancy && job.showHiringCompanyDetails
      ? job.hiringCompany?.name || 'Hiring Company'
      : job.isConsultancy
        ? job.consultancyName || 'Consultancy'
        : job.companyName || job.company?.name || 'Company Name',
    companyLogo: job.company?.logo || "/placeholder-logo.png",
    // Consultancy-specific fields
    isConsultancy: job.isConsultancy || false,
    consultancyName: job.consultancyName || null,
    hiringCompany: job.hiringCompany || null,
    showHiringCompanyDetails: job.showHiringCompanyDetails || false,
    location: job.location || 'Location not specified',
    type: job.jobType || job.type || 'Full-time',
    experience: job.experienceLevel || job.experience || 'Experience not specified',
    salary: job.salary || (job.salaryMin && job.salaryMax ? `${(job.salaryMin / 100000).toFixed(0)}-${(job.salaryMax / 100000).toFixed(0)} LPA` : 'Not specified'),
    postedDate: job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : (job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Date not available'),
    postedDateTime: job.publishedAt ? new Date(job.publishedAt).toLocaleString() : (job.createdAt ? new Date(job.createdAt).toLocaleString() : 'Date not available'),
    applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : null,
    validTill: job.validTill ? new Date(job.validTill).toISOString() : null,
    validTillDisplay: job.validTill ? new Date(job.validTill).toLocaleDateString() : null,
    expiryDaysLeft: (() => {
      if (!job.validTill) return null;
      const expiry = new Date(job.validTill);
      const now = new Date();
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    })(),
    applications: (job.applicationsCount ?? applications.length) || applications.length || 0,
    views: job.views || 0,
    status: job.status || 'draft',
    department: job.department || 'Department not specified',
    skills: Array.isArray(job.skills) ? job.skills : (job.skills ? job.skills.split(',').map((s: string) => s.trim()) : []),
    description: job.description || 'No description provided',
    benefits: (() => {
      // Handle different benefit formats: array (JSONB), string with newlines, or comma-separated
      if (!job.benefits) return [];
      if (Array.isArray(job.benefits)) return job.benefits.filter((b: string) => b && b.trim());
      if (typeof job.benefits === 'string') {
        // Try splitting by newlines first (for combined written + selected benefits)
        const newlineSplit = job.benefits.split('\n').filter((b: string) => b.trim());
        if (newlineSplit.length > 0) return newlineSplit;
        // Fallback to comma-separated
        return job.benefits.split(',').map((b: string) => b.trim()).filter((b: string) => b);
      }
      return [];
    })(),
    companyInfo: {
      description: job.isConsultancy && job.showHiringCompanyDetails
        ? job.hiringCompany?.description || 'Company description not available'
        : job.company?.description || 'Company description not available',
      founded: job.company?.founded || 'N/A',
      employees: job.company?.employees || 'N/A',
      industry: job.industryType || job.hiringCompany?.industry || job.company?.industry || 'N/A',
      website: job.company?.website || '',
      linkedin: job.company?.linkedin || '',
      location: job.company?.location || job.location || 'Location not specified'
    },
    brandingMedia: job.customBranding?.brandingMedia || []
  } : null

  if (loading) {
    return (
    <EmployerAuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-auto">
        <EmployerDashboardNavbar />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading job details...</p>
            </div>
          </div>
        </div>
        <EmployerFooter />
      </div>
    </EmployerAuthGuard>
    )
  }

  if (error || !job || !transformedJob) {
    return (
      <EmployerAuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-auto">
        <EmployerDashboardNavbar />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Job not found'}</p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
        <EmployerFooter />
      </div>
      </EmployerAuthGuard>
    )
  }

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
        <div className="absolute top-1/3 left-0 right-0 h-24 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-indigo-400/20"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {transformedJob.title}
                      </h1>
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={transformedJob.companyLogo} alt={transformedJob.company} />
                          <AvatarFallback className="text-sm font-bold">{transformedJob.company[0]}</AvatarFallback>
                        </Avatar>
                        <p className="text-lg text-gray-700 dark:text-gray-300">
                        {transformedJob.company}
                      </p>
                        {transformedJob.isConsultancy && (
                          <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700">
                            Posted by {transformedJob.consultancyName}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{transformedJob.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Briefcase className="w-4 h-4" />
                          <span>{transformedJob.type}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{transformedJob.applicationDeadline ? `Deadline: ${transformedJob.applicationDeadline}` : transformedJob.postedDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        const shareUrl = `${window.location.origin}/jobs/${transformedJob.id}`
                        const shareText = `Check out this job: ${transformedJob.title} at ${transformedJob.company}`
                        
                        if (navigator.share) {
                          navigator.share({
                            title: transformedJob.title,
                            text: shareText,
                            url: shareUrl
                          }).catch(err => console.log('Error sharing:', err))
                        } else {
                          navigator.clipboard.writeText(shareUrl)
                          toast.success('Job link copied to clipboard!')
                        }
                      }}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{transformedJob.applications}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Applications</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{transformedJob.views}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Views</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{transformedJob.status}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Status</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{transformedJob.department}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Department</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {transformedJob.skills.map((skill: string) => (
                    <Badge key={skill} variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Job Details Tabs */}
            <Card className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 shadow-lg">
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="company">Company</TabsTrigger>
                    <TabsTrigger value="applications">Applications</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Job Description</h3>
                      <div className="prose prose-slate dark:prose-invert max-w-none">
                        <div className="whitespace-pre-line text-slate-600 dark:text-slate-400 leading-relaxed">
                          {transformedJob.description}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Benefits & Perks</h3>
                      {transformedJob.benefits && transformedJob.benefits.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {transformedJob.benefits.map((benefit: string, index: number) => (
                          <div key={index} className="flex items-start space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                          </div>
                        ))}
                      </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic">No benefits information provided</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="company" className="space-y-6">
                    <div>
                      {/* Consultancy Job Badge */}
                      {transformedJob.isConsultancy && (
                        <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="w-5 h-5 text-purple-600" />
                            <span className="font-semibold text-purple-900 dark:text-purple-100">Consultancy Job</span>
                          </div>
                          <p className="text-sm text-purple-800 dark:text-purple-200">
                            Posted by: <span className="font-medium">{transformedJob.consultancyName}</span>
                          </p>
                          {!transformedJob.showHiringCompanyDetails && (
                            <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
                              Hiring company details are confidential
                            </p>
                          )}
                        </div>
                      )}
                      
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        About {transformedJob.isConsultancy && transformedJob.showHiringCompanyDetails ? 'the Hiring Company' : transformedJob.company}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                        {transformedJob.companyInfo.description}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Industry</p>
                          <p className="font-medium">{transformedJob.companyInfo.industry}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Location</p>
                          <p className="font-medium">{transformedJob.companyInfo.location}</p>
                        </div>
                      </div>

                      <div className="flex space-x-4 mt-6">
                        {transformedJob.companyInfo.website && (
                        <Button variant="outline" size="sm" asChild>
                            <a href={`https://${transformedJob.companyInfo.website}`} target="_blank" rel="noopener noreferrer">
                            <Globe className="w-4 h-4 mr-2" />
                            Website
                          </a>
                        </Button>
                        )}
                        {transformedJob.companyInfo.linkedin && (
                        <Button variant="outline" size="sm" asChild>
                            <a href={`https://${transformedJob.companyInfo.linkedin}`} target="_blank" rel="noopener noreferrer">
                            <Linkedin className="w-4 h-4 mr-2" />
                            LinkedIn
                          </a>
                        </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Company Branding Media - Hot Vacancy Feature */}
                    {(Array.isArray(transformedJob.brandingMedia) && transformedJob.brandingMedia.length > 0) && (
                      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <Video className="h-5 w-5 text-indigo-600" />
                          Company Branding Media
                          {job?.isHotVacancy && (
                            <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700">
                              Hot Vacancy
                            </Badge>
                          )}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {transformedJob.brandingMedia.map((media: any, index: number) => {
                            const previewUrl = media.preview || media.url || media;
                            const isVideo = media.type === 'video' || previewUrl.includes('.mp4') || previewUrl.includes('.webm') || previewUrl.includes('.mov');
                            
                            return (
                              <div key={index} className="relative group rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                                {isVideo ? (
                                  <video
                                    src={previewUrl}
                                    className="w-full h-48 object-cover"
                                    controls
                                    preload="metadata"
                                  />
                                ) : (
                                  <img
                                    src={previewUrl}
                                    alt={`Company branding ${index + 1}`}
                                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      console.error('Failed to load branding media:', previewUrl);
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                )}
                                <div className="absolute top-2 left-2">
                                  <Badge variant="secondary" className="bg-white/90 backdrop-blur dark:bg-gray-800/90">
                                    {isVideo ? '🎥 Video' : '📸 Photo'}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="applications" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Applications</h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        View and manage applications for this job posting. You have received {transformedJob.applications} applications so far.
                      </p>
                      <div className="mt-4">
                        {applicationsLoading ? (
                          <div className="text-sm text-slate-500">Loading applications...</div>
                        ) : applications.length > 0 ? (
                          <div className="space-y-3">
                            {applications.slice(0,5).map(app => (
                              <div key={app.id} className="p-3 border rounded-lg flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-slate-900">{app.applicant?.fullName || `${app.applicant?.first_name || ''} ${app.applicant?.last_name || ''}`.trim() || app.applicant?.email || 'Candidate'}</div>
                                  <div className="text-xs text-slate-500">{app.status?.replace('_',' ') || 'applied'} • {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}</div>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => handleViewDetails(app)}>View</Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500">No applications yet.</div>
                        )}
                      </div>
                      
                      <div className="mt-6">
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => router.push(`/employer-dashboard/applications?jobId=${transformedJob.id}`)}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          View All Applications
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Actions */}
            <Card className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Job Actions</h3>
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => router.push(`/employer-dashboard/post-job?draft=${transformedJob.id}`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Job
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push(`/jobs/${transformedJob.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Job
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/jobs/${transformedJob.id}`;
                      const shareText = `Check out this job: ${transformedJob.title} at ${transformedJob.company}`;
                      
                      if (navigator.share) {
                        navigator.share({
                          title: transformedJob.title,
                          text: shareText,
                          url: shareUrl
                        }).catch(err => {
                          console.log('Error sharing:', err);
                          // Fallback to clipboard
                          navigator.clipboard.writeText(shareUrl);
                          toast.success('Job link copied to clipboard!');
                        });
                      } else {
                        navigator.clipboard.writeText(shareUrl);
                        toast.success('Job link copied to clipboard!');
                      }
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Job
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export Applications
                  </Button>
                  {/* REMOVED: Edit Expiry button - Only super-admin can manage expiry dates */}
                  {/* Employers can only set application deadline when posting/editing jobs */}
                </div>
              </CardContent>
            </Card>

            {/* Job Stats */}
            <Card className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Job Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Applications</span>
                    <span className="font-semibold">{transformedJob.applications}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Views</span>
                    <span className="font-semibold">{transformedJob.views}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Status</span>
                    <Badge variant={transformedJob.status === 'active' ? 'default' : 'secondary'}>
                      {transformedJob.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Posted</span>
                    <div className="text-right">
                      <div className="font-semibold">{transformedJob.postedDate}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{transformedJob.postedDateTime}</div>
                    </div>
                  </div>
                  {transformedJob.validTillDisplay && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Expires</span>
                      <div className="text-right">
                        <div className={`font-semibold ${transformedJob.expiryDaysLeft !== null && transformedJob.expiryDaysLeft < 0 ? 'text-red-600 dark:text-red-400' : transformedJob.expiryDaysLeft !== null && transformedJob.expiryDaysLeft <= 7 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                          {transformedJob.validTillDisplay}
                        </div>
                        {transformedJob.expiryDaysLeft !== null && (
                          <div className={`text-xs ${transformedJob.expiryDaysLeft < 0 ? 'text-red-500 dark:text-red-400' : transformedJob.expiryDaysLeft <= 7 ? 'text-orange-500 dark:text-orange-400' : 'text-green-500 dark:text-green-400'}`}>
                            {transformedJob.expiryDaysLeft < 0 
                              ? `Expired ${Math.abs(transformedJob.expiryDaysLeft)} day${Math.abs(transformedJob.expiryDaysLeft) !== 1 ? 's' : ''} ago`
                              : transformedJob.expiryDaysLeft === 0 
                              ? 'Expires today'
                              : transformedJob.expiryDaysLeft === 1 
                              ? '1 day left'
                              : `${transformedJob.expiryDaysLeft} days left`}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {transformedJob.applicationDeadline && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Application Deadline</span>
                      <div className="text-right">
                        <div className="font-semibold">{transformedJob.applicationDeadline}</div>
                        {(() => {
                          const deadline = new Date(job.applicationDeadline);
                          const now = new Date();
                          const diffTime = deadline.getTime() - now.getTime();
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          if (diffDays < 0) {
                            return <div className="text-xs text-red-500 dark:text-red-400">Passed {Math.abs(diffDays)} day{Math.abs(diffDays) !== 1 ? 's' : ''} ago</div>;
                          } else if (diffDays === 0) {
                            return <div className="text-xs text-orange-500 dark:text-orange-400">Today</div>;
                          } else if (diffDays === 1) {
                            return <div className="text-xs text-green-500 dark:text-green-400">Tomorrow</div>;
                          } else {
                            return <div className="text-xs text-green-500 dark:text-green-400">{diffDays} days left</div>;
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Other Jobs from Your Company */}
            <Card className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Other Jobs from Your Company</h3>
                  {companyJobsLoading && (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  )}
                </div>
                
                {companyJobsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="p-4 border rounded-lg animate-pulse">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
                        <div className="flex justify-between">
                          <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                          <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : companyJobs.length > 0 ? (
                  <div className="space-y-4">
                    {companyJobs.map((recJob) => (
                      <Link
                        key={recJob.id}
                        href={`/employer-dashboard/manage-jobs/${recJob.id}`}
                        className="block p-4 border rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                      >
                        <h4 className="font-medium text-slate-900 dark:text-white mb-1">{recJob.title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{recJob.company?.name || transformedJob.company}</p>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {recJob.location}
                          </span>
                          <span>{recJob.salary || (recJob.salaryMin && recJob.salaryMax ? `${(recJob.salaryMin / 100000).toFixed(0)}-${(recJob.salaryMax / 100000).toFixed(0)} LPA` : '')}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="flex items-center">
                            <Briefcase className="w-3 h-3 mr-1" />
                            {recJob.jobType || recJob.type}
                          </span>
                          <span className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {(recJob.applicationsCount ?? 0)} applications
                          </span>
                        </div>
                        {recJob.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                            {recJob.description}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-500 dark:text-slate-400">No other jobs from your company</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
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

      <EmployerFooter />
    </div>
    </EmployerAuthGuard>
  )
}

// ApplicationDetailView component - copied from applications page
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

      // CRITICAL: Always use the backend API instead of direct URLs
      // Cloudinary URLs may require authentication and return 401 errors
      // Use the backend API endpoint which handles authentication and file serving
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

      // CRITICAL: Always use the backend API instead of direct Cloudinary URLs
      // Cloudinary URLs may require authentication and return 401 errors
      // Fetch the resume file from the backend API and create a blob URL for viewing
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
                <CalendarIcon className="w-4 h-4 mr-1" />
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