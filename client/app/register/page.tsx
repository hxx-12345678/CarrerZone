"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Briefcase, CheckCircle, Building2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { apiService } from "@/lib/api"

export default function RegisterPage() {
  const { signup, loading, error, clearError } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | 'very-strong'>('weak')
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    experience: "",
    agreeToTerms: false,
    subscribeNewsletter: true,
  })
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null)

  // Password validation function
  const validatePassword = (password: string) => {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long")
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("Password must contain at least one lowercase letter")
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("Password must contain at least one uppercase letter")
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push("Password must contain at least one number")
    }
    
    // Calculate password strength
    let strength = 0
    if (password.length >= 8) strength++
    if (/(?=.*[a-z])/.test(password)) strength++
    if (/(?=.*[A-Z])/.test(password)) strength++
    if (/(?=.*\d)/.test(password)) strength++
    if (/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) strength++
    
    if (strength <= 2) setPasswordStrength('weak')
    else if (strength <= 3) setPasswordStrength('medium')
    else if (strength <= 4) setPasswordStrength('strong')
    else setPasswordStrength('very-strong')
    
    setPasswordErrors(errors)
    return errors.length === 0
  }

  // Validate password on change
  useEffect(() => {
    if (formData.password) {
      validatePassword(formData.password)
    } else {
      setPasswordErrors([])
      setPasswordStrength('weak')
    }
  }, [formData.password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    
    // Validate password strength
    if (!validatePassword(formData.password)) {
      toast.error("Please fix password requirements before continuing")
      return
    }
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    // Validate terms agreement
    if (!formData.agreeToTerms) {
      toast.error("Please agree to the terms and conditions")
      return
    }

    try {
      const result = await signup({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        experience: formData.experience || undefined,
        agreeToTerms: formData.agreeToTerms,
        subscribeNewsletter: formData.subscribeNewsletter,
      })
      
      if (result?.user) {
        // Check if user has region preference for routing
        const userRegion = (result?.user as any)?.region
        
        if (userRegion === 'gulf') {
          toast.success("Account created successfully! Redirecting to Gulf dashboard...")
          setTimeout(() => {
            window.location.href = '/jobseeker-gulf-dashboard'
          }, 2000)
        } else {
          toast.success("Account created successfully! Redirecting to dashboard...")
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 2000)
        }
      } else {
      toast.success("Account created successfully! Please sign in to continue.")
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
      }
    } catch (error: any) {
      // Handle specific validation errors from backend
      if (error.message && error.message.includes('Validation failed')) {
        toast.error("Please check your input and try again")
      } else if (error.message && error.message.includes('already exists')) {
        // User exists - check for cross-portal registration (Gulf user registering for India portal)
        console.log('🔍 User exists, checking for cross-portal registration...')
        
        try {
          const checkResponse = await apiService.checkExistingUser(
            formData.email,
            formData.password,
            'india' // Requesting access to India portal
          )
          
          if (checkResponse.success && checkResponse.userExists) {
            // Show dialog to verify OTP for cross-portal registration
            const userData = checkResponse.data?.data || checkResponse.data
            toast.success("Password verified! OTP sent to your email.")
            
            // You can show an OTP dialog here if needed, or redirect to a cross-portal registration page
            // For now, show a message and redirect to login
            toast.info("Please check your email for OTP to complete cross-portal registration.")
            
            // Redirect to a page where they can verify OTP
            setTimeout(() => {
              window.location.href = `/register?crossPortal=true&email=${encodeURIComponent(formData.email)}`
            }, 2000)
            return
          } else if (!checkResponse.success) {
            toast.error(checkResponse.message || 'Invalid password or error occurred')
            return
          }
        } catch (checkError: any) {
          console.error('❌ Check existing user error:', checkError)
          // Fall through to show generic error
        }
        
        toast.error("An account with this email already exists. If you're a Gulf user, you can log in and access the India portal.")
      } else {
        toast.error(error.message || "Registration failed")
      }
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleOAuthSignup = async (provider: 'google' | 'facebook') => {
    try {
      setOauthLoading(provider)
      clearError()
      
      console.log('🔍 Starting OAuth signup for jobseeker with provider:', provider);
      
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
      toast.error(`Failed to sign up with ${provider}`)
    } finally {
      setOauthLoading(null)
    }
  }

  const benefits = [
    "Create your professional profile",
    "Get matched with relevant jobs",
    "Apply to multiple companies instantly",
    "Track your application status",
    "Access exclusive job opportunities",
    "Receive personalized career advice",
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
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">Start Your Career Journey</h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-8">
              Join millions of professionals and discover your next opportunity
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
            <h3 className="text-xl font-bold mb-2">Free Forever</h3>
            <p className="text-blue-100">No hidden fees. Start applying to jobs immediately after registration.</p>
          </div>
        </motion.div>

        {/* Right Side - Registration Form */}
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
          <Card className="border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl shadow-[0_20px_60px_rgba(90,0,242,0.1)] rounded-3xl border border-white/20 dark:border-slate-700/30">
            <CardHeader className="text-center pb-8 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-t-3xl border-b border-purple-100/30 dark:border-purple-800/30">
              <div className="lg:hidden mb-6">
                <Link href="/" className="flex items-center justify-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    JobPortal
                  </span>
                </Link>
              </div>
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Create Account</CardTitle>
              <p className="text-slate-600 dark:text-slate-300 mt-2 mb-4">
                Join thousands of professionals finding their dream jobs
              </p>
              
              {/* Password Requirements Notice */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-left">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">Password Requirements:</p>
                    <ul className="text-blue-700 dark:text-blue-300 space-y-0.5 text-xs">
                      <li>• At least 8 characters long</li>
                      <li>• One uppercase letter (A-Z)</li>
                      <li>• One lowercase letter (a-z)</li>
                      <li>• One number (0-9)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-slate-700 dark:text-slate-300">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        className="pl-10 h-12 border-slate-200 dark:border-slate-600 focus:border-blue-500 bg-white dark:bg-slate-700"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">
                      Phone Number (Optional)
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number (optional)"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="pl-10 h-12 border-slate-200 dark:border-slate-600 focus:border-blue-500 bg-white dark:bg-slate-700"
                      />
                    </div>
                  </div>
                </div>

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
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-10 h-12 border-slate-200 dark:border-slate-600 focus:border-blue-500 bg-white dark:bg-slate-700"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                                      <Label htmlFor="experience" className="text-slate-700 dark:text-slate-300">
                      Experience Level (Optional)
                    </Label>
                  <Select value={formData.experience} onValueChange={(value) => handleInputChange("experience", value)}>
                    <SelectTrigger className="h-12 border-slate-200 dark:border-slate-600 focus:border-blue-500 bg-white dark:bg-slate-700">
                      <SelectValue placeholder="Select your experience level (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fresher">Fresher (0-1 years)</SelectItem>
                      <SelectItem value="junior">Junior (1-3 years)</SelectItem>
                      <SelectItem value="mid">Mid-level (3-5 years)</SelectItem>
                      <SelectItem value="senior">Senior (5-8 years)</SelectItem>
                      <SelectItem value="lead">Lead (8+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className={`pl-10 pr-10 h-12 border-slate-200 dark:border-slate-600 focus:border-blue-500 bg-white dark:bg-slate-700 ${
                          formData.password && passwordErrors.length > 0 ? 'border-red-500' : ''
                        }`}
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
                    
                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                passwordStrength === 'weak' ? 'bg-red-500 w-1/4' :
                                passwordStrength === 'medium' ? 'bg-yellow-500 w-1/2' :
                                passwordStrength === 'strong' ? 'bg-blue-500 w-3/4' :
                                'bg-green-500 w-full'
                              }`}
                            />
                          </div>
                          <span className={`text-xs font-medium ${
                            passwordStrength === 'weak' ? 'text-red-500' :
                            passwordStrength === 'medium' ? 'text-yellow-500' :
                            passwordStrength === 'strong' ? 'text-blue-500' :
                            'text-green-500'
                          }`}>
                            {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                          </span>
                        </div>
                        
                        {/* Password Requirements */}
                        <div className="space-y-1">
                          {[
                            { condition: formData.password.length >= 8, text: "At least 8 characters" },
                            { condition: /(?=.*[a-z])/.test(formData.password), text: "One lowercase letter" },
                            { condition: /(?=.*[A-Z])/.test(formData.password), text: "One uppercase letter" },
                            { condition: /(?=.*\d)/.test(formData.password), text: "One number" },
                            { condition: /(?=.*[!@#$%^&*(),.?":{}|<>])/.test(formData.password), text: "One special character (optional)" }
                          ].map((req, index) => (
                            <div key={index} className="flex items-center space-x-2 text-xs">
                              {req.condition ? (
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                              ) : (
                                <AlertCircle className="w-3 h-3 text-red-500" />
                              )}
                              <span className={req.condition ? 'text-green-600' : 'text-red-600'}>
                                {req.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-300">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        className="pl-10 pr-10 h-12 border-slate-200 dark:border-slate-600 focus:border-blue-500 bg-white dark:bg-slate-700"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                      required
                    />
                    <Label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-400">
                      I agree to the{" "}
                      <Link href="/terms" className="text-blue-600 hover:text-blue-700 font-medium">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="newsletter"
                      checked={formData.subscribeNewsletter}
                      onCheckedChange={(checked) => handleInputChange("subscribeNewsletter", checked as boolean)}
                    />
                    <Label htmlFor="newsletter" className="text-sm text-slate-600 dark:text-slate-400">
                      Subscribe to job alerts and career tips
                    </Label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                >
                  {loading ? "Creating Account..." : "Create Account"}
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
                <Button variant="outline" className="h-12 bg-white dark:bg-slate-700">
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
                  Google
                </Button>
                <Button variant="outline" className="h-12 bg-white dark:bg-slate-700">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z" />
                  </svg>
                  Facebook
                </Button>
              </div>

              <div className="text-center">
                <p className="text-slate-600 dark:text-slate-400">
                  Already have an account?{" "}
                  <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                    Sign in here
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
                  <Link href="/profile" className="text-slate-400 hover:text-white transition-colors text-sm">
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
                  <Link href="/employer-login" className="text-slate-400 hover:text-white transition-colors text-sm">
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
    </div>
  )
}
