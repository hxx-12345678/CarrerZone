"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, MapPin, Briefcase, Search, Loader2, Globe, Star, Eye, Filter, X, ChevronLeft, ChevronRight, Sparkles, Zap } from "lucide-react"
import GulfNavbar from "@/components/gulf-navbar"
import { EmployerFooter } from "@/components/employer-footer"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import IndustryDropdown from "@/components/ui/industry-dropdown"
import { apiService } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

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

// Industry-specific color schemes for Gulf theme
const getIndustryColors = (industry: string) => {
  const industryLower = industry.toLowerCase()
  
  // Technology & IT - Green theme
  if (industryLower.includes('technology') || industryLower.includes('software') || industryLower.includes('it services')) {
    return {
      bg: 'from-green-500 to-emerald-600',
      hover: 'hover:from-green-600 hover:to-emerald-700',
      text: 'text-green-600',
      border: 'border-green-200',
      badge: 'bg-gradient-to-r from-green-100 via-emerald-100 to-teal-100 text-green-800 border-green-200'
    }
  }
  
  // Finance - Emerald theme
  if (industryLower.includes('finance') || industryLower.includes('banking')) {
    return {
      bg: 'from-emerald-500 to-teal-600',
      hover: 'hover:from-emerald-600 hover:to-teal-700',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      badge: 'bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100 text-emerald-800 border-emerald-200'
    }
  }
  
  // Healthcare - Teal theme
  if (industryLower.includes('healthcare') || industryLower.includes('medical')) {
    return {
      bg: 'from-teal-500 to-cyan-600',
      hover: 'hover:from-teal-600 hover:to-cyan-700',
      text: 'text-teal-600',
      border: 'border-teal-200',
      badge: 'bg-gradient-to-r from-teal-100 via-cyan-100 to-blue-100 text-teal-800 border-teal-200'
    }
  }
  
  // Default - Green gradient
  return {
    bg: 'from-green-500 to-emerald-600',
    hover: 'hover:from-green-600 hover:to-emerald-700',
    text: 'text-green-600',
    border: 'border-green-200',
    badge: 'bg-gradient-to-r from-green-100 via-emerald-100 to-teal-100 text-green-800 border-green-200'
  }
}

