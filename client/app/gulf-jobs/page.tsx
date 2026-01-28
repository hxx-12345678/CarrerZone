"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  MapPin,
  Briefcase,
  Filter,
  SlidersHorizontal,
  Clock,
  Users,
  DollarSign,
  Zap,
  Sparkles,
  Star,
  ArrowRight,
  X,
  Bookmark,
  BookmarkCheck,
  CheckCircle,
  Camera,
  Calendar,
  ArrowLeft,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"
import GulfNavbar from "@/components/gulf-navbar"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { apiService } from "@/lib/api"
import { JobApplicationDialog } from "@/components/job-application-dialog"

// Types for state management
interface FilterState {
  search: string
  location: string
  experienceLevels: string[]
  jobTypes: string[]
  locations: string[]
  salaryRange: string
  category: string
  type: string
  industry?: string
  department?: string
  role?: string
  skills?: string
  companyType?: string
  workMode?: string
  education?: string
  companyName?: string
  recruiterType?: string
}

interface GulfJob {
  id: string
  title: string
  company: {
    name: string
    id?: string
  }
  location: string
  experience: string
  salary: string
  skills: string[]
  logo: string
  posted: string
  applicants: number
  description: string
  type: string
  remote: boolean
  urgent: boolean
  featured: boolean
  companyRating: number
  category: string
  photos?: any[]
  // Internship-specific fields
  duration?: string
  startDate?: string
  workMode?: string
  learningObjectives?: string
  mentorship?: string
}

