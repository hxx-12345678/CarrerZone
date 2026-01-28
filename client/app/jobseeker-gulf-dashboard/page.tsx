"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, 
  FileText, 
  Building2, 
  Bell, 
  Settings, 
  LogOut,
  Search,
  TrendingUp,
  Bookmark,
  X,
  Upload,
  RefreshCw,
  Star,
  ThumbsUp,
  Calendar,
  Globe,
  DollarSign,
  MapPin,
  ArrowRight,
  Briefcase
} from 'lucide-react'
import GulfNavbar from '@/components/gulf-navbar'
import { toast } from 'sonner'
import { apiService, Resume, JobBookmark, JobAlert, CoverLetter } from '@/lib/api'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RecentNotifications } from '@/components/recent-notifications'
import { GulfJobseekerAuthGuard } from '@/components/gulf-jobseeker-auth-guard'
import { JobseekerProfileCompletionDialog } from '@/components/profile-completion-dialog'

export default function JobseekerGulfDashboardPage() {
  const { user, loading, logout, refreshUser, debouncedRefreshUser } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [bookmarks, setBookmarks] = useState<JobBookmark[]>([])
  const [bookmarksLoading, setBookmarksLoading] = useState(true)
  const [jobAlerts, setJobAlerts] = useState<JobAlert[]>([])
  const [jobAlertsLoading, setJobAlertsLoading] = useState(true)
  const [showResumeModal, setShowResumeModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(true)
  const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([])
  const [interviewsLoading, setInterviewsLoading] = useState(true)
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [coverLettersLoading, setCoverLettersLoading] = useState(true)
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false)
  const [coverLetterUploading, setCoverLetterUploading] = useState(false)
  const coverLetterFileInputRef = useRef<HTMLInputElement>(null)
  const [showCoverLetterSelect, setShowCoverLetterSelect] = useState(false)
  const [showProfileCompletion, setShowProfileCompletion] = useState(false)
  const [profileCheckDone, setProfileCheckDone] = useState(false)

  // Dynamic Gulf jobs data
  const [gulfJobs, setGulfJobs] = useState<any[]>([])
  const [gulfJobsLoading, setGulfJobsLoading] = useState(true)
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set())

  // Fetch applied jobs for logged in users
  const fetchAppliedJobs = async () => {
    if (!user) return
    
    try {
      const response = await apiService.getGulfJobApplications()
      if (response.success && response.data) {
        const applications = response.data.applications || []
        const appliedJobIds = new Set(applications.map((app: any) => app.jobId || app.job?.id))
        setAppliedJobs(appliedJobIds)
      }
    } catch (error) {
      console.error('Error fetching applied jobs:', error)
    }
  }

  useEffect(() => {
    if (loading) return;
    if (user) {
      if (user.userType === 'employer' || user.userType === 'admin') {
        console.log('🔄 Employer/Admin detected on Gulf jobseeker dashboard, redirecting to employer dashboard')
        router.replace('/gulf-dashboard')
      }
      return;
    }
    // No user yet
    if (typeof window !== 'undefined' && apiService.isAuthenticated()) {
      // Token present; avoid redirecting to login while profile is loading
      return;
    }
    router.replace('/gulf-opportunities')
  }, [user, loading, router])

  // Check profile completion separately (runs on every user update)
  useEffect(() => {
    if (user && !loading && !profileCheckDone) {
      // Check if profile is incomplete and show completion dialog
      const isIncomplete = () => {
        // Check if user has marked profile as complete
        if (user.preferences?.profileCompleted === true) {
          return false
        }
        
        // Check if user has skipped and the skip period hasn't expired
        if (user.preferences?.profileCompletionSkippedUntil) {
          const skipUntil = new Date(user.preferences.profileCompletionSkippedUntil)
          const skipSession = user.preferences?.profileCompletionSkipSession
          const currentSession = user.lastLoginAt
          const now = new Date()
          
          // Only honor skip if it's the SAME login session
          if (skipSession === currentSession && skipUntil > now) {
            console.log('⏰ Profile completion skipped until:', skipUntil, '(same session)')
            return false // Don't show dialog yet
          } else if (skipSession !== currentSession) {
            console.log('🔄 New login session detected - showing popup again')
          }
        }
        
        // Required fields for jobseeker
        return !user.phone || 
               !user.currentLocation || 
               !user.headline || 
               (user.experienceYears === undefined || user.experienceYears === null) ||
               !(user as any).gender ||
               !(user as any).dateOfBirth
      }
      
      const incomplete = isIncomplete()
      console.log('🔍 Gulf jobseeker profile completion check:', { incomplete, user: { phone: user.phone, location: user.currentLocation, headline: user.headline } })
      
      if (incomplete) {
        // Show dialog after a short delay to avoid UI conflicts
        const timeoutId = setTimeout(() => {
          console.log('✅ Showing Gulf jobseeker profile completion dialog')
          setShowProfileCompletion(true)
        }, 1000)
        return () => clearTimeout(timeoutId)
      } else {
        setShowProfileCompletion(false)
      }
      setProfileCheckDone(true)
    }
  }, [user, loading, profileCheckDone])
  
  // Reset profile check when user updates (after skip or completion)
  useEffect(() => {
    if (user) {
      setProfileCheckDone(false)
    }
  }, [user])

  useEffect(() => {
    if (user && !loading) {
      setCurrentUser(user)
      fetchDashboardStats()
      fetchResumes()
      fetchBookmarks()
      fetchJobAlerts()
      fetchApplications()
      fetchCoverLetters()
      fetchInterviews()
      fetchGulfJobs()
    }
  }, [user, loading])

  // Refresh user data when component mounts to ensure we have the latest data
  useEffect(() => {
    if (!loading && user) {
      debouncedRefreshUser()
    }
  }, [loading, user, debouncedRefreshUser])

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true)
      const response = await apiService.getGulfDashboardStats()
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Error fetching Gulf dashboard stats:', error)
      toast.error('Failed to load Gulf dashboard stats')
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchApplications = async () => {
    try {
      setApplicationsLoading(true)
      
      // Fetch Gulf applications from API
      const response = await apiService.getGulfJobApplications()
      if (response.success && response.data) {
        const applications = response.data.applications || []
        setApplications(applications)
        
        // Update applied jobs set
        const appliedJobIds = new Set(applications.map((app: any) => app.jobId || app.job?.id))
        setAppliedJobs(appliedJobIds)
      } else {
        setApplications([])
        setAppliedJobs(new Set())
      }
    } catch (error) {
      console.error('Error fetching Gulf applications:', error)
      setApplications([])
      setAppliedJobs(new Set())
    } finally {
      setApplicationsLoading(false)
    }
  }

  const fetchInterviews = async () => {
    try {
      setInterviewsLoading(true)
      
      const response = await apiService.getCandidateInterviews('scheduled', 1, 5)
      
      if (response.success && response.data && response.data.interviews) {
        // Filter interviews to show only Gulf region jobs
        const gulfInterviews = response.data.interviews.filter((interview: any) => {
          const location = interview.jobApplication?.job?.location || ''
          return location.toLowerCase().includes('dubai') || 
                 location.toLowerCase().includes('uae') ||
                 location.toLowerCase().includes('doha') ||
                 location.toLowerCase().includes('qatar') ||
                 location.toLowerCase().includes('riyadh') ||
                 location.toLowerCase().includes('saudi') ||
                 location.toLowerCase().includes('kuwait') ||
                 location.toLowerCase().includes('bahrain') ||
                 location.toLowerCase().includes('oman') ||
                 location.toLowerCase().includes('gulf')
        })
        setUpcomingInterviews(gulfInterviews)
      } else {
        console.log('No Gulf interviews found or response format issue:', response)
        setUpcomingInterviews([])
      }
    } catch (error) {
      console.error('Error fetching Gulf interviews:', error)
      // Don't show error to user for interviews as it's not critical
      setUpcomingInterviews([])
    } finally {
      setInterviewsLoading(false)
    }
  }

  // Function to refresh dashboard data
  const refreshDashboard = async () => {
    await fetchDashboardStats()
    await fetchResumes()
    await fetchBookmarks()
    await fetchJobAlerts()
    await fetchApplications()
    await fetchCoverLetters()
    await fetchInterviews()
    await fetchGulfJobs()
    await fetchAppliedJobs()
  }

  // Listen for user changes to refresh dashboard data
  useEffect(() => {
    if (user) {
      refreshDashboard()
    }
  }, [user])

  const fetchResumes = async () => {
    try {
      const response = await apiService.getResumes()
      if (response.success && response.data) {
        setResumes(response.data)
      }
    } catch (error) {
      console.error('Error fetching resumes:', error)
    }
  }

  const fetchBookmarks = async () => {
    try {
      setBookmarksLoading(true)
      const response = await apiService.getGulfJobBookmarks()
      if (response.success && response.data) {
        setBookmarks(response.data.bookmarks || [])
      } else {
        setBookmarks([])
      }
    } catch (error) {
      console.error('Error fetching Gulf bookmarks:', error)
      setBookmarks([])
    } finally {
      setBookmarksLoading(false)
    }
  }

  const fetchJobAlerts = async () => {
    try {
      setJobAlertsLoading(true)
      const response = await apiService.getGulfJobAlerts()
      if (response.success && response.data) {
        setJobAlerts(response.data.alerts || [])
      }
    } catch (error) {
      console.error('Error fetching Gulf job alerts:', error)
    } finally {
      setJobAlertsLoading(false)
    }
  }

  const fetchCoverLetters = async () => {
    try {
      setCoverLettersLoading(true)
      const response = await apiService.getCoverLetters()
      if (response.success && response.data) {
        setCoverLetters(response.data)
      }
    } catch (error) {
      console.error('Error fetching cover letters:', error)
    } finally {
      setCoverLettersLoading(false)
    }
  }

  const fetchGulfJobs = async () => {
    try {
      setGulfJobsLoading(true)
      const response = await apiService.getGulfJobs({ limit: 6 })
      if (response.success && response.data) {
        // Transform backend jobs to match frontend format
        const transformedJobs = response.data.jobs.map((job: any) => ({
          id: job.id,
          title: job.title,
          company: job.company?.name || 'Unknown Company',
          location: job.location,
          salary: job.salary || (job.salaryMin && job.salaryMax 
            ? `${job.salaryCurrency || 'AED'} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
            : 'Competitive'),
          type: job.jobType ? job.jobType.charAt(0).toUpperCase() + job.jobType.slice(1) : 'Full-time',
          experience: job.experienceLevel || 'Not specified',
          posted: job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently',
          featured: job.isFeatured || false,
          urgent: job.urgent || false
        }))
        setGulfJobs(transformedJobs)
      } else {
        setGulfJobs([])
      }
    } catch (error) {
      console.error('Error fetching Gulf jobs:', error)
      setGulfJobs([])
    } finally {
      setGulfJobsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF, DOC, or DOCX files only.')
      return
    }

    if (file.size > maxSize) {
      toast.error('File size too large. Please upload a file smaller than 5MB.')
      return
    }

    try {
      setUploading(true)
      const response = await apiService.uploadResumeFile(file)
      if (response.success) {
        toast.success('Resume uploaded successfully!')
        fetchResumes()
        setShowResumeModal(false)
        
        if (resumes.length === 0) {
          toast.success('This resume has been set as your default resume.')
        }
      }
    } catch (error) {
      console.error('Error uploading resume:', error)
      toast.error('Failed to upload resume. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleUndoApplication = async (application: any) => {
    try {
      // Update application status to withdrawn in database
      const response = await apiService.updateApplicationStatus(application.id, 'withdrawn')
      if (response.success) {
        toast.success('Application withdrawn successfully')
        fetchApplications() // Refresh applications list
        fetchDashboardStats() // Refresh dashboard stats
        fetchAppliedJobs() // Refresh applied jobs state to update Apply Now buttons
      } else {
        toast.error(response.message || 'Failed to withdraw application')
      }
    } catch (error) {
      console.error('Error withdrawing application:', error)
      toast.error('Failed to withdraw application')
    }
  }

  const handleEditProfile = () => {
    router.push('/account')
  }

  const handleNotificationSettings = () => {
    router.push('/notifications')
  }

  const handleUploadResume = () => {
    setShowResumeModal(true)
  }

  const handleCoverLetterFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // File validation
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF, DOC, or DOCX files only.')
      return
    }

    if (file.size > maxSize) {
      toast.error('File size too large. Please upload a file smaller than 5MB.')
      return
    }

    try {
      setCoverLetterUploading(true)
      const response = await apiService.uploadCoverLetterFile(file)
      if (response.success) {
        toast.success('Cover letter uploaded successfully!')
        fetchCoverLetters()
        setShowCoverLetterModal(false)
        
        // If this is the first cover letter, show additional info
        if (coverLetters.length === 0) {
          toast.success('This cover letter has been set as your default cover letter.')
        }
      }
    } catch (error) {
      console.error('Error uploading cover letter:', error)
      toast.error('Failed to upload cover letter. Please try again.')
    } finally {
      setCoverLetterUploading(false)
      if (coverLetterFileInputRef.current) {
        coverLetterFileInputRef.current.value = ''
      }
    }
  }

  const handleUploadCoverLetter = () => {
    setShowCoverLetterModal(true)
  }

  const handleViewCoverLetter = () => {
    setShowCoverLetterSelect(true)
  }

  const handleViewResume = async (resumeId: string) => {
    try {
      const response = await apiService.fetchResumeFile(resumeId)
      const blob = await response.blob()
      const mime = response.headers.get('content-type') || 'application/pdf'
      const url = window.URL.createObjectURL(new Blob([blob], { type: mime }))
      window.open(url, '_blank')
      // Optional cleanup later
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000)
    } catch (error) {
      console.error('Error viewing resume:', error)
      toast.error('Failed to view resume')
    }
  }

  const handleDownloadResume = async (resumeId: string) => {
    try {
      await apiService.downloadResume(resumeId)
    } catch (error) {
      console.error('Error downloading resume:', error)
      toast.error('Failed to download resume')
    }
  }

  const handleDownloadCoverLetter = async (coverLetterId: string) => {
    try {
      const response = await apiService.downloadCoverLetter(coverLetterId)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'cover-letter.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading cover letter:', error)
      toast.error('Failed to download cover letter')
    }
  }

  const handleApplyToGulfJob = async (jobId: string) => {
    try {
      console.log(`🔍 Applying for Gulf job ${jobId}...`)
      
      // Find the job data from the dynamic data
      const job = gulfJobs.find(j => j.id === jobId)
      if (!job) {
        toast.error('Job not found')
        return
      }
      
      // Submit application using the API
      const response = await apiService.applyJob(jobId, {
        coverLetter: `I am interested in the ${job.title} position at ${job.company}. I am excited about the opportunity to work in the Gulf region.`,
        expectedSalary: undefined,
        noticePeriod: 30,
        availableFrom: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        isWillingToRelocate: true, // Gulf jobs typically require relocation
        preferredLocations: [job.location],
        resumeId: undefined
      })
      
      if (response.success) {
        toast.success(`Application submitted successfully for ${job.title} at ${job.company}!`, {
          description: 'Your application has been saved and will appear in your applications.',
          duration: 5000,
        })
        console.log('Gulf job application submitted:', jobId)
        
        // Add job to applied jobs set immediately for better UX
        setAppliedJobs(prev => new Set([...prev, jobId]))
        
        // Refresh applications to show the new one
        fetchApplications()
      } else {
        toast.error(response.message || 'Failed to submit application. Please try again.')
      }
    } catch (error) {
      console.error('Error applying for Gulf job:', error)
      toast.error('Failed to submit application. Please try again.')
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
      router.push('/gulf-opportunities')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  const handleProfileUpdated = async (updatedData: any) => {
    // Refresh user data to get updated profile
    await refreshUser()
    setShowProfileCompletion(false)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Star className="w-4 h-4 fill-current" />
      case 'medium': return <Star className="w-4 h-4" />
      case 'low': return <Star className="w-4 h-4" />
      default: return <Star className="w-4 h-4" />
    }
  }

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

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <GulfJobseekerAuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/30 to-teal-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <GulfNavbar />
      
      <div className="pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Gulf Opportunities Dashboard
                </h1>
                <p className="text-slate-600 dark:text-slate-300">
                  Welcome back, {user.firstName}! Explore your Gulf career opportunities
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">
                    <Globe className="w-4 h-4 mr-2" />
                    Regular Dashboard
                  </Button>
                </Link>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                  disabled={statsLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>
          </div>

          {/* User Info Card */}
          <Card className="mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-400">
                <User className="w-5 h-5" />
                <span>Gulf Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="flex-shrink-0">
                  <Avatar className="w-16 h-16 border-4 border-white dark:border-slate-700 shadow-lg">
                    <AvatarImage 
                      src={user.avatar ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${user.avatar}` : undefined} 
                      alt={`${user.firstName} ${user.lastName}`}
                    />
                    <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                      {`${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Name</p>
                      <p className="font-medium text-slate-900 dark:text-white">{user.firstName} {user.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                      <p className="font-medium text-slate-900 dark:text-white truncate">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Account Type</p>
                      <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Gulf Jobseeker
                      </Badge>
                        {/* Premium Badge */}
                        {(user?.preferences?.premium) && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            Premium
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                      <Badge variant={user.accountStatus === 'active' ? 'default' : 'destructive'}>
                        {user.accountStatus}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Profile Upvotes</p>
                      <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
                        <svg className="w-4 h-4 fill-green-600 text-green-600" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 5l7 12H5l7-12z"/></svg>
                        {statsLoading ? '—' : (stats?.profileLikes || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gulf Banner */}
          <Card className="mb-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Gulf Region Jobs</h2>
                    <p className="text-green-100">Tax-free salaries • Premium benefits • Global exposure</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {gulfJobsLoading ? 'Loading...' : `${gulfJobs.length} Active Jobs`}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 mb-8">
            <Link href="/gulf-jobs">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl hover:shadow-lg transition-all duration-200 cursor-pointer group h-full border-green-200 dark:border-green-800">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Search className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-base">Gulf Jobs</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Find opportunities</p>
                      {gulfJobs && gulfJobs.length > 0 && (
                        <div className="mt-1 inline-flex"><Badge variant="secondary">{gulfJobs.length}</Badge></div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/gulf-applications">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl hover:shadow-lg transition-all duration-200 cursor-pointer group h-full border-green-200 dark:border-green-800">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-base">My Applications</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{applicationsLoading ? 'Loading...' : `${applications.length} applications`}</p>
                      {!applicationsLoading && (
                        <div className="mt-1 inline-flex"><Badge variant="secondary">{applications.length}</Badge></div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Search History */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl hover:shadow-lg transition-all duration-200 cursor-pointer group h-full border-green-200 dark:border-green-800" onClick={() => router.push('/gulf-search-history')}>
              <CardContent className="p-6 h-full flex flex-col justify-center">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Search className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base">Search History</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {(stats as any)?.stats?.totalSearches ? `${(stats as any).stats.totalSearches} searches` : 'View and manage searches'}
                    </p>
                    {Boolean((stats as any)?.stats?.savedSearches) && (
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{(stats as any).stats.savedSearches} saved searches</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl hover:shadow-lg transition-all duration-200 cursor-pointer group h-full border-green-200 dark:border-green-800" onClick={() => router.push('/gulf-notifications')}>
              <CardContent className="p-6 h-full flex flex-col justify-center">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Bell className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base">Notifications</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Stay updated</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Link href="/gulf-resumes">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl hover:shadow-lg transition-all duration-200 cursor-pointer group h-full border-green-200 dark:border-green-800">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-base">Gulf Resume</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{resumes.length === 0 ? 'Upload resume' : `${resumes.length} uploaded`}</p>
                      {resumes.length > 0 && (
                        <div className="mt-1 inline-flex"><Badge variant="secondary">{resumes.length}</Badge></div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/gulf-cover-letters">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl hover:shadow-lg transition-all duration-200 cursor-pointer group h-full border-green-200 dark:border-green-800">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-base">Cover Letters</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{coverLetters.length === 0 ? 'Upload cover letter' : `${coverLetters.length} uploaded`}</p>
                      {coverLetters.length > 0 && (
                        <div className="mt-1 inline-flex"><Badge variant="secondary">{coverLetters.length}</Badge></div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/gulf-bookmarks">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl hover:shadow-lg transition-all duration-200 cursor-pointer group h-full border-green-200 dark:border-green-800">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Bookmark className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-base">Saved Jobs</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{bookmarksLoading ? 'Loading...' : `${bookmarks.length} saved`}</p>
                      {!bookmarksLoading && (
                        <div className="mt-1 inline-flex"><Badge variant="secondary">{bookmarks.length}</Badge></div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/gulf-alerts">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl hover:shadow-lg transition-all duration-200 cursor-pointer group h-full border-green-200 dark:border-green-800">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Bell className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-base">Job Alerts</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{jobAlertsLoading ? 'Loading...' : `${jobAlerts.length} active`}</p>
                      {!jobAlertsLoading && (
                        <div className="mt-1 inline-flex"><Badge variant="secondary">{jobAlerts.length}</Badge></div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/gulf-companies">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl hover:shadow-lg transition-all duration-200 cursor-pointer group h-full border-green-200 dark:border-green-800">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Building2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-base">Companies</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Gulf employers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Resume and Cover Letter Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Resume Section */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-green-200 dark:border-green-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-400">
                    <FileText className="w-5 h-5" />
                    <span>Gulf Resumes</span>
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={handleUploadResume}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {resumes.length === 0 ? (
                  <div className="text-center py-6">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">No resumes uploaded yet</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Upload your first Gulf resume to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {resumes.map((resume) => (
                      <div key={resume.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <p className="font-medium text-slate-900 dark:text-white truncate">
                              {resume.title || 'Untitled Resume'}
                            </p>
                            {resume.isDefault && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                Default
                              </Badge>
                            )}
                          </div>
                          {resume.summary && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 truncate">
                              {resume.summary}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewResume(resume.id)}
                            className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadResume(resume.id)}
                            className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cover Letter Section */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-green-200 dark:border-green-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-400">
                    <FileText className="w-5 h-5" />
                    <span>Gulf Cover Letters</span>
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={handleUploadCoverLetter}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {coverLetters.length === 0 ? (
                  <div className="text-center py-6">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">No cover letters uploaded yet</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Upload your first Gulf cover letter to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {coverLetters.map((coverLetter) => (
                      <div key={coverLetter.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <p className="font-medium text-slate-900 dark:text-white truncate">
                              {coverLetter.title || 'Untitled Cover Letter'}
                            </p>
                            {coverLetter.isDefault && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                Default
                              </Badge>
                            )}
                          </div>
                          {coverLetter.summary && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 truncate">
                              {coverLetter.summary}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                const response = await apiService.fetchCoverLetterFile(coverLetter.id)
                                const blob = await response.blob()
                                const mime = response.headers.get('content-type') || 'application/pdf'
                                const url = window.URL.createObjectURL(new Blob([blob], { type: mime }))
                                window.open(url, '_blank')
                                setTimeout(() => window.URL.revokeObjectURL(url), 60000)
                              } catch (error) {
                                console.error('Error viewing cover letter:', error)
                                toast.error('Failed to view cover letter')
                              }
                            }}
                            className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadCoverLetter(coverLetter.id)}
                            className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Gulf Interviews Section */}
          {upcomingInterviews.length > 0 && (
            <Card className="mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-green-200 dark:border-green-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-400">
                    <Calendar className="w-5 h-5" />
                    <span>Upcoming Gulf Interviews</span>
                  </CardTitle>
                  <Link href="/gulf-interviews">
                    <Button variant="outline" size="sm" className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingInterviews.slice(0, 3).map((interview) => {
                    const { date, time } = {
                      date: new Date(interview.scheduledAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }),
                      time: new Date(interview.scheduledAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })
                    }
                    
                    return (
                      <div key={interview.id} className="flex items-start space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white">{interview.title}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {interview.jobApplication?.job?.title && (
                              <span>Position: {interview.jobApplication.job.title}</span>
                            )}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                            <span>{date}</span>
                            <span>{time}</span>
                            {interview.duration && (
                              <span>({interview.duration} minutes)</span>
                            )}
                          </div>
                          {interview.interviewType && (
                            <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              {interview.interviewType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gulf Application Overview */}
          <Card className="mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-400">
                <TrendingUp className="w-5 h-5" />
                <span>Gulf Application Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-800/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {applicationsLoading ? (
                      <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-6 w-8 rounded mx-auto"></div>
                    ) : (
                      applications.length
                    )}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">Gulf Applications</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-800/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {applicationsLoading ? (
                      <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-6 w-8 rounded mx-auto"></div>
                    ) : (
                      applications.filter(app => app.status === 'reviewing' || app.status === 'shortlisted').length
                    )}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">Under Review</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-800/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {applicationsLoading ? (
                      <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-6 w-8 rounded mx-auto"></div>
                    ) : (
                      applications.filter(app => app.status === 'interviewed').length
                    )}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">Interviews</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-800/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {applicationsLoading ? (
                      <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-6 w-8 rounded mx-auto"></div>
                    ) : (
                      applications.filter(app => app.status === 'offered' || app.status === 'hired').length
                    )}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">Offers</div>
                </div>
              </div>
              
              {/* Quick Actions for Gulf Applications */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/gulf-applications">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <FileText className="w-4 h-4 mr-2" />
                    View All Gulf Applications
                  </Button>
                </Link>
                <Link href="/gulf-opportunities">
                  <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">
                    <Search className="w-4 h-4 mr-2" />
                    Find More Gulf Jobs
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Featured Gulf Jobs */}
          <Card className="mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-green-200 dark:border-green-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-400">
                  <Star className="w-5 h-5" />
                  <span>Featured Gulf Jobs</span>
                </CardTitle>
                <Link href="/gulf-opportunities">
                  <Button variant="outline" size="sm" className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">
                    View All
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {gulfJobsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-white dark:bg-slate-700 border-green-200 dark:border-green-800">
                      <CardHeader className="pb-3">
                        <div className="animate-pulse">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="animate-pulse">
                          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : gulfJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gulfJobs.map((job) => (
                  <Card key={job.id} className="bg-white dark:bg-slate-700 hover:shadow-lg transition-all duration-200 cursor-pointer border-green-200 dark:border-green-800">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-slate-900 dark:text-white mb-2">
                            {job.title}
                          </CardTitle>
                          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300">
                            <Building2 className="w-4 h-4" />
                            <span>{job.company}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 mt-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-1">
                          {job.featured && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          {job.urgent && (
                            <Badge variant="destructive" className="text-xs">
                              Urgent
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-4">
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span>{job.salary}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{job.posted}</span>
                        </div>
                      </div>
                      
                      <Button 
                        className={`w-full ${
                          appliedJobs.has(job.id) 
                            ? 'bg-green-500 text-white cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                        onClick={() => handleApplyToGulfJob(job.id)}
                        disabled={appliedJobs.has(job.id)}
                      >
                        {appliedJobs.has(job.id) ? (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Applied
                          </>
                        ) : (
                          <>
                            <Briefcase className="w-4 h-4 mr-2" />
                            Apply Now
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-slate-400 dark:text-slate-500 mb-4">
                    <Briefcase className="w-12 h-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    No Gulf Jobs Available
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Check back later for new Gulf opportunities
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <div className="mb-8">
            <RecentNotifications limit={3} showViewAll={true} />
          </div>

          {/* Recent Gulf Applications */}
          <Card className="mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-400">
                <FileText className="w-5 h-5" />
                <span>Recent Gulf Applications</span>
                {applications.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    {applications.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : applications && applications.length > 0 ? (
                <div className="space-y-3">
                  {applications.slice(0, 5).map((application, index) => (
                    <div key={application.id || index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            application.status === 'applied' ? 'bg-blue-500' :
                            application.status === 'reviewing' ? 'bg-yellow-500' :
                            application.status === 'shortlisted' ? 'bg-green-500' :
                            application.status === 'interviewed' ? 'bg-purple-500' :
                            application.status === 'offered' ? 'bg-emerald-500' :
                            application.status === 'hired' ? 'bg-green-600' :
                            application.status === 'rejected' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`}></div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {application.job?.title || application.jobTitle || 'Job Title'}
                          </p>
                          {application.isSample && (
                            <Badge variant="outline" className="text-xs">Sample</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          {application.job?.company?.name || application.companyName || 'Company'} • {application.job?.location || application.location || 'Location'} • {application.status || 'Applied'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : 'N/A'}
                        </div>
                        {application.isSample && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUndoApplication(application)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Undo
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {applications.length > 5 && (
                    <div className="text-center pt-2">
                      <Link href="/gulf-applications">
                        <Button variant="outline" size="sm" className="text-xs border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">
                          View All ({applications.length})
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">No Gulf applications yet</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Start applying to Gulf jobs to see your applications here</p>
                  <Link href="/gulf-opportunities" className="mt-3 inline-block">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Browse Gulf Jobs
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-400">
                <Settings className="w-5 h-5" />
                <span>Gulf Account Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto p-3 flex-col items-start space-y-1 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors border-green-200 dark:border-green-800"
                  onClick={() => router.push('/account')}
                >
                  <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium">Profile Settings</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto p-3 flex-col items-start space-y-1 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors border-green-200 dark:border-green-800"
                  onClick={() => setShowResumeModal(true)}
                >
                  <Upload className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium">Upload Resume</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto p-3 flex-col items-start space-y-1 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors border-green-200 dark:border-green-800"
                  onClick={() => router.push('/gulf-notifications')}
                >
                  <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium">Notifications</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto p-3 flex-col items-start space-y-1 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 hover:text-red-700 border-red-200 dark:border-red-800"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Sign Out</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resume Upload Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Upload Gulf Resume
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowResumeModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="resume-file">Select File</Label>
                <Input
                  id="resume-file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  disabled={uploading}
                />
                <p className="text-sm text-slate-500 mt-1">
                  Supported formats: PDF, DOC, DOCX (max 5MB)
                </p>
              </div>

              {uploading && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  <span className="text-sm text-green-600 dark:text-green-400">Uploading resume...</span>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Gulf Resume Tips:</h4>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <li>• Highlight international experience</li>
                  <li>• Include relevant certifications</li>
                  <li>• Mention language skills</li>
                  <li>• Emphasize adaptability</li>
                </ul>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline" 
                  onClick={() => setShowResumeModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cover Letter Upload Modal */}
      {showCoverLetterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Upload Gulf Cover Letter
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowCoverLetterModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="cover-letter-file">Select File</Label>
                <Input
                  id="cover-letter-file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleCoverLetterFileUpload}
                  ref={coverLetterFileInputRef}
                  disabled={coverLetterUploading}
                />
                <p className="text-sm text-slate-500 mt-1">
                  Supported formats: PDF, DOC, DOCX (max 5MB)
                </p>
              </div>

              {coverLetterUploading && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  <span className="text-sm text-green-600 dark:text-green-400">Uploading cover letter...</span>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Gulf Cover Letter Tips:</h4>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <li>• Emphasize cultural adaptability</li>
                  <li>• Highlight relevant international experience</li>
                  <li>• Mention willingness to relocate</li>
                  <li>• Show understanding of Gulf work culture</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCoverLetterModal(false)}
                  disabled={coverLetterUploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cover Letter Selector Dialog */}
      <Dialog open={showCoverLetterSelect} onOpenChange={setShowCoverLetterSelect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a Gulf cover letter to view</DialogTitle>
            <DialogDescription>Choose one of your uploaded cover letters to open.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {coverLetters.length === 0 && (
              <div className="text-sm text-slate-600 dark:text-slate-300">You have no cover letters yet. Upload one first.</div>
            )}
            {coverLetters.map((cl) => (
              <div key={(cl as any).id} className="flex items-center justify-between rounded border p-3">
                <div>
                  <div className="font-medium">{(cl as any).title || 'Untitled Cover Letter'}</div>
                  {(cl as any).summary && (
                    <div className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-[420px]">{(cl as any).summary}</div>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      await apiService.downloadCoverLetter((cl as any).id)
                      setShowCoverLetterSelect(false)
                    } catch (err) {
                      console.error('Failed to open cover letter:', err)
                      toast.error('Failed to open cover letter')
                    }
                  }}
                >
                  View
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Completion Dialog */}
      {user && (
        <JobseekerProfileCompletionDialog
          isOpen={showProfileCompletion}
          onClose={() => setShowProfileCompletion(false)}
          user={user}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
      </div>
    </GulfJobseekerAuthGuard>
  )
}
