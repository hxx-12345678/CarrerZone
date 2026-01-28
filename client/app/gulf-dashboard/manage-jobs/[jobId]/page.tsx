"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { motion } from "framer-motion"
import { GulfEmployerNavbar } from "@/components/gulf-employer-navbar"
import { EmployerFooter } from "@/components/employer-footer"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"
import { apiService } from "@/lib/api"
import { toast } from "sonner"

export default function GulfJobDetailPage() {
  return (
    <EmployerAuthGuard>
      <GulfJobDetailContent />
    </EmployerAuthGuard>
  )
}

function GulfJobDetailContent() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [similarJobs, setSimilarJobs] = useState<any[]>([])
  const [similarJobsLoading, setSimilarJobsLoading] = useState(false)

  useEffect(() => {
    if (params.jobId) {
      fetchJobDetails()
    }
  }, [params.jobId])

  const fetchJobDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching Gulf job details for ID:', params.jobId)
      const response = await apiService.getJobForEdit(params.jobId as string)
      
      if (response.success && response.data) {
        console.log('✅ Gulf job details fetched:', response.data)
        setJob(response.data)
        
        // Fetch similar jobs after getting job details
        fetchSimilarJobs()
      } else {
        console.error('❌ Failed to fetch Gulf job details:', response)
        setError(response.message || 'Failed to fetch job details')
        toast.error(response.message || 'Failed to fetch job details')
      }
    } catch (error: any) {
      console.error('❌ Error fetching Gulf job details:', error)
      setError('Failed to fetch job details')
      toast.error('Failed to fetch job details')
    } finally {
      setLoading(false)
    }
  }

  const fetchSimilarJobs = async () => {
    try {
      setSimilarJobsLoading(true)
      console.log('🔍 Fetching similar Gulf jobs for ID:', params.jobId)
      
      const response = await apiService.getSimilarJobs(params.jobId as string, 4)
      
      if (response.success && response.data) {
        console.log('✅ Similar Gulf jobs fetched:', response.data)
        setSimilarJobs(response.data)
      } else {
        console.error('❌ Failed to fetch similar Gulf jobs:', response)
        // Don't show error toast for similar jobs as it's not critical
      }
    } catch (error: any) {
      console.error('❌ Error fetching similar Gulf jobs:', error)
      // Don't show error toast for similar jobs as it's not critical
    } finally {
      setSimilarJobsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900">
        <GulfEmployerNavbar />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-20 sm:pt-24 lg:pt-28 pb-6 sm:pb-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
              <p className="text-slate-600 dark:text-slate-400">Loading Gulf job details...</p>
            </div>
          </div>
        </div>
        <EmployerFooter />
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900">
        <GulfEmployerNavbar />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-20 sm:pt-24 lg:pt-28 pb-6 sm:pb-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Gulf job not found'}</p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
        <EmployerFooter />
      </div>
    )
  }

  // Transform job data for display
  const transformedJob = {
    id: job.id,
    title: job.title || 'Untitled Job',
    company: job.company?.name || 'Company Name',
    companyLogo: job.company?.logo || "/placeholder-logo.png",
    location: job.location || 'Location not specified',
    type: job.jobType || job.type || 'Full-time',
    experience: job.experienceLevel || job.experience || 'Experience not specified',
    salary: job.salary || (job.salaryMin && job.salaryMax ? `${job.currency || 'AED'} ${job.salaryMin}-${job.salaryMax}` : 'Salary not specified'),
    postedDate: job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Date not available',
    applications: job.applicationsCount || 0,
    views: job.views || 0,
    status: job.status || 'draft',
    department: job.department || 'Department not specified',
    skills: Array.isArray(job.skills) ? job.skills : (job.skills ? job.skills.split(',').map((s: string) => s.trim()) : []),
    description: job.description || 'No description provided',
    benefits: Array.isArray(job.benefits) ? job.benefits : (job.benefits ? job.benefits.split('\n').filter((b: string) => b.trim()) : []),
    companyInfo: {
      description: job.company?.description || 'Company description not available',
      founded: job.company?.founded || 'N/A',
      employees: job.company?.employees || 'N/A',
      industry: job.company?.industry || 'N/A',
      website: job.company?.website || '',
      linkedin: job.company?.linkedin || '',
      location: job.company?.location || job.location || 'Location not specified'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900">
      <GulfEmployerNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Gulf Jobs</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card className="bg-white/80 backdrop-blur-xl border-slate-200/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                          {transformedJob.title}
                        </h1>
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                          Gulf Region
                        </Badge>
                      </div>
                      <p className="text-lg text-slate-600 dark:text-slate-400 mb-2">
                        {transformedJob.company}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
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
                          <span>{transformedJob.postedDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm">
                      <Bookmark className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{transformedJob.applications}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Applications</p>
                  </div>
                  <div className="text-center p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{transformedJob.views}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Views</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{transformedJob.status}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Status</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{transformedJob.department}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Department</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {transformedJob.skills.map((skill: string) => (
                    <Badge key={skill} variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Job Details Tabs */}
            <Card className="bg-white/80 backdrop-blur-xl border-slate-200/50">
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
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Benefits & Perks</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {transformedJob.benefits.map((benefit: string, index: number) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            <span className="text-slate-600 dark:text-slate-400">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="company" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">About {transformedJob.company}</h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                        {transformedJob.companyInfo.description}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Founded</p>
                          <p className="font-medium">{transformedJob.companyInfo.founded}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Employees</p>
                          <p className="font-medium">{transformedJob.companyInfo.employees}</p>
                        </div>
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
                  </TabsContent>

                  <TabsContent value="applications" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Applications</h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        View and manage applications for this Gulf job posting. You have received {transformedJob.applications} applications so far.
                      </p>
                      
                      <div className="mt-6">
                        <Button 
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                          onClick={() => router.push(`/gulf-dashboard/applications?jobId=${transformedJob.id}`)}
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
            <Card className="bg-white/80 backdrop-blur-xl border-slate-200/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Job Actions</h3>
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    onClick={() => router.push(`/gulf-dashboard/manage-jobs/${transformedJob.id}/edit`)}
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
                  <Button variant="outline" className="w-full">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Job
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export Applications
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Job Stats */}
            <Card className="bg-white/80 backdrop-blur-xl border-slate-200/50">
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
                    <span className="font-semibold">{transformedJob.postedDate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Similar Jobs */}
            <Card className="bg-white/80 backdrop-blur-xl border-slate-200/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Similar Gulf Jobs</h3>
                  {similarJobsLoading && (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  )}
                </div>
                
                {similarJobsLoading ? (
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
                ) : similarJobs.length > 0 ? (
                  <div className="space-y-4">
                    {similarJobs.map((recJob) => (
                      <Link
                        key={recJob.id}
                        href={`/gulf-dashboard/manage-jobs/${recJob.id}`}
                        className="block p-4 border rounded-lg hover:border-emerald-300 transition-colors cursor-pointer"
                      >
                        <h4 className="font-medium text-slate-900 dark:text-white mb-1">{recJob.title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{recJob.company}</p>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {recJob.location}
                          </span>
                          <span>{recJob.salary}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="flex items-center">
                            <Briefcase className="w-3 h-3 mr-1" />
                            {recJob.type}
                          </span>
                          <span className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {recJob.applications} applications
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
                    <p className="text-slate-500 dark:text-slate-400">No similar Gulf jobs found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <EmployerFooter />
    </div>
  )
}
