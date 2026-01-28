"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Building2, CheckCircle, Globe, Users, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import { apiService } from "@/lib/api"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import EmployerAuthNavbar from "@/components/employer-auth-navbar"
import EmployerAuthFooter from "@/components/employer-auth-footer"
import { DocumentVerificationDialog } from "@/components/document-verification-dialog"
import IndustryDropdown from "@/components/ui/industry-dropdown"

export default function EmployerRegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null)
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  const [formData, setFormData] = useState({
    companyId: "",
    companyName: "",
    companyAccountType: "direct", // NEW: Account type for agencies
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    companySize: "",
    industries: [] as string[], // Primary field for industries
    website: "",
    role: "recruiter",
    region: "",
    agreeToTerms: false,
    subscribeUpdates: true,
  })
  const { employerSignup, loading, error, clearError } = useAuth()
  const router = useRouter()
  // Preselect companyId from URL if coming from selection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const cid = params.get('companyId') || ''
      if (cid) {
        setFormData((prev) => ({ ...prev, companyId: cid, companyName: '' }))
      }
    }
  }, [])
  const [companySearch, setCompanySearch] = useState('')
  const [companyOptions, setCompanyOptions] = useState<any[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [showVerificationDialog, setShowVerificationDialog] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)

  useEffect(() => {
    // Only search when user has typed at least 2 characters
    if (companySearch.trim().length >= 2) {
      const load = async () => {
        setLoadingCompanies(true)
        const res = await apiService.listCompanies({ search: companySearch, limit: 10 })
        if (res.success && res.data) {
          setCompanyOptions(res.data)
        } else {
          setCompanyOptions([])
        }
        setLoadingCompanies(false)
      }
      load()
    } else {
      // Clear options when search is too short or empty
      setCompanyOptions([])
    }
  }, [companySearch])

  // Real-time validation function
  const validateField = (field: string, value: string) => {
    const errors: {[key: string]: string} = {}
    
    switch (field) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (value && !emailRegex.test(value)) {
          errors.email = 'Please enter a valid email address'
        }
        break
      case 'password':
        if (value && value.length < 8) {
          errors.password = 'Password must be at least 8 characters'
        } else if (value && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          errors.password = 'Password must contain uppercase, lowercase, and number'
        }
        break
      case 'phone':
        const phoneRegex = /^[\+]?[0-9\s\-\(\)\.]+$/
        if (value && value.length < 8) {
          errors.phone = 'Phone must be at least 8 characters'
        } else if (value && value.length > 20) {
          errors.phone = 'Phone must be 20 characters or less'
        } else if (value && !phoneRegex.test(value)) {
          errors.phone = 'Use only digits, spaces, dashes, parentheses, and dots'
        }
        break
      case 'fullName':
        if (value && value.length < 2) {
          errors.fullName = 'Name must be at least 2 characters'
        }
        break
      case 'companyName':
        if (value && value.length < 2) {
          errors.companyName = 'Company name must be at least 2 characters'
        }
        break
    }
    
    setValidationErrors(prev => ({ ...prev, ...errors }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic frontend validation
    if (!formData.companyId && !formData.companyName.trim()) {
      toast.error('Select a company to join or enter a new company name')
      return
    }
    
    if (!formData.fullName.trim()) {
      toast.error('Full name is required')
      return
    }
    
    if (!formData.email.trim()) {
      toast.error('Email is required')
      return
    }
    
    if (!formData.phone.trim()) {
      toast.error('Phone number is required')
      return
    }
    
    if (!formData.region) {
      toast.error('Please select a region')
      return
    }
    
    if (!formData.password) {
      toast.error('Password is required')
      return
    }
    
    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    // Validate terms agreement
    if (!formData.agreeToTerms) {
      toast.error('Please agree to the Terms of Service and Privacy Policy')
      return
    }

    try {
      clearError()
      const result = await employerSignup({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        companyId: formData.companyId || undefined,
        companyName: formData.companyId ? undefined : formData.companyName,
        phone: formData.phone,
        companySize: formData.companySize,
        industries: formData.industries,
        website: formData.website,
        role: formData.role,
        region: formData.region,
        companyAccountType: formData.companyAccountType, // Include agency type
        agreeToTerms: formData.agreeToTerms,
        subscribeUpdates: formData.subscribeUpdates,
      })
      
      if (result?.user?.userType === 'employer' || result?.user?.userType === 'admin') {
        // Show document verification dialog for all employer registrations
        setRegistrationSuccess(true)
        setShowVerificationDialog(true)
        
        // Prepare company data for verification dialog
        const company: any = result?.company
        // Store company data for verification dialog
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('verificationCompanyData', JSON.stringify({
            name: formData.companyId ? company?.name : formData.companyName,
            industries: formData.industries,
            website: formData.website,
            companyAccountType: formData.companyAccountType
          }))
        }
        
        toast.success('Account created successfully! Please upload verification documents.')
      } else {
        toast.error('Failed to create employer account. Please try again.')
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      
      // Handle specific validation errors with actionable guidance
      if (error.message && error.message.includes('Validation failed')) {
        if (error.errors && Array.isArray(error.errors)) {
          // Process each validation error and provide specific guidance
          const errorGuidance = error.errors.map((err: any) => {
            const field = err.path
            const message = err.msg
            
            // Provide specific guidance for each field
            switch (field) {
              case 'email':
                return '📧 Email: Please enter a valid email address (e.g., john@company.com)'
              case 'password':
                if (message.includes('8 characters')) {
                  return '🔒 Password: Must be at least 8 characters long'
                } else if (message.includes('uppercase')) {
                  return '🔒 Password: Must contain uppercase letter, lowercase letter, and number (e.g., MyPass123)'
                } else {
                  return '🔒 Password: Must be 8+ characters with uppercase, lowercase, and number'
                }
              case 'fullName':
                return '👤 Full Name: Must be 2-100 characters (e.g., John Doe)'
              case 'companyName':
                return '🏢 Company Name: Must be 2-200 characters (e.g., Acme Corporation)'
              case 'phone':
                if (message.includes('8 and 20 characters')) {
                  return '📞 Phone: Must be 8-20 characters (e.g., +1234567890 or 123-456-7890)'
                } else {
                  return '📞 Phone: Use only digits, spaces, dashes, parentheses, and dots'
                }
              case 'companySize':
                return '📊 Company Size: Select from the dropdown (1-50, 51-200, etc.)'
              case 'industries':
                return '🏭 Industries: Select at least one industry from the dropdown'
              default:
                return `${field}: ${message}`
            }
          }).join('\n\n')
          
          toast.error(`Please fix the following issues:\n\n${errorGuidance}`, {
            duration: 8000, // Show for 8 seconds
            style: {
              whiteSpace: 'pre-line',
              maxWidth: '400px'
            }
          })
        } else {
          toast.error('Please check your input and try again')
        }
      } else if (error.message && error.message.includes('already exists')) {
        toast.error('❌ An account with this email already exists. Please use a different email or try logging in.')
      } else if (error.message && error.message.includes('phone number')) {
        toast.error('📞 Phone: Use only digits, spaces, dashes, parentheses, and dots (e.g., +1234567890 or 123-456-7890)')
      } else {
        toast.error(error.message || 'Registration failed. Please try again.')
      }
    }
  }

  const handleOAuthSignup = async (provider: 'google' | 'facebook') => {
    try {
      setOauthLoading(provider)
      clearError()
      
      // Get OAuth URLs from backend for employer
      const response = await apiService.getOAuthUrls('employer')
      
      if (response.success && response.data) {
        const url = provider === 'google' ? response.data.google : response.data.facebook
        // Redirect to OAuth provider
        window.location.href = url
      } else {
        toast.error('Failed to get OAuth URL')
      }
    } catch (error: any) {
      console.error(`${provider} OAuth error:`, error)
      toast.error(`Failed to sign up with ${provider}`)
    } finally {
      setOauthLoading(null)
    }
  }

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    
    // Validate field in real-time
    if (typeof value === 'string') {
      validateField(field, value)
    }
  }

  const benefits = [
    "Access to 50M+ job seekers",
    "AI-powered candidate matching",
    "Advanced screening tools",
    "Dedicated account manager",
    "Priority job listing",
    "Detailed analytics & insights",
    "Professional company branding & showcase",
  ]

  return (
    <div className="min-h-screen bg-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <EmployerAuthNavbar variant="register" />

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-300/8 to-cyan-300/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-violet-300/8 to-purple-300/8 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-blue-300/6 to-indigo-300/6 rounded-full blur-3xl animate-pulse delay-1000"></div>
        {/* Wide translucent blue gradient strip */}
        <div className="absolute top-1/3 left-0 right-0 h-24 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-indigo-400/20"></div>
      </div>

      <div className="relative flex items-start justify-center p-2 sm:p-4 pt-4 sm:pt-8 min-h-[calc(100vh-80px)] bg-gradient-to-br from-blue-200/40 via-cyan-200/30 to-indigo-200/40">
        <div className="relative w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-start pt-4 sm:pt-8">
          {/* Left Side - Benefits */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="text-center lg:text-left">
              <h1 className="serif-heading text-4xl sm:text-5xl md:text-6xl font-bold heading-gradient mb-6 leading-normal">Hire the Best Talent</h1>
              <p className="text-base sm:text-lg lg:text-xl text-[#5B5B6A] dark:text-slate-300 mb-8 leading-relaxed font-medium">
                Join 50,000+ companies that trust JobPortal for their hiring needs
              </p>
            </div>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                  className="flex items-center space-x-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg text-[#5B5B6A] dark:text-slate-300 font-semibold">{benefit}</span>
                </motion.div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Start Free, Scale Fast</h3>
              <p className="text-blue-100">
                Post your first job for free and upgrade as you grow. No setup fees, no hidden costs.
              </p>
            </div>

            {/* Company Branding Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white"
            >
              <h3 className="text-xl font-bold mb-3 flex items-center">
                <Building2 className="w-6 h-6 mr-2" />
                Professional Company Branding
              </h3>
              <div className="space-y-3 text-purple-100">
                <p className="text-sm leading-relaxed">
                  <strong className="text-white">Showcase Your Company:</strong> Create a compelling company profile that attracts top talent and builds your employer brand.
                </p>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-300 flex-shrink-0" />
                    <span>Custom company logo and branding</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-300 flex-shrink-0" />
                    <span>Detailed company information and culture</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-300 flex-shrink-0" />
                    <span>Employee testimonials and reviews</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-300 flex-shrink-0" />
                    <span>Company benefits and perks showcase</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-300 flex-shrink-0" />
                    <span>Career growth opportunities display</span>
                  </div>
                </div>
                <p className="text-xs text-purple-200 mt-3">
                  Stand out from competitors and attract the best candidates with a professional company presence that reflects your values and culture.
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Registration Form */}
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <Card className="border-0 bg-white/50 backdrop-blur-2xl border border-white/30 shadow-2xl rounded-3xl">
              <CardHeader className="text-center pb-6 pt-8">
                <CardTitle className="serif-heading text-3xl font-bold text-[#1E1E2F]">
                  Create Employer Account
                </CardTitle>
                <p className="text-[#5B5B6A] dark:text-slate-300 mt-2 text-lg leading-relaxed">Start hiring top talent in minutes</p>
              </CardHeader>

                             <CardContent className="space-y-4">
                <div className="text-center text-sm text-[#5B5B6A] dark:text-slate-300">
                  Already have a company in the system?{' '}
                  <Link href="/employer-join-company" className="text-blue-600 hover:text-blue-700 font-semibold">
                    Join existing company
                  </Link>
                </div>
                {/* Company selection or creation */}
                <div className="space-y-2">
                  <Label className="font-semibold text-[#1E1E2F] dark:text-slate-300">Join Existing Company</Label>
                  <div className="space-y-2">
                    <Input value={companySearch} onChange={(e) => setCompanySearch(e.target.value)} placeholder="Search companies" className="h-12 border-white/30 bg-white/10 backdrop-blur-md focus:border-blue-500 focus:bg-white/20 transition-all duration-300 rounded-xl" />
                    {companySearch.trim().length >= 2 && companyOptions.length > 0 && (
                      <div className="border rounded max-h-48 overflow-auto bg-white dark:bg-slate-800 shadow-lg">
                        {loadingCompanies ? (
                          <div className="p-3 text-sm text-slate-500 flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            Searching companies...
                          </div>
                        ) : companyOptions.map((c) => (
                          <button key={c.id} type="button" onClick={() => handleInputChange('companyId', c.id)} className={`w-full text-left px-3 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-b-0 ${formData.companyId === c.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                            <div className="font-medium text-slate-900 dark:text-white">{c.name}</div>
                            <div className="text-xs text-slate-500 mt-1">{(c.industries && c.industries.length > 0 ? c.industries[0] : 'Other')} • {c.companySize}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    {companySearch.trim().length >= 2 && !loadingCompanies && companyOptions.length === 0 && (
                      <div className="border rounded p-3 text-sm text-slate-500 bg-white dark:bg-slate-800 shadow-lg">
                        No companies found matching "{companySearch}"
                      </div>
                    )}
                    {companySearch.trim().length > 0 && companySearch.trim().length < 2 && (
                      <div className="text-xs text-slate-500 p-2">
                        Type at least 2 characters to search companies
                      </div>
                    )}
                    {formData.companyId && (
                      <div className="text-xs text-green-700">Selected company ID: {formData.companyId}</div>
                    )}
                    <p className="text-xs text-slate-500">Selecting a company hides company creation fields.</p>
                  </div>
                </div>

                {formData.companyId ? (
                  <div className="space-y-2">
                    <Label className="font-semibold text-[#1E1E2F] dark:text-slate-300">Your Role</Label>
                    <Select value={formData.role} onValueChange={(v) => handleInputChange('role', v)}>
                      <SelectTrigger className="h-12 border-slate-200 dark:border-slate-600">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recruiter">Recruiter</SelectItem>
                        <SelectItem value="hiring_manager">Hiring Manager</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">Admins are auto-assigned only when creating a new company.</p>
                  </div>
                ) : (
                  <>
                    {/* Account Type Selection - NEW */}
                  <div className="space-y-2">
                      <Label className="font-semibold text-[#1E1E2F] dark:text-slate-300">Account Type *</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <button
                          type="button"
                          onClick={() => handleInputChange("companyAccountType", "direct")}
                          className={`p-4 sm:p-6 border-2 rounded-lg transition-all ${
                            formData.companyAccountType === "direct"
                              ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                              : "border-slate-200 dark:border-slate-600 hover:border-blue-300"
                          }`}
                        >
                          <div className="flex flex-col items-center text-center">
                            <Building2 className={`w-10 h-10 mb-3 ${formData.companyAccountType === "direct" ? "text-blue-600" : "text-slate-400"}`} />
                            <span className="font-semibold text-base">Direct Employer</span>
                            <span className="text-xs text-slate-500 mt-2">Hiring for your own company</span>
                          </div>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleInputChange("companyAccountType", "agency")}
                          className={`p-4 sm:p-6 border-2 rounded-lg transition-all ${
                            formData.companyAccountType === "agency"
                              ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
                              : "border-slate-200 dark:border-slate-600 hover:border-purple-300"
                          }`}
                        >
                          <div className="flex flex-col items-center text-center">
                            <Users className={`w-10 h-10 mb-3 ${formData.companyAccountType === "agency" ? "text-purple-600" : "text-slate-400"}`} />
                            <span className="font-semibold text-base">Agency/Consultancy</span>
                            <span className="text-xs text-slate-500 mt-2">Recruiting agencies & consulting firms - Post for multiple clients</span>
                          </div>
                        </button>
                      </div>
                      
                      {/* Agency Info Banner */}
                      {formData.companyAccountType === "agency" && (
                        <div className="bg-amber-100/30 backdrop-blur-xl border border-amber-200/50 rounded-2xl p-6 mt-4 shadow-lg">
                          <h4 className="text-amber-900 dark:text-amber-200 font-semibold mb-3 flex items-center text-base">
                            <div className="w-7 h-7 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mr-3">
                              <span className="text-white text-xs">ℹ</span>
                            </div>
                            Agency/Consultancy Account - Additional Verification Required
                          </h4>
                          <ul className="text-amber-800 dark:text-amber-300 text-sm space-y-2">
                            <li className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              You'll need to upload GST certificate & business documents
                            </li>
                            <li className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              Each client requires separate authorization
                            </li>
                            <li className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              Verification usually takes 1-3 business days
                            </li>
                            <li className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              Once verified, you can post jobs for multiple clients
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="font-semibold text-[#1E1E2F] dark:text-slate-300">
                        {formData.companyAccountType === "direct" ? "Company Name" : "Agency Name"} *
                      </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <Input 
                          id="companyName" 
                          type="text" 
                          placeholder={formData.companyAccountType === "direct" ? "Enter your company name" : "Enter your agency name"} 
                          value={formData.companyName} 
                          onChange={(e) => handleInputChange("companyName", e.target.value)} 
                          className="pl-10 h-12 border-white/30 bg-white/10 backdrop-blur-md focus:border-blue-500 focus:bg-white/20 transition-all duration-300 rounded-xl" 
                          required
                        />
                    </div>
                    <p className="text-slate-500 text-xs">Creating a company will make you the Admin by default.</p>
                  </div>
                  </>
                )}

                 {/* Validation Status */}
                 {Object.keys(validationErrors).length > 0 ? (
                   <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                     <h3 className="text-red-800 dark:text-red-200 font-medium mb-2 flex items-center">
                       <span className="mr-2">⚠️</span>
                       Please fix the following issues:
                     </h3>
                     <ul className="text-red-700 dark:text-red-300 text-sm space-y-1">
                       {Object.entries(validationErrors).map(([field, message]) => (
                         <li key={field} className="flex items-start">
                           <span className="mr-2">•</span>
                           <span className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</span>
                           <span className="ml-1">{message}</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                 ) : (
                   formData.companyName && formData.fullName && formData.email && formData.phone && formData.region && formData.password && (
                     <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                       <h3 className="text-green-800 dark:text-green-200 font-medium mb-2 flex items-center">
                         <span className="mr-2">✅</span>
                         All required fields look good!
                       </h3>
                       <p className="text-green-700 dark:text-green-300 text-sm">
                         You can now submit your registration.
                       </p>
                     </div>
                   )
                 )}
                 
                 <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="font-semibold text-[#1E1E2F] dark:text-slate-300">
                        Your Full Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange("fullName", e.target.value)}
                          className="pl-10 h-12 border-white/30 bg-white/10 backdrop-blur-md focus:border-blue-500 focus:bg-white/20 transition-all duration-300 rounded-xl"
                          required
                        />
                      </div>
                    </div>

                                         <div className="space-y-2">
                       <Label htmlFor="phone" className="font-semibold text-[#1E1E2F] dark:text-slate-300">
                         Phone Number
                       </Label>
                       <div className="relative">
                         <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                         <Input
                           id="phone"
                           type="tel"
                           placeholder="e.g., +1234567890 or 123-456-7890"
                           value={formData.phone}
                           onChange={(e) => handleInputChange("phone", e.target.value)}
                           className={`pl-10 h-12 border-white/30 bg-white/10 backdrop-blur-md focus:border-blue-500 focus:bg-white/20 transition-all duration-300 rounded-xl ${
                             validationErrors.phone ? 'border-red-500 focus:border-red-500' : ''
                           }`}
                           required
                         />
                       </div>
                       {validationErrors.phone && (
                         <p className="text-red-500 text-sm mt-1 flex items-center">
                           <span className="mr-1">⚠️</span>
                           {validationErrors.phone}
                         </p>
                       )}
                       <p className="text-slate-500 text-xs">
                         💡 Acceptable formats: +1234567890, 123-456-7890, (123) 456-7890
                       </p>
                     </div>
                  </div>

                                     <div className="space-y-2">
                     <Label htmlFor="email" className="font-semibold text-[#1E1E2F] dark:text-slate-300">
                       Work Email Address
                     </Label>
                     <div className="relative">
                       <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                       <Input
                         id="email"
                         type="email"
                         placeholder="Enter your work email"
                         value={formData.email}
                         onChange={(e) => handleInputChange("email", e.target.value)}
                         className={`pl-10 h-12 border-white/30 bg-white/10 backdrop-blur-md focus:border-blue-500 focus:bg-white/20 transition-all duration-300 rounded-xl ${
                           validationErrors.email ? 'border-red-500 focus:border-red-500' : ''
                         }`}
                         required
                       />
                     </div>
                     {validationErrors.email && (
                       <p className="text-red-500 text-sm mt-1 flex items-center">
                         <span className="mr-1">⚠️</span>
                         {validationErrors.email}
                       </p>
                     )}
                     <p className="text-slate-500 text-xs">
                       💡 Example: john.doe@company.com
                     </p>
                   </div>

                  {!formData.companyId && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companySize" className="text-slate-700 dark:text-slate-300">
                        Company Size
                      </Label>
                      <Select
                        value={formData.companySize}
                        onValueChange={(value) => handleInputChange("companySize", value)}
                      >
                        <SelectTrigger className="h-12 border-white/30 bg-white/10 backdrop-blur-md focus:border-blue-500 focus:bg-white/20 transition-all duration-300 rounded-xl">
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-50">1-50 employees</SelectItem>
                          <SelectItem value="51-200">51-200 employees</SelectItem>
                          <SelectItem value="201-500">201-500 employees</SelectItem>
                          <SelectItem value="500-1000">500-1000 employees</SelectItem>
                          <SelectItem value="1000+">1000+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industries" className="text-slate-700 dark:text-slate-300">
                        Industries *
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        className={`w-full h-12 justify-between border-white/30 bg-white/10 backdrop-blur-md focus:border-blue-500 focus:bg-white/20 transition-all duration-300 rounded-xl ${formData.industries.length > 0 ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}
                        onClick={() => setShowIndustryDropdown(true)}
                      >
                        <span>{formData.industries.length > 0 ? `${formData.industries.length} industry${formData.industries.length > 1 ? 'ies' : ''} selected` : 'Select industries'}</span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      
                      {formData.industries.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.industries.map((industry, index) => (
                            <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                              {industry}
                              <button
                                type="button"
                                onClick={() => {
                                  const newIndustries = formData.industries.filter((_, i) => i !== index)
                                  handleInputChange("industries", newIndustries)
                                }}
                                className="ml-2 hover:text-blue-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {showIndustryDropdown && (
                        <IndustryDropdown
                          selectedIndustries={formData.industries}
                          onIndustryChange={(industries: string[]) => {
                            handleInputChange("industries", industries)
                          }}
                          onClose={() => setShowIndustryDropdown(false)}
                        />
                      )}
                    </div>
                  </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="region" className="text-slate-700 dark:text-slate-300">
                      Region of Operation *
                    </Label>
                    <Select value={formData.region} onValueChange={(value) => handleInputChange("region", value)}>
                      <SelectTrigger className="h-12 border-slate-200 dark:border-slate-600 focus:border-blue-500 bg-white dark:bg-slate-700">
                        <SelectValue placeholder="Select your region of operation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="india">India</SelectItem>
                        <SelectItem value="gulf">Gulf Region (UAE, Saudi Arabia, Qatar, etc.)</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-slate-500 text-xs">
                      💡 This determines which dashboard you'll access after registration
                    </p>
                  </div>

                  {!formData.companyId && (
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-slate-700 dark:text-slate-300">
                      Company Website (Optional)
                    </Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://yourcompany.com"
                        value={formData.website}
                        onChange={(e) => handleInputChange("website", e.target.value)}
                        className="pl-10 h-12 border-slate-200 dark:border-slate-600 focus:border-blue-500 bg-white dark:bg-slate-700"
                      />
                    </div>
                  </div>
                  )}

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
                             validationErrors.password ? 'border-red-500 focus:border-red-500' : ''
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
                       {validationErrors.password && (
                         <p className="text-red-500 text-sm mt-1 flex items-center">
                           <span className="mr-1">⚠️</span>
                           {validationErrors.password}
                         </p>
                       )}
                       <p className="text-slate-500 text-xs">
                         💡 Must be 8+ characters with uppercase, lowercase, and number (e.g., MyPass123)
                       </p>
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
                        id="updates"
                        checked={formData.subscribeUpdates}
                        onCheckedChange={(checked) => handleInputChange("subscribeUpdates", checked as boolean)}
                      />
                      <Label htmlFor="updates" className="text-sm text-slate-600 dark:text-slate-400">
                        Send me product updates and hiring tips
                      </Label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 btn-shimmer btn-ripple text-base font-semibold rounded-xl"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Create Employer Account'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>

                                     {error && (
                     <div className="text-red-600 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                       {error}
                     </div>
                   )}
                 </form>

                 {/* Helpful Tips */}
                 <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-lg">
                   <h3 className="text-[#1E1E2F] dark:text-white font-semibold mb-3 text-lg">
                     Registration Tips
                   </h3>
                   <ul className="text-[#5B5B6A] dark:text-slate-300 text-sm space-y-2">
                     <li className="flex items-start">
                       <span className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                       Use your work email address for better verification
                     </li>
                     <li className="flex items-start">
                       <span className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                       Phone number can include country code, spaces, and dashes
                     </li>
                     <li className="flex items-start">
                       <span className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                       Password must be strong: 8+ characters with uppercase, lowercase, and number
                     </li>
                     <li className="flex items-start">
                       <span className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                       Company name should be your official business name
                     </li>
                     <li className="flex items-start">
                       <span className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                       All fields marked with * are required
                     </li>
                   </ul>
                 </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-wider">
                    <span className="bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-[#5B5B6A] font-medium">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 bg-white/10 backdrop-blur-md hover:bg-white/20 border-white/30 transition-all duration-300 rounded-xl"
                    onClick={() => handleOAuthSignup('google')}
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
                    className="h-12 bg-white/10 backdrop-blur-md hover:bg-white/20 border-white/30 transition-all duration-300 rounded-xl"
                    onClick={() => handleOAuthSignup('facebook')}
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

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-wider">
                    <span className="bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-[#5B5B6A] font-medium">Already have an account?</span>
                  </div>
                </div>

                <div className="text-center">
                  <Link href="/employer-login">
                    <Button variant="outline" className="w-full h-12 bg-white/10 backdrop-blur-md hover:bg-white/20 border-white/30 transition-all duration-300 rounded-xl">
                      Sign In to Your Account
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <EmployerAuthFooter />

      {/* Document Verification Dialog */}
      <DocumentVerificationDialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
        onSuccess={() => {
          // After successful verification submission, show success message
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('verificationCompanyData')
          }
          // Redirect to login with a message
          toast.success('Your documents have been submitted successfully! Our admin team will review your submission within 2-4 business hours. You will receive an email notification once your account is verified. Please check back later to access your employer dashboard.', {
            duration: 8000
          })
          setTimeout(() => {
            router.push('/employer-login')
          }, 2000)
        }}
        companyData={typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('verificationCompanyData') || '{}') : {}}
      />
    </div>
  )
}

