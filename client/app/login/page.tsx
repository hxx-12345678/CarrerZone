"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock, ArrowRight, Briefcase, CheckCircle, Building2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { useAuth } from "@/hooks/useAuth"
import { useRouter, useSearchParams } from 'next/navigation'
import { apiService } from "@/lib/api"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, loading, error, clearError } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  const requestingRegion = (searchParams.get('requestingRegion') || '').toLowerCase()
  const nextPath = searchParams.get('next') || '/dashboard'

  const [showRegionUpgradeDialog, setShowRegionUpgradeDialog] = useState(false)
  const [upgradeOtp, setUpgradeOtp] = useState('')
  const [upgradeUser, setUpgradeUser] = useState<{ userId: string; email: string; firstName?: string } | null>(null)
  const [upgradeLoading, setUpgradeLoading] = useState(false)

  const handleVerifyUpgradeOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!upgradeUser?.userId) {
      toast.error('Unable to verify OTP. Please try again.')
      return
    }

    setUpgradeLoading(true)
    try {
      const res = await apiService.verifyOTPAndRegister(upgradeUser.userId, upgradeOtp, 'india')
      if (res.success) {
        toast.success('India portal access enabled. Redirecting...')
        setShowRegionUpgradeDialog(false)
        setTimeout(() => {
          window.location.href = nextPath || '/dashboard'
        }, 500)
      } else {
        toast.error(res.message || 'OTP verification failed')
      }
    } catch (err: any) {
      toast.error(err?.message || 'OTP verification failed')
    } finally {
      setUpgradeLoading(false)
    }
  }

  // If already authenticated (e.g., just completed OAuth), send to dashboard instead of showing login
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
          // If the user is here to enable a new region (e.g., Gulf-only -> India),
          // do NOT auto-redirect away from /login.
          if (requestingRegion === 'india') {
            setChecking(false)
            return
          }

          // Do not force navigation away from /login for authenticated jobseekers.
          // This page is used for cross-portal upgrades as well.
          try {
            const me = await apiService.getCurrentUser()
            if (me.success && me.data?.user && me.data.user.userType === 'employer') {
              router.replace('/employer-dashboard')
              return
            }
          } catch {
            // ignore
          }

          setChecking(false)
          return
        }
      } catch {
        // ignore and show login form
      }
      
      // Load saved credentials if available
      try {
        const savedEmail = localStorage.getItem('jobseeker_saved_email')
        const savedPassword = localStorage.getItem('jobseeker_saved_password')
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
  }, [router, searchParams, requestingRegion])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔍 Login form submitted with:', { email, password: '[HIDDEN]', rememberMe })
    clearError()
    
    // Basic validation
    if (!email || !password) {
      toast.error('Please fill in all required fields')
      return
    }
    
    try {
      // If user came here because they tried to access India portal actions with a Gulf-only account,
      // offer a guided upgrade to enable India access.
      if (requestingRegion === 'india') {
        try {
          const check = await apiService.checkExistingUser(email, password, 'india')
          if (check?.success && check?.userExists) {
            const userData = check.data?.data || check.data
            setUpgradeUser({
              userId: userData.userId || userData.id || '',
              email: userData.email || email,
              firstName: userData.firstName,
            })
            setShowRegionUpgradeDialog(true)
            toast.info('OTP sent to your email to enable India portal access.')
            return
          }
        } catch (checkError: any) {
          // If they already have access or the endpoint fails, fall back to normal login.
          console.log('Region upgrade precheck skipped:', checkError?.message || checkError)
        }
      }

      console.log('🔄 Attempting login...')
      const result = await login({ email, password, rememberMe, loginType: 'jobseeker' })
      console.log('✅ Login successful:', result)
      
      // Save or clear credentials based on rememberMe checkbox
      try {
        if (rememberMe) {
          localStorage.setItem('jobseeker_saved_email', email)
          localStorage.setItem('jobseeker_saved_password', password)
          console.log('💾 Credentials saved to localStorage')
        } else {
          localStorage.removeItem('jobseeker_saved_email')
          localStorage.removeItem('jobseeker_saved_password')
          console.log('🗑️ Credentials cleared from localStorage')
        }
      } catch (e) {
        // LocalStorage might not be available
        console.log('⚠️ Could not access localStorage')
      }
      
      // Check if login was successful and redirect accordingly
      if (result?.user?.userType === 'employer' || result?.user?.userType === 'admin') {
        console.log('❌ Employer/Admin trying to login through jobseeker login page')
        toast.error('This account is registered as an employer/admin. Please use the employer login page.')
        setTimeout(() => {
          window.location.href = '/employer-login'
        }, 2000)
      } else {
        console.log('✅ Jobseeker login successful, using redirectTo from server')
        
        // Use the redirectTo URL from the server response
        const redirectTo = result?.redirectTo || '/dashboard'
        console.log('✅ Redirecting to:', redirectTo)
        
        toast.success('Successfully signed in! Redirecting...')
        setTimeout(() => {
          // If the user was coming from an India eligibility flow, prefer the requested next path.
          if (requestingRegion === 'india' && nextPath) {
            window.location.href = nextPath
          } else {
            window.location.href = redirectTo
          }
        }, 1000)
      }
    } catch (error: any) {
      console.error('❌ Login error:', error)
      // Check if the error indicates user doesn't exist
      if (error.message?.includes('This account is registered as an employer')) {
        toast.error(error.message)
        setTimeout(() => {
          window.location.href = '/employer-login'
        }, 2000)
      } else if (error.message?.includes('Invalid email or password') || 
          error.message?.includes('User not found') ||
          error.message?.includes('does not exist')) {
        toast.error("Account not found. Please register first.")
        // Optionally redirect to register page after a delay
        setTimeout(() => {
          window.location.href = '/register'
        }, 2000)
      } else {
        toast.error(error.message || "Login failed")
      }
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    try {
      setOauthLoading(provider)
      clearError()
      
      console.log('🔍 Starting OAuth login for jobseeker with provider:', provider);
      
      // Get OAuth URLs from backend for jobseeker
      const response = await apiService.getOAuthUrls('jobseeker')
      
      if (response.success && response.data) {
        const url = provider === 'google' ? response.data.google : response.data.facebook
        console.log('✅ Redirecting to OAuth provider:', url);
        // Redirect to OAuth provider
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

  const benefits = [
    "Access to 50K+ job opportunities",
    "Personalized job recommendations",
    "Direct application to top companies",
    "Career guidance and tips",
    "Salary insights and trends",
    "Resume builder and templates",
  ]

  return (
    <div className="min-h-screen bg-animated dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-x-hidden">
      <Navbar />
      
      {/* Landing Page Style Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Enhanced Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-indigo-800/5 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-indigo-800/20"></div>
        
        {/* Enhanced Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Layer A: far glow */}
          <div className="absolute -top-40 -right-40 w-[28rem] h-[28rem] rounded-full parallax-far" style={{ background: 'radial-gradient(50% 50% at 50% 50%, rgba(90,0,242,0.35) 0%, rgba(90,0,242,0) 100%)' }}></div>
          {/* Layer B: gradient strip */}
          <div className="absolute top-1/3 left-0 right-0 h-24 opacity-20 gradient-strip"></div>
          
          {/* Semicircles and Rectangles for Enhanced UI */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-lg"></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-2xl"></div>
          
          {/* Rectangular shapes */}
          <div className="absolute top-1/4 right-1/3 w-16 h-32 bg-gradient-to-b from-purple-500/15 to-blue-500/15 rounded-lg rotate-12 blur-sm"></div>
          <div className="absolute bottom-1/4 left-1/3 w-20 h-24 bg-gradient-to-b from-blue-500/15 to-indigo-500/15 rounded-lg -rotate-12 blur-sm"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-28 bg-gradient-to-b from-indigo-500/15 to-purple-500/15 rounded-lg rotate-45 blur-sm"></div>
          
          {/* Layer C: small particles placeholder (non-interactive) */}
          <div className="pointer-events-none absolute inset-0 opacity-20"></div>
        </div>
      </div>
      
      <div className="pt-20 pb-12 relative z-10">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center px-4 sm:px-6 lg:px-8">
        {/* Left Side - Benefits */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:block space-y-8"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">Welcome Back!</h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-8">
              Continue your journey to find the perfect career opportunity
            </p>
          </div>

          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                className="flex items-center space-x-3"
              >
                <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-slate-700 dark:text-slate-300">{benefit}</span>
              </motion.div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
            <h3 className="text-xl font-bold mb-2">Join 10M+ Job Seekers</h3>
            <p className="text-blue-100">Trusted by millions of professionals to find their dream careers</p>
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
          <Card className="border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl shadow-[0_20px_60px_rgba(90,0,242,0.1)] rounded-3xl border border-white/20 dark:border-slate-700/30">
            <CardHeader className="text-center pb-6 sm:pb-8 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-t-3xl border-b border-purple-100/30 dark:border-purple-800/30">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Sign In</CardTitle>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2">Enter your credentials to access your account</p>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6" onInvalid={(e) => console.log('❌ Form validation failed:', e)}>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => {
                        console.log('📧 Email changed:', e.target.value)
                        setEmail(e.target.value)
                      }}
                      className="pl-10 h-12 border-slate-200 dark:border-slate-600 focus:border-purple-500 focus:ring-purple-500/20 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl transition-all duration-200 hover:bg-white/70 dark:hover:bg-slate-700/70"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        console.log('🔒 Password changed:', e.target.value ? '[HIDDEN]' : '')
                        setPassword(e.target.value)
                      }}
                      className="pl-10 pr-10 h-12 border-slate-200 dark:border-slate-600 focus:border-purple-500 focus:ring-purple-500/20 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl transition-all duration-200 hover:bg-white/70 dark:hover:bg-slate-700/70"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                    <Label htmlFor="remember" className="text-sm text-slate-600 dark:text-slate-400">
                      Remember me
                    </Label>
                  </div>
                  <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  onClick={() => console.log('🔘 Sign In button clicked')}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                >
                  {loading ? "Signing In..." : "Sign In"}
                  {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-800 px-2 text-slate-500">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-12 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={oauthLoading === 'google' || loading}
                >
                  {oauthLoading === 'google' ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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
                  {oauthLoading === 'google' ? 'Signing in...' : 'Google'}
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                  onClick={() => handleOAuthLogin('facebook')}
                  disabled={oauthLoading === 'facebook' || loading}
                >
                  {oauthLoading === 'facebook' ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z" />
                    </svg>
                  )}
                  {oauthLoading === 'facebook' ? 'Signing in...' : 'Facebook'}
                </Button>
              </div>

              <div className="text-center">
                <p className="text-slate-600 dark:text-slate-400">
                  Don't have an account?{" "}
                  <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                    Sign up for free
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl text-white py-4 sm:py-6 px-4 sm:px-6 lg:px-8 border-t border-slate-800 mt-6 sm:mt-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Company Logo */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  JobPortal
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                India's leading job portal connecting talent with opportunities. Find your dream job or hire the perfect candidate.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/jobs" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Find Jobs
                  </Link>
                </li>
                <li>
                  <Link href="/companies" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Browse Companies
                  </Link>
                </li>
                <li>
                  <Link href="/featured-companies" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Featured Companies
                  </Link>
                </li>
                <li>
                  <Link href="/job-at-pace" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Job at Pace Premium
                  </Link>
                </li>
              </ul>
            </div>

            {/* For Job Seekers */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white">For Job Seekers</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/register" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/account" className="text-slate-400 hover:text-white transition-colors text-sm">
                    My Profile
                  </Link>
                </li>
                <li>
                  <Link href="/applications" className="text-slate-400 hover:text-white transition-colors text-sm">
                    My Applications
                  </Link>
                </li>
                <li>
                  <Link href="/gulf-opportunities" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Gulf Opportunities
                  </Link>
                </li>
              </ul>
            </div>

            {/* For Employers */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white">For Employers</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/employer-register" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Post Jobs
                  </Link>
                </li>
                <li>
                  <Link href="/employer-login" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Employer Login
                  </Link>
                </li>
                <li>
                  <Link href="/employer-dashboard" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/naukri-talent-cloud" className="text-slate-400 hover:text-white transition-colors text-sm">
                    TalentPulse
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/contact" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors text-sm">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 text-center">
            <div className="text-slate-400 text-sm">
              © 2025 JobPortal. All rights reserved. Made with ❤️ in India
            </div>
          </div>
        </div>
      </footer>

      {/* Cross-portal upgrade dialog (Gulf-only -> India enable) */}
      <Dialog open={showRegionUpgradeDialog} onOpenChange={setShowRegionUpgradeDialog}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-blue-600">
              Enable India Portal Access
            </DialogTitle>
            <DialogDescription className="text-center text-slate-600 dark:text-slate-300 mt-2">
              This account is currently enabled for Gulf portal. Verify OTP to enable India portal access as well.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVerifyUpgradeOtp} className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <strong>Email:</strong> {upgradeUser?.email || email}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                We've sent a 6-digit OTP to your email address. OTP is valid for 10 minutes.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upgradeOtp">Enter OTP</Label>
              <Input
                id="upgradeOtp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={upgradeOtp}
                onChange={(e) => setUpgradeOtp(e.target.value)}
                maxLength={6}
                pattern="[0-9]{6}"
                required
                className="text-center text-2xl tracking-widest"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRegionUpgradeDialog(false)
                  setUpgradeOtp('')
                  setUpgradeUser(null)

                  // If the user cancels the upgrade, do NOT log them out.
                  // Route them somewhere safe to continue using the site.
                  try {
                    const target = nextPath || ''
                    if (target && target !== '/dashboard') {
                      router.replace(target)
                      return
                    }
                  } catch {
                    // ignore
                  }

                  try {
                    if (apiService.isAuthenticated()) {
                      const stored = localStorage.getItem('user')
                      const u = stored ? JSON.parse(stored) : null
                      const regions = ((u as any)?.regions || (u as any)?.preferences?.regions || [u?.region])
                        .filter(Boolean)
                        .map((r: any) => String(r).toLowerCase())
                      const hasIndia = regions.includes('india')
                      router.replace(hasIndia ? '/dashboard' : '/jobseeker-gulf-dashboard')
                      return
                    }
                  } catch {
                    // ignore
                  }

                  router.replace('/gulf-opportunities')
                }}
                disabled={upgradeLoading}
              >
                Not Now
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                disabled={upgradeLoading || upgradeOtp.length !== 6}
              >
                {upgradeLoading ? 'Verifying...' : 'Verify & Continue'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
