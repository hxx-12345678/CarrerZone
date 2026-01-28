"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Building2, ChevronDown, Menu, Plus, BarChart3, Users, Briefcase, Database, FileText, Moon, Sun, User, LogOut, Bell, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/useAuth"
import { apiService } from "@/lib/api"

export function EmployerNavbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showJobsDropdown, setShowJobsDropdown] = useState(false)
  const [showDatabaseDropdown, setShowDatabaseDropdown] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const { user, logout, refreshUser } = useAuth()
  const [company, setCompany] = useState<any>(null)
  const isAdmin = (user?.userType === 'admin') || (user?.preferences?.employerRole === 'admin')
  

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Refresh user data if designation is missing
  useEffect(() => {
    if (mounted && user && !user.designation && (user.userType === 'employer' || user.userType === 'admin')) {
      console.log('🔄 Refreshing user data to get designation...')
      refreshUser()
    }
  }, [mounted, user, refreshUser])

  // Get company data if user is an employer
  useEffect(() => {
    const fetchCompanyData = async () => {
      if ((user?.userType === 'employer' || user?.userType === 'admin') && user?.companyId) {
        try {
          const response = await apiService.getCompany(user.companyId)
          if (response.success && response.data) {
            setCompany(response.data)
          }
        } catch (error) {
          console.error('Failed to fetch company data:', error)
        }
      }
    }

    fetchCompanyData()
  }, [user])

  if (!mounted) {
    return null
  }

  // Use real user data or fallback to mock data
  const userData = {
    firstName: user?.firstName || "Employer",
    lastName: user?.lastName || "User",
    email: user?.email || "employer@company.com",
    avatar: user?.avatar || "/placeholder-user.jpg",
    company: company?.name || "Your Company",
    designation: user?.designation || "HR Manager"
  }

  // Debug logging
  console.log('🔍 Employer Navbar - User data:', {
    userDesignation: user?.designation,
    userType: user?.userType,
    companyName: company?.name,
    finalDesignation: userData.designation
  })

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const getJobsMenuItems = (userRegion: string) => [
    {
      name: "Post a Free Job",
      href: userRegion === 'gulf' ? "/gulf-dashboard/post-job" : "/employer-dashboard/post-job",
      icon: Plus,
      description: "Post your job for free and reach thousands of candidates",
    },
    {
      name: "Job Drafts",
      href: userRegion === 'gulf' ? "/gulf-dashboard/drafts" : "/employer-dashboard/drafts",
      icon: FileText,
      description: "View and manage your unpublished job drafts",
    },
    {
      name: "Hot Vacancies",
      href: userRegion === 'gulf' ? "/gulf-dashboard/hot-vacancies" : "/employer-dashboard/hot-vacancies",
      icon: Briefcase,
      description: "Premium urgent hiring solutions for immediate recruitment",
    },
    {
      name: "Post an Internship",
      href: userRegion === 'gulf' ? "/gulf-dashboard/post-internship" : "/employer-dashboard/post-internship",
      icon: Users,
      description: "Find talented interns for your organization",
    },
    {
      name: "Manage Jobs and Responses",
      href: userRegion === 'gulf' ? "/gulf-dashboard/manage-jobs" : "/employer-dashboard/manage-jobs",
      icon: BarChart3,
      description: "Track and manage all your job postings",
    },
  ]

  const getDatabaseMenuItems = (userRegion: string) => [
    {
      name: "Create New Requirement",
      href: userRegion === 'gulf' ? "/gulf-dashboard/create-requirement" : "/employer-dashboard/create-requirement",
      icon: Plus,
      description: "Define your hiring requirements and find candidates",
    },
    {
      name: "Manage Requirements",
      href: userRegion === 'gulf' ? "/gulf-dashboard/requirements" : "/employer-dashboard/requirements",
      icon: FileText,
      description: "View and manage all your hiring requirements",
    },
  ]

  return (
    <nav className="bg-gradient-to-r from-emerald-200/60 via-lime-200/50 to-yellow-200/60 dark:from-gray-900/80 dark:via-gray-800/70 dark:to-gray-900/80 backdrop-blur-xl border-b border-white/30 dark:border-gray-700/50 fixed top-0 left-0 right-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={user?.region === 'gulf' ? '/gulf-dashboard' : '/employer-dashboard'} className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-lime-600 rounded-xl flex items-center justify-center shadow-sm">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-serif font-bold bg-gradient-to-r from-emerald-600 to-lime-600 bg-clip-text text-transparent tracking-tight">
              JobPortal
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Jobs & Responses Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setShowJobsDropdown(true)}
              onMouseLeave={() => setShowJobsDropdown(false)}
            >
              <button className="flex items-center space-x-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                <span>Jobs & Responses</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showJobsDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 mt-2 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200/50 dark:border-gray-700/50 p-6"
                  >
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Jobs & Responses</h3>
                      <p className="text-sm text-slate-600 dark:text-gray-300">Manage your job postings and candidate responses</p>
                    </div>
                    <div className="space-y-2">
                      {getJobsMenuItems(user?.region || 'india').map((item, index) => (
                        <Link
                          key={index}
                          href={item.href}
                          className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50/80 dark:hover:bg-gray-700/80 transition-colors group"
                        >
                          <div className="w-10 h-10 bg-blue-100/80 dark:bg-blue-900/80 rounded-lg flex items-center justify-center group-hover:bg-blue-200/80 dark:group-hover:bg-blue-800/80 transition-colors">
                            <item.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 dark:text-white text-sm">{item.name}</div>
                            <div className="text-xs text-slate-500 dark:text-gray-300 mt-1">{item.description}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Database Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setShowDatabaseDropdown(true)}
              onMouseLeave={() => setShowDatabaseDropdown(false)}
            >
              <button className="flex items-center space-x-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                <Database className="w-4 h-4" />
                <span>Database</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showDatabaseDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 mt-2 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200/50 dark:border-gray-700/50 p-6"
                  >
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Candidate Database</h3>
                      <p className="text-sm text-slate-600 dark:text-gray-300">Search and manage candidate requirements</p>
                    </div>
                    <div className="space-y-2">
                      {getDatabaseMenuItems(user?.region || 'india').map((item, index) => (
                        <Link
                          key={index}
                          href={item.href}
                          className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50/80 dark:hover:bg-gray-700/80 transition-colors group"
                        >
                          <div className="w-10 h-10 bg-green-100/80 dark:bg-green-900/80 rounded-lg flex items-center justify-center group-hover:bg-green-200/80 dark:group-hover:bg-green-800/80 transition-colors">
                            <item.icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 dark:text-white text-sm">{item.name}</div>
                            <div className="text-xs text-slate-500 dark:text-gray-300 mt-1">{item.description}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Dark Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            <Link href="/naukri-talent-cloud">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold">
                <span className="hidden sm:inline">Talent</span>
                <span>Pulse</span>
              </Button>
            </Link>
            
            {/* User Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userData.avatar} alt={`${userData.firstName} ${userData.lastName}`} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium">
                      {getInitials(userData.firstName, userData.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{userData.firstName} {userData.lastName}</p>
                    <p className="w-full max-w-[200px] truncate text-sm text-muted-foreground">
                      {userData.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {userData.designation} at {userData.company}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={user?.region === 'gulf' ? '/gulf-dashboard' : '/employer-dashboard'} className="cursor-pointer">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={user?.region === 'gulf' ? '/gulf-dashboard/settings' : '/employer-dashboard/settings'} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile & Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={user?.region === 'gulf' ? '/gulf-dashboard/notifications' : '/employer-dashboard/notifications'} className="cursor-pointer">
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={user?.region === 'gulf' ? '/gulf-dashboard/settings?tab=subscription' : '/employer-dashboard/settings?tab=subscription'} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Subscription</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-l border-slate-200/50 dark:border-gray-800/50">
              <div className="flex flex-col space-y-6 mt-6">
                {/* User Profile Section */}
                <div className="flex items-center space-x-3 p-3 bg-slate-50/80 dark:bg-gray-800/80 rounded-lg border border-slate-200/50 dark:border-gray-700/50">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={userData.avatar} alt={`${userData.firstName} ${userData.lastName}`} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium">
                      {getInitials(userData.firstName, userData.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
                      {userData.firstName} {userData.lastName}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-gray-300 truncate">
                      {userData.designation}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Dashboard</h3>
                  <Link
                    href={user?.region === 'gulf' ? '/gulf-dashboard' : '/employer-dashboard'}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-slate-700 dark:text-slate-200">Dashboard</span>
                  </Link>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Jobs & Responses</h3>
                  {getJobsMenuItems(user?.region || 'india').map((item, index) => (
                                      <Link
                    key={index}
                    href={item.href}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-slate-700 dark:text-slate-200">{item.name}</span>
                  </Link>
                  ))}
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Database</h3>
                  {getDatabaseMenuItems(user?.region || 'india').map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <item.icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-slate-700 dark:text-slate-200">{item.name}</span>
                    </Link>
                  ))}
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Services</h3>
                  <Link
                    href="/naukri-talent-cloud"
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="w-5 h-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">TP</span>
                    </div>
                    <span className="text-slate-700 dark:text-slate-200">TalentPulse</span>
                  </Link>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Account</h3>
                  <Link
                    href={user?.region === 'gulf' ? '/gulf-dashboard/settings' : '/employer-dashboard/settings'}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-200">Profile & Settings</span>
                  </Link>
                  <Link
                    href={user?.region === 'gulf' ? '/gulf-dashboard/notifications' : '/employer-dashboard/notifications'}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-200">Notifications</span>
                  </Link>
                  <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-colors w-full text-left" onClick={handleLogout}>
                    <LogOut className="w-5 h-5 text-red-600" />
                    <span className="text-red-600">Log out</span>
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
