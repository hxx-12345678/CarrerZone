"use client"



import { useState, useEffect, useMemo, useCallback, useRef } from "react"

import { useSearchParams } from 'next/navigation'

import {

  Search,

  MapPin,

  Briefcase,

  Filter,

  SlidersHorizontal,

  Clock,

  Users,

  IndianRupee,

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

  ChevronDown,

  AlertCircle,

} from "lucide-react"

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Checkbox } from "@/components/ui/checkbox"

import { Separator } from "@/components/ui/separator"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { ScrollArea } from "@/components/ui/scroll-area"

import { motion } from "framer-motion"

import { Navbar } from "@/components/navbar"

import Link from "next/link"

import { useAuth } from "@/hooks/useAuth"

import { toast } from "sonner"

import { apiService } from "@/lib/api"

import { JobApplicationDialog } from "@/components/job-application-dialog"

import RoleCategoryDropdown from "@/components/ui/role-category-dropdown"

import IndustryDropdown from "@/components/ui/industry-dropdown"

import DepartmentDropdown from "@/components/ui/department-dropdown"




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

  jobTitle?: string

  recruiterType?: string

  salaryMin?: number

  roleCategories?: string[]

  industryCategories?: string[]

  departmentCategories?: string[]

}



interface Job {

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

  isPreferred?: boolean

  // Hot Vacancy Premium Features

  isHotVacancy?: boolean

  urgentHiring?: boolean

  superFeatured?: boolean

  boostedSearch?: boolean

  externalApplyUrl?: string
  
  // CRITICAL: Fields for filtering (from database)
  industryType?: string | null
  department?: string | null
  roleCategory?: string | null

  // Agency posting fields

  isAgencyPosted?: boolean

  HiringCompany?: {

    id: string

    name: string

    logo?: string

    industry?: string

    city?: string

  }

  PostedByAgency?: {

    id: string

    name: string

    logo?: string

    companyAccountType?: string

    industry?: string

    city?: string

  }

  // Consultancy posting fields

  isConsultancy?: boolean

  consultancyName?: string

  hiringCompany?: {

    name?: string

    industry?: string

    description?: string

  }

  showHiringCompanyDetails?: boolean

  applicationDeadline?: string

}



