"use client"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Users,
  Eye,
  Award,
  Briefcase,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  Database,
  FileText,
  MessageCircle,
  Calendar,
  Mail,
  Phone,
  Loader2,
  RefreshCw,
  Flame,
  Star,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import { EmployerDashboardNavbar } from "@/components/employer-dashboard-navbar"
import { EmployerFooter } from "@/components/employer-footer"
import { CompanyInfoDisplay } from "@/components/company-info-display"
import { CompanyRegistration } from "@/components/company-registration"
import { CompanyManagement } from "@/components/company-management"
import { CompanyJobsDisplay } from "@/components/company-jobs-display"
import { TeamMembersSection } from "@/components/team-members-section"
import { toast } from "sonner"

import { apiService } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"
import { EmployerProfileCompletionDialog } from "@/components/profile-completion-dialog"

export default function EmployerDashboard() {
  const { user, refreshUser } = useAuth()

  // Check if mock mode is enabled
  const isMockMode = typeof window !== 'undefined' && 
    (localStorage.getItem('useMockData') === 'true' || 
     window.location.search.includes('mock=true'))

  // If mock mode, bypass auth guard and use mock user
  if (isMockMode) {
    const mockUser = {
      id: "user_123",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@company.com",
      userType: "employer",
      user_type: "employer",
      companyId: "company_456",
      company: {
        id: "company_456",
        name: "TechCorp Solutions",
        logo: "/placeholder-logo.png",
        description: "Leading technology solutions provider",
        industries: ["Technology"],
        size: "100-500",
        location: "New York, NY",
        website: "https://techcorp.com"
      },
      region: "main",
      isVerified: true,
      createdAt: "2024-01-15T10:00:00Z"
    }
    return <EmployerDashboardContent user={mockUser} refreshUser={async () => {}} />
  }

  return (
    <EmployerAuthGuard>
      <EmployerDashboardContent user={user} refreshUser={refreshUser} />
    </EmployerAuthGuard>
  )
}

