"use client"
import { useState, useRef, useMemo, useCallback, useEffect } from "react"
import {
  Search,
  MapPin,
  Users,
  Star,
  Building2,
  TrendingUp,
  Filter,
  SlidersHorizontal,

  ChevronRight,

  Eye,

  Heart,

  Briefcase,

  ChevronLeft,

  Sparkles,

  ArrowRight,

  Zap,

  X,

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
import { Navbar } from "@/components/navbar"
import IndustryDropdown from "@/components/ui/industry-dropdown"

import Link from "next/link"

import { useRouter } from "next/navigation"

import { apiService } from "@/lib/api"

import { useAuth } from "@/hooks/useAuth"

import { toast } from "sonner"

// Types for state management

interface FilterState {

  search: string

  location: string

  industries: string[]

  companyTypes: string[]

  companySizes: string[]

  locations: string[]

  minRating: string

  salaryRange: string

}

interface Company {

  id: string

  name: string

  logo: string

  industry: string

  industries?: string[]

  sector: string

  location: string

  city?: string

  address?: string

  employees: string

  rating: number

  reviews: number

  openings: number

  activeJobsCount?: number

  profileViews?: number

  description: string

  founded: string

  website: string

  benefits: string[]

  featured: boolean

  salaryRange: string

  workCulture: string

  companyType: string
  companyTypes?: string[]

  urgent: boolean
  isActive?: boolean

  isVerified?: boolean
  verificationStatus?: string

  placeholderImage?: string
  region?: string

}
// Industry-specific color schemes for professional hover effects
const getIndustryColors = (industry: string) => {
  const industryLower = industry.toLowerCase()
  
  // Technology & IT
  if (industryLower.includes('technology') || industryLower.includes('software') || industryLower.includes('it services') || industryLower.includes('internet') || industryLower.includes('electronics')) {
    return {
      bg: 'from-blue-500 to-indigo-600',
      hover: 'hover:from-blue-600 hover:to-indigo-700',
      text: 'text-blue-600',
      border: 'border-blue-200',
      badge: 'bg-blue-50 text-blue-700 border-blue-200'
    }
  }
  
  // Healthcare & Medical
  if (industryLower.includes('medical') || industryLower.includes('healthcare') || industryLower.includes('pharmaceutical') || industryLower.includes('biotechnology')) {
    return {
      bg: 'from-emerald-500 to-teal-600',
      hover: 'hover:from-emerald-600 hover:to-teal-700',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
  }
  
  // Finance & Banking
  if (industryLower.includes('banking') || industryLower.includes('finance') || industryLower.includes('insurance') || industryLower.includes('investment') || industryLower.includes('fintech')) {
    return {
      bg: 'from-slate-600 to-gray-700',
      hover: 'hover:from-slate-700 hover:to-gray-800',
      text: 'text-slate-600',
      border: 'border-slate-200',
      badge: 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }
  
  // Manufacturing & Industrial
  if (industryLower.includes('manufacturing') || industryLower.includes('industrial') || industryLower.includes('automobile') || industryLower.includes('chemicals') || industryLower.includes('steel')) {
    return {
      bg: 'from-orange-500 to-amber-600',
      hover: 'hover:from-orange-600 hover:to-amber-700',
      text: 'text-orange-600',
      border: 'border-orange-200',
      badge: 'bg-orange-50 text-orange-700 border-orange-200'
    }
  }
  
  // Education & Training
  if (industryLower.includes('education') || industryLower.includes('training') || industryLower.includes('e-learning')) {
    return {
      bg: 'from-purple-500 to-violet-600',
      hover: 'hover:from-purple-600 hover:to-violet-700',
      text: 'text-purple-600',
      border: 'border-purple-200',
      badge: 'bg-purple-50 text-purple-700 border-purple-200'
    }
  }
  
  // Retail & Consumer
  if (industryLower.includes('retail') || industryLower.includes('consumer') || industryLower.includes('fmcg') || industryLower.includes('textiles')) {
    return {
      bg: 'from-pink-500 to-rose-600',
      hover: 'hover:from-pink-600 hover:to-rose-700',
      text: 'text-pink-600',
      border: 'border-pink-200',
      badge: 'bg-pink-50 text-pink-700 border-pink-200'
    }
  }
  
  // Construction & Real Estate
  if (industryLower.includes('construction') || industryLower.includes('real estate') || industryLower.includes('infrastructure')) {
    return {
      bg: 'from-amber-500 to-yellow-600',
      hover: 'hover:from-amber-600 hover:to-yellow-700',
      text: 'text-amber-600',
      border: 'border-amber-200',
      badge: 'bg-amber-50 text-amber-700 border-amber-200'
    }
  }
  
  // Media & Entertainment
  if (industryLower.includes('media') || industryLower.includes('entertainment') || industryLower.includes('advertising') || industryLower.includes('publishing')) {
    return {
      bg: 'from-red-500 to-pink-600',
      hover: 'hover:from-red-600 hover:to-pink-700',
      text: 'text-red-600',
      border: 'border-red-200',
      badge: 'bg-red-50 text-red-700 border-red-200'
    }
  }
  
  // Logistics & Transportation
  if (industryLower.includes('logistics') || industryLower.includes('transportation') || industryLower.includes('shipping') || industryLower.includes('aviation')) {
    return {
      bg: 'from-cyan-500 to-blue-600',
      hover: 'hover:from-cyan-600 hover:to-blue-700',
      text: 'text-cyan-600',
      border: 'border-cyan-200',
      badge: 'bg-cyan-50 text-cyan-700 border-cyan-200'
    }
  }
  
  // Default professional color
  return {
    bg: 'from-gray-500 to-slate-600',
    hover: 'hover:from-gray-600 hover:to-slate-700',
    text: 'text-gray-600',
    border: 'border-gray-200',
    badge: 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

// Get multi-industry gradient colors
const getMultiIndustryColors = (industries: string[]) => {
  if (!industries || industries.length === 0) {
    return {
      bg: 'from-gray-500 to-slate-600',
      hover: 'hover:from-gray-600 hover:to-slate-700',
      text: 'text-gray-600',
      border: 'border-gray-200',
      badge: 'bg-gradient-to-r from-purple-100 via-pink-100 to-indigo-100 text-purple-800 border-purple-200'
    }
  }
  
  // Create a gradient based on the industries present
  const industryTypes = industries.map(ind => ind.toLowerCase())
  
  // Multi-industry gradient combinations
  if (industryTypes.some(ind => ind.includes('technology') || ind.includes('software'))) {
    return {
      bg: 'from-blue-500 to-indigo-600',
      hover: 'hover:from-blue-600 hover:to-indigo-700',
      text: 'text-blue-600',
      border: 'border-blue-200',
      badge: 'bg-gradient-to-r from-blue-100 via-purple-100 to-indigo-100 text-blue-800 border-blue-200'
    }
  }
  
  if (industryTypes.some(ind => ind.includes('finance') || ind.includes('banking'))) {
    return {
      bg: 'from-green-500 to-emerald-600',
      hover: 'hover:from-green-600 hover:to-emerald-700',
      text: 'text-green-600',
      border: 'border-green-200',
      badge: 'bg-gradient-to-r from-green-100 via-teal-100 to-emerald-100 text-green-800 border-green-200'
    }
  }
  
  if (industryTypes.some(ind => ind.includes('healthcare') || ind.includes('medical'))) {
    return {
      bg: 'from-emerald-500 to-teal-600',
      hover: 'hover:from-emerald-600 hover:to-teal-700',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      badge: 'bg-gradient-to-r from-emerald-100 via-cyan-100 to-teal-100 text-emerald-800 border-emerald-200'
    }
  }
  
  // Default multi-industry gradient
  return {
    bg: 'from-purple-500 to-pink-600',
    hover: 'hover:from-purple-600 hover:to-pink-700',
    text: 'text-purple-600',
    border: 'border-purple-200',
    badge: 'bg-gradient-to-r from-purple-100 via-pink-100 to-indigo-100 text-purple-800 border-purple-200'
  }
}

// Utility functions for advanced search and filtering

const calculateSimilarity = (str1: string, str2: string): number => {

  const longer = str1.length > str2.length ? str1 : str2

  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1.0

  const distance = levenshteinDistance(longer, shorter)

  return (longer.length - distance) / longer.length

}



const levenshteinDistance = (str1: string, str2: string): number => {

  const matrix = []

  for (let i = 0; i <= str2.length; i++) { matrix[i] = [i] }

  for (let j = 0; j <= str1.length; j++) { matrix[0][j] = j }

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



const processSearchQuery = (query: string, companies: Company[]) => {

  const lowerQuery = query.toLowerCase().trim()

  

  if (!lowerQuery || companies.length === 0) {

    return query.trim()

  }

  

  // Extract all company names from the database

  const companyNames = companies.map(company => ({

    name: company.name,

    industry: company.industry,

    location: company.location

  }))

  

  // Find exact matches first

  const exactMatches = companyNames.filter(company => 

    company.name.toLowerCase() === lowerQuery ||

    company.industry.toLowerCase() === lowerQuery ||

    company.location.toLowerCase() === lowerQuery

  )

  

  if (exactMatches.length > 0) {

    return exactMatches[0].name

  }

  

  // Find contains matches

  const containsMatches = companyNames.filter(company => 

    company.name.toLowerCase().includes(lowerQuery) ||

    lowerQuery.includes(company.name.toLowerCase()) ||

    company.industry.toLowerCase().includes(lowerQuery) ||

    lowerQuery.includes(company.industry.toLowerCase()) ||

    company.location.toLowerCase().includes(lowerQuery) ||

    lowerQuery.includes(company.location.toLowerCase())

  )

  

  if (containsMatches.length > 0) {

    // Sort by similarity score and return the best match

    const bestMatch = containsMatches.reduce((best, current) => {

      const currentScore = Math.max(

        calculateSimilarity(lowerQuery, current.name.toLowerCase()),

        calculateSimilarity(lowerQuery, current.industry.toLowerCase()),

        calculateSimilarity(lowerQuery, current.location.toLowerCase())

      )

      const bestScore = Math.max(

        calculateSimilarity(lowerQuery, best.name.toLowerCase()),

        calculateSimilarity(lowerQuery, best.industry.toLowerCase()),

        calculateSimilarity(lowerQuery, best.location.toLowerCase())

      )

      return currentScore > bestScore ? current : best

    })

    return bestMatch.name

  }

  

  // Find fuzzy matches with similarity threshold

  const fuzzyMatches = companyNames

    .map(company => ({

      ...company,

      similarity: Math.max(

        calculateSimilarity(lowerQuery, company.name.toLowerCase()),

        calculateSimilarity(lowerQuery, company.industry.toLowerCase()),

        calculateSimilarity(lowerQuery, company.location.toLowerCase())

      )

    }))

    .filter(company => company.similarity > 0.6)

    .sort((a, b) => b.similarity - a.similarity)

  

  if (fuzzyMatches.length > 0) {

    return fuzzyMatches[0].name

  }

  

  // Word-by-word matching

  const queryWords = lowerQuery.split(/\s+/).filter(word => word.length > 2)

  if (queryWords.length > 0) {

    const wordMatches = companyNames

      .map(company => {

        const companyWords = [

          ...company.name.toLowerCase().split(/\s+/),

          ...company.industry.toLowerCase().split(/\s+/),

          ...company.location.toLowerCase().split(/\s+/)

        ]

        

        const wordSimilarities = queryWords.map(queryWord => 

          Math.max(...companyWords.map(companyWord => 

            calculateSimilarity(queryWord, companyWord)

          ))

        )

        

        const avgSimilarity = wordSimilarities.reduce((sum, sim) => sum + sim, 0) / wordSimilarities.length

        

        return {

          ...company,

          similarity: avgSimilarity

        }

      })

      .filter(company => company.similarity > 0.7)

      .sort((a, b) => b.similarity - a.similarity)

    

    if (wordMatches.length > 0) {

      return wordMatches[0].name

    }

  }

  

  // Final fallback: Return original query

  return query.trim()

}



// Function to get search suggestions based on database companies

const getSearchSuggestions = (query: string, companies: Company[], limit: number = 10): string[] => {

  const lowerQuery = query.toLowerCase().trim()

  

  if (!lowerQuery || companies.length === 0) {

    return []

  }

  

  // Get all unique company names, industries, and locations

  const allTerms = new Set<string>()

  companies.forEach(company => {

    allTerms.add(company.name)

    allTerms.add(company.industry)

    allTerms.add(company.location)

  })

  

  const suggestions = Array.from(allTerms)

    .filter(term => {

      const termLower = term.toLowerCase()

      return (

        termLower.includes(lowerQuery) ||

        lowerQuery.includes(termLower) ||

        calculateSimilarity(lowerQuery, termLower) > 0.6

      )

    })

    .sort((a, b) => {

      const aLower = a.toLowerCase()

      const bLower = b.toLowerCase()

      

      // Prioritize exact matches

      if (aLower === lowerQuery) return -1

      if (bLower === lowerQuery) return 1

      

      // Prioritize starts with

      if (aLower.startsWith(lowerQuery) && !bLower.startsWith(lowerQuery)) return -1

      if (bLower.startsWith(lowerQuery) && !aLower.startsWith(lowerQuery)) return 1

      

      // Sort by similarity

      const aSim = calculateSimilarity(lowerQuery, aLower)

      const bSim = calculateSimilarity(lowerQuery, bLower)

      return bSim - aSim

    })

    .slice(0, limit)

  

  return suggestions

}



export default function CompaniesPage() {

  const router = useRouter()

  const { user } = useAuth()

  const [isRedirecting, setIsRedirecting] = useState(false)

  

  // State management

  const [showFilters, setShowFilters] = useState(false)

  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)

  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)

  const [companiesPerPage, setCompaniesPerPage] = useState(20)
  // Companies page industry dropdown state
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)

  const [sortBy, setSortBy] = useState("rating")

  

  // Follow status management - SIMPLIFIED AND FIXED

  const [followedCompanies, setFollowedCompanies] = useState<Set<string>>(new Set())

  const [loadingFollow, setLoadingFollow] = useState<Set<string>>(new Set())



  // Fetch followed companies - SIMPLIFIED

  const fetchFollowedCompanies = useCallback(async () => {

    if (!user) return



    try {

      const response = await apiService.getFollowedCompanies()

      if (response.success && response.data) {

        const companyIds = response.data.map((follow: any) => follow.companyId).filter(Boolean)

        setFollowedCompanies(new Set(companyIds))

        console.log('✅ Loaded followed companies:', Array.from(companyIds))

      }

    } catch (error) {

      console.error('❌ Error fetching followed companies:', error)

    }

  }, [user])



  // Handle follow/unfollow toggle - COMPLETELY REWRITTEN

  const handleFollowToggle = useCallback(async (companyId: string) => {

    if (!user) {

      router.push('/login')

      return

    }



    if (loadingFollow.has(companyId)) return



    setLoadingFollow(prev => new Set([...prev, companyId]))



    try {

      const isCurrentlyFollowing = followedCompanies.has(companyId)

      

      if (isCurrentlyFollowing) {

        // UNFOLLOW

        const response = await apiService.unfollowCompany(companyId)

        if (response.success) {

          setFollowedCompanies(prev => {

            const newSet = new Set(prev)

            newSet.delete(companyId)

            return newSet

          })

          toast.success('Unfollowed company')

          console.log('✅ Unfollowed company:', companyId)

        } else {

          toast.error('Failed to unfollow company')

        }

      } else {

        // FOLLOW

        const response = await apiService.followCompany(companyId)

        if (response.success) {

          setFollowedCompanies(prev => new Set([...prev, companyId]))

          toast.success('Following company')

          console.log('✅ Followed company:', companyId)

        } else {

          toast.error('Failed to follow company')

        }

      }

    } catch (error) {

      console.error('❌ Error toggling follow:', error)

      toast.error('Failed to update follow status')

    } finally {

      setLoadingFollow(prev => {

        const newSet = new Set(prev)

        newSet.delete(companyId)

        return newSet

      })

    }

  }, [user, followedCompanies, loadingFollow, router])

  const [isFeaturedFilter, setIsFeaturedFilter] = useState(false)

  const [badgeDisplay, setBadgeDisplay] = useState<'featured' | 'urgent'>('featured')

  const [isStickyVisible, setIsStickyVisible] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)



  // Data from backend

  const [apiCompanies, setApiCompanies] = useState<any[]>([])

  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(true)

  const [loadError, setLoadError] = useState<string>("")



  // Filter state

  const [filters, setFilters] = useState<FilterState>({

    search: "",

    location: "",

    industries: [],

    companyTypes: [],

    companySizes: [],

    locations: [],

    minRating: "",

    salaryRange: "",

  })



  // Check URL parameters for filters

  useEffect(() => {

    if (typeof window !== 'undefined') {

      const urlParams = new URLSearchParams(window.location.search)

      

      // Handle featured filter

      const featured = urlParams.get('featured')

      if (featured === 'true') {

        setIsFeaturedFilter(true)

      }

      

      // Handle company type filters

      const companyType = urlParams.get('companyType')

      if (companyType) {

        // Map navbar values to filter values

        const typeMapping: { [key: string]: string } = {

          'unicorn': 'Unicorn',

          'mnc': 'MNC',

          'startup': 'Startup',

          'product-based': 'Product Based',

          'sponsored': 'Sponsored'

        }

        

        const mappedType = typeMapping[companyType] || companyType

        

        // Map to industry card selection for company types

        const companyTypeCardMapping: { [key: string]: string } = {

          'Unicorn': 'Unicorn',

          'MNC': 'MNCs',

          'Startup': 'Startup',

          'Product Based': 'Internet',

          'Sponsored': 'Internet' // Default to Internet for sponsored

        }

        

        const cardName = companyTypeCardMapping[mappedType]

        if (cardName) {

          setSelectedIndustry(cardName)

        }

        

        setFilters(prev => ({

          ...prev,

          companyTypes: [mappedType]

        }))

        console.log('🏢 Setting company type from URL:', companyType, '→', mappedType, '→', cardName)

      }

      

      // Handle industry filters

      const industry = urlParams.get('industry')

      if (industry) {

        // Map navbar values to filter values

        const industryMapping: { [key: string]: string } = {

          'IT Services & Consulting': 'Technology',

          'FinTech': 'Fintech',

          'Internet': 'Technology'

        }

        

        const mappedIndustry = industryMapping[industry] || industry

        

        // Map to industry card selection

        const cardMapping: { [key: string]: string } = {

          'Technology': 'Internet',

          'Fintech': 'Fintech',

          'Healthcare': 'Healthcare',

          'EdTech': 'EdTech',

          'E-commerce': 'E-commerce',

          'Manufacturing': 'Manufacturing',

          'Automotive': 'Automobile'

        }

        

        const cardName = cardMapping[mappedIndustry] || mappedIndustry

        setSelectedIndustry(cardName)

        

        setFilters(prev => ({

          ...prev,

          industries: [mappedIndustry]

        }))

        console.log('🏭 Setting industry from URL:', industry, '→', mappedIndustry, '→', cardName)

      }

      

      // Handle search filters

      const search = urlParams.get('search')

      if (search) {

        setFilters(prev => ({

          ...prev,

          search: search

        }))

        console.log('🔍 Setting search from URL:', search)

      }

      

      // Handle location filters

      const location = urlParams.get('location')

      if (location) {

        setFilters(prev => ({

          ...prev,

          location: location

        }))

        console.log('📍 Setting location from URL:', location)

      }

    }

  }, [])



  // Alternate badge display for companies with both featured and urgent

  useEffect(() => {

    const interval = setInterval(() => {

      setBadgeDisplay(prev => prev === 'featured' ? 'urgent' : 'featured')

    }, 3000) // Change every 3 seconds



    return () => clearInterval(interval)

  }, [])






  // Fetch companies from backend

  useEffect(() => {

    const controller = new AbortController()

    const fetchCompanies = async () => {

      try {

        setLoadingCompanies(true)

        setLoadError("")

        const resp = await apiService.listCompanies({

          search: filters.search || undefined,

          limit: 100,

          offset: 0,

          timestamp: Date.now() // Cache busting parameter

        })

        if (resp.success && Array.isArray(resp.data)) {

          console.log('🔍 Companies API response:', resp.data.slice(0, 2)) // Log first 2 companies

          setApiCompanies(resp.data.filter((c: any) => c?.region !== 'gulf'))

          // Fetch followed companies after loading companies

          fetchFollowedCompanies()

        } else {

          setApiCompanies([])

          setLoadError(resp.message || 'Failed to load companies')

        }

      } catch (e: any) {

        setLoadError('Failed to load companies')

        setApiCompanies([])

      } finally {

        setLoadingCompanies(false)

      }

    }

    fetchCompanies()

    return () => controller.abort()

  // Re-fetch on search change only; other filters are client-side

  }, [filters.search])



  // Auth check - redirect employers to employer dashboard (BEFORE fetching followed companies)
  useEffect(() => {
    if (user && (user.userType === 'employer' || user.userType === 'admin')) {
      console.log('🔄 Employer/Admin detected on companies page, redirecting to employer dashboard')
      setIsRedirecting(true)
      router.replace(user.region === 'gulf' ? '/gulf-dashboard' : '/employer-dashboard')
      return // Don't proceed with fetching followed companies
    }
  }, [user, router])

  // Fetch followed companies when user changes (ONLY for jobseekers)
  useEffect(() => {
    if (user && user.userType === 'jobseeker') {
      fetchFollowedCompanies()
    }
  }, [user, fetchFollowedCompanies])



  // Show loading while redirecting

  if (isRedirecting) {

    return (

      <div className="min-h-screen bg-animated dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">

        <div className="text-center">

          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>

          <p className="mt-4 text-slate-600 dark:text-slate-400">Redirecting...</p>

        </div>

      </div>

    )

  }



  const getSectorColor = (sector: string) => {

    const colors = {

      technology: {

        bg: "from-blue-500 to-cyan-500",

        text: "text-blue-600",

        border: "border-blue-200",

        light: "bg-blue-50 dark:bg-blue-900/20",

        ring: "ring-blue-500",

        hover: "hover:from-blue-600 hover:to-cyan-600",

        glow: "shadow-blue-500/25",

      },

      finance: {

        bg: "from-green-500 to-emerald-500",

        text: "text-green-600",

        border: "border-green-200",

        light: "bg-green-50 dark:bg-green-900/20",

        ring: "ring-green-500",

        hover: "hover:from-green-600 hover:to-emerald-600",

        glow: "shadow-green-500/25",

      },

      automotive: {

        bg: "from-orange-500 to-red-500",

        text: "text-orange-600",

        border: "border-orange-200",

        light: "bg-orange-50 dark:bg-orange-900/20",

        ring: "ring-orange-500",

        hover: "hover:from-orange-600 hover:to-red-600",

        glow: "shadow-orange-500/25",

      },

      healthcare: {

        bg: "from-teal-500 to-cyan-500",

        text: "text-teal-600",

        border: "border-teal-200",

        light: "bg-teal-50 dark:bg-teal-900/20",

        ring: "ring-teal-500",

        hover: "hover:from-teal-600 hover:to-cyan-600",

        glow: "shadow-teal-500/25",

      },

      energy: {

        bg: "from-purple-500 to-pink-500",

        text: "text-purple-600",

        border: "border-purple-200",

        light: "bg-purple-50 dark:bg-purple-900/20",

        ring: "ring-purple-500",

        hover: "hover:from-purple-600 hover:to-pink-600",

        glow: "shadow-purple-500/25",

      },

      consulting: {

        bg: "from-indigo-500 to-purple-500",

        text: "text-indigo-600",

        border: "border-indigo-200",

        light: "bg-indigo-50 dark:bg-indigo-900/20",

        ring: "ring-indigo-500",

        hover: "hover:from-indigo-600 hover:to-purple-600",

        glow: "shadow-indigo-500/25",

      },

      ecommerce: {

        bg: "from-yellow-500 to-orange-500",

        text: "text-yellow-600",

        border: "border-yellow-200",

        light: "bg-yellow-50 dark:bg-yellow-900/20",

        ring: "ring-yellow-500",

        hover: "hover:from-yellow-600 hover:to-orange-600",

        glow: "shadow-yellow-500/25",

      },

      manufacturing: {

        bg: "from-gray-500 to-slate-500",

        text: "text-gray-600",

        border: "border-gray-200",

        light: "bg-gray-50 dark:bg-gray-900/20",

        ring: "ring-gray-500",

        hover: "hover:from-gray-600 hover:to-slate-600",

        glow: "shadow-gray-500/25",

      },

      edtech: {

        bg: "from-emerald-500 to-teal-500",

        text: "text-emerald-600",

        border: "border-emerald-200",

        light: "bg-emerald-50 dark:bg-emerald-900/20",

        ring: "ring-emerald-500",

        hover: "hover:from-emerald-600 hover:to-teal-600",

        glow: "shadow-emerald-500/25",

      },

      fintech: {

        bg: "from-blue-500 to-green-500",

        text: "text-blue-600",

        border: "border-blue-200",

        light: "bg-blue-50 dark:bg-blue-900/20",

        ring: "ring-blue-500",

        hover: "hover:from-blue-600 hover:to-green-600",

        glow: "shadow-blue-500/25",

      },

      startup: {

        bg: "from-pink-500 to-rose-500",

        text: "text-pink-600",

        border: "border-pink-200",

        light: "bg-pink-50 dark:bg-pink-900/20",

        ring: "ring-pink-500",

        hover: "hover:from-pink-600 hover:to-rose-600",

        glow: "shadow-pink-500/25",

      },

      government: {

        bg: "from-slate-500 to-gray-500",

        text: "text-slate-600",

        border: "border-slate-200",

        light: "bg-slate-50 dark:bg-slate-900/20",

        ring: "ring-slate-500",

        hover: "hover:from-slate-600 hover:to-gray-600",

        glow: "shadow-slate-500/25",

      },

      unicorn: {

        bg: "from-violet-500 to-purple-500",

        text: "text-violet-600",

        border: "border-violet-200",

        light: "bg-violet-50 dark:bg-violet-900/20",

        ring: "ring-violet-500",

        hover: "hover:from-violet-600 hover:to-purple-600",

        glow: "shadow-violet-500/25",

      },

    }

    return colors[sector as keyof typeof colors] || colors.technology

  }



  const industryTypes = [

    { name: "MNCs", count: "2.5K+ Companies", sector: "technology" },

    { name: "Internet", count: "354 Companies", sector: "technology" },

    { name: "Manufacturing", count: "1K+ Companies", sector: "manufacturing" },

    { name: "Fortune 500", count: "190 Companies", sector: "finance" },

    { name: "Product", count: "1.2K+ Companies", sector: "technology" },

    { name: "Fintech", count: "450 Companies", sector: "fintech" },

    { name: "Healthcare", count: "680 Companies", sector: "healthcare" },

    { name: "EdTech", count: "320 Companies", sector: "edtech" },

    { name: "Startup", count: "2.8K+ Companies", sector: "startup" },

    { name: "Automobile", count: "280 Companies", sector: "automotive" },

    { name: "Government", count: "150 Companies", sector: "government" },

    { name: "Unicorn", count: "45 Companies", sector: "unicorn" },

    { name: "Consulting", count: "890 Companies", sector: "consulting" },

    { name: "E-commerce", count: "670 Companies", sector: "ecommerce" },

    { name: "Energy", count: "340 Companies", sector: "energy" },

  ]



  // Filter functions

  const handleFilterChange = useCallback((filterType: keyof FilterState, value: any) => {

    setFilters(prev => ({

      ...prev,

      [filterType]: value

    }))

    setCurrentPage(1) // Reset to first page when filters change

  }, [])



  const handleIndustryToggle = useCallback((industry: string) => {

    setFilters(prev => ({

      ...prev,

      industries: prev.industries.includes(industry)

        ? prev.industries.filter(i => i !== industry)

        : [...prev.industries, industry]

    }))

    

    // Clear top industry selection when manually changing filters

    if (selectedIndustry) {

      setSelectedIndustry(null)

    }

    setCurrentPage(1)

  }, [selectedIndustry])



  const handleCompanyTypeToggle = useCallback((type: string) => {

    setFilters(prev => ({

      ...prev,

      companyTypes: prev.companyTypes.includes(type)

        ? prev.companyTypes.filter(t => t !== type)

        : [...prev.companyTypes, type]

    }))

    

    // Clear top industry selection when manually changing filters

    if (selectedIndustry) {

      setSelectedIndustry(null)

    }

    setCurrentPage(1)

  }, [selectedIndustry])



  const handleCompanySizeToggle = useCallback((size: string) => {

    setFilters(prev => ({

      ...prev,

      companySizes: prev.companySizes.includes(size)

        ? prev.companySizes.filter(s => s !== size)

        : [...prev.companySizes, size]

    }))

    setCurrentPage(1)

  }, [])



  const handleLocationToggle = useCallback((location: string) => {

    setFilters(prev => ({

      ...prev,

      locations: prev.locations.includes(location)

        ? prev.locations.filter(l => l !== location)

        : [...prev.locations, location]

    }))

    setCurrentPage(1)

  }, [])







  // Function to handle top industry card selection and sync with filters

  const handleIndustryCardSelection = useCallback((industryName: string | null) => {

    setSelectedIndustry(industryName)

    

    if (!industryName) {

      // If deselecting, clear related filters

      setFilters(prev => ({

        ...prev,

        industries: [],

        companyTypes: []

      }))

      return

    }



    // Map industry card selections to filter states

    const filterMapping: { [key: string]: { industries: string[]; companyTypes: string[] } } = {
      Internet: { industries: ["Internet"], companyTypes: [] },
      Startup: { industries: [], companyTypes: ["Startup"] },
      MNCs: { industries: [], companyTypes: ["MNC"] },
      "Fortune 500": { industries: [], companyTypes: ["Fortune 500"] },
      Fintech: { industries: ["Fintech"], companyTypes: [] },
      EdTech: { industries: ["EdTech"], companyTypes: [] },
      Healthcare: { industries: ["Healthcare"], companyTypes: [] },
      Manufacturing: { industries: ["Manufacturing"], companyTypes: [] },
      Automobile: { industries: ["Automotive"], companyTypes: [] },
      Government: { industries: [], companyTypes: ["Government"] },
      Unicorn: { industries: [], companyTypes: ["Unicorn"] },
      Consulting: { industries: ["Consulting"], companyTypes: [] },
      "E-commerce": { industries: ["E-commerce"], companyTypes: [] },
      Energy: { industries: ["Energy"], companyTypes: [] },
      Product: { industries: [], companyTypes: ["Product Based"] }
    }



    const mapping = filterMapping[industryName]

    if (mapping) {

      setFilters(prev => ({

        ...prev,

        industries: mapping.industries,

        companyTypes: mapping.companyTypes

      }))

    }

    

    setCurrentPage(1)

  }, [])



  const clearAllFilters = useCallback(() => {

    setFilters({

      search: "",

      location: "",

      industries: [],

      companyTypes: [],

      companySizes: [],

      locations: [],

      minRating: "",

      salaryRange: "",

    })

    handleIndustryCardSelection(null)

    setIsFeaturedFilter(false)

    setCurrentPage(1)

    // Redirect to /companies page

    router.push('/companies')

  }, [handleIndustryCardSelection, router])



  // Transform backend company to UI model with graceful fallbacks

  const transformCompany = (c: any): Company => {

    const employeesBySize: Record<string, string> = {

      small: "1-50",

      medium: "51-200",

      large: "201-1000",

      enterprise: "1000+",

    }

    const industry = c.industries && Array.isArray(c.industries) && c.industries.length > 0 ? c.industries[0] : (c.industry || 'General')

    const sector = (industry || '').toLowerCase().includes('tech') ? 'technology'

      : (industry || '').toLowerCase().includes('fin') ? 'fintech'

      : (industry || '').toLowerCase().includes('health') ? 'healthcare'

      : (industry || '').toLowerCase().includes('auto') ? 'automotive'

      : (industry || '').toLowerCase().includes('manufact') ? 'manufacturing'

      : (industry || '').toLowerCase().includes('consult') ? 'consulting'

      : (industry || '').toLowerCase().includes('energy') ? 'energy'

      : 'technology'

    const locationParts = [c.city, c.state, c.country].filter(Boolean)

    // Get company type - prioritize companyTypes array, fallback to companyType enum
    const companyTypeArray = c.companyTypes && Array.isArray(c.companyTypes) && c.companyTypes.length > 0 ? c.companyTypes : []
    const companyTypeEnum = c.companyType || ''
    const displayCompanyType = companyTypeArray.length > 0 ? companyTypeArray[0] : companyTypeEnum

    return {

      id: String(c.id),

      name: c.name || 'Company',

      logo: c.logo || "/placeholder.svg?height=80&width=80",

      industry,

      industries: c.industries && Array.isArray(c.industries) ? c.industries : [industry],

      sector,

      location: locationParts.join(', ') || 'Not provided',

      employees: employeesBySize[String(c.companySize)] || String(c.companySize || 'Not provided'),

      rating: 0,

      reviews: 0,

      openings: 0,

      description: c.description || 'Explore roles and teams at this organization.',

      founded: 'Not provided',

      website: c.website || '',

      benefits: [],

      featured: false,

      salaryRange: '',

      workCulture: '',

      companyType: displayCompanyType || 'Not specified',
      companyTypes: c.companyTypes && Array.isArray(c.companyTypes) ? c.companyTypes : [],

      urgent: false,

      isActive: c.isActive !== false, // Default to true if not specified
      isVerified: c.isVerified || false,
      verificationStatus: c.verificationStatus || 'pending',
      placeholderImage: c.placeholderImage || null,

    }

  }



  const allCompanies: Company[] = useMemo(() => {

    return (apiCompanies || [])

      .filter((c: any) => c?.region !== 'gulf')

      .map(transformCompany)

  }, [apiCompanies])



  // Filter and sort companies

  const filteredCompanies = useMemo(() => {

    let filtered = allCompanies

    console.log('🏢 Starting with', allCompanies.length, 'companies')



    // Featured filter (from URL parameter)

    if (isFeaturedFilter) {

      filtered = filtered.filter(company => company.featured)

      console.log('⭐ Featured filter applied:', filtered.length, 'companies')

    }

    // Active and Verified filter - Only show active and verified companies

    filtered = filtered.filter(company => 
      company.isActive === true && 
      (company.verificationStatus === 'verified' || company.isVerified === true)
    )

    console.log('✅ Active and verified filter applied:', filtered.length, 'companies')

    // Enhanced Search filter with advanced matching

    if (filters.search) {

      const beforeCount = filtered.length

      const processedSearch = processSearchQuery(filters.search, allCompanies)

      

      filtered = filtered.filter(company => {

        const companyName = company.name.toLowerCase()

        const companyIndustry = company.industry.toLowerCase()

        const companyDescription = company.description.toLowerCase()

        const companyLocation = company.location.toLowerCase()

        const searchLower = processedSearch.toLowerCase().trim()

        const originalSearchLower = filters.search.toLowerCase().trim()

        

        // Check for exact matches with processed search

        const exactMatch = 

          companyName.includes(searchLower) ||

          companyIndustry.includes(searchLower) ||

          companyDescription.includes(searchLower) ||

          companyLocation.includes(searchLower)

        

        // Check for original search term as well

        const originalMatch = 

          companyName.includes(originalSearchLower) ||

          companyIndustry.includes(originalSearchLower) ||

          companyDescription.includes(originalSearchLower) ||

          companyLocation.includes(originalSearchLower)

        

        // Check for partial word matches

        const words = searchLower.split(/\s+/).filter(word => word.length > 2)

        const originalWords = originalSearchLower.split(/\s+/).filter(word => word.length > 2)

        

        const wordMatch = words.some(word => 

          companyName.includes(word) ||

          companyIndustry.includes(word) ||

          companyDescription.includes(word) ||

          companyLocation.includes(word)

        )

        

        const originalWordMatch = originalWords.some(word => 

          companyName.includes(word) ||

          companyIndustry.includes(word) ||

          companyDescription.includes(word) ||

          companyLocation.includes(word)

        )

        

        // Check for fuzzy matches using similarity

        const fuzzyMatch = 

          calculateSimilarity(companyName, searchLower) > 0.6 ||

          calculateSimilarity(companyIndustry, searchLower) > 0.6 ||

          calculateSimilarity(companyDescription, searchLower) > 0.6 ||

          calculateSimilarity(companyLocation, searchLower) > 0.6 ||

          calculateSimilarity(companyName, originalSearchLower) > 0.6 ||

          calculateSimilarity(companyIndustry, originalSearchLower) > 0.6 ||

          calculateSimilarity(companyDescription, originalSearchLower) > 0.6 ||

          calculateSimilarity(companyLocation, originalSearchLower) > 0.6

        

        const result = exactMatch || originalMatch || wordMatch || originalWordMatch || fuzzyMatch

        

        if (result) {

          console.log('✅ Dynamic company search match found:', { 

            companyName: company.name, 

            processedSearch,

            originalSearch: filters.search,

            exactMatch, 

            originalMatch, 

            wordMatch, 

            originalWordMatch, 

            fuzzyMatch 

          })

        }

        

        return result

      })

      console.log('🔍 Enhanced search filter applied:', beforeCount, '→', filtered.length, 'companies')

    }



    // Location filter

    if (filters.location) {

      const beforeCount = filtered.length

      filtered = filtered.filter(company =>

        company.location.toLowerCase().includes(filters.location.toLowerCase())

      )

      console.log('📍 Location filter applied:', beforeCount, '→', filtered.length, 'companies')

    }



    // Industry filter - Enhanced with case-sensitive and typo-tolerant matching

    if (filters.industries.length > 0) {

      const beforeCount = filtered.length

      filtered = filtered.filter(company => {

        const match = filters.industries.some(industry => {

          const industryLower = industry.toLowerCase().trim()

          

          // Get all possible industry values from the company

          const companyIndustries = company.industries && Array.isArray(company.industries) ? company.industries : []

          const companyIndustry = company.industry || ''

          

          // Check if any of the company's industries match

          const industryMatch = companyIndustries.some((compIndustry: string) => {

            const compIndustryLower = compIndustry.toLowerCase().trim()

            return compIndustryLower === industryLower ||

                   compIndustryLower.includes(industryLower) ||

                   industryLower.includes(compIndustryLower)

          })

          

          const companyIndustryLower = companyIndustry.toLowerCase().trim()

          

          // Exact case-insensitive match

          const exactMatch = companyIndustryLower === industryLower

          

          // Case-insensitive contains match

          const containsMatch = companyIndustryLower.includes(industryLower) ||

                               industryLower.includes(companyIndustryLower)

          

          // Fuzzy similarity match for typos

          const fuzzyMatch = calculateSimilarity(companyIndustryLower, industryLower) > 0.7

          

          // Handle common abbreviations and variations

          const abbreviationMatch = 

            (industryLower === 'technology' && (companyIndustryLower.includes('tech') || companyIndustryLower.includes('it') || companyIndustryLower.includes('software'))) ||

            (industryLower === 'fintech' && (companyIndustryLower.includes('fintech') || companyIndustryLower.includes('financial') || companyIndustryLower.includes('fintech'))) ||

            (industryLower === 'healthcare' && (companyIndustryLower.includes('health') || companyIndustryLower.includes('medical') || companyIndustryLower.includes('pharma'))) ||

            (industryLower === 'edtech' && (companyIndustryLower.includes('education') || companyIndustryLower.includes('learning') || companyIndustryLower.includes('edtech'))) ||

            (industryLower === 'e-commerce' && (companyIndustryLower.includes('ecommerce') || companyIndustryLower.includes('online') || companyIndustryLower.includes('retail'))) ||

            (industryLower === 'manufacturing' && (companyIndustryLower.includes('manufacturing') || companyIndustryLower.includes('production') || companyIndustryLower.includes('factory'))) ||

            (industryLower === 'automotive' && (companyIndustryLower.includes('auto') || companyIndustryLower.includes('vehicle') || companyIndustryLower.includes('car'))) ||

            (industryLower === 'banking & finance' && (companyIndustryLower.includes('bank') || companyIndustryLower.includes('finance') || companyIndustryLower.includes('financial'))) ||

            (industryLower === 'consulting' && (companyIndustryLower.includes('consult') || companyIndustryLower.includes('advisory') || companyIndustryLower.includes('services'))) ||

            (industryLower === 'energy & petrochemicals' && (companyIndustryLower.includes('energy') || companyIndustryLower.includes('petro') || companyIndustryLower.includes('oil') || companyIndustryLower.includes('gas'))) ||

            (industryLower === 'pharmaceuticals' && (companyIndustryLower.includes('pharma') || companyIndustryLower.includes('drug') || companyIndustryLower.includes('medicine'))) ||

            (industryLower === 'telecommunications' && (companyIndustryLower.includes('telecom') || companyIndustryLower.includes('communication') || companyIndustryLower.includes('network'))) ||

            (industryLower === 'media & entertainment' && (companyIndustryLower.includes('media') || companyIndustryLower.includes('entertainment') || companyIndustryLower.includes('broadcast'))) ||

            (industryLower === 'real estate' && (companyIndustryLower.includes('real') || companyIndustryLower.includes('property') || companyIndustryLower.includes('estate'))) ||

            (industryLower === 'food & beverage' && (companyIndustryLower.includes('food') || companyIndustryLower.includes('beverage') || companyIndustryLower.includes('restaurant')))

          

          const result = industryMatch || exactMatch || containsMatch || fuzzyMatch || abbreviationMatch

          

          if (result) {

            console.log('✅ Industry match found:', { 

              companyName: company.name, 

              companyIndustry: company.industry, 

              companyIndustries: companyIndustries,

              selectedIndustry: industry,

              industryMatch,

              exactMatch,

              containsMatch,

              fuzzyMatch,

              abbreviationMatch

            })

          }

          

          return result

        })

        

        return match

      })

      console.log('🏭 Enhanced industry filter applied:', beforeCount, '→', filtered.length, 'companies')

    }



    // Company type filter - Enhanced with case-sensitive and typo-tolerant matching

    if (filters.companyTypes.length > 0) {

      const beforeCount = filtered.length

      filtered = filtered.filter(company => {

        const match = filters.companyTypes.some(type => {

          const typeLower = type.toLowerCase()

          // Get all company type values to check against
          const companyTypeArray = company.companyTypes && Array.isArray(company.companyTypes) ? company.companyTypes : []
          const companyTypeString = company.companyType || ''

          // Special handling for Unicorn - check in company name, description, or other fields if companyTypes is empty
          if (typeLower === 'unicorn' && companyTypeArray.length === 0 && !companyTypeString) {
            // Check if company name suggests unicorn status
            const nameLower = company.name.toLowerCase()
            const descLower = company.description.toLowerCase()
            const isUnicorn = nameLower.includes('unicorn') || descLower.includes('unicorn') || 
                             nameLower.includes('billion') || descLower.includes('valuation')
            if (isUnicorn) return true
          }

          // Check if type matches any value in the array
          const arrayMatch = companyTypeArray.some((compType: string) => {
            const compTypeLower = compType.toLowerCase().trim()
            return compTypeLower === typeLower || compTypeLower.includes(typeLower) || typeLower.includes(compTypeLower)
          })

          const companyTypeLower = companyTypeString.toLowerCase()

          
          // Define keyword mappings for each company type
          const typeKeywords: { [key: string]: string[] } = {
            'startup': ['startup', 'emerging', 'early stage', 'seed', 'early', 'early-stage', 'start up'],
            'unicorn': ['unicorn', 'billion', 'valuation', 'valuated', 'valued at', 'billion dollar', 'billion+', '$1b', 'decacorn'],
            'mnc': ['mnc', 'multinational', 'global', 'international', 'corporate', 'enterprise', 'm&a'],
            'indian mnc': ['indian mnc', 'indian multinational', 'indian corporate', 'indian enterprise', 'indian public'],
            'product based': ['product based', 'product', 'saas', 'software product', 'platform', 'product-based', 'software company'],
            'fortune 500': ['fortune 500', 'fortune500', 'fortune', '500', 'fortune 5000', 'fortune 1000', 'fortune list'],
            'government': ['government', 'public', 'state', 'psu', 'public sector', 'sarkari', 'govt'],
            'non-profit': ['non-profit', 'nonprofit', 'ngo', 'charitable', 'non profit', 'charity', 'foundation'],
            'consulting': ['consulting', 'consultant', 'advisory', 'services', 'advisory firm', 'management consulting'],
            'sponsored': ['sponsored', 'featured', 'premium', 'verified', 'paid']
          }

          // Get keywords for the selected type
          const keywords = typeKeywords[typeLower] || [typeLower]

          // Check if any keyword matches in the string
          const keywordMatch = keywords.some(keyword => 
            companyTypeLower.includes(keyword)
          )

          // Check if any keyword matches in the array
          const arrayKeywordMatch = companyTypeArray.some((compType: string) => {
            const compTypeLower = compType.toLowerCase()
            return keywords.some(keyword => compTypeLower.includes(keyword))
          })

          // Exact case-insensitive match

          const exactMatch = companyTypeLower === typeLower

          

          // Case-insensitive contains match

          const containsMatch = companyTypeLower.includes(typeLower) ||

                               typeLower.includes(companyTypeLower)

          

          // Fuzzy similarity match for typos

          const fuzzyMatch = calculateSimilarity(companyTypeLower, typeLower) > 0.7

          

          const result = arrayMatch || exactMatch || containsMatch || fuzzyMatch || keywordMatch || arrayKeywordMatch

          

          if (result) {

            console.log('✅ Company type match found:', { 

              companyName: company.name, 

              companyType: company.companyType, 
              companyTypes: company.companyTypes,

              selectedType: type,

              arrayMatch,

              exactMatch,

              containsMatch,

              fuzzyMatch,

              keywordMatch,

              arrayKeywordMatch

            })

          }

          

          return result

        })

        

        return match

      })

      console.log('🏢 Enhanced company type filter applied:', beforeCount, '→', filtered.length, 'companies')

    }



    // Company size filter

    if (filters.companySizes.length > 0) {

      filtered = filtered.filter(company =>

        filters.companySizes.some(size => {

          if (size === "1-50 employees") return company.employees === "1-50"

          if (size === "51-200 employees") return company.employees === "51-200"

          if (size === "201-1000 employees") return company.employees === "201-1000" || company.employees === "500-1000"

          if (size === "1001-5000 employees") return company.employees === "1001-5000" || company.employees === "2000-5000"

          if (size === "5000+ employees") return company.employees === "5000+" || company.employees === "10000+"

          return false

        })

      )

    }



    // Location filter (from checkbox)

    if (filters.locations.length > 0) {

      filtered = filtered.filter(company =>

        filters.locations.includes(company.location)

      )

    }



    // Rating filter

    if (filters.minRating) {

      const minRating = parseFloat(filters.minRating)

      filtered = filtered.filter(company => company.rating >= minRating)

    }



    // Salary range filter

    if (filters.salaryRange) {

      filtered = filtered.filter(company => {

        const range = filters.salaryRange

        if (range === "0-10") return company.salaryRange.includes("5-") || company.salaryRange.includes("6-") || company.salaryRange.includes("7-") || company.salaryRange.includes("8-") || company.salaryRange.includes("9-") || company.salaryRange.includes("10")

        if (range === "10-20") return company.salaryRange.includes("10-") || company.salaryRange.includes("12-") || company.salaryRange.includes("15-") || company.salaryRange.includes("18-") || company.salaryRange.includes("20")

        if (range === "20-30") return company.salaryRange.includes("20-") || company.salaryRange.includes("22-") || company.salaryRange.includes("25-") || company.salaryRange.includes("28-") || company.salaryRange.includes("30")

        if (range === "30+") return company.salaryRange.includes("30+") || company.salaryRange.includes("35") || company.salaryRange.includes("40")

        return true

      })

    }



    // Selected industry filter (from top cards)

    if (selectedIndustry) {

      const beforeCount = filtered.length

      filtered = filtered.filter(company => {

        // Get all possible industry values from the company

        const companyIndustries = company.industries && Array.isArray(company.industries) ? company.industries : []

        const companyIndustry = company.industry || ''

        

        // Check industry matches

        if (selectedIndustry === "Internet") {
          // Internet-related industries: Software Product, Internet, Electronics Manufacturing, Electronic Components, Hardware & Networking, Emerging Technology, IT Services & Consulting
          const internetKeywords = [
            'internet', 'technology', 'software product', 'saas', 'online services', 'web', 'digital', 'tech', 
            'information technology', 'it services', 'consulting', 'electronics manufacturing', 'electronic components',
            'hardware', 'networking', 'emerging technology', 'software', 'platform', 'cloud', 'digital services',
            'web services', 'online marketplace', 'e-commerce', 'ecommerce'
          ]
          
          return companyIndustries.some((ind: string) => {
            const indLower = ind.toLowerCase()
            return internetKeywords.some(keyword => indLower.includes(keyword))
          }) || companyIndustry.toLowerCase().includes('internet')

        }

        if (selectedIndustry === "Startup") {
          const startupTypeArray = company.companyTypes && Array.isArray(company.companyTypes) ? company.companyTypes : []
          const startupTypeString = company.companyType || ''
          
          return startupTypeString.toLowerCase().includes('startup') || 
                 startupTypeArray.some((type: string) => type.toLowerCase().includes('startup')) ||
                 companyIndustries.some((ind: string) => ind.toLowerCase().includes('startup'))
        }

        if (selectedIndustry === "MNCs") {
          const mncTypeArray = company.companyTypes && Array.isArray(company.companyTypes) ? company.companyTypes : []
          const mncTypeString = company.companyType || ''
          
          return mncTypeString.toLowerCase().includes('mnc') || 
                 mncTypeArray.some((type: string) => type.toLowerCase().includes('mnc')) ||
                 companyIndustries.some((ind: string) => ind.toLowerCase().includes('multinational'))
        }

        if (selectedIndustry === "Fortune 500") {
          const fortuneTypeArray = company.companyTypes && Array.isArray(company.companyTypes) ? company.companyTypes : []
          const fortuneTypeString = company.companyType || ''
          
          return fortuneTypeString.toLowerCase().includes('fortune') || 
                 fortuneTypeArray.some((type: string) => type.toLowerCase().includes('fortune')) ||
                 companyIndustries.some((ind: string) => ind.toLowerCase().includes('fortune'))
        }

        if (selectedIndustry === "Fintech") {
          // Fintech-related industries: Banking/Lending, Insurance, Investment Banking/VC/PE, FinTech, Stock Broking/Trading, Mutual Funds/Asset Management, NBFC, Accounting/Audit, Wealth Management
          const fintechKeywords = [
            'fintech', 'financial', 'banking', 'finance', 'investment', 'lending', 'payment', 'wallet', 
            'cryptocurrency', 'blockchain', 'insurance', 'wealth', 'credit', 'debit', 'banking / lending',
            'investment banking', 'vc', 'pe', 'stock broking', 'trading', 'mutual funds', 'asset management',
            'nbfc', 'accounting', 'audit', 'wealth management', 'financial services', 'digital banking',
            'payments', 'digital payment'
          ]
          
          return companyIndustries.some((ind: string) => {
            const indLower = ind.toLowerCase()
            return fintechKeywords.some(keyword => indLower.includes(keyword))
          }) || companyIndustry.toLowerCase().includes('fintech')

        }

        if (selectedIndustry === "EdTech") {
          // EdTech-related industries: Education/Training, E-Learning/EdTech
          const eduKeywords = [
            'edtech', 'education', 'learning', 'elearning', 'e-learning', 'training', 'tutoring', 'academic', 
            'school', 'university', 'college', 'curriculum', 'educational', 'educational services',
            'online learning', 'learning platform', 'educational technology', 'e-learning platform'
          ]
          
          return companyIndustries.some((ind: string) => {
            const indLower = ind.toLowerCase()
            return eduKeywords.some(keyword => indLower.includes(keyword))
          }) || companyIndustry.toLowerCase().includes('education')

        }

        if (selectedIndustry === "Healthcare") {
          // Healthcare-related industries: Medical Services, Pharmaceutical & Life Sciences, Medical Devices, Biotechnology, Clinical Research
          const healthcareKeywords = [
            'healthcare', 'medical', 'pharma', 'health', 'hospital', 'clinic', 'diagnostic', 'therapy', 'wellness', 
            'biotechnology', 'pharmaceutical', 'life sciences', 'clinical', 'nursing', 'patient care', 'medical services',
            'medical devices', 'clinical research', 'healthtech', 'health tech', 'telemedicine', 'medical devices',
            'pharmaceutical', 'biotech', 'clinical research', 'health services', 'medical equipment'
          ]
          
          return companyIndustries.some((ind: string) => {
            const indLower = ind.toLowerCase()
            return healthcareKeywords.some(keyword => indLower.includes(keyword))
          }) || companyIndustry.toLowerCase().includes('health')

        }

        if (selectedIndustry === "Manufacturing") {
          // Manufacturing-related industries: Industrial Equipment, Auto Components, Chemicals, Building Material, Automobile, Electrical Equipment, Industrial Automation, Iron & Steel, Packaging & Containers, Metals & Mining, Petrochemical
          const manufacturingKeywords = [
            'manufacturing', 'production', 'industrial', 'factory', 'assembly', 'fabrication', 'processing', 
            'plant', 'machinery', 'equipment', 'industrial automation', 'industrial equipment', 'chemicals',
            'building material', 'auto component', 'electrical equipment', 'iron', 'steel', 'packaging',
            'containers', 'metals', 'mining', 'petrochemical', 'plastics', 'automobile', 'electronics manufacturing',
            'metal', 'smelting', 'refining'
          ]
          
          return companyIndustries.some((ind: string) => {
            const indLower = ind.toLowerCase()
            return manufacturingKeywords.some(keyword => indLower.includes(keyword))
          }) || companyIndustry.toLowerCase().includes('manufacturing')

        }

        if (selectedIndustry === "Automobile") {
          // Automobile-related industries: Automobile, Auto Components, Logistics & Supply Chain, Manufacturing
          const automobileKeywords = [
            'automobile', 'automotive', 'auto', 'vehicle', 'car', 'truck', 'motor', 'transportation', 
            'auto component', 'vehicles', 'auto parts', 'manufacturing', 'industrial equipment', 
            'electronics manufacturing', 'electrical equipment', 'industrial automation', 'packaging',
            'building material', 'metals', 'mining', 'chemicals'
          ]
          
          return companyIndustries.some((ind: string) => {
            const indLower = ind.toLowerCase()
            return automobileKeywords.some(keyword => indLower.includes(keyword))
          }) || companyIndustry.toLowerCase().includes('auto')

        }

        if (selectedIndustry === "Government") {
          const govtTypeArray = company.companyTypes && Array.isArray(company.companyTypes) ? company.companyTypes : []
          const govtTypeString = company.companyType || ''
          
          return govtTypeString.toLowerCase().includes('government') || 
                 govtTypeArray.some((type: string) => type.toLowerCase().includes('government')) ||
                 companyIndustries.some((ind: string) => ind.toLowerCase().includes('government'))
        }

        if (selectedIndustry === "Unicorn") {
          const unicornTypeArray = company.companyTypes && Array.isArray(company.companyTypes) ? company.companyTypes : []
          const unicornTypeString = company.companyType || ''
          
          return unicornTypeString.toLowerCase().includes('unicorn') || 
                 unicornTypeArray.some((type: string) => type.toLowerCase().includes('unicorn')) ||
                 companyIndustries.some((ind: string) => ind.toLowerCase().includes('unicorn'))
        }

        if (selectedIndustry === "Consulting") {
          // Consulting-related industries: Consulting, IT Services & Consulting, Management Consulting, Business Consulting, Legal Services, Recruitment/Staffing, Market Research
          const consultingKeywords = [
            'consulting', 'consult', 'advisory', 'consultant', 'it services & consulting', 'management consulting', 
            'business consulting', 'legal services', 'recruitment', 'staffing', 'market research',
            'business intelligence', 'advisory services', 'strategy consulting', 'technology consulting',
            'it consulting', 'management consultancy'
          ]
          
          return companyIndustries.some((ind: string) => {
            const indLower = ind.toLowerCase()
            return consultingKeywords.some(keyword => indLower.includes(keyword))
          }) || companyIndustry.toLowerCase().includes('consult')

        }

        if (selectedIndustry === "E-commerce") {
          // E-commerce-related industries: E-commerce/Internet, Online Services, Marketplace, Food Tech, PropTech
          const ecommerceKeywords = [
            'e-commerce', 'ecommerce', 'e-commerce / internet', 'online retail', 'internet', 'marketplace', 
            'shopping', 'retail', 'online marketplace', 'digital commerce', 'online services', 'food tech',
            'proptech', 'online grocery', 'e-retail', 'digital marketplace', 'online shopping', 'e-tail'
          ]
          
          return companyIndustries.some((ind: string) => {
            const indLower = ind.toLowerCase()
            return ecommerceKeywords.some(keyword => indLower.includes(keyword))
          }) || companyIndustry.toLowerCase().includes('commerce')

        }

        if (selectedIndustry === "Energy") {
          // Energy-related industries: Power/Energy, Oil & Gas, Renewable Energy, Water Treatment/Waste Management
          const energyKeywords = [
            'energy', 'power', 'renewable', 'solar', 'wind', 'oil', 'gas', 'petroleum', 'electrical', 'utilities', 
            'electricity', 'generation', 'petrochemical', 'power / energy', 'oil & gas', 'renewable energy',
            'water treatment', 'waste management', 'petroleum', 'power generation', 'electrical equipment',
            'electrical power', 'energy sector', 'renewables', 'clean energy'
          ]
          
          return companyIndustries.some((ind: string) => {
            const indLower = ind.toLowerCase()
            return energyKeywords.some(keyword => indLower.includes(keyword))
          }) || companyIndustry.toLowerCase().includes('energy')

        }

        if (selectedIndustry === "Product") {
          const productTypeArray = company.companyTypes && Array.isArray(company.companyTypes) ? company.companyTypes : []
          const productTypeString = company.companyType || ''
          
          return productTypeString.toLowerCase().includes('product based') || 
                 productTypeString.toLowerCase().includes('product') ||
                 productTypeArray.some((type: string) => type.toLowerCase().includes('product'))
        }

        

        // Fallback: check if selectedIndustry matches any company industry

        const lowerSelected = selectedIndustry.toLowerCase()

        return companyIndustry.toLowerCase().includes(lowerSelected) || 

               companyIndustries.some((ind: string) => ind.toLowerCase().includes(lowerSelected))

      })

      console.log('🎯 Selected industry filter applied:', beforeCount, '→', filtered.length, 'companies')

    }



    // Sort companies

    switch (sortBy) {

      case "rating":

        filtered.sort((a, b) => b.rating - a.rating)

        break

      case "openings":

        filtered.sort((a, b) => b.openings - a.openings)

        break

      case "reviews":

        filtered.sort((a, b) => b.reviews - a.reviews)

        break

      case "name":

        filtered.sort((a, b) => a.name.localeCompare(b.name))

        break

      default:

        filtered.sort((a, b) => b.rating - a.rating)

    }



    return filtered

  }, [allCompanies, filters, selectedIndustry, sortBy])



  const totalCompanies = filteredCompanies.length

  const totalPages = Math.ceil(totalCompanies / companiesPerPage)

  const startIndex = (currentPage - 1) * companiesPerPage

  const endIndex = startIndex + companiesPerPage

  const currentCompanies = filteredCompanies.slice(startIndex, endIndex)



  const scrollLeft = () => {

    if (scrollRef.current) {

      scrollRef.current.scrollBy({ left: -300, behavior: "smooth" })

    }

  }



  const scrollRight = () => {

    if (scrollRef.current) {

      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" })

    }

  }



  // Reset to page 1 when filters change

  const handlePageChange = (page: number) => {

    // Ensure page is within valid range
    const validPage = Math.min(Math.max(1, page), totalPages || 1)
    
    setCurrentPage(validPage)

    // Scroll to top of company list

    window.scrollTo({ top: 0, behavior: "smooth" })

  }



  // Reset page to 1 when totalPages changes or becomes invalid

  useEffect(() => {

    if (totalPages > 0 && currentPage > totalPages) {

      setCurrentPage(1)

    }

  }, [totalPages, currentPage])



  const getHeaderText = () => {

    // Check for industry filters from URL

    if (filters.industries.length > 0) {

      const industry = filters.industries[0]

      if (industry === 'Technology') {

        // Check if it came from IT Services & Consulting or Internet

        const urlParams = new URLSearchParams(window.location.search)

        const originalIndustry = urlParams.get('industry')

        if (originalIndustry === 'IT Services & Consulting') {

          return "Top IT services & consulting companies hiring now"

        } else if (originalIndustry === 'Internet') {

          return "Top internet companies hiring now"

        }

      }

      if (industry === 'Fintech') return "Top fintech companies hiring now"

      return `Top ${industry.toLowerCase()} companies hiring now`

    }

    

    // Check for company type filters from URL

    if (filters.companyTypes.length > 0) {

      const type = filters.companyTypes[0]

      if (type === 'Unicorn') return "Top unicorn companies hiring now"

      if (type === 'MNC') return "Top MNC companies hiring now"

      if (type === 'Startup') return "Top startup companies hiring now"

      if (type === 'Product Based') return "Top product-based companies hiring now"

      if (type === 'Sponsored') return "Top sponsored companies hiring now"

      return `Top ${type.toLowerCase()} companies hiring now`

    }

    

    // Check for featured filter

    if (isFeaturedFilter) {

      return "Top featured companies hiring now"

    }

    

    // Check for selected industry from UI

    if (selectedIndustry) {

      return `Top ${selectedIndustry.toLowerCase()} companies hiring now`

    }

    

    return "Top companies hiring now"

  }



  const industries = [

    "Technology",

    "Fintech",

    "Healthcare",

    "EdTech",

    "E-commerce",

    "Manufacturing",

    "Automotive",

    "Banking & Finance",

    "Consulting",

    "Energy & Petrochemicals",

    "Pharmaceuticals",

    "Telecommunications",

    "Media & Entertainment",

    "Real Estate",

    "Food & Beverage",

    "Retail",

    "Logistics",

    "Government",

    "Non-Profit",

  ]



  const companySizes = [

    "1-50 employees",

    "51-200 employees",

    "201-1000 employees",

    "1001-5000 employees",

    "5000+ employees",

  ]



  const locations = [

    "Bangalore",

    "Mumbai",

    "Delhi",

    "Hyderabad",

    "Pune",

    "Chennai",

    "Gurgaon",

    "Noida",

    "Kolkata",

    "Ahmedabad",

    "Kochi",

    "Indore",

    "Hybrid",

    "Remote",

  ]



  const companyTypes = [

    "MNC",

    "Indian MNC",

    "Startup",

    "Unicorn",

    "Product Based",

    "Fortune 500",

    "Government",

    "Non-Profit",

    "Consulting",

    "Sponsored",

  ]



  return (

    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-x-hidden">

      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-20 pb-8 lg:pb-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Enhanced Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-300/25 via-purple-300/25 to-indigo-400/25 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-indigo-800/20"></div>
        
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
              Find Your Dream Company
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeInOut" }}
              className="text-base sm:text-lg lg:text-xl text-[#5B5B6A] dark:text-slate-300 mb-4 sm:mb-6 max-w-[860px] mx-auto lg:mx-0 leading-relaxed font-medium px-4 sm:px-0"
            >
              Connect with industry leaders and explore opportunities at the world's most innovative companies
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
                    placeholder="Search companies..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const companiesSection = document.getElementById('companies-section')
                        if (companiesSection) {
                          companiesSection.scrollIntoView({ behavior: 'smooth' })
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
                    const companiesSection = document.getElementById('companies-section')
                    if (companiesSection) {
                      companiesSection.scrollIntoView({ behavior: 'smooth' })
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








      {/* TalentPulse Premium Banner */}

      <div className="bg-gradient-to-r from-purple-500 via-indigo-600 to-blue-600 py-3 sm:py-4">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <Link href="/naukri-talent-cloud">

            <div className="flex flex-col sm:flex-row items-center justify-between text-white cursor-pointer group">

              <div className="flex items-center mb-2 sm:mb-0">

                <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />

                <span className="font-semibold text-sm sm:text-base">TalentPulse for Employers</span>

                <span className="ml-2 text-xs sm:text-sm opacity-90">Advanced talent analytics & insights</span>

              </div>

              <Button

                size="sm"

                className="bg-white text-purple-600 hover:bg-purple-50 shadow-lg transition-all duration-300 group-hover:scale-105 text-xs sm:text-sm"

              >

                Learn More

                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />

              </Button>

            </div>

          </Link>

        </div>

      </div>



      {/* Industry Type Filters with Enhanced Hover Effects */}

      <div id="companies-section" className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50 pt-12 pb-8 sm:pt-16 sm:pb-12">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{getHeaderText()}</h2>

          </div>



          <div className="relative">

            <Button

              variant="outline"

              size="sm"

              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-xl border-0 hover:scale-110 transition-all duration-300 hidden sm:flex"

              onClick={scrollLeft}

            >

              <ChevronLeft className="w-4 h-4" />

            </Button>



            <div

              ref={scrollRef}

              className="flex space-x-4 sm:space-x-6 overflow-x-auto scrollbar-hide pb-4 px-0 sm:px-12"

              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}

            >

              {industryTypes.map((type, index) => {

                const sectorColors = getSectorColor(type.sector)

                const isSelected = selectedIndustry === type.name

                return (

                  <motion.div

                    key={index}

                    initial={{ opacity: 0, x: 20 }}

                    animate={{ opacity: 1, x: 0 }}

                    transition={{ delay: index * 0.05, duration: 0.3 }}

                    whileHover={{ scale: 1.05, y: -5 }}

                    whileTap={{ scale: 0.98 }}

                  >

                      <Card

                        className={`min-w-[200px] sm:min-w-[240px] cursor-pointer transition-all duration-500 border-0 group ${

                          isSelected

                            ? `${sectorColors.light} ring-2 ${sectorColors.ring} shadow-2xl ${sectorColors.glow}`

                            : "bg-white/50 dark:bg-white/10 hover:shadow-2xl hover:shadow-blue-500/10"

                        } backdrop-blur-xl overflow-hidden relative`}

                        onClick={() => handleIndustryCardSelection(isSelected ? null : type.name)}

                      >

                        <div

                          className={`absolute inset-0 bg-gradient-to-br ${sectorColors.bg} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}

                        />

                        <CardContent className="p-4 sm:p-6 text-center relative z-10">

                          <div className="mb-3 sm:mb-4">

                            <div

                              className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-2xl bg-gradient-to-br ${sectorColors.bg} flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg`}

                            >

                              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />

                            </div>

                          </div>

                          <h3

                            className={`font-bold text-base sm:text-lg mb-2 ${isSelected ? sectorColors.text : "text-slate-900 dark:text-white group-hover:" + sectorColors.text} transition-colors duration-300`}

                          >

                            {type.name}

                          </h3>

                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3 sm:mb-4">

                            {type.count}

                          </p>

                          <div

                            className={`w-full h-1.5 sm:h-2 rounded-full bg-gradient-to-r ${sectorColors.bg} ${isSelected ? "opacity-100" : "opacity-30 group-hover:opacity-70"} transition-all duration-300`}

                          />

                        </CardContent>

                      </Card>

                  </motion.div>

                )

              })}

            </div>



            <Button

              variant="outline"

              size="sm"

              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-xl border-0 hover:scale-110 transition-all duration-300 hidden sm:flex"

              onClick={scrollRight}

            >

              <ChevronRight className="w-4 h-4" />

            </Button>

          </div>

        </div>

      </div>



      <div className="relative">
        {/* Background gradient for main content */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200/40 via-purple-200/30 to-indigo-200/40 dark:from-slate-900/50 dark:via-slate-800/30 dark:to-slate-900/50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        <div className="flex gap-6 sm:gap-8 items-start">

          {/* Sticky Filters Sidebar */}

          <div className={`w-full lg:w-80 ${showFilters ? "block" : "hidden lg:block"}`}>

            <div className="sticky top-6 z-10 h-fit max-h-[calc(100vh-3rem)] overflow-y-auto">

              <Card className="border-white/30 dark:border-white/10 bg-white/50 dark:bg-white/10 backdrop-blur-xl shadow-xl">

                <CardHeader className="pb-4">

                  <CardTitle className="text-base sm:text-lg flex items-center justify-between">

                    <div className="flex items-center">

                    <Filter className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />

                    All Filters

                    </div>

                    <Button

                      variant="ghost"

                      size="sm"

                      onClick={() => setShowFilters(false)}

                      className="lg:hidden text-slate-500 hover:text-slate-700"

                    >

                      <X className="w-4 h-4" />

                    </Button>

                  </CardTitle>

                </CardHeader>

                <CardContent className="space-y-4 sm:space-y-6">

                      {/* Clear All Filters */}

                      {(filters.industries.length > 0 || filters.companyTypes.length > 0 || filters.companySizes.length > 0 || filters.locations.length > 0 || filters.minRating || filters.salaryRange) && (

                        <div className="mb-4">

                          <Button

                            variant="outline"

                            size="sm"

                            onClick={clearAllFilters}

                            className="w-full text-xs bg-red-50 hover:bg-red-100 text-red-600 border-red-200"

                          >

                            <X className="w-3 h-3 mr-1" />

                            Clear All Filters

                          </Button>

                        </div>

                      )}



                      {/* Industry */}

                      <div>

                        <h3 className="font-semibold mb-3 text-sm sm:text-base text-slate-900 dark:text-white">

                          Industry

                        </h3>

                        <div className="space-y-2">

                            {industries.slice(0, 8).map((industry) => {

                              const isAutoSelected = selectedIndustry && filters.industries.includes(industry)

                              return (

                              <div key={industry} className="flex items-center space-x-2">

                                  <Checkbox 

                                    id={industry} 

                                    checked={filters.industries.includes(industry)}

                                    onCheckedChange={() => handleIndustryToggle(industry)}

                                  />

                                <label

                                  htmlFor={industry}

                                    className={`text-xs sm:text-sm cursor-pointer ${

                                      isAutoSelected 

                                        ? "text-blue-600 dark:text-blue-400 font-medium" 

                                        : "text-slate-700 dark:text-slate-300"

                                    }`}

                                >

                                  {industry}

                                    {isAutoSelected && (

                                      <span className="ml-1 text-xs text-blue-500">(auto)</span>

                                    )}

                                </label>

                              </div>

                              )

                            })}
                            {industries.length > 8 && (
                              <button
                                type="button"
                                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 underline"
                                onClick={() => setShowIndustryDropdown(true)}
                              >
                                Show more industries
                              </button>
                            )}

                          </div>

                        </div>



                      <Separator className="bg-slate-200 dark:bg-slate-700" />



                      {/* Company Type */}

                      <div>

                        <h3 className="font-semibold mb-3 text-sm sm:text-base text-slate-900 dark:text-white">

                          Company Type

                        </h3>

                        <div className="space-y-2">

                          {companyTypes.map((type) => {

                            const isAutoSelected = selectedIndustry && filters.companyTypes.includes(type)

                            return (

                            <div key={type} className="flex items-center space-x-2">

                                <Checkbox 

                                  id={type} 

                                  checked={filters.companyTypes.includes(type)}

                                  onCheckedChange={() => handleCompanyTypeToggle(type)}

                                />

                              <label

                                htmlFor={type}

                                  className={`text-xs sm:text-sm cursor-pointer ${

                                    isAutoSelected 

                                      ? "text-blue-600 dark:text-blue-400 font-medium" 

                                      : "text-slate-700 dark:text-slate-300"

                                  }`}

                              >

                                {type}

                                  {isAutoSelected && (

                                    <span className="ml-1 text-xs text-blue-500">(auto)</span>

                                  )}

                              </label>

                            </div>

                            )

                          })}

                        </div>

                      </div>



                      <Separator className="bg-slate-200 dark:bg-slate-700" />



                      {/* Company Size */}

                      <div>

                        <h3 className="font-semibold mb-3 text-sm sm:text-base text-slate-900 dark:text-white">

                          Company Size

                        </h3>

                        <div className="space-y-2">

                          {companySizes.map((size) => (

                            <div key={size} className="flex items-center space-x-2">

                              <Checkbox 

                                id={size} 

                                checked={filters.companySizes.includes(size)}

                                onCheckedChange={() => handleCompanySizeToggle(size)}

                              />

                              <label

                                htmlFor={size}

                                className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 cursor-pointer"

                              >

                                {size}

                              </label>

                            </div>

                          ))}

                        </div>

                      </div>



                      <Separator className="bg-slate-200 dark:bg-slate-700" />



                      {/* Location */}

                      <div>

                        <h3 className="font-semibold mb-3 text-sm sm:text-base text-slate-900 dark:text-white">

                          Location

                        </h3>

                        <div className="space-y-2">

                            {locations.map((location) => (

                              <div key={location} className="flex items-center space-x-2">

                                <Checkbox 

                                  id={location} 

                                  checked={filters.locations.includes(location)}

                                  onCheckedChange={() => handleLocationToggle(location)}

                                />

                                <label

                                  htmlFor={location}

                                  className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 cursor-pointer"

                                >

                                  {location}

                                </label>

                              </div>

                            ))}

                          </div>

                      </div>



                      <Separator className="bg-slate-200 dark:bg-slate-700" />



                      {/* Rating */}

                      <div>

                        <h3 className="font-semibold mb-3 text-sm sm:text-base text-slate-900 dark:text-white">

                          Rating

                        </h3>

                        <Select value={filters.minRating} onValueChange={(value) => handleFilterChange("minRating", value)}>

                          <SelectTrigger className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm">

                            <SelectValue placeholder="Minimum rating" />

                          </SelectTrigger>

                          <SelectContent>

                            <SelectItem value="4.5">4.5+ stars</SelectItem>

                            <SelectItem value="4.0">4.0+ stars</SelectItem>

                            <SelectItem value="3.5">3.5+ stars</SelectItem>

                            <SelectItem value="3.0">3.0+ stars</SelectItem>

                          </SelectContent>

                        </Select>

                      </div>



                      <Separator className="bg-slate-200 dark:bg-slate-700" />



                      {/* Salary Range */}

                      <div>

                        <h3 className="font-semibold mb-3 text-sm sm:text-base text-slate-900 dark:text-white">

                          Salary Range

                        </h3>

                        <Select value={filters.salaryRange} onValueChange={(value) => handleFilterChange("salaryRange", value)}>

                          <SelectTrigger className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm">

                            <SelectValue placeholder="Select range" />

                          </SelectTrigger>

                          <SelectContent>

                            <SelectItem value="0-10">0-10 LPA</SelectItem>

                            <SelectItem value="10-20">10-20 LPA</SelectItem>

                            <SelectItem value="20-30">20-30 LPA</SelectItem>

                            <SelectItem value="30+">30+ LPA</SelectItem>

                          </SelectContent>

                        </Select>

                      </div>

                </CardContent>

              </Card>

            </div>

          </div>



          {/* Company Listings */}

          <div className="flex-1 min-w-0">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full sm:w-auto gap-4">

              <div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">

                    {isFeaturedFilter 

                      ? "Featured Companies" 

                      : selectedIndustry 

                        ? `${selectedIndustry} Companies` 

                        : "All Companies"

                    }

                </h2>

                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">

                  {startIndex + 1}-{Math.min(endIndex, totalCompanies)} of {totalCompanies} companies

                </p>

                </div>

                <div className="flex items-center gap-2">

                  <Button

                    variant="outline"

                    size="sm"

                    onClick={() => setShowFilters(!showFilters)}

                    className="lg:hidden"

                  >

                    <Filter className="w-4 h-4 mr-2" />

                    {showFilters ? 'Hide' : 'Show'} Filters

                  </Button>

                </div>

              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">

                <Select value={sortBy} onValueChange={setSortBy}>

                  <SelectTrigger className="w-full sm:w-48 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-600">

                    <SelectValue />

                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem value="rating">Highest Rated</SelectItem>

                    <SelectItem value="openings">Most Openings</SelectItem>

                    <SelectItem value="reviews">Most Reviews</SelectItem>

                    <SelectItem value="name">Company Name</SelectItem>

                  </SelectContent>

                </Select>

              </div>

            </div>



            {/* Active Filters Summary */}

            {(filters.industries.length > 0 || filters.companyTypes.length > 0 || filters.companySizes.length > 0 || filters.locations.length > 0 || filters.minRating || filters.salaryRange || isFeaturedFilter) && (

              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">

                <div className="flex items-center justify-between mb-3">

                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Active Filters:</h3>

                  <Button

                    variant="ghost"

                    size="sm"

                    onClick={clearAllFilters}

                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"

                  >

                    <X className="w-3 h-3 mr-1" />

                    Clear All

                  </Button>

                </div>

                                  <div className="flex flex-wrap gap-2">

                    {isFeaturedFilter && (

                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200">

                        Featured Companies Only

                        <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setIsFeaturedFilter(false)} />

                      </Badge>

                    )}

                    {filters.industries.map((industry) => {

                      const isAutoSelected = selectedIndustry && filters.industries.includes(industry)

                      return (

                        <Badge key={industry} variant="secondary" className={`${

                          isAutoSelected 

                            ? "bg-blue-200 text-blue-900 dark:bg-blue-700 dark:text-blue-100" 

                            : "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200"

                        }`}>

                          Industry: {industry}

                          {isAutoSelected && <span className="ml-1 text-xs">(auto)</span>}

                          <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => handleIndustryToggle(industry)} />

                        </Badge>

                      )

                    })}

                  {filters.companyTypes.map((type) => {

                    const isAutoSelected = selectedIndustry && filters.companyTypes.includes(type)

                    return (

                      <Badge key={type} variant="secondary" className={`${

                        isAutoSelected 

                          ? "bg-blue-200 text-blue-900 dark:bg-blue-700 dark:text-blue-100" 

                          : "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200"

                      }`}>

                        Type: {type}

                        {isAutoSelected && <span className="ml-1 text-xs">(auto)</span>}

                        <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => handleCompanyTypeToggle(type)} />

                      </Badge>

                    )

                  })}

                  {filters.companySizes.map((size) => (

                    <Badge key={size} variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">

                      Size: {size}

                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => handleCompanySizeToggle(size)} />

                    </Badge>

                  ))}

                  {filters.locations.map((location) => (

                    <Badge key={location} variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">

                      Location: {location}

                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => handleLocationToggle(location)} />

                    </Badge>

                  ))}

                  {filters.minRating && (

                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">

                      Rating: {filters.minRating}+

                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => handleFilterChange("minRating", "")} />

                    </Badge>

                  )}

                  {filters.salaryRange && (

                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">

                      Salary: {filters.salaryRange} LPA

                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => handleFilterChange("salaryRange", "")} />

                    </Badge>

                  )}

                </div>

              </div>

            )}



            {/* Company Grid */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

              {loadError && (

                <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">

                  {loadError}

                </div>

              )}

              {loadingCompanies && (

                <div className="space-y-4">

                  {[...Array(6)].map((_, i) => (

                    <div key={i} className="animate-pulse">

                      <Card className="border-0 bg-white/50 dark:bg-white/10 backdrop-blur-xl border-white/30 dark:border-white/10">

                        <CardContent className="p-6">

                          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>

                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-3"></div>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

                            {[...Array(4)].map((_, j) => (

                              <div key={j} className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>

                            ))}

                          </div>

                        </CardContent>

                      </Card>

                    </div>

                  ))}

                </div>

              )}

              {!loadingCompanies && currentCompanies.length === 0 ? (

                <div className="text-center py-12">

                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">

                    <Search className="w-8 h-8 text-slate-400" />

                  </div>

                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No companies found</h3>

                  <p className="text-slate-600 dark:text-slate-400 mb-4">

                    Try adjusting your filters or search terms to find more companies.

                  </p>

                  <Button onClick={clearAllFilters} variant="outline">

                    Clear All Filters

                  </Button>

                </div>

              ) : !loadingCompanies ? (

                currentCompanies.map((company, index) => {

                const industryColors = getIndustryColors(company.industry)



                return (

                  <motion.div

                    key={company.id}

                    initial={{ opacity: 0, y: 30 }}

                    animate={{ opacity: 1, y: 0 }}

                    transition={{ delay: index * 0.05, duration: 0.6 }}

                    whileHover={{ y: -5 }}

                    onHoverStart={() => setSelectedCompany(company.id)}

                    onHoverEnd={() => setSelectedCompany(null)}

                  >

                    <Card

                      className={`group cursor-pointer border-0 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative ${

                        company.urgent

                          ? "bg-gradient-to-r from-red-50/50 to-orange-50/50 dark:from-red-900/20 dark:to-orange-900/20 ring-2 ring-red-200 dark:ring-red-800"

                          : "bg-white/50 dark:bg-white/10"

                      } border-white/30 dark:border-white/10 backdrop-blur-xl`}

                    >

                        {/* Badges positioned above follow button */}

                        {(company.featured || company.urgent) && (

                          <div className="absolute top-4 right-4 z-10">

                            {company.featured && company.urgent ? (

                              // Show alternating badges when both are present

                              badgeDisplay === 'featured' ? (

                                <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs animate-pulse">

                                  <Sparkles className="w-3 h-3 mr-1" />

                                  Featured

                                </Badge>

                              ) : (

                                <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs animate-pulse">

                                  <Zap className="w-3 h-3 mr-1" />

                                  Urgent Hiring

                                </Badge>

                              )

                            ) : company.featured ? (

                            <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs">

                              <Sparkles className="w-3 h-3 mr-1" />

                              Featured

                            </Badge>

                            ) : (

                              <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs animate-bounce">

                              <Zap className="w-3 h-3 mr-1" />

                              Urgent Hiring

                            </Badge>

                          )}

                        </div>

                        )}



                        <div

                          className={`absolute inset-0 bg-gradient-to-br ${industryColors.bg} opacity-0 ${!company.urgent ? 'group-hover:opacity-10' : ''} transition-opacity duration-500`}

                        />



                        <CardContent className="p-3 sm:p-4 lg:p-5">

                          <div className="flex flex-col lg:flex-row gap-2 lg:gap-3">

                            <motion.div whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }} className="relative">

                              {/* Placeholder background image */}
                              {company.placeholderImage && (
                                <div className="absolute inset-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden opacity-20">
                                  <img 
                                    src={company.placeholderImage} 
                                    alt={`${company.name} background`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}

                              <Avatar className="w-12 h-12 sm:w-14 sm:h-14 ring-2 ring-white/50 group-hover:ring-4 transition-all duration-300 shadow-lg flex-shrink-0 mx-auto lg:mx-0 relative z-10">

                                <AvatarImage src={company.logo || "/placeholder.svg"} alt={company.name} />

                                <AvatarFallback className={`text-lg sm:text-xl font-bold ${industryColors.text}`}>

                                  {company.name[0]}

                                </AvatarFallback>

                              </Avatar>

                            </motion.div>



                            <div className="flex-1 min-w-0">

                              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-3 gap-3">

                                <div className="flex-1 min-w-0">

                                  <div className="flex items-center justify-between mb-1">
                                    <h3

                                      className={`text-lg sm:text-xl font-bold transition-colors duration-300 ${

                                        company.urgent

                                          ? "text-red-700 dark:text-red-400"

                                          : "text-slate-900 dark:text-white group-hover:text-blue-600"

                                      } line-clamp-2 flex-1`}

                                    >

                                      {company.name}

                                    </h3>
                                    <div className="flex items-center ml-2">
                                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                        {company.rating || 0}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 h-8 overflow-hidden">

                                    {company.industries && company.industries.length > 0 ? (
                                      company.industries.length === 1 ? (
                                        <Badge
                                          className={`${industryColors.badge} text-xs sm:text-sm`}
                                        >
                                          {company.industries[0]}
                                        </Badge>
                                      ) : (
                                        <Badge
                                          className={`${getMultiIndustryColors(company.industries).badge} text-xs sm:text-sm`}
                                        >
                                          Multi Industry
                                        </Badge>
                                      )
                                    ) : (
                                      <Badge
                                        className={`${industryColors.badge} text-xs sm:text-sm`}
                                      >
                                        {company.industry || 'Not specified'}
                                      </Badge>
                                    )}

                                    <Badge variant="secondary" className="text-xs">

                                      {company.companyType}

                                    </Badge>

                                    {company.urgent && (

                                      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">

                                        Hiring Now

                                      </Badge>

                                    )}

                                  </div>


                                </div>



                                <div className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-end space-y-1 sm:space-y-0 sm:space-x-2 lg:space-x-0 lg:space-y-2 flex-shrink-0">

                                  <Button

                                    variant="outline"

                                    size="sm"

                                    className={`w-full sm:w-auto backdrop-blur-sm transition-all duration-300 text-xs h-8 px-3 ${

                                      followedCompanies.has(company.id) 

                                        ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400" 

                                        : "bg-white/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-600"

                                    }`}

                                    onClick={(e) => {

                                      e.preventDefault()

                                      e.stopPropagation()

                                      handleFollowToggle(company.id)

                                    }}

                                    disabled={loadingFollow.has(company.id)}

                                  >

                                    <Heart className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 ${followedCompanies.has(company.id) ? "fill-current" : ""}`} />

                                    {loadingFollow.has(company.id) 

                                      ? "..." 

                                      : followedCompanies.has(company.id) 

                                        ? "Following" 

                                        : "Follow"

                                    }

                                  </Button>

                                  <Link href={`/companies/${company.id}`}>

                                    <Button

                                      className={`w-full sm:w-auto bg-gradient-to-r ${industryColors.bg} ${industryColors.hover} hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-xs h-8 px-3`}

                                    >

                                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />

                                      View ({company.activeJobsCount || company.openings || 0})

                                    </Button>

                                  </Link>

                                </div>

                              </div>






                              <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                                <div className="flex items-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                  <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">
                                    {company.activeJobsCount || company.openings || 0} open positions
                                  </span>
                                </div>
                                <div className="flex items-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">
                                    {company.region || 'India'}
                                  </span>
                                </div>
                              </div>



                              <div className="flex flex-wrap gap-1 sm:gap-2 mb-2">

                                {company.benefits.slice(0, 3).map((benefit, benefitIndex) => (

                                  <Badge

                                    key={benefitIndex}

                                    variant="secondary"

                                    className="text-xs bg-slate-100 dark:bg-slate-700"

                                  >

                                    {benefit}

                                  </Badge>

                                ))}

                                {company.benefits.length > 3 && (

                                  <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-700">

                                    +{company.benefits.length - 3} more

                                  </Badge>

                                )}

                              </div>




                            </div>

                          </div>

                        </CardContent>

                      </Card>

                  </motion.div>

                )

              }) 

            ): null}

            </div>



            {/* Pagination */}

            <div className="flex flex-col sm:flex-row justify-center items-center mt-8 sm:mt-12 gap-4">
              <div className="flex items-center space-x-2">

                <Button

                  variant="outline"

                  disabled={currentPage === 1}

                  onClick={() => handlePageChange(currentPage - 1)}

                  className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-xs sm:text-sm"

                >

                  <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />

                  Previous

                </Button>



                {/* Page Numbers */}

                <div className="flex items-center space-x-1">

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {

                    const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i

                    if (pageNum > totalPages) return null



                    return (

                      <Button

                        key={pageNum}

                        variant={currentPage === pageNum ? "default" : "outline"}

                        size="sm"

                          onClick={() => handlePageChange(pageNum)}

                        className={

                          currentPage === pageNum

                            ? "bg-blue-600 text-white text-xs sm:text-sm"

                            : "bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-xs sm:text-sm"

                        }

                      >

                        {pageNum}

                      </Button>

                    )

                  })}



                  {totalPages > 5 && currentPage < totalPages - 2 && (

                    <>

                      <span className="text-slate-400">...</span>

                      <Button

                        variant="outline"

                        size="sm"

                        onClick={() => handlePageChange(totalPages)}

                        className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-xs sm:text-sm"

                      >

                        {totalPages}

                      </Button>

                    </>

                  )}

                </div>



                <Button

                  variant="outline"

                  disabled={currentPage === totalPages}

                  onClick={() => handlePageChange(currentPage + 1)}

                  className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-xs sm:text-sm"

                >

                  Next

                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />

                </Button>

              </div>

            </div>

          </div>

        </div>

      </div>

      </div>



      {/* Footer */}

      <footer className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl text-white py-3 sm:py-4 px-4 sm:px-6 lg:px-8 border-t border-slate-800 mt-6 sm:mt-8">

        <div className="max-w-7xl mx-auto">

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">

            <div className="col-span-1 sm:col-span-2 md:col-span-1">

              <div className="flex items-center space-x-2 mb-4 sm:mb-6">

                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">

                  <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-white" />

                </div>

                <span className="text-xl sm:text-2xl font-bold">JobPortal</span>

              </div>

              <p className="text-slate-400 mb-4 sm:mb-6 text-sm sm:text-base">

                India's leading job portal connecting talent with opportunities.

              </p>

              <div className="flex space-x-4">

                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">

                  <span className="text-xs sm:text-sm">f</span>

                </div>

                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">

                  <span className="text-xs sm:text-sm">t</span>

                </div>

                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">

                  <span className="text-xs sm:text-sm">in</span>

                </div>

              </div>

            </div>



            {[

              {

                title: "For Job Seekers",

                links: [

                  { name: "Browse Jobs", href: "/jobs" },
                  { name: "Gulf Opportunities", href: "/gulf-opportunities" },
                  { name: "Career Advice", href: "/career-advice" },
                  { name: "Resume Builder", href: "/resume-builder" },
                  { name: "Salary Guide", href: "/salary-guide" },
                  { name: "Job at Pace Premium", href: "/job-at-pace" },
                ],
              },
              {
                title: "For Employers",
                links: [
                  { name: "Post Jobs", href: "/employer-dashboard/post-job" },
                  { name: "Search Resumes", href: "/employer-dashboard/requirements" },
                  { name: "Recruitment Solutions", href: "/naukri-talent-cloud" },
                  { name: "Pricing", href: "/pricing" },
                ],
              },
              {
                title: "Company",
                links: [
                  { name: "About Us", href: "/about" },
                  { name: "Contact", href: "/contact" },
                  { name: "Privacy Policy", href: "/privacy" },
                  { name: "Terms of Service", href: "/terms" },
                ],
              },
            ].map((section, index) => (
              <div key={index}>
                <h3 className="font-semibold mb-4 sm:mb-6 text-base sm:text-lg">{section.title}</h3>
                <ul className="space-y-2 sm:space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link
                        href={link.href}
                        className="text-slate-400 hover:text-white transition-colors hover:underline text-sm sm:text-base"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          </div>

          <div className="border-t border-slate-800 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-slate-400">
            <p className="text-sm sm:text-base">&copy; 2025 JobPortal. All rights reserved. Made with ❤️ in India</p>
          </div>

        </div>

      </footer>

      {showIndustryDropdown && (
        <IndustryDropdown
          selectedIndustries={filters.industries}
          onIndustryChange={(inds: string[]) => {
            setFilters(prev => ({ ...prev, industries: inds }))
            // Clear top industry selection when manually changing filters from IndustryDropdown
            if (selectedIndustry) {
              setSelectedIndustry(null)
            }
            setCurrentPage(1)
          }}
          onClose={() => setShowIndustryDropdown(false)}
        />
      )}

    </div>
  )
}