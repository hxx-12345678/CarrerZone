"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Star,
  Share2,
  Bookmark,
  Building2,
  CheckCircle,
  AlertCircle,
  Award,
  LinkIcon,
  Mail,
  MessageCircle,
  X,
  Calendar,
  Users,
  GraduationCap,
  Zap,
  Video,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import GulfNavbar from "@/components/gulf-navbar"
import { apiService } from '@/lib/api'
import { sampleJobManager } from '@/lib/sampleJobManager'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { JobApplicationDialog } from '@/components/job-application-dialog'

// Interface for similar jobs API response
interface SimilarJobsResponse {
  success: boolean;
  data: any[];
  message?: string;
}

export default function GulfJobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showApplicationDialog, setShowApplicationDialog] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)
  const [jobLoading, setJobLoading] = useState(true)
  const [job, setJob] = useState<any | null>(null)
  const [similarJobs, setSimilarJobs] = useState<any[]>([])
  const [similarJobsLoading, setSimilarJobsLoading] = useState(false)

  const jobIdFromParams = (params?.id as string) || ''

  // Load job data by id (API first, fallback to sample bookmark/application data)
  useEffect(() => {
    let isMounted = true
    const loadJob = async () => {
      setJobLoading(true)
      try {
        if (jobIdFromParams) {
          console.log('🔍 Fetching job details for ID:', jobIdFromParams)
          
          // Try to fetch job data using public API method
          try {
            const res = await apiService.getGulfJobById(jobIdFromParams)
            console.log('📋 Job API response (public):', res)
            
            if (res.success && res.data) {
              // Gulf job - already on Gulf page, no redirect needed
              
              // Transform the job data to match the expected format
              const metadata = res.data.metadata || {};
              const isConsultancy = metadata.postingType === 'consultancy';
              
              const transformedJob = {
                id: res.data.id,
                title: res.data.title || 'Untitled Job',
                // Company name handling - CRITICAL: Show the actual company name, not the consultancy/poster name
                // For consultancy jobs: 
                //   - If showHiringCompanyDetails=true: show hiring company name (the company actually hiring)
                //   - If showHiringCompanyDetails=false: show employer's company name (the consultancy company), NOT the consultancyName
                // For regular jobs: show the company name
                company: isConsultancy && metadata.showHiringCompanyDetails 
                  ? metadata.hiringCompany?.name || 'Hiring Company'
                  : isConsultancy 
                    ? (metadata.companyName || res.data.company?.name || res.data.employer?.companyName || 'Company Name')
                    : (metadata.companyName || res.data.company?.name || res.data.company || res.data.employer || 'Company Name'),
                companyId: res.data.companyId || res.data.employerId || '',
                companyLogo: res.data.company?.logo || res.data.employer?.logo || "/placeholder.svg",
                createdBy: res.data.createdBy || res.data.created_by || res.data.employerId || res.data.employer_id || metadata?.createdBy || '',
                employerId: res.data.employerId || res.data.employer_id || res.data.createdBy || '',
                // Consultancy-specific data
                isConsultancy: isConsultancy,
                consultancyName: metadata.consultancyName || null,
                hiringCompany: metadata.hiringCompany || null,
                showHiringCompanyDetails: metadata.showHiringCompanyDetails || false,
                // Industry from multiple sources
                industryType: res.data.industryType || metadata.hiringCompany?.industry || res.data.company?.industry || 'Not specified',
                department: res.data.department || 'Not specified',
                role: res.data.role || null,
                roleCategory: res.data.roleCategory || null,
                employmentType: res.data.employmentType || null,
                location: res.data.location || 'Location not specified',
                experience: res.data.experienceLevel || res.data.experience || 'Experience not specified',
                experienceLevel: res.data.experienceLevel || res.data.experience || 'Not specified',
                education: Array.isArray(res.data.education) ? res.data.education : (res.data.education ? [res.data.education] : []),
                salary: res.data.salary || (res.data.salaryMin && res.data.salaryMax ? `${(res.data.salaryMin / 100000).toFixed(0)}-${(res.data.salaryMax / 100000).toFixed(0)} AED` : 'Not specified'),
                skills: Array.isArray(res.data.skills) ? res.data.skills : (res.data.skills ? res.data.skills.split(',').map((s: string) => s.trim()) : []),
                posted: res.data.createdAt ? new Date(res.data.createdAt).toLocaleDateString() : 'Date not available',
                applicants: res.data.applicationsCount || 0,
                description: res.data.description || 'No description provided',
                requirements: Array.isArray(res.data.requirements) ? res.data.requirements : (res.data.requirements ? res.data.requirements.split('\n').filter((r: string) => r.trim()) : []),
                benefits: Array.isArray(res.data.benefits) 
                  ? res.data.benefits 
                  : (res.data.benefits 
                      ? (res.data.benefits.includes(',') 
                          ? res.data.benefits.split(',').map((b: string) => b.trim()).filter((b: string) => b)
                          : res.data.benefits.split('\n').filter((b: string) => b.trim()))
                      : []),
                type: res.data.jobType || res.data.type || 'Full-time',
                remote: res.data.remoteWork === 'remote' || res.data.remoteWork === 'hybrid',
                companySize: res.data.company?.companySize || res.data.company?.size || res.data.employer?.size || 'Company size not specified',
                companyRating: res.data.company?.rating || res.data.employer?.rating || 0,
                companyReviews: res.data.company?.reviews || res.data.employer?.reviews || 0,
                industry: res.data.industryType || metadata.hiringCompany?.industry || res.data.company?.industry || res.data.employer?.industry || res.data.industry || 'Industry not specified',
                founded: res.data.company?.founded || res.data.employer?.founded || 'Founded date not available',
                website: res.data.company?.website || res.data.employer?.website || '',
                aboutCompany: isConsultancy && metadata.showHiringCompanyDetails 
                  ? metadata.hiringCompany?.description || 'Company description not available'
                  : res.data.company?.description || res.data.employer?.description || res.data.company?.about || res.data.employer?.about || 'Company description not available',
                photos: res.data.photos || [],
                // Hot Vacancy Premium Features
                isHotVacancy: res.data.isHotVacancy || false,
                externalApplyUrl: res.data.externalApplyUrl || '',
                whyWorkWithUs: res.data.whyWorkWithUs || '',
                videoBanner: res.data.videoBanner || '',
                companyProfile: res.data.companyProfile || '',
                officeImages: res.data.officeImages || [],
                attachmentFiles: res.data.attachmentFiles || [],
                // Branding Media from customBranding
                brandingMedia: res.data.customBranding?.brandingMedia || [],
                // Application timelines
                validTill: res.data.validTill || res.data.valid_till || metadata.validTill || metadata.valid_till || null,
                applicationDeadline: res.data.applicationDeadline || res.data.application_deadline || metadata.applicationDeadline || metadata.application_deadline || null
              }
              
              console.log('✅ Transformed job data:', transformedJob)
              console.log('📸 Job photos for jobseeker:', res.data.photos)
              setJob(transformedJob)
            setJobLoading(false)
            return
            }
          } catch (fetchError) {
            console.log('❌ Direct fetch failed, trying with API service:', fetchError)
          }
          
          // Fallback to API service with authentication
          const res = await apiService.getGulfJobById(jobIdFromParams)
          console.log('📋 Job API response (authenticated):', res)
          
          if (isMounted && res.success && res.data) {
            // Gulf job - already on Gulf page, no redirect needed
            // Transform the job data to match the expected format
            const transformedJob = {
              id: res.data.id,
              title: res.data.title || 'Untitled Job',
              company: res.data.company || res.data.employer || 'Company Name',
              companyId: res.data.companyId || res.data.employerId || '',
              companyLogo: res.data.company?.logo || res.data.employer?.logo || "/placeholder.svg",
              createdBy: res.data.createdBy || res.data.created_by || res.data.employerId || res.data.employer_id || '',
              employerId: res.data.employerId || res.data.employer_id || res.data.createdBy || '',
              location: res.data.location || 'Location not specified',
              experience: res.data.experienceLevel || res.data.experience || 'Experience not specified',
              experienceLevel: res.data.experienceLevel || res.data.experience || 'Not specified',
              education: Array.isArray(res.data.education) ? res.data.education : (res.data.education ? [res.data.education] : []),
              salary: res.data.salary || (res.data.salaryMin && res.data.salaryMax ? `${(res.data.salaryMin / 100000).toFixed(0)}-${(res.data.salaryMax / 100000).toFixed(0)} AED` : 'Not specified'),
              skills: Array.isArray(res.data.skills) ? res.data.skills : (res.data.skills ? res.data.skills.split(',').map((s: string) => s.trim()) : []),
              posted: res.data.createdAt ? new Date(res.data.createdAt).toLocaleDateString() : 'Date not available',
              applicants: res.data.applicationsCount || 0,
              description: res.data.description || 'No description provided',
              requirements: Array.isArray(res.data.requirements) ? res.data.requirements : (res.data.requirements ? res.data.requirements.split('\n').filter((r: string) => r.trim()) : []),
              benefits: Array.isArray(res.data.benefits) 
                ? res.data.benefits 
                : (res.data.benefits 
                    ? (res.data.benefits.includes(',') 
                        ? res.data.benefits.split(',').map((b: string) => b.trim()).filter((b: string) => b)
                        : res.data.benefits.split('\n').filter((b: string) => b.trim()))
                    : []),
              type: res.data.jobType || res.data.type || 'Full-time',
              remote: res.data.remoteWork === 'remote' || res.data.remoteWork === 'hybrid',
              department: res.data.department || 'Department not specified',
              companySize: res.data.company?.size || res.data.employer?.size || 'Company size not specified',
              companyRating: res.data.company?.rating || res.data.employer?.rating || 0,
              companyReviews: res.data.company?.reviews || res.data.employer?.reviews || 0,
              industry: res.data.company?.industry || res.data.employer?.industry || res.data.industry || 'Industry not specified',
              founded: res.data.company?.founded || res.data.employer?.founded || 'Founded date not available',
              website: res.data.company?.website || res.data.employer?.website || '',
              aboutCompany: res.data.company?.description || res.data.employer?.description || res.data.company?.about || res.data.employer?.about || 'Company description not available',
              photos: res.data.photos || [],
              // Internship-specific fields
              duration: res.data.duration,
              startDate: res.data.startDate,
              workMode: res.data.workMode,
              learningObjectives: res.data.learningObjectives,
              mentorship: res.data.mentorship,
              // Hot Vacancy Premium Features
              isHotVacancy: res.data.isHotVacancy || false,
              externalApplyUrl: res.data.externalApplyUrl || '',
              whyWorkWithUs: res.data.whyWorkWithUs || '',
              videoBanner: res.data.videoBanner || '',
              companyProfile: res.data.companyProfile || '',
              officeImages: res.data.officeImages || [],
              attachmentFiles: res.data.attachmentFiles || [],
              // Branding Media from customBranding
              brandingMedia: res.data.customBranding?.brandingMedia || [],
              // Application timelines
              validTill: res.data.validTill || res.data.valid_till || null,
              applicationDeadline: res.data.applicationDeadline || res.data.application_deadline || null
            }
            
            console.log('✅ Transformed job data (fallback):', transformedJob)
            console.log('📸 Job photos for jobseeker (fallback):', res.data.photos)
            setJob(transformedJob)
            setJobLoading(false)
            return
          } else {
            console.log('❌ Job API call failed or no data:', res)
          }
        }
      } catch (e) {
        console.error('❌ Error fetching job:', e)
        // ignore and fallback
      }

      // Fallback: try to hydrate from sample bookmarks/applications
      let fallback: any | null = null
      const bookmarks = sampleJobManager.getBookmarks()
      const apps = sampleJobManager.getApplications()
      const b = bookmarks.find(bm => bm.jobId === jobIdFromParams)
      if (b) {
        fallback = {
          id: b.jobId,
          title: b.jobTitle,
          company: b.companyName,
          companyId: "",
          companyLogo: "/placeholder.svg?height=80&width=80",
          location: b.location,
          experience: "",
          salary: b.salary,
          skills: [],
          posted: "",
          applicants: 0,
          description: "",
          requirements: [],
          benefits: [],
          type: b.type,
          remote: false,
          department: "",
          companySize: "",
          companyRating: 0,
          companyReviews: 0,
          industry: "",
          founded: "",
          website: "",
          aboutCompany: "",
        }
      } else {
        const a = apps.find(ap => ap.jobId === jobIdFromParams)
        if (a) {
          fallback = {
            id: a.jobId,
            title: a.jobTitle,
            company: a.companyName,
            companyId: "",
            companyLogo: "/placeholder.svg?height=80&width=80",
            location: a.location,
            experience: "",
            salary: a.salary,
            skills: [],
            posted: "",
            applicants: 0,
            description: "",
            requirements: [],
            benefits: [],
            type: a.type,
            remote: false,
            department: "",
            companySize: "",
            companyRating: 0,
            companyReviews: 0,
            industry: "",
            founded: "",
            website: "",
            aboutCompany: "",
          }
        }
      }

      if (isMounted) {
        if (fallback) {
        setJob(fallback)
        } else {
          setJob(null)
        }
        setJobLoading(false)
      }
    }

    loadJob()
    return () => { isMounted = false }
  }, [jobIdFromParams])

  // Load similar jobs with comprehensive error handling
  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout | null = null
    
    const loadSimilarJobs = async () => {
      if (!jobIdFromParams || !job) return
      
      setSimilarJobsLoading(true)
      setSimilarJobs([]) // Clear previous results
      
      try {
        console.log('🔍 Fetching similar jobs for:', jobIdFromParams)
        
        // Add timeout to prevent hanging requests
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Request timeout')), 10000)
        })
        
        const apiPromise = apiService.getSimilarGulfJobs(jobIdFromParams, 3)
        
        const res = await Promise.race([apiPromise, timeoutPromise])
        
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        
        console.log('📋 Similar jobs response:', res)
        
        if (isMounted) {
          const response = res as SimilarJobsResponse;
          if (response && response.success && Array.isArray(response.data)) {
            // Validate and sanitize the response data
            const validJobs = response.data.filter((job: any) => 
              job && 
              job.id && 
              job.title && 
              typeof job.title === 'string' &&
              job.title.trim().length > 0
            ).map((job: any) => ({
              ...job,
              // Ensure all required fields have fallback values
              title: job.title?.trim() || 'Untitled Job',
              company: typeof job.company === 'string' 
                ? job.company.trim() 
                : (job.company?.name || typeof job.company === 'object' && job.company ? 'Company' : 'Company not specified'),
              location: typeof job.location === 'string' ? job.location.trim() : (job.location || 'Location not specified'),
              salary: typeof job.salary === 'string' ? job.salary.trim() : (job.salary || 'Salary not disclosed'),
              type: job.type || 'full-time',
              experienceLevel: job.experienceLevel || 'mid',
              department: job.department || 'General',
              skills: Array.isArray(job.skills) ? job.skills : [],
              posted: job.posted || new Date().toLocaleDateString(),
              applications: typeof job.applications === 'number' ? job.applications : 0,
              views: typeof job.views === 'number' ? job.views : 0,
              isFeatured: Boolean(job.isFeatured),
              isPremium: Boolean(job.isPremium),
              description: job.description?.trim() || '',
              companyInfo: {
                industry: job.companyInfo?.industry || 'Not specified',
                size: job.companyInfo?.size || 'Not specified',
                website: job.companyInfo?.website || '',
                isFeatured: Boolean(job.companyInfo?.isFeatured),
                rating: typeof job.companyInfo?.rating === 'number' ? job.companyInfo.rating : 0,
                totalReviews: typeof job.companyInfo?.totalReviews === 'number' ? job.companyInfo.totalReviews : 0
              },
              similarityScore: job.similarityScore || '0.0'
            }))
            
            setSimilarJobs(validJobs)
            console.log(`✅ Loaded ${validJobs.length} valid similar jobs`)
          } else {
            console.warn('⚠️ Invalid similar jobs response:', res)
            setSimilarJobs([])
          }
        }
      } catch (error) {
        console.error('❌ Error fetching similar jobs:', error)
        
        if (isMounted) {
          // Set empty array on error to show empty state
          setSimilarJobs([])
          
          // Show user-friendly error message
          if (error instanceof Error) {
            if (error.message === 'Request timeout') {
              console.warn('⏰ Similar jobs request timed out')
            } else {
              console.warn('🔧 Similar jobs request failed:', error.message)
            }
          }
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        
        if (isMounted) {
          setSimilarJobsLoading(false)
        }
      }
    }

    // Only load similar jobs after the main job is loaded and we have a valid job ID
    if (job && !jobLoading && jobIdFromParams && jobIdFromParams.length > 0) {
      // Add a small delay to ensure the main job is fully rendered
      const delayId = setTimeout(() => {
        loadSimilarJobs()
      }, 100)
      
      return () => {
        isMounted = false
        clearTimeout(delayId)
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      }
    }

    return () => { 
      isMounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [jobIdFromParams, job, jobLoading])

  // Auth check - Allow employers/admins to view job details (removed redirect)
  // Employers can now access /gulf-jobs/[id] page to preview their posted jobs
  useEffect(() => {
    // No redirect needed - employers can view their company's job details
    if (user && (user.userType === 'employer' || user.userType === 'admin')) {
      console.log('✅ Employer/Admin accessing job detail page - allowing access for job preview')
    }
  }, [user])

  // Show loading while redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Redirecting...</p>
        </div>
      </div>
    )
  }

  const hasApplied = useMemo(() => sampleJobManager.hasApplied(jobIdFromParams), [jobIdFromParams, forceUpdate])

  const isEmployerAccount = useMemo(() => {
    if (!user) return false
    return user.userType === 'employer' || user.userType === 'admin'
  }, [user])

  const isOwnJob = useMemo(() => {
    if (!isEmployerAccount || !user || !job) return false

    const userIdentifiers = [
      user.id,
      (user as any).userId,
      (user as any).employerId,
    ].filter(Boolean)

    const jobOwnerIdentifiers = [
      (job as any)?.createdBy,
      (job as any)?.created_by,
      (job as any)?.employerId,
      (job as any)?.employer_id,
      (job as any)?.postedBy,
      (job as any)?.posted_by,
    ].filter(Boolean)

    if (userIdentifiers.length > 0 && jobOwnerIdentifiers.some((id) => userIdentifiers.includes(id))) {
      return true
    }

    if (user.companyId && job.companyId && user.companyId === job.companyId) {
      return true
    }

    return false
  }, [isEmployerAccount, user, job])

  const handleApply = async () => {
    if (!user) {
      setShowAuthDialog(true)
      return
    }

    if (isOwnJob) {
      toast.error('You cannot apply to a job you posted.')
      return
    }

    // CRITICAL: Prevent applying if application deadline has passed
    const deadline = (job as any)?.applicationDeadline
    if (deadline && new Date() > new Date(deadline)) {
      toast.error('Application deadline has passed for this job')
      return
    }

    // Prevent applying if job is expired by validTill
    try {
      const publicJob = await apiService.getGulfJobById(jobIdFromParams)
      const vt = (publicJob?.data as any)?.validTill
      if (vt && new Date() > new Date(vt)) {
        toast.error('Applications are closed for this job (expired)')
        return
      }
    } catch {}

    // For sample jobs, handle directly
      if (jobIdFromParams.startsWith('550e8400')) {
        sampleJobManager.addApplication({
          jobId: jobIdFromParams,
          jobTitle: job?.title || 'Job',
          companyName: typeof job?.company === 'string' ? job?.company : (job?.company?.name || 'Company'),
          location: job?.location || '',
          salary: job?.salary || '',
          type: job?.type || ''
        })
        toast.success(`Application submitted successfully${job?.title ? ` for ${job.title}` : ''}!`)
        setForceUpdate(prev => !prev)
        return
      }

    // For real jobs, open the application dialog
    setShowApplicationDialog(true)
  }

  const handleExternalApply = () => {
    if (!job) {
      return
    }
    if (isOwnJob) {
      toast.error('You cannot apply to a job you posted.')
      return
    }
    if (!user) {
      setShowAuthDialog(true)
      return
    }
    window.open(job.externalApplyUrl, '_blank')
  }

  const handleApplicationSuccess = () => {
        setForceUpdate(prev => !prev)
  }

  const isExpired = (() => {
    const vt = (job as any)?.validTill
    const deadline = (job as any)?.applicationDeadline
    const now = new Date()
    
    // Check validTill first (existing logic)
    if (vt && now > new Date(vt)) return true
    
    // Check applicationDeadline
    if (deadline && now > new Date(deadline)) return true
    
    return false
  })()

  const handleShare = (platform: string) => {
    const jobUrl = `${window.location.origin}/gulf-jobs/${jobIdFromParams}`
    const shareText = `Check out this ${job?.title || 'job'} position${job?.company ? ` at ${typeof job.company === 'string' ? job.company : job.company?.name}` : ''}!`

    switch (platform) {
      case "link":
        navigator.clipboard.writeText(jobUrl)
        break
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${jobUrl}`)}`)
        break
      case "email":
        window.open(`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(jobUrl)}`)
        break
    }
  }

  const handleBackNavigation = () => {
    const referrer = document.referrer
    if (referrer.includes(`/gulf-companies/${job?.companyId}/departments/`)) {
      router.back()
    } else {
      router.push("/gulf-jobs")
    }
  }

  if (jobLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <GulfNavbar />
        <div className="pt-16 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-40 animate-pulse bg-white/60 dark:bg-slate-800/60 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <GulfNavbar />
        <div className="pt-16 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Job Not Found</h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                The job you're looking for doesn't exist or has been removed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => router.push('/jobs')} className="bg-emerald-600 hover:bg-emerald-700">
                  Browse All Jobs
                </Button>
                <Button variant="outline" onClick={() => router.back()}>
                  Go Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <GulfNavbar />

      <div className="pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4"
          >
            <Button
              variant="ghost"
              className="text-slate-600 dark:text-slate-400 hover:text-emerald-600"
              onClick={handleBackNavigation}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Job Header */}
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-16 h-16 ring-2 ring-white/50">
                          <AvatarImage src={job?.companyLogo || "/placeholder.svg"} alt={typeof job?.company === 'string' ? job?.company : (job?.company?.name || 'Company')} />
                          <AvatarFallback className="text-xl font-bold text-emerald-600">{(typeof job?.company === 'string' ? job?.company : job?.company?.name || 'C')[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{job?.title || 'Job'}</h1>
                          <div className="flex items-center gap-2 flex-wrap mb-3">
                          {job?.company && (
                            <Link
                              href={`/gulf-companies/${job?.companyId || ''}`}
                                className="text-xl text-emerald-600 hover:text-blue-700 font-medium"
                            >
                              {typeof job.company === 'string' ? job.company : job.company?.name}
                            </Link>
                          )}
                            {job?.isConsultancy && job?.consultancyName && (
                              <Badge variant="outline" className="text-sm bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700">
                                Posted by {job.consultancyName}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 mb-4">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="font-semibold">{job?.companyRating || 0}</span>
                            <span className="text-slate-500 text-sm">({job?.companyReviews || 0} reviews)</span>
                          </div>
                          <div className="flex items-center space-x-2 mb-4">
                            {job?.isHotVacancy && (
                              <Badge className="bg-red-100 text-red-800 border-red-200 animate-pulse">
                                🔥 Hot Vacancy
                              </Badge>
                            )}
                            {job?.urgentHiring && (
                              <Badge className="bg-red-100 text-red-800 border-red-200 animate-pulse">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                URGENT HIRING
                              </Badge>
                            )}
                            {job?.superFeatured && (
                              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                <Star className="w-3 h-3 mr-1" />
                                Super Featured
                              </Badge>
                            )}
                            {job?.boostedSearch && (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                <Zap className="w-3 h-3 mr-1" />
                                Boosted
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsBookmarked(!isBookmarked)}
                          className={`${isBookmarked ? "bg-blue-50 border-blue-200 text-emerald-600" : ""}`}
                        >
                          <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked ? "fill-current" : ""}`} />
                          {isBookmarked ? "Saved" : "Save"}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Share2 className="w-4 h-4 mr-2" />
                              Share
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleShare("link")}>
                              <LinkIcon className="w-4 h-4 mr-2" />
                              Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare("whatsapp")}>
                              <MessageCircle className="w-4 h-4 mr-2" />
                              WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare("email")}>
                              <Mail className="w-4 h-4 mr-2" />
                              Email
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="flex items-center text-slate-600 dark:text-slate-300">
                        <MapPin className="w-5 h-5 mr-2 text-slate-400" />
                        <div>
                          <div className="font-medium">{job?.location || '—'}</div>
                          {job?.remote && <div className="text-sm text-green-600">Remote Available</div>}
                        </div>
                      </div>
                      <div className="flex items-center text-slate-600 dark:text-slate-300">
                        <Briefcase className="w-5 h-5 mr-2 text-slate-400" />
                        <div>
                          <div className="font-medium">{job?.experience || '—'}</div>
                          <div className="text-sm text-slate-500">{job?.type || '—'}</div>
                        </div>
                      </div>
                      <div className="flex items-center text-slate-600 dark:text-slate-300">
                        <DollarSign className="w-5 h-5 mr-2 text-slate-400" />
                        <div>
                          <div className="font-medium">{job?.salary || '—'}</div>
                          <div className="text-sm text-slate-500">AED</div>
                        </div>
                      </div>
                      <div className="flex items-center text-slate-600 dark:text-slate-300">
                        <Clock className="w-5 h-5 mr-2 text-slate-400" />
                        <div>
                          <div className="font-medium">{job?.posted || '—'}</div>
                          <div className="text-sm text-slate-500">{job?.applicants || 0} applicants</div>
                        </div>
                      </div>
                      {isExpired && (
                        <div className="flex items-center">
                          <Badge className="bg-red-100 text-red-800 border-red-200">Expired</Badge>
                        </div>
                      )}
                    </div>

                    {/* Internship-specific information */}
                    {job?.type?.toLowerCase() === 'internship' && (job?.duration || job?.startDate || job?.workMode || job?.learningObjectives || job?.mentorship) && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                        <div className="flex items-center space-x-2 mb-4">
                          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                            <Briefcase className="w-4 h-4 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Internship Details</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {job?.duration && (
                            <div className="flex items-center text-blue-800 dark:text-blue-200">
                              <Clock className="w-4 h-4 mr-2" />
                              <div>
                                <div className="font-medium">Duration</div>
                                <div className="text-sm">{job.duration}</div>
                              </div>
                            </div>
                          )}
                          
                          {job?.startDate && (
                            <div className="flex items-center text-blue-800 dark:text-blue-200">
                              <Calendar className="w-4 h-4 mr-2" />
                              <div>
                                <div className="font-medium">Start Date</div>
                                <div className="text-sm">{new Date(job.startDate).toLocaleDateString()}</div>
                              </div>
                            </div>
                          )}
                          
                          {job?.workMode && (
                            <div className="flex items-center text-blue-800 dark:text-blue-200">
                              <MapPin className="w-4 h-4 mr-2" />
                              <div>
                                <div className="font-medium">Work Mode</div>
                                <div className="text-sm capitalize">{job.workMode.replace('-', ' ')}</div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {job?.learningObjectives && (
                          <div className="mt-4">
                            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What You'll Learn</h4>
                            <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">{job.learningObjectives}</p>
                          </div>
                        )}
                        
                        {job?.mentorship && (
                          <div className="mt-4">
                            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Mentorship & Support</h4>
                            <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">{job.mentorship}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {Array.isArray(job?.skills) && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {job.skills.map((skill: string, index: number) => (
                          <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {isExpired && (
                      <div className="w-full mb-3 text-center text-red-600 font-medium">
                        {(() => {
                          const vt = (job as any)?.validTill
                          const deadline = (job as any)?.applicationDeadline
                          const now = new Date()
                          
                          if (deadline && now > new Date(deadline)) {
                            return `Application deadline passed (${new Date(deadline).toLocaleDateString()})`
                          }
                          if (vt && now > new Date(vt)) {
                            return `Job expired (${new Date(vt).toLocaleDateString()})`
                          }
                          return 'Applications closed'
                        })()}
                      </div>
                    )}
                    <Button
                      onClick={job?.externalApplyUrl ? handleExternalApply : handleApply}
                      className={`w-full ${
                        hasApplied
                          ? 'bg-green-600 hover:bg-green-700 cursor-default'
                          : isOwnJob
                            ? 'bg-gray-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-not-allowed'
                          : isExpired
                            ? 'bg-gray-400 cursor-not-allowed'
                            : job?.isHotVacancy
                              ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700'
                              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-blue-700 hover:to-indigo-700'
                      }`}
                      disabled={hasApplied || isExpired || isOwnJob}
                    >
                      {hasApplied ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Applied
                        </>
                      ) : isOwnJob ? (
                        <>
                          <AlertCircle className="w-4 h-4 mr-2" />
                          You posted this job
                        </>
                      ) : job?.externalApplyUrl ? (
                        <>
                          🔥 Apply on Company Website
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      ) : isExpired ? (
                        (() => {
                          const deadline = (job as any)?.applicationDeadline;
                          const vt = (job as any)?.validTill;
                          const now = new Date();
                          if (deadline && now > new Date(deadline)) {
                            return 'Application Deadline Passed';
                          }
                          if (vt && now > new Date(vt)) {
                            return 'Application Closed';
                          }
                          return 'Application Closed';
                        })()
                      ) : (
                        job?.isHotVacancy ? '🔥 Apply to Hot Vacancy' : 'Apply Now'
                      )}
                    </Button>

                    {/* External Application Warning */}
                    {job?.externalApplyUrl && !hasApplied && (
                      <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-yellow-800 dark:text-yellow-200">
                            <strong className="font-semibold">Note:</strong> You'll be redirected to the company's external career portal. 
                            Your application will be managed by the employer on their platform.
                          </div>
                        </div>
                      </div>
                    )}

                    {isOwnJob && (
                      <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-emerald-800 dark:text-emerald-200">
                            This posting belongs to your employer account. To manage applications, go back to the employer dashboard.
                          </div>
                        </div>
                      </div>
                    )}

                    {hasApplied && (
                      <Button
                        onClick={() => {
                          if (sampleJobManager.removeApplication(jobIdFromParams)) {
                            toast.success('Application withdrawn successfully')
                            setForceUpdate(prev => !prev)
                          } else {
                            toast.error('Failed to withdraw application')
                          }
                        }}
                        variant="outline"
                        className="w-full mt-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-700"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Withdraw Application
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Comprehensive Job Details */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6 }}
              >
                <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-2xl">Job Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-4 h-4 text-emerald-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">Role</div>
                            <div className="text-slate-600 dark:text-slate-400 capitalize">
                              {job?.role || job?.title || 'Not provided'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">Industry Type</div>
                            <div className="text-slate-600 dark:text-slate-400 capitalize">
                              {(job?.companyInfo?.industry || job?.industry || 'Not provided').replace(/\s*\(\d+\)\s*$/, '')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">Department</div>
                            <div className="text-slate-600 dark:text-slate-400 capitalize">
                              {job?.department || 'Not provided'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">Employment Type</div>
                            <div className="text-slate-600 dark:text-slate-400 capitalize">
                              {job?.employmentType || job?.type ? `${(job?.employmentType || job.type).replace('-', ' ')}${job?.remoteWork ? `, ${job.remoteWork}` : ''}` : 'Not provided'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Star className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">Role Category</div>
                            <div className="text-slate-600 dark:text-slate-400 capitalize">
                              {job?.roleCategory || job?.category || job?.department || 'Not provided'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Award className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 dark:text-slate-100">Experience Level</div>
                            <div className="text-slate-600 dark:text-slate-400 capitalize">
                              {(() => {
                                const exp = job?.experienceLevel || job?.experience || 'Not specified';
                                if (exp === 'fresher' || exp === 'entry') return 'Fresher (0-1 years)';
                                if (exp === 'junior') return 'Junior (1-3 years)';
                                if (exp === 'mid') return 'Mid-level (3-5 years)';
                                if (exp === 'senior') return 'Senior (5+ years)';
                                if (exp === 'lead') return 'Lead (7+ years)';
                                if (exp === 'executive') return 'Executive (10+ years)';
                                return exp;
                              })()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 dark:text-slate-100 mb-2">Education</div>
                            {Array.isArray(job?.education) && job.education.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {job.education.map((edu: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {edu}
                                  </Badge>
                                ))}
                            </div>
                            ) : (
                              <div className="text-slate-600 dark:text-slate-400">Any Graduate</div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">Location</div>
                            <div className="text-slate-600 dark:text-slate-400">
                              {job?.location || 'Not provided'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Key Skills Section */}
                    {job?.skills && job.skills.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center space-x-2 mb-4">
                          <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                            <Zap className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Key Skills</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {job.skills.map((skill: string, index: number) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="px-3 py-1 text-sm bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Video Banner */}
              {job?.videoBanner && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.6 }}
                >
                  <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <Video className="h-6 w-6 text-red-600" />
                        Company Video
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {job.videoBanner.includes('youtube.com') || job.videoBanner.includes('youtu.be') ? (
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                          <iframe
                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                            src={`https://www.youtube.com/embed/${
                              job.videoBanner.includes('youtu.be') 
                                ? job.videoBanner.split('youtu.be/')[1]?.split('?')[0]
                                : job.videoBanner.split('v=')[1]?.split('&')[0]
                            }`}
                            title="Company Video"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : job.videoBanner.endsWith('.mp4') || job.videoBanner.endsWith('.webm') ? (
                        <video 
                          className="w-full rounded-lg" 
                          controls
                          preload="metadata"
                        >
                          <source src={job.videoBanner} type={`video/${job.videoBanner.split('.').pop()}`} />
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <div className="text-center p-6">
                          <a 
                            href={job.videoBanner} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-blue-700 underline flex items-center justify-center gap-2"
                          >
                            <Video className="h-5 w-5" />
                            Watch Company Video
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Why Work With Us - MOVED UP FOR PROMINENCE */}
              {job?.whyWorkWithUs && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, duration: 0.6 }}
                >
                  <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-purple-600" />
                        Why Work With Us
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-slate dark:prose-invert max-w-none">
                        <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line text-lg">
                          {job.whyWorkWithUs}
                        </div>
                      </div>
                      
                      {/* Company Branding Section */}
                      <div className="mt-6 pt-6 border-t border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-4">
                          {job.companyLogo && (
                            <img 
                              src={job.companyLogo} 
                              alt={job.company}
                              className="h-16 w-16 object-contain rounded-lg bg-white p-2"
                            />
                          )}
                          <div>
                            <h4 className="font-semibold text-lg text-purple-900 dark:text-purple-100">
                              {job.company}
                            </h4>
                            {job.industry && (
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {job.industry}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Company Branding Media - Hot Vacancy Feature */}
              {(Array.isArray(job?.brandingMedia) && job.brandingMedia.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <Video className="h-6 w-6 text-indigo-600" />
                        Company Branding & Culture
                        {job?.isHotVacancy && (
                          <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-700 border-yellow-300">
                            Hot Vacancy Feature
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {job.brandingMedia.map((media: any, index: number) => {
                          const previewUrl = media.preview || media.url || media;
                          const isVideo = media.type === 'video' || previewUrl.includes('.mp4') || previewUrl.includes('.webm') || previewUrl.includes('.mov');
                          
                          return (
                            <div key={index} className="relative group rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                              {isVideo ? (
                                <video
                                  src={previewUrl}
                                  className="w-full h-64 object-cover"
                                  controls
                                  preload="metadata"
                                />
                              ) : (
                                <img
                                  src={previewUrl}
                                  alt={`Company branding ${index + 1}`}
                                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    console.error('Failed to load branding media:', previewUrl);
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <div className="absolute top-2 left-2">
                                <Badge variant="secondary" className="bg-white/90 backdrop-blur">
                                  {isVideo ? '🎥 Video' : '📸 Photo'}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
              
              {/* Fallback: Display officeImages if brandingMedia is not available */}
              {(Array.isArray(job?.officeImages) && job.officeImages.length > 0 && (!Array.isArray(job?.brandingMedia) || job.brandingMedia.length === 0)) && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-indigo-600" />
                        Office Photos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {job.officeImages.map((media: any, index: number) => (
                          <div key={index} className="relative group rounded-lg overflow-hidden shadow-lg">
                            {typeof media === 'string' && (media.endsWith('.mp4') || media.endsWith('.webm')) ? (
                              <video
                                src={media}
                                className="w-full h-64 object-cover"
                                controls
                                preload="metadata"
                              />
                            ) : (
                              <img
                                src={typeof media === 'string' ? media : media.url}
                                alt={`Office photo ${index + 1}`}
                                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            )}
                            <div className="absolute top-2 left-2">
                              <Badge variant="secondary" className="bg-white/90 backdrop-blur">
                                {typeof media === 'string' && (media.endsWith('.mp4') || media.endsWith('.webm')) ? '🎥 Video' : '📸 Photo'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Job Description */}
              {job?.description && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.6 }}
                >
                  <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-2xl">Job Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-slate dark:prose-invert max-w-none">
                        <div className="whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed">
                          {job.description}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Agency Posted Job Alert */}
              {job?.isAgencyPosted && job?.PostedByAgency && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <Card className="border-blue-200 bg-blue-50/80 dark:bg-blue-900/20 dark:border-blue-800 backdrop-blur-xl shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-blue-900 dark:text-blue-100">
                        <Building2 className="h-5 w-5 text-emerald-600" />
                        Posted by Recruiting Agency
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            {job.PostedByAgency.logo ? (
                              <img
                                src={job.PostedByAgency.logo}
                                alt={job.PostedByAgency.name}
                                className="w-16 h-16 rounded-lg object-cover border-2 border-blue-200 dark:border-blue-700"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-blue-100 dark:bg-blue-800 flex items-center justify-center border-2 border-blue-200 dark:border-blue-700">
                                <Building2 className="w-8 h-8 text-emerald-600 dark:text-blue-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-lg">
                              {job.PostedByAgency.name}
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                              {job.PostedByAgency.industry} • {job.PostedByAgency.city}
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-200 mt-3 leading-relaxed">
                              This job is posted by <strong>{job.PostedByAgency.name}</strong> on behalf of{" "}
                              <strong>{job.HiringCompany?.name || job.Company?.name}</strong>.
                              Applications will be managed by the recruiting agency.
                            </p>
                            {job.agencyDescription && (
                              <p className="text-sm text-blue-700 dark:text-blue-300 mt-2 italic">
                                "{job.agencyDescription}"
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="bg-blue-100/50 dark:bg-blue-800/30 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                          <p className="text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            <span>
                              The hiring company ({job.HiringCompany?.name || job.Company?.name}) has authorized this agency to recruit on their behalf.
                            </span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Hot Vacancy Premium Features */}
              {job?.isHotVacancy && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <Card className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-xl shadow-xl border-blue-200 dark:border-blue-800">
                    <CardHeader>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-emerald-600" />
                        {job?.isConsultancy && job?.showHiringCompanyDetails ? 'About the Hiring Company' : 'About the Company'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Consultancy Job Badge */}
                        {job?.isConsultancy && (
                          <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Building2 className="w-5 h-5 text-purple-600" />
                              <span className="font-semibold text-purple-900 dark:text-purple-100">Consultancy Job</span>
                            </div>
                            <p className="text-sm text-purple-800 dark:text-purple-200">
                              Posted by: <span className="font-medium">{job.consultancyName}</span>
                            </p>
                            {!job.showHiringCompanyDetails && (
                              <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
                                Hiring company details are confidential
                              </p>
                            )}
                          </div>
                        )}

                        {/* Company Description */}
                        {job?.aboutCompany && (
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                              {job?.isConsultancy && job?.showHiringCompanyDetails ? 'Hiring Company Overview' : 'Company Overview'}
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                              {job.aboutCompany}
                            </p>
                          </div>
                        )}
                        
                        {job?.companyProfile && (
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Company Profile</h4>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                              {job.companyProfile}
                            </p>
                          </div>
                        )}
                        
                        {Array.isArray(job?.companyReviews) && job.companyReviews.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-500" />
                              Company Reviews
                            </h4>
                            <div className="space-y-3">
                              {job.companyReviews.map((review: string, index: number) => (
                                <div key={index} className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee Review</span>
                                  </div>
                                  <p className="text-gray-700 dark:text-gray-300 italic">"{review}"</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {job?.proactiveAlerts && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <Zap className="w-5 h-5 text-green-600" />
                              <span className="text-sm font-medium text-green-800 dark:text-green-200">Proactive Candidate Alerts</span>
                            </div>
                          )}
                          {job?.boostedSearch && (
                            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <Zap className="w-5 h-5 text-emerald-600" />
                              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Boosted Search Visibility</span>
                            </div>
                          )}
                          {job?.urgentHiring && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <AlertCircle className="w-5 h-5 text-red-600" />
                              <span className="text-sm font-medium text-red-800 dark:text-red-200">Urgent Hiring Priority</span>
                            </div>
                          )}
                          {job?.superFeatured && (
                            <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                              <Star className="w-5 h-5 text-purple-600" />
                              <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Super Featured Status</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Requirements */}
              {Array.isArray(job?.requirements) && job.requirements.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-2xl">Requirements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {job.requirements.map((req: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700 dark:text-slate-300">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Benefits */}
              {Array.isArray(job?.benefits) && job.benefits.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-2xl">Benefits & Perks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {job.benefits.map((benefit: string, index: number) => (
                          <div key={index} className="flex items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <Award className="w-5 h-5 text-emerald-600 mr-3" />
                            <span className="text-slate-700 dark:text-slate-300">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Job Photos */}
              {Array.isArray(job?.photos) && job.photos.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-2xl">Workplace Photos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {job.photos.map((photo: any, index: number) => {
                          console.log('📸 Rendering jobseeker photo:', photo);
                          return (
                          <div key={photo.id || index} className="relative group">
                            <img
                              src={photo.fileUrl}
                              alt={photo.altText || `Workplace photo ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-shadow duration-300"
                              onLoad={() => console.log('✅ Jobseeker image loaded successfully:', photo.fileUrl)}
                              onError={(e) => {
                                console.error('❌ Jobseeker image failed to load:', photo.fileUrl, e);
                                console.log('🔄 Retrying jobseeker image load in 1 second...');
                                setTimeout(() => {
                                  e.currentTarget.src = photo.fileUrl + '?t=' + Date.now();
                                }, 1000);
                              }}
                            />
                            {photo.caption && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 rounded-b-lg">
                                <p className="text-sm">{photo.caption}</p>
                              </div>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Company Info */}
              {job?.aboutCompany && (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                      <CardTitle>About {typeof job.company === 'string' ? job.company : job.company?.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{job.aboutCompany}</p>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Industry</span>
                          <span className="font-medium">{job.industry?.replace(/\s*\(\d+\)\s*$/, '') || job.industry}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Company Size</span>
                          <span className="font-medium">{job.companySize}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Website</span>
                          <span className="font-medium text-emerald-600">{job.website}</span>
                        </div>
                      </div>
                      {/* Only show View Company Profile for direct company jobs with existing company profiles */}
                      {!job?.isConsultancy && job?.companyId && (
                      <Link href={`/gulf-companies/${job.companyId || ''}`}>
                        <Button variant="outline" className="w-full bg-transparent">
                          <Building2 className="w-4 h-4 mr-2" />
                          View Company Profile
                        </Button>
                      </Link>
                      )}
                      
                      {/* For consultancy jobs, show different messaging */}
                      {job?.isConsultancy && (
                        <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <Building2 className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Company profile managed by {job.consultancyName}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Application Tips */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-xl shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-blue-700 dark:text-blue-300">Application Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-emerald-600 mr-3 mt-0.5" />
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          Tailor your resume to highlight relevant experience
                        </div>
                      </div>
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-emerald-600 mr-3 mt-0.5" />
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          Include a compelling cover letter
                        </div>
                      </div>
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-emerald-600 mr-3 mt-0.5" />
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          Research the company culture and values
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Similar Jobs - Ultra Advanced */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span>Similar Jobs</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          AI-Powered
                        </Badge>
                      </div>
                      {similarJobs.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {similarJobs.length}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {similarJobsLoading ? (
                    <div className="space-y-4">
                      {[1,2,3].map((n) => (
                          <div key={n} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg animate-pulse">
                            <div className="flex items-start space-x-3">
                              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-600 rounded-lg flex-shrink-0" />
                              <div className="flex-1 space-y-2">
                                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-600 rounded" />
                                <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-600 rounded" />
                                <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-600 rounded" />
                              </div>
                            </div>
                        </div>
                      ))}
                    </div>
                    ) : similarJobs.length > 0 ? (
                      <div className="space-y-4">
                        {similarJobs.map((similarJob, index) => (
                          <Link 
                            key={`${similarJob.id}-${index}`} 
                            href={`/gulf-jobs/${similarJob.id}`}
                            className="block group"
                          >
                            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-blue-400 transition-colors">
                                    {similarJob.title}
                                  </h4>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-1">
                                    {typeof similarJob.company === 'string' 
                                      ? similarJob.company 
                                      : (similarJob.company?.name || 'Company')}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end space-y-1 ml-2">
                                  {similarJob.isFeatured && (
                                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                                      Featured
                                    </Badge>
                                  )}
                                  {similarJob.isPremium && (
                                    <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                                      Premium
                                    </Badge>
                                  )}
                                  {similarJob.similarityScore && 
                                   !isNaN(parseFloat(similarJob.similarityScore)) && 
                                   parseFloat(similarJob.similarityScore) > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      {Math.round(parseFloat(similarJob.similarityScore))}% match
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                                <div className="flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  <span className="line-clamp-1">{similarJob.location}</span>
                                </div>
                                <div className="flex items-center">
                                  <Briefcase className="w-3 h-3 mr-1" />
                                  <span className="capitalize">{similarJob.type?.replace('-', ' ')}</span>
                                </div>
                                {similarJob.experienceLevel && (
                                  <div className="flex items-center">
                                    <Award className="w-3 h-3 mr-1" />
                                    <span className="capitalize">{similarJob.experienceLevel}</span>
                                  </div>
                                )}
                              </div>
                              
                              {similarJob.salary && similarJob.salary !== 'Salary not disclosed' && (
                                <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                                  {similarJob.salary}
                                </div>
                              )}
                              
                              {similarJob.skills && similarJob.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {similarJob.skills.slice(0, 3).map((skill: string, skillIndex: number) => (
                                    <Badge key={skillIndex} variant="secondary" className="text-xs px-2 py-0.5">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {similarJob.skills.length > 3 && (
                                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                      +{similarJob.skills.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>Posted {similarJob.posted || 'Recently'}</span>
                                <div className="flex items-center space-x-2">
                                  {similarJob.views && typeof similarJob.views === 'number' && similarJob.views > 0 && (
                                    <span>{similarJob.views} views</span>
                                  )}
                                  {similarJob.applications && typeof similarJob.applications === 'number' && similarJob.applications > 0 && (
                                    <span>{similarJob.applications} applications</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                        
                        {/* Show More Button with Enhanced Filtering */}
                        <Button 
                          onClick={() => {
                            try {
                              // Build comprehensive filter params based on current job
                              const params = new URLSearchParams()
                              
                              // Location filtering
                              if (job?.location) {
                                const locationParts = job.location.split(',')
                                if (locationParts.length > 0) {
                                  params.append('location', locationParts[0].trim())
                                }
                              }
                              
                              // Job type filtering
                              if (job?.type) {
                                params.append('jobType', job.type)
                              }
                              
                              // Experience level filtering
                              if (job?.experienceLevel) {
                                params.append('experienceLevel', job.experienceLevel)
                              }
                              
                              // Department filtering
                              if (job?.department) {
                                params.append('department', job.department)
                              }
                              
                              // Skills filtering (if available)
                              if (job?.skills && Array.isArray(job.skills) && job.skills.length > 0) {
                                params.append('skills', job.skills.slice(0, 3).join(','))
                              }
                              
                              // Industry filtering (if available)
                              if (job?.companyInfo?.industry) {
                                params.append('industry', job.companyInfo.industry)
                              }
                              
                              // Add a flag to indicate this is from similar jobs
                              params.append('fromSimilar', 'true')
                              
                              const queryString = params.toString()
                              console.log('🔍 Navigating to jobs with filters:', queryString)
                              
                              router.push(`/jobs?${queryString}`)
                            } catch (error) {
                              console.error('❌ Error building filter params:', error)
                              // Fallback to basic jobs page
                              router.push('/jobs')
                            }
                          }}
                          variant="outline" 
                          className="w-full mt-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200"
                        >
                          <span className="flex items-center justify-center">
                            Show More Similar Jobs
                            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                          </span>
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                          <Briefcase className="w-8 h-8 opacity-50" />
                        </div>
                        <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                          No Similar Jobs Found
                        </h3>
                        <p className="text-sm mb-4">
                          We couldn't find similar jobs at the moment. Try browsing all available positions.
                        </p>
                        <div className="space-y-2">
                          <Button 
                            onClick={() => router.push('/jobs')}
                            className="w-full"
                          >
                            Browse All Jobs
                          </Button>
                          <Button 
                            onClick={() => {
                              // Try to reload similar jobs
                              window.location.reload()
                            }}
                            variant="outline" 
                            className="w-full"
                          >
                            Try Again
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You need to be logged in to apply for jobs. Please register or login to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-3 mt-6">
            <Link href="/register" className="w-full">
              <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-blue-700 hover:to-indigo-700">
                Register Now
              </Button>
            </Link>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full bg-transparent">
                Login
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Application Dialog with Resume Selection */}
      {job && (
        <JobApplicationDialog
          isOpen={showApplicationDialog}
          onClose={() => setShowApplicationDialog(false)}
          job={{
            id: job.id,
            title: job.title,
            company: {
              name: typeof job.company === 'string' ? job.company : (job.company?.name || 'Company')
            },
            location: job.location
          }}
          onSuccess={handleApplicationSuccess}
          isGulfJob={true}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl text-white py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">JobPortal</span>
              </div>
              <p className="text-slate-400 mb-6">India's leading job portal connecting talent with opportunities.</p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors cursor-pointer">
                  <span className="text-sm">f</span>
                </div>
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors cursor-pointer">
                  <span className="text-sm">t</span>
                </div>
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-colors cursor-pointer">
                  <span className="text-sm">in</span>
                </div>
              </div>
            </div>

            {[
              {
                title: "For Job Seekers",
                links: ["Browse Jobs", "Career Advice", "Resume Builder", "Salary Guide"],
              },
              {
                title: "For Employers",
                links: ["Post Jobs", "Search Resumes", "Recruitment Solutions", "Pricing"],
              },
              {
                title: "Company",
                links: ["About Us", "Contact", "Privacy Policy", "Terms of Service"],
              },
            ].map((section, index) => (
              <div key={index}>
                <h3 className="font-semibold mb-6 text-lg">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link href="#" className="text-slate-400 hover:text-white transition-colors hover:underline">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
            <p>&copy; 2025 JobPortal. All rights reserved. Made with ❤️ in India</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