export default function GulfJobsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState("recent")
  const [isStickyVisible, setIsStickyVisible] = useState(false)
  const [jobs, setJobs] = useState<GulfJob[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [showApplicationDialog, setShowApplicationDialog] = useState(false)
  const [selectedJob, setSelectedJob] = useState<GulfJob | null>(null)
  const [preferredJobs, setPreferredJobs] = useState<GulfJob[]>([])
  const [preferredJobsLoading, setPreferredJobsLoading] = useState(false)

  const openGulfAuthDialog = useCallback((mode: 'login' | 'register' = 'login') => {
    if (typeof window === 'undefined') {
      return
    }

    const eventName = mode === 'register' ? 'gulf-auth:open-register' : 'gulf-auth:open-login'
    window.dispatchEvent(new Event(eventName))
  }, [])

  // Check if user has access to Gulf pages
  const [accessDenied, setAccessDenied] = useState(false)
  
  // Auth check - redirect employers/admins to Gulf dashboard
  useEffect(() => {
    if (user && (user.userType === 'employer' || user.userType === 'admin')) {
      console.log('🔄 Employer/Admin detected on Gulf jobs page, redirecting to Gulf dashboard')
      setIsRedirecting(true)
      router.replace('/gulf-dashboard')
      return
    }
  }, [user, router])
  
  useEffect(() => {
    if (!loading && user && !user.regions?.includes('gulf') && user.region !== 'gulf') {
      setAccessDenied(true)
      return
    }
    setAccessDenied(false)
  }, [user, loading])

  // Show loading while redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/30 to-teal-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Redirecting...</p>
        </div>
      </div>
    )
  }

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    location: "",
    experienceLevels: [],
    jobTypes: [],
    locations: [],
    salaryRange: "",
    category: "",
    type: "",
    industry: "",
    department: "",
    role: "",
    skills: "",
    companyType: "",
    workMode: "",
    education: "",
    companyName: "",
    recruiterType: "",
  })

  // Check URL parameters for filters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const category = urlParams.get('category')
      const type = urlParams.get('type')
      const location = urlParams.get('location')

      if (category || type || location) {
        setFilters(prev => ({
          ...prev,
          category: category || "",
          type: type || "",
          location: location || "",
        }))
      }
    }
  }, [])

  // Fetch jobs from backend and user data
  useEffect(() => {
    fetchJobs()
    
    // Fetch existing bookmarks and applications if user is logged in
    if (user) {
      fetchUserData()
      fetchPreferredJobs()
    }
  }, [user])

  // Sync filters to URL and refetch (debounced)
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.location) params.set('location', filters.location)
    if (filters.jobTypes.length > 0) params.set('jobType', filters.jobTypes.map(j => j.toLowerCase().replace(/\s+/g,'-')).join(','))
    if (filters.experienceLevels.length > 0) params.set('experienceRange', filters.experienceLevels.join(','))
    if (filters.salaryRange) params.set('salaryRange', filters.salaryRange)
    if (filters.industry) params.set('industry', filters.industry)
    if (filters.department) params.set('department', filters.department)
    if (filters.role) params.set('role', filters.role)
    if (filters.skills) params.set('skills', filters.skills)
    if (filters.companyType) params.set('companyType', filters.companyType)
    if (filters.workMode) params.set('workMode', filters.workMode)
    if (filters.education) params.set('education', filters.education)
    if (filters.companyName) params.set('companyName', filters.companyName)
    if (filters.recruiterType) params.set('recruiterType', filters.recruiterType)

    const qs = params.toString()
    if (typeof window !== 'undefined') window.history.replaceState({}, '', qs ? `/gulf-jobs?${qs}` : '/gulf-jobs')

    const t = setTimeout(() => { fetchJobs() }, 400)
    return () => clearTimeout(t)
  }, [filters])

  const fetchJobs = async () => {
    try {
      setJobsLoading(true)
      
      // Fetch Gulf jobs from backend
      const params: Record<string, string | number | boolean | undefined> = {
        search: filters.search || undefined,
        location: filters.location || undefined,
        jobType: filters.jobTypes.length > 0 ? filters.jobTypes.map(t => t.toLowerCase().replace(/\s+/g,'-')).join(',') : undefined,
        experienceRange: filters.experienceLevels.length > 0 ? filters.experienceLevels.map(r => r.includes('+') ? r.replace('+','-100') : r).join(',') : undefined,
        ...(filters.salaryRange ? (() => {
          const sr = filters.salaryRange
          if (sr.includes('+')) return { salaryMin: parseInt(sr) * 1 }
          const [minStr, maxStr] = sr.split('-');
          const min = parseInt(minStr); const max = parseInt(maxStr)
          return { salaryMin: isNaN(min)?undefined:min, salaryMax: isNaN(max)?undefined:max }
        })() : {}),
        industry: filters.industry || undefined,
        department: filters.department || undefined,
        role: filters.role || undefined,
        skills: filters.skills || undefined,
        companyType: filters.companyType || undefined,
        workMode: filters.workMode ? (filters.workMode.toLowerCase().includes('home')?'remote':filters.workMode) : undefined,
        education: filters.education || undefined,
        companyName: filters.companyName || undefined,
        recruiterType: filters.recruiterType || undefined,
        limit: 100
      }
      const response = await apiService.getGulfJobs(params)
      
      if (response.success && response.data) {
        // Transform backend jobs to match frontend format
        const transformedJobs = (response.data.jobs || response.data).map((job: any) => ({
          id: job.id,
          title: job.title,
          company: {
            id: job.company?.id || 'unknown',
            name: job.company?.name || 'Unknown Company',
            industry: job.company?.industry,
            companyType: job.company?.companyType,
          } as any,
          location: job.location,
          experience: job.experienceLevel || job.experience || 'Not specified',
          salary: job.salary || (job.salaryMin && job.salaryMax 
            ? `${job.salaryCurrency || 'AED'} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
            : 'Competitive'),
          skills: job.skills || [],
          logo: job.company?.logo || '/placeholder-logo.png',
          posted: job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently',
          applicants: job.applications || job.application_count || 0,
          description: job.description,
          type: job.jobType ? job.jobType.charAt(0).toUpperCase() + job.jobType.slice(1) : 'Full-time',
          remote: job.remoteWork === 'remote',
          urgent: job.isUrgent || false,
          featured: job.isFeatured || false,
          companyRating: 4.5, // Default rating
          category: job.category || 'General',
          photos: job.photos || [],
          // Internship-specific fields
          duration: job.duration,
          startDate: job.startDate,
          workMode: job.workMode || job.remoteWork,
          learningObjectives: job.learningObjectives,
          mentorship: job.mentorship
        }))
        
        setJobs(transformedJobs)
        console.log('✅ Loaded', transformedJobs.length, 'Gulf jobs from database')
      } else {
        console.error('❌ Failed to fetch Gulf jobs:', response.message)
        setJobs([])
      }
    } catch (error) {
      console.error('❌ Error fetching Gulf jobs:', error)
      setJobs([])
    } finally {
      setJobsLoading(false)
    }
  }

  const fetchUserData = async () => {
    try {
      console.log('🔄 Fetching user data...')
      
      // Fetch applications - only include non-withdrawn applications
      const applicationsResponse = await apiService.getGulfJobApplications()
      console.log('📊 Gulf applications response:', applicationsResponse)
      
      if (applicationsResponse.success && applicationsResponse.data) {
        const applications = applicationsResponse.data.applications || applicationsResponse.data
        console.log('📋 All Gulf applications:', applications.map((app: any) => ({ 
          id: app.id, 
          jobId: app.jobId, 
          status: app.status 
        })))
        
        const activeApplications = applications.filter((app: any) => 
          app.status && app.status !== 'withdrawn'
        )
        console.log('✅ Active Gulf applications:', activeApplications.map((app: any) => ({ 
          id: app.id, 
          jobId: app.jobId, 
          status: app.status 
        })))
        
        const appliedJobIds = new Set(activeApplications.map((app: any) => app.jobId))
        setAppliedJobs(appliedJobIds)
        
        // Store application IDs for undo functionality
        const jobIdToAppId: Record<string, string> = {}
        applications.forEach((app: any) => {
          if (app.jobId && app.id) {
            jobIdToAppId[app.jobId] = app.id
          }
        })
        setJobIdToApplicationId(jobIdToAppId)
        console.log('🗂️ JobId to ApplicationId mapping:', jobIdToAppId)
      }

      // Fetch bookmarks (Gulf-specific)
      const bookmarksResponse = await apiService.getGulfJobBookmarks()
      if (bookmarksResponse.success && bookmarksResponse.data) {
        const bookmarks = bookmarksResponse.data.bookmarks || bookmarksResponse.data
        const savedJobIds = new Set(bookmarks.map((bookmark: any) => bookmark.jobId))
        setSavedJobs(savedJobIds)
        console.log('🔖 Saved Gulf jobs:', Array.from(savedJobIds))
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error)
    }
  }

  const fetchPreferredJobs = async () => {
    try {
      setPreferredJobsLoading(true)
      const response = await apiService.getMatchingJobs(1, 20)
      
      if (response.success && response.data) {
        const transformedJobs = response.data.jobs.map((job: any) => ({
          id: job.id,
          title: job.title,
          company: {
            id: job.company?.id || 'unknown',
            name: job.company?.name || 'Unknown Company'
          },
          location: job.location,
          experience: job.experienceLevel || job.experience || 'Not specified',
          salary: job.salary || (job.salaryMin && job.salaryMax 
            ? `${job.salaryCurrency || 'AED'} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
            : 'Competitive'),
          skills: job.skills || [],
          logo: job.company?.logo || '/placeholder-logo.png',
          posted: job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently',
          applicants: job.applications || job.application_count || 0,
          description: job.description,
          type: job.jobType ? job.jobType.charAt(0).toUpperCase() + job.jobType.slice(1) : 'Full-time',
          remote: job.remoteWork === 'remote',
          urgent: job.isUrgent || false,
          featured: job.isFeatured || false,
          companyRating: 4.5,
          category: job.category || 'General',
          photos: job.photos || [],
          duration: job.duration,
          startDate: job.startDate,
          workMode: job.workMode,
          learningObjectives: job.learningObjectives,
          mentorship: job.mentorship,
          isPreferred: true
        }))
        
        setPreferredJobs(transformedJobs)
      }
    } catch (error) {
      console.error('Error fetching preferred jobs:', error)
    } finally {
      setPreferredJobsLoading(false)
    }
  }

  const handleSaveJob = async (jobId: string) => {
    if (!user) {
      toast.info('Please sign in to Gulf portal to save jobs.')
      openGulfAuthDialog('login')
      return
    }

    try {
      // Find the job data
      const job = jobs.find(j => j.id === jobId)
      if (!job) {
        toast.error('Job not found')
        return
      }

      // Save job to database (Gulf-specific)
      const response = await apiService.bookmarkGulfJob(jobId)
      if (response.success) {
        setSavedJobs(prev => new Set([...prev, jobId]))
        toast.success('Job saved successfully!')
        console.log('Gulf job saved:', jobId)
      } else {
        toast.error(response.message || 'Failed to save job. Please try again.')
      }
    } catch (error) {
      console.error('Error saving Gulf job:', error)
      toast.error('Failed to save job')
    }
  }

  const handleApply = async (jobId: string) => {
    if (!user) {
      toast.info('Sign in to Gulf portal to apply for jobs.')
      openGulfAuthDialog('login')
      return
    }

    // Find the job data
    const job = jobs.find(j => j.id === jobId)
    if (!job) {
      toast.error('Job not found')
      return
    }

    // Show application dialog
    setSelectedJob(job)
    setShowApplicationDialog(true)
  }

  const handleApplicationSuccess = () => {
    if (selectedJob) {
      // Update applied jobs state
      setAppliedJobs(prev => new Set([...prev, selectedJob.id]))
      // Force re-render to update button state
      setJobs([...jobs])
    }
  }

  const [jobIdToApplicationId, setJobIdToApplicationId] = useState<Record<string, string>>({})
  const [withdrawingJobs, setWithdrawingJobs] = useState<Set<string>>(new Set())

  const handleUndoApply = async (jobId: string) => {
    try {
      // Prevent multiple simultaneous withdrawals
      if (withdrawingJobs.has(jobId)) {
        return
      }
      
      setWithdrawingJobs(prev => new Set([...prev, jobId]))
      console.log('🔄 Attempting to withdraw Gulf application for job:', jobId)
      
      // Try known applicationId first
      let applicationId = jobIdToApplicationId[jobId]
      console.log('📋 Known applicationId:', applicationId)

      // Fallback: fetch applications and find by jobId
      if (!applicationId) {
        console.log('🔍 ApplicationId not found, fetching applications...')
        
        // First try to refresh user data to get the latest application mapping
        try {
          await fetchUserData()
        } catch (fetchError) {
          console.error('❌ Error fetching user data:', fetchError)
        }
        
        // Check again after refresh
        applicationId = jobIdToApplicationId[jobId]
        console.log('📋 ApplicationId after refresh:', applicationId)
        
        // If still not found, do a direct API call
        if (!applicationId) {
          try {
            const appsResp = await apiService.getGulfJobApplications()
            console.log('📊 Gulf applications response:', appsResp)
            
            if (appsResp && appsResp.success && Array.isArray(appsResp.data)) {
              const applications = appsResp.data.applications || appsResp.data
              console.log('📋 All Gulf applications:', applications.map((a: any) => ({ id: a.id, jobId: a.jobId, status: a.status })))
              
              // Look for any application with this jobId
              const found = applications.find((a: any) => a.jobId === jobId)
              console.log('🎯 Found Gulf application:', found)
              
              if (found?.id) {
                applicationId = found.id
                setJobIdToApplicationId(prev => ({ ...prev, [jobId]: found.id }))
                console.log('✅ Using applicationId:', applicationId)
              }
            }
          } catch (apiError) {
            console.error('❌ Error fetching Gulf applications:', apiError)
          }
        }
      }

      if (!applicationId) {
        console.error('❌ No Gulf application found for jobId:', jobId)
        toast.error('Could not locate your application to withdraw. Please refresh the page and try again.')
        return
      }

      console.log('🚀 Withdrawing Gulf application:', applicationId)
      const resp = await apiService.updateApplicationStatus(applicationId, 'withdrawn')
      
      if (resp && resp.success) {
        toast.success('Application withdrawn successfully')
        // Reflect in UI: mark as not applied
        setAppliedJobs(prev => {
          const next = new Set(prev)
          next.delete(jobId)
          return next
        })
        // Remove from application ID mapping
        setJobIdToApplicationId(prev => {
          const next = { ...prev }
          delete next[jobId]
          return next
        })
        setJobs([...jobs])
        console.log('✅ Gulf application withdrawn successfully')
      } else {
        console.error('❌ Gulf withdrawal failed:', resp)
        toast.error(resp?.message || 'Failed to withdraw application')
      }
    } catch (error) {
      console.error('❌ Error withdrawing Gulf application:', error)
      toast.error('Failed to withdraw application. Please try again.')
    } finally {
      // Remove from withdrawing state
      setWithdrawingJobs(prev => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
    }
  }

  // Scroll event listener for sticky search bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setIsStickyVisible(scrollY > 200)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const experienceLevels = [
    "Fresher",
    "1-3 years",
    "3-5 years",
    "5-8 years",
    "8-12 years",
    "12+ years",
  ]

  const jobTypes = [
    "Full-time",
    "Part-time",
    "Contract",
    "Internship",
    "Remote",
    "Work from home",
  ]

  const locations = [
    "Dubai",
    "Abu Dhabi",
    "Sharjah",
    "Doha",
    "Riyadh",
    "Jeddah",
    "Kuwait City",
    "Manama",
    "Muscat",
    "Remote",
    "Work from home",
  ]

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    let filtered = [...jobs]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchLower) ||
        job.company.name.toLowerCase().includes(searchLower) ||
        job.skills.some(skill => skill.toLowerCase().includes(searchLower))
      )
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(filters.location.toLowerCase())
      )
    }

    // Experience level filter
    if (filters.experienceLevels.length > 0) {
      filtered = filtered.filter(job =>
        filters.experienceLevels.some(level => job.experience.includes(level))
      )
    }

    // Job type filter
    if (filters.jobTypes.length > 0) {
      filtered = filtered.filter(job =>
        filters.jobTypes.some(filterType => 
          job.type.toLowerCase() === filterType.toLowerCase()
        )
      )
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(job => job.category === filters.category)
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(job => job.type.toLowerCase() === filters.type.toLowerCase())
    }

    // Industry
    if (filters.industry) {
      const q = filters.industry.toLowerCase()
      const synonyms = q.includes('information technology') || q === 'it'
        ? ['information technology','technology','tech','software','it']
        : [q]
      filtered = filtered.filter(job => {
        const ind = (job as any).company?.industry
        if (!ind) return false
        const low = String(ind).toLowerCase()
        return synonyms.some(s => low.includes(s))
      })
    }

    // Company Type
    if (filters.companyType) {
      const q = filters.companyType.toLowerCase()
      filtered = filtered.filter(job => {
        const ct = (job as any).company?.companyType
        return ct ? String(ct).toLowerCase() === q : false
      })
    }

    // Work Mode
    if (filters.workMode) {
      const q = filters.workMode.toLowerCase().includes('home') ? 'remote' : filters.workMode.toLowerCase()
      filtered = filtered.filter(job => {
        const wm = String(job.workMode || (job as any).remoteWork || '').toLowerCase()
        if (!wm) return false
        if (q === 'remote') return wm.includes('remote') || wm.includes('work from home')
        return wm.includes(q)
      })
    }

    // Sort jobs
    switch (sortBy) {
      case "recent":
        filtered.sort((a, b) => new Date(b.posted).getTime() - new Date(a.posted).getTime())
        break
      case "salary":
        filtered.sort((a, b) => {
          const salaryA = parseInt(a.salary.split('-')[0].replace(/\D/g, ''))
          const salaryB = parseInt(b.salary.split('-')[0].replace(/\D/g, ''))
          return salaryB - salaryA
        })
        break
      case "applicants":
        filtered.sort((a, b) => b.applicants - a.applicants)
        break
      case "rating":
        filtered.sort((a, b) => b.companyRating - a.companyRating)
        break
    }

    return filtered
  }, [jobs, filters, sortBy])

  // Record search in database
  const recordSearch = useCallback(async (searchQuery: string) => {
    if (!user || !searchQuery.trim()) return;

    try {
      const searchData = {
        searchQuery: searchQuery.trim(),
        filters: {
          location: filters.location,
          experienceLevels: filters.experienceLevels,
          jobTypes: filters.jobTypes,
          salaryRange: filters.salaryRange,
          category: filters.category,
          type: filters.type
        },
        resultsCount: filteredJobs.length,
        searchType: 'gulf_job_search'
      };

      await apiService.recordSearch(searchData);
    } catch (error) {
      console.error('Error recording Gulf search:', error);
    }
  }, [user, filters, filteredJobs.length]);

  // Filter functions
  const handleFilterChange = useCallback((filterType: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))

    // Record search when search query changes
    if (filterType === 'search' && value && user) {
      recordSearch(value);
    }
  }, [user, recordSearch])

  const clearFilters = useCallback(() => {
    setFilters({
      search: "",
      location: "",
      experienceLevels: [],
      jobTypes: [],
      locations: [],
      salaryRange: "",
      category: "",
      type: "",
    })
  }, [])

  const getSectorColor = (sector: string) => {
    const colors: { [key: string]: string } = {
      software: "from-blue-500 to-cyan-500",
      product: "from-purple-500 to-pink-500",
      data: "from-green-500 to-emerald-500",
      design: "from-orange-500 to-red-500",
      devops: "from-indigo-500 to-purple-500",
      sales: "from-yellow-500 to-orange-500",
      marketing: "from-pink-500 to-rose-500",
      default: "from-slate-500 to-gray-500"
    }
    return colors[sector] || colors.default
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

  // Show access denied message for non-Gulf users
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/30 to-teal-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <GulfNavbar />
        <div className="flex items-center justify-center min-h-screen pt-20">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Restricted</h1>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                This page is only available for Gulf region users. You need to have a Gulf account to access Gulf job listings.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => window.location.href = '/gulf-opportunities'}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Go to Gulf Opportunities
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/jobs'}
                  className="w-full"
                >
                  Browse Regular Jobs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-green-100 to-yellow-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <GulfNavbar />
      
      {/* Hero Section */}
      <div className="relative pt-20 pb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Globe className="w-4 h-4" />
              <span>Gulf Region Jobs</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Find Your Dream Job in the
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"> Gulf</span>
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
              Explore thousands of job opportunities in the Gulf region. Enjoy tax-free salaries, world-class benefits, and unparalleled growth opportunities.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/jobseeker-gulf-dashboard">
                <Button variant="outline" size="lg" className="border-green-600 text-green-600 hover:bg-green-50">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Search Bar */}
        <div className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 mb-8 transition-all duration-300 ${isStickyVisible ? 'sticky top-4 z-50' : ''}`}>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search Gulf jobs, companies, or keywords..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 h-12 border-0 bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-600"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={filters.location} onValueChange={(value) => handleFilterChange('location', value)}>
                <SelectTrigger className="w-48 h-12 border-0 bg-slate-50 dark:bg-slate-700">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="h-12 px-6 border-0 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Experience Level */}
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Experience Level</h3>
                <div className="space-y-2">
                  {experienceLevels.map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={level}
                        checked={filters.experienceLevels.includes(level)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleFilterChange('experienceLevels', [...filters.experienceLevels, level])
                          } else {
                            handleFilterChange('experienceLevels', filters.experienceLevels.filter(l => l !== level))
                          }
                        }}
                      />
                      <label htmlFor={level} className="text-sm text-slate-600 dark:text-slate-300">
                        {level}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Job Type */}
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Job Type</h3>
                <div className="space-y-2">
                  {jobTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={filters.jobTypes.includes(type)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleFilterChange('jobTypes', [...filters.jobTypes, type])
                          } else {
                            handleFilterChange('jobTypes', filters.jobTypes.filter(t => t !== type))
                          }
                        }}
                      />
                      <label htmlFor={type} className="text-sm text-slate-600 dark:text-slate-300">
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Salary Range */}
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Salary Range</h3>
                <Select value={filters.salaryRange} onValueChange={(value) => handleFilterChange('salaryRange', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-5000">0-5K AED</SelectItem>
                    <SelectItem value="5000-10000">5K-10K AED</SelectItem>
                    <SelectItem value="10000-20000">10K-20K AED</SelectItem>
                    <SelectItem value="20000-50000">20K-50K AED</SelectItem>
                    <SelectItem value="50000+">50K+ AED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {filteredJobs.length} Gulf Jobs Found
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Showing results for your Gulf job search
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <span className="text-sm text-slate-600 dark:text-slate-300">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="salary">Highest Salary</SelectItem>
                <SelectItem value="applicants">Most Applicants</SelectItem>
                <SelectItem value="rating">Company Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preferred Jobs Section */}
        {user && preferredJobs.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Star className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Gulf Jobs Matching Your Preferences
              </h2>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {preferredJobs.length}
              </Badge>
            </div>
            <div className="space-y-4">
              {preferredJobs.slice(0, 3).map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/gulf-jobs/${job.id}`}>
                    <Card className="group cursor-pointer border-0 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 backdrop-blur-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-l-4 border-l-green-500">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <Avatar className="w-12 h-12 ring-2 ring-green-200 group-hover:ring-4 transition-all duration-300">
                              <AvatarImage src={job.logo} alt={job.company.name} />
                              <AvatarFallback className="text-sm font-bold">{job.company.name[0]}</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-green-600 transition-colors line-clamp-2">
                                    {job.title}
                                  </h3>
                                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                                    {job.company.name}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                    <Star className="w-3 h-3 mr-1" />
                                    Preferred
                                  </Badge>
                                  {job.urgent && (
                                    <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                                      Urgent
                                    </Badge>
                                  )}
                                  {job.featured && (
                                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                                      Featured
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{job.location}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Briefcase className="w-4 h-4" />
                                  <span>{job.experience}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="w-4 h-4" />
                                  <span>{job.salary}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{job.posted}</span>
                                </div>
                              </div>

                              {job.skills && job.skills.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {job.skills.slice(0, 3).map((skill, skillIndex) => (
                                    <Badge key={skillIndex} variant="outline" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {job.skills.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{job.skills.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}

                              <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2">
                                {job.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
            {preferredJobs.length > 3 && (
              <div className="text-center mt-4">
                <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                  View All {preferredJobs.length} Preferred Jobs
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Jobs Grid */}
        <div className="space-y-6">
          {jobsLoading ? (
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-green-200 dark:border-green-800">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                          <div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2"></div>
                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                          </div>
                        </div>
                      </div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-green-200 dark:border-green-800">
              <CardContent className="p-12 text-center">
                <Briefcase className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  No Gulf jobs found
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  Try adjusting your search criteria or filters
                </p>
                <Button onClick={clearFilters} className="bg-green-600 hover:bg-green-700">
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/gulf-jobs/${job.id}`}>
                    <Card className="group cursor-pointer border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-green-200 dark:border-green-800">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <Avatar className="w-12 h-12 ring-2 ring-white/50 group-hover:ring-4 transition-all duration-300">
                              <AvatarImage src={job.logo} alt={job.company.name} />
                              <AvatarFallback className="text-sm font-bold">{job.company.name[0]}</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-green-600 transition-colors line-clamp-2">
                                    {job.title}
                                  </h3>
                                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                                    {job.company.name}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                  {job.urgent && (
                                    <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                                      Urgent
                                    </Badge>
                                  )}
                                  {job.featured && (
                                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                      Featured
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{job.location}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Briefcase className="w-4 h-4" />
                                  <span>{job.experience}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="w-4 h-4" />
                                  <span>{job.salary}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{job.posted}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Users className="w-4 h-4" />
                                  <span>{job.applicants} applicants</span>
                                </div>
                              </div>

                              {/* Internship-specific information */}
                              {job.type.toLowerCase() === 'internship' && (job.duration || job.startDate || job.workMode) && (
                                <div className="flex flex-wrap items-center gap-4 text-sm text-green-600 dark:text-green-400 mb-3 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                  {job.duration && (
                                    <div className="flex items-center space-x-1">
                                      <Calendar className="w-4 h-4" />
                                      <span className="font-medium">{job.duration}</span>
                                    </div>
                                  )}
                                  {job.startDate && (
                                    <div className="flex items-center space-x-1">
                                      <Clock className="w-4 h-4" />
                                      <span>Starts {new Date(job.startDate).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                  {job.workMode && (
                                    <div className="flex items-center space-x-1">
                                      <MapPin className="w-4 h-4" />
                                      <span className="capitalize">{job.workMode.replace('-', ' ')}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="flex flex-wrap gap-2 mb-4">
                                {job.skills.slice(0, 3).map((skill, skillIndex) => (
                                  <Badge key={skillIndex} variant="secondary" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {job.skills.length > 3 && (
                                  <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-slate-200 text-xs">
                                    +{job.skills.length - 3} more
                                  </Badge>
                                )}
                              </div>

                              <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-4">
                                {job.description}
                              </p>

                              {/* Job Photos Showcase */}
                              {job.photos && job.photos.length > 0 && (
                                <div className="mb-4">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Camera className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs text-slate-500 font-medium">Job Showcase</span>
                                  </div>
                                  <div className="flex space-x-2 overflow-x-auto">
                                    {job.photos.slice(0, 3).map((photo: any, photoIndex: number) => (
                                      <div key={photo.id} className="flex-shrink-0">
                                        <img
                                          src={photo.fileUrl}
                                          alt={photo.altText || `Job photo ${photoIndex + 1}`}
                                          className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                                        />
                                      </div>
                                    ))}
                                    {job.photos.length > 3 && (
                                      <div className="flex-shrink-0 w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                        <span className="text-xs text-slate-500 font-medium">
                                          +{job.photos.length - 3}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col space-y-2 ml-4">
                            <Button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleSaveJob(job.id)
                              }}
                              variant="outline"
                              size="sm"
                              className="text-xs border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                            >
                              {savedJobs.has(job.id) ? (
                                <>
                                  <BookmarkCheck className="w-4 h-4 mr-1" />
                                  Saved
                                </>
                              ) : (
                                <>
                                  <Bookmark className="w-4 h-4 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleApply(job.id)
                              }}
                              className={`text-xs sm:text-sm ${
                                appliedJobs.has(job.id)
                                  ? 'bg-green-600 hover:bg-green-700 cursor-default' 
                                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                              }`}
                              disabled={appliedJobs.has(job.id)}
                            >
                              {appliedJobs.has(job.id) ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Applied
                                </>
                              ) : (
                                'Apply Now'
                              )}
                            </Button>
                            
                            {/* Show undo button if already applied */}
                            {appliedJobs.has(job.id) && (
                              <Button
                                onClick={async (e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  await handleUndoApply(job.id)
                                }}
                                variant="outline"
                                size="sm"
                                disabled={withdrawingJobs.has(job.id)}
                                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-700 disabled:opacity-50"
                              >
                                <X className="w-3 h-3 mr-1" />
                                {withdrawingJobs.has(job.id) ? 'Withdrawing...' : 'Undo'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-600/5 via-yellow-600/5 to-green-600/5"></div>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-green-500/10 to-yellow-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-br from-yellow-500/10 to-green-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Gulf Jobs</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Your gateway to exciting career opportunities in the Gulf region. Connect with top employers and find your dream job.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center hover:bg-green-600/20 transition-colors cursor-pointer">
                  <span className="text-sm font-bold">f</span>
                </div>
                <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center hover:bg-green-600/20 transition-colors cursor-pointer">
                  <span className="text-sm font-bold">t</span>
                </div>
                <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center hover:bg-green-600/20 transition-colors cursor-pointer">
                  <span className="text-sm font-bold">in</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-white">For Job Seekers</h4>
              <ul className="space-y-3 text-slate-300">
                <li><Link href="/gulf-jobs" className="hover:text-green-400 transition-colors">Browse Gulf Jobs</Link></li>
                <li><Link href="/gulf-companies" className="hover:text-green-400 transition-colors">Gulf Companies</Link></li>
                <li><Link href="/gulf-opportunities" className="hover:text-green-400 transition-colors">Gulf Opportunities</Link></li>
                <li><Link href="/jobseeker-gulf-dashboard" className="hover:text-green-400 transition-colors">Gulf Dashboard</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-white">For Employers</h4>
              <ul className="space-y-3 text-slate-300">
                <li><Link href="/gulf-dashboard" className="hover:text-green-400 transition-colors">Gulf Employer Dashboard</Link></li>
                <li><Link href="/gulf-dashboard/post-job" className="hover:text-green-400 transition-colors">Post Gulf Job</Link></li>
                <li><Link href="/gulf-dashboard/applications" className="hover:text-green-400 transition-colors">View Applications</Link></li>
                <li><Link href="/gulf-dashboard/analytics" className="hover:text-green-400 transition-colors">Analytics</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-white">Support</h4>
              <ul className="space-y-3 text-slate-300">
                <li><Link href="/help" className="hover:text-green-400 transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-green-400 transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-green-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-green-400 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-700/50 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-slate-400 text-sm mb-4 md:mb-0">
                &copy; 2025 Gulf JobPortal. All rights reserved.
              </p>
              <div className="flex items-center space-x-6 text-sm text-slate-400">
                <span>Made with ❤️ for Gulf professionals</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Job Application Dialog */}
      {selectedJob && (
        <JobApplicationDialog
          isOpen={showApplicationDialog}
          onClose={() => setShowApplicationDialog(false)}
          job={selectedJob}
          onSuccess={handleApplicationSuccess}
          isGulfJob={true}
        />
      )}
    </div>
  )
}