export default function JobsPage() {

  const searchParams = useSearchParams()

  const { user, loading } = useAuth()

  const [isRedirecting, setIsRedirecting] = useState(false)

  const [showFilters, setShowFilters] = useState(false)

  const [showAuthDialog, setShowAuthDialog] = useState(false)

  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())

  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set())

  const [sortBy, setSortBy] = useState("recent")

  const [isStickyVisible, setIsStickyVisible] = useState(false)

  const [jobs, setJobs] = useState<Job[]>([])

  const [jobsLoading, setJobsLoading] = useState(true)

  const [showApplicationDialog, setShowApplicationDialog] = useState(false)

  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  const [preferredJobs, setPreferredJobs] = useState<Job[]>([])

  const [preferredJobsLoading, setPreferredJobsLoading] = useState(false)

  const [showRoleCategoryDropdown, setShowRoleCategoryDropdown] = useState(false)

  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)

  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false)



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

    salaryMin: undefined,

    roleCategories: [],

    industryCategories: [],

    departmentCategories: [],

  })



  // Check URL parameters for filters

  useEffect(() => {

    if (typeof window !== 'undefined') {

      const urlParams = new URLSearchParams(window.location.search)

      
      
      // Extract all filter parameters

      const category = urlParams.get('category')

      const type = urlParams.get('type')

      const location = urlParams.get('location')

      const industry = urlParams.get('industry')

      const department = urlParams.get('department')

      const roleCategory = urlParams.get('roleCategory')

      const industries = urlParams.get('industries') // New multi-value parameter

      const departments = urlParams.get('departments') // New multi-value parameter

      const roleCategories = urlParams.get('roleCategories') // New multi-value parameter

      const experience = urlParams.get('experience')

      const experienceLevels = urlParams.get('experienceLevels')

      const companyType = urlParams.get('companyType')

      const workMode = urlParams.get('workMode')

      const jobType = urlParams.get('jobType')

      const jobTypes = urlParams.get('jobTypes')

      const search = urlParams.get('search')

      const exactMatch = urlParams.get('exactMatch')

      const jobTitle = urlParams.get('jobTitle')

      const company = urlParams.get('company')



      // Build new filter state

      const newFilters: Partial<FilterState> = {}

      
      
      if (category) newFilters.category = category

      if (type) newFilters.type = type

      if (location) newFilters.location = location

      if (search) {

        newFilters.search = search

        console.log('🔍 Setting search from URL:', search)

      }

      
      
      // Handle exact match parameters

      if (exactMatch === 'true') {

        if (jobTitle) newFilters.jobTitle = jobTitle

        if (company) newFilters.companyName = company

      }

      if (experienceLevels) newFilters.experienceLevels = [experienceLevels]

      else if (experience) newFilters.experienceLevels = [experience]

      if (companyType) newFilters.companyType = companyType

      if (workMode) newFilters.workMode = workMode

      if (jobTypes) newFilters.jobTypes = jobTypes.split(',').map((j: string) => j.trim()).filter((j: string) => j)

      else if (jobType) newFilters.jobTypes = [jobType]

      
      
      // Handle filter categories (prioritize multi-value parameters)

      if (industries) {

        // Split comma-separated values and clean them (strip count info like "(2378)")

        const industryList = industries.split(',').map(i => {
          const cleaned = i.trim().replace(/\s*\(\d+\)\s*$/, '').trim()
          return cleaned
        }).filter(i => i)

        newFilters.industryCategories = industryList

      } else if (industry) {

        newFilters.industryCategories = [industry]

      }

      
      
      if (departments) {

        // Split comma-separated values and clean them

        const departmentList = departments.split(',').map(d => d.trim()).filter(d => d)

        newFilters.departmentCategories = departmentList

      } else if (department) {

        newFilters.departmentCategories = [department]

      }

      
      
      if (roleCategories) {

        // Split comma-separated values and clean them

        const roleList = roleCategories.split(',').map(r => r.trim()).filter(r => r)

        newFilters.roleCategories = roleList

      } else if (roleCategory) {

        newFilters.roleCategories = [roleCategory]

      }



      // Apply filters if any are present - clear previous filters first

      if (Object.keys(newFilters).length > 0) {

        setFilters({

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

          salaryMin: undefined,

          roleCategories: [],

          industryCategories: [],

          departmentCategories: [],

          ...newFilters

        })

      }

    }

  }, []) // Run only once on component mount



  // Listen for searchParams changes (for navbar clicks)

  useEffect(() => {

    if (searchParams) {

      // Extract all filter parameters from searchParams

      const category = searchParams.get('category')

      const type = searchParams.get('type')

      const location = searchParams.get('location')

      const industry = searchParams.get('industry')

      const department = searchParams.get('department')

      const roleCategory = searchParams.get('roleCategory')

      const industries = searchParams.get('industries')

      const departments = searchParams.get('departments')

      const roleCategories = searchParams.get('roleCategories')

      const experience = searchParams.get('experience')

      const experienceLevels = searchParams.get('experienceLevels')

      const companyType = searchParams.get('companyType')

      const workMode = searchParams.get('workMode')

      const jobType = searchParams.get('jobType')

      const jobTypes = searchParams.get('jobTypes')

      const search = searchParams.get('search')



      // Build new filter state

      const newFilters: Partial<FilterState> = {}

      
      
      if (category) newFilters.category = category

      if (type) newFilters.type = type

      if (location) newFilters.location = location

      if (search) {

        newFilters.search = search

        console.log('🔍 Setting search from searchParams:', search)

      }

      if (experienceLevels) newFilters.experienceLevels = experienceLevels.split(',').map((e: string) => e.trim()).filter((e: string) => e)

      else if (experience) newFilters.experienceLevels = [experience]

      if (companyType) newFilters.companyType = companyType

      if (workMode) newFilters.workMode = workMode

      if (jobTypes) newFilters.jobTypes = jobTypes.split(',').map((j: string) => j.trim()).filter((j: string) => j)

      else if (jobType) newFilters.jobTypes = [jobType]

      
      
      // Handle filter categories (prioritize multi-value parameters)

      if (industries) {

        // Strip count information like "(2378)" from industry names
        const industryList = industries.split(',').map(i => {
          const cleaned = i.trim().replace(/\s*\(\d+\)\s*$/, '').trim()
          return cleaned
        }).filter(i => i)

        newFilters.industryCategories = industryList

      } else if (industry) {

        newFilters.industryCategories = [industry]

      }

      
      
      if (departments) {

        const departmentList = departments.split(',').map(d => d.trim()).filter(d => d)

        newFilters.departmentCategories = departmentList

      } else if (department) {

        newFilters.departmentCategories = [department]

      }

      
      
      if (roleCategories) {

        const roleList = roleCategories.split(',').map(r => r.trim()).filter(r => r)

        newFilters.roleCategories = roleList

      } else if (roleCategory) {

        newFilters.roleCategories = [roleCategory]

      }



      // Apply filters if any are present - clear previous filters first

      if (Object.keys(newFilters).length > 0) {

        setFilters({

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

          salaryMin: undefined,

          roleCategories: [],

          industryCategories: [],

          departmentCategories: [],

          ...newFilters

        })

      }

    }

  }, [searchParams])



  // Listen for URL changes (for navbar clicks and browser navigation)

  useEffect(() => {

    const handleUrlChange = () => {

      // Re-parse URL parameters when URL changes

      if (typeof window !== 'undefined') {

        const urlParams = new URLSearchParams(window.location.search)

        
        
        // Extract all filter parameters

        const category = urlParams.get('category')

        const type = urlParams.get('type')

        const location = urlParams.get('location')

        const industry = urlParams.get('industry')

        const department = urlParams.get('department')

        const roleCategory = urlParams.get('roleCategory')

        const industries = urlParams.get('industries')

        const departments = urlParams.get('departments')

        const roleCategories = urlParams.get('roleCategories')

      const experience = urlParams.get('experience')

      const experienceLevelsParam = urlParams.get('experienceLevels')

      const companyType = urlParams.get('companyType')

      const workMode = urlParams.get('workMode')

      const jobType = urlParams.get('jobType')

      const jobTypesParam = urlParams.get('jobTypes')

      const search = urlParams.get('search')



        // Build new filter state

        const newFilters: Partial<FilterState> = {}

        
        
        if (category) newFilters.category = category

        if (type) newFilters.type = type

        if (location) newFilters.location = location

        if (search) newFilters.search = search

        if (experienceLevelsParam) newFilters.experienceLevels = experienceLevelsParam.split(',').map((e: string) => e.trim()).filter((e: string) => e)

        else if (experience) newFilters.experienceLevels = [experience]

        if (companyType) newFilters.companyType = companyType

        if (workMode) newFilters.workMode = workMode

        if (jobTypesParam) newFilters.jobTypes = jobTypesParam.split(',').map((j: string) => j.trim()).filter((j: string) => j)

        else if (jobType) newFilters.jobTypes = [jobType]

        
        
        // Handle filter categories (prioritize multi-value parameters)

        if (industries) {

          // Strip count information like "(2378)" from industry names
          const industryList = industries.split(',').map(i => {
            const cleaned = i.trim().replace(/\s*\(\d+\)\s*$/, '').trim()
            return cleaned
          }).filter(i => i)

          newFilters.industryCategories = industryList

        } else if (industry) {

          newFilters.industryCategories = [industry]

        }

        
        
        if (departments) {

          const departmentList = departments.split(',').map(d => d.trim()).filter(d => d)

          newFilters.departmentCategories = departmentList

        } else if (department) {

          newFilters.departmentCategories = [department]

        }

        
        
        if (roleCategories) {

          const roleList = roleCategories.split(',').map(r => r.trim()).filter(r => r)

          newFilters.roleCategories = roleList

        } else if (roleCategory) {

          newFilters.roleCategories = [roleCategory]

        }



        // Apply filters if any are present - clear previous filters first

        if (Object.keys(newFilters).length > 0) {

          setFilters({

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

            salaryMin: undefined,

            roleCategories: [],

            industryCategories: [],

            departmentCategories: [],

            ...newFilters

          })

        }

      }

    }

    
    
    // Listen for popstate events (back/forward buttons)

    window.addEventListener('popstate', handleUrlChange)

    
    
    // Also listen for navigation events (for programmatic navigation)

    const handleNavigation = () => {

      setTimeout(handleUrlChange, 100) // Small delay to ensure URL is updated

    }

    
    
    // Listen for route changes

    window.addEventListener('beforeunload', handleNavigation)

    
    
    return () => {

      window.removeEventListener('popstate', handleUrlChange)

      window.removeEventListener('beforeunload', handleNavigation)

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



  // Refetch when filters change (debounced) and sync URL

  useEffect(() => {

    const params = new URLSearchParams()

    if (filters.search) params.set('search', filters.search)

    if (filters.location) params.set('location', filters.location)

    if (filters.jobTypes.length === 1) params.set('jobType', filters.jobTypes[0].toLowerCase())

    if (filters.experienceLevels.length > 0) params.set('experience', filters.experienceLevels[0])

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

    
    
    // Add new filter categories to URL (use multi-value parameters for better UX)

    if (filters.industryCategories && filters.industryCategories.length > 0) {

      if (filters.industryCategories.length === 1) {

        params.set('industry', filters.industryCategories[0])

      } else {

        params.set('industries', filters.industryCategories.join(','))

      }

    }

    if (filters.departmentCategories && filters.departmentCategories.length > 0) {

      if (filters.departmentCategories.length === 1) {

        params.set('department', filters.departmentCategories[0])

      } else {

        params.set('departments', filters.departmentCategories.join(','))

      }

    }

    if (filters.roleCategories && filters.roleCategories.length > 0) {

      if (filters.roleCategories.length === 1) {

        params.set('roleCategory', filters.roleCategories[0])

      } else {

        params.set('roleCategories', filters.roleCategories.join(','))

      }

    }



    const qs = params.toString()

    const url = qs ? `/jobs?${qs}` : '/jobs'

    if (typeof window !== 'undefined') {

      window.history.replaceState({}, '', url)

    }



    const t = setTimeout(() => {

      fetchJobs()

    }, 400)

    return () => clearTimeout(t)

  }, [filters])



  const fetchJobs = async () => {

    try {

      setJobsLoading(true)

      
      
      // Fetch jobs from backend - get all active jobs

      // Map UI filters to backend query params

      const params: Record<string, string | number | boolean | undefined> = {

        status: 'active',

        limit: 100,

        search: filters.search || undefined,

        location: filters.location || undefined,

        jobType: filters.jobTypes.length > 0 ? filters.jobTypes.map(t => t.toLowerCase().replace(/\s+/g, '-')).join(',') : undefined,

        experienceRange: filters.experienceLevels.length > 0 ? filters.experienceLevels.map(r => r.includes('+') ? r.replace('+','-100') : r).join(',') : undefined,

        ...(filters.salaryRange ? (() => {

          const sr = filters.salaryRange;

          if (sr.includes('+')) {

            const min = parseInt(sr);

            return { salaryMin: min * 100000 };

          }

          const [minStr, maxStr] = sr.split('-');

          const min = parseInt(minStr);

          const max = parseInt(maxStr);

          return {

            salaryMin: isNaN(min) ? undefined : min * 100000,

            salaryMax: isNaN(max) ? undefined : max * 100000,

          };

        })() : {}),

        industry: filters.industry || undefined,

        department: filters.department || undefined,

        role: filters.role || undefined,

        skills: filters.skills || undefined,

        companyType: filters.companyType || undefined,

        workMode: filters.workMode ? (filters.workMode.toLowerCase().includes('home') ? 'remote' : filters.workMode) : undefined,

        education: filters.education || undefined,

        companyName: filters.companyName || undefined,

        recruiterType: filters.recruiterType || undefined,

        // Add new filter categories

        roleCategories: filters.roleCategories?.length ? filters.roleCategories.join(',') : undefined,

        industryCategories: filters.industryCategories?.length ? filters.industryCategories.join(',') : undefined,

        departmentCategories: filters.departmentCategories?.length ? filters.departmentCategories.join(',') : undefined,

      }



      const response = await apiService.getJobs(params)

      
      
      if (response.success && response.data) {

        // Double-check: Filter to ensure ONLY non-Gulf jobs are shown

        const nonGulfJobs = response.data.filter((job: any) => job.region !== 'gulf')

        
        
        // Transform backend jobs to match frontend format

        const transformedJobs = nonGulfJobs.map((job: any) => {

          const metadata = job.metadata || {};

          const isConsultancy = metadata.postingType === 'consultancy';

          
          
          return {

            id: job.id,

            title: job.title,

            company: {

              id: job.company?.id || 'unknown',

              name: isConsultancy && metadata.showHiringCompanyDetails 

                ? metadata.hiringCompany?.name || 'Unknown Company'

                : isConsultancy

                  ? metadata.consultancyName || 'Consultancy'

                  : metadata.companyName || job.company?.name || 'Unknown Company',

              // enrich for filtering - check multiple sources for industry
              industry: job.industryType || 
                       metadata.hiringCompany?.industry || 
                       (Array.isArray(job.company?.industries) && job.company.industries.length > 0 ? job.company.industries[0] : null) ||
                       job.company?.industry,
              industries: job.company?.industries || [],
              companyType: job.company?.companyType,

            } as any,

            // Consultancy metadata

            isConsultancy: isConsultancy,

            consultancyName: metadata.consultancyName || null,

            hiringCompany: metadata.hiringCompany || null,

            showHiringCompanyDetails: metadata.showHiringCompanyDetails || false,

            location: job.location,

            experience: (() => {

              const exp = job.experienceLevel || job.experience || 'Not specified';

              if (exp === 'fresher') return 'Fresher (0-1 years)';

              if (exp === 'junior') return 'Junior (1-3 years)';

              if (exp === 'mid') return 'Mid-level (3-5 years)';

              if (exp === 'senior') return 'Senior (5+ years)';

              return exp;

            })(),

            salary: job.salary || (job.salaryMin && job.salaryMax 

            ? `${(job.salaryMin / 100000).toFixed(0)}-${(job.salaryMax / 100000).toFixed(0)} LPA`

            : 'Not specified'),

            skills: job.skills || [],

            logo: job.company?.logo || '/placeholder-logo.png',

            posted: job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently',
            
            applicationDeadline: job.applicationDeadline || job.validTill || null,
            validTill: job.validTill || null,

            applicants: job.applications || job.application_count || 0,

            description: job.description,

            type: job.jobType ? job.jobType.charAt(0).toUpperCase() + job.jobType.slice(1) : 'Full-time',

            remote: job.remoteWork === 'remote',

            urgent: job.isUrgent || false,

            featured: job.isFeatured || false,

            companyRating: 4.5, // Default rating

            category: job.category || 'General',
            
            // CRITICAL: Add industryType, department, and roleCategory for filtering
            industryType: job.industryType || metadata.industryType || metadata.hiringCompany?.industry || null,
            department: job.department || metadata.department || null,
            roleCategory: job.roleCategory || metadata.roleCategory || null,

            photos: job.photos || [], // Include job photos

            // Internship-specific fields

            duration: job.duration,

            startDate: job.startDate,

            workMode: job.workMode || job.remoteWork,

            learningObjectives: job.learningObjectives,

            mentorship: job.mentorship,

            // Hot Vacancy Premium Features

            isHotVacancy: job.isHotVacancy || job.ishotvacancy || false,

            urgentHiring: job.urgentHiring || job.urgenthiring || false,

            superFeatured: job.superFeatured || job.superfeatured || false,

            boostedSearch: job.boostedSearch || job.boostedsearch || false,

            externalApplyUrl: job.externalApplyUrl || job.externalapplyurl

          };

        })

        
        
        // Use only real jobs from database, no sample data

        setJobs(transformedJobs)

        console.log('✅ Loaded', transformedJobs.length, 'jobs from database')

      } else {

        console.error('❌ Failed to fetch jobs:', response.message)

        // Show empty state instead of sample data

        setJobs([])

      }

    } catch (error) {

      console.error('❌ Error fetching jobs:', error)

      // Show empty state instead of sample data

      setJobs([])

    } finally {

      setJobsLoading(false)

    }

  }



  const fetchUserData = async () => {

    try {

      console.log('🔄 Fetching user data...')

      
      
      // Fetch applications - only include non-withdrawn applications

      const applicationsResponse = await apiService.getApplications()

      console.log('📊 Applications response:', applicationsResponse)

      
      
      if (applicationsResponse.success && applicationsResponse.data) {

        console.log('📋 All applications:', applicationsResponse.data.map((app: any) => ({ 

          id: app.id, 

          jobId: app.jobId, 

          status: app.status 

        })))

        
        
        const activeApplications = applicationsResponse.data.filter((app: any) => 

          app.status && app.status !== 'withdrawn'

        )

        console.log('✅ Active applications:', activeApplications.map((app: any) => ({ 

          id: app.id, 

          jobId: app.jobId, 

          status: app.status 

        })))

        
        
        const appliedJobIds = new Set(activeApplications.map((app: any) => app.jobId))

        setAppliedJobs(appliedJobIds)

        
        
        // Store application IDs for undo functionality (including withdrawn ones for lookup)

        const jobIdToAppId: Record<string, string> = {}

        applicationsResponse.data.forEach((app: any) => {

          if (app.jobId && app.id) {

            jobIdToAppId[app.jobId] = app.id

          }

        })

        setJobIdToApplicationId(jobIdToAppId)

        console.log('🗂️ JobId to ApplicationId mapping:', jobIdToAppId)

      }



      // Fetch bookmarks

      const bookmarksResponse = await apiService.getBookmarks()

      if (bookmarksResponse.success && bookmarksResponse.data) {

        const savedJobIds = new Set(bookmarksResponse.data.map((bookmark: any) => bookmark.jobId))

        setSavedJobs(savedJobIds)

        console.log('🔖 Saved jobs:', Array.from(savedJobIds))

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

        const transformedJobs = response.data.jobs.map((job: any) => {

          const metadata = job.metadata || {};

          const isConsultancy = metadata.postingType === 'consultancy';

          
          
          return {

            id: job.id,

            title: job.title,

            company: {

              id: job.company?.id || 'unknown',

              name: isConsultancy && metadata.showHiringCompanyDetails 

                ? metadata.hiringCompany?.name || 'Unknown Company'

                : isConsultancy

                  ? metadata.consultancyName || 'Consultancy'

                  : metadata.companyName || job.company?.name || 'Unknown Company',

              industry: job.industryType || metadata.hiringCompany?.industry || job.company?.industry,

              companyType: job.company?.companyType,

            } as any,

            // Consultancy metadata

            isConsultancy: isConsultancy,

            consultancyName: metadata.consultancyName || null,

            hiringCompany: metadata.hiringCompany || null,

            showHiringCompanyDetails: metadata.showHiringCompanyDetails || false,

            location: job.location,

            experience: (() => {

              const exp = job.experienceLevel || job.experience || 'Not specified';

              if (exp === 'fresher') return 'Fresher (0-1 years)';

              if (exp === 'junior') return 'Junior (1-3 years)';

              if (exp === 'mid') return 'Mid-level (3-5 years)';

              if (exp === 'senior') return 'Senior (5+ years)';

              return exp;

            })(),

            salary: job.salary || (job.salaryMin && job.salaryMax 

              ? `${(job.salaryMin / 100000).toFixed(0)}-${(job.salaryMax / 100000).toFixed(0)} LPA`

              : 'Not specified'),

            skills: job.skills || [],

            logo: job.company?.logo || '/placeholder-logo.png',

            posted: job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently',
            
            applicationDeadline: job.applicationDeadline || job.validTill || null,
            validTill: job.validTill || null,

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

            workMode: job.workMode || job.remoteWork,

            learningObjectives: job.learningObjectives,

            mentorship: job.mentorship,

            isPreferred: true

          };

        })

        
        
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

      setShowAuthDialog(true)

      return

    }



    try {

      // Find the job data

      const job = jobs.find(j => j.id === jobId)

      if (!job) {

        toast.error('Job not found')

        return

      }



      // Save job to database for all jobs

      const response = await apiService.createBookmark({ jobId })

      if (response.success) {

        setSavedJobs(prev => new Set([...prev, jobId]))

        toast.success('Job saved successfully!')

        console.log('Job saved:', jobId)

      } else {

        toast.error(response.message || 'Failed to save job. Please try again.')

      }

    } catch (error) {

      console.error('Error saving job:', error)

      toast.error('Failed to save job')

    }

  }



  const handleApply = async (jobId: string) => {

    if (!user) {

      setShowAuthDialog(true)

      return

    }



    // Find the job data

    const job = jobs.find(j => j.id === jobId)

    if (!job) {

      toast.error('Job not found')

      return

    }

    // CRITICAL: Check if application deadline has passed before opening dialog
    if (isApplicationDeadlinePassed(job.applicationDeadline || null)) {
      toast.error('Application deadline has passed for this job')
      return
    }

    // Check if job is expired by validTill
    const validTill = (job as any).validTill
    if (validTill && new Date() > new Date(validTill)) {
      toast.error('Applications are closed for this job (expired)')
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

  // Function to check if application deadline has passed
  const isApplicationDeadlinePassed = (deadline: string | null) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    return deadlineDate < now;
  }

  const handleUndoApply = async (jobId: string) => {

    try {

      // Prevent multiple simultaneous withdrawals

      if (withdrawingJobs.has(jobId)) {

        return

      }

      
      
      setWithdrawingJobs(prev => new Set([...prev, jobId]))

      console.log('🔄 Attempting to withdraw application for job:', jobId)

      
      
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

          // Continue with the withdrawal attempt even if we can't fetch user data

        }

        
        
        // Check again after refresh

        applicationId = jobIdToApplicationId[jobId]

        console.log('📋 ApplicationId after refresh:', applicationId)

        
        
        // If still not found, do a direct API call

        if (!applicationId) {

          try {

            const appsResp = await apiService.getApplications()

            console.log('📊 Applications response:', appsResp)

            
            
            if (appsResp && appsResp.success && Array.isArray(appsResp.data)) {

              console.log('📋 All applications:', appsResp.data.map((a: any) => ({ id: a.id, jobId: a.jobId, status: a.status })))

              
              
              // Look for any application with this jobId (including withdrawn ones for debugging)

              const found = appsResp.data.find((a: any) => a.jobId === jobId)

              console.log('🎯 Found application:', found)

              
              
              if (found?.id) {

                applicationId = found.id

                setJobIdToApplicationId(prev => ({ ...prev, [jobId]: found.id }))

                console.log('✅ Using applicationId:', applicationId)

              }

            }

          } catch (apiError) {

            console.error('❌ Error fetching applications:', apiError)

            // Continue with the withdrawal attempt even if we can't fetch applications

          }

        }

      }



      if (!applicationId) {

        console.error('❌ No application found for jobId:', jobId)

        toast.error('Could not locate your application to withdraw. Please refresh the page and try again.')

        return

      }



      console.log('🚀 Withdrawing application:', applicationId)

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

        console.log('✅ Application withdrawn successfully')

      } else {

        console.error('❌ Withdrawal failed:', resp)

        toast.error(resp?.message || 'Failed to withdraw application')

      }

    } catch (error) {

      console.error('❌ Error withdrawing application:', error)

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






  // Auth check - Block employers from /jobs page (they should use employer dashboard)

  // Employers can only access specific /jobs/[id] pages for their company jobs via preview

  useEffect(() => {

    if (user && (user.userType === 'employer' || user.userType === 'admin')) {

      console.log('🔄 Employer/Admin detected on jobs page, redirecting to employer dashboard')

      console.log('💡 Employers can preview individual jobs via /jobs/[id] from manage-jobs page')

      setIsRedirecting(true)

      window.location.href = user.region === 'gulf' ? '/gulf-dashboard' : '/employer-dashboard'

    }

  }, [user])



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



  // Removed click outside handlers since we're using Dialog components which handle this automatically



  // Helper function to get visible job types count (excluding walk-in)

  const getVisibleJobTypesCount = () => {

    return filters.jobTypes.filter(type => type.toLowerCase() !== 'walk-in').length

  }



  // Enhanced search handler that processes the query before setting it

  const handleSearchChange = (value: string) => {

    const processedQuery = processSearchQuery(value)

    
    
    // Handle exact matches differently

    if (typeof processedQuery === 'object' && processedQuery.isExactMatch) {

      // For exact matches, set multiple filters

      handleFilterChange('search', processedQuery.originalQuery)

      if (processedQuery.jobTitle) handleFilterChange('jobTitle', processedQuery.jobTitle)

      if (processedQuery.company) handleFilterChange('companyName', processedQuery.company)

      if (processedQuery.location) handleFilterChange('location', processedQuery.location)

    } else {

      // For regular processed queries

      handleFilterChange('search', processedQuery)

    }

  }



  // Enhanced smart search query processing (same as landing page)

  const processSearchQuery = (query: string) => {

    const lowerQuery = query.toLowerCase().trim()

    
    
    // First, check for exact matches in specific patterns (highest priority)

    const exactMatchPatterns = [

      // Job title at Company in Location patterns

      /(.+?)\s+(?:at|in|@)\s+(.+?)\s+(?:in|at|@)\s+(.+)/i,

      // Company in Location patterns  

      /(.+?)\s+(?:in|at|@)\s+(.+)/i,

      // Job title at Company patterns

      /(.+?)\s+(?:at|@)\s+(.+)/i,

    ]

    
    
    for (const pattern of exactMatchPatterns) {

      const match = query.match(pattern)

      if (match) {

        // Return the structured query for exact matching

        return {

          isExactMatch: true,

          jobTitle: match[1]?.trim(),

          company: match[2]?.trim(),

          location: match[3]?.trim() || match[2]?.trim(),

          originalQuery: query.trim()

        }

      }

    }

    
    
    // Check if query contains common exact search indicators

    const exactSearchIndicators = ['at ', ' in ', '@', 'position:', 'company:', 'location:']

    const hasExactIndicators = exactSearchIndicators.some(indicator => 

      lowerQuery.includes(indicator.toLowerCase())

    )

    
    
    if (hasExactIndicators) {

      return {

        isExactMatch: true,

        originalQuery: query.trim(),

        jobTitle: query.trim(),

        company: query.trim(),

        location: query.trim()

      }

    }

    
    
    // Comprehensive keyword mappings for all job roles and variations

    const keywordMappings: { [key: string]: string[] } = {

      // Programming Languages & Technologies

      'python developer': ['python developer', 'python dev', 'python programmer', 'python engineer', 'python coder', 'py developer', 'pythonista'],

      'javascript developer': ['javascript developer', 'js developer', 'javascript dev', 'js dev', 'javascript engineer', 'js engineer', 'nodejs developer'],

      'java developer': ['java developer', 'java dev', 'java programmer', 'java engineer', 'java coder', 'javase developer'],

      'react developer': ['react developer', 'reactjs developer', 'react dev', 'react engineer', 'react programmer', 'react frontend'],

      'angular developer': ['angular developer', 'angularjs developer', 'angular dev', 'angular engineer', 'angular programmer'],

      'vue developer': ['vue developer', 'vuejs developer', 'vue dev', 'vue engineer', 'vue programmer'],

      'nodejs developer': ['nodejs developer', 'node developer', 'nodejs dev', 'node dev', 'node engineer', 'node programmer'],

      'php developer': ['php developer', 'php dev', 'php programmer', 'php engineer', 'php coder', 'laravel developer'],

      'c++ developer': ['c++ developer', 'cpp developer', 'c plus plus developer', 'c++ dev', 'cpp dev', 'c++ engineer'],

      'c# developer': ['c# developer', 'csharp developer', 'c# dev', 'csharp dev', 'c# engineer', 'csharp engineer'],

      'swift developer': ['swift developer', 'swift dev', 'swift engineer', 'ios developer', 'swift programmer'],

      'kotlin developer': ['kotlin developer', 'kotlin dev', 'kotlin engineer', 'android developer', 'kotlin programmer'],

      'flutter developer': ['flutter developer', 'flutter dev', 'flutter engineer', 'flutter programmer', 'dart developer'],

      'react native developer': ['react native developer', 'reactnative developer', 'react native dev', 'rn developer'],

      
      
      // Specific Developer Roles

      'frontend developer': ['frontend developer', 'front end developer', 'front-end developer', 'frontend dev', 'ui developer', 'frontend engineer'],

      'backend developer': ['backend developer', 'back end developer', 'back-end developer', 'backend dev', 'server developer', 'backend engineer'],

      'full stack developer': ['full stack developer', 'fullstack developer', 'full stack dev', 'fullstack dev', 'full stack engineer'],

      'mobile developer': ['mobile developer', 'mobile dev', 'mobile engineer', 'mobile programmer', 'app developer'],

      'web developer': ['web developer', 'web dev', 'web engineer', 'web programmer', 'website developer'],

      'game developer': ['game developer', 'game dev', 'game engineer', 'game programmer', 'gamedev', 'game development'],

      'blockchain developer': ['blockchain developer', 'blockchain dev', 'blockchain engineer', 'crypto developer', 'web3 developer'],

      'devops engineer': ['devops engineer', 'devops developer', 'dev ops engineer', 'devops', 'site reliability engineer', 'sre'],

      'cloud engineer': ['cloud engineer', 'cloud developer', 'aws engineer', 'azure engineer', 'gcp engineer', 'cloud architect'],

      'security engineer': ['security engineer', 'cyber security engineer', 'cybersecurity engineer', 'security developer', 'infosec engineer'],

      
      
      // Data & Analytics

      'data scientist': ['data scientist', 'data science', 'datascientist', 'data science engineer', 'ml engineer', 'machine learning engineer'],

      'data analyst': ['data analyst', 'data analysis', 'data analytics', 'data analyst engineer'],

      'data engineer': ['data engineer', 'data engineering', 'data pipeline engineer', 'etl developer', 'data infrastructure'],

      'business analyst': ['business analyst', 'business analysis', 'ba', 'business intelligence analyst', 'bi analyst'],

      'product analyst': ['product analyst', 'product analysis', 'product data analyst', 'product metrics analyst'],

      'research analyst': ['research analyst', 'market research analyst', 'research associate', 'analyst researcher'],

      
      
      // Design & UX/UI

      'ui designer': ['ui designer', 'user interface designer', 'interface designer', 'ui/ux designer', 'ui design'],

      'ux designer': ['ux designer', 'user experience designer', 'experience designer', 'ui/ux designer', 'ux design'],

      'graphic designer': ['graphic designer', 'graphics designer', 'visual designer', 'creative designer', 'graphic design'],

      'product designer': ['product designer', 'product design', 'product ux designer', 'product ui designer'],

      'web designer': ['web designer', 'website designer', 'web design', 'digital designer', 'online designer'],

      'game designer': ['game designer', 'game design', 'game artist', 'level designer', 'game developer designer'],

      'interior designer': ['interior designer', 'interior design', 'interior architect', 'space designer'],

      'fashion designer': ['fashion designer', 'fashion design', 'clothing designer', 'apparel designer'],

      
      
      // Marketing & Digital

      'digital marketing': ['digital marketing', 'digital marketer', 'online marketing', 'internet marketing', 'web marketing'],

      'social media marketing': ['social media marketing', 'smm', 'social media manager', 'social media specialist'],

      'content marketing': ['content marketing', 'content marketer', 'content strategy', 'content creator marketing'],

      'email marketing': ['email marketing', 'email marketer', 'email campaign manager', 'email specialist'],

      'seo specialist': ['seo specialist', 'seo expert', 'seo analyst', 'search engine optimization', 'seo consultant'],

      'sem specialist': ['sem specialist', 'sem expert', 'paid search specialist', 'google ads specialist', 'ppc specialist'],

      'affiliate marketing': ['affiliate marketing', 'affiliate manager', 'affiliate specialist', 'partner marketing'],

      'brand manager': ['brand manager', 'brand marketing manager', 'brand specialist', 'brand strategist'],

      'product manager': ['product manager', 'product owner', 'product specialist', 'product lead', 'pm'],

      'project manager': ['project manager', 'project lead', 'project coordinator', 'project specialist', 'pm'],

      'program manager': ['program manager', 'program lead', 'program coordinator', 'program specialist'],

      
      
      // Sales & Business Development

      'sales manager': ['sales manager', 'sales lead', 'sales head', 'sales director', 'sales supervisor'],

      'sales executive': ['sales executive', 'sales rep', 'sales representative', 'sales associate', 'sales officer'],

      'business development': ['business development', 'bd manager', 'business dev', 'biz dev', 'bd executive'],

      'account manager': ['account manager', 'account executive', 'client manager', 'customer manager', 'key account manager'],

      'sales engineer': ['sales engineer', 'technical sales', 'pre sales engineer', 'sales technical specialist'],

      'inside sales': ['inside sales', 'inside sales rep', 'inside sales executive', 'tele sales', 'phone sales'],

      'field sales': ['field sales', 'outside sales', 'field sales rep', 'territory sales', 'regional sales'],

      
      
      // Finance & Accounting

      'accountant': ['accountant', 'accounting', 'accounts executive', 'accounts officer', 'bookkeeper', 'financial accountant'],

      'financial analyst': ['financial analyst', 'finance analyst', 'fin analyst', 'financial planning analyst', 'fp&a analyst'],

      'tax consultant': ['tax consultant', 'tax advisor', 'tax specialist', 'tax expert', 'tax accountant'],

      'auditor': ['auditor', 'internal auditor', 'external auditor', 'audit associate', 'audit specialist'],

      'investment banker': ['investment banker', 'investment banking', 'ib analyst', 'corporate finance', 'mergers acquisitions'],

      'financial advisor': ['financial advisor', 'financial consultant', 'wealth manager', 'investment advisor', 'financial planner'],

      'treasury analyst': ['treasury analyst', 'treasury specialist', 'cash management analyst', 'liquidity analyst'],

      'credit analyst': ['credit analyst', 'credit specialist', 'credit risk analyst', 'loan analyst', 'underwriter'],

      
      
      // Operations & Supply Chain

      'operations manager': ['operations manager', 'ops manager', 'operations lead', 'operational manager', 'ops lead'],

      'supply chain manager': ['supply chain manager', 'scm', 'logistics manager', 'procurement manager', 'sourcing manager'],

      'quality assurance': ['quality assurance', 'qa engineer', 'qa analyst', 'quality control', 'qc engineer', 'test engineer'],

      'production manager': ['production manager', 'manufacturing manager', 'plant manager', 'production supervisor'],

      'inventory manager': ['inventory manager', 'inventory specialist', 'stock manager', 'warehouse manager'],

      'logistics coordinator': ['logistics coordinator', 'logistics specialist', 'shipping coordinator', 'transport coordinator'],

      'facilities manager': ['facilities manager', 'facility manager', 'facilities coordinator', 'building manager'],

      
      
      // Human Resources

      'hr manager': ['hr manager', 'human resources manager', 'hr head', 'hr director', 'people manager'],

      'hr executive': ['hr executive', 'hr specialist', 'hr coordinator', 'hr officer', 'people operations'],

      'recruiter': ['recruiter', 'talent acquisition', 'recruitment specialist', 'hiring manager', 'talent recruiter'],

      'hr business partner': ['hr business partner', 'hrbp', 'hr partner', 'people business partner'],

      'compensation analyst': ['compensation analyst', 'compensation specialist', 'payroll analyst', 'benefits analyst'],

      'training manager': ['training manager', 'learning development manager', 'ld manager', 'training specialist'],

      'employee relations': ['employee relations', 'er specialist', 'employee relations manager', 'workplace relations'],

      
      
      // Customer Service & Support

      'customer service': ['customer service', 'customer care', 'customer support', 'client service', 'customer success'],

      'customer support': ['customer support', 'technical support', 'support engineer', 'helpdesk', 'support specialist'],

      'call center': ['call center', 'call centre', 'contact center', 'customer service rep', 'telephone operator'],

      'customer success': ['customer success', 'customer success manager', 'cs manager', 'account success manager'],

      
      
      // Healthcare & Medical

      'doctor': ['doctor', 'physician', 'medical doctor', 'md', 'medical practitioner', 'doctorate'],

      'nurse': ['nurse', 'registered nurse', 'rn', 'nursing', 'staff nurse', 'nurse practitioner'],

      'pharmacist': ['pharmacist', 'pharmacy', 'pharmaceutical', 'drug specialist', 'dispensing pharmacist'],

      'medical technician': ['medical technician', 'lab technician', 'medical lab tech', 'clinical technician'],

      'physical therapist': ['physical therapist', 'physiotherapist', 'pt', 'physical therapy', 'rehabilitation therapist'],

      'dental hygienist': ['dental hygienist', 'dental assistant', 'oral hygienist', 'dental care specialist'],

      
      
      // Education & Training

      'teacher': ['teacher', 'instructor', 'educator', 'faculty', 'professor', 'tutor', 'trainer'],

      'principal': ['principal', 'headmaster', 'headmistress', 'school principal', 'head teacher'],

      'curriculum developer': ['curriculum developer', 'curriculum designer', 'educational content developer', 'instructional designer'],

      'training coordinator': ['training coordinator', 'training specialist', 'learning coordinator', 'development coordinator'],

      'academic advisor': ['academic advisor', 'student advisor', 'academic counselor', 'educational advisor'],

      
      
      // Legal & Compliance

      'lawyer': ['lawyer', 'attorney', 'advocate', 'legal counsel', 'solicitor', 'barrister', 'legal advisor'],

      'paralegal': ['paralegal', 'legal assistant', 'law clerk', 'legal secretary', 'legal support'],

      'compliance officer': ['compliance officer', 'compliance manager', 'regulatory compliance', 'compliance specialist'],

      'contract manager': ['contract manager', 'contract specialist', 'legal contract manager', 'agreement manager'],

      
      
      // Engineering (Various Disciplines)

      'mechanical engineer': ['mechanical engineer', 'mech engineer', 'mechanical eng', 'mechanical design engineer'],

      'civil engineer': ['civil engineer', 'civil eng', 'structural engineer', 'civil construction engineer'],

      'electrical engineer': ['electrical engineer', 'electrical eng', 'power engineer', 'electrical design engineer'],

      'chemical engineer': ['chemical engineer', 'chem engineer', 'process engineer', 'chemical process engineer'],

      'aerospace engineer': ['aerospace engineer', 'aviation engineer', 'aircraft engineer', 'aerospace design engineer'],

      'automotive engineer': ['automotive engineer', 'auto engineer', 'vehicle engineer', 'automotive design engineer'],

      'biomedical engineer': ['biomedical engineer', 'bio engineer', 'medical engineer', 'biomedical device engineer'],

      'environmental engineer': ['environmental engineer', 'env engineer', 'environmental consultant', 'sustainability engineer'],

      
      
      // Architecture & Construction

      'architect': ['architect', 'architecture', 'building architect', 'design architect', 'project architect'],

      'interior architect': ['interior architect', 'interior design architect', 'space architect', 'interior planner'],

      'landscape architect': ['landscape architect', 'landscape designer', 'garden architect', 'outdoor designer'],

      'construction manager': ['construction manager', 'site manager', 'construction supervisor', 'building manager'],

      'civil contractor': ['civil contractor', 'construction contractor', 'building contractor', 'general contractor'],

      
      
      // Media & Entertainment

      'journalist': ['journalist', 'reporter', 'news reporter', 'correspondent', 'media journalist'],

      'editor': ['editor', 'content editor', 'text editor', 'managing editor', 'copy editor'],

      'photographer': ['photographer', 'photo artist', 'camera operator', 'visual artist', 'photojournalist'],

      'videographer': ['videographer', 'video producer', 'video editor', 'motion graphics artist', 'video creator'],

      'content writer': ['content writer', 'content creator', 'copywriter', 'blog writer', 'article writer'],

      'social media manager': ['social media manager', 'social media specialist', 'smm', 'social media coordinator'],

      
      
      // Retail & E-commerce

      'store manager': ['store manager', 'retail manager', 'shop manager', 'store supervisor', 'retail supervisor'],

      'sales associate': ['sales associate', 'retail associate', 'store associate', 'sales clerk', 'retail clerk'],

      'merchandiser': ['merchandiser', 'merchandising specialist', 'visual merchandiser', 'product merchandiser'],

      'e-commerce manager': ['e-commerce manager', 'ecommerce manager', 'online store manager', 'digital commerce manager'],

      'category manager': ['category manager', 'product category manager', 'merchandise category manager'],

      
      
      // Hospitality & Tourism

      'hotel manager': ['hotel manager', 'hotel general manager', 'hotel operations manager', 'lodging manager'],

      'chef': ['chef', 'head chef', 'executive chef', 'kitchen chef', 'culinary chef', 'cook'],

      'restaurant manager': ['restaurant manager', 'food service manager', 'dining manager', 'restaurant supervisor'],

      'travel agent': ['travel agent', 'travel consultant', 'travel specialist', 'tourism agent', 'vacation planner'],

      'event manager': ['event manager', 'event coordinator', 'event planner', 'conference manager', 'meeting planner'],

      
      
      // General Terms (fallbacks) - Enhanced with more variations

      'developer': ['developer', 'devloper', 'developr', 'dev', 'programmer', 'coder', 'software developer', 'software dev', 'sw dev', 'prog', 'coding'],

      'engineer': ['engineer', 'engneer', 'enginer', 'engr', 'engineering', 'technical engineer', 'tech eng', 'technical', 'eng', 'tech'],

      'manager': ['manager', 'mangr', 'mgr', 'management', 'supervisor', 'lead', 'head', 'mgmt', 'superv', 'leadship', 'head of'],

      'analyst': ['analyst', 'analysit', 'analysis', 'research analyst', 'analyze', 'analytics', 'data analysis'],

      'consultant': ['consultant', 'consulting', 'advisor', 'specialist', 'expert', 'professional', 'cons', 'advice', 'consult'],

      'coordinator': ['coordinator', 'coordination', 'organizer', 'facilitator', 'liaison', 'coord', 'organize', 'facilitate'],

      'specialist': ['specialist', 'specialization', 'expert', 'professional', 'technician', 'spec', 'expertise', 'pro'],

      'assistant': ['assistant', 'associate', 'support', 'helper', 'aide', 'junior', 'asst', 'support staff', 'helper staff'],

      'director': ['director', 'head', 'chief', 'vp', 'vice president', 'executive', 'dir', 'head of', 'chief of', 'vice pres'],

      'executive': ['executive', 'senior', 'lead', 'principal', 'chief', 'head', 'exec', 'senior level', 'principal level'],

      
      
      // Additional Basic Terms and Shortforms

      'sales': ['sales', 'sale', 'selling', 'sell', 'salesperson', 'salesman', 'saleswoman', 'sales rep', 'revenue'],

      'marketing': ['marketing', 'market', 'promotion', 'promote', 'advertising', 'advertise', 'brand', 'campaign'],

      'hr': ['hr', 'human resources', 'human resource', 'people', 'personnel', 'staff', 'employee', 'workforce'],

      'finance': ['finance', 'financial', 'money', 'accounting', 'accounts', 'budget', 'revenue', 'profit', 'cost'],

      'admin': ['admin', 'administrative', 'administration', 'office', 'secretary', 'receptionist', 'clerk'],

      'support': ['support', 'help', 'assistance', 'service', 'customer service', 'technical support', 'helpdesk'],

      'design': ['design', 'designer', 'creative', 'art', 'graphics', 'visual', 'ui', 'ux', 'branding'],

      'content': ['content', 'writing', 'writer', 'copy', 'copywriter', 'blog', 'article', 'editorial', 'journalism'],

      'teaching': ['teaching', 'teacher', 'education', 'trainer', 'training', 'instructor', 'professor', 'tutor'],

      'healthcare': ['healthcare', 'health', 'medical', 'doctor', 'nurse', 'hospital', 'clinic', 'pharmacy'],

      'legal': ['legal', 'law', 'lawyer', 'attorney', 'court', 'justice', 'law firm', 'legal advice'],

      'retail': ['retail', 'store', 'shop', 'shopping', 'sales associate', 'cashier', 'merchandise'],

      'hospitality': ['hospitality', 'hotel', 'restaurant', 'food', 'catering', 'tourism', 'travel'],

      'construction': ['construction', 'building', 'contractor', 'architect', 'civil', 'site', 'project'],

      'manufacturing': ['manufacturing', 'production', 'factory', 'assembly', 'quality control', 'plant'],

      'transportation': ['transportation', 'logistics', 'shipping', 'delivery', 'driver', 'transport', 'freight'],

      'security': ['security', 'safety', 'guard', 'protection', 'surveillance', 'cyber security'],

      'cleaning': ['cleaning', 'janitor', 'maintenance', 'housekeeping', 'sanitation', 'custodial'],

      'food': ['food', 'cooking', 'chef', 'kitchen', 'culinary', 'beverage', 'restaurant'],

      'fitness': ['fitness', 'gym', 'trainer', 'exercise', 'wellness', 'health coach', 'personal trainer'],

      'beauty': ['beauty', 'salon', 'spa', 'cosmetics', 'hair', 'makeup', 'aesthetic'],

      'automotive': ['automotive', 'car', 'vehicle', 'mechanic', 'auto', 'garage', 'repair'],

      'technology': ['technology', 'tech', 'it', 'software', 'hardware', 'computer', 'digital', 'tech'],

      'communication': ['communication', 'telecom', 'phone', 'telephone', 'internet', 'network', 'wireless'],

      'real estate': ['real estate', 'property', 'realtor', 'broker', 'housing', 'land', 'commercial'],

      'banking': ['banking', 'bank', 'financial services', 'investment', 'loan', 'credit', 'mortgage'],

      'insurance': ['insurance', 'insurer', 'claims', 'policy', 'coverage', 'risk', 'actuary'],

      'government': ['government', 'public sector', 'civil service', 'public service', 'municipal', 'federal'],

      'nonprofit': ['nonprofit', 'ngo', 'charity', 'volunteer', 'social work', 'community service'],

      'media': ['media', 'journalism', 'news', 'broadcasting', 'television', 'radio', 'publishing'],

      'entertainment': ['entertainment', 'gaming', 'music', 'film', 'theater', 'arts', 'creative'],

      'sports': ['sports', 'athletic', 'fitness', 'coach', 'trainer', 'recreation', 'athlete'],

      'agriculture': ['agriculture', 'farming', 'crop', 'livestock', 'agricultural', 'farm', 'rural'],

      'energy': ['energy', 'power', 'electricity', 'oil', 'gas', 'renewable', 'solar', 'wind'],

      'environment': ['environment', 'environmental', 'sustainability', 'green', 'conservation', 'ecology'],

      
      
      // Common Shortforms and Abbreviations

      'ceo': ['ceo', 'chief executive officer', 'chief exec', 'president'],

      'cto': ['cto', 'chief technology officer', 'chief tech officer'],

      'cfo': ['cfo', 'chief financial officer', 'chief finance officer'],

      'coo': ['coo', 'chief operating officer', 'chief operations officer'],

      'vp': ['vp', 'vice president', 'vice pres', 'v.p.'],

      'svp': ['svp', 'senior vice president', 'senior vp'],

      'avp': ['avp', 'assistant vice president', 'assistant vp'],

      'senior': ['senior', 'sr', 'senior level', 'experienced'],

      'junior': ['junior', 'jr', 'entry level', 'fresher', 'beginner'],

      'intern': ['intern', 'internship', 'trainee', 'apprentice', 'inter', 'intirn', 'intrn', 'intership', 'internsip', 'internshp', 'trainee', 'apprentice'],

      'freelance': ['freelance', 'freelancer', 'contract', 'contractor', 'consultant'],

      'remote': ['remote', 'work from home', 'wfh', 'virtual', 'online'],

      'part time': ['part time', 'part-time', 'pt', 'half time', 'flexible hours'],

      'full time': ['full time', 'full-time', 'ft', 'permanent', 'regular'],

      'contract': ['contract', 'contractual', 'temp', 'temporary', 'project based'],

      
      
      // Technology Shortforms

      'ai': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning'],

      'ml': ['ml', 'machine learning', 'ai', 'artificial intelligence', 'deep learning'],

      'data': ['data', 'database', 'db', 'data management', 'data processing'],

      'cloud': ['cloud', 'aws', 'azure', 'gcp', 'cloud computing', 'saas'],

      'mobile': ['mobile', 'app', 'ios', 'android', 'smartphone', 'tablet'],

      'web': ['web', 'website', 'internet', 'online', 'digital', 'ecommerce'],

      'api': ['api', 'rest api', 'web service', 'integration', 'microservice'],

      'ui': ['ui', 'user interface', 'interface design', 'frontend', 'user experience'],

      'ux': ['ux', 'user experience', 'usability', 'user research', 'interaction design'],

      'qa': ['qa', 'quality assurance', 'testing', 'test engineer', 'quality control'],

      'devops': ['devops', 'dev ops', 'deployment', 'ci cd', 'automation'],

      'blockchain': ['blockchain', 'crypto', 'cryptocurrency', 'web3', 'defi'],

      'iot': ['iot', 'internet of things', 'connected devices', 'smart devices'],

      'ar': ['ar', 'augmented reality', 'mixed reality', 'virtual reality'],

      'vr': ['vr', 'virtual reality', 'immersive', '3d', 'simulation'],

      
      
      // Industry Shortforms

      'b2b': ['b2b', 'business to business', 'enterprise', 'corporate'],

      'b2c': ['b2c', 'business to consumer', 'retail', 'consumer'],

      'saas': ['saas', 'software as a service', 'cloud software', 'subscription'],

      'paas': ['paas', 'platform as a service', 'cloud platform'],

      'iaas': ['iaas', 'infrastructure as a service', 'cloud infrastructure'],

      'fintech': ['fintech', 'financial technology', 'digital finance', 'payments'],

      'edtech': ['edtech', 'education technology', 'e-learning', 'online education'],

      'healthtech': ['healthtech', 'health technology', 'digital health', 'medtech'],

      'proptech': ['proptech', 'property technology', 'real estate tech'],

      'agritech': ['agritech', 'agriculture technology', 'farm tech', 'agtech'],

      'cleantech': ['cleantech', 'clean technology', 'green tech', 'sustainability tech'],

      
      
      // Common Job Search Terms

      'job': ['job', 'position', 'role', 'opportunity', 'career', 'employment', 'work'],

      'career': ['career', 'profession', 'occupation', 'vocation', 'job', 'work'],

      'work': ['work', 'job', 'employment', 'labor', 'service', 'duty'],

      'employment': ['employment', 'job', 'work', 'career', 'occupation'],

      'hiring': ['hiring', 'recruitment', 'recruiting', 'talent acquisition', 'staffing'],

      'vacancy': ['vacancy', 'opening', 'position', 'opportunity', 'job opening'],

      'fresher': ['fresher', 'freshers', 'entry level', 'junior', 'beginner', 'new graduate', 'entry', 'fresh', 'newbie', 'novice', 'trainee', 'graduate', '0-1', '0 to 1', 'zero experience', 'no experience', 'starting', 'entry-level'],

      'experienced': ['experienced', 'senior', 'expert', 'professional', 'skilled'],

      'urgent': ['urgent', 'immediate', 'asap', 'priority', 'rush'],

      'walk in': ['walk in', 'walk-in', 'walkin', 'immediate joining'],

      'work from home': ['work from home', 'wfh', 'remote work', 'home office', 'virtual'],

      
      
      // Location Related Terms

      'bangalore': ['bangalore', 'bengaluru', 'blr', 'bangalore city'],

      'mumbai': ['mumbai', 'bombay', 'mum', 'mumbai city'],

      'delhi': ['delhi', 'ncr', 'new delhi', 'delhi ncr', 'gurgaon', 'noida'],

      'hyderabad': ['hyderabad', 'hyd', 'cyberabad', 'hyderabad city'],

      'chennai': ['chennai', 'madras', 'chn', 'chennai city'],

      'pune': ['pune', 'pun', 'pune city'],

      'kolkata': ['kolkata', 'calcutta', 'kol', 'kolkata city'],

      'ahmedabad': ['ahmedabad', 'amd', 'ahmedabad city'],

      'indore': ['indore', 'ind', 'indore city'],

      'chandigarh': ['chandigarh', 'chd', 'chandigarh city'],

      
      
      // Company Size Terms

      'startup': ['startup', 'start-up', 'early stage', 'seed stage', 'venture'],

      'midsize': ['midsize', 'mid-size', 'medium', 'mid level', 'growing company'],

      'enterprise': ['enterprise', 'large company', 'fortune 500', 'corporate', 'multinational'],

      'mnc': ['mnc', 'multinational', 'global company', 'international', 'global'],

      'unicorn': ['unicorn', 'billion dollar', 'high valuation', 'tech giant'],

      
      
      // Experience Level Terms - Enhanced

      'entry level': ['entry level', 'fresher', '0-1 years', 'beginner', 'new graduate', 'entry', 'fresh', 'junior', 'newbie', 'novice', 'trainee', 'graduate', '0-1', '0 to 1', 'zero experience', 'no experience', 'starting', 'entry-level', 'first job', 'career starter'],

      'mid level': ['mid level', 'mid-level', '2-5 years', 'intermediate', 'experienced', 'mid', 'middle', '2-5', '2 to 5', 'some experience', 'few years', 'developing', 'growing'],

      'senior level': ['senior level', 'senior-level', '5+ years', 'expert', 'leadership', 'senior', 'sr', '5+', '5 plus', 'experienced', 'expert', 'lead', 'principal', 'staff', 'tech lead', 'team lead'],

      'executive level': ['executive level', 'c-level', 'director level', 'vice president', 'executive', 'director', 'vp', 'head', 'chief', 'c-level', 'management', 'leadership', 'top level'],

      
      
      // Salary Related Terms

      'high salary': ['high salary', 'good pay', 'competitive salary', 'attractive package'],

      'low salary': ['low salary', 'budget friendly', 'affordable', 'cost effective'],

      'negotiable': ['negotiable', 'negotiable salary', 'salary negotiable', 'discuss salary'],

      
      
      // Work Arrangement Terms

      'flexible': ['flexible', 'flexible hours', 'flexible timing', 'work life balance'],

      'night shift': ['night shift', 'night work', 'evening shift', 'graveyard shift'],

      'day shift': ['day shift', 'day work', 'morning shift', 'regular hours'],

      'weekend': ['weekend', 'weekend work', 'saturday sunday', 'weekend shift'],

      
      
      // Skill Related Terms

      'leadership': ['leadership', 'leadership skills', 'team lead', 'management skills'],

      'problem solving': ['problem solving', 'analytical', 'critical thinking', 'troubleshooting'],

      'teamwork': ['teamwork', 'collaboration', 'team player', 'cooperative'],

      'time management': ['time management', 'organizational', 'planning', 'efficiency'],

      'sales skills': ['sales skills', 'selling', 'persuasion', 'negotiation', 'closing'],

      'technical skills': ['technical skills', 'technical', 'programming', 'software', 'hardware'],

      'creative': ['creative', 'creativity', 'innovative', 'design thinking', 'artistic'],

      'analytical': ['analytical', 'analysis', 'data analysis', 'research', 'statistical'],

      
      
      // Education Related Terms

      'graduate': ['graduate', 'bachelor', 'bachelors', 'degree', 'undergraduate'],

      'postgraduate': ['postgraduate', 'masters', 'master degree', 'mba', 'ms', 'ma'],

      'phd': ['phd', 'doctorate', 'doctoral', 'ph.d', 'research degree'],

      'diploma': ['diploma', 'certificate', 'certification', 'course completion'],

      'engineering': ['engineering', 'b.tech', 'be', 'b.e', 'engineering degree'],

      'mba': ['mba', 'master of business administration', 'business degree', 'management degree'],

      'computer science': ['computer science', 'cs', 'cse', 'computer engineering', 'it'],

      'commerce': ['commerce', 'b.com', 'bcom', 'business studies', 'accounting'],

      'arts': ['arts', 'ba', 'b.a', 'humanities', 'liberal arts'],

      'science': ['science', 'bsc', 'b.sc', 'natural sciences', 'pure sciences'],

    }

    
    
    // Check for exact matches first (highest priority)

    for (const [correctTerm, variations] of Object.entries(keywordMappings)) {

      if (variations.some(variation => 

        lowerQuery.includes(variation) || 

        variation.includes(lowerQuery) ||

        calculateSimilarity(lowerQuery, variation) > 0.8

      )) {

        return correctTerm

      }

    }

    
    
    // Check for partial matches and similar words (medium priority)

    for (const [correctTerm, variations] of Object.entries(keywordMappings)) {

      for (const variation of variations) {

        if (calculateSimilarity(lowerQuery, variation) > 0.7) {

          return correctTerm

        }

      }

    }

    
    
    // Check for word-by-word matching (lower priority)

    const queryWords = lowerQuery.split(/\s+/)

    for (const [correctTerm, variations] of Object.entries(keywordMappings)) {

      for (const variation of variations) {

        const variationWords = variation.split(/\s+/)

        if (queryWords.some(qWord => 

          variationWords.some(vWord => 

            calculateSimilarity(qWord, vWord) > 0.8

          )

        )) {

          return correctTerm

        }

      }

    }

    
    
    // Enhanced fallback: Check for partial matches in any direction

    for (const [correctTerm, variations] of Object.entries(keywordMappings)) {

      for (const variation of variations) {

        // Check if any word from query matches any word from variation

        if (queryWords.some(qWord => 

          variation.toLowerCase().split(/\s+/).some(vWord => 

            qWord.includes(vWord) || vWord.includes(qWord) || calculateSimilarity(qWord, vWord) > 0.6

          )

        )) {

          return correctTerm

        }

      }

    }

    
    
    // Ultra fallback: Check for single character differences and common typos

    for (const [correctTerm, variations] of Object.entries(keywordMappings)) {

      for (const variation of variations) {

        if (calculateSimilarity(lowerQuery, variation) > 0.5) {

          return correctTerm

        }

      }

    }

    
    
    // Final fallback: If no match found, return original query but with basic processing

    // This ensures even completely unknown terms get basic search functionality

    return query.trim()

  }



  // Simple similarity calculation (Levenshtein distance based)

  const calculateSimilarity = (str1: string, str2: string): number => {

    const longer = str1.length > str2.length ? str1 : str2

    const shorter = str1.length > str2.length ? str2 : str1

    
    
    if (longer.length === 0) return 1.0

    
    
    const distance = levenshteinDistance(longer, shorter)

    return (longer.length - distance) / longer.length

  }

  
  
  // Levenshtein distance calculation

  const levenshteinDistance = (str1: string, str2: string): number => {

    const matrix = []

    
    
    for (let i = 0; i <= str2.length; i++) {

      matrix[i] = [i]

    }

    
    
    for (let j = 0; j <= str1.length; j++) {

      matrix[0][j] = j

    }

    
    
    for (let i = 1; i <= str2.length; i++) {

      for (let j = 1; j <= str1.length; j++) {

        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {

          matrix[i][j] = matrix[i - 1][j - 1]

        } else {

          matrix[i][j] = Math.min(

            matrix[i - 1][j - 1] + 1,

            matrix[i][j - 1] + 1,

            matrix[i - 1][j] + 1

          )

        }

      }

    }

    
    
    return matrix[str2.length][str1.length]

  }



  const experienceLevels = [

    "0-1",

    "2-5",

    "6-10",

    "11-15",

    "16+",

  ]



  const jobTypes = [

    "Full-time",

    "Part-time",

    "part-time", // Lowercase version for navbar compatibility

    "Contract",

    "Internship",

    "Freelance",

  ]



  const locations = [

    "Bangalore",

    "Mumbai",

    "Delhi",

    "Hyderabad",

    "Chennai",

    "Pune",

    "Gurgaon",

    "Noida",

    "Kolkata",

    "Ahmedabad",

    "Remote",

    "Work from home",

  ]



  // Curated lists for better UX

  const industries = [

    'Information Technology', 'Banking', 'Financial Services', 'Insurance', 'Healthcare', 'Pharmaceuticals',

    'Education', 'E-Learning', 'Manufacturing', 'Automotive', 'Aerospace', 'Telecommunications', 'Retail',

    'E-Commerce', 'FMCG', 'Hospitality', 'Travel & Tourism', 'Construction', 'Real Estate', 'Energy', 'Oil & Gas',

    'Media & Entertainment', 'Logistics & Supply Chain', 'Consulting', 'Government', 'Non-Profit', 'Agriculture'

  ]



  const departments = [

    'Engineering', 'Information Technology', 'Product Management', 'Design', 'Data Science', 'Analytics', 'Quality Assurance',

    'DevOps', 'Cloud', 'Cybersecurity', 'Human Resources', 'Talent Acquisition', 'Learning & Development', 'Finance',

    'Accounting', 'Legal', 'Compliance', 'Sales', 'Business Development', 'Marketing', 'Digital Marketing', 'Content',

    'Operations', 'Administration', 'Customer Support', 'Technical Support', 'Supply Chain', 'Procurement', 'Logistics',

    'Research & Development', 'Project Management', 'Strategy', 'Corporate Communications'

  ]



  const commonRoles = [

    'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Data Analyst',

    'Data Scientist', 'ML Engineer', 'QA Engineer', 'Automation Engineer', 'UI/UX Designer', 'Product Manager',

    'Project Manager', 'Business Analyst', 'HR Manager', 'Talent Acquisition Specialist', 'Finance Executive',

    'Accountant', 'Legal Counsel', 'Compliance Officer', 'Sales Executive', 'Sales Manager', 'Marketing Manager',

    'Digital Marketing Executive', 'Content Writer', 'Customer Support Executive', 'Operations Manager'

  ]



  // Filter and sort jobs

  const allJobs = useMemo(() => {

    // Merge jobs and preferredJobs, de-duplicate by id, mark preferred

    const byId: Record<string, Job> = {}

    jobs.forEach(j => { byId[j.id] = j })

    preferredJobs.forEach(pj => { byId[pj.id] = { ...pj, isPreferred: true } as Job })

    return Object.values(byId)

  }, [jobs, preferredJobs])



  const filteredJobs = useMemo(() => {

    let filtered = [...allJobs]

    console.log('🔄 Starting with', allJobs.length, 'jobs')



    // Enhanced search filter with smart matching and comprehensive job role detection

    if (filters.search) {

      console.log('🔍 Applying enhanced search filter:', filters.search)

      const processedSearch = processSearchQuery(filters.search)

      
      
      filtered = filtered.filter(job => {

        const jobTitle = job.title.toLowerCase()

        const companyName = job.company.name.toLowerCase()

        const jobSkills = job.skills.map(skill => skill.toLowerCase())

        const jobDescription = job.description.toLowerCase()

        const jobCategory = job.category.toLowerCase()

        const jobLocation = job.location.toLowerCase()

        
        
        // Handle exact matches with structured data

        if (typeof processedSearch === 'object' && processedSearch.isExactMatch) {

          console.log('🎯 Processing exact match:', processedSearch)

          
          
          // For exact matches, require precise matching

          let exactMatch = true

          
          
          if (processedSearch.jobTitle) {

            exactMatch = exactMatch && (

              jobTitle.includes(processedSearch.jobTitle.toLowerCase()) ||

              processedSearch.jobTitle.toLowerCase().includes(jobTitle)

            )

          }

          
          
          if (processedSearch.company) {

            exactMatch = exactMatch && (

              companyName.includes(processedSearch.company.toLowerCase()) ||

              processedSearch.company.toLowerCase().includes(companyName)

            )

          }

          
          
          if (processedSearch.location) {

            exactMatch = exactMatch && (

              jobLocation.includes(processedSearch.location.toLowerCase()) ||

              processedSearch.location.toLowerCase().includes(jobLocation)

            )

          }

          
          
          return exactMatch

        }

        
        
        // Regular search processing

        const searchLower = typeof processedSearch === 'string' ? processedSearch.toLowerCase().trim() : filters.search.toLowerCase().trim()

        const originalSearchLower = filters.search.toLowerCase().trim()

        
        
        console.log('🔍 Processing regular search:', { searchLower, originalSearchLower, jobTitle: job.title, companyName: job.company.name })

        
        
        // Check for exact matches in title, company, skills, description, category, and location

        const exactMatch = 

          jobTitle.includes(searchLower) ||

          companyName.includes(searchLower) ||

          jobSkills.some(skill => skill.includes(searchLower)) ||

          jobDescription.includes(searchLower) ||

          jobCategory.includes(searchLower) ||

          jobLocation.includes(searchLower)
        
        
        
        // Check for original search term as well (in case no processing was done)

        const originalMatch = 

          jobTitle.includes(originalSearchLower) ||

          companyName.includes(originalSearchLower) ||

          jobSkills.some(skill => skill.includes(originalSearchLower)) ||

          jobDescription.includes(originalSearchLower) ||

          jobCategory.includes(originalSearchLower) ||

          jobLocation.includes(originalSearchLower)
        
        
        
        // Check for partial word matches and synonyms

        const words = searchLower.split(/\s+/)

        const originalWords = originalSearchLower.split(/\s+/)

        
        
        const wordMatch = words.some(word => 

          word.length > 2 && (

            jobTitle.includes(word) ||

            companyName.includes(word) ||

            jobSkills.some(skill => skill.includes(word)) ||

            jobDescription.includes(word) ||

            jobCategory.includes(word) ||

            jobLocation.includes(word)

          )

        )

        
        
        const originalWordMatch = originalWords.some(word => 

          word.length > 2 && (

            jobTitle.includes(word) ||

            companyName.includes(word) ||

            jobSkills.some(skill => skill.includes(word)) ||

            jobDescription.includes(word) ||

            jobCategory.includes(word) ||

            jobLocation.includes(word)

          )

        )

        
        
        // Check for skill-based matching (for programming languages, technologies, etc.)

        const skillMatch = jobSkills.some(skill => 

          calculateSimilarity(skill, searchLower) > 0.7 ||

          calculateSimilarity(skill, originalSearchLower) > 0.7

        )

        
        
        const result = exactMatch || originalMatch || wordMatch || originalWordMatch || skillMatch

        if (result) {

          console.log('✅ Search match found:', { 

            jobTitle: job.title, 

            companyName: job.company.name, 

            searchLower, 

            originalSearchLower,

            exactMatch, 

            originalMatch, 

            wordMatch, 

            originalWordMatch, 

            skillMatch 

          })

        }

        return result

      })

    }



    // Location filter - Case insensitive with better matching

    if (filters.location) {

      const locationLower = filters.location.toLowerCase().trim()

      filtered = filtered.filter(job =>

        job.location.toLowerCase().includes(locationLower) ||

        locationLower.includes(job.location.toLowerCase()) ||

        // Handle common location variations

        (locationLower.includes('remote') && (job.remote || job.workMode?.toLowerCase().includes('remote')))

      )

    }



    // Experience level filter

    if (filters.experienceLevels.length > 0) {

      // UI is now sending experienceRange to backend; client-side list still filters by substring for safety

      filtered = filtered.filter(job =>

        filters.experienceLevels.some(level => job.experience.toLowerCase().includes(level.toLowerCase()))

      )

    }



    // Job type filter

    if (filters.jobTypes.length > 0) {

      filtered = filtered.filter(job =>

        filters.jobTypes.some(filterType => job.type.toLowerCase() === filterType.toLowerCase())

      )

    }



    // Industry (company industry) client-side safeguard

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



    // Department

    if (filters.department) {

      const q = filters.department.toLowerCase()

      filtered = filtered.filter(job => String((job as any).department || job.category || '').toLowerCase().includes(q))

    }



    // Role / Designation

    if (filters.role) {

      const q = filters.role.toLowerCase()

      filtered = filtered.filter(job => job.title.toLowerCase().includes(q))

    }



    // IMPORTANT: When multiple category filters are set (industryCategories, departmentCategories, roleCategories),
    // use OR logic - a job should match if it matches ANY of these categories, not ALL of them.
    // This allows "HR jobs" to show HR-related jobs even if they don't match all three categories.

    const hasCategoryFilters = 
      (filters.industryCategories && filters.industryCategories.length > 0) ||
      (filters.departmentCategories && filters.departmentCategories.length > 0) ||
      (filters.roleCategories && filters.roleCategories.length > 0)

    // If multiple category filters are present, apply them with OR logic
    if (hasCategoryFilters) {
      const beforeCount = filtered.length
      
      console.log('🎯 Applying category filters:', {
        industryCategories: filters.industryCategories,
        departmentCategories: filters.departmentCategories,
        roleCategories: filters.roleCategories,
        totalJobsBeforeFilter: beforeCount
      })

      filtered = filtered.filter(job => {
        let matchesIndustry = false
        let matchesDepartment = false
        let matchesRole = false

        // Check industry match - CRITICAL: Use job.industryType first (from database)
        if (filters.industryCategories && filters.industryCategories.length > 0) {
          // Get industryType from multiple sources and clean it
          const rawIndustryType = (job as any).industryType || (job as any).metadata?.industryType || ''
          const jobIndustryType = String(rawIndustryType).toLowerCase().trim().replace(/\s*\(\d+\)\s*$/, '').trim()
          const companyIndustry = ((job as any).company?.industry || '').toLowerCase().trim().replace(/\s*\(\d+\)\s*$/, '').trim()
          const companyIndustries = Array.isArray((job as any).company?.industries) 
            ? (job as any).company.industries.map((ind: any) => String(ind).toLowerCase().trim().replace(/\s*\(\d+\)\s*$/, '').trim())
            : []
          const jobCategory = ((job as any).category || '').toLowerCase().trim()
          const companyName = job.company.name.toLowerCase().trim()
          // CRITICAL: Include industryType first - it's the most reliable field
          const allIndustrySources = [jobIndustryType, companyIndustry, ...companyIndustries, jobCategory, companyName].filter(Boolean)

          matchesIndustry = filters.industryCategories.some(industry => {
            // Clean filter value - remove count info like "(2378)"
            const industryLower = industry.toLowerCase().trim().replace(/\s*\(\d+\)\s*$/, '').trim()
            
            // CRITICAL: Only match if we have a valid industryType (strict matching)
            const hasValidIndustry = jobIndustryType && jobIndustryType !== 'n/a' && jobIndustryType !== ''
            
            // CRITICAL: For category filters, ONLY use jobIndustryType for direct matching
            // Do NOT use companyIndustries, jobCategory, or companyName - they cause false matches
            const cleanedJobIndustryType = hasValidIndustry ? jobIndustryType.replace(/\s*\(\d+\)\s*$/, '').trim() : ''
            
            // Direct match: only match if jobIndustryType explicitly matches the filter
            // CRITICAL: Be very strict - only match exact or clear substrings
            const directMatch = hasValidIndustry && (
              cleanedJobIndustryType === industryLower || 
              // Only allow includes if filter is a clear substring (avoid partial word matches)
              (industryLower.length >= 4 && cleanedJobIndustryType.includes(industryLower)) || 
              (cleanedJobIndustryType.length >= 4 && industryLower.includes(cleanedJobIndustryType)) ||
              // Allow matching if first significant word matches (for categories like "IT Services")
              (industryLower.split(' ')[0].length >= 2 && cleanedJobIndustryType.split(' ')[0] === industryLower.split(' ')[0])
            )
            
            // ONLY use fallback sources (companyIndustries, etc.) if NO jobIndustryType exists
            const fallbackMatch = !hasValidIndustry && allIndustrySources.some(source => {
              const cleanedSource = source.replace(/\s*\(\d+\)\s*$/, '').trim()
              return cleanedSource === industryLower || 
                     cleanedSource.includes(industryLower) || 
                     industryLower.includes(cleanedSource.split(' ')[0])
            })
            
            // Build abbreviation match checks (using already declared cleanedJobIndustryType)
            let abbreviationMatch = false
            if (hasValidIndustry && cleanedJobIndustryType) {
              // IT-related
              if ((industryLower.includes('it services') || industryLower.includes('it consulting')) && 
                  (cleanedJobIndustryType.includes('it services') || cleanedJobIndustryType.includes('it consulting') || cleanedJobIndustryType.includes('software') || cleanedJobIndustryType.includes('technology'))) {
                abbreviationMatch = true
              }
              // Software Product
              else if (industryLower.includes('software product') &&
                      (cleanedJobIndustryType.includes('software product') || cleanedJobIndustryType.includes('software') || cleanedJobIndustryType.includes('technology'))) {
                abbreviationMatch = true
              }
              // Internet
              else if (industryLower === 'internet' &&
                      (cleanedJobIndustryType.includes('internet') || cleanedJobIndustryType.includes('technology') || cleanedJobIndustryType.includes('software'))) {
                abbreviationMatch = true
              }
              // Data Science
              else if ((industryLower.includes('data science') || industryLower.includes('data analytics')) &&
                      (cleanedJobIndustryType.includes('medical') || cleanedJobIndustryType.includes('pharmaceutical') || cleanedJobIndustryType.includes('research') || cleanedJobIndustryType.includes('analytics') || cleanedJobIndustryType.includes('biotechnology') || cleanedJobIndustryType.includes('clinical'))) {
                abbreviationMatch = true
              }
              // IT general
              else if ((industryLower === 'it' || industryLower.includes('it ')) && 
                      (cleanedJobIndustryType.includes('it') || cleanedJobIndustryType.includes('software') || cleanedJobIndustryType.includes('technology') || cleanedJobIndustryType.includes('information technology'))) {
                abbreviationMatch = true
              }
              // FinTech
              else if (industryLower === 'fintech' && (cleanedJobIndustryType.includes('financial') || cleanedJobIndustryType.includes('banking') || cleanedJobIndustryType.includes('fintech'))) {
                abbreviationMatch = true
              }
              // HR-related
              else if ((industryLower.includes('education') || industryLower.includes('training') || industryLower.includes('recruitment') || industryLower.includes('hr') || industryLower.includes('human resources')) &&
                      (cleanedJobIndustryType.includes('education') || cleanedJobIndustryType.includes('training') || cleanedJobIndustryType.includes('recruitment') || cleanedJobIndustryType.includes('hr') || cleanedJobIndustryType.includes('human resources'))) {
                abbreviationMatch = true
              }
              // Medical/Healthcare
              else if ((industryLower.includes('medical services') || industryLower.includes('healthcare')) &&
                      (cleanedJobIndustryType.includes('medical') || cleanedJobIndustryType.includes('healthcare') || cleanedJobIndustryType.includes('health'))) {
                abbreviationMatch = true
              }
              // Sales-related
              else if ((industryLower.includes('retail') || industryLower.includes('fmcg') || industryLower.includes('real estate') || industryLower.includes('travel') || industryLower.includes('tourism') || industryLower.includes('hotels') || industryLower.includes('restaurants') || industryLower.includes('automobile') || industryLower.includes('banking') || industryLower.includes('lending') || industryLower.includes('insurance')) &&
                      (cleanedJobIndustryType.includes('retail') || cleanedJobIndustryType.includes('fmcg') || cleanedJobIndustryType.includes('real estate') || cleanedJobIndustryType.includes('travel') || cleanedJobIndustryType.includes('tourism') || cleanedJobIndustryType.includes('hotels') || cleanedJobIndustryType.includes('restaurants') || cleanedJobIndustryType.includes('automobile') || cleanedJobIndustryType.includes('banking') || cleanedJobIndustryType.includes('lending') || cleanedJobIndustryType.includes('insurance'))) {
                abbreviationMatch = true
              }
              // Marketing-related
              else if ((industryLower.includes('media') || industryLower.includes('entertainment') || industryLower.includes('broadcasting') || industryLower.includes('advertising') || industryLower.includes('marketing') || industryLower.includes('pr') || industryLower.includes('gaming') || industryLower.includes('publishing') || industryLower.includes('e-commerce') || industryLower.includes('internet') || industryLower.includes('telecom') || industryLower.includes('isp')) &&
                      (cleanedJobIndustryType.includes('media') || cleanedJobIndustryType.includes('entertainment') || cleanedJobIndustryType.includes('broadcasting') || cleanedJobIndustryType.includes('advertising') || cleanedJobIndustryType.includes('marketing') || cleanedJobIndustryType.includes('pr') || cleanedJobIndustryType.includes('gaming') || cleanedJobIndustryType.includes('publishing') || cleanedJobIndustryType.includes('e-commerce') || cleanedJobIndustryType.includes('internet') || cleanedJobIndustryType.includes('telecom') || cleanedJobIndustryType.includes('isp'))) {
                abbreviationMatch = true
              }
              // Engineering-related
              else if ((industryLower.includes('industrial equipment') || industryLower.includes('auto components') || industryLower.includes('chemicals') || industryLower.includes('building material') || industryLower.includes('automobile') || industryLower.includes('electrical equipment') || industryLower.includes('industrial automation') || industryLower.includes('iron') || industryLower.includes('steel') || industryLower.includes('construction') || industryLower.includes('infrastructure') || industryLower.includes('electronics manufacturing') || industryLower.includes('electronic components') || industryLower.includes('hardware') || industryLower.includes('networking') || industryLower.includes('power') || industryLower.includes('energy') || industryLower.includes('oil') || industryLower.includes('gas') || industryLower.includes('renewable energy')) &&
                      (cleanedJobIndustryType.includes('industrial') || cleanedJobIndustryType.includes('equipment') || cleanedJobIndustryType.includes('auto') || cleanedJobIndustryType.includes('chemicals') || cleanedJobIndustryType.includes('building') || cleanedJobIndustryType.includes('material') || cleanedJobIndustryType.includes('automobile') || cleanedJobIndustryType.includes('electrical') || cleanedJobIndustryType.includes('automation') || cleanedJobIndustryType.includes('iron') || cleanedJobIndustryType.includes('steel') || cleanedJobIndustryType.includes('construction') || cleanedJobIndustryType.includes('infrastructure') || cleanedJobIndustryType.includes('electronics') || cleanedJobIndustryType.includes('hardware') || cleanedJobIndustryType.includes('networking') || cleanedJobIndustryType.includes('power') || cleanedJobIndustryType.includes('energy') || cleanedJobIndustryType.includes('oil') || cleanedJobIndustryType.includes('gas') || cleanedJobIndustryType.includes('renewable'))) {
                abbreviationMatch = true
              }
            }

            return directMatch || fallbackMatch || abbreviationMatch
          })
          
          // Debug: Log if no industry match found
          if (!matchesIndustry && filters.industryCategories && filters.industryCategories.length > 0) {
            console.log('🔍 Industry filter check:', {
              jobTitle: job.title,
              jobIndustryType: (job as any).industryType || 'N/A',
              filterIndustries: filters.industryCategories,
              rawIndustryType: (job as any).industryType
            })
          }
        }

        // Check department match - CRITICAL: Use job.department first (from database)
        if (filters.departmentCategories && filters.departmentCategories.length > 0) {
          const jobDepartment = String((job as any).department || (job as any).metadata?.department || '').toLowerCase().trim()
          const jobCategory = (job.category || '').toLowerCase().trim()
          const jobTitle = job.title.toLowerCase().trim()

          matchesDepartment = filters.departmentCategories.some(department => {
            const deptLower = department.toLowerCase().trim()
            const deptWords = deptLower.split(/\s+/).filter(w => w.length > 2)

            // CRITICAL: Exact match first (e.g., "Engineering" matches "Engineering")
            const exactMatch = 
              jobDepartment === deptLower ||
              deptLower === jobDepartment
            
            // CRITICAL: Only match if jobDepartment exists and is not empty/N/A
            const hasValidDepartment = jobDepartment && jobDepartment !== 'n/a' && jobDepartment !== '' && jobDepartment.length > 0
            
            // CRITICAL: Direct matching - ONLY use department field
            const directMatch = hasValidDepartment && (
              exactMatch ||
              jobDepartment.includes(deptLower) ||
              deptLower.includes(jobDepartment) ||
              // Handle variations like "Engineering - Software & QA" matching "Engineering - Software & QA"
              (deptLower.includes('engineering') && jobDepartment.includes('engineering')) ||
              (deptLower.includes('engineering - software') && jobDepartment.includes('engineering - software')) ||
              (deptLower.includes('data science') && (jobDepartment.includes('data science') || jobDepartment.includes('data science & analytics'))) ||
              (deptLower.includes('data science & analytics') && (jobDepartment.includes('data science') || jobDepartment === 'data science & analytics')) ||
              (deptLower.includes('it') && jobDepartment.includes('it')) ||
              (deptLower.includes('marketing') && jobDepartment.includes('marketing')) ||
              (deptLower.includes('sales') && jobDepartment.includes('sales')) ||
              (deptLower.includes('human resources') && jobDepartment.includes('human resources'))
            )

            // Only use word matching if department exists
            const wordMatch = hasValidDepartment && deptWords.length > 0 && deptWords.some(word => 
              jobDepartment.includes(word)
            )

            // Only use abbreviation matching if department exists
            const abbreviationMatch = hasValidDepartment && (
              deptLower.includes('engineering') &&
                jobDepartment.includes('engineering') ||
              (deptLower.includes('it') || deptLower.includes('information security')) &&
                jobDepartment.includes('it') ||
              deptLower.includes('data science') &&
                jobDepartment.includes('data') ||
              deptLower.includes('quality assurance') &&
                jobDepartment.includes('quality') ||
              // HR-related departments
              (deptLower.includes('human resources') || deptLower.includes('hr')) &&
                (jobDepartment.includes('human resources') || jobDepartment.includes('hr')) ||
              // Sales-related departments
              (deptLower.includes('sales') || deptLower.includes('business development')) &&
                (jobDepartment.includes('sales') || jobDepartment.includes('business development')) ||
              // Marketing-related departments
              (deptLower.includes('marketing') || deptLower.includes('communication')) &&
                (jobDepartment.includes('marketing') || jobDepartment.includes('communication'))
            )

            return directMatch || wordMatch || abbreviationMatch
          })
          
          // Debug: Log if no department match found
          if (!matchesDepartment && filters.departmentCategories && filters.departmentCategories.length > 0) {
            console.log('🔍 Department filter check:', {
              jobTitle: job.title,
              jobDepartment: (job as any).department || 'N/A',
              filterDepartments: filters.departmentCategories,
              rawDepartment: (job as any).department
            })
          }
        }

        // Check role match - CRITICAL: Use job.roleCategory first (from database)
        if (filters.roleCategories && filters.roleCategories.length > 0) {
          const jobRoleCategory = String((job as any).roleCategory || (job as any).metadata?.roleCategory || '').toLowerCase().trim()
          const jobTitle = job.title.toLowerCase().trim()
          const jobCategory = (job.category || '').toLowerCase().trim()
          const jobSkills = (job.skills || []).join(' ').toLowerCase().trim()

          matchesRole = filters.roleCategories.some(role => {
            const roleLower = role.toLowerCase().trim()
            const roleWords = roleLower.split(/\s+/).filter(w => w.length > 2)

            // CRITICAL: Only match if jobRoleCategory actually exists (not empty/N/A)
            const hasValidRoleCategory = jobRoleCategory && jobRoleCategory !== 'n/a' && jobRoleCategory !== '' && jobRoleCategory.length > 0
            
            // CRITICAL: Exact match first (e.g., "Software Development" matches "Software Development")
            const exactMatch = 
              jobRoleCategory === roleLower ||
              roleLower === jobRoleCategory

            // CRITICAL: Check job.roleCategory - match if it contains the filter or vice versa
            const directMatch = hasValidRoleCategory && (
              exactMatch ||
              jobRoleCategory.includes(roleLower) ||
              roleLower.includes(jobRoleCategory) ||
              // Handle variations - match if key words are present
              (roleLower.includes('software development') && jobRoleCategory.includes('software')) ||
              (roleLower.includes('software development') && jobRoleCategory.includes('development')) ||
              (roleLower.includes('data science & analytics') && (jobRoleCategory.includes('data science') || jobRoleCategory.includes('analytics'))) ||
              (roleLower.includes('data science') && (jobRoleCategory.includes('data science') || jobRoleCategory.includes('data') || jobRoleCategory.includes('analytics'))) ||
              (roleLower.includes('it') && jobRoleCategory.includes('it')) ||
              (roleLower.includes('marketing') && jobRoleCategory.includes('marketing'))
            )

            // CRITICAL: Only use wordMatch/abbreviationMatch if roleCategory exists (strict matching)
            const wordMatch = hasValidRoleCategory && roleWords.length > 0 && roleWords.some(word => 
              jobRoleCategory.includes(word)
            )

            const abbreviationMatch = hasValidRoleCategory && (
              (roleLower.includes('software development') || roleLower.includes('software engineer')) &&
                jobRoleCategory.includes('software') ||
              (roleLower.includes('it') || roleLower.includes('information security')) &&
                jobRoleCategory.includes('it') ||
              (roleLower.includes('data science') || roleLower.includes('machine learning') || roleLower.includes('data analytics')) &&
                jobRoleCategory.includes('data') ||
              roleLower.includes('engineering') &&
                jobRoleCategory.includes('engineering') ||
              roleLower.includes('devops') &&
                jobRoleCategory.includes('devops') ||
              // HR-related roles
              (roleLower.includes('human resources') || roleLower.includes('hr') || roleLower.includes('recruitment')) &&
                jobRoleCategory.includes('human resources') ||
              // Sales-related roles
              (roleLower.includes('sales') || roleLower.includes('business development') || roleLower.includes('bd') || roleLower.includes('pre sales') || roleLower.includes('customer success')) &&
                jobRoleCategory.includes('sales') ||
              // Marketing-related roles
              (roleLower.includes('marketing') || roleLower.includes('digital marketing') || roleLower.includes('content') || roleLower.includes('editorial') || roleLower.includes('journalism')) &&
                jobRoleCategory.includes('marketing')
            )

            return directMatch || wordMatch || abbreviationMatch
          })
          
          // Debug: Log if no role match found
          if (!matchesRole && filters.roleCategories && filters.roleCategories.length > 0) {
            console.log('🔍 Role filter check:', {
              jobTitle: job.title,
              jobRoleCategory: (job as any).roleCategory || 'N/A',
              filterRoles: filters.roleCategories,
              rawRoleCategory: (job as any).roleCategory
            })
          }
        }

        // Use OR logic - job matches if it matches ANY category filter
        const match = matchesIndustry || matchesDepartment || matchesRole
        
        if (match) {
          console.log('✅ Category filter MATCH:', { 
            jobTitle: job.title,
            jobIndustryType: (job as any).industryType || 'N/A',
            jobDepartment: (job as any).department || 'N/A',
            jobRoleCategory: (job as any).roleCategory || 'N/A',
            matchesIndustry,
            matchesDepartment,
            matchesRole,
            matchReason: matchesIndustry ? 'industry' : matchesDepartment ? 'department' : matchesRole ? 'role' : 'unknown'
          })
        } else {
          // Debug non-matches to see why they didn't match
          const hasAnyFilter = filters.industryCategories?.length || filters.departmentCategories?.length || filters.roleCategories?.length
          if (hasAnyFilter) {
            console.log('❌ Category filter NO MATCH:', { 
              jobTitle: job.title,
              jobIndustryType: (job as any).industryType || 'N/A',
              jobDepartment: (job as any).department || 'N/A',
              jobRoleCategory: (job as any).roleCategory || 'N/A',
              filtersIndustry: filters.industryCategories,
              filtersDept: filters.departmentCategories,
              filtersRole: filters.roleCategories
            })
          }
        }

        return match
      })

      console.log(`🎯 Category filters result: ${beforeCount} → ${filtered.length} jobs`)
      if (filtered.length === 0 && beforeCount > 0) {
        console.warn('⚠️ WARNING: All jobs filtered out!', {
          sampleJob: jobs.length > 0 ? {
            title: jobs[0].title,
            industryType: (jobs[0] as any).industryType,
            department: (jobs[0] as any).department,
            roleCategory: (jobs[0] as any).roleCategory,
            category: (jobs[0] as any).category
          } : 'No jobs',
          activeFilters: {
            industryCategories: filters.industryCategories,
            departmentCategories: filters.departmentCategories,
            roleCategories: filters.roleCategories
          }
        })
      }
    }

    // Note: Individual category filters below are now only applied if the OR logic block above didn't run
    // This maintains backward compatibility for cases where only one category filter is used

    // Role Categories - Standalone filter (only if OR logic didn't apply)
    if (!hasCategoryFilters && filters.roleCategories && filters.roleCategories.length > 0) {

      console.log('🎯 Applying role categories filter:', filters.roleCategories)

      filtered = filtered.filter(job => {

        const jobTitle = job.title.toLowerCase().trim()

        const jobCategory = job.category.toLowerCase().trim()

        const jobSkills = job.skills.join(' ').toLowerCase().trim()

        
        
        return filters.roleCategories!.some(role => {

          const roleLower = role.toLowerCase().trim()

          return jobTitle.includes(roleLower) || 

                 jobCategory.includes(roleLower) ||

                 jobSkills.includes(roleLower) ||

                 // Partial matching for common terms

                 roleLower.includes(jobTitle.split(' ')[0]) ||

                 jobTitle.includes(roleLower.split(' ')[0]) ||
                 // Enhanced matching for IT/Software/Data Science jobs - CRITICAL for "AI Engineer", "Software Engineer"
                 (roleLower.includes('software') && (jobTitle.includes('software') || jobTitle.includes('engineer') || jobTitle.includes('developer'))) ||
                 (roleLower.includes('it') && (jobTitle.includes('engineer') || jobTitle.includes('developer') || jobTitle.includes('it') || jobCategory.includes('technology'))) ||
                 (roleLower.includes('data science') && (jobTitle.includes('data') || jobTitle.includes('analyst') || jobTitle.includes('scientist') || jobTitle.includes('ai') || jobTitle.includes('ml'))) ||
                 (roleLower.includes('engineering') && (jobTitle.includes('engineer') || jobTitle.includes('engineering'))) ||
                 (roleLower.includes('machine learning') && (jobTitle.includes('ai') || jobTitle.includes('ml') || jobTitle.includes('scientist') || jobTitle.includes('engineer'))) ||
                 // Match any job with "engineer" in title if category is technology - catches "AI Engineer", "Software Engineer"
                 (jobTitle.includes('engineer') && jobCategory.includes('technology'))

        })

      })

    }



    // Industry Categories - Standalone filter (only if OR logic didn't apply)
    // CRITICAL: Skip this if hasCategoryFilters is true, because the OR logic block already filtered by industry
    if (!hasCategoryFilters && filters.industryCategories && filters.industryCategories.length > 0) {

      console.log('🏭 Applying industry categories filter (standalone):', filters.industryCategories)

      const beforeCount = filtered.length

      filtered = filtered.filter(job => {
        // CRITICAL: Use job.industryType first (from database), then fallback to company data
        const rawIndustryType = (job as any).industryType || (job as any).metadata?.industryType || ''
        const jobIndustryType = String(rawIndustryType).toLowerCase().trim().replace(/\s*\(\d+\)\s*$/, '').trim()
        const companyIndustry = ((job as any).company?.industry || '').toLowerCase().trim().replace(/\s*\(\d+\)\s*$/, '').trim()
        const companyIndustries = Array.isArray((job as any).company?.industries) 
          ? (job as any).company.industries.map((ind: any) => String(ind).toLowerCase().trim().replace(/\s*\(\d+\)\s*$/, '').trim())
          : []
        const jobCategory = ((job as any).category || '').toLowerCase().trim()
        const companyName = job.company.name.toLowerCase().trim()
        // CRITICAL: Prioritize jobIndustryType first
        const allIndustrySources = [jobIndustryType, companyIndustry, ...companyIndustries, jobCategory, companyName].filter(Boolean)
        
        const match = filters.industryCategories!.some(industry => {
          const industryLower = industry.toLowerCase().trim().replace(/\s*\(\d+\)\s*$/, '').trim()
          
          // CRITICAL: Exact match first, then partial - prioritize jobIndustryType
          const exactMatch = allIndustrySources.some(source => {
            const cleanedSource = source.replace(/\s*\(\d+\)\s*$/, '').trim()
            // Prioritize matches from jobIndustryType
            const isPrimarySource = source === jobIndustryType || companyIndustries.includes(source)
            if (isPrimarySource) {
              return cleanedSource === industryLower || 
                     cleanedSource.includes(industryLower) || 
                     industryLower.includes(cleanedSource.split(' ')[0])
            }
            // Only use category/companyName if no industryType exists
            const hasValidIndustry = jobIndustryType && jobIndustryType !== 'n/a' && jobIndustryType !== ''
            return !hasValidIndustry && (cleanedSource.includes(industryLower) || industryLower.includes(cleanedSource.split(' ')[0]))
          })
          
          // Handle specific abbreviations - only use primary sources (jobIndustryType, companyIndustries)
          const primarySources = [jobIndustryType, ...companyIndustries].filter(Boolean).map(s => s.replace(/\s*\(\d+\)\s*$/, '').trim())
          const abbreviationMatch = 
            (industryLower.includes('it services') || industryLower.includes('it consulting')) && 
              (primarySources.some(s => s.includes('it services') || s.includes('it consulting') || s.includes('software') || s.includes('technology'))) ||
            industryLower.includes('software product') &&
              (primarySources.some(s => s.includes('software product') || s.includes('software') || s.includes('technology'))) ||
            industryLower === 'internet' &&
              (primarySources.some(s => s.includes('internet') || s.includes('technology') || s.includes('software'))) ||
            industryLower.includes('electronics') &&
              (primarySources.some(s => s.includes('electronics') || s.includes('manufacturing'))) ||
            (industryLower.includes('data science') || industryLower.includes('data analytics')) &&
              (primarySources.some(s => s.includes('medical') || s.includes('pharmaceutical') || s.includes('research') || s.includes('analytics') || s.includes('biotechnology') || s.includes('clinical'))) ||
            (industryLower === 'it' || industryLower.includes('it ')) && 
              (primarySources.some(s => s.includes('it') || s.includes('software') || s.includes('technology') || s.includes('information technology'))) ||
            (industryLower === 'fintech' && primarySources.some(s => s.includes('financial') || s.includes('banking') || s.includes('fintech'))) ||
            // Sales-related industries
            (industryLower.includes('retail') || industryLower.includes('fmcg') || industryLower.includes('real estate') || industryLower.includes('travel') || industryLower.includes('tourism') || industryLower.includes('hotels') || industryLower.includes('restaurants') || industryLower.includes('automobile') || industryLower.includes('banking') || industryLower.includes('lending') || industryLower.includes('insurance')) &&
              (primarySources.some(s => s.includes('retail') || s.includes('fmcg') || s.includes('real estate') || s.includes('travel') || s.includes('tourism') || s.includes('hotels') || s.includes('restaurants') || s.includes('automobile') || s.includes('banking') || s.includes('lending') || s.includes('insurance')))
          
          return exactMatch || abbreviationMatch
        })
        
        return match
      })

      console.log(`🏭 Industry filter (standalone): ${beforeCount} → ${filtered.length} jobs`)

    }



    // Department Categories - Standalone filter (only if OR logic didn't apply)
    if (!hasCategoryFilters && filters.departmentCategories && filters.departmentCategories.length > 0) {

      console.log('🏢 Applying department categories filter:', filters.departmentCategories)

      filtered = filtered.filter(job => {

        const jobDepartment = ((job as any).department || '').toLowerCase().trim()

        const jobCategory = job.category.toLowerCase().trim()

        const jobTitle = job.title.toLowerCase().trim()

        
        
        return filters.departmentCategories!.some(department => {

          const deptLower = department.toLowerCase().trim()

          return jobDepartment.includes(deptLower) ||

                 deptLower.includes(jobDepartment) ||

                 jobCategory.includes(deptLower) ||

                 jobTitle.includes(deptLower) ||

                 // Handle common synonyms

                 (deptLower.includes('hr') && (jobCategory.includes('human resources') || jobTitle.includes('hr'))) ||

                 (deptLower.includes('it') && (jobCategory.includes('information technology') || jobTitle.includes('software') || jobTitle.includes('engineer') || jobTitle.includes('developer'))) ||
                 // Enhanced matching for Engineering/Data Science departments
                 (deptLower.includes('engineering') && (jobTitle.includes('engineer') || jobTitle.includes('engineering') || jobCategory.includes('technology'))) ||
                 (deptLower.includes('data science') && (jobTitle.includes('data') || jobTitle.includes('analyst') || jobTitle.includes('scientist') || jobTitle.includes('ai') || jobCategory.includes('technology'))) ||
                 (deptLower.includes('it') && (jobTitle.includes('engineer') || jobTitle.includes('developer') || jobCategory.includes('technology')))

        })

      })

    }



    // Skills / Keywords

    if (filters.skills) {

      const parts = filters.skills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)

      if (parts.length) {

        filtered = filtered.filter(job => parts.some(p => job.skills.some(s => s.toLowerCase().includes(p)) || job.description.toLowerCase().includes(p)))

      }

    }



    // Company Type - Case insensitive with better matching

    if (filters.companyType) {

      const q = filters.companyType.toLowerCase().trim()

      filtered = filtered.filter(job => {

        const ct = (job as any).company?.companyType

        if (!ct) return false

        
        
        const ctLower = String(ct).toLowerCase().trim()

        return ctLower === q ||

               ctLower.includes(q) ||

               q.includes(ctLower) ||

               // Handle common synonyms

               (q === 'mnc' && (ctLower.includes('multinational') || ctLower.includes('global'))) ||

               (q === 'startup' && (ctLower.includes('startup') || ctLower.includes('early stage'))) ||

               (q === 'enterprise' && (ctLower.includes('enterprise') || ctLower.includes('large')))

      })

    }



    // Work Mode - Case insensitive with better matching for nearby companies

    if (filters.workMode) {

      const q = filters.workMode.toLowerCase().trim()

      filtered = filtered.filter(job => {

        const wm = String(job.workMode || (job as any).remoteWork || '').toLowerCase().trim()

        const jobLocation = job.location.toLowerCase().trim()

        
        
        if (!wm) return false

        
        
        // Handle remote work variations

        if (q === 'remote' || q.includes('home')) {

          return wm.includes('remote') || 

                 (wm.includes('work from home') || wm.includes('work-from-home')) || 

                 wm.includes('wfh') ||

                 jobLocation.includes('remote')

        }

        
        
        // Handle on-site work (nearby companies)

        if (q === 'on-site' || q === 'onsite') {

          return !wm.includes('remote') && 

                 !wm.includes('work from home') && !wm.includes('work-from-home') && 

                 !wm.includes('wfh') &&

                 !jobLocation.includes('remote')

        }

        
        
        // Handle hybrid work

        if (q === 'hybrid') {

          return wm.includes('hybrid') || wm.includes('flexible')

        }

        
        
        // General matching

        return wm.includes(q)

      })

    }



    // Education

    if (filters.education) {

      const q = filters.education.toLowerCase()

      filtered = filtered.filter(job => String((job as any).education || '').toLowerCase().includes(q))

    }



    // Company Name

    if (filters.companyName) {

      const q = filters.companyName.toLowerCase()

      filtered = filtered.filter(job => job.company.name.toLowerCase().includes(q))

    }

    
    
    // Job Title (for exact matches)

    if (filters.jobTitle) {

      const q = filters.jobTitle.toLowerCase()

      filtered = filtered.filter(job => 

        job.title.toLowerCase().includes(q) || q.includes(job.title.toLowerCase())

      )

    }

    if (filters.category) {

      filtered = filtered.filter(job => job.category === filters.category)

    }



    // Type filter

    if (filters.type) {

      filtered = filtered.filter(job => job.type.toLowerCase() === filters.type.toLowerCase())

    }



    // Determine if any filters are active

    const hasActiveFilters = Boolean(

      (filters.search && filters.search.trim()) ||

      (filters.location && filters.location.trim()) ||

      filters.experienceLevels.length ||

      getVisibleJobTypesCount() > 0 ||

      (filters.salaryRange && filters.salaryRange.trim()) ||

      (filters.industry && filters.industry.trim()) ||

      (filters.department && filters.department.trim()) ||

      (filters.role && filters.role.trim()) ||

      (filters.roleCategories && filters.roleCategories.length > 0) ||

      (filters.industryCategories && filters.industryCategories.length > 0) ||

      (filters.departmentCategories && filters.departmentCategories.length > 0) ||

      (filters.skills && filters.skills.trim()) ||

      (filters.companyType && filters.companyType.trim && filters.companyType.trim()) ||

      (filters.workMode && filters.workMode.trim && filters.workMode.trim()) ||

      (filters.education && filters.education.trim()) ||

      (filters.companyName && filters.companyName.trim()) ||

      (filters.recruiterType && filters.recruiterType.trim && filters.recruiterType.trim())

    )



    // Sort jobs: if no filters, preferred first; otherwise normal selected sort

    const sortSecondary = (a: Job, b: Job) => {

      switch (sortBy) {

        case "recent":

          return new Date(b.posted).getTime() - new Date(a.posted).getTime()

        case "salary": {

          const salaryA = parseInt((a.salary || '').split('-')[0]?.replace(/\D/g, '') || '0')

          const salaryB = parseInt((b.salary || '').split('-')[0]?.replace(/\D/g, '') || '0')

          return salaryB - salaryA

        }

        case "applicants":

          return (b.applicants || 0) - (a.applicants || 0)

        case "rating":

          return (b.companyRating || 0) - (a.companyRating || 0)

        default:

          return 0

      }

    }

    
    
    if (!hasActiveFilters) {

      filtered.sort((a, b) => {

        const aPref = a.isPreferred ? 1 : 0

        const bPref = b.isPreferred ? 1 : 0

        if (aPref !== bPref) return bPref - aPref

        return sortSecondary(a, b)

      })

    } else {

      filtered.sort(sortSecondary)

    }



    // CRITICAL: Filter out expired jobs (validTill has passed)
    // Backend should handle this, but adding frontend safeguard
    filtered = filtered.filter(job => {
      const validTill = (job as any).validTill
      if (validTill) {
        const validTillDate = new Date(validTill);
        const now = new Date();
        // Only show jobs where validTill is in the future (or null)
        return validTillDate >= now;
      }
      // If no validTill, show the job (backend should have filtered expired jobs)
      return true;
    });

    console.log('✅ Final filtered jobs (after expiry check):', filtered.length)

    if (filtered.length === 0 && (filters.search || filters.industryCategories?.length || filters.departmentCategories?.length || filters.roleCategories?.length)) {

      console.log('⚠️ No jobs found with current filters:', {

        search: filters.search,

        industryCategories: filters.industryCategories,

        departmentCategories: filters.departmentCategories,

        roleCategories: filters.roleCategories,

        location: filters.location,

        experienceLevels: filters.experienceLevels,

        jobTypes: filters.jobTypes

      })

    }

    return filtered

  }, [allJobs, filters, sortBy])



  // Determine if any filters are active (for preferred tag display)

  const hasActiveFilters = useMemo(() => Boolean(

    (filters.search && filters.search.trim()) ||

    (filters.location && filters.location.trim()) ||

    filters.experienceLevels.length ||

    getVisibleJobTypesCount() > 0 ||

    (filters.salaryRange && filters.salaryRange.trim()) ||

    (filters.industry && filters.industry.trim()) ||

    (filters.department && filters.department.trim()) ||

    (filters.role && filters.role.trim()) ||

    (filters.roleCategories && filters.roleCategories.length > 0) ||

    (filters.industryCategories && filters.industryCategories.length > 0) ||

    (filters.departmentCategories && filters.departmentCategories.length > 0) ||

    (filters.skills && filters.skills.trim()) ||

    (filters.companyType && (filters.companyType as any).trim && (filters.companyType as any).trim()) ||

    (filters.workMode && (filters.workMode as any).trim && (filters.workMode as any).trim()) ||

    (filters.education && filters.education.trim()) ||

    (filters.companyName && filters.companyName.trim()) ||

    (filters.recruiterType && (filters.recruiterType as any).trim && (filters.recruiterType as any).trim())

  ), [filters])



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

        searchType: 'job_search'

      };



      await apiService.recordSearch(searchData);

    } catch (error) {

      console.error('Error recording search:', error);

      // Don't show error to user as this is background functionality

    }

  }, [user, filters, filteredJobs.length]);



  // Filter functions

  const handleFilterChange = useCallback((filterType: keyof FilterState, value: any) => {

    console.log('🔍 Filter change:', filterType, value)

    setFilters(prev => {

      const newFilters = {

      ...prev,

      [filterType]: value

      }

      console.log('📊 New filters:', newFilters)

      return newFilters

    })



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

      industry: "",

      department: "",

      role: "",

      skills: "",

      companyType: "",

      workMode: "",

      education: "",

      companyName: "",

      recruiterType: "",

      salaryMin: undefined,

      roleCategories: [],

      industryCategories: [],

      departmentCategories: [],

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



  return (

    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">

      <Navbar />

      
      
      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-24 pb-8 lg:pb-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Enhanced Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200/15 via-purple-200/15 to-indigo-200/15 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-indigo-800/20"></div>
        
        {/* Enhanced Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Layer A: far glow */}
          <div className="absolute -top-40 -right-40 w-[28rem] h-[28rem] rounded-full parallax-far" style={{ background: 'radial-gradient(50% 50% at 50% 50%, rgba(90,0,242,0.35) 0%, rgba(90,0,242,0) 100%)' }}></div>
          {/* Layer B: gradient strip */}
          <div className="absolute top-1/3 left-0 right-0 h-24 opacity-20 gradient-strip"></div>
          {/* Layer C: small particles placeholder (non-interactive) */}
          <div className="pointer-events-none absolute inset-0 opacity-20"></div>
        </div>

        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center py-8 lg:py-12">
          {/* Enhanced Animated Hero Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6 order-2 lg:order-1 text-center lg:text-left px-2 sm:px-4 lg:px-0 lg:pr-8 overflow-visible"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="serif-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl mb-4 heading-gradient drop-shadow-lg leading-[1.35] pb-2 tracking-tight text-[#1E1E2F] dark:text-white inline-block"
            >
              Find Your Dream Job
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeInOut" }}
              className="text-base sm:text-lg lg:text-xl text-[#5B5B6A] dark:text-slate-300 mb-4 sm:mb-6 max-w-[860px] mx-auto lg:mx-0 leading-relaxed font-medium px-4 sm:px-0"
            >
              Discover thousands of job opportunities with all the information you need
            </motion.p>
          </motion.div>

          {/* Enhanced Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
            className="mb-8 order-3 lg:order-2"
          >
            <div className="glass-20 soft-glow rounded-3xl p-4 sm:p-6 lg:p-7 max-w-[920px] mx-auto transform hover:-translate-y-1 hover:scale-[1.02] transition-transform duration-200 border-white/30"
                 style={{ background: "rgba(255,255,255,0.22)" }}>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-hover:text-blue-500 transition-colors duration-300" />
                  <Input
                    placeholder="Job title"
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const jobsSection = document.getElementById('jobs-section')
                        if (jobsSection) {
                          jobsSection.scrollIntoView({ behavior: 'smooth' })
                        }
                      }
                    }}
                    className="pl-12 pr-4 h-14 border-slate-200 dark:border-slate-600 focus:border-blue-500 bg-white dark:bg-slate-700 rounded-2xl text-lg font-medium shadow-lg"
                  />
          </div>
                <div className="relative flex-1 group">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-hover:text-blue-500 transition-colors duration-300" />
                  <Input
                    placeholder="Location"
                    value={filters.location}
                    onChange={(e) => handleFilterChange("location", e.target.value)}
                    className="pl-12 h-14 border-slate-200 dark:border-slate-600 focus:border-blue-500 bg-white dark:bg-slate-700 rounded-2xl text-lg font-medium shadow-lg"
                  />
        </div>
                <Button 
                  className="h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 sm:px-8 rounded-2xl text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => {
                    const jobsSection = document.getElementById('jobs-section')
                    if (jobsSection) {
                      jobsSection.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </Button>
      </div>
            </div>
          </motion.div>
        </div>
      </section>



      {/* Search and Filters */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">

        {/* Search Bar */}

        <div className={`bg-white/50 dark:bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-6 mb-8 transition-all duration-300 border border-white/30 dark:border-white/10 ${isStickyVisible ? 'sticky top-4 z-50' : ''}`}>

          <div className="flex flex-col lg:flex-row gap-4">

            <div className="flex-1">

              <div className="relative">

                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />

                <Input

                  placeholder="Search jobs, companies, or keywords..."

                  value={filters.search}

                  onChange={(e) => handleSearchChange(e.target.value)}

                  className="pl-10 h-12 border-0 bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-600"

                />

              </div>

            </div>

            <div className="flex flex-col sm:flex-row gap-4">

              <Select value={filters.location} onValueChange={(value) => handleFilterChange('location', value)}>

                <SelectTrigger className="w-full sm:w-48 h-12 border-0 bg-slate-50 dark:bg-slate-700">

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

                className={`h-12 w-full sm:w-auto px-6 border-0 hover:bg-slate-100 dark:hover:bg-slate-600 ${

                  (filters.experienceLevels.length > 0 || 

                   getVisibleJobTypesCount() > 0 || 

                   filters.salaryRange || 

                   (filters.industryCategories?.length ?? 0) > 0 || 

                   (filters.departmentCategories?.length ?? 0) > 0 || 

                   (filters.roleCategories?.length ?? 0) > 0 || 

                   filters.skills || 

                   filters.companyType || 

                   filters.workMode || 

                   filters.education || 

                   filters.companyName || 

                   filters.recruiterType) 

                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 

                    : 'bg-slate-50 dark:bg-slate-700'

                }`}

              >

                <Filter className="w-4 h-4 mr-2" />

                Filters

                {((filters.experienceLevels.length > 0 || 

                  getVisibleJobTypesCount() > 0 || 

                  filters.salaryRange || 

                  (filters.industryCategories?.length ?? 0) > 0 || 

                  (filters.departmentCategories?.length ?? 0) > 0 || 

                  (filters.roleCategories?.length ?? 0) > 0 || 

                  filters.skills || 

                  filters.companyType || 

                  filters.workMode || 

                  filters.education || 

                  filters.companyName || 

                  filters.recruiterType)) && (

                  <span className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">

                    {(filters.experienceLevels.length + 

                      getVisibleJobTypesCount() + 

                      (filters.salaryRange ? 1 : 0) + 

                      (filters.industryCategories?.length ?? 0) + 

                      (filters.departmentCategories?.length ?? 0) + 

                      (filters.roleCategories?.length ?? 0) + 

                      (filters.skills ? 1 : 0) + 

                      (filters.companyType ? 1 : 0) + 

                      (filters.workMode ? 1 : 0) + 

                      (filters.education ? 1 : 0) + 

                      (filters.companyName ? 1 : 0) + 

                      (filters.recruiterType ? 1 : 0))}

                  </span>

                )}

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

            className="bg-white/50 dark:bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-6 mb-8 relative z-50 border border-white/30 dark:border-white/10"

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

                    <SelectItem value="0-5">0-5 LPA</SelectItem>

                    <SelectItem value="5-10">5-10 LPA</SelectItem>

                    <SelectItem value="10-20">10-20 LPA</SelectItem>

                    <SelectItem value="20-50">20-50 LPA</SelectItem>

                    <SelectItem value="50+">50+ LPA</SelectItem>

                  </SelectContent>

                </Select>

              </div>



              {/* Industry */}

              <div className="relative">

                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Industry</h3>

                <div className="relative">

                  <Button

                    variant="outline"

                    className={`w-full justify-between ${(filters.industryCategories?.length ?? 0) > 0 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}

                    onClick={() => setShowIndustryDropdown(true)}

                  >

                    <span>{(filters.industryCategories?.length ?? 0) > 0 ? `${filters.industryCategories?.length} selected` : 'Select industry'}</span>

                    <ChevronDown className="w-4 h-4" />

                  </Button>

                  
                  
                  {showIndustryDropdown && (

                    <IndustryDropdown

                      selectedIndustries={filters.industryCategories || []}

                      onIndustryChange={(industries: string[]) => {

                        handleFilterChange('industryCategories', industries)

                      }}

                      onClose={() => setShowIndustryDropdown(false)}

                    />

                  )}

                </div>

              </div>



              {/* Department / Functional Area */}

              <div className="relative">

                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Department</h3>

                <div className="relative">

                  <Button

                    variant="outline"

                    className={`w-full justify-between ${(filters.departmentCategories?.length ?? 0) > 0 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}

                    onClick={() => setShowDepartmentDropdown(true)}

                  >

                    <span>{(filters.departmentCategories?.length ?? 0) > 0 ? `${filters.departmentCategories?.length} selected` : 'Select department'}</span>

                    <ChevronDown className="w-4 h-4" />

                  </Button>

                  
                  
                  {showDepartmentDropdown && (

                    <DepartmentDropdown

                      selectedDepartments={filters.departmentCategories || []}

                      onDepartmentChange={(departments: string[]) => {

                        handleFilterChange('departmentCategories', departments)

                      }}

                      onClose={() => setShowDepartmentDropdown(false)}

                    />

                  )}

                </div>

              </div>



              {/* Role Category */}

              <div className="relative">

                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Role Category</h3>

                <div className="relative">

                  <Button

                    variant="outline"

                    className={`w-full justify-between ${(filters.roleCategories?.length ?? 0) > 0 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}

                    onClick={() => setShowRoleCategoryDropdown(true)}

                  >

                    <span>{(filters.roleCategories?.length ?? 0) > 0 ? `${filters.roleCategories?.length ?? 0} selected` : 'Select role category'}</span>

                    <ChevronDown className="w-4 h-4" />

                  </Button>

                  
                  
                  {showRoleCategoryDropdown && (

                    <RoleCategoryDropdown

                      selectedRoles={filters.roleCategories || []}

                      onRoleChange={(roles: string[]) => {

                        handleFilterChange('roleCategories', roles)

                      }}

                      onClose={() => setShowRoleCategoryDropdown(false)}

                    />

                  )}

                </div>

              </div>



              {/* Skills / Keywords */}

              <div>

                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Skills / Keywords</h3>

                <Input placeholder="e.g., React, Java" value={filters.skills} onChange={(e) => handleFilterChange('skills', e.target.value)} />

              </div>



              {/* Company Type */}

              <div>

                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Company Type</h3>

                <Select value={filters.companyType} onValueChange={(v) => handleFilterChange('companyType', v)}>

                  <SelectTrigger className="w-full">

                    <SelectValue placeholder="Select type" />

                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem value="startup">Startup</SelectItem>

                    <SelectItem value="midsize">Midsize</SelectItem>

                    <SelectItem value="enterprise">Enterprise</SelectItem>

                    <SelectItem value="multinational">MNC</SelectItem>

                    <SelectItem value="mnc">MNC (Alternative)</SelectItem>

                  </SelectContent>

                </Select>

              </div>



              {/* Work Mode */}

              <div>

                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Work Mode</h3>

                <Select value={filters.workMode} onValueChange={(v) => handleFilterChange('workMode', v)}>

                  <SelectTrigger className="w-full">

                    <SelectValue placeholder="Select" />

                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem value="on-site">On-site</SelectItem>

                    <SelectItem value="remote">Remote</SelectItem>

                    <SelectItem value="hybrid">Hybrid</SelectItem>

                    <SelectItem value="work-from-home">Work from Home</SelectItem>

                    <SelectItem value="work from home">Work from Home (Alternative)</SelectItem>

                  </SelectContent>

                </Select>

              </div>



              {/* Education / Qualification */}

              <div>

                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Education</h3>

                <Input placeholder="e.g., Any Graduate, B.Tech, MBA" value={filters.education} onChange={(e) => handleFilterChange('education', e.target.value)} />

              </div>



              {/* Company Name */}

              <div>

                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Company Name</h3>

                <Input placeholder="e.g., TCS, Infosys" value={filters.companyName} onChange={(e) => handleFilterChange('companyName', e.target.value)} />

              </div>



              {/* Recruiter Type */}

              <div>

                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Recruiter Type</h3>

                <Select value={filters.recruiterType} onValueChange={(v) => handleFilterChange('recruiterType', v)}>

                  <SelectTrigger className="w-full">

                    <SelectValue placeholder="Select" />

                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem value="company">Company Recruiter</SelectItem>

                    <SelectItem value="consultant">Consultant</SelectItem>

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

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">

              {filteredJobs.length} Jobs Found

            </h2>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">

              Showing results for your search

            </p>

          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto mt-4 sm:mt-0">

            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">Sort by:</span>

            <Select value={sortBy} onValueChange={setSortBy}>

              <SelectTrigger className="w-full sm:w-40">

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



        {/* Preferred jobs are merged into main list and sorted to top when no filters */}



        {/* Jobs Grid */}

        <div className="space-y-6">

          {jobsLoading ? (

            <div className="space-y-6">

              {[1, 2, 3, 4].map((i) => (

                <Card key={i} className="bg-white/50 dark:bg-white/10 backdrop-blur-xl border-white/30 dark:border-white/10">

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

            <Card className="bg-white/50 dark:bg-white/10 backdrop-blur-xl border-white/30 dark:border-white/10">

              <CardContent className="p-12 text-center">

                <Briefcase className="w-16 h-16 text-slate-400 mx-auto mb-4" />

                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">

                  No jobs found

                </h3>

                <p className="text-slate-600 dark:text-slate-300 mb-6">

                  Try adjusting your search criteria or filters

                </p>

                <Button onClick={clearFilters}>

                  Clear Filters

                </Button>

              </CardContent>

            </Card>

          ) : (

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {filteredJobs.map((job, index) => (

                <motion.div

                  key={job.id}

                  initial={{ opacity: 0, y: 20 }}

                  animate={{ opacity: 1, y: 0 }}

                  transition={{ delay: index * 0.1 }}

                >

                  <Link href={`/jobs/${job.id}`}>

                    <Card className="group cursor-pointer border-0 bg-white/50 dark:bg-white/10 backdrop-blur-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-white/30 dark:border-white/10">

                      <CardContent className="p-4 sm:p-6">

                        <div className="flex flex-col sm:flex-row items-start gap-4">

                          <div className="flex items-start space-x-3 sm:space-x-4 flex-1 w-full sm:w-auto">

                            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 ring-2 ring-white/50 group-hover:ring-4 transition-all duration-300 flex-shrink-0">

                              <AvatarImage src={job.logo} alt={job.company.name} />

                              <AvatarFallback className="text-xs sm:text-sm font-bold">{job.company.name[0]}</AvatarFallback>

                            </Avatar>

                            
                            
                            <div className="flex-1 min-w-0">

                              <div className="mb-2">

                                <div className="flex-1 min-w-0">

                                  <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg group-hover:text-blue-600 transition-colors line-clamp-2">

                                    {job.title}

                                  </h3>

                                  <div className="flex flex-wrap items-center gap-2 mt-1">

                                    <p className="text-slate-600 dark:text-slate-400 text-sm">

                                      {job.isConsultancy && job.showHiringCompanyDetails 

                                        ? job.hiringCompany?.name || job.company.name

                                        : job.isAgencyPosted && job.HiringCompany 

                                        ? job.HiringCompany.name 

                                        : job.company.name}

                                    </p>

                                    {job.isConsultancy && job.consultancyName && (

                                      <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700 whitespace-nowrap">

                                        Consultancy Posted

                                      </Badge>

                                    )}
                                    {job.isConsultancy && job.consultancyName && (

                                      <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700 whitespace-nowrap mt-1">

                                        By {job.consultancyName}

                                      </Badge>

                                    )}

                                    {job.isAgencyPosted && job.PostedByAgency && !job.isConsultancy && (

                                      <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 whitespace-nowrap">

                                        via {job.PostedByAgency.name}

                                      </Badge>

                                    )}

                                  </div>

                                </div>

                                <div className="flex flex-wrap items-center gap-2 mt-2">

                                  {job.isHotVacancy && (

                                    <Badge className="bg-red-100 text-red-800 border-red-200 text-xs animate-pulse">

                                      🔥 Hot

                                    </Badge>

                                  )}

                                  {job.urgentHiring && (

                                    <Badge className="bg-red-100 text-red-800 border-red-200 text-xs animate-pulse">

                                      <AlertCircle className="w-3 h-3 mr-1" />

                                      URGENT

                                    </Badge>

                                  )}

                                  {job.superFeatured && (

                                    <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">

                                      <Star className="w-3 h-3 mr-1" />

                                      Super Featured

                                    </Badge>

                                  )}

                                  {!hasActiveFilters && job.isPreferred && (

                                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">

                                      <Star className="w-3 h-3 mr-1" />

                                      Preferred

                                    </Badge>

                                  )}

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

                                  <IndianRupee className="w-4 h-4" />

                                  <span>{job.salary && !job.salary.includes('LPA') ? `${job.salary} LPA` : (job.salary || 'Not specified')}</span>

                                </div>

                                <div className="flex items-center space-x-1">

                                  <Clock className="w-4 h-4" />

                                  <span>{job.posted}</span>

                                </div>

                                <div className="flex items-center space-x-1">

                                  <Users className="w-4 h-4" />

                                  <span>{job.applicants} applicants</span>

                                </div>

                                {job.applicationDeadline && (
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span className={isApplicationDeadlinePassed(job.applicationDeadline) ? 'text-red-600 font-medium' : 'text-slate-600 dark:text-slate-400'}>
                                      {isApplicationDeadlinePassed(job.applicationDeadline) 
                                        ? 'Deadline Passed' 
                                        : `Deadline: ${new Date(job.applicationDeadline).toLocaleDateString()}`
                                      }
                                    </span>
                                  </div>
                                )}

                              </div>



                              {/* Internship-specific information */}

                              {job.type.toLowerCase() === 'internship' && (job.duration || job.startDate || job.workMode) && (

                                <div className="flex flex-wrap items-center gap-4 text-sm text-blue-600 dark:text-blue-400 mb-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">

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

                                  <Badge key={skillIndex} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">

                                    {skill}

                                  </Badge>

                                ))}

                                {job.skills.length > 3 && (

                                  <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-slate-200 text-xs">

                                    +{job.skills.length - 3} more

                                  </Badge>

                                )}

                              </div>



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



                          <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto sm:ml-4 mt-4 sm:mt-0">

                            <Button

                              onClick={(e) => {

                                e.preventDefault()

                                e.stopPropagation()

                                handleSaveJob(job.id)

                              }}

                              variant="outline"

                              size="sm"

                              className="text-xs flex-1 sm:flex-none sm:w-24"

                            >

                              {savedJobs.has(job.id) ? (

                                <>

                                  <BookmarkCheck className="w-4 h-4 sm:mr-1" />

                                  <span className="hidden sm:inline">Saved</span>

                                </>

                              ) : (

                                <>

                                  <Bookmark className="w-4 h-4 sm:mr-1" />

                                  <span className="hidden sm:inline">Save</span>

                                </>

                              )}

                            </Button>

                            <Button

                              onClick={(e) => {

                                e.preventDefault()

                                e.stopPropagation()

                                handleApply(job.id)

                              }}

                              className={`text-xs sm:text-sm flex-1 sm:flex-none sm:w-24 ${

                                appliedJobs.has(job.id)

                                  ? 'bg-green-600 hover:bg-green-700 cursor-default' 

                                  : isApplicationDeadlinePassed(job.applicationDeadline || null)
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'

                              }`}

                              disabled={appliedJobs.has(job.id) || isApplicationDeadlinePassed(job.applicationDeadline || null)}

                            >

                              {appliedJobs.has(job.id) ? (

                                <>

                                  <CheckCircle className="w-4 h-4 mr-1" />

                                  Applied

                                </>

                              ) : isApplicationDeadlinePassed(job.applicationDeadline || null) ? (

                                <>

                                  <AlertCircle className="w-4 h-4 mr-1" />

                                  Application Deadline Passed

                                </>

                              ) : (

                                <>

                                  Apply

                                  <ArrowRight className="w-3 h-3 ml-1 hidden sm:inline" />

                                </>

                              )}

                            </Button>

                            
                            
                            {/* Undo button removed as per requirement */}

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



      {/* Authentication Dialog */}

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>

        <DialogContent className="sm:max-w-md">

          <DialogHeader>

            <DialogTitle>Login Required</DialogTitle>

            <DialogDescription>

              You need to be logged in to save jobs and apply for positions. Please register or login to continue.

            </DialogDescription>

          </DialogHeader>

          <div className="flex flex-col space-y-3 mt-6">

            <Link href="/register" className="w-full">

              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">

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



      {/* Footer */}

      <footer className="bg-slate-900 text-white py-3 mt-10">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

            <div>

              <h3 className="text-lg font-semibold mb-4">JobPortal</h3>

              <p className="text-slate-400">

                Find your dream job with the best companies and opportunities.

              </p>

            </div>

            <div>

              <h4 className="font-semibold mb-4">For Job Seekers</h4>

              <ul className="space-y-2 text-slate-400">

                <li><Link href="/jobs" className="hover:text-white transition-colors">Browse Jobs</Link></li>

                <li><Link href="/companies" className="hover:text-white transition-colors">Companies</Link></li>

                <li><Link href="/gulf-opportunities" className="hover:text-white transition-colors">Gulf Opportunities</Link></li>

                <li><Link href="/salary-guide" className="hover:text-white transition-colors">Salary Guide</Link></li>

                <li><Link href="/career-advice" className="hover:text-white transition-colors">Career Advice</Link></li>

              </ul>

            </div>

            <div>

              <h4 className="font-semibold mb-4">For Employers</h4>

              <ul className="space-y-2 text-slate-400">

                <li><Link href="/post-job" className="hover:text-white transition-colors">Post a Job</Link></li>

                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>

                <li><Link href="/recruitment-solutions" className="hover:text-white transition-colors">Recruitment Solutions</Link></li>

                <li><Link href="/employer-resources" className="hover:text-white transition-colors">Resources</Link></li>

              </ul>

            </div>

            <div>

              <h4 className="font-semibold mb-4">Support</h4>

              <ul className="space-y-2 text-slate-400">

                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>

                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>

                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>

                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>

              </ul>

            </div>

          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">

            <p>&copy; 2025 JobPortal. All rights reserved.</p>

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

          isGulfJob={false}

        />

      )}



      {/* Auth Dialog */}

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>

        <DialogContent>

          <DialogHeader>

            <DialogTitle>Sign In Required</DialogTitle>

            <DialogDescription>

              You need to sign in to apply for jobs and access all features.

            </DialogDescription>

          </DialogHeader>

          <div className="flex justify-end space-x-3">

            <Button variant="outline" onClick={() => setShowAuthDialog(false)}>

              Cancel

            </Button>

            <Button onClick={() => window.location.href = '/login'}>

              Sign In

            </Button>

          </div>

        </DialogContent>

      </Dialog>


    </div>

  )

}

