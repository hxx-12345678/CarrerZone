"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Building2, Briefcase, ChevronDown, Menu, Search, MapPin, Users, TrendingUp, Moon, Sun, User, LogOut, Settings, Bell, Bookmark, FileText, Zap, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { motion } from "framer-motion"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Handle navbar filter clicks with programmatic navigation
  const handleFilterClick = (filterUrl: string) => {
    router.push(filterUrl)
  }

  const getEmployerServices = (userRegion: string) => [
    { name: "Post a Job", href: userRegion === 'gulf' ? "/gulf-dashboard/post-job" : "/employer-dashboard/post-job" },
    { name: "Browse Candidates", href: userRegion === 'gulf' ? "/gulf-dashboard/applications" : "/employer-dashboard/candidates" },
    { name: "Company Dashboard", href: userRegion === 'gulf' ? "/gulf-dashboard" : "/employer-dashboard" },
    { name: "Analytics", href: userRegion === 'gulf' ? "/gulf-dashboard/analytics" : "/employer-dashboard/analytics" }
  ]

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`${isScrolled ? "bg-white/80 dark:bg-slate-900/80 shadow-[0_2px_20px_rgba(0,0,0,0.05)] h-16" : "bg-transparent h-20"} w-full fixed top-0 left-0 z-50 backdrop-blur-xl border-b border-white/50 dark:border-slate-700/60 transition-all duration-300`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#5A00F2] to-[#4F9BFF] flex items-center justify-center shadow-[0_8px_24px_rgba(90,0,242,0.25)]">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="serif-heading text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">JobPortal</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-6">
            {/* Jobs Dropdown */}
            <div className="relative group">
              <Button 
                variant="ghost" 
                className="relative text-gray-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-blue-400 hover:bg-purple-100/80 dark:hover:bg-purple-900/30 transition-colors duration-200 tracking-wider uppercase text-[12px] px-4 py-2 after:absolute after:left-4 after:right-4 after:-bottom-1 after:h-[2px] after:scale-x-0 hover:after:scale-x-100 after:origin-left after:transition-transform after:bg-gradient-to-r after:from-[#5A00F2] after:to-[#4F9BFF]"
                onClick={() => window.location.href = '/jobs'}
              >
                Jobs
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
              
              {/* Jobs Dropdown Menu */}
              <div className="absolute left-0 mt-2 w-full max-w-[95vw] sm:w-96 lg:w-[600px] xl:w-[700px] bg-purple-50/95 dark:bg-purple-900/80 backdrop-blur-md rounded-lg shadow-xl border border-purple-200/50 dark:border-purple-700/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                <div className="p-3 sm:p-4 lg:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    {/* Popular Categories */}
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm">Popular categories</h4>
                      <div className="space-y-3">
                        <button onClick={() => {
                          const params = new URLSearchParams()
                          params.set('industries', 'IT Services & Consulting,Software Product,Internet,Electronics Manufacturing,Electronic Components,Hardware & Networking,Emerging Technology')
                          params.set('departments', 'Engineering - Software & QA,IT & Information Security,Data Science & Analytics,Quality Assurance,Product Management,Project & Program Management,UX, Design & Architecture')
                          params.set('roleCategories', 'Software Development,IT & Information Security,IT Consulting,IT Network,IT Support,IT Infrastructure Services,IT Security,DevOps,Technology / IT,Engineering - Software & QA,Quality Assurance and Testing,Data Science & Machine Learning,Product Management,Project & Program Management,UX, Design & Architecture')
                          handleFilterClick(`/jobs?${params.toString()}`)
                        }} className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-purple-100/60 dark:hover:bg-purple-800/40 transition-colors duration-200 text-left w-full px-2 py-1 rounded">IT jobs</button>
                        <button onClick={() => {
                          const params = new URLSearchParams()
                          params.set('industries', 'Retail,FMCG / Foods / Beverage,Consumer Electronics,Real Estate,Travel / Tourism,Hotels / Restaurants,Automobile,Auto Components,Banking / Lending,Insurance,FinTech')
                          params.set('departments', 'Sales & Business Development,Customer Success Service & Operations,Marketing & Communication,Merchandising Retail & eCommerce')
                          params.set('roleCategories', 'Sales & Business Development,Retail & B2C Sales,BD / Pre Sales,Enterprise & B2B Sales,Sales Support & Operations,After Sales Service & Repair,Customer Success, Service,Customer Success')
                          handleFilterClick(`/jobs?${params.toString()}`)
                        }} className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-purple-100/60 dark:hover:bg-purple-800/40 transition-colors duration-200 text-left w-full px-2 py-1 rounded">Sales jobs</button>
                        <button onClick={() => {
                          const params = new URLSearchParams()
                          params.set('industries', 'Media / Entertainment / Broadcasting,Advertising / Marketing / PR,Gaming,Publishing,E-commerce / Internet,Online Services,Marketplace,Internet,Telecom / ISP')
                          params.set('departments', 'Marketing & Communication,Content Editorial & Journalism,UX Design & Architecture,Product Management')
                          params.set('roleCategories', 'Marketing & Communication,Marketing,Digital Marketing,Marketing and Communications,Recruitment Marketing & Branding,Content, Editorial & Journalism,Media Production & Entertainment,UX, Design & Architecture')
                          handleFilterClick(`/jobs?${params.toString()}`)
                        }} className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-purple-100/60 dark:hover:bg-purple-800/40 transition-colors duration-200 text-left w-full px-2 py-1 rounded">Marketing jobs</button>
                        <button onClick={() => {
                          const params = new URLSearchParams()
                          params.set('industries', 'IT Services & Consulting,Software Product,Internet,Medical Services,Pharmaceutical & Life Sciences,Biotechnology,Clinical Research,Market Research,Market Research / Business Intelligence')
                          params.set('departments', 'Data Science & Analytics,IT & Information Security,Healthcare & Life Sciences,Research & Development')
                          params.set('roleCategories', 'Data Science & Analytics,Data Science & Machine Learning,DBA / Data warehousing,IT & Information Security,Healthcare & Life Sciences,Research & Development,IT Consulting')
                          handleFilterClick(`/jobs?${params.toString()}`)
                        }} className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-purple-100/60 dark:hover:bg-purple-800/40 transition-colors duration-200 text-left w-full px-2 py-1 rounded">Data Science jobs</button>
                        <button onClick={() => {
                          const params = new URLSearchParams()
                          params.set('industries', 'Education / Training,E-Learning / EdTech,Medical Services,Recruitment / Staffing,Consulting,Legal Services,Market Research,NGO / Social Services')
                          params.set('departments', 'Human Resources,Teaching & Training,Administration & Facilities')
                          params.set('roleCategories', 'Human Resources,Human Resources - Other,Recruitment & Talent Acquisition,Teaching & Training,Administration & Facilities,Consulting,Legal & Regulatory')
                          handleFilterClick(`/jobs?${params.toString()}`)
                        }} className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-purple-100/60 dark:hover:bg-purple-800/40 transition-colors duration-200 text-left w-full px-2 py-1 rounded">HR jobs</button>
                        <button onClick={() => {
                          const params = new URLSearchParams()
                          params.set('industries', 'Industrial Equipment,Auto Components,Chemicals,Building Material,Automobile,Electrical Equipment,Industrial Automation,Iron & Steel,Construction / Infrastructure,Real Estate,Electronics Manufacturing,Electronic Components,Hardware & Networking,Power / Energy,Oil & Gas,Renewable Energy')
                          params.set('departments', 'Engineering - Software & QA,Engineering - Hardware & Networks,Production Manufacturing & Maintenance,Construction & Site Engineering,Quality Assurance,Project & Program Management')
                          params.set('roleCategories', 'Engineering - Software & QA,Engineering - Hardware & Networks,Construction & Site Engineering,Engineering,Construction Engineering,Engineering & Manufacturing,Aviation Engineering,Shipping Engineering & Technology,Production, Manufacturing & Maintenance,Quality Assurance and Testing,Project & Program Management,IT & Information Security,IT Consulting')
                          handleFilterClick(`/jobs?${params.toString()}`)
                        }} className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-purple-100/60 dark:hover:bg-purple-800/40 transition-colors duration-200 text-left w-full px-2 py-1 rounded">Engineering jobs</button>
                      </div>
                    </div>

                    {/* Jobs in demand */}
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm">Jobs in demand</h4>
                      <div className="space-y-3">
                         <button onClick={() => {
                           const params = new URLSearchParams()
                           params.set('experienceLevels', '0-1')
                           handleFilterClick(`/jobs?${params.toString()}`)
                         }} className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 text-left w-full">Fresher jobs</button>
                        <button onClick={() => {
                          const params = new URLSearchParams()
                          params.set('companyType', 'mnc')
                          handleFilterClick(`/jobs?${params.toString()}`)
                        }} className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 text-left w-full">MNC jobs</button>
                        <button onClick={() => {
                          const params = new URLSearchParams()
                          params.set('workMode', 'remote')
                          handleFilterClick(`/jobs?${params.toString()}`)
                        }} className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 text-left w-full">Remote jobs</button>
                        <button onClick={() => {
                          const params = new URLSearchParams()
                          params.set('workMode', 'work-from-home')
                          handleFilterClick(`/jobs?${params.toString()}`)
                        }} className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 text-left w-full">Work from home jobs</button>
                        <button onClick={() => {
                          const params = new URLSearchParams()
                          params.set('jobTypes', 'walk-in')
                          handleFilterClick(`/jobs?${params.toString()}`)
                        }} className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 text-left w-full">Walk-in jobs</button>
                        <button onClick={() => {
                          const params = new URLSearchParams()
                          params.set('jobTypes', 'part-time')
                          handleFilterClick(`/jobs?${params.toString()}`)
                        }} className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 text-left w-full">Part-time jobs</button>
                      </div>
                    </div>

                    {/* Jobs by location */}
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm">Jobs by location</h4>
                      <div className="space-y-3">
                        <button onClick={() => {
                          const params = new URLSearchParams()
                          params.set('location', 'Delhi')
                          handleFilterClick(`/jobs?${params.toString()}`)
                        }} className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 text-left w-full">Jobs in Delhi</button>
                        <button onClick={() => {
                          const params = new URLSearchParams()
                          params.set('location', 'Mumbai')
                          handleFilterClick(`/jobs?${params.toString()}`)
                        }} className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 text-left w-full">Jobs in Mumbai</button>
                        <button onClick={() => {
                          const params = new URLSearchParams()
                          params.set('location', 'Bangalore')
                          handleFilterClick(`/jobs?${params.toString()}`)
                        }} className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 text-left w-full">Jobs in Bangalore</button>
                        <button onClick={() => {
                          const params = new URLSearchParams()
                          params.set('location', 'Hyderabad')
                          handleFilterClick(`/jobs?${params.toString()}`)
                        }} className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 text-left w-full">Jobs in Hyderabad</button>
                        <button onClick={() => {
                          const params = new URLSearchParams()
                          params.set('location', 'Chennai')
                          handleFilterClick(`/jobs?${params.toString()}`)
                        }} className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 text-left w-full">Jobs in Chennai</button>
                        <button onClick={() => {
                          const params = new URLSearchParams()
                          params.set('location', 'Pune')
                          handleFilterClick(`/jobs?${params.toString()}`)
                        }} className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 text-left w-full">Jobs in Pune</button>
                      </div>
                    </div>
                  </div>
                </div>
                    </div>
            </div>

            {/* Companies Dropdown */}
            <div className="relative group">
              <Button 
                variant="ghost" 
                className="relative text-gray-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-blue-400 hover:bg-purple-100/80 dark:hover:bg-purple-900/30 transition-colors duration-200 tracking-wider uppercase text-[12px] px-4 py-2 after:absolute after:left-4 after:right-4 after:-bottom-1 after:h-[2px] after:scale-x-0 hover:after:scale-x-100 after:origin-left after:transition-transform after:bg-gradient-to-r after:from-[#5A00F2] after:to-[#4F9BFF]"
                onClick={() => window.location.href = '/companies'}
              >
                Companies
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
              
              {/* Companies Dropdown Menu */}
              <div className="absolute left-0 mt-2 w-full max-w-[95vw] sm:w-96 lg:w-[500px] xl:w-[600px] bg-purple-50/95 dark:bg-purple-900/80 backdrop-blur-md rounded-lg shadow-xl border border-purple-200/50 dark:border-purple-700/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                <div className="p-3 sm:p-4 lg:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                    {/* Explore Categories */}
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm">Explore categories</h4>
                      <div className="space-y-3">
                        <button 
                          onClick={() => {
                            const params = new URLSearchParams()
                            params.set('companyType', 'unicorn')
                            window.location.href = `/companies?${params.toString()}`
                          }}
                          className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-purple-100/60 dark:hover:bg-purple-800/40 transition-colors duration-200 text-left w-full px-2 py-1 rounded"
                        >
                          Unicorn
                        </button>
                        <button 
                          onClick={() => {
                            const params = new URLSearchParams()
                            params.set('companyType', 'mnc')
                            window.location.href = `/companies?${params.toString()}`
                          }}
                          className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-purple-100/60 dark:hover:bg-purple-800/40 transition-colors duration-200 text-left w-full px-2 py-1 rounded"
                        >
                          MNC
                        </button>
                        <button 
                          onClick={() => {
                            const params = new URLSearchParams()
                            params.set('companyType', 'startup')
                            window.location.href = `/companies?${params.toString()}`
                          }}
                          className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-purple-100/60 dark:hover:bg-purple-800/40 transition-colors duration-200 text-left w-full px-2 py-1 rounded"
                        >
                          Startup
                        </button>
                        <button 
                          onClick={() => {
                            const params = new URLSearchParams()
                            params.set('companyType', 'product-based')
                            window.location.href = `/companies?${params.toString()}`
                          }}
                          className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-purple-100/60 dark:hover:bg-purple-800/40 transition-colors duration-200 text-left w-full px-2 py-1 rounded"
                        >
                          Product based
                        </button>
                        <button 
                          onClick={() => {
                            const params = new URLSearchParams()
                            params.set('industry', 'Internet')
                            window.location.href = `/companies?${params.toString()}`
                          }}
                          className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-purple-100/60 dark:hover:bg-purple-800/40 transition-colors duration-200 text-left w-full px-2 py-1 rounded"
                        >
                          Internet
                        </button>
                      </div>
                    </div>

                    {/* Explore Collections */}
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm">Explore collections</h4>
                      <div className="space-y-3">
                        <button 
                          onClick={() => {
                            const params = new URLSearchParams()
                            params.set('featured', 'true')
                            window.location.href = `/companies?${params.toString()}`
                          }}
                          className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-purple-100/60 dark:hover:bg-purple-800/40 transition-colors duration-200 text-left w-full px-2 py-1 rounded"
                        >
                          Top companies
                        </button>
                        <button 
                          onClick={() => {
                            const params = new URLSearchParams()
                            params.set('industry', 'IT Services & Consulting')
                            window.location.href = `/companies?${params.toString()}`
                          }}
                          className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-purple-100/60 dark:hover:bg-purple-800/40 transition-colors duration-200 text-left w-full px-2 py-1 rounded"
                        >
                          IT companies
                        </button>
                        <button 
                          onClick={() => {
                            const params = new URLSearchParams()
                            params.set('industry', 'FinTech')
                            window.location.href = `/companies?${params.toString()}`
                          }}
                          className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-purple-100/60 dark:hover:bg-purple-800/40 transition-colors duration-200 text-left w-full px-2 py-1 rounded"
                        >
                          Fintech companies
                        </button>
                        <button 
                          onClick={() => {
                            const params = new URLSearchParams()
                            params.set('companyType', 'sponsored')
                            window.location.href = `/companies?${params.toString()}`
                          }}
                          className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-purple-100/60 dark:hover:bg-purple-800/40 transition-colors duration-200 text-left w-full px-2 py-1 rounded"
                        >
                          Sponsored companies
                        </button>
                        <button 
                          onClick={() => {
                            const params = new URLSearchParams()
                            params.set('featured', 'true')
                            window.location.href = `/companies?${params.toString()}`
                          }}
                          className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-purple-100/60 dark:hover:bg-purple-800/40 transition-colors duration-200 text-left w-full px-2 py-1 rounded"
                        >
                          Featured companies
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                    </div>
            </div>

            {/* Tools Dropdown */}
            <div className="relative group">
              <Button variant="ghost" className="text-slate-700 dark:text-slate-300 hover:bg-purple-100/80 dark:hover:bg-purple-900/30 transition-colors duration-200">
                Tools
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
              <div className="absolute right-0 mt-2 w-48 bg-purple-50/95 dark:bg-purple-900/80 backdrop-blur-md rounded-lg shadow-lg border border-purple-200/50 dark:border-purple-700/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="py-2">
                  <Link
                    href="/salary-calculator"
                    className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-purple-100/60 dark:hover:bg-purple-800/40 transition-colors duration-200 rounded mx-1"
                  >
                    Salary Calculator
                  </Link>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 dark:text-blue-400 w-4 h-4 font-bold drop-shadow-sm" />
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    className="w-64 pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const searchTerm = (e.target as HTMLInputElement).value.trim()
                        if (searchTerm) {
                          router.push(`/jobs?search=${encodeURIComponent(searchTerm)}`)
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || "/placeholder-user.jpg"} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback>{user.firstName?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={user?.userType === 'employer' ? (user?.region === 'gulf' ? '/gulf-dashboard' : '/employer-dashboard') : (user?.region === 'gulf' ? '/jobseeker-gulf-dashboard' : '/dashboard')} className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={user?.userType === 'employer' ? (user?.region === 'gulf' ? '/gulf-dashboard/applications' : '/employer-dashboard/applications') : '/applications'} className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      Applications
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bookmarks" className="flex items-center">
                      <Bookmark className="mr-2 h-4 w-4" />
                      Bookmarks
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-gray-700 dark:text-slate-300 tracking-wider uppercase text-[12px]">
                    Sign In
                  </Button>
                </Link>
                {/* For Employers dropdown */}
                <div className="relative group">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="relative text-gray-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-blue-400 hover:bg-purple-100/80 dark:hover:bg-purple-900/30 transition-colors duration-200 tracking-wider uppercase text-[12px] px-4 py-2 after:absolute after:left-2 after:right-2 after:-bottom-1 after:h-[2px] after:scale-x-0 hover:after:scale-x-100 after:origin-left after:transition-transform after:bg-gradient-to-r after:from-[#5A00F2] after:to-[#4F9BFF]"
                  >
                    For Employers
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                  <div className="absolute right-0 mt-2 w-56 bg-purple-50/95 dark:bg-purple-900/80 backdrop-blur-md rounded-lg shadow-lg border border-purple-200/50 dark:border-purple-700/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      <Link
                        href="/pricing"
                        className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-purple-100/60 dark:hover:bg-purple-800/40 transition-colors duration-200 rounded mx-1"
                      >
                        Pricing
                      </Link>
                      <Link
                        href="/hyrebridge-solutions"
                        className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-purple-100/60 dark:hover:bg-purple-800/40 transition-colors duration-200 rounded mx-1"
                      >
                        HyreBridge Solutions
                      </Link>
                      <Link
                        href="/employer-login"
                        className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-purple-100/60 dark:hover:bg-purple-800/40 transition-colors duration-200 rounded mx-1"
                      >
                        Employer Login
                      </Link>
                    </div>
                  </div>
                </div>
                <Link href="/register">
                  <Button size="sm" className="rounded-full px-5 py-2.5 bg-gradient-to-r from-[#5A00F2] to-[#4F9BFF] text-white font-semibold tracking-widest uppercase text-[11px] shadow-[0_0_15px_rgba(79,155,255,0.4)] hover:scale-[1.05] transition-transform">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden rounded-full bg-white/40 backdrop-blur-md">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 sm:w-96 max-h-screen overflow-y-auto">
              <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
              <div className="flex flex-col space-y-6 mt-6 pb-6">
                {/* Mobile Jobs Button */}
                <div>
                  <Link href="/jobs" className="text-2xl serif-heading text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 block">
                    Jobs
                  </Link>
                </div>

                {/* Mobile Companies Button */}
                <div>
                  <Link href="/companies" className="text-2xl serif-heading text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 block">
                    Companies
                  </Link>
                </div>

                {/* Mobile Tools - Salary Calculator */}
                <div>
                  <Link href="/salary-calculator" className="text-2xl serif-heading text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                    Salary Calculator
                  </Link>
                </div>
                
                {/* Mobile User Menu */}
                {user ? (
                  <div className="border-t pt-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar || "/placeholder-user.jpg"} alt={`${user.firstName} ${user.lastName}`} />
                        <AvatarFallback>{user.firstName?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Link href="/profile" className="block text-sm text-slate-700 dark:text-slate-300">
                        Profile
                      </Link>
                      <Link href={user?.userType === 'employer' ? (user?.region === 'gulf' ? '/gulf-dashboard' : '/employer-dashboard') : (user?.region === 'gulf' ? '/jobseeker-gulf-dashboard' : '/dashboard')} className="block text-sm text-slate-700 dark:text-slate-300">
                        Dashboard
                      </Link>
                      <Link href={user?.userType === 'employer' ? (user?.region === 'gulf' ? '/gulf-dashboard/applications' : '/employer-dashboard/applications') : '/applications'} className="block text-sm text-slate-700 dark:text-slate-300">
                        Applications
                      </Link>
                      <Link href="/bookmarks" className="block text-sm text-slate-700 dark:text-slate-300">
                        Bookmarks
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block text-sm text-red-600 hover:text-red-700"
                      >
                        Log out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t pt-6 space-y-3">
                    <Link href="/login">
                      <Button variant="outline" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/employer-login">
                      <Button variant="outline" className="w-full">
                        For Employers
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button className="w-full rounded-full px-5 py-2.5 bg-gradient-to-r from-[#5A00F2] to-[#4F9BFF] text-white font-semibold tracking-widest uppercase text-[11px] shadow-[0_0_15px_rgba(79,155,255,0.4)]">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  )
}