export default function GulfCompaniesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [companies, setCompanies] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState("rating")
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)

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

  // Check if user has access to Gulf pages
  const [accessDenied, setAccessDenied] = useState(false)
  
  // All hooks must be called before any conditional returns
  const debouncedSearch = useMemo(() => {
    let t: any
    return (value: string) => {
      if (t) clearTimeout(t)
      t = setTimeout(() => {
        setPage(1)
        setSearch(value)
        setFilters(prev => ({ ...prev, search: value }))
      }, 300)
    }
  }, [])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      setError("")
      const resp = await apiService.getGulfCompanies({ page, limit: 24, search })
      if (resp.success) {
        setCompanies(resp.data?.companies || [])
        setTotalPages(resp.data?.pagination?.totalPages || 1)
      } else {
        setCompanies([])
        setError(resp.message || "Failed to load companies")
      }
    } catch (e: any) {
      setCompanies([])
      setError("Failed to load companies")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [page, search])

  // Auth check - redirect employers/admins to Gulf dashboard (after all data hooks)
  useEffect(() => {
    if (user && (user.userType === 'employer' || user.userType === 'admin')) {
      console.log('🔄 Employer/Admin detected on Gulf companies page, redirecting to Gulf dashboard')
      setIsRedirecting(true)
      router.replace('/gulf-dashboard')
      return
    }
  }, [user, router])
  
  useEffect(() => {
    if (!authLoading && user && !user.regions?.includes('gulf') && user.region !== 'gulf') {
      setAccessDenied(true)
      return
    }
    setAccessDenied(false)
  }, [user, authLoading])

  // Filter handlers
  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleIndustryToggle = (industry: string) => {
    setFilters(prev => ({
      ...prev,
      industries: prev.industries.includes(industry)
        ? prev.industries.filter(i => i !== industry)
        : [...prev.industries, industry]
    }))
    setCurrentPage(1)
  }

  const handleCompanyTypeToggle = (type: string) => {
    setFilters(prev => ({
      ...prev,
      companyTypes: prev.companyTypes.includes(type)
        ? prev.companyTypes.filter(t => t !== type)
        : [...prev.companyTypes, type]
    }))
    setCurrentPage(1)
  }

  const handleLocationToggle = (location: string) => {
    setFilters(prev => ({
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter(l => l !== location)
        : [...prev.locations, location]
    }))
    setCurrentPage(1)
  }

  const handleCompanySizeToggle = (size: string) => {
    setFilters(prev => ({
      ...prev,
      companySizes: prev.companySizes.includes(size)
        ? prev.companySizes.filter(s => s !== size)
        : [...prev.companySizes, size]
    }))
    setCurrentPage(1)
  }

  const clearAllFilters = () => {
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
    setSearch("")
    setCurrentPage(1)
  }

  // Industries list (matching /companies page)
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

  // Company types (matching /companies page)
  const companyTypes = [
    "Startup",
    "MNC",
    "Product Based",
    "Fortune 500",
    "Government",
    "Non-Profit",
    "Unicorn",
    "Sponsored"
  ]

  // Get unique values for filters (combine with hardcoded list)
  const uniqueIndustries = useMemo(() => {
    const industrySet = new Set<string>(industries)
    companies.forEach(c => {
      if (c.industry) industrySet.add(c.industry)
      if (c.industries && Array.isArray(c.industries)) {
        c.industries.forEach((ind: string) => industrySet.add(ind))
      }
    })
    return Array.from(industrySet).sort()
  }, [companies])

  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>()
    companies.forEach(c => {
      if (c.location) locations.add(c.location)
      if (c.city) locations.add(c.city)
      if (c.country) locations.add(c.country)
    })
    return Array.from(locations).sort()
  }, [companies])

  // Filter and sort companies
  const filteredAndSortedCompanies = useMemo(() => {
    let filtered = [...companies]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(c => 
        c.name?.toLowerCase().includes(searchLower) ||
        c.industry?.toLowerCase().includes(searchLower) ||
        c.location?.toLowerCase().includes(searchLower) ||
        c.description?.toLowerCase().includes(searchLower)
      )
    }

    // Industry filter
    if (filters.industries.length > 0) {
      filtered = filtered.filter(c => {
        const companyIndustries = c.industries && Array.isArray(c.industries) ? c.industries : [c.industry].filter(Boolean)
        return filters.industries.some(industry => 
          companyIndustries.some((ci: string) => ci?.toLowerCase().includes(industry.toLowerCase()))
        )
      })
    }

    // Company type filter
    if (filters.companyTypes.length > 0) {
      filtered = filtered.filter(c => {
        const companyTypes = c.companyTypes && Array.isArray(c.companyTypes) ? c.companyTypes : [c.companyType].filter(Boolean)
        return filters.companyTypes.some(type => 
          companyTypes.some((ct: string) => ct?.toLowerCase().includes(type.toLowerCase()))
        )
      })
    }

    // Location filter
    if (filters.locations.length > 0) {
      filtered = filtered.filter(c => 
        filters.locations.some(location => 
          c.location?.toLowerCase().includes(location.toLowerCase()) ||
          c.city?.toLowerCase().includes(location.toLowerCase()) ||
          c.country?.toLowerCase().includes(location.toLowerCase())
        )
      )
    }

    // Rating filter
    if (filters.minRating) {
      const minRating = parseFloat(filters.minRating)
      filtered = filtered.filter(c => (c.rating || 0) >= minRating)
    }

    // Company size filter
    if (filters.companySizes.length > 0) {
      filtered = filtered.filter(c => {
        const companySize = c.companySize || c.employees || ''
        return filters.companySizes.some(size => {
          const sizeLower = size.toLowerCase()
          const companySizeLower = companySize.toLowerCase()
          return companySizeLower.includes(sizeLower) || sizeLower.includes(companySizeLower)
        })
      })
    }

    // Salary range filter
    if (filters.salaryRange) {
      filtered = filtered.filter(c => {
        const salaryRange = c.salaryRange || ''
        if (!salaryRange) return false
        const range = filters.salaryRange
        if (range === "0-10") return salaryRange.includes("5-") || salaryRange.includes("6-") || salaryRange.includes("7-") || salaryRange.includes("8-") || salaryRange.includes("9-") || salaryRange.includes("10")
        if (range === "10-20") return salaryRange.includes("10-") || salaryRange.includes("12-") || salaryRange.includes("15-") || salaryRange.includes("18-") || salaryRange.includes("20")
        if (range === "20-30") return salaryRange.includes("20-") || salaryRange.includes("22-") || salaryRange.includes("25-") || salaryRange.includes("28-") || salaryRange.includes("30")
        if (range === "30+") return salaryRange.includes("30+") || salaryRange.includes("35") || salaryRange.includes("40")
        return false
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0)
        case "openings":
          return (b.activeJobsCount || b.activeJobs || 0) - (a.activeJobsCount || a.activeJobs || 0)
        case "name":
          return (a.name || "").localeCompare(b.name || "")
        default:
          return 0
      }
    })

    return filtered
  }, [companies, filters, sortBy])

  // Pagination
  const companiesPerPage = 20
  const startIndex = (currentPage - 1) * companiesPerPage
  const endIndex = startIndex + companiesPerPage
  const paginatedCompanies = filteredAndSortedCompanies.slice(startIndex, endIndex)
  const totalFilteredPages = Math.ceil(filteredAndSortedCompanies.length / companiesPerPage)

  // Show proper message for employer/admin users instead of redirect error
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/30 to-teal-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <GulfNavbar />
        <div className="flex items-center justify-center min-h-screen pt-20">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="mb-6">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-10 h-10 text-yellow-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Restricted</h1>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                This page is only available for job seekers. As an employer, you can manage your company and jobs from your dashboard.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => router.push('/gulf-dashboard')}
                  className="w-full bg-gradient-to-r from-yellow-500 to-green-600 hover:from-yellow-600 hover:to-green-700 text-white"
                >
                  Go to Gulf Employer Dashboard
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/gulf-dashboard/manage-jobs')}
                  className="w-full"
                >
                  Manage Your Jobs
                </Button>
              </div>
            </div>
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
                This page is only available for Gulf region users. You need to have a Gulf account to access Gulf company listings.
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
                  onClick={() => window.location.href = '/companies'}
                  className="w-full"
                >
                  Browse Regular Companies
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/30 to-teal-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <GulfNavbar />

      {/* Hero Section */}
      <div className="relative pt-20 pb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Globe className="w-4 h-4" />
              <span>Gulf Region Companies</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Discover Top Companies in the
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"> Gulf</span>
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
              Explore leading companies in the Gulf region offering exceptional career opportunities, competitive benefits, and world-class work environments.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex gap-6 sm:gap-8 items-start">
          {/* Filters Sidebar */}
          <div className={`w-full lg:w-80 ${showFilters ? "block" : "hidden lg:block"}`}>
            <div className="sticky top-24 z-10 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto">
              <Card className="border-white/30 dark:border-white/10 bg-white/50 dark:bg-white/10 backdrop-blur-xl shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <Filter className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
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

                  {/* Industry */}
                  <div>
                    <h3 className="font-semibold mb-3 text-sm sm:text-base text-slate-900 dark:text-white">
                      Industry
                    </h3>
                      <div className="space-y-2">
                      {uniqueIndustries.slice(0, 8).map((industry) => (
                          <div key={industry} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`industry-${industry}`}
                              checked={filters.industries.includes(industry)}
                              onCheckedChange={() => handleIndustryToggle(industry)}
                            />
                            <label
                              htmlFor={`industry-${industry}`}
                              className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                            >
                              {industry}
                            </label>
                          </div>
                        ))}
                      {uniqueIndustries.length > 8 && (
                        <button
                          type="button"
                          className="text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline"
                          onClick={() => setShowIndustryDropdown(true)}
                        >
                          Show more industries
                        </button>
                      )}
                      </div>
                  </div>

                  <Separator className="bg-slate-200 dark:bg-slate-700" />

                  {/* Company Types */}
                  <div>
                    <h3 className="font-semibold mb-3 text-sm sm:text-base text-slate-900 dark:text-white">
                      Company Type
                    </h3>
                    <div className="space-y-2">
                      {companyTypes.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`type-${type}`}
                            checked={filters.companyTypes.includes(type)}
                            onCheckedChange={() => handleCompanyTypeToggle(type)}
                          />
                          <label
                            htmlFor={`type-${type}`}
                            className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-slate-200 dark:bg-slate-700" />

                  {/* Company Size */}
                  <div>
                    <h3 className="font-semibold mb-3 text-sm sm:text-base text-slate-900 dark:text-white">
                      Company Size
                    </h3>
                      <div className="space-y-2">
                      {['1-50 employees', '51-200 employees', '201-1000 employees', '1001-5000 employees', '5000+ employees'].map((size) => (
                        <div key={size} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`size-${size}`}
                            checked={filters.companySizes.includes(size)}
                            onCheckedChange={() => handleCompanySizeToggle(size)}
                          />
                          <label
                            htmlFor={`size-${size}`}
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
                      {uniqueLocations.map((location) => (
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

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search and Filters Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full sm:w-auto gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    Gulf Companies
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                    {startIndex + 1}-{Math.min(endIndex, filteredAndSortedCompanies.length)} of {filteredAndSortedCompanies.length} companies
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden bg-white/70 dark:bg-slate-700/70"
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
                    <SelectItem value="name">Company Name</SelectItem>
                  </SelectContent>
                </Select>
          </div>
        </div>

            {/* Active Filters Summary */}
            {(filters.industries.length > 0 || filters.companyTypes.length > 0 || filters.companySizes.length > 0 || filters.locations.length > 0 || filters.minRating || filters.salaryRange || filters.search) && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-green-900 dark:text-green-100">Active Filters:</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.industries.map((industry) => (
                    <Badge key={industry} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                      Industry: {industry}
                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => handleIndustryToggle(industry)} />
                    </Badge>
                  ))}
                  {filters.companyTypes.map((type) => (
                    <Badge key={type} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                      Type: {type}
                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => handleCompanyTypeToggle(type)} />
                    </Badge>
                  ))}
                  {filters.locations.map((location) => (
                    <Badge key={location} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                      Location: {location}
                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => handleLocationToggle(location)} />
                    </Badge>
                  ))}
                  {filters.companySizes.map((size) => (
                    <Badge key={size} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                      Size: {size}
                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => handleCompanySizeToggle(size)} />
                    </Badge>
                  ))}
                  {filters.minRating && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                      Rating: {filters.minRating}+
                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => handleFilterChange("minRating", "")} />
                    </Badge>
                  )}
                  {filters.salaryRange && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                      Salary: {filters.salaryRange} LPA
                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => handleFilterChange("salaryRange", "")} />
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Company Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {loading ? (
                <div className="col-span-2 flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          </div>
        ) : error ? (
                <div className="col-span-2 text-center text-red-600 py-8">{error}</div>
              ) : paginatedCompanies.length === 0 ? (
                <div className="col-span-2 text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No companies found</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Try adjusting your filters or search terms to find more companies.
                  </p>
                  <Button onClick={clearAllFilters} variant="outline" className="bg-green-50 hover:bg-green-100">
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                paginatedCompanies.map((company, index) => {
                  const industryColors = getIndustryColors(company.industry || '')
                  
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
                      <Card className={`group cursor-pointer border-0 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative bg-white/50 dark:bg-white/10 border-white/30 dark:border-white/10`}>
                        {(company.featured || company.urgent) && (
                          <div className="absolute top-4 right-4 z-10">
                            {company.featured && (
                              <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                            {company.urgent && (
                              <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs animate-pulse ml-2">
                                <Zap className="w-3 h-3 mr-1" />
                                Urgent Hiring
                              </Badge>
                            )}
                    </div>
                        )}

                        <div className={`absolute inset-0 bg-gradient-to-br ${industryColors.bg} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                        <CardContent className="p-3 sm:p-4 lg:p-5">
                          <div className="flex flex-col lg:flex-row gap-2 lg:gap-3">
                            <motion.div whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }} className="relative">
                              <Avatar className="w-12 h-12 sm:w-14 sm:h-14 ring-2 ring-white/50 group-hover:ring-4 transition-all duration-300 shadow-lg flex-shrink-0 mx-auto lg:mx-0 relative z-10">
                                <AvatarImage src={company.logo || "/placeholder.svg"} alt={company.name} />
                                <AvatarFallback className={`text-lg sm:text-xl font-bold ${industryColors.text}`}>
                                  {company.name?.[0] || 'G'}
                                </AvatarFallback>
                              </Avatar>
                            </motion.div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-3 gap-3">
                    <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-lg sm:text-xl font-bold transition-colors duration-300 text-slate-900 dark:text-white group-hover:text-green-600 line-clamp-2 flex-1">
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
                                    {company.industry && (
                                      <Badge className={`${industryColors.badge} text-xs sm:text-sm`}>
                                        {company.industry}
                                      </Badge>
                                    )}
                                    {company.companyType && (
                                      <Badge variant="secondary" className="text-xs">
                                        {company.companyType}
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-end space-y-1 sm:space-y-0 sm:space-x-2 lg:space-x-0 lg:space-y-2 flex-shrink-0">
                                  <Link href={`/gulf-companies/${company.id}`}>
                                    <Button className={`w-full sm:w-auto bg-gradient-to-r ${industryColors.bg} ${industryColors.hover} hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-xs h-8 px-3`}>
                                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                      View ({company.activeJobsCount || company.activeJobs || 0})
                                    </Button>
                        </Link>
                                </div>
                      </div>

                              <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                                <div className="flex items-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                  <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">
                                    {company.activeJobsCount || company.activeJobs || 0} open positions
                          </span>
                                </div>
                                <div className="flex items-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">
                                    {company.location || company.city || company.country || 'Gulf Region'}
                        </span>
                      </div>
                              </div>

                              {company.description && (
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                  {company.description}
                                </p>
                              )}
                    </div>
                  </div>
                </CardContent>
              </Card>
                    </motion.div>
                  )
                })
              )}
          </div>

        {/* Pagination */}
            {totalFilteredPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center mt-8 sm:mt-12 gap-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-xs sm:text-sm"
                  >
                    <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalFilteredPages) }, (_, i) => {
                      const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i
                      if (pageNum > totalFilteredPages) return null

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={
                            currentPage === pageNum
                              ? "bg-green-600 text-white text-xs sm:text-sm"
                              : "bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-xs sm:text-sm"
                          }
                        >
                          {pageNum}
                        </Button>
                      )
                    })}

                    {totalFilteredPages > 5 && currentPage < totalFilteredPages - 2 && (
                      <>
                        <span className="text-slate-400">...</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalFilteredPages)}
                          className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-xs sm:text-sm"
                        >
                          {totalFilteredPages}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    disabled={currentPage === totalFilteredPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalFilteredPages, prev + 1))}
                    className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-xs sm:text-sm"
                  >
                    Next
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                  </Button>
                </div>
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-600/5 via-emerald-600/5 to-teal-600/5"></div>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Gulf Companies</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Discover leading companies in the Gulf region. Connect with top employers and explore exceptional career opportunities.
              </p>
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

      {showIndustryDropdown && (
        <IndustryDropdown
          selectedIndustries={filters.industries}
          onIndustryChange={(inds: string[]) => {
            setFilters(prev => ({ ...prev, industries: inds }))
            setCurrentPage(1)
          }}
          onClose={() => setShowIndustryDropdown(false)}
        />
      )}
    </div>
  )
}
