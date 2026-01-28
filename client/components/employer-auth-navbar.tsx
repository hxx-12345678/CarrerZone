"use client"

import Link from "next/link"
import { useState } from "react"
import {
  Building2,
  ChevronDown,
  DollarSign,
  Sparkles,
  BarChart3,
  Users,
  Zap,
  Target,
  Phone,
  Database,
  CheckCircle,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Card } from "@/components/ui/card"

export default function EmployerAuthNavbar({ variant = "login" }: { variant?: "login" | "register" }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-gradient-to-r from-blue-200/40 via-cyan-200/30 to-indigo-200/40 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-serif font-semibold text-gray-900">
              JobPortal
            </span>
            <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full font-medium">
              Employers
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Pricing Dropdown */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-gray-700 hover:text-indigo-600 font-medium tracking-wide uppercase text-sm transition-colors duration-300">
                    Pricing
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[500px] p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <Link href="/job-posting">
                          <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer group">
                            <div className="flex items-start space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Target className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 mb-1">
                                  Job Posting Plans
                                </h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                  Hot Vacancy, Classified, Standard & Free plans starting at ₹499
                                </p>
                              </div>
                            </div>
                          </Card>
                        </Link>

                        <Link href="/database-pricing">
                          <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer group">
                            <div className="flex items-start space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Database className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 mb-1">
                                  Resume Database
                                </h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                  Database plans - Access 50M+ profiles starting at ₹4,000
                                </p>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      </div>

                      <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">
                            No setup fees • Cancel anytime • 100% secure
                          </span>
                        </div>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Integrations Dropdown */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-gray-700 hover:text-indigo-600 font-medium tracking-wide uppercase text-sm transition-colors duration-300">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Integrations
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[500px] p-4">
                      <div className="space-y-3">
                        {/* TalentPulse */}
                        <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer group bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                              <BarChart3 className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-blue-900 dark:text-blue-100 text-lg">
                                  TalentPulse
                                </h4>
                                <ExternalLink className="w-4 h-4 text-blue-600" />
                              </div>
                              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                                AI-powered candidate screening, monitoring, and testing platform
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center space-x-1">
                                  <CheckCircle className="w-3 h-3 text-blue-600" />
                                  <span className="text-blue-700 dark:text-blue-300">Smart Screening</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <CheckCircle className="w-3 h-3 text-blue-600" />
                                  <span className="text-blue-700 dark:text-blue-300">Skills Testing</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <CheckCircle className="w-3 h-3 text-blue-600" />
                                  <span className="text-blue-700 dark:text-blue-300">Real-time Monitoring</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <CheckCircle className="w-3 h-3 text-blue-600" />
                                  <span className="text-blue-700 dark:text-blue-300">Analytics Dashboard</span>
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                  Learn More
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>

                        {/* RecruitBridge */}
                        <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer group bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Users className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-purple-900 dark:text-purple-100 text-lg">
                                  RecruitBridge
                                </h4>
                                <ExternalLink className="w-4 h-4 text-purple-600" />
                              </div>
                              <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
                                Complete Applicant Tracking System (ATS) for seamless hiring workflow
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center space-x-1">
                                  <CheckCircle className="w-3 h-3 text-purple-600" />
                                  <span className="text-purple-700 dark:text-purple-300">Pipeline Management</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <CheckCircle className="w-3 h-3 text-purple-600" />
                                  <span className="text-purple-700 dark:text-purple-300">Team Collaboration</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <CheckCircle className="w-3 h-3 text-purple-600" />
                                  <span className="text-purple-700 dark:text-purple-300">Interview Scheduling</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <CheckCircle className="w-3 h-3 text-purple-600" />
                                  <span className="text-purple-700 dark:text-purple-300">Automated Workflows</span>
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700">
                                <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                                  Learn More
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </div>

                      <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center space-x-2">
                          <Zap className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Seamless integration with your employer dashboard
                          </span>
                        </div>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Contact */}
            <Button variant="ghost" className="text-gray-700 hover:text-indigo-600 font-medium tracking-wide uppercase text-sm transition-colors duration-300">
              <Phone className="w-4 h-4 mr-2" />
              1800-102-2558
            </Button>

            {/* CTA Button */}
            {variant === "login" ? (
              <Link href="/employer-register">
                <Button className="rounded-full px-5 py-2.5 bg-gradient-to-r from-[#5A00F2] to-[#4F9BFF] hover:scale-105 hover:shadow-[0_0_15px_rgba(79,155,255,0.4)] text-white font-bold uppercase text-sm transition-all duration-300">
                  Register
                </Button>
              </Link>
            ) : (
              <Link href="/employer-login">
                <Button variant="outline" className="rounded-full px-5 py-2.5 border-[#5A00F2] text-[#5A00F2] hover:bg-[#5A00F2] hover:text-white transition-all duration-300">
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-700">
            <div className="space-y-2">
              <Link href="/job-posting" className="block px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                Job Posting Plans
              </Link>
              <Link href="/database-pricing" className="block px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                Resume Database
              </Link>
              <div className="px-4 py-2 text-sm font-semibold text-slate-500">Integrations</div>
              <div className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                <div className="font-medium">TalentPulse</div>
                <div className="text-sm text-slate-600">Candidate screening & testing</div>
              </div>
              <div className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                <div className="font-medium">RecruitBridge</div>
                <div className="text-sm text-slate-600">Applicant Tracking System</div>
              </div>
              <Link href={variant === "login" ? "/employer-register" : "/employer-login"} className="block px-4 py-2">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
                  {variant === "login" ? "Register" : "Login"}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

