"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle, AlertCircle, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { apiService } from '@/lib/api'
import { toast } from 'sonner'

export default function EmployerOAuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'setup' | 'profile'>('loading')
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false)
  const [provider, setProvider] = useState('')
  const [userType, setUserType] = useState('')

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const token = searchParams.get('token')
        const providerParam = searchParams.get('provider')
        const needsPasswordSetupParam = searchParams.get('needsPasswordSetup')
        const userTypeParam = searchParams.get('userType')
        const error = searchParams.get('error')

        console.log('🔍 Employer OAuth Callback - Parameters:', {
          token: token ? 'Present' : 'Missing',
          provider: providerParam,
          needsPasswordSetup: needsPasswordSetupParam,
          userType: userTypeParam,
          error
        })

        if (error) {
          setStatus('error')
          setMessage(decodeURIComponent(error))
          return
        }

        if (!token) {
          setStatus('error')
          setMessage('No authentication token received')
          return
        }

        // Store the token
        apiService.setToken(token)
        setProvider(providerParam || '')
        setUserType(userTypeParam || '')
        setNeedsPasswordSetup(needsPasswordSetupParam === 'true')

        // Get user data
        const userResponse = await apiService.getCurrentUser()
        
        if (userResponse.success && userResponse.data?.user) {
          setUser(userResponse.data.user)
          
          if (needsPasswordSetupParam === 'true') {
            setStatus('setup')
            setMessage('Please set up a password for your account')
          } else if (!userResponse.data.user.companyId) {
            setStatus('profile')
            setMessage('Please complete your employer profile setup')
          } else {
            setStatus('success')
            setMessage(`Successfully signed in with ${providerParam || 'OAuth'}`)
            
            // Redirect to employer dashboard (respect Gulf region)
            setTimeout(() => {
              const region = (userResponse.data?.user as any)?.region
              router.push(region === 'gulf' ? '/gulf-dashboard' : '/employer-dashboard')
            }, 2000)
          }
        } else {
          setStatus('error')
          setMessage('Failed to get user information')
        }

      } catch (error: any) {
        console.error('❌ Employer OAuth callback error:', error)
        setStatus('error')
        setMessage(error.message || 'Authentication failed')
      }
    }

    handleOAuthCallback()
  }, [router, searchParams])

  const handlePasswordSetup = async (password: string) => {
    try {
      const response = await apiService.setupPassword(password)
      
      if (response.success) {
        setStatus('profile')
        setMessage('Password set successfully! Now complete your profile.')
        
        // Update user data
        if (response.data?.user) {
          setUser(response.data.user)
        }
      } else {
        toast.error(response.message || 'Failed to set password')
      }
    } catch (error: any) {
      console.error('❌ Password setup error:', error)
      toast.error(error.message || 'Failed to set password')
    }
  }

  const handleProfileSetup = async (profileData: any) => {
    try {
      const response = await apiService.completeEmployerProfile(profileData)
      
      if (response.success) {
        setStatus('success')
        setMessage('Profile setup completed successfully!')
        
        // Update user data
        if (response.data?.user) {
          setUser(response.data.user)
        }
        
        // Redirect to employer dashboard (respect Gulf region)
        setTimeout(() => {
          const region = (user as any)?.region
          router.push(region === 'gulf' ? '/gulf-dashboard' : '/employer-dashboard')
        }, 2000)
      } else {
        toast.error(response.message || 'Failed to complete profile setup')
      }
    } catch (error: any) {
      console.error('❌ Profile setup error:', error)
      toast.error(error.message || 'Failed to complete profile setup')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/30 to-teal-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              {status === 'loading' && 'Signing you in...'}
              {status === 'success' && 'Welcome to your employer dashboard!'}
              {status === 'error' && 'Authentication Error'}
              {status === 'setup' && 'Complete your account setup'}
              {status === 'profile' && 'Complete your employer profile'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {status === 'loading' && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  Please wait while we sign you in...
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  {message}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Redirecting you to your employer dashboard...
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  {message}
                </p>
                <Button 
                  onClick={() => router.push('/employer-login')}
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            )}

            {status === 'setup' && (
              <PasswordSetupForm 
                onSubmit={handlePasswordSetup}
                provider={provider}
                userType={userType}
              />
            )}

            {status === 'profile' && (
              <EmployerProfileSetupForm 
                onSubmit={handleProfileSetup}
                user={user}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// Password setup form component
function PasswordSetupForm({ onSubmit, provider, userType }: { 
  onSubmit: (password: string) => void
  provider: string
  userType: string 
}) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }
    
    setLoading(true)
    await onSubmit(password)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <AlertCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Set up a password for your {provider} account to enable local login
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white"
            placeholder="Confirm your password"
            required
          />
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={loading || !password || !confirmPassword}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Setting up...
          </>
        ) : (
          'Complete Setup'
        )}
      </Button>
    </form>
  )
}

