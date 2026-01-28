"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Building2,
  Users,
  Briefcase,
  TrendingUp,
  Star,
  Shield,
  Zap,
  Target,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Phone,
  MessageCircle,
  HelpCircle,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import { apiService } from "@/lib/api"
import EmployerAuthNavbar from "@/components/employer-auth-navbar"
import EmployerAuthFooter from "@/components/employer-auth-footer"

export default function EmployerLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, loading, error, clearError } = useAuth()
  const [checking, setChecking] = useState(true)

  // If already authenticated (e.g., just completed OAuth), send to appropriate employer dashboard
  useEffect(() => {
    // Check for URL parameters first
    const error = searchParams.get('error')
    const message = searchParams.get('message')
    
    if (error === 'account_type_mismatch' && message) {
      toast.error(decodeURIComponent(message))
    }
    
    const checkAlreadyLoggedIn = async () => {
      try {
        if (apiService.isAuthenticated()) {
          const me = await apiService.getCurrentUser()
          if (me.success && me.data?.user && (me.data.user.userType === 'employer' || me.data.user.userType === 'admin')) {
            // Determine region → target dashboard (prefer user region, fallback to company region)
            let region: string | undefined = (me.data.user as any)?.region
            if (!region) {
            const companyId = (me.data.user as any).companyId
            if (companyId) {
              const companyResp = await apiService.getCompany(companyId)
              if (companyResp.success && companyResp.data) {
                localStorage.setItem('company', JSON.stringify(companyResp.data))
                region = companyResp.data.region
                }
              }
            }
            // Allow explicit region override via URL param if none set on user/company
            const requestedRegion = searchParams.get('region') || undefined
            const finalRegion = region || requestedRegion
            const target = finalRegion === 'gulf' ? '/gulf-dashboard' : '/employer-dashboard'
            return router.replace(target)
          }
        }
      } catch {
        // ignore and show login form
      }
      
      // Load saved credentials if available
      try {
        const savedEmail = localStorage.getItem('employer_saved_email')
        const savedPassword = localStorage.getItem('employer_saved_password')
        if (savedEmail && savedPassword) {
          setEmail(savedEmail)
          setPassword(savedPassword)
          setRememberMe(true)
        }
      } catch (e) {
        // LocalStorage might not be available
      }
      
      setChecking(false)
    }
    checkAlreadyLoggedIn()
  }, [router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!email || !password) {
      toast.error('Please fill in all required fields')
      return
    }
    
    try {
      clearError()
      console.log('🔍 Starting employer login for:', email)
      const result = await login({ email, password, rememberMe, loginType: 'employer' })
      
      console.log('✅ Login result:', result)
      console.log('👤 User data:', result?.user)
      console.log('🎯 User type:', result?.user?.userType)
      
      // Save or clear credentials based on rememberMe checkbox
      try {
        if (rememberMe) {
          localStorage.setItem('employer_saved_email', email)
          localStorage.setItem('employer_saved_password', password)
          console.log('💾 Credentials saved to localStorage')
        } else {
          localStorage.removeItem('employer_saved_email')
          localStorage.removeItem('employer_saved_password')
          console.log('🗑️ Credentials cleared from localStorage')
        }
      } catch (e) {
        // LocalStorage might not be available
        console.log('⚠️ Could not access localStorage')
      }
      
      // Check if user is an employer or admin and redirect accordingly
      if (result?.user?.userType === 'employer' || result?.user?.userType === 'admin') {
        console.log('✅ User is employer/admin, using redirectTo from server')
        
        // Use the redirectTo URL from the server response
        const redirectTo = result?.redirectTo || '/employer-dashboard'
        console.log('✅ Redirecting to:', redirectTo)
        
        toast.success('Successfully signed in! Redirecting to your dashboard...')
        router.replace(redirectTo)
      } else {
        console.log('❌ User is not employer or admin, userType:', result?.user?.userType)
        toast.error('This account is not registered as an employer. Please use the regular login.')
        setTimeout(() => {
          console.log('🔄 Redirecting to /login')
          router.push('/login')
        }, 2000)
      }
    } catch (error: any) {
      console.error('❌ Login error:', error)
      
      // Handle specific error types
      if (error.message?.includes('verification is pending')) {
        toast.error('Your account is pending verification. Please wait for admin approval.')
      } else if (error.message?.includes('verification was rejected')) {
        toast.error('Your account verification was rejected. Please re-register with correct documents.')
        setTimeout(() => {
          router.push('/employer-register')
        }, 3000)
      } else if (error.message?.includes('This account is registered as a jobseeker')) {
        toast.error(error.message)
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else if (error.message?.includes('Invalid email or password') || 
          error.message?.includes('User not found') ||
          error.message?.includes('does not exist')) {
        toast.error("Account not found. Please register first or check your credentials.")
      } else if (error.message?.includes('Validation failed')) {
        toast.error("Please check your input and try again")
      } else {
        toast.error(error.message || 'Login failed')
      }
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    try {
      setOauthLoading(provider)
      clearError()
      
      console.log('🔍 Starting OAuth login for employer with provider:', provider);
      
      // Get OAuth URLs from backend for employer
      const response = await apiService.getOAuthUrls('employer')
      
      if (response.success && response.data) {
        const url = provider === 'google' ? response.data.google : response.data.facebook
        console.log('✅ OAuth URL received for employer:', url);
        console.log('🔍 URL contains state=employer:', url.includes('state=employer'));
        
        // Store a flag to indicate this is an employer OAuth flow
        sessionStorage.setItem('oauth_flow_type', 'employer')
        console.log('✅ OAuth flow type set to employer in sessionStorage');
        
        // Also store in localStorage for persistence
        localStorage.setItem('oauth_flow_type', 'employer')
        console.log('✅ OAuth flow type set to employer in localStorage');
        
        // Redirect to OAuth provider
        console.log('🔄 Redirecting to OAuth provider:', url);
        window.location.href = url
      } else {
        console.error('❌ Failed to get OAuth URL:', response);
        toast.error('Failed to get OAuth URL')
      }
    } catch (error: any) {
      console.error(`❌ ${provider} OAuth error:`, error)
      toast.error(`Failed to sign in with ${provider}`)
    } finally {
      setOauthLoading(null)
    }
  }

  const features = [
    {
      icon: Search,
      title: "Database",
      description: "Access millions of verified candidate profiles with advanced search and filtering capabilities.",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Get detailed insights into your hiring performance with comprehensive analytics and reports.",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work seamlessly with your team using shared candidate lists and collaborative hiring tools.",
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Enterprise-grade security ensures your data and candidate information remain protected.",
    },
  ]

  const premiumServices = [
    {
      icon: Target,
      title: "Premium Job Posting",
      description: "Get 3x more visibility with featured job listings",
      features: ["Priority placement", "Highlighted listings", "Extended reach"],
      price: "₹2,999/month",
    },
    {
      icon: BarChart3,
      title: "TalentPulse",
      description: "AI-powered talent analytics and insights",
      features: ["Candidate scoring", "Market insights", "Hiring trends"],
      price: "₹4,999/month",
    },
    {
      icon: Shield,
      title: "Database",
      description: "Access India's largest resume database",
      features: ["50M+ profiles", "Advanced filters", "Contact details"],
      price: "₹7,999/month",
    },
    {
      icon: Zap,
      title: "Expert Assist",
      description: "Dedicated hiring support from our experts",
      features: ["Personal recruiter", "Interview scheduling", "Candidate screening"],
      price: "₹9,999/month",
    },
  ]

  const faqs = [
    {
      question: "How do I post my first job?",
      answer:
        "After logging in, click on 'Post a Job' button. Fill in the job details, requirements, and publish. Your job will be live within 24 hours.",
    },
    {
      question: "What is included in the free plan?",
      answer:
        "Free plan includes 1 active job posting, basic candidate applications, and standard support. Perfect for small businesses and startups.",
    },
    {
      question: "How can I access premium features?",
      answer:
                "Upgrade to our premium plans to access features like Database, priority job listings, advanced analytics, and dedicated support.",
    },
    {
      question: "Can I get a demo of premium services?",
      answer:
        "Yes! Contact our sales team for a personalized demo of all premium features. We'll show you how to maximize your hiring success.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards, debit cards, net banking, UPI, and corporate purchase orders for enterprise clients.",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200/40 via-cyan-200/30 to-indigo-200/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Enhanced Navbar */}
      <EmployerAuthNavbar variant="login" />

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-300/8 to-cyan-300/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-violet-300/8 to-purple-300/8 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-blue-300/6 to-indigo-300/6 rounded-full blur-3xl animate-pulse delay-1000"></div>
        {/* Wide translucent blue gradient strip */}
        <div className="absolute top-1/3 left-0 right-0 h-24 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-indigo-400/20"></div>
      </div>

      <div className="relative flex items-center justify-center p-4 pt-8 min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center">
          {/* Left Side - Features & Hero */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
   
          <div className="px-2 sm:px-4 lg:px-0 lg:pr-16 overflow-visible">
            <h1
              className="serif-heading text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl 
               font-bold heading-gradient mb-6 leading-[1.35] pb-2 tracking-tight 
               text-[#1E1E2F] dark:text-white inline-block"
              >
              Employer Portal
             </h1>
              <p className="text-base sm:text-lg lg:text-xl text-[#5B5B6A] dark:text-slate-300 mb-8 max-w-lg leading-relaxed font-medium">
                Access your recruiter dashboard and manage your hiring process with our advanced tools
              </p>
            </div>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                  className="flex items-start space-x-4 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-300 to-cyan-300 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1E1E2F] dark:text-white mb-2">{feature.title}</h3>
                    <p className="text-[#5B5B6A] dark:text-slate-300 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="glass-20 soft-glow rounded-3xl p-6">
              <h3 className="text-xl font-semibold text-[#1E1E2F] dark:text-white mb-2">Trusted by 50K+ Companies</h3>
              <p className="text-[#5B5B6A] dark:text-slate-300 leading-relaxed">
                From startups to Fortune 500 companies, employers trust us to find the best talent
              </p>
            </div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="bg-white/50 backdrop-blur-xl border border-white/40 rounded-3xl p-8 max-w-lg mx-auto shadow-2xl">
              <div className="text-center mb-8">
                <h2 className="serif-heading text-3xl font-bold text-[#1E1E2F] dark:text-white mb-2">Employer Sign In</h2>
                <p className="text-[#5B5B6A] dark:text-slate-300 leading-relaxed">Access your recruiter dashboard</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#1E1E2F] dark:text-slate-300 font-semibold">
                    Company Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5B5B6A] w-5 h-5" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your company email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 border-white/30 bg-white/50 backdrop-blur-md focus:border-blue-500 focus:bg-white/60 transition-all duration-300 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#1E1E2F] dark:text-slate-300 font-semibold">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5B5B6A] w-5 h-5" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 border-white/30 bg-white/50 backdrop-blur-md focus:border-blue-500 focus:bg-white/60 transition-all duration-300 rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#5B5B6A] hover:text-[#1E1E2F] transition-colors duration-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label htmlFor="remember" className="text-sm text-[#5B5B6A] dark:text-slate-400">
                      Keep me signed in
                    </Label>
                  </div>
                  <Link
                    href="/employer-forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 btn-shimmer btn-ripple text-base font-semibold rounded-xl"
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In to Dashboard'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                {error && (
                  <div className="text-red-600 text-sm text-center bg-red-50/80 dark:bg-red-900/20 p-3 rounded-xl backdrop-blur-sm">
                    {error}
                  </div>
                )}
              </form>

              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white/50 backdrop-blur-md px-2 text-[#5B5B6A]">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 bg-white/50 backdrop-blur-md hover:bg-white/60 border-white/30 transition-all duration-300 rounded-xl"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={oauthLoading === 'google'}
                >
                  {oauthLoading === 'google' ? (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  Google
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-12 bg-white/50 backdrop-blur-md hover:bg-white/60 border-white/30 transition-all duration-300 rounded-xl"
                  onClick={() => handleOAuthLogin('facebook')}
                  disabled={oauthLoading === 'facebook'}
                >
                  {oauthLoading === 'facebook' ? (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  )}
                  Facebook
                </Button>
              </div>

              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white/50 backdrop-blur-md px-2 text-[#5B5B6A]">New to JobPortal?</span>
                </div>
              </div>

              <div className="text-center space-y-4 mt-6">
                <Link href="/employer-register">
                  <Button variant="outline" className="w-full h-12 bg-white/60 backdrop-blur-sm hover:bg-white/80 border-white/30 transition-all duration-300 rounded-xl">
                    Create Employer Account
                  </Button>
                </Link>

                <div className="text-sm text-[#5B5B6A] dark:text-slate-400">
                  Need to link to an existing company?{' '}
                  <Link href="/employer-join-company" className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300">
                    Join company
                  </Link>
                </div>

                <div className="text-sm text-[#5B5B6A] dark:text-slate-400">
                  Need help? Contact our{" "}
                  <Link href="/sales-support" className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300">
                    sales team
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Premium Services Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-12 left-12 w-36 h-36 bg-gradient-to-br from-indigo-300/6 to-purple-300/6 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-12 right-12 w-40 h-40 bg-gradient-to-br from-blue-300/6 to-cyan-300/6 rounded-full blur-3xl animate-pulse delay-500"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br from-violet-300/4 to-pink-300/4 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="serif-heading text-4xl font-bold text-[#1E1E2F] dark:text-white mb-4">Premium Hiring Solutions</h2>
            <p className="text-base sm:text-lg lg:text-xl text-[#5B5B6A] dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium">
              Supercharge your hiring with our advanced tools and services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {premiumServices.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group"
              >
                <div className="h-full bg-white/50 backdrop-blur-xl border border-white/40 rounded-3xl p-6 hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-300 to-cyan-300 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <service.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#1E1E2F] dark:text-white mb-2">{service.title}</h3>
                  <p className="text-[#5B5B6A] dark:text-slate-300 mb-4 leading-relaxed">{service.description}</p>
                  
                  <ul className="space-y-2 mb-4">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-[#5B5B6A] dark:text-slate-300">
                        <Star className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mb-4">{service.price}</div>
                  <Button className="w-full btn-shimmer btn-ripple rounded-xl font-semibold">
                    Learn More
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-emerald-300/6 to-teal-300/6 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-green-300/6 to-emerald-300/6 rounded-full blur-3xl animate-pulse delay-500"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-teal-300/4 to-cyan-300/4 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="serif-heading text-4xl font-bold text-[#1E1E2F] dark:text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-base sm:text-lg lg:text-xl text-[#5B5B6A] dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium">
              Get answers to common questions about our employer services
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <div className="bg-white/50 backdrop-blur-xl border border-white/40 rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300">
                  <Collapsible
                    open={expandedFaq === index}
                    onOpenChange={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  >
                    <CollapsibleTrigger className="w-full p-6 text-left hover:bg-white/70 transition-colors duration-300">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-[#1E1E2F] dark:text-white">{faq.question}</h3>
                        {expandedFaq === index ? (
                          <ChevronUp className="w-5 h-5 text-[#5B5B6A]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#5B5B6A]" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-6 pb-6">
                      <p className="text-[#5B5B6A] dark:text-slate-300 leading-relaxed">{faq.answer}</p>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-[#5B5B6A] dark:text-slate-300 mb-6 leading-relaxed">Still have questions? We're here to help!</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" className="flex items-center bg-white/60 backdrop-blur-sm hover:bg-white/80 border-white/30 transition-all duration-300 rounded-xl font-semibold">
                <MessageCircle className="w-4 h-4 mr-2" />
                Live Chat
              </Button>
              <Button variant="outline" className="flex items-center bg-white/60 backdrop-blur-sm hover:bg-white/80 border-white/30 transition-all duration-300 rounded-xl font-semibold">
                <Phone className="w-4 h-4 mr-2" />
                Call 1800-102-2558
              </Button>
              <Button variant="outline" className="flex items-center bg-white/60 backdrop-blur-sm hover:bg-white/80 border-white/30 transition-all duration-300 rounded-xl font-semibold">
                <HelpCircle className="w-4 h-4 mr-2" />
                Help Center
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <EmployerAuthFooter />
    </div>
  )
}
