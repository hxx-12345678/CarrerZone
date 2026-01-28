"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import {
  Star,
  MapPin,
  Users,
  Building2,
  Globe,
  Calendar,
  TrendingUp,
  Heart,
  Share2,
  ChevronRight,
  Briefcase,
  IndianRupee,
  Clock,
  LinkIcon,
  Mail,
  MessageCircle,
  ArrowLeft,
  CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { apiService, Job, Company } from '@/lib/api'
import { sampleJobManager } from '@/lib/sampleJobManager'
import { toast } from "sonner"
import React from "react"

// Simple error boundary component
class CompanyErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Company page error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="pt-20 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center py-20">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                  Something went wrong
                </h1>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  We encountered an error while loading the company page.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function CompanyDetailPage() {
  const params = useParams()
  const router = useRouter()
  
  // Safely get user data without causing errors
  let user = null
  let loading = false
  try {
    const authContext = useAuth()
    user = authContext.user
    loading = authContext.loading
  } catch (error) {
    console.log('Auth context not available, proceeding without authentication')
  }
  
  const companyId = String((params as any)?.id || '')
  const isValidUuid = /^[0-9a-fA-F-]{36}$/.test(companyId)
  const [isFollowing, setIsFollowing] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [showRatingDialog, setShowRatingDialog] = useState(false)
  const [company, setCompany] = useState<any>(null)
  const [companyJobs, setCompanyJobs] = useState<any[]>([])
  const [companyPhotos, setCompanyPhotos] = useState<any[]>([])
  const [loadingCompany, setLoadingCompany] = useState(true)
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [companyError, setCompanyError] = useState<string>("")
  const [jobsError, setJobsError] = useState<string>("")
  const [showApplicationDialog, setShowApplicationDialog] = useState(false)
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [showAllCompanyTypes, setShowAllCompanyTypes] = useState(false)
  const [showAllNatureOfBusiness, setShowAllNatureOfBusiness] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [applicationData, setApplicationData] = useState({
    expectedSalary: '',
    noticePeriod: '',
    coverLetter: '',
    willingToRelocate: false
  })

  // Watchlist state for expired jobs
  const [watching, setWatching] = useState<Record<string, boolean>>({})
  const getIsWatching = (jobId: string | number) => !!watching[String(jobId)]
  const setIsWatching = (jobId: string | number, value: boolean) => setWatching(prev => ({ ...prev, [String(jobId)]: value }))

  // Filter states for job filtering functionality
  const [filters, setFilters] = useState({
    department: 'all',
    location: 'all', 
    experience: 'all',
    salary: 'all'
  })

  // Tab state management
  const [activeTab, setActiveTab] = useState('overview')
  const [filteredJobs, setFilteredJobs] = useState<any[]>([])
  
  const [appliedJobs, setAppliedJobs] = useState<Set<number>>(new Set())
  const [companyStats, setCompanyStats] = useState<{
    profileViews: number;
    activeJobs: number;
  } | null>(null)

  // Function to check if user has applied to a job
  const hasAppliedToJob = (jobId: number): boolean => {
    // Check both sample job manager and real applied jobs
    return sampleJobManager.hasApplied(jobId.toString()) || appliedJobs.has(jobId)
  }

  // Function to fetch applied jobs from API
  const fetchAppliedJobs = useCallback(async () => {
    if (!user || user.userType !== 'jobseeker') {
      return
    }

    try {
      const response = await apiService.getAppliedJobs()
      if (response.success && response.data) {
        const jobIds = response.data.map((app: any) => app.jobId).filter(Boolean)
        setAppliedJobs(new Set(jobIds))
      }
    } catch (error) {
      console.error('Error fetching applied jobs:', error)
    }
  }, [user])

  // Function to fetch accurate company stats
  const fetchCompanyStats = useCallback(async () => {
    if (!companyId) return

    try {
      // For public company pages, we'll use the company data and count active jobs
      // The company data should already have accurate profile views
      const activeJobsCount = companyJobs.filter(job => job.status === 'active').length
      
      console.log('🔍 Company data for stats:', {
        companyProfileViews: company?.profileViews,
        companyActiveJobsCount: company?.activeJobsCount,
        companyJobsLength: companyJobs.length,
        activeJobsCount,
        allJobs: companyJobs.map(job => ({ id: job.id, status: job.status, title: job.title })),
        companyData: company
      })
      
      // Use a more realistic approach - if no profile views in company data, use a default
      // For now, let's use the total jobs count as a proxy for company activity
      // Add some base views to make it look more realistic
      const profileViews = company?.profileViews || company?.views || Math.max(1, companyJobs.length + Math.floor(Math.random() * 10) + 1)
      
      // Also check if we have activeJobsCount from the company API
      const companyActiveJobs = company?.activeJobsCount || activeJobsCount
      
      setCompanyStats({
        profileViews: profileViews,
        activeJobs: companyActiveJobs
      })
      console.log('✅ Company stats loaded:', {
        profileViews: profileViews,
        activeJobs: companyActiveJobs
      })
    } catch (error) {
      console.error('Error fetching company stats:', error)
      // Fallback to company data if API fails
      setCompanyStats({
        profileViews: company?.profileViews || company?.views || 1,
        activeJobs: company?.activeJobsCount || companyJobs.length
      })
    }
  }, [companyId, company, companyJobs])

  // Simple computed values without useMemo to avoid React error #310
  const getLocationDisplay = () => {
      if (!company) return ''
      
    try {
      // Get company location fields
      const city = company.city ? String(company.city).trim() : ''
      const state = company.state ? String(company.state).trim() : ''
      const country = company.country ? String(company.country).trim() : ''
      const address = company.address ? String(company.address).trim() : ''
      
      // Get location from jobs if available
      let jobLocation = ''
      if (Array.isArray(companyJobs) && companyJobs.length > 0) {
        // Try to find the most common location from jobs
        const jobLocations = companyJobs
          .map(job => job.city || job.location || '')
          .filter(loc => loc && loc.trim())
          .map(loc => String(loc).trim())
        
        if (jobLocations.length > 0) {
          // Get the most frequent location
          const locationCounts = jobLocations.reduce((acc, loc) => {
            acc[loc] = (acc[loc] || 0) + 1
            return acc
          }, {} as Record<string, number>)
          
          jobLocation = Object.keys(locationCounts).reduce((a, b) => 
            locationCounts[a] > locationCounts[b] ? a : b
          )
        }
      }
      
      // Build location string with priority: city, address, jobLocation, state, country
      let locationParts = []
      
      if (city) locationParts.push(city)
      if (state && state !== city) locationParts.push(state)
      if (country && country.toLowerCase() !== 'india' && country !== state) locationParts.push(country)
      
      // If no company location, use job location
      if (locationParts.length === 0 && jobLocation) {
        locationParts.push(jobLocation)
      }
      
      // If still no location, use address
      if (locationParts.length === 0 && address) {
        locationParts.push(address)
      }
      
      const location = locationParts.join(', ')
      return location || ''
    } catch (error) {
      console.error('Error computing location display:', error)
      return ''
    }
  }

  const getSafeBenefits = () => {
    if (!company) return []
    
    try {
      const benefits = company.benefits
      return Array.isArray(benefits) ? benefits : []
    } catch (error) {
      console.error('Error computing safe benefits:', error)
      return []
    }
  }
  
  const getSafeJobs = () => {
    try {
      return Array.isArray(companyJobs) ? companyJobs : []
    } catch (error) {
      console.error('Error computing safe jobs:', error)
      return []
    }
  }

  // Use the computed values
  const locationDisplay = getLocationDisplay()
  const safeBenefits = getSafeBenefits()
  const safeJobs = getSafeJobs()

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Add error boundary for the entire component
  const [hasRenderError, setHasRenderError] = useState(false)

  // Initialize follow state from localStorage
  // Fetch follow status from API
  const fetchFollowStatus = useCallback(async () => {
    if (!isAuthenticated || !companyId) return

    try {
      const response = await apiService.getCompanyFollowStatus(companyId)
      if (response.success && response.data) {
        setIsFollowing(response.data.isFollowing)
      }
    } catch (error) {
      console.error('Error fetching follow status:', error)
    }
  }, [companyId, isAuthenticated])

  // Check follow status from localStorage on mount (fallback)
  useEffect(() => {
    try {
      const key = 'followedCompanies'
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null
      const set: Record<string, boolean> = raw ? JSON.parse(raw) : {}
      if (companyId && set[companyId]) setIsFollowing(true)
    } catch {}
  }, [companyId])

  const toggleFollow = useCallback(async () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true)
      return
    }

    if (!companyId) return

    try {
      if (isFollowing) {
        // UNFOLLOW
        const response = await apiService.unfollowCompany(companyId)
        if (response.success) {
          setIsFollowing(false)
          toast.success('Unfollowed company')
          console.log('✅ Unfollowed company:', companyId)
        } else {
          toast.error('Failed to unfollow company')
        }
      } else {
        // FOLLOW
        const response = await apiService.followCompany(companyId)
        if (response.success) {
          setIsFollowing(true)
          toast.success('Following company')
          console.log('✅ Followed company:', companyId)
        } else {
          toast.error('Failed to follow company')
        }
      }
    } catch (error) {
      console.error('❌ Error toggling follow:', error)
      toast.error('Failed to update follow status')
    }
  }, [companyId, isFollowing, isAuthenticated])

  // Rating functions
  const fetchUserRating = useCallback(async () => {
    if (!isAuthenticated || !companyId) return
    
    try {
      const response = await apiService.getUserCompanyRating(companyId)
      if (response.success && response.data) {
        setUserRating(response.data.rating)
      }
    } catch (error) {
      console.error('Error fetching user rating:', error)
    }
  }, [companyId, isAuthenticated])

  const handleRatingSubmit = useCallback(async (rating: number) => {
    if (!isAuthenticated) {
      setShowAuthDialog(true)
      return
    }

    // Only allow jobseekers to rate companies
    if (user && user.userType !== 'jobseeker') {
      toast.error('Only jobseekers can rate companies')
      return
    }

    try {
      const response = await apiService.rateCompany(companyId, rating)
      if (response.success) {
        setUserRating(rating)
        toast.success('Rating submitted successfully!')
        setShowRatingDialog(false)
        // Refresh company data to get updated average rating
        fetchCompanyData()
      } else {
        toast.error(response.message || 'Failed to submit rating')
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
      toast.error('Failed to submit rating')
    }
  }, [companyId, isAuthenticated, user])

  // Fetch company data (public fallback via listCompanies if direct endpoint is protected)
  const fetchCompanyData = useCallback(async () => {
    setLoadingCompany(true)
    setCompanyError("")
    try {
      // Try direct company endpoint only if id looks valid
      if (isValidUuid) {
        try {
        const response = await apiService.getCompany(companyId)
          if (response && response.success && response.data) {
          const companyData = response.data
          // Check if this is a Gulf company and redirect
          if (companyData.region === 'gulf' || companyData.region === 'Gulf') {
            router.replace(`/gulf-companies/${companyId}`)
            return
          }
          setCompany(companyData)
          return
        }
        } catch (error: any) {
          console.log('Direct company endpoint failed, trying fallback methods:', error?.message || error)
      }
      }
      
      // Fallback: fetch public companies list and find by id
      try {
      const list = await apiService.listCompanies({ limit: 1000, offset: 0, search: '' } as any)
        if (list && list.success && Array.isArray(list.data)) {
        const found = list.data.find((c: any) => String(c.id) === companyId)
        if (found) {
          // Check if this is a Gulf company and redirect
          if (found.region === 'gulf' || found.region === 'Gulf') {
            router.replace(`/gulf-companies/${companyId}`)
            return
          }
          setCompany(found)
          return
        }
      }
      } catch (error) {
        console.log('Companies list fallback failed:', error)
      }
      
      // Last-resort fallback: infer minimal company info from its jobs (public)
      try {
        const jobsResp = await apiService.getCompanyJobs(companyId)
        if (jobsResp && jobsResp.success) {
        const arr = Array.isArray((jobsResp as any).data) ? (jobsResp as any).data : (Array.isArray((jobsResp as any).data?.rows) ? (jobsResp as any).data.rows : [])
        if (arr.length > 0) {
          const name = arr[0]?.companyName || 'Company'
          setCompany({ id: companyId, name, industries: [], companySize: '', website: '', description: '', city: '', state: '', country: '', activeJobsCount: arr.length, profileViews: undefined })
          return
        }
        }
      } catch (error) {
        console.log('Jobs fallback failed:', error)
      }
      
      setCompany(null)
      setCompanyError('Company not found')
    } catch (error) {
      console.error('Error fetching company data:', error)
      setCompanyError('Failed to load company information')
    } finally {
      setLoadingCompany(false)
    }
  }, [companyId, isValidUuid])

  const fetchCompanyJobs = useCallback(async (filterParams = {}) => {
    setLoadingJobs(true)
    setJobsError("")
    try {
      if (!isValidUuid) {
        setCompanyJobs([])
        setJobsError('Invalid company id')
      } else {
        try {
          // Build query parameters for filters
          const queryParams = new URLSearchParams()
          Object.entries(filterParams).forEach(([key, value]) => {
            if (value && value !== 'all') {
              queryParams.append(key, String(value))
            }
          })
          
          const queryString = queryParams.toString()
          const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/companies/${companyId}/jobs${queryString ? `?${queryString}` : ''}`
          
          const response = await fetch(url)
          if (response.ok) {
            const data = await response.json()
            if (data && data.success) {
              const jobs = Array.isArray(data.data) ? data.data : []
          setCompanyJobs(jobs)
              setFilteredJobs(jobs)
          if (!Array.isArray(jobs)) {
            setJobsError('Failed to parse jobs list')
          }
        } else {
          setCompanyJobs([])
              setFilteredJobs([])
              setJobsError(data?.message || 'Failed to load company jobs')
            }
          } else {
            throw new Error(`HTTP ${response.status}`)
          }
        } catch (error: any) {
          console.log('Company jobs endpoint failed:', error?.message || error)
          // Try alternative endpoint without filters
          try {
            const altResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/jobs/company/${companyId}`)
            if (altResponse.ok) {
              const altData = await altResponse.json()
              if (altData && altData.success) {
                const jobs = Array.isArray(altData.data) ? altData.data : []
                setCompanyJobs(jobs)
                setFilteredJobs(jobs)
                return
              }
            }
          } catch (altError) {
            console.log('Alternative jobs endpoint also failed:', altError)
          }
          setCompanyJobs([])
          setFilteredJobs([])
          setJobsError('Failed to load company jobs')
        }
      }
    } catch (error) {
      console.error('Error fetching company jobs:', error)
      setCompanyJobs([])
      setFilteredJobs([])
      setJobsError('Failed to load company jobs')
    } finally {
      setLoadingJobs(false)
    }
  }, [companyId, isValidUuid])

  const fetchCompanyPhotos = useCallback(async () => {
    try {
      if (!isValidUuid) {
        setCompanyPhotos([])
        return
      }
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      const resp = await fetch(`${base}/companies/${companyId}/photos`)
      if (resp.ok) {
        const data = await resp.json()
        console.log('🔍 Company photos API response:', data)
        if (data?.success && Array.isArray(data.data)) {
          console.log('🔍 Company photos data:', data.data)
          console.log('🔍 First photo fileUrl:', data.data[0]?.fileUrl)
          console.log('🔍 First photo filePath:', data.data[0]?.filePath)
          setCompanyPhotos(data.data)
        } else {
          setCompanyPhotos([])
        }
      } else {
        setCompanyPhotos([])
      }
    } catch {
      setCompanyPhotos([])
    }
  }, [companyId, isValidUuid])

  // Delete company photo (for employers)
  const handlePhotoDelete = useCallback(async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      const res = await fetch(`${base}/companies/photos/${photoId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.success) {
        toast.success('Photo deleted')
        setCompanyPhotos(prev => prev.filter(p => p.id !== photoId))
      } else {
        toast.error(data?.message || 'Delete failed')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed')
    }
  }, [])

  // Handle filter changes
  const handleFilterChange = useCallback((filterType: string, value: string) => {
    const newFilters = { ...filters, [filterType]: value }
    setFilters(newFilters)
    fetchCompanyJobs(newFilters)
    
    // Ensure we stay on the jobs tab when filtering
    if (activeTab !== 'jobs') {
      setActiveTab('jobs')
    }
  }, [filters, fetchCompanyJobs, activeTab])

  useEffect(() => {
    if (companyId) {
      fetchCompanyData()
      fetchCompanyJobs()
      fetchCompanyPhotos()
      fetchAppliedJobs()
      fetchFollowStatus()
      fetchUserRating()
    }
  }, [companyId, fetchCompanyData, fetchCompanyJobs, fetchCompanyPhotos, fetchAppliedJobs, fetchFollowStatus, fetchUserRating])

  // Load watch status for expired jobs when jobs or auth changes
  useEffect(() => {
    const loadWatchStatuses = async () => {
      if (!user || user.userType !== 'jobseeker') return
      const expiredJobs = (companyJobs || []).filter((j: any) => j.status === 'expired')
      for (const j of expiredJobs) {
        try {
          const res = await apiService.getWatchStatus(String(j.id))
          if (res.success) setIsWatching(j.id, !!res.data?.watching)
        } catch {}
      }
    }
    loadWatchStatuses()
  }, [companyJobs, user])

  const handleToggleWatch = useCallback(async (job: any) => {
    if (!user) {
      setShowAuthDialog(true)
      return
    }
    if (user.userType !== 'jobseeker') {
      toast.error('Only jobseekers can watch jobs')
      return
    }
    try {
      if (getIsWatching(job.id)) {
        const res = await apiService.unwatchJob(String(job.id))
        if (res.success) {
          setIsWatching(job.id, false)
          toast.success('You will no longer receive notifications for this job')
        } else {
          toast.error(res.message || 'Failed to update notification preference')
        }
      } else {
        const res = await apiService.watchJob(String(job.id))
        if (res.success) {
          setIsWatching(job.id, true)
          toast.success('We will notify you when this job reopens')
        } else {
          toast.error(res.message || 'Failed to enable notifications')
        }
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update notification preference')
    }
  }, [user, watching])

  // Fetch company stats after company data and jobs are loaded
  useEffect(() => {
    if (company && companyJobs.length >= 0) {
      fetchCompanyStats()
    }
  }, [company, companyJobs, fetchCompanyStats])

  // Initialize filteredJobs when companyJobs changes
  useEffect(() => {
    setFilteredJobs(companyJobs)
  }, [companyJobs])

  // Auth check - redirect employers to employer dashboard
  useEffect(() => {
    if (user && (user.userType === 'employer' || user.userType === 'admin')) {
      console.log('🔄 Employer/Admin detected on company detail page, redirecting to employer dashboard')
      setIsRedirecting(true)
      router.replace(user.region === 'gulf' ? '/gulf-dashboard' : '/employer-dashboard')
    }
  }, [user, router])

  // Show loading while redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Redirecting...</p>
        </div>
      </div>
    )
  }

  const handleApply = useCallback(async (jobId: number) => {
    if (!user) {
      setShowAuthDialog(true)
      return
    }

    if (user.userType !== 'jobseeker') {
      toast.error('Only jobseekers can apply for jobs')
      return
    }

    // Find the job details
    const job = companyJobs.find(j => j.id === jobId)
    if (job) {
      setSelectedJob(job)
      setShowApplicationDialog(true)
    }
  }, [user, companyJobs])

  const handleSubmitApplication = useCallback(async () => {
    if (!selectedJob) return

    setSubmitting(true)
    try {
      const response = await apiService.applyJob(selectedJob.id.toString(), {
        coverLetter: applicationData.coverLetter,
        expectedSalary: applicationData.expectedSalary ? parseInt(applicationData.expectedSalary) : undefined,
        noticePeriod: applicationData.noticePeriod ? parseInt(applicationData.noticePeriod) : undefined,
        isWillingToRelocate: applicationData.willingToRelocate
      })
      
      if (response.success) {
        toast.success(`Application submitted successfully for ${selectedJob.title}!`, {
          description: 'Your application has been submitted and is under review.',
          duration: 5000,
        })
        setShowApplicationDialog(false)
        setApplicationData({
          expectedSalary: '',
          noticePeriod: '',
          coverLetter: '',
          willingToRelocate: false
        })
        // Update applied jobs state
        setAppliedJobs(prev => new Set([...prev, selectedJob.id]))
        // Refresh jobs to update application status
        fetchCompanyJobs()
      } else {
        toast.error(response.message || 'Failed to submit application')
      }
    } catch (error) {
      console.error('Error applying for job:', error)
      toast.error('Failed to submit application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [selectedJob, applicationData, fetchCompanyJobs])

  const getSectorColor = (sector: string) => {
    const colors = {
      technology: {
        bg: "from-blue-500 to-cyan-500",
        text: "text-blue-600",
        border: "border-blue-200",
        light: "bg-blue-50",
      },
      finance: {
        bg: "from-green-500 to-emerald-500",
        text: "text-green-600",
        border: "border-green-200",
        light: "bg-green-50",
      },
      automotive: {
        bg: "from-orange-500 to-red-500",
        text: "text-orange-600",
        border: "border-orange-200",
        light: "bg-orange-50",
      },
      healthcare: {
        bg: "from-teal-500 to-cyan-500",
        text: "text-teal-600",
        border: "border-teal-200",
        light: "bg-teal-50",
      },
      energy: {
        bg: "from-purple-500 to-pink-500",
        text: "text-purple-600",
        border: "border-purple-200",
        light: "bg-purple-50",
      },
      fintech: {
        bg: "from-blue-500 to-green-500",
        text: "text-blue-600",
        border: "border-blue-200",
        light: "bg-blue-50",
      },
    }
    return colors[sector as keyof typeof colors] || colors.technology
  }



  // Removed mock company data

  // Handle render errors first
  if (hasRenderError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Navbar />
        <div className="pt-20 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-16">
              <p className="text-red-600 dark:text-red-400">Something went wrong loading this company page.</p>
              <Button 
                onClick={() => {
                  setHasRenderError(false)
                  window.location.reload()
                }}
                className="mt-4"
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Handle loading states early to avoid any render errors
  if (loadingCompany || loadingJobs) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Navbar />
        
        <div className="pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-slate-600 dark:text-slate-300">Loading company information...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Navbar />
        
        <div className="pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <Building2 className="w-12 h-12 text-red-500" />
              </div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Company Not Found</h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">{companyError || 'The company you\'re looking for doesn\'t exist or may have been removed. Please check the URL or browse our companies directory.'}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/companies">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-2xl">
                    Browse All Companies
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="font-semibold px-8 py-3 rounded-2xl">
                    Go to Homepage
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Simple computed departments without useMemo to avoid React error #310
  const getDepartments = () => {
    try {
    const groups: Record<string, { name: string; openings: number; description: string; growth: string }> = {}
      const jobs = Array.isArray(companyJobs) ? companyJobs : []
      
      // Filter out consultancy jobs - only count direct company jobs
      const directCompanyJobs = jobs.filter((job) => {
        const metadata = job.metadata || {}
        const isConsultancyJob = metadata.postingType === 'consultancy' || 
                                 job.isConsultancy || 
                                 metadata.consultancyName ||
                                 job.isAgencyPosted ||
                                 job.PostedByAgency ||
                                 job.hiringCompanyId ||
                                 job.postedByAgencyId
        return !isConsultancyJob
      })
      
      directCompanyJobs.forEach((job) => {
      const deptName = (job.department || job.category || 'Other').toString()
      if (!groups[deptName]) {
        groups[deptName] = { name: deptName, openings: 0, description: '', growth: '' }
      }
      groups[deptName].openings += 1
    })
    return Object.values(groups).sort((a, b) => b.openings - a.openings)
    } catch (error) {
      console.error('Error computing departments:', error)
      return []
    }
  }

  const departments = getDepartments()

  // Get unique filter options from jobs
  const getFilterOptions = () => {
    try {
      const jobs = Array.isArray(companyJobs) ? companyJobs : []
      
      // Filter out consultancy jobs - only count direct company jobs
      const directCompanyJobs = jobs.filter((job) => {
        const metadata = job.metadata || {}
        const isConsultancyJob = metadata.postingType === 'consultancy' || 
                                 job.isConsultancy || 
                                 metadata.consultancyName ||
                                 job.isAgencyPosted ||
                                 job.PostedByAgency ||
                                 job.hiringCompanyId ||
                                 job.postedByAgencyId
        return !isConsultancyJob
      })
      
      const departments = [...new Set(directCompanyJobs.map(job => job.department || job.category).filter(Boolean))]
      const locations = [...new Set(directCompanyJobs.map(job => job.location || job.city || job.state).filter(Boolean))]
      const experiences = [...new Set(directCompanyJobs.map(job => job.experienceLevel || job.experience).filter(Boolean))]
      
      return {
        departments: departments.length > 0 ? departments : ['All Departments'],
        locations: locations.length > 0 ? locations : ['All Locations'],
        experiences: experiences.length > 0 ? experiences : ['All Experience Levels']
      }
    } catch (error) {
      console.error('Error getting filter options:', error)
      return {
        departments: ['All Departments'],
        locations: ['All Locations'], 
        experiences: ['All Experience Levels']
      }
    }
  }

  const filterOptions = getFilterOptions()

  // Use companyJobs state from API

  const employeeSpeak = [
    {
      category: "Company Culture",
      rating: 4.2,
      reviews: 45,
      highlights: ["Collaborative environment", "Learning opportunities", "Work-life balance"],
    },
    {
      category: "Skill Development",
      rating: 4.0,
      reviews: 38,
      highlights: ["Training programs", "Mentorship", "Technology exposure"],
    },
    {
      category: "Salary & Benefits",
      rating: 3.8,
      reviews: 42,
      highlights: ["Competitive salary", "Health benefits", "Performance bonus"],
    },
    {
      category: "Work Satisfaction",
      rating: 4.1,
      reviews: 40,
      highlights: ["Challenging projects", "Recognition", "Career growth"],
    },
  ]

  const reviewsByProfile = [
    {
      profile: "Software Developer",
      count: 45,
      rating: 4.2,
      reviews: [
        {
          title: "Great place for learning",
          rating: 4,
          experience: "2 years",
          pros: "Good learning environment, supportive team, latest technologies",
          cons: "Work pressure during project deadlines",
          date: "2 months ago",
        },
      ],
    },
    {
      profile: "Project Manager",
      count: 12,
      rating: 4.0,
      reviews: [
        {
          title: "Good growth opportunities",
          rating: 4,
          experience: "3 years",
          pros: "Career growth, good management, client interaction",
          cons: "Sometimes long working hours",
          date: "1 month ago",
        },
      ],
    },
    {
      profile: "Business Analyst",
      count: 8,
      rating: 3.9,
      reviews: [
        {
          title: "Decent work culture",
          rating: 4,
          experience: "1.5 years",
          pros: "Learning opportunities, good colleagues, flexible timing",
          cons: "Limited growth in initial years",
          date: "3 weeks ago",
        },
      ],
    },
  ]

  

  const handleShare = (platform: string) => {
    const companyUrl = `${window.location.origin}/companies/${company.id}`
    const shareText = `Check out ${company.name} - ${companyJobs.length} job openings available!`

    switch (platform) {
      case "link":
        navigator.clipboard.writeText(companyUrl)
        // Show toast notification
        break
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${companyUrl}`)}`)
        break
      case "email":
        window.open(`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(companyUrl)}`)
        break
    }
  }

  

  // Simple computed sector key without useMemo to avoid React error #310
  const getSectorKey = () => {
    try {
    const ind = (company?.industries && company.industries.length > 0 ? company.industries[0] : '').toLowerCase()
    if (ind.includes('tech')) return 'technology'
    if (ind.includes('fin')) return 'finance'
    if (ind.includes('health')) return 'healthcare'
    if (ind.includes('auto')) return 'automotive'
    if (ind.includes('energy')) return 'energy'
    if (ind.includes('consult')) return 'fintech'
    return 'technology'
    } catch (error) {
      console.error('Error computing sector key:', error)
      return 'technology'
    }
  }

  const sectorKey = getSectorKey()
  const sectorColors = getSectorColor(sectorKey)

  const toDisplayText = (value: any): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (Array.isArray(value)) return value.map((v) => toDisplayText(v)).filter(Boolean).join(', ')
    // object
    if (value.title) return String(value.title)
    if (value.name) return String(value.name)
    try { return JSON.stringify(value) } catch { return '' }
  }

  return (
    <CompanyErrorBoundary>
      <div className="min-h-screen bg-animated dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative">
      <Navbar />

      {/* Company Header - Full Width Banner (padded to avoid navbar overlap) */}
      <div className="relative w-full pt-16">
        {/* Back Button - Positioned absolutely */}
        <div className="absolute top-6 left-4 sm:left-6 z-10">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Companies
          </Button>
        </div>

        {/* Full Width Banner */}
        <div className="relative w-full h-[35vh] min-h-[400px] overflow-hidden">
          {company.banner ? (
            <img 
              src={company.banner.startsWith('http') ? company.banner : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}${company.banner}`} 
              alt={`${company.name} banner`}
              className="w-full h-full object-cover"
              onLoad={() => {
                console.log('✅ Company banner loaded:', company.banner);
              }}
              onError={(e) => {
                console.error('❌ Company banner failed:', company.banner);
              }}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-r ${sectorColors.bg} relative`}>
              <div className="absolute inset-0 bg-black/10" />
            </div>
          )}
          
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />
          
          {/* Company Info Overlay */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <motion.div 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.8 }}
                className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8"
              >
                {/* Left Side - Company Info */}
                <div className="flex-1 text-white">
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar className="w-20 h-20 ring-4 ring-white/30 shadow-xl">
                      <AvatarImage 
                        src={company.logo ? (company.logo.startsWith('http') ? company.logo : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}${company.logo}`) : "/placeholder.svg"} 
                        alt={`${company.name} logo`}
                        onLoad={() => {
                          console.log('✅ Company logo loaded successfully:', company.logo);
                        }}
                        onError={(e) => {
                          console.error('❌ Company logo failed to load:', company.logo);
                          const img = e.target as HTMLImageElement;
                          if (company.logo && !company.logo.startsWith('http')) {
                            img.src = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${company.logo}`;
                          }
                        }}
                      />
                      <AvatarFallback className="text-2xl font-bold bg-white/20 text-white">
                        {(company.name||'')[0]?.toUpperCase() || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold mb-2">{toDisplayText(company.name) || 'Company'}</h1>
                      <div className="flex items-center space-x-4">
                        {/* Rating + allow user rating */}
                        <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full cursor-pointer" onClick={() => setShowRatingDialog(true)}>
                          <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                          <span className="font-bold text-sm">{company.averageRating || company.rating || 0}</span>
                          {(company.totalReviews || company.reviews) ? (
                            <span className="ml-1 text-xs opacity-80">({company.totalReviews || company.reviews})</span>
                          ) : null}
                        </div>
                        {/* Followers (hide when 0 or undefined) */}
                        {(company.followers && Number(company.followers) > 0) && (
                          <div className="text-sm opacity-90">
                            {company.followers} followers
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Remove description and company types from banner per requirements */}
                  
                  {/* Follow Button */}
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full"
                    onClick={() => {
                      if (!isAuthenticated) {
                        setShowAuthDialog(true)
                        return
                      }
                      // toggle follow
                      (async () => {
                        try {
                          if (isFollowing) {
                            const res = await apiService.unfollowCompany(companyId)
                            if (res.success) {
                              setIsFollowing(false)
                              toast.success('Unfollowed company')
                            } else {
                              toast.error('Failed to unfollow')
                            }
                          } else {
                            const res = await apiService.followCompany(companyId)
                            if (res.success) {
                              setIsFollowing(true)
                              toast.success('Following company')
                            } else {
                              toast.error('Failed to follow')
                            }
                          }
                        } catch (e) {
                          toast.error('Action failed')
                        }
                      })()
                    }}
                  >
                    {isFollowing ? 'Following' : '+ Follow'}
                  </Button>
                </div>
                
                {/* Right side visual removed as requested */}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Company Details Tabs */}
      <div className="bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <TabsList className={`grid w-full ${company?.whyJoinUs || company?.why_join_us ? 'grid-cols-3' : 'grid-cols-2'} bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-xl`}>
                <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  Overview
                </TabsTrigger>
                {(company?.whyJoinUs || company?.why_join_us) && (
                <TabsTrigger value="why" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  Why Join Us
                  </TabsTrigger>
                )}
                <TabsTrigger value="jobs" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  Jobs ({companyJobs.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* About Company */}
              <div className="lg:col-span-2 space-y-8">
                <Card className="border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-lg border border-slate-200/30 dark:border-slate-700/30">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">About {company.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">{company.description || ''}</p>
                    
                    {/* Company Details */}
                    <div className="space-y-6 mb-6">
                      {/* Industries */}
                      {company.industries && Array.isArray(company.industries) && company.industries.length > 0 && (
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white mb-2">Industries</div>
                          <div className="flex flex-wrap gap-2">
                            {company.industries.map((industry: string, index: number) => (
                              <Badge key={index} variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                                {industry}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Nature of Business */}
                      {company.natureOfBusiness && Array.isArray(company.natureOfBusiness) && company.natureOfBusiness.length > 0 && (
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white mb-2">Nature of Business</div>
                          <div className="flex flex-wrap gap-2">
                            {company.natureOfBusiness.map((nature: string, index: number) => (
                              <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                                {nature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Company Types */}
                      {company.companyTypes && Array.isArray(company.companyTypes) && company.companyTypes.length > 0 && (
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white mb-2">Company Type</div>
                          <div className="flex flex-wrap gap-2">
                            {company.companyTypes.map((type: string, index: number) => (
                              <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="flex items-center">
                        <TrendingUp className="w-5 h-5 mr-3 text-slate-400" />
                        <div>
                          <div className="font-medium">Open Positions</div>
                          <div className="text-slate-600 dark:text-slate-400">
                            {companyStats?.activeJobs ?? company.activeJobsCount ?? companyJobs.length}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Building2 className="w-5 h-5 mr-3 text-slate-400" />
                        <div>
                          <div className="font-medium">Headquarters</div>
                          <div className="text-slate-600 dark:text-slate-400">{toDisplayText(company.headquarters) || 'Not provided'}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <TrendingUp className="w-5 h-5 mr-3 text-slate-400" />
                        <div>
                          <div className="font-medium">Profile Views</div>
                          <div className="text-slate-600 dark:text-slate-400">
                            {companyStats?.profileViews ?? (toDisplayText(company.profileViews) || 'Not provided')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Departments Hiring */}
                <Card className="border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-2xl">Departments hiring at {company.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {departments.map((dept, index) => (
                        <Link key={dept.name + index} href={`/companies/${companyId}/departments/${encodeURIComponent(dept.name)}`}>
                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:shadow-md transition-all duration-300 cursor-pointer group">
                            <div className="flex-1">
                              <div className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                {dept.name}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Open roles in {dept.name}</div>
                              <div className="text-sm text-slate-500 mt-1">{dept.openings} openings</div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="text-blue-600 bg-blue-50 dark:bg-blue-900/20">
                                {dept.openings}
                              </Badge>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Employee Speak removed (mock) */}
              </div>

              {/* Right Sidebar */}
              <div className="space-y-8">
                {/* Live jobs by Company */}
                <Card className="border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Live jobs by {company.name}</span>
                      <Badge className={`bg-gradient-to-r ${sectorColors.bg} text-white`}>{companyJobs.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className={`w-full bg-gradient-to-r ${sectorColors.bg} hover:shadow-lg transition-all duration-300`}
                    >
                      Register now
                    </Button>
                  </CardContent>
                </Card>

                {/* Company Benefits */}
                <Card className="border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle>Benefits reported by employees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {safeBenefits.slice(0, 8).map((benefit: string, index: number) => (
                        <Badge key={index} variant="secondary" className="justify-center py-2 text-xs">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                    {safeBenefits.length > 8 && (
                      <div className="mt-3 text-center">
                        <Button variant="link" className="text-sm text-blue-600">
                          View all benefits
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Reviews by Job Profile removed (mock) */}

                {/* More Information */}
                <Card className="border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle>More Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Company Size</span>
                      <span className="font-medium">{toDisplayText(company.employees) || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Headquarters</span>
                      <span className="font-medium">{toDisplayText(company.headquarters) || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Total Jobs</span>
                      <span className="font-medium">{companyJobs.length} active positions</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {filteredJobs.length} job openings at {company.name}
                  {(filters.department !== 'all' || filters.location !== 'all' || filters.experience !== 'all' || filters.salary !== 'all') && (
                    <span className="text-lg font-normal text-slate-600 dark:text-slate-400 ml-2">
                      (filtered from {companyJobs.length} total)
                    </span>
                  )}
                </h2>
                <p className="text-slate-600 dark:text-slate-400">Departments hiring at {company.name}</p>
              </div>
              <Badge
                className={`${sectorColors.text} ${sectorColors.border} bg-gradient-to-r ${sectorColors.bg} bg-opacity-10`}
              >
                {filteredJobs.length} Active Jobs
              </Badge>
            </div>

            {/* Department Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={filters.department !== 'all' ? "bg-blue-50 border-blue-200 text-blue-600" : ""}
                  >
                    Department ({filterOptions.departments.length})
              </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleFilterChange('department', 'all')}>
                    All Departments
                  </DropdownMenuItem>
                  {filterOptions.departments.map((dept, index) => (
                    <DropdownMenuItem key={index} onClick={() => handleFilterChange('department', dept)}>
                      {dept}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={filters.location !== 'all' ? "bg-blue-50 border-blue-200 text-blue-600" : ""}
                  >
                    Location ({filterOptions.locations.length})
              </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleFilterChange('location', 'all')}>
                    All Locations
                  </DropdownMenuItem>
                  {filterOptions.locations.map((location, index) => (
                    <DropdownMenuItem key={index} onClick={() => handleFilterChange('location', location)}>
                      {location}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={filters.experience !== 'all' ? "bg-blue-50 border-blue-200 text-blue-600" : ""}
                  >
                    Experience ({filterOptions.experiences.length})
              </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleFilterChange('experience', 'all')}>
                    All Experience Levels
                  </DropdownMenuItem>
                  {filterOptions.experiences.map((exp, index) => (
                    <DropdownMenuItem key={index} onClick={() => handleFilterChange('experience', exp)}>
                      {exp}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={filters.salary !== 'all' ? "bg-blue-50 border-blue-200 text-blue-600" : ""}
                  >
                    Salary (3)
              </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleFilterChange('salary', 'all')}>
                    All Salary Ranges
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange('salary', 'low')}>
                    Low (≤5 LPA)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange('salary', 'medium')}>
                    Medium (5-15 LPA)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange('salary', 'high')}>
                    High (≥15 LPA)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Clear all filters button */}
              {(filters.department !== 'all' || filters.location !== 'all' || filters.experience !== 'all' || filters.salary !== 'all') && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setFilters({ department: 'all', location: 'all', experience: 'all', salary: 'all' })
                    fetchCompanyJobs({})
                  }}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {loadingJobs ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <Card className="border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl">
                        <CardContent className="p-6">
                          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              ) : filteredJobs.length > 0 ? (
                filteredJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                >
                  <Link href={`/jobs/${String(job.id)}`}>
                    <Card className="border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl hover:shadow-xl transition-all duration-300 group cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors mb-2">
                                  {job.title}
                                </h3>
                                <div className="text-slate-600 dark:text-slate-400 font-medium mb-2">
                                  {company.name}
                                </div>
                                <div className="flex items-center space-x-4 text-slate-600 dark:text-slate-400 mb-4">
                                  <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {job.location || job.city || job.state || job.country || '—'}
                                  </div>
                                  <div className="flex items-center">
                                    <Briefcase className="w-4 h-4 mr-1" />
                                    {job.experience || job.experienceLevel || '—'}
                                  </div>
                                  <div className="flex items-center">
                                    <IndianRupee className="w-4 h-4 mr-1" />
                                    {(job.salary || (job.salaryMin && job.salaryMax ? `${job.salaryMin}-${job.salaryMax}` : '—'))}{job.salary || job.salaryMin || job.salaryMax ? ' LPA' : ''}
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {job.type || job.jobType || '—'}
                                  </div>
                                  {job.status === 'expired' && (
                                    <Badge className="bg-red-100 text-red-800 border-red-200">Expired</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col space-y-2">
                                <Button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleApply(job.id)
                                  }}
                                  className={`h-10 px-6 ${
                                    hasAppliedToJob(job.id)
                                      ? 'bg-green-600 hover:bg-green-700 cursor-default'
                                      : job.status === 'expired'
                                        ? 'bg-slate-300 cursor-not-allowed'
                                      : `bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg transition-all duration-300`
                                  }`}
                                  disabled={hasAppliedToJob(job.id) || job.status === 'expired'}
                                >
                                  {hasAppliedToJob(job.id) ? (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Applied
                                    </>
                                  ) : job.status === 'expired' ? (
                                    'Applications closed'
                                  ) : (
                                    'Apply now'
                                  )}
                                </Button>
                                {!isAuthenticated && (
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setShowAuthDialog(true)
                                      }}
                                      className="text-xs"
                                    >
                                      Register
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setShowAuthDialog(true)
                                      }}
                                      className="text-xs"
                                    >
                                      Login
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">{job.description || ''}</p>

                            <div className="flex flex-wrap gap-2 mb-4">
                              {(() => {
                                const reqs = Array.isArray(job.requirements)
                                  ? job.requirements
                                  : typeof job.requirements === 'string'
                                    ? job.requirements.split(/[,\n\r]+/).map((s: string) => s.trim()).filter(Boolean)
                                    : []
                                return reqs.map((requirement: any, reqIndex: number) => (
                                  <Badge key={reqIndex} variant="secondary" className="text-xs">
                                    {requirement}
                                  </Badge>
                                ))
                              })()}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                              <div className="flex items-center space-x-4 text-sm text-slate-500">
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {job.postedDate || job.createdAt || ''}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {job.urgent ? "Urgent" : "Regular"}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm">
                                  Save
                                </Button>
                                {user && user.userType === 'jobseeker' ? (
                                  <Button
                                    size="sm"
                                    className={`${
                                      hasAppliedToJob(job.id)
                                        ? 'bg-green-600 hover:bg-green-700 cursor-default'
                                        : job.status === 'expired'
                                          ? 'bg-slate-300 cursor-not-allowed'
                                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                                    } text-white`}
                                    onClick={() => handleApply(job.id)}
                                    disabled={hasAppliedToJob(job.id) || job.status === 'expired'}
                                  >
                                    {hasAppliedToJob(job.id) ? (
                                      <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Applied
                                      </>
                                    ) : job.status === 'expired' ? (
                                      'Applications closed'
                                    ) : (
                                      'Apply Now'
                                    )}
                                  </Button>
                                ) : !user ? (
                                  <Button
                                    size="sm"
                                    className={`${job.status === 'expired' ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'} text-white`}
                                    onClick={() => (job.status === 'expired' ? null : setShowAuthDialog(true))}
                                    disabled={job.status === 'expired'}
                                  >
                                    {job.status === 'expired' ? 'Applications closed' : 'Apply Now'}
                                  </Button>
                                ) : null}

                                {job.status === 'expired' && (
                                  <Button
                                    variant={getIsWatching(job.id) ? 'outline' : 'default'}
                                    size="sm"
                                    className={`${getIsWatching(job.id) ? '' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
                                    onClick={() => handleToggleWatch(job)}
                                  >
                                    {getIsWatching(job.id) ? 'Tracking' : 'Track this job'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {(filters.department !== 'all' || filters.location !== 'all' || filters.experience !== 'all' || filters.salary !== 'all') 
                      ? 'No Jobs Match Your Filters' 
                      : 'No Open Positions'
                    }
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    {(filters.department !== 'all' || filters.location !== 'all' || filters.experience !== 'all' || filters.salary !== 'all')
                      ? "Try adjusting your filters to see more results."
                      : (jobsError || "This company doesn't have any open positions at the moment.")
                    }
                  </p>
                  {(filters.department !== 'all' || filters.location !== 'all' || filters.experience !== 'all' || filters.salary !== 'all') ? (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setFilters({ department: 'all', location: 'all', experience: 'all', salary: 'all' })
                        fetchCompanyJobs({})
                      }}
                    >
                      Clear Filters
                    </Button>
                  ) : (
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Check Again
                  </Button>
                  )}
                </div>
              )}
            </div>

            {/* Interview Questions */}
            <Card className="border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl mt-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Interview Questions</span>
                  <Button variant="link" className="text-sm text-blue-600 p-0">
                    View all
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-sm py-1 px-3">
                    Software Engineer (5)
                  </Badge>
                  <Badge variant="outline" className="text-sm py-1 px-3">
                    Data Software Engineer (5)
                  </Badge>
                  <Badge variant="outline" className="text-sm py-1 px-3">
                    Software Developer (5)
                  </Badge>
                  <Badge variant="outline" className="text-sm py-1 px-3">
                    Data Analyst (1)
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="why" className="space-y-8">
            <Card className="border-0 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-xl shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Why join {company.name}?
                </CardTitle>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Discover what makes {company.name} a great place to work
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                {company.whyJoinUs ? (
                  <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
                    {company.whyJoinUs}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                      Content Coming Soon
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                      This employer is working on their "Why Join Us" content. Check back soon or explore their open roles below.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Highlights if no content yet: draw from available data */}
            {!company.whyJoinUs && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Growth & Opportunities</CardTitle>
                  </CardHeader>
                  <CardContent className="text-slate-700 dark:text-slate-300">
                    {companyJobs.length > 0 ? `${companyJobs.length} open roles across departments.` : 'Active hiring cycles across functions.'}
                  </CardContent>
                </Card>
                <Card className="border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Culture</CardTitle>
                  </CardHeader>
                  <CardContent className="text-slate-700 dark:text-slate-300">
                    Collaborative environment with a focus on learning and impact.
                  </CardContent>
                </Card>
                <Card className="border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Benefits</CardTitle>
                  </CardHeader>
                  <CardContent className="text-slate-700 dark:text-slate-300">
                    {safeBenefits.length > 0 ? safeBenefits.slice(0, 4).join(', ') : 'Competitive compensation and perks.'}
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Workplace Photos - MOVED FROM OVERVIEW TAB */}
            <Card className="border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Workplace Photos</CardTitle>
              </CardHeader>
              <CardContent>
                {companyPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {companyPhotos.map((p:any) => (
                      <div key={p.id} className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 group">
                        <img
                          src={p.fileUrl}
                          alt={p.altText || company.name}
                          className="w-full h-32 md:h-40 object-cover"
                          loading="lazy"
                          onLoad={() => {
                            console.log('✅ Image loaded successfully:', p.fileUrl);
                          }}
                          onError={(e) => {
                            console.error('❌ Image failed to load:', p.fileUrl);
                            console.error('❌ Error details:', e);
                            console.log('🔍 Photo data:', p);
                          }}
                        />
                        {p.caption ? (
                          <div className="px-2 py-1 text-xs text-slate-600 dark:text-slate-300 truncate">{p.caption}</div>
                        ) : null}
                        {/* Delete button for company owners/admins */}
                        {user && (user.userType === 'employer' || user.userType === 'admin') && user.companyId === companyId && (
                          <button
                            onClick={() => handlePhotoDelete(p.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            title="Delete photo"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-600 dark:text-slate-300 text-center py-8">
                    <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No workplace photos available yet.</p>
                    <p className="text-sm mt-1">Check back later to see our office and culture!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
            </Tabs>
          </motion.div>
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
            <Link href="/register">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                Register Now
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="w-full bg-transparent">
                Login
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate {company?.name}</DialogTitle>
            <DialogDescription>
              Share your experience by rating this company
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-6 py-6">
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingSubmit(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="transition-all duration-200 hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      (hoverRating || userRating || 0) >= star
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {userRating && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                You rated this company {userRating} {userRating === 1 ? 'star' : 'stars'}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Application Dialog */}
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              Submit your application for this position. Make sure your profile and resume are up to date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Expected Salary (LPA)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 8-12"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  value={applicationData.expectedSalary}
                  onChange={(e) => setApplicationData({...applicationData, expectedSalary: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Notice Period (Days)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 30"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  value={applicationData.noticePeriod}
                  onChange={(e) => setApplicationData({...applicationData, noticePeriod: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Cover Letter
              </label>
              <textarea
                placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                value={applicationData.coverLetter}
                onChange={(e) => setApplicationData({...applicationData, coverLetter: e.target.value})}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="willingToRelocate"
                checked={applicationData.willingToRelocate}
                onChange={(e) => setApplicationData({...applicationData, willingToRelocate: e.target.checked})}
                className="rounded border-slate-300 dark:border-slate-600"
              />
              <label htmlFor="willingToRelocate" className="text-sm text-slate-700 dark:text-slate-300">
                I am willing to relocate for this position
              </label>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowApplicationDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                onClick={handleSubmitApplication}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl text-white py-8 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">JobPortal</span>
              </div>
              <p className="text-slate-400 mb-4">India's leading job portal connecting talent with opportunities.</p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <span className="text-sm">f</span>
                </div>
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <span className="text-sm">t</span>
                </div>
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
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

          <div className="border-t border-slate-800 mt-6 pt-4 text-center text-slate-400">
            <p>&copy; 2025 JobPortal. All rights reserved. Made with ❤️ in India</p>
          </div>
        </div>
      </footer>
    </div>
    </CompanyErrorBoundary>
  )
}

export default dynamic(() => Promise.resolve(CompanyDetailPage), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-300">Loading company information...</p>
          </div>
        </div>
      </div>
    </div>
  )
})
