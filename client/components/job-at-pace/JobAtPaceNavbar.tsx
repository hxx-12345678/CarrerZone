"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  Bell, 
  Crown, 
  Zap, 
  Settings, 
  User, 
  CreditCard, 
  BarChart3, 
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  Star,
  Shield,
  Award,
  Target,
  Briefcase,
  TrendingUp,
  MessageCircle,
  FileText,
  BookOpen
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface NavItem {
  name: string
  tab: string
  icon: any
  description: string
  badge?: string
}

const navItems: NavItem[] = [
  {
    name: "ResumeAI",
    tab: "resumeai",
    icon: FileText,
    description: "AI-powered resume builder and optimization"
  },
  {
    name: "Combo Plans",
    tab: "combo",
    icon: Star,
    description: "Combined premium packages",
    badge: "Value"
  },
  {
    name: "Value Plans",
    tab: "value",
    icon: Award,
    description: "Best value premium plans"
  },
  {
    name: "Features",
    tab: "features",
    icon: Crown,
    description: "Explore premium job search tools"
  },
  {
    name: "Applications",
    tab: "applications",
    icon: Target,
    description: "Track your job applications"
  }
]

interface JobAtPaceNavbarProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export default function JobAtPaceNavbar({ activeTab = "dashboard", onTabChange }: JobAtPaceNavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [currentPlan, setCurrentPlan] = useState("Premium")
  const [alertsCount, setAlertsCount] = useState(12)

  // Mock user subscription status
  useEffect(() => {
    setCurrentPlan("Premium")
  }, [])

  const getPlanIcon = (plan: string) => {
    switch(plan) {
      case "Free": return Shield
      case "Basic": return Zap  
      case "Premium": return Crown
      case "Pro": return Award
      default: return Shield
    }
  }

  const getPlanColor = (plan: string) => {
    switch(plan) {
      case "Free": return "bg-gray-100 text-gray-800 border-gray-200"
      case "Basic": return "bg-blue-100 text-blue-800 border-blue-200"
      case "Premium": return "bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 border-orange-200"
      case "Pro": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/job-at-pace" className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  Job at Pace
                </h1>
                <p className="text-xs text-gray-500">Career Accelerator</p>
              </div>
            </Link>

            {/* Current Plan Badge */}
            <Badge className={`${getPlanColor(currentPlan)} border font-medium px-3 py-1 shadow-sm`}>
              {React.createElement(getPlanIcon(currentPlan), { className: "h-3 w-3 mr-1" })}
              {currentPlan} Plan
            </Badge>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.tab
              return (
                <button
                  key={item.name}
                  onClick={() => onTabChange?.(item.tab)}
                  className={`relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center space-x-2 group ${
                    isActive
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-md'
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
                  <span>{item.name}</span>
                  {item.badge && (
                    <Badge className={`ml-1 text-xs px-2 py-0.5 ${
                      isActive 
                        ? 'bg-white/20 text-white border-white/30' 
                        : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                    }`}>
                      {item.badge}
                    </Badge>
                  )}
                  {item.name === "Alerts" && alertsCount > 0 && (
                    <Badge className="ml-1 bg-red-500 text-white text-xs px-2 py-0.5 animate-pulse">
                      {alertsCount}
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Quick Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden lg:flex items-center space-x-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50">
                  <Settings className="h-4 w-4" />
                  <span>Quick Actions</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center space-x-2 cursor-pointer">
                    <Briefcase className="h-4 w-4" />
                    <span>Back to Main Portal</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/job-at-pace/subscribe" className="flex items-center space-x-2 cursor-pointer">
                    <Crown className="h-4 w-4" />
                    <span>Upgrade Plan</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/articles" className="flex items-center space-x-2 cursor-pointer">
                    <BookOpen className="h-4 w-4" />
                    <span>Articles</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Upgrade Button (for free/basic users) */}
            {(currentPlan === "Free" || currentPlan === "Basic") && (
              <Button 
                size="sm"
                onClick={() => router.push('/job-at-pace/subscribe')}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center space-x-2">
                    <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <span>Job at Pace</span>
                  </SheetTitle>
                  <SheetDescription>
                    Navigate through your career acceleration tools
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-8 space-y-4">
                  {/* Current Plan */}
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-orange-200">
                    <div className="flex items-center space-x-2 mb-2">
                      {React.createElement(getPlanIcon(currentPlan), { className: "h-5 w-5 text-orange-600" })}
                      <span className="font-semibold text-gray-900">{currentPlan} Plan</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {currentPlan === "Free" ? "Upgrade to unlock premium features" : "Enjoying premium benefits"}
                    </p>
                    {(currentPlan === "Free" || currentPlan === "Basic") && (
                      <Button 
                        size="sm" 
                        className="mt-2 w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
                        onClick={() => {
                          router.push('/job-at-pace/subscribe')
                          setIsMobileMenuOpen(false)
                        }}
                      >
                        Upgrade Now
                      </Button>
                    )}
                  </div>

                  {/* Navigation Items */}
                  <div className="space-y-2">
                    {navItems.map((item) => {
                      const isActive = activeTab === item.tab
                      return (
                        <button
                          key={item.name}
                          onClick={() => {
                            onTabChange?.(item.tab)
                            setIsMobileMenuOpen(false)
                          }}
                          className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 w-full text-left ${
                            isActive
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <item.icon className="h-5 w-5" />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{item.name}</span>
                              {item.badge && (
                                <Badge className={`text-xs ${
                                  isActive 
                                    ? 'bg-white/20 text-white border-white/30' 
                                    : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                                }`}>
                                  {item.badge}
                                </Badge>
                              )}
                              {item.name === "Alerts" && alertsCount > 0 && (
                                <Badge className="bg-red-500 text-white text-xs">
                                  {alertsCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{item.description}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Back to Main Portal */}
                  <div className="pt-4 border-t">
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-3 p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      <Briefcase className="h-5 w-5" />
                      <span>Back to Main Portal</span>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}