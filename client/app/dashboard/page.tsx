"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { constructAvatarUrl } from '@/lib/api'
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
  Zap,
  CheckCircle,
  Briefcase,
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { EmployerAuthGuard } from '@/components/employer-auth-guard'
import { motion } from 'framer-motion'

import { toast } from 'sonner'
import { apiService, Resume, JobBookmark, JobAlert, CoverLetter } from '@/lib/api'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RecentNotifications } from '@/components/recent-notifications'
import { JobseekerAuthGuard } from '@/components/jobseeker-auth-guard'
import { JobseekerProfileCompletionDialog } from '@/components/profile-completion-dialog'

export default function DashboardPage() {
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
  const [dataLoaded, setDataLoaded] = useState(false)
  const [followedCompaniesCount, setFollowedCompaniesCount] = useState(0)
  const [followedCompaniesLoading, setFollowedCompaniesLoading] = useState(true)
  const [showProfileCompletion, setShowProfileCompletion] = useState(false)
  const [profileCheckDone, setProfileCheckDone] = useState(false)

  useEffect(() => {
    if (loading) return;
    if (user) {
      if (user.userType === 'employer' || user.userType === 'admin') {
      console.log('🔄 Employer/Admin detected on jobseeker dashboard, redirecting to employer dashboard')
        router.replace(user.region === 'gulf' ? '/gulf-dashboard' : '/employer-dashboard')
      }
      return;
    }
    // No user yet
    if (typeof window !== 'undefined' && apiService.isAuthenticated()) {
      // Token present; avoid redirecting to login while profile is loading
      return;
    }
    router.replace('/login')
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
          
          // Only honor skip if it's the SAME login session AND timestamp hasn't expired
          if (skipSession === currentSession && skipUntil > now) {
            console.log('⏰ Profile completion skipped until:', skipUntil, '(same session)')
            return false // Don't show dialog yet
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
      console.log('🔍 Profile completion check:', { incomplete, user: { phone: user.phone, location: user.currentLocation, headline: user.headline } })
      
      if (incomplete) {
        // Show dialog after a short delay to avoid UI conflicts
        const timeoutId = setTimeout(() => {
          console.log('✅ Showing profile completion dialog')
          setShowProfileCompletion(true)
        }, 1000)
        return () => clearTimeout(timeoutId)
      } else {
        setShowProfileCompletion(false)
      }
      setProfileCheckDone(true)
    }
  }, [user, loading, profileCheckDone])

  // Single useEffect to handle all data fetching with proper debouncing
  useEffect(() => {
    if (user && !loading && !dataLoaded) {
      setCurrentUser(user)
      
      // Debounce all API calls to prevent excessive requests
      const timeoutId = setTimeout(async () => {
        try {
          // Fetch critical data first
          await Promise.all([
            fetchDashboardStats(),
            fetchApplications(),
            fetchBookmarks()
          ])
          
          // Then fetch secondary data
          await Promise.all([
            fetchResumes(),
            fetchJobAlerts(),
            fetchCoverLetters(),
            fetchInterviews(),
            fetchFollowedCompanies()
          ])
          
          setDataLoaded(true)
        } catch (error) {
          console.error('Error loading dashboard data:', error)
        }
      }, 500) // 500ms delay to prevent rapid-fire API calls

      return () => clearTimeout(timeoutId)
    }
  }, [user, loading, dataLoaded])

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true)
      const response = await apiService.getDashboardStats()
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      toast.error('Failed to load dashboard stats')
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchApplications = async () => {
    try {
      setApplicationsLoading(true)
      
      // Fetch applications from database only
      const response = await apiService.getApplications()
      if (response.success && response.data) {
        setApplications(response.data)
      } else {
        setApplications([])
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
      setApplications([])
    } finally {
      setApplicationsLoading(false)
    }
  }

  const fetchInterviews = async () => {
    try {
      setInterviewsLoading(true)
      
      // Fetch all interviews first, then filter for upcoming ones
      const response = await apiService.getCandidateInterviews('', 1, 10)
      
      console.log('🔍 Interview fetch response:', response)
      
      if (response.success && response.data && response.data.interviews) {
        const allInterviews = response.data.interviews
        console.log('🔍 All interviews:', allInterviews)
        
        // Filter for upcoming interviews (scheduled, confirmed, or any future interviews)
        const upcoming = allInterviews.filter((interview: any) => {
          const interviewDate = new Date(interview.scheduledAt)
          const now = new Date()
          return interviewDate >= now && 
                 (interview.status === 'scheduled' || 
                  interview.status === 'confirmed' || 
                  interview.status === 'pending')
        })
        
        console.log('🔍 Upcoming interviews:', upcoming)
        setUpcomingInterviews(upcoming)
      } else {
        console.log('No interviews found or response format issue:', response)
        setUpcomingInterviews([])
      }
    } catch (error) {
      console.error('Error fetching interviews:', error)
      // Don't show error to user for interviews as it's not critical
      setUpcomingInterviews([])
    } finally {
      setInterviewsLoading(false)
    }
  }

  // Function to refresh dashboard data with rate limiting
  const refreshDashboard = async () => {
    // Prevent rapid successive refreshes
    if (statsLoading || applicationsLoading || bookmarksLoading) {
      toast.info('Please wait, data is already being refreshed...')
      return
    }

    try {
      // Show loading state
      setStatsLoading(true)
      setDataLoaded(false) // Reset data loaded state
      
      // Fetch critical data first, then others
      await Promise.all([
        fetchDashboardStats(),
        fetchApplications(),
        fetchBookmarks()
      ])
      
      // Fetch secondary data
      await Promise.all([
        fetchResumes(),
        fetchJobAlerts(),
        fetchCoverLetters(),
        fetchInterviews(),
        fetchFollowedCompanies()
      ])
      
      setDataLoaded(true)
      toast.success('Dashboard refreshed successfully!')
    } catch (error) {
      console.error('Error refreshing dashboard:', error)
      toast.error('Failed to refresh dashboard data')
    }
  }

  // Removed excessive refresh useEffect - data is now fetched only once on mount

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
      
      // Fetch bookmarks from database only
      const response = await apiService.getBookmarks()
      if (response.success && response.data) {
        setBookmarks(response.data)
      } else {
        setBookmarks([])
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error)
      setBookmarks([])
    } finally {
      setBookmarksLoading(false)
    }
  }

  const fetchJobAlerts = async () => {
    try {
      setJobAlertsLoading(true)
      const response = await apiService.getJobAlerts()
      if (response.success && response.data) {
        setJobAlerts(response.data)
      }
    } catch (error) {
      console.error('Error fetching job alerts:', error)
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

  const fetchFollowedCompanies = async () => {
    try {
      setFollowedCompaniesLoading(true)
      const response = await apiService.getFollowedCompanies()
      if (response.success && response.data) {
        setFollowedCompaniesCount(response.data.length)
      }
    } catch (error) {
      console.error('Error fetching followed companies:', error)
    } finally {
      setFollowedCompaniesLoading(false)
    }
  }


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      setUploading(true)
      const response = await apiService.uploadResumeFile(file)
      if (response.success) {
        toast.success('Resume uploaded successfully!')
        fetchResumes()
        setShowResumeModal(false)
        
        // If this is the first resume, show additional info
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

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
      router.push('/login')
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

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <JobseekerAuthGuard>
      <div className="min-h-screen bg-animated dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-x-hidden">
      <Navbar />
      
      {/* Landing Page Style Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Enhanced Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-indigo-800/5 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-indigo-800/20"></div>
        
        {/* Enhanced Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Layer A: far glow */}
          <div className="absolute -top-40 -right-40 w-[28rem] h-[28rem] rounded-full parallax-far" style={{ background: 'radial-gradient(50% 50% at 50% 50%, rgba(90,0,242,0.35) 0%, rgba(90,0,242,0) 100%)' }}></div>
          {/* Layer B: gradient strip */}
          <div className="absolute top-1/3 left-0 right-0 h-24 opacity-20 gradient-strip"></div>
          {/* Layer C: small particles placeholder (non-interactive) */}
          <div className="pointer-events-none absolute inset-0 opacity-20"></div>
        </div>
      </div>
      
      <div className="pt-20 pb-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-3xl p-6 text-white overflow-hidden mb-6 shadow-[0_10px_40px_rgba(90,0,242,0.3)]"
          >
            <div className="relative z-10">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">
                    Welcome back, {user.firstName}! 👋
                </h1>
                  <p className="text-purple-100 text-lg">
                    Here's what's happening with your job search journey
                </p>
                {!dataLoaded && (
                    <div className="mt-3 flex items-center space-x-2 text-sm text-purple-200">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Loading dashboard data...</span>
                  </div>
                )}
              </div>
                <div className="hidden lg:block">
                  <div className="w-32 h-32 bg-white/10 ring-1 ring-white/30 backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(255,255,255,0.15)]">
                    <User className="w-16 h-16 text-white/80" />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center space-x-4">
              <Button
                onClick={refreshDashboard}
                variant="outline"
                size="sm"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-md"
                disabled={statsLoading || applicationsLoading || bookmarksLoading}
              >
                  <RefreshCw className={`w-4 h-4 mr-2 ${(statsLoading || applicationsLoading || bookmarksLoading) ? 'animate-spin' : ''}`} />
                  {(statsLoading || applicationsLoading || bookmarksLoading) ? 'Refreshing...' : 'Refresh'}
              </Button>
                <div className="text-sm text-purple-200">
                  Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
            </div>
            <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-purple-400/20 blur-3xl"></div>
            <div className="absolute -bottom-16 -left-20 w-72 h-72 rounded-full bg-indigo-400/10 blur-3xl"></div>
          </motion.div>

          {/* User Info Card */}
          <Card className="mb-8 bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(90,0,242,0.06)]">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-slate-900">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="flex-shrink-0">
                  <Avatar className="w-16 h-16 border-4 border-white dark:border-slate-700 shadow-lg">
                    <AvatarImage 
                      src={constructAvatarUrl(user.avatar)} 
                      alt={`${user.firstName} ${user.lastName}`}
                    />
                    <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
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
                      <Badge variant="secondary" className="capitalize">
                        {user.userType}
                      </Badge>
                        {/* Premium Badge */}
                        {((user as any).verification_level === 'premium' || (user as any).verificationLevel === 'premium' || user?.preferences?.premium) && (
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

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <Link href="/jobs">
              <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(90,0,242,0.08)] hover:shadow-[0_18px_60px_rgba(90,0,242,0.16)] transition-all duration-300 cursor-pointer hover:-translate-y-1.5 hover:scale-[1.02] group h-full">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform">
                      <div className="absolute inset-0 rounded-2xl blur-md opacity-40 bg-white" />
                      <Search className="relative w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-base">Find Jobs</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Browse opportunities</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/applications">
              <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(90,0,242,0.08)] hover:shadow-[0_18px_60px_rgba(90,0,242,0.16)] transition-all duration-300 cursor-pointer hover:-translate-y-1.5 hover:scale-[1.02] group h-full">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform">
                      <div className="absolute inset-0 rounded-2xl blur-md opacity-40 bg-white" />
                      <FileText className="relative w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-base">My Applications</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {statsLoading ? 'Loading...' : `${applications.length} applications submitted`}
                      </p>
                      {applications.length > 0 && (
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          {applications.filter(app => app.status === 'reviewing' || app.status === 'shortlisted').length} under review
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/interviews">
              <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(90,0,242,0.08)] hover:shadow-[0_18px_60px_rgba(90,0,242,0.16)] transition-all duration-300 cursor-pointer hover:-translate-y-1.5 hover:scale-[1.02] group h-full">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-500 flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform">
                      <div className="absolute inset-0 rounded-2xl blur-md opacity-40 bg-white" />
                      <Calendar className="relative w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-base">My Interviews</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {interviewsLoading ? 'Loading...' : `${upcomingInterviews.length} upcoming interview${upcomingInterviews.length !== 1 ? 's' : ''}`}
                      </p>
                      {upcomingInterviews.length > 0 && (
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Next: {new Date(upcomingInterviews[0]?.scheduledAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/job-alerts">
              <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(90,0,242,0.08)] hover:shadow-[0_18px_60px_rgba(90,0,242,0.16)] transition-all duration-300 cursor-pointer hover:-translate-y-1.5 hover:scale-[1.02] group h-full">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform">
                      <div className="absolute inset-0 rounded-2xl blur-md opacity-40 bg-white" />
                      <Bell className="relative w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-base">Job Alerts</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {jobAlertsLoading ? 'Loading...' : `${jobAlerts.length} alert${jobAlerts.length !== 1 ? 's' : ''} active`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/bookmarks">
              <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(90,0,242,0.08)] hover:shadow-[0_18px_60px_rgba(90,0,242,0.16)] transition-all duration-300 cursor-pointer hover:-translate-y-1.5 hover:scale-[1.02] group h-full">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform">
                      <div className="absolute inset-0 rounded-2xl blur-md opacity-40 bg-white" />
                      <Bookmark className="relative w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-base">Saved Jobs</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {bookmarksLoading ? 'Loading...' : `${bookmarks.length} jobs saved`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(90,0,242,0.08)] hover:shadow-[0_18px_60px_rgba(90,0,242,0.16)] transition-all duration-300 cursor-pointer hover:-translate-y-1.5 hover:scale-[1.02] group h-full">
              <CardContent className="p-6 h-full flex flex-col justify-center">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform">
                    <div className="absolute inset-0 rounded-2xl blur-md opacity-40 bg-white" />
                    <Search className="relative w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base">Search History</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {statsLoading ? 'Loading...' : `${stats?.stats?.totalSearches || 0} searches performed`}
                    </p>
                    {stats?.stats?.savedSearches > 0 && (
                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {stats.stats.savedSearches} saved searches
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => router.push('/search-history')}
                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
                    >
                      View History
                    </Button>
                    {stats?.stats?.savedSearches > 0 && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => router.push('/search-history?tab=saved')}
                        className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
                      >
                        Saved Searches
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(90,0,242,0.08)] hover:shadow-[0_18px_60px_rgba(90,0,242,0.16)] transition-all duration-300 cursor-pointer hover:-translate-y-1.5 hover:scale-[1.02] group h-full"
              onClick={() => router.push('/resumes')}
            >
              <CardContent className="p-6 h-full flex flex-col justify-center">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform">
                    <div className="absolute inset-0 rounded-2xl blur-md opacity-40 bg-white" />
                    <FileText className="relative w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base">My Resumes</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {resumes.length === 0 ? 'Upload your first resume' : `${resumes.length} resume${resumes.length !== 1 ? 's' : ''} uploaded`}
                    </p>
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleUploadResume()
                      }}
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      Upload
                    </Button>
                    {resumes.length > 0 && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          router.push('/resumes')
                        }}
                      >
                        View All
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(90,0,242,0.08)] hover:shadow-[0_18px_60px_rgba(90,0,242,0.16)] transition-all duration-300 cursor-pointer hover:-translate-y-1.5 hover:scale-[1.02] group h-full"
              onClick={() => router.push('/cover-letters')}
            >
              <CardContent className="p-6 h-full flex flex-col justify-center">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform">
                    <div className="absolute inset-0 rounded-2xl blur-md opacity-40 bg-white" />
                    <FileText className="relative w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base">My Cover Letters</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {coverLetters.length === 0 ? 'Upload your first cover letter' : `${coverLetters.length} cover letter${coverLetters.length !== 1 ? 's' : ''} uploaded`}
                    </p>
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleUploadCoverLetter()
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      Upload
                    </Button>
                      {coverLetters.length > 0 && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            router.push('/cover-letters')
                          }}
                        >
                          View All
                        </Button>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Link href="/companies">
              <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(90,0,242,0.08)] hover:shadow-[0_18px_60px_rgba(90,0,242,0.16)] transition-all duration-300 cursor-pointer hover:-translate-y-1.5 hover:scale-[1.02] group h-full">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform">
                      <div className="absolute inset-0 rounded-2xl blur-md opacity-40 bg-white" />
                      <Building2 className="relative w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-base">Companies</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Explore employers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/notifications">
              <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(90,0,242,0.08)] hover:shadow-[0_18px_60px_rgba(90,0,242,0.16)] transition-all duration-300 cursor-pointer hover:-translate-y-1.5 hover:scale-[1.02] group h-full">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform">
                      <div className="absolute inset-0 rounded-2xl blur-md opacity-40 bg-white" />
                      <Bell className="relative w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-base">Notifications</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Stay updated</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/followed-companies">
              <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(90,0,242,0.08)] hover:shadow-[0_18px_60px_rgba(90,0,242,0.16)] transition-all duration-300 cursor-pointer hover:-translate-y-1.5 hover:scale-[1.02] group h-full">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform">
                      <div className="absolute inset-0 rounded-2xl blur-md opacity-40 bg-white" />
                      <Building2 className="relative w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-base">Followed Companies</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {followedCompaniesLoading ? 'Loading...' : `${followedCompaniesCount} ${followedCompaniesCount === 1 ? 'company' : 'companies'} following`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/gulf-opportunities">
              <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-2 border-green-200/50 dark:border-green-800/50 shadow-[0_8px_28px_rgba(34,197,94,0.08)] hover:shadow-[0_18px_60px_rgba(34,197,94,0.16)] transition-all duration-300 cursor-pointer hover:-translate-y-1.5 hover:scale-[1.02] group h-full">
                <CardContent className="p-6 h-full flex flex-col justify-center">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform">
                      <div className="absolute inset-0 rounded-2xl blur-md opacity-40 bg-white" />
                      <svg className="relative w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-base">Gulf Opportunities</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Explore jobs in Gulf region</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>


          {/* Upcoming Interviews Section */}
          {upcomingInterviews.length > 0 && (
            <Card className="mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Upcoming Interviews</span>
                  </CardTitle>
                  <Link href="/interviews">
                    <Button variant="outline" size="sm">
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
                      <div key={interview.id} className="flex items-start space-x-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
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
                            <Badge variant="secondary" className="mt-2">
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


          {/* Stats Overview - Enhanced for Jobseekers */}
          {user.userType === 'jobseeker' && (
            <Card className="mb-8 bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(90,0,242,0.06)]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-slate-900">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <span>Application Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {applicationsLoading ? (
                        <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-6 w-8 rounded mx-auto"></div>
                      ) : (
                        applications.length
                      )}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">Total Applications</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {applicationsLoading ? (
                        <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-6 w-8 rounded mx-auto"></div>
                      ) : (
                        applications.filter(app => app.status === 'reviewing' || app.status === 'shortlisted').length
                      )}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">Under Review</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                      {interviewsLoading ? (
                        <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-6 w-8 rounded mx-auto"></div>
                      ) : (
                        upcomingInterviews.length
                      )}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">Interviews</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                      {applicationsLoading ? (
                        <div className="animate-pulse bg-slate-200 dark:bg-slate-700 h-6 w-8 rounded mx-auto"></div>
                      ) : (
                        applications.filter(app => app.status === 'offered' || app.status === 'hired').length
                      )}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Offers</div>
                  </div>
                </div>
                
                {/* Quick Actions for Applications */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/applications">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <FileText className="w-4 h-4 mr-2" />
                      View All Applications
                    </Button>
                  </Link>
                  <Link href="/jobs">
                    <Button variant="outline">
                      <Search className="w-4 h-4 mr-2" />
                      Find More Jobs
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}


          {/* Account Actions */}
          <Card className="mb-8 bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(90,0,242,0.06)]">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-slate-900">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-slate-500 to-gray-500 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <span>Account Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto p-3 flex-col items-start space-y-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  onClick={handleEditProfile}
                >
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium">Account Settings</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto p-3 flex-col items-start space-y-1 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  onClick={handleUploadResume}
                >
                  <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium">Upload Resume</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto p-3 flex-col items-start space-y-1 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                  onClick={handleNotificationSettings}
                >
                  <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium">Notifications</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto p-3 flex-col items-start space-y-1 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 hover:text-red-700"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Sign Out</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <div className="mb-8">
            <RecentNotifications limit={3} showViewAll={true} />
          </div>

          {/* Gulf Opportunities Banner */}
          <Card className="mb-8 bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200/50 dark:border-green-800/50 shadow-[0_8px_30px_rgba(34,197,94,0.06)] backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Explore Gulf Opportunities</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Discover high-paying jobs in the Gulf region with tax-free salaries</p>
                  </div>
                </div>
                <Link href="/gulf-opportunities">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Explore Gulf Jobs
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Applications */}
          <Card className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(90,0,242,0.06)]">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-slate-900">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span>Recent Applications</span>
                {applications.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
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
                    <div key={application.id || index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
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
                      <Link href="/applications">
                        <Button variant="outline" size="sm" className="text-xs">
                          View All ({applications.length})
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">No applications yet</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Start applying to jobs to see your applications here</p>
                  <Link href="/jobs" className="mt-3 inline-block">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Browse Jobs
                    </Button>
                  </Link>
                </div>
              )}
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
                Upload Resume
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
                <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-600 dark:text-blue-400">Uploading resume...</span>
                    </div>
                  )}

              <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Upload Tips:</h4>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <li>• Use PDF format for best compatibility</li>
                  <li>• Keep file size under 5MB</li>
                  <li>• Ensure your resume is up-to-date</li>
                  <li>• First upload will be set as default</li>
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
                Upload Cover Letter
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
                <div className="flex items-center space-x-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  <span className="text-sm text-indigo-600 dark:text-indigo-400">Uploading cover letter...</span>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                <h4 className="font-medium text-slate-900 dark:text-white mb-2">Upload Tips:</h4>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <li>• Use PDF format for best compatibility</li>
                  <li>• Keep file size under 5MB</li>
                  <li>• Ensure your cover letter is tailored to the job</li>
                  <li>• First upload will be set as default</li>
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
            <DialogTitle>Select a cover letter to view</DialogTitle>
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

      {/* Footer */}
      <footer className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl text-white py-4 sm:py-6 px-4 sm:px-6 lg:px-8 border-t border-slate-800 mt-6 sm:mt-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Company Logo */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  JobPortal
                </span>
              </div>
              <p className="text-slate-400 text-sm">
                Connecting talented professionals with amazing opportunities across India and the Gulf region.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/jobs" className="block text-slate-400 hover:text-white transition-colors text-sm">
                  Find Jobs
                </Link>
                <Link href="/companies" className="block text-slate-400 hover:text-white transition-colors text-sm">
                  Browse Companies
                </Link>
                <Link href="/dashboard" className="block text-slate-400 hover:text-white transition-colors text-sm">
                  Dashboard
                </Link>
                <Link href="/profile" className="block text-slate-400 hover:text-white transition-colors text-sm">
                  Profile
                </Link>
              </div>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Support</h3>
              <div className="space-y-2">
                <Link href="/help" className="block text-slate-400 hover:text-white transition-colors text-sm">
                  Help Center
                </Link>
                <Link href="/contact" className="block text-slate-400 hover:text-white transition-colors text-sm">
                  Contact Us
                </Link>
                <Link href="/privacy" className="block text-slate-400 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="block text-slate-400 hover:text-white transition-colors text-sm">
                  Terms of Service
                </Link>
              </div>
            </div>

            {/* Connect */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Connect</h3>
              <div className="flex space-x-4">
                <Link href="#" className="text-slate-400 hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Link href="#" className="text-slate-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </Link>
                <Link href="#" className="text-slate-400 hover:text-white transition-colors">
                  <span className="sr-only">Facebook</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-6 pt-6 text-center">
            <p className="text-slate-400 text-sm">
              © 2024 JobPortal. All rights reserved. Made with ❤️ for job seekers and employers.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </JobseekerAuthGuard>
  )
}