// Employer profile setup form component
function EmployerProfileSetupForm({ onSubmit, user }: { 
  onSubmit: (profileData: any) => void
  user: any
}) {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: '',
    companyName: '',
    companyId: '',
    region: 'india',
    action: 'create' // 'create' or 'join'
  })
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [companySearch, setCompanySearch] = useState('')

  // Search companies when user types
  useEffect(() => {
    const searchCompanies = async () => {
      if (companySearch.length < 2) {
        setCompanies([])
        return
      }
      
      setSearchLoading(true)
      try {
        const response = await apiService.listCompanies({ search: companySearch, limit: 10 })
        if (response.success && response.data) {
          setCompanies(response.data)
        }
      } catch (error) {
        console.error('Error searching companies:', error)
      }
      setSearchLoading(false)
    }

    const timeoutId = setTimeout(searchCompanies, 300)
    return () => clearTimeout(timeoutId)
  }, [companySearch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.region) {
      toast.error('Please fill in all required fields')
      return
    }
    
    if (formData.action === 'create' && !formData.companyName) {
      toast.error('Please provide a company name')
      return
    }
    
    if (formData.action === 'join' && !formData.companyId) {
      toast.error('Please select a company to join')
      return
    }
    
    setLoading(true)
    await onSubmit({ ...formData, action: formData.action })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <Building2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Complete your employer profile to get started
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              First Name *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white"
              placeholder="First name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white"
              placeholder="Last name"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white"
            placeholder="Phone number"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Region *
          </label>
          <select
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white"
            required
          >
            <option value="india">India</option>
            <option value="gulf">Gulf</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Company Setup *
          </label>
          
          {/* Action Selection */}
          <div className="flex gap-4 mb-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="action"
                value="create"
                checked={formData.action === 'create'}
                onChange={(e) => setFormData({ ...formData, action: e.target.value, companyId: '', companyName: '' })}
                className="mr-2"
              />
              <span className="text-sm">Create New Company</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="action"
                value="join"
                checked={formData.action === 'join'}
                onChange={(e) => setFormData({ ...formData, action: e.target.value, companyId: '', companyName: '' })}
                className="mr-2"
              />
              <span className="text-sm">Join Existing Company</span>
            </label>
          </div>

          {/* Create New Company */}
          {formData.action === 'create' && (
            <div>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white"
                placeholder="Enter your company name"
                required
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                You'll be assigned as the Hiring Manager
              </p>
            </div>
          )}

          {/* Join Existing Company */}
          {formData.action === 'join' && (
            <div>
              <input
                type="text"
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-slate-700 dark:text-white"
                placeholder="Search for your company..."
                required
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                You'll be assigned as a Recruiter
              </p>
              
              {/* Company Search Results */}
              {companySearch.length >= 2 && (
                <div className="mt-2 max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-md">
                  {searchLoading ? (
                    <div className="p-3 text-center text-sm text-slate-500">Searching...</div>
                  ) : companies.length > 0 ? (
                    companies.map((company) => (
                      <div
                        key={company.id}
                        onClick={() => {
                          setFormData({ ...formData, companyId: company.id })
                          setCompanySearch(company.name)
                          setCompanies([])
                        }}
                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-600 last:border-b-0"
                      >
                        <div className="font-medium text-sm">{company.name}</div>
                        <div className="text-xs text-slate-500">
                          {company.industry} • {company.companySize}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-sm text-slate-500">No companies found</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Setting up profile...
          </>
        ) : (
          'Complete Profile Setup'
        )}
      </Button>
    </form>
  )
}