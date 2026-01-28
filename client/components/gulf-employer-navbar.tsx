"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Building2, ChevronDown, Menu, Plus, BarChart3, Users, Briefcase, Database, FileText, Moon, Sun, User, LogOut, Bell, Settings, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/useAuth"
import { apiService } from "@/lib/api"

export function GulfEmployerNavbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showJobsDropdown, setShowJobsDropdown] = useState(false)
  const [showDatabaseDropdown, setShowDatabaseDropdown] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const { user, logout, refreshUser } = useAuth()
  const [company, setCompany] = useState<any>(null)
  const [unseenNotifications, setUnseenNotifications] = useState(0)
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

  // Fetch unseen notifications count
  useEffect(() => {
    const fetchNotifications = async () => {
      if (user?.id) {
        try {
          const response = await apiService.getEmployerNotifications(1, 50, { unread: true })
          if (response.success && Array.isArray(response.data)) {
            setUnseenNotifications(response.data.length)
          }
        } catch (error) {
          console.error('Failed to fetch Gulf notifications:', error)
        }
      } else {
        setUnseenNotifications(0)
      }
    }

    fetchNotifications()
  }, [user])

  const handleNotificationClick = async () => {
    try {
      const response = await apiService.getEmployerNotifications(1, 50, { unread: true })
      if (response.success && Array.isArray(response.data)) {
        setUnseenNotifications(response.data.length)
      }
    } catch (error) {
      console.error('Failed to refresh Gulf notifications:', error)
    }
  }

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

  const getJobsMenuItems = () => [
    {
      name: "Post a Free Job",
      href: "/gulf-dashboard/post-job",
      icon: Plus,
      description: "Post your job for free and reach thousands of candidates",
    },
    {
      name: "Job Drafts",
      href: "/gulf-dashboard/drafts",
      icon: FileText,
      description: "View and manage your unpublished job drafts",
    },
    {
      name: "Hot Vacancies",
      href: "/gulf-dashboard/hot-vacancies",
      icon: Briefcase,
      description: "Premium urgent hiring solutions for immediate recruitment",
    },
    {
      name: "Post an Internship",
      href: "/gulf-dashboard/post-internship",
      icon: Users,
      description: "Find talented interns for your organization",
    },
    {
      name: "Manage Jobs and Responses",
      href: "/gulf-dashboard/manage-jobs",
      icon: BarChart3,
      description: "Track and manage all your job postings",
    },
  ]

  const getDatabaseMenuItems = () => [
    {
      name: "Create New Requirement",
      href: "/gulf-dashboard/create-requirement",
      icon: Plus,
      description: "Define your hiring requirements and find candidates",
    },
    {
      name: "Manage Requirements",
      href: "/gulf-dashboard/manage-requirements",
      icon: FileText,
      description: "View and manage all your hiring requirements",
    },
  ]

  return (
    <nav className="bg-gradient-to-r from-yellow-400/80 via-yellow-300/70 to-green-500/80 dark:from-gray-900/80 dark:via-gray-800/70 dark:to-gray-900/80 backdrop-blur-xl border-b border-yellow-300/30 dark:border-gray-700/50 fixed top-0 left-0 right-0 z-50 transition-colors shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 gap-2">
          {/* Logo */}
          <Link href="/gulf-dashboard" className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
              <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-lg sm:text-xl lg:text-2xl font-serif font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent tracking-tight">
              Gulf Jobs
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {/* Jobs & Responses Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setShowJobsDropdown(true)}
              onMouseLeave={() => setShowJobsDropdown(false)}
            >
              <button className="flex items-center space-x-1 text-slate-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-emerald-400 transition-colors font-medium text-sm lg:text-base">
                <span className="whitespace-nowrap">Jobs & Responses</span>
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              </button>

              <AnimatePresence>
                {showJobsDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200/50 dark:border-gray-700/50 p-4 z-50"
                  >
                    <div className="mb-3">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Jobs & Responses</h3>
                      <p className="text-xs text-slate-600 dark:text-gray-300 line-clamp-2">Manage jobs and responses</p>
                    </div>
                    <div className="space-y-1.5">
                      {getJobsMenuItems().map((item, index) => (
                        <Link
                          key={index}
                          href={item.href}
                          className="flex items-start space-x-2.5 p-2.5 rounded-lg hover:bg-slate-50/80 dark:hover:bg-gray-700/80 transition-colors group"
                        >
                          <div className="w-8 h-8 bg-green-100/80 dark:bg-green-900/80 rounded-lg flex items-center justify-center group-hover:bg-green-200/80 dark:group-hover:bg-green-800/80 transition-colors flex-shrink-0">
                            <item.icon className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-900 dark:text-white text-xs line-clamp-1">{item.name}</div>
                            <div className="text-xs text-slate-500 dark:text-gray-300 mt-0.5 line-clamp-1">{item.description}</div>
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
              <button className="flex items-center space-x-1 text-slate-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-emerald-400 transition-colors font-medium text-sm lg:text-base">
                <Database className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">Database</span>
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              </button>

              <AnimatePresence>
                {showDatabaseDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200/50 dark:border-gray-700/50 p-4 z-50"
                  >
                    <div className="mb-3">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Candidate Database</h3>
                      <p className="text-xs text-slate-600 dark:text-gray-300 line-clamp-2">Search and manage requirements</p>
                    </div>
                    <div className="space-y-1.5">
                      {getDatabaseMenuItems().map((item, index) => (
                        <Link
                          key={index}
                          href={item.href}
                          className="flex items-start space-x-2.5 p-2.5 rounded-lg hover:bg-slate-50/80 dark:hover:bg-gray-700/80 transition-colors group"
                        >
                          <div className="w-8 h-8 bg-emerald-100/80 dark:bg-emerald-900/80 rounded-lg flex items-center justify-center group-hover:bg-emerald-200/80 dark:group-hover:bg-emerald-800/80 transition-colors flex-shrink-0">
                            <item.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-900 dark:text-white text-xs line-clamp-1">{item.name}</div>
                            <div className="text-xs text-slate-500 dark:text-gray-300 mt-0.5 line-clamp-1">{item.description}</div>
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
          <div className="hidden lg:flex items-center space-x-3">
            {/* Notifications */}
            <Link href="/gulf-dashboard/notifications" onClick={handleNotificationClick}>
              <Button
                variant="ghost"
                size="sm"
                className="relative text-slate-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-emerald-400"
              >
                <Bell className="w-4 h-4" />
                {unseenNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
                    {unseenNotifications > 9 ? '9+' : unseenNotifications}
                  </span>
                )}
              </Button>
            </Link>

            {/* Dark Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-slate-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-emerald-400"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            <Link href="/naukri-talent-cloud">
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold">
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
                    <AvatarFallback className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium">
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
                  <Link href="/gulf-dashboard" className="cursor-pointer">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/gulf-dashboard/settings" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile & Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/gulf-dashboard/notifications" className="cursor-pointer">
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/gulf-dashboard/settings?tab=subscription" className="cursor-pointer">
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
              <Button variant="ghost" size="sm" className="lg:hidden">
                <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-l border-slate-200/50 dark:border-gray-800/50 overflow-y-auto">
              <div className="flex flex-col space-y-6 mt-6">
                {/* User Profile Section */}
                <div className="flex items-center space-x-3 p-3 bg-slate-50/80 dark:bg-gray-800/80 rounded-lg border border-slate-200/50 dark:border-gray-700/50">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={userData.avatar} alt={`${userData.firstName} ${userData.lastName}`} />
                    <AvatarFallback className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium">
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
                    href="/gulf-dashboard"
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-slate-700 dark:text-slate-200">Dashboard</span>
                  </Link>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Jobs & Responses</h3>
                  {getJobsMenuItems().map((item, index) => (
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
                  <h3 className="font-semibold text-slate-900 dark:text-white">Database</h3>
                  {getDatabaseMenuItems().map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <item.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
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
                    <div className="w-5 h-5 bg-gradient-to-r from-green-600 to-emerald-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">TP</span>
                    </div>
                    <span className="text-slate-700 dark:text-slate-200">TalentPulse</span>
                  </Link>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Account</h3>
                  <Link
                    href="/gulf-dashboard/settings"
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-200">Profile & Settings</span>
                  </Link>
                  <Link
                    href="/gulf-dashboard/notifications"
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

