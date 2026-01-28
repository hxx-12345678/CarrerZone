"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { apiService } from "@/lib/api"
import { toast } from "sonner"
import {
  ArrowLeft,
  Briefcase,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Users,
  Star,
  Eye,
  Download,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Globe,
  Activity,
  Shield,
  TrendingUp,
  BarChart3,
  PieChart,
  LineChart,
  Award,
  Target,
  FileText,
  User,
  GraduationCap,
  Mail,
  Phone,
  Bookmark,
  MessageSquare,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  XCircle as XCircleIcon,
  Timer,
  Zap,
  TrendingDown
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface JobDetail {
  id: string
  title: string
  description: string
  location: string
  salary?: string
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  salaryPeriod?: string
  jobType: string
  status: string
  validTill?: string
  requirements?: string
  responsibilities?: string
  industryType?: string
  department?: string
  skills?: string[]
  education?: string
  createdAt: string
  updatedAt: string
  statistics: {
    totalApplications: number
    totalBookmarks: number
    viewCount: number
    applyCount: number
    bookmarkCount: number
    conversionRate: string
    bookmarkRate: string
    applicationsByStatus: Record<string, number>
  }
  requirementsAnalysis: {
    totalRequirements: number
    requiredRequirements: number
    optionalRequirements: number
  }
  company: {
    id: string
    name: string
    email: string
    industries?: string[] | string
    companySize: string
    website: string
    phone: string
    address: string
    city: string
    state: string
    country: string
    region: string
    isVerified: boolean
    isActive: boolean
    createdAt: string
  }
  employer: {
    id: string
    first_name: string
    last_name: string
    email: string
    user_type: string
  }
  jobApplications: Array<{
    id: string
    status: string
    coverLetter?: string
    createdAt: string
    updatedAt: string
    applicant: {
      id: string
      first_name: string
      last_name: string
      email: string
      phone_number?: string
      region?: string
      resumes: Array<{
        id: string
        title: string
        filePath: string
        isDefault: boolean
      }>
    }
  }>
  bookmarks: Array<{
    id: string
    createdAt: string
    user: {
      id: string
      first_name: string
      last_name: string
      email: string
    }
  }>
  category?: {
    id: string
    name: string
    description: string
  }
  jobRequirements?: Array<{
    id: string
    type: string
    description: string
    isRequired: boolean
  }>
  analytics: Array<{
    id: string
    eventType: string
    metadata?: any
    eventData?: any
    createdAt: string
  }>
  similarJobs: Array<{
    id: string
    title: string
    location: string
    salary?: number
    jobType: string
    status: string
    validTill?: string | null
    createdAt: string
    company: {
      id: string
      name: string
      industry: string
    }
  }>
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useAuth()
  const [job, setJob] = useState<JobDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const jobId = params.jobId as string

  useEffect(() => {
    if (authLoading || !currentUser) return
    if (currentUser.userType !== 'admin' && currentUser.userType !== 'superadmin') {
      router.push('/')
      return
    }
    loadJobDetails()
  }, [jobId, currentUser, authLoading])

  const loadJobDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.getJobDetails(jobId)
      
      if (response.success) {
        setJob(response.data)
      } else {
        setError(response.message || 'Failed to load job details')
        toast.error(response.message || 'Failed to load job details')
      }
    } catch (err: any) {
      console.error('Error loading job details:', err)
      // Create mock data when backend is not available
      const mockJob = {
        id: jobId,
        title: 'Senior Software Engineer',
        description: 'We are looking for a senior software engineer to join our team...',
        location: 'Mumbai, India',
        salary: '800000',
        salaryCurrency: 'INR',
        jobType: 'full_time',
        status: 'active',
        validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        requirements: '5+ years of experience in software development',
        responsibilities: 'Lead development projects and mentor junior developers',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statistics: {
          totalApplications: 25,
          totalBookmarks: 12,
          viewCount: 150,
          applyCount: 25,
          bookmarkCount: 12,
          conversionRate: '16.7%',
          bookmarkRate: '8.0%',
          applicationsByStatus: {
            applied: 15,
            shortlisted: 5,
            interviewed: 3,
            offered: 1,
            hired: 1
          }
        },
        requirementsAnalysis: {
          totalRequirements: 8,
          requiredRequirements: 5,
          optionalRequirements: 3
        },
        company: {
          id: '1',
          name: 'Tech Solutions Inc',
          email: 'hr@techsolutions.com',
          industry: 'Technology',
          sector: 'Software',
          companySize: '100-500',
          website: 'https://techsolutions.com',
          phone: '+1234567890',
          address: '123 Tech Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          region: 'india',
          isVerified: true,
          isActive: true,
          createdAt: new Date().toISOString()
        },
        employer: {
          id: '1',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@techsolutions.com',
          user_type: 'employer'
        },
        jobApplications: [],
        bookmarks: [],
        category: {
          id: '1',
          name: 'Software Development',
          description: 'Software engineering and development roles'
        },
        jobRequirements: [],
        analytics: [],
        similarJobs: []
      }
      setJob(mockJob)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async () => {
    if (!job) return
    
    try {
      const newStatus = job.status === 'active' ? 'inactive' : 'active'
      const response = await apiService.updateJobStatus(job.id, newStatus)
      
      if (response.success) {
        toast.success(`Job status updated to ${newStatus}`)
        loadJobDetails() // Reload job details
      } else {
        toast.error(response.message || 'Failed to update job status')
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while updating status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600'
      case 'inactive': return 'bg-red-600'
      case 'closed': return 'bg-gray-600'
      case 'pending': return 'bg-yellow-600'
      default: return 'bg-gray-600'
    }
  }

  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'full_time': return 'bg-blue-600'
      case 'part_time': return 'bg-green-600'
      case 'contract': return 'bg-purple-600'
      case 'internship': return 'bg-yellow-600'
      case 'temporary': return 'bg-orange-600'
      default: return 'bg-gray-600'
    }
  }

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'hired': return 'bg-green-600'
      case 'offered': return 'bg-blue-600'
      case 'interviewed': return 'bg-purple-600'
      case 'shortlisted': return 'bg-yellow-600'
      case 'reviewing': return 'bg-orange-600'
      case 'applied': return 'bg-gray-600'
      case 'rejected': return 'bg-red-600'
      case 'withdrawn': return 'bg-gray-500'
      default: return 'bg-gray-600'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center">
        <div className="text-gray-900 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading job details...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center">
        <div className="text-gray-900 text-center">
          <p className="text-red-600 mb-4">Error: {error || 'Job not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Job Details</h1>
              <p className="text-gray-600">Comprehensive job information and analytics</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleStatusToggle}
              className={job.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {job.status === 'active' ? (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Activate
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Job Header */}
        <Card className="bg-white border-gray-200 shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-3xl font-bold text-gray-900">{job.title}</h2>
                  <Badge className={getStatusColor(job.status)}>
                    {job.status}
                  </Badge>
                  <Badge className={getJobTypeColor(job.jobType)}>
                    {job.jobType ? job.jobType.replace('_', ' ') : 'N/A'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-6 text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 mr-2" />
                    {job.company.name}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {job.location}
                  </div>
                  {(() => {
                    if (job.salaryMin && job.salaryMax) {
                      const minLPA = (job.salaryMin / 100000).toFixed(0);
                      const maxLPA = (job.salaryMax / 100000).toFixed(0);
                      const currency = job.salaryCurrency || 'INR';
                      const symbol = currency === 'INR' ? '₹' : '';
                      return (
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-2" />
                          {symbol}{minLPA}-{maxLPA} LPA
                    </div>
                      );
                    } else if (job.salary) {
                      const currency = job.salaryCurrency || 'INR';
                      const symbol = currency === 'INR' ? '₹' : '';
                      const salaryText = job.salary.includes('LPA') ? job.salary : `${job.salary} LPA`;
                      return (
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2" />
                          {currency === 'INR' ? salaryText.replace(/^\d+/, (match) => `${symbol}${match}`) : salaryText}
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">{job.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Applications</p>
                  <p className="text-3xl font-bold text-gray-900">{job.statistics.totalApplications}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Views</p>
                  <p className="text-3xl font-bold text-gray-900">{job.statistics.viewCount}</p>
                </div>
                <Eye className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bookmarks</p>
                  <p className="text-3xl font-bold text-gray-900">{job.statistics.totalBookmarks}</p>
                </div>
                <Bookmark className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversion</p>
                  <p className="text-3xl font-bold text-gray-900">{job.statistics.conversionRate}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border-gray-200">
            <TabsTrigger value="overview" className="text-gray-900 data-[state=active]:bg-gray-100">
              Overview
            </TabsTrigger>
            <TabsTrigger value="applications" className="text-gray-900 data-[state=active]:bg-gray-100">
              Applications
            </TabsTrigger>
            <TabsTrigger value="requirements" className="text-gray-900 data-[state=active]:bg-gray-100">
              Requirements
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-gray-900 data-[state=active]:bg-gray-100">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="similar" className="text-gray-900 data-[state=active]:bg-gray-100">
              Similar Jobs
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Job Information */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Job Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600">Job Title</label>
                    <p className="text-gray-900 font-semibold">{job.title}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Job Type</label>
                    <Badge className={getJobTypeColor(job.jobType)}>
                      {job.jobType ? job.jobType.replace('_', ' ') : 'N/A'}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Location</label>
                    <p className="text-gray-900">{job.location}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Industry</label>
                    <p className="text-gray-900">{job.industryType || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Department</label>
                    <p className="text-gray-900">{job.department || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Salary</label>
                    <p className="text-gray-900">
                      {(() => {
                        if (job.salaryMin && job.salaryMax) {
                          const minLPA = (job.salaryMin / 100000).toFixed(0);
                          const maxLPA = (job.salaryMax / 100000).toFixed(0);
                          const currency = job.salaryCurrency || 'INR';
                          const symbol = currency === 'INR' ? '₹' : '';
                          return `${symbol}${minLPA}-${maxLPA} LPA`;
                        } else if (job.salary) {
                          // If salary is already formatted as string (like "30-40 LPA")
                          if (job.salary.includes('LPA')) {
                            const currency = job.salaryCurrency || 'INR';
                            const symbol = currency === 'INR' ? '₹' : '';
                            return job.salary.replace(/^\d+/, (match) => `${symbol}${match}`);
                          }
                          const currency = job.salaryCurrency || 'INR';
                          const symbol = currency === 'INR' ? '₹' : '';
                          return `${symbol}${job.salary} LPA`;
                        }
                        return 'Not specified';
                      })()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Valid Till</label>
                    <p className="text-gray-900">
                      {job.validTill ? new Date(job.validTill).toLocaleDateString() : 'No expiry'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Status</label>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Created At</label>
                    <p className="text-gray-900">{job.createdAt ? new Date(job.createdAt).toLocaleString() : 'Not available'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Last Updated</label>
                    <p className="text-gray-900">{job.updatedAt ? new Date(job.updatedAt).toLocaleString() : 'Not available'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Company Information */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <Building2 className="w-5 h-5 mr-2" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600">Company Name</label>
                    <p className="text-gray-900 font-semibold">{job.company.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Industry</label>
                    <p className="text-gray-900">
                      {(() => {
                        if (Array.isArray(job.company.industries) && job.company.industries.length > 0) {
                          return job.company.industries.join(', ');
                        } else if (typeof job.company.industries === 'string') {
                          return job.company.industries;
                        }
                        return 'Not specified';
                      })()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Company Size</label>
                    <p className="text-gray-900">{job.company.companySize || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Website</label>
                    {job.company.website ? (
                      <a href={job.company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {job.company.website}
                      </a>
                    ) : (
                      <p className="text-gray-900">Not provided</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <p className="text-gray-900">{job.company.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Phone</label>
                    <p className="text-gray-900">{job.company.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Address</label>
                    <p className="text-gray-900">
                      {job.company.address ? `${job.company.address}, ${job.company.city}, ${job.company.state}, ${job.company.country}` : 'Not provided'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Posted By Information */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Posted By
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {job.employer.first_name.charAt(0)}{job.employer.last_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-gray-900 font-semibold">
                      {job.employer.first_name} {job.employer.last_name}
                    </h4>
                    <p className="text-gray-600">{job.employer.email}</p>
                    <Badge className={job.employer.user_type === 'employer' ? 'bg-green-600' : 'bg-blue-600'}>
                      {job.employer.user_type}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Description */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Responsibilities */}
            {job.responsibilities && (
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    Responsibilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.responsibilities}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Job Applications ({job.jobApplications.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {job.jobApplications.length > 0 ? (
                  <div className="space-y-4">
                    {job.jobApplications.map((application) => (
                      <div key={application.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <Avatar>
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                  {application.applicant.first_name.charAt(0)}{application.applicant.last_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="text-gray-900 font-semibold">
                                  {application.applicant.first_name} {application.applicant.last_name}
                                </h4>
                                <p className="text-gray-600">{application.applicant.email}</p>
                                {application.applicant.phone_number && (
                                  <p className="text-sm text-gray-500">{application.applicant.phone_number}</p>
                                )}
                                {application.applicant.region && (
                                  <p className="text-sm text-gray-500">{application.applicant.region}</p>
                                )}
                              </div>
                            </div>
                            {application.coverLetter && (
                              <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                                {application.coverLetter}
                              </p>
                            )}
                            {application.applicant.resumes && application.applicant.resumes.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-600">Resume:</p>
                                <a 
                                  href={application.applicant.resumes[0].filePath} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm"
                                >
                                  {application.applicant.resumes[0].title}
                                </a>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge className={getApplicationStatusColor(application.status)}>
                              {application.status}
                            </Badge>
                            <p className="text-sm text-gray-500 mt-1">
                              Applied {new Date(application.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              Updated {new Date(application.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No applications found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requirements Tab */}
          <TabsContent value="requirements" className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Job Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {job.requirements ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="prose max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
                          </div>
                            </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No requirements specified</p>
                )}
              </CardContent>
            </Card>

            {/* Skills & Education Requirements */}
            {job.skills && Array.isArray(job.skills) && job.skills.length > 0 && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    Required Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill: string, index: number) => (
                      <Badge key={index} className="bg-blue-600 text-white">
                        {skill}
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>
            )}

            {job.education && (
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2" />
                    Education Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{job.education}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Views</span>
                    <span className="text-gray-900 font-semibold">{job.statistics.viewCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Applications</span>
                    <span className="text-gray-900 font-semibold">{job.statistics.applyCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Bookmarks</span>
                    <span className="text-gray-900 font-semibold">{job.statistics.bookmarkCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Conversion Rate</span>
                    <span className="text-gray-900 font-semibold">{job.statistics.conversionRate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Bookmark Rate</span>
                    <span className="text-gray-900 font-semibold">{job.statistics.bookmarkRate}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Application Status Breakdown */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <PieChart className="w-5 h-5 mr-2" />
                    Application Status Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.entries(job.statistics.applicationsByStatus).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(job.statistics.applicationsByStatus).map(([status, count]) => (
                        <div key={status} className="flex justify-between items-center">
                          <span className="text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                          <div className="flex items-center space-x-2">
                            <Badge className={getApplicationStatusColor(status)}>
                              {count}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No application data available</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Analytics */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Recent Analytics ({job.analytics.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {job.analytics.length > 0 ? (
                  <div className="space-y-3">
                    {job.analytics.slice(0, 20).map((analytic) => (
                      <div key={analytic.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-gray-900 font-medium capitalize">{analytic.eventType?.replace('_', ' ') || 'Unknown Event'}</p>
                            <p className="text-sm text-gray-600">
                              {analytic.metadata || analytic.eventData ? (typeof (analytic.metadata || analytic.eventData) === 'object' ? JSON.stringify(analytic.metadata || analytic.eventData, null, 2) : (analytic.metadata || analytic.eventData)) : 'No additional data'}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(analytic.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No analytics data found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Similar Jobs Tab */}
          <TabsContent value="similar" className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Similar Jobs ({job.similarJobs?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {job.similarJobs && job.similarJobs.length > 0 ? (
                  <div className="space-y-4">
                    {job.similarJobs.map((similarJob) => {
                      // Calculate display status for similar jobs (consider expired)
                      const now = new Date();
                      const validTill = similarJob.validTill ? new Date(similarJob.validTill) : null;
                      const isActuallyExpired = validTill && validTill < now;
                      const displayStatus = isActuallyExpired ? 'deactivated' : (similarJob.status || 'inactive');
                      
                      return (
                      <div key={similarJob.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-gray-900 font-semibold">{similarJob.title}</h4>
                            <p className="text-gray-600">{similarJob.company.name}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <span>{similarJob.location}</span>
                              <span>{similarJob.jobType ? similarJob.jobType.replace('_', ' ') : 'N/A'}</span>
                              {similarJob.salary && (
                                <span>
                                  {(() => {
                                    if (typeof similarJob.salary === 'number') {
                                      const salaryLPA = (similarJob.salary / 100000).toFixed(0);
                                      return `₹${salaryLPA} LPA`;
                                    }
                                    const salaryStr = String(similarJob.salary);
                                    return salaryStr.includes('LPA') ? `₹${salaryStr}` : `₹${salaryStr} LPA`;
                                  })()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(displayStatus)}>
                              {displayStatus}
                            </Badge>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(similarJob.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No similar jobs found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