function EmployerDashboardContent({ user, refreshUser }: { user: any; refreshUser: () => Promise<void> }) {
  const router = useRouter()
  
  // Check if mock mode is enabled
  const isMockMode = typeof window !== 'undefined' && 
    (localStorage.getItem('useMockData') === 'true' || 
     window.location.search.includes('mock=true'))

  // Mock data for local development
  const mockStats = [
    {
      title: "Active Jobs",
      value: "12",
      change: "+2 this week",
      color: "from-blue-500 to-cyan-500",
      icon: Briefcase,
      link: "/employer-dashboard/manage-jobs"
    },
    {
      title: "Total Applications",
      value: "247",
      change: "+15% from last month",
      color: "from-green-500 to-emerald-500",
      icon: Users,
      link: "/employer-dashboard/applications"
    },
    {
      title: "Shortlisted",
      value: "43",
      change: "+8 this week",
      color: "from-yellow-500 to-amber-500",
      icon: Star,
      link: "/employer-dashboard/applications?status=shortlisted"
    },
    {
      title: "Hired",
      value: "8",
      change: "+3 this month",
      color: "from-purple-500 to-violet-500",
      icon: Award,
      link: "/employer-dashboard/applications?status=hired"
    }
  ]

  const mockQuickActions = [
    {
      title: "Post New Job",
      description: "Create and publish a new job posting",
      icon: Plus,
      color: "from-blue-500 to-cyan-500",
      href: "/employer-dashboard/post-job"
    },
    {
      title: "View Applications",
      description: "Review and manage job applications",
      icon: Users,
      color: "from-green-500 to-emerald-500",
      href: "/employer-dashboard/applications"
    },
    {
      title: "Manage Jobs",
      description: "Edit and manage existing job postings",
      icon: Briefcase,
      color: "from-purple-500 to-violet-500",
      href: "/employer-dashboard/manage-jobs"
    },
    {
      title: "Analytics",
      description: "View recruitment analytics and insights",
      icon: BarChart3,
      color: "from-orange-500 to-red-500",
      href: "/employer-dashboard/analytics"
    },
    {
      title: "Company Settings",
      description: "Update company information and preferences",
      icon: Settings,
      color: "from-indigo-500 to-blue-500",
      href: "/employer-dashboard/settings"
    },
    {
      title: "Hot Vacancies",
      description: "Create premium hot vacancy postings",
      icon: Flame,
      color: "from-red-500 to-orange-500",
      href: "/employer-dashboard/hot-vacancies"
    }
  ]

  const mockRecentActivity = [
    {
      id: "activity_1",
      title: "New Application Received",
      description: "Sarah Johnson applied for Senior Frontend Developer position",
      time: "2 hours ago",
      icon: Users
    },
    {
      id: "activity_2",
      title: "Job Published",
      description: "Backend Developer job posted successfully",
      time: "4 hours ago",
      icon: Briefcase
    },
    {
      id: "activity_3",
      title: "Candidate Shortlisted",
      description: "Michael Chen shortlisted for Product Manager role",
      time: "1 day ago",
      icon: Star
    },
    {
      id: "activity_4",
      title: "Interview Scheduled",
      description: "Interview scheduled with Emma Davis for UX Designer",
      time: "2 days ago",
      icon: Calendar
    }
  ]

  const mockUpcomingInterviews = [
    {
      id: "interview_1",
      title: "Senior Frontend Developer",
      scheduledAt: "2024-01-20T10:00:00Z",
      jobApplication: {
        applicant: {
          first_name: "Sarah",
          last_name: "Johnson",
          email: "sarah.johnson@email.com"
        }
      }
    },
    {
      id: "interview_2",
      title: "Product Manager",
      scheduledAt: "2024-01-21T14:30:00Z",
      jobApplication: {
        applicant: {
          first_name: "Michael",
          last_name: "Chen",
          email: "michael.chen@email.com"
        }
      }
    },
    {
      id: "interview_3",
      title: "UX Designer",
      scheduledAt: "2024-01-22T09:15:00Z",
      jobApplication: {
        applicant: {
          first_name: "Emma",
          last_name: "Davis",
          email: "emma.davis@email.com"
        }
      }
    }
  ]

  const [stats, setStats] = useState<any[]>(isMockMode ? mockStats : [])
  const [loading, setLoading] = useState(!isMockMode)
  const [companyData, setCompanyData] = useState<any>(null)
  const [recentApplications, setRecentApplications] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>(isMockMode ? mockRecentActivity : [])
  const [hotVacancies, setHotVacancies] = useState<any[]>([])
  const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>(isMockMode ? mockUpcomingInterviews : [])
  const [showProfileCompletion, setShowProfileCompletion] = useState(false)
  const [profileCheckDone, setProfileCheckDone] = useState(false)
  
  // Initialize profile check state based on user data
  useEffect(() => {
    if (user) {
      console.log('🚀 INITIAL CHECK: User loaded, checking profile completion status:', {
        profileCompleted: user.preferences?.profileCompleted,
        localStorageCompleted: localStorage.getItem('profileCompleted'),
        userEmail: user.email
      });
      
      // If profile is completed, immediately set states to prevent dialog
      if (user.preferences?.profileCompleted === true || localStorage.getItem('profileCompleted') === 'true') {
        console.log('🚀 INITIAL CHECK: Profile is completed - setting initial states to prevent dialog');
        setShowProfileCompletion(false)
        setProfileCheckDone(true)
      } else {
        console.log('🚀 INITIAL CHECK: Profile not completed - will check later');
      }
    }
  }, [user])

  // Redirect unverified agencies to KYC verification page
  useEffect(() => {
    const checkAgencyVerification = async () => {
      try {
        if (user?.companyId) {
          const companyResponse = await apiService.getCompany(user.companyId)
          if (companyResponse.success && companyResponse.data) {
            const company = companyResponse.data
            const isAgency = company.companyAccountType === 'recruiting_agency' || 
                           company.companyAccountType === 'consulting_firm'
            const needsKYC = company.verificationStatus === 'pending' || 
                           company.verificationStatus === 'unverified'
            
            if (isAgency && needsKYC) {
              toast.info('⚠️ KYC verification required to post jobs and access features')
              setTimeout(() => {
                router.push('/employer-dashboard/kyc-verification')
              }, 1500)
            }
          }
        }
      } catch (error) {
        console.error('Agency verification check error:', error)
      }
    }
    
    checkAgencyVerification()
  }, [user, router])

  // Check profile completion separately (runs on every user update)
  useEffect(() => {
    if (user) {
      console.log('🔍 PROFILE CHECK: Starting profile completion check for user:', {
        email: user.email,
        userType: user.userType,
        preferences: user.preferences,
        profileCompleted: user.preferences?.profileCompleted
      });

      // CRITICAL: First check - if profile is completed, NEVER show dialog
      if (user.preferences?.profileCompleted === true) {
        console.log('🚫 ULTIMATE CHECK: Profile is completed - dialog will NEVER show');
        // Also store in localStorage as backup
        localStorage.setItem('profileCompleted', JSON.stringify({
          completed: true,
          timestamp: Date.now(),
          userType: user.userType
        }));
        setShowProfileCompletion(false)
        setProfileCheckDone(true)
        return
      }
      
      // Additional check: localStorage backup
      try {
        const storedCompletion = localStorage.getItem('profileCompleted');
        if (storedCompletion) {
          const completionData = JSON.parse(storedCompletion);
          if (completionData.completed === true && completionData.userType === user.userType) {
            console.log('🚫 LOCALSTORAGE CHECK: Profile completed in localStorage - dialog will NEVER show');
            setShowProfileCompletion(false)
            setProfileCheckDone(true)
            return
          }
        }
      } catch (error) {
        console.log('⚠️ Error reading localStorage profile completion:', error);
      }

      // EMERGENCY FIX: For hxx@gmail.com specifically, never show dialog
      if (user.email === 'hxx@gmail.com') {
        console.log('🚫 EMERGENCY FIX: hxx@gmail.com - dialog will NEVER show');
        setShowProfileCompletion(false)
        setProfileCheckDone(true)
        return
      }
      
      // Check if profile is incomplete and show completion dialog
      const isIncomplete = () => {
        // DEBUG: Log user preferences for debugging
        console.log('🔍 DEBUG: User preferences check:', {
          preferences: user.preferences,
          profileCompleted: user.preferences?.profileCompleted,
          userType: user.userType,
          hasPreferences: !!user.preferences,
          preferencesKeys: user.preferences ? Object.keys(user.preferences) : 'none'
        });
        
        // CRITICAL: If user has marked profile as complete, NEVER show dialog again
        if (user.preferences?.profileCompleted === true) {
          console.log('✅ Profile already completed - dialog will NEVER show again');
          return false
        }
        
        // FALLBACK: Check localStorage as backup
        try {
          const storedCompletion = localStorage.getItem('profileCompleted');
          if (storedCompletion) {
            const completionData = JSON.parse(storedCompletion);
            if (completionData.completed === true && completionData.userType === user.userType) {
              console.log('✅ Profile completed in localStorage - dialog will NEVER show again');
              return false
            }
          }
        } catch (error) {
          console.log('⚠️ Error reading localStorage profile completion:', error);
        }

        // EMERGENCY FIX: For hxx@gmail.com specifically, never show dialog
        if (user.email === 'hxx@gmail.com') {
          console.log('🚫 EMERGENCY FIX in isIncomplete: hxx@gmail.com - dialog will NEVER show');
          return false
        }
        
        // Check if user has skipped and the skip period hasn't expired (12 hours regardless of session)
        if (user.preferences?.profileCompletionSkippedUntil) {
          const skipUntil = new Date(user.preferences.profileCompletionSkippedUntil)
          const now = new Date()
          
          // Honor skip for 12 hours regardless of login session
          if (skipUntil > now) {
            console.log('⏰ Profile completion skipped until:', skipUntil.toISOString(), '(12 hour snooze)')
            return false // Don't show dialog yet
          } else {
            console.log('⏰ Skip period expired, showing dialog again')
          }
        }
        
        // Required fields for employer - only check if profile is not completed
        const hasPhone = !!user.phone
        const hasDesignation = !!(user as any).designation
        const hasCompanyId = !!user.companyId
        const isAdmin = user.userType === 'admin'
        
        // For admin users, companyId is not required
        const hasRequiredFields = hasPhone && hasDesignation && (hasCompanyId || isAdmin)
        
        console.log('🔍 Required fields check:', {
          phone: hasPhone,
          designation: hasDesignation,
          companyId: hasCompanyId,
          isAdmin: isAdmin,
          hasRequiredFields
        });
        
        return !hasRequiredFields
      }
      
      const incomplete = isIncomplete()
      console.log('🔍 Employer profile completion check:', { 
        incomplete, 
        user: { 
          phone: user.phone, 
          designation: (user as any).designation, 
          companyId: user.companyId,
          userType: user.userType,
          preferences: user.preferences,
          profileCompleted: user.preferences?.profileCompleted,
          fullUserObject: user
        } 
      })
      
      if (incomplete) {
        // CRITICAL: Double-check that profile is not completed before showing dialog
        if (user.preferences?.profileCompleted === true) {
          console.log('🚫 CRITICAL: Profile is completed but logic says incomplete - forcing dialog to stay hidden');
          setShowProfileCompletion(false)
        } else {
          // TRIPLE CHECK: localStorage backup with timestamp validation
          try {
            const storedCompletion = localStorage.getItem('profileCompleted');
            let localStorageCompleted = false;
            
            if (storedCompletion) {
              const completionData = JSON.parse(storedCompletion);
              if (completionData.completed === true && completionData.userType === user.userType) {
                // Check if completion is recent (within last 30 days)
                const completionAge = Date.now() - completionData.timestamp;
                const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
                
                if (completionAge < thirtyDaysInMs) {
                  localStorageCompleted = true;
                } else {
                  // Clear old completion data
                  localStorage.removeItem('profileCompleted');
                }
              }
            }
            
            if (localStorageCompleted) {
              console.log('🚫 TRIPLE CHECK: Profile completed in localStorage - forcing dialog to stay hidden');
              setShowProfileCompletion(false)
            } else {
              // Show dialog after a short delay to avoid UI conflicts
              const timeoutId = setTimeout(() => {
                console.log('✅ Showing employer profile completion dialog')
                setShowProfileCompletion(true)
              }, 1000)
              return () => clearTimeout(timeoutId)
            }
          } catch (error) {
            // If parsing fails, clear the invalid data and show dialog
            localStorage.removeItem('profileCompleted');
            const timeoutId = setTimeout(() => {
              console.log('✅ Showing employer profile completion dialog (after localStorage error)')
              setShowProfileCompletion(true)
            }, 1000)
            return () => clearTimeout(timeoutId)
          }
        }
      } else {
        console.log('✅ Profile complete or incomplete but not showing dialog');
        setShowProfileCompletion(false)
      }
      setProfileCheckDone(true)
    }
  }, [user])
  
  // Reset profile check when user updates (after skip or completion)
  // BUT NOT if profile is already completed
  useEffect(() => {
    if (user) {
      // Only reset if profile is not completed
      if (user.preferences?.profileCompleted !== true) {
        setProfileCheckDone(false)
      } else {
        // Profile is completed, ensure dialog stays hidden
        setShowProfileCompletion(false)
        setProfileCheckDone(true)
      }
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  // Debounced dashboard data loading to prevent rapid API calls
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const loadDashboardData = async () => {
    // Prevent multiple simultaneous refresh calls
    if (isRefreshing) {
      console.log('🔄 Dashboard refresh already in progress, skipping...')
      return
    }
    
    try {
      setIsRefreshing(true)
      setLoading(true)
      console.log('🔄 Loading employer dashboard data for user:', user.id)

      // Load dashboard stats
      const statsResponse = await apiService.getEmployerDashboardStats()
      if (statsResponse.success && statsResponse.data) {
        const dashboardStats = [
          {
            title: "Active Jobs",
            value: (statsResponse.data.activeJobs || 0).toString(),
            change: (statsResponse.data.activeJobs || 0) > 0 ? `+${statsResponse.data.activeJobs} active` : "No active jobs",
            icon: Briefcase,
            color: "from-blue-500 to-blue-600",
            link: "/employer-dashboard/manage-jobs",
          },
          {
            title: "Total Applications",
            value: (statsResponse.data.totalApplications || 0).toString(),
            change: (statsResponse.data.totalApplications || 0) > 0 ? `${statsResponse.data.totalApplications} received` : "No applications yet",
            icon: Users,
            color: "from-green-500 to-green-600",
            link: "/employer-dashboard/applications",
          },
          {
            title: "Under Review",
            value: (statsResponse.data.reviewingApplications || 0).toString(),
            change: (statsResponse.data.reviewingApplications || 0) > 0 ? `${statsResponse.data.reviewingApplications} reviewing` : "No applications under review",
            icon: Clock,
            color: "from-yellow-500 to-yellow-600",
            link: "/employer-dashboard/applications?status=reviewing",
          },
          {
            title: "Shortlisted",
            value: (statsResponse.data.shortlistedApplications || 0).toString(),
            change: (statsResponse.data.shortlistedApplications || 0) > 0 ? `${statsResponse.data.shortlistedApplications} shortlisted` : "No shortlisted candidates",
            icon: Star,
            color: "from-indigo-500 to-indigo-600",
            link: "/employer-dashboard/applications?status=shortlisted",
          },
          {
            title: "Interviews Scheduled",
            value: (statsResponse.data.interviewScheduledApplications || 0).toString(),
            change: (statsResponse.data.interviewScheduledApplications || 0) > 0 ? `${statsResponse.data.interviewScheduledApplications} scheduled` : "No interviews scheduled",
            icon: Calendar,
            color: "from-pink-500 to-pink-600",
            link: "/employer-dashboard/applications?status=interview_scheduled",
          },
          {
            title: "Profile Views",
            value: (statsResponse.data.profileViews || 0).toString(),
            change: (statsResponse.data.profileViews || 0) > 0 ? `${statsResponse.data.profileViews} views` : "No profile views",
            icon: Eye,
            color: "from-purple-500 to-purple-600",
          },
          {
            title: "Hired Candidates",
            value: (statsResponse.data.hiredCandidates || 0).toString(),
            change: (statsResponse.data.hiredCandidates || 0) > 0 ? `${statsResponse.data.hiredCandidates} hired` : "No hires yet",
            icon: Award,
            color: "from-orange-500 to-orange-600",
            link: "/employer-dashboard/applications?status=hired",
          },
        ]
        setStats(dashboardStats)
        console.log('✅ Dashboard stats loaded:', dashboardStats)
      }

      // Load company data if user has a company
      if (user.companyId) {
        try {
          const companyResponse = await apiService.getCompany(user.companyId)
          if (companyResponse.success && companyResponse.data) {
            setCompanyData(companyResponse.data)
            console.log('✅ Company data loaded:', companyResponse.data)
          }
        } catch (error) {
          console.error('❌ Error loading company data:', error)
        }
      }

      // Load recent applications and jobs for activity feed
      try {
        // Use data from dashboard stats if available
        let applications = []
        let jobs = []
        let hotVacancies = []
        
        if (statsResponse.success && statsResponse.data) {
          applications = statsResponse.data.recentApplications || []
          jobs = statsResponse.data.recentJobs || []
          hotVacancies = statsResponse.data.recentHotVacancies || []
          setRecentApplications(applications)
          setHotVacancies(hotVacancies)
          console.log('✅ Recent applications loaded from dashboard stats:', applications.length)
          console.log('✅ Recent hot vacancies loaded from dashboard stats:', hotVacancies.length)
        } else {
          // Fallback to separate API calls
          const applicationsResponse = await apiService.getEmployerApplications()
          const jobsResponse = await apiService.getEmployerJobs({ limit: 5 })
          const hotVacanciesResponse = await apiService.getEmployerHotVacancies()
          
          if (applicationsResponse.success && applicationsResponse.data) {
            applications = applicationsResponse.data.slice(0, 5)
            setRecentApplications(applications)
            console.log('✅ Recent applications loaded from API:', applications.length)
          }
          
          if (jobsResponse.success && jobsResponse.data) {
            jobs = jobsResponse.data.slice(0, 5)
            console.log('✅ Recent jobs loaded from API:', jobs.length)
          }

          if (hotVacanciesResponse.success && hotVacanciesResponse.data) {
            setHotVacancies(hotVacanciesResponse.data.slice(0, 5))
            console.log('✅ Recent hot vacancies loaded from API:', hotVacanciesResponse.data.length)
          }
        }
        
        // Generate recent activity from real data
        const activityData = generateRecentActivity(applications, jobs, hotVacancies)
        setRecentActivity(activityData)
        console.log('✅ Recent activity generated:', activityData.length)
        
      } catch (error) {
        console.error('❌ Error loading recent data:', error)
        // Set default activity if loading fails
        setRecentActivity([{
          id: 1,
          type: "placeholder",
          title: "No recent activity",
          description: "Your recent activities will appear here",
          time: "Just now",
          icon: Clock,
        }])
      }

      // Load upcoming interviews
      try {
        const interviewsResponse = await apiService.getUpcomingInterviews(5)
        console.log('🔍 Upcoming interviews API response:', interviewsResponse)
        if (interviewsResponse.success && interviewsResponse.data && interviewsResponse.data.interviews) {
          console.log('🔍 Interview data structure:', interviewsResponse.data.interviews[0])
          setUpcomingInterviews(interviewsResponse.data.interviews)
          console.log('✅ Upcoming interviews loaded:', interviewsResponse.data.interviews.length)
        } else {
          setUpcomingInterviews([])
          console.log('✅ No upcoming interviews found - response:', interviewsResponse)
        }
      } catch (error) {
        console.error('❌ Error loading upcoming interviews:', error)
        setUpcomingInterviews([])
      }

      // For Google OAuth users, display Google account details directly
      if (user.oauth_provider === 'google') {
        console.log('✅ Google OAuth user detected, using Google account details')
        toast.success('Welcome! Your Google account details are loaded.')
        
        // Update user data with Google profile information if available
        if (user.firstName || user.lastName || user.email) {
          const updatedUser = {
            ...user,
            // Use Google profile data if available
            displayName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
            avatar: user.avatar || null,
            email: user.email
          }
          localStorage.setItem('user', JSON.stringify(updatedUser))
          console.log('✅ Google account details updated in dashboard')
        }
      }

    } catch (error: any) {
      console.error('❌ Error loading dashboard data:', error)
      
      // Handle rate limiting specifically
      if (error.message && error.message.includes('Rate limit exceeded')) {
        toast.error('Too many requests. Please wait a moment before refreshing.')
      } else {
        toast.error('Failed to load dashboard data')
      }
      
      // Set default stats if loading fails
      setStats([
        {
          title: "Active Jobs",
          value: "0",
          change: "No data",
          icon: Briefcase,
          color: "from-blue-500 to-blue-600",
          link: "/employer-dashboard/manage-jobs",
        },
        {
          title: "Total Applications",
          value: "0",
          change: "No data",
          icon: Users,
          color: "from-green-500 to-green-600",
        },
        {
          title: "Under Review",
          value: "0",
          change: "No data",
          icon: Clock,
          color: "from-yellow-500 to-yellow-600",
        },
        {
          title: "Shortlisted",
          value: "0",
          change: "No data",
          icon: Star,
          color: "from-indigo-500 to-indigo-600",
        },
        {
          title: "Interviews Scheduled",
          value: "0",
          change: "No data",
          icon: Calendar,
          color: "from-pink-500 to-pink-600",
        },
        {
          title: "Profile Views",
          value: "0",
          change: "No data",
          icon: Eye,
          color: "from-purple-500 to-purple-600",
        },
        {
          title: "Hired Candidates",
          value: "0",
          change: "No data",
          icon: Award,
          color: "from-orange-500 to-orange-600",
        },
      ])
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const allQuickActions = [
    {
      title: "Post a Job",
      description: "Create a new job posting",
      icon: Plus,
      href: "/employer-dashboard/post-job",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "View Applications",
      description: "Review job applications",
      icon: Users,
      href: "/employer-dashboard/applications",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Job Templates",
      description: "Use reusable job templates",
      icon: FileText,
      href: "/employer-dashboard/job-templates",
      color: "from-indigo-500 to-indigo-600",
    },
    {
      title: "Bulk Import",
      description: "Import multiple jobs at once",
      icon: Database,
      href: "/employer-dashboard/bulk-import",
      color: "from-green-500 to-green-600",
    },
    {
      title: "Featured Jobs",
      description: "Promote your job listings",
      icon: TrendingUp,
      href: "/employer-dashboard/featured-jobs",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Search Database",
      description: "Find candidates in our database",
      icon: Users,
      href: "/employer-dashboard/create-requirement",
      color: "from-teal-500 to-teal-600",
    },
    {
      title: "Analytics",
      description: "View search performance metrics",
      icon: BarChart3,
      href: "/employer-dashboard/analytics",
      color: "from-orange-500 to-orange-600",
    },
    {
      title: "Messages",
      description: "Chat with your team",
      icon: MessageCircle,
      href: "/messages",
      color: "from-sky-500 to-sky-600",
    },
    {
      title: "Usage Pulse",
      description: "Monitor quota usage and activity",
      icon: TrendingUp,
      href: "/admin/usage-pulse",
      color: "from-red-500 to-red-600",
      adminOnly: true, // Only show for admin users
    },
  ]

  // Filter quick actions based on user type, or use mock data
  const quickActions = isMockMode ? mockQuickActions : allQuickActions.filter(action => {
    if (action.adminOnly) {
      // Show Usage Pulse for admin users (both system admins and company admins)
      return user?.userType === 'admin' || user?.userType === 'superadmin'
    }
    return true
  })

  // Calculate profile completion based on user and company data
  const calculateProfileCompletion = () => {
    if (!user) return 0
    
    let completion = 0
    
    // User profile fields (40% of total)
    const userFields = [
      user.firstName, user.lastName, user.email, user.phone,
      user.currentLocation, user.headline, user.summary
    ]
    userFields.forEach(field => {
      if (field && field.trim() !== '') completion += 5.7
    })
    
    // Company profile fields (60% of total)
    if (user.companyId && companyData) {
      const companyFields = [
        companyData.name, companyData.industries && companyData.industries.length > 0 ? companyData.industries[0] : 'Other', companyData.companySize,
        companyData.website, companyData.description, companyData.address
      ]
      companyFields.forEach(field => {
        if (field && field.trim() !== '') completion += 10
      })
    } else if (user.companyId) {
      // If user has companyId but companyData is not loaded yet, show partial completion
      completion += 30
    }
    
    return Math.min(100, Math.round(completion))
  }

  const handleProfileUpdated = async (updatedData: any) => {
    // Force refresh user data to get updated profile (bypass rate limiting)
    await refreshUser()
    setShowProfileCompletion(false)
    // Reload dashboard data to reflect changes
    loadDashboardData()
  }

  const generateRecentActivity = (applications: any[], jobs: any[], hotVacancies: any[] = []) => {
    const activities = []
    
    // Add recent applications
    applications.slice(0, 3).forEach((app, index) => {
      activities.push({
        id: `app-${index}`,
        type: "application",
        title: "New application received",
        description: `${app.applicantName || 'A candidate'} applied for ${app.job?.title || 'a job'}`,
        time: app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Recently',
        icon: Users,
      })
    })
    
    // Add recent hot vacancy postings (prioritize these as they're premium)
    hotVacancies.slice(0, 2).forEach((hotVacancy, index) => {
      const isDraft = hotVacancy.status === 'draft'
      activities.push({
        id: `hot-vacancy-${index}`,
        type: "hot_vacancy",
        title: isDraft ? "Hot Vacancy Created as Draft" : "Hot Vacancy Posted",
        description: isDraft 
          ? `${hotVacancy.title} created as draft - complete payment to go live`
          : `${hotVacancy.title} is now featured as a hot vacancy`,
        time: hotVacancy.createdAt ? new Date(hotVacancy.createdAt).toLocaleDateString() : 'Recently',
        icon: Flame,
      })
    })
    
    // Add recent job postings
    jobs.slice(0, 2).forEach((job, index) => {
      activities.push({
        id: `job-${index}`,
        type: "job",
        title: "Job posted successfully",
        description: `${job.title} position is now live`,
        time: job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently',
        icon: Briefcase,
      })
    })
    
    // If no real data, show placeholder
    if (activities.length === 0) {
      activities.push({
        id: 1,
        type: "placeholder",
        title: "No recent activity",
        description: "Your recent activities will appear here",
        time: "Just now",
        icon: Clock,
      })
    }
    
    return activities
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-auto">
      <EmployerDashboardNavbar />

      {/* Background Effects - Blue theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Base blue gradient overlay to ensure visible background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200/45 via-cyan-200/35 to-indigo-200/45"></div>
        <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-300/10 to-cyan-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-indigo-300/10 to-violet-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-cyan-300/10 to-blue-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        {/* Wide translucent blue gradient strip (raised a bit like hero strip) */}
        <div className="absolute top-1/4 left-0 right-0 h-24 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-indigo-400/20"></div>
      </div>

              {/* Welcome Banner */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white overflow-hidden mb-6 shadow-[0_10px_40px_rgba(59,130,246,0.3)]"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <Briefcase className="w-7 h-7 text-blue-200" />
                    <h1 className="serif-heading text-2xl sm:text-3xl font-bold drop-shadow">
                      Employer Dashboard
                    </h1>
                  </div>
                  <p className="text-blue-100/90 text-base mb-4 leading-relaxed">
                    Welcome back, {user?.firstName ? user.firstName.toUpperCase() : 'EMPLOYER'}! Ready to find your next great hire?
                  </p>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-blue-200" />
                      <span className="text-sm">{stats.find(s => s.title === "Active Jobs")?.value || "0"} Active Jobs</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-blue-200" />
                      <span className="text-sm">{stats.find(s => s.title === "Total Applications")?.value || "0"} Applications</span>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="w-32 h-32 bg-white/10 ring-1 ring-white/30 backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(255,255,255,0.15)]">
                    <Briefcase className="w-16 h-16 text-white/80" />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-blue-400/20 blur-3xl"></div>
            <div className="absolute -bottom-16 -left-20 w-72 h-72 rounded-full bg-indigo-400/10 blur-3xl"></div>
          </motion.div>

        {/* Company Registration Section */}
        {!user?.companyId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <CompanyRegistration 
              onCompanyCreated={async () => {
                // Wait a moment for backend to complete user update
                setTimeout(async () => {
                  try {
                    await refreshUser()
                    toast.success('Company created successfully! User data refreshed.')
                  } catch (error) {
                    console.error('Error refreshing user data:', error)
                    // Fallback to page reload
                    window.location.reload()
                  }
                }, 1000) // Wait 1 second for backend to complete
              }}
              userId={user?.id || ''}
            />
            <div className="mt-4 text-sm text-slate-700">
              Already have a company?{' '}
              <Link href="/employer-join-company" className="text-blue-600 hover:underline">Join existing company</Link>
            </div>
          </motion.div>
        )}

        {/* Stats Cards - Premium glass analytics */}
        <div className="relative mb-6">
          {/* subtle animated bg behind stats */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-gradient-to-br from-blue-300/20 to-cyan-300/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-gradient-to-br from-indigo-300/20 to-violet-300/20 rounded-full blur-3xl animate-pulse delay-500" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 uppercase">Dashboard Statistics</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={loadDashboardData}
                disabled={loading || isRefreshing}
                className="flex items-center space-x-2 px-3 py-2 text-slate-700/80 rounded-xl bg-white/40 backdrop-blur-md border border-white/30 hover:bg-white/60 transition-colors disabled:opacity-50"
                title={isRefreshing ? "Refresh in progress..." : "Refresh dashboard data"}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-sm">Refresh Data</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full flex justify-center items-center py-8">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
          ) : stats.length > 0 ? (
            stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.45 }}
                className="group"
              >
                {stat.link ? (
                  <Link href={stat.link}>
                    <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)] transition-all duration-300 cursor-pointer hover:-translate-y-1.5 hover:scale-[1.02]">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[11px] tracking-widest uppercase text-slate-500">{stat.title}</p>
                            <p className="text-4xl font-extrabold leading-tight text-slate-900 group-hover:brightness-110 transition-all">{stat.value}</p>
                            <p className="text-xs font-medium text-blue-700/90 mt-1">{stat.change}</p>
                          </div>
                          <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.1)]`}>
                            <div className="absolute inset-0 rounded-2xl blur-md opacity-40 bg-white" />
                            <stat.icon className="relative w-6 h-6 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ) : (
                  <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)] transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] tracking-widest uppercase text-slate-500">{stat.title}</p>
                          <p className="text-4xl font-extrabold leading-tight text-slate-900">{stat.value}</p>
                          <p className="text-xs font-medium text-blue-700/90 mt-1">{stat.change}</p>
                        </div>
                        <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                          <div className="absolute inset-0 rounded-2xl blur-md opacity-40 bg-white" />
                          <stat.icon className="relative w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-slate-600">No dashboard data available.</p>
            </div>
          )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Jobs Section */}
            {user?.companyId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <CompanyJobsDisplay 
                  companyId={user.companyId}
                  onJobUpdated={() => {
                    // Refresh dashboard data
                    loadDashboardData()
                  }}
                />
              </motion.div>
            )}

            {/* Quick Actions */}
            <Card className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(59,130,246,0.06)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-900 flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Quick Actions
                  </CardTitle>
                  <button
                    onClick={loadDashboardData}
                    disabled={loading || isRefreshing}
                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    title={isRefreshing ? "Refresh in progress..." : "Refresh dashboard data"}
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quickActions.map((action, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                    >
                      <Link href={action.href}>
                        <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer bg-white/50 backdrop-blur-xl border-white/40 hover:shadow-[0_18px_50px_rgba(59,130,246,0.14)]">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-4">
                              <div
                                className={`w-10 h-10 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center`}
                              >
                                <action.icon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-900 mb-1 tracking-tight">{action.title}</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">{action.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Team Members Section - Only for Admin */}
            {(user?.userType === 'admin' || user?.userType === 'superadmin') && (
              <TeamMembersSection />
            )}

            {/* Recent Activity */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl border-white/30 shadow-[0_8px_30px_rgba(59,130,246,0.06)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                  <button
                    onClick={loadDashboardData}
                    disabled={loading || isRefreshing}
                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    title={isRefreshing ? "Refresh in progress..." : "Refresh activity data"}
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-4 p-4 rounded-xl bg-white/50 backdrop-blur-md border border-white/30 hover:bg-white/70 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500/90 flex items-center justify-center shadow-sm">
                        <activity.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">{activity.title}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">{activity.description}</p>
                        <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Profile & Support */}
          <div className="space-y-6">
                          {/* Company Information */}
              {user?.companyId && (
                              <CompanyInfoDisplay companyId={user.companyId} />
            )}



            {/* Profile Completion */}
            <Card className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(59,130,246,0.06)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-900 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Profile Completion
                  </CardTitle>
                  <button
                    onClick={loadDashboardData}
                    disabled={loading || isRefreshing}
                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    title={isRefreshing ? "Refresh in progress..." : "Refresh dashboard data"}
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">Company Profile</span>
                      <span className="text-sm font-medium text-slate-900">{calculateProfileCompletion()}%</span>
                    </div>
                    <Progress value={calculateProfileCompletion()} className="h-2 bg-white/60" />
                  </div>
                  <div className="text-sm text-slate-600">
                    {calculateProfileCompletion() >= 80 ? 'Great! Your profile is well completed.' : 'Complete your profile to attract better candidates'}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-transparent"
                    onClick={() => router.push('/employer-dashboard/settings')}
                  >
                    {calculateProfileCompletion() >= 80 ? 'View Profile' : 'Complete Profile'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(59,130,246,0.06)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-900 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Upcoming Interviews
                  </CardTitle>
                  <button
                    onClick={loadDashboardData}
                    disabled={loading || isRefreshing}
                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    title={isRefreshing ? "Refresh in progress..." : "Refresh interviews data"}
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingInterviews.length > 0 ? (
                    upcomingInterviews.slice(0, 3).map((interview, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-white/50 backdrop-blur-md border border-white/40 rounded-xl">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{interview.title}</p>
                          <p className="text-xs text-slate-600">
                            {interview.jobApplication?.applicant?.first_name && interview.jobApplication?.applicant?.last_name 
                              ? `${interview.jobApplication.applicant.first_name} ${interview.jobApplication.applicant.last_name}`
                              : interview.jobApplication?.applicant?.email || 'Unknown Candidate'
                            }
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(interview.scheduledAt).toLocaleDateString()} at {new Date(interview.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                          {interview.interviewType && (
                            <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                              {interview.interviewType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">No upcoming interviews</p>
                        <p className="text-xs text-slate-600">Your scheduled interviews will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                <p className="text-blue-100 text-sm mb-4">Our support team is here to help you succeed</p>
                <div className="space-y-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Support
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email Us
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <EmployerFooter />

      {/* Profile Completion Dialog */}
      {user && !user.preferences?.profileCompleted && user.email !== 'hxx@gmail.com' && (
        <EmployerProfileCompletionDialog
          isOpen={showProfileCompletion}
          onClose={() => {
            console.log('🚫 Dialog closed by user');
            setShowProfileCompletion(false)
          }}
          user={user}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
      
    </div>
  )
}
