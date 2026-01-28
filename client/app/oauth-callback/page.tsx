"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { apiService } from '@/lib/api'
import { toast } from 'sonner'

export default function OAuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'setup'>('loading')
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false)
  const [provider, setProvider] = useState('')
  const [userType, setUserType] = useState('')
  const [state, setState] = useState('')

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const token = searchParams.get('token')
        const providerParam = searchParams.get('provider')
        const needsPasswordSetupParam = searchParams.get('needsPasswordSetup')
        const userTypeParam = searchParams.get('userType')
        const stateParam = searchParams.get('state')
        const error = searchParams.get('error')

        console.log('🔍 OAuth Callback - Parameters:', {
          token: token ? 'Present' : 'Missing',
          provider: providerParam,
          needsPasswordSetup: needsPasswordSetupParam,
          userType: userTypeParam,
          state: stateParam,
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
        setState(stateParam || '')
        setNeedsPasswordSetup(needsPasswordSetupParam === 'true')

        // Get user data
        const userResponse = await apiService.getCurrentUser()
        
        if (userResponse.success && userResponse.data?.user) {
          setUser(userResponse.data.user)
          
          if (needsPasswordSetupParam === 'true') {
            setStatus('setup')
            setMessage('Please set up a password for your account')
          } else {
            setStatus('success')
            setMessage(`Successfully signed in with ${providerParam || 'OAuth'}`)
            
            // Redirect based on user type and region
            setTimeout(() => {
              if (userResponse.data?.user?.userType === 'employer' || userResponse.data?.user?.userType === 'admin') {
                router.push('/employer-dashboard')
              } else if (userResponse.data?.user?.userType === 'jobseeker') {
                if (stateParam === 'gulf' || userResponse.data?.user?.region === 'gulf') {
                  router.push('/jobseeker-gulf-dashboard')
                } else {
                  router.push('/dashboard')
                }
              } else {
                router.push('/dashboard')
              }
            }, 2000)
          }
        } else {
          setStatus('error')
          setMessage('Failed to get user information')
        }

      } catch (error: any) {
        console.error('❌ OAuth callback error:', error)
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
        setStatus('success')
        setMessage('Password set successfully!')
        
        // Update user data
        if (response.data?.user) {
          setUser(response.data.user)
        }
        
        // Redirect after password setup
        setTimeout(() => {
          if (user?.userType === 'employer' || user?.userType === 'admin') {
            router.push('/employer-dashboard')
          } else if (user?.userType === 'jobseeker') {
            if (state === 'gulf' || user?.region === 'gulf') {
              router.push('/jobseeker-gulf-dashboard')
            } else {
              router.push('/dashboard')
            }
          } else {
            router.push('/dashboard')
          }
        }, 2000)
      } else {
        toast.error(response.message || 'Failed to set password')
      }
    } catch (error: any) {
      console.error('❌ Password setup error:', error)
      toast.error(error.message || 'Failed to set password')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
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
              {status === 'success' && 'Welcome back!'}
              {status === 'error' && 'Authentication Error'}
              {status === 'setup' && 'Complete your profile'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {status === 'loading' && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
                  Redirecting you to your dashboard...
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
                  onClick={() => router.push('/login')}
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
        <AlertCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
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
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
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
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
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