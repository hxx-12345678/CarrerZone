"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Loader2, Shield, Building2 } from 'lucide-react'
import { apiService } from '@/lib/api'

interface JobseekerAuthGuardProps {
  children: React.ReactNode
}

export function JobseekerAuthGuard({ children }: JobseekerAuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [timeoutReached, setTimeoutReached] = useState(false)

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('⏰ JobseekerAuthGuard timeout reached')
      setTimeoutReached(true)
      setIsChecking(false)
    }, 5000) // 5 seconds timeout

    // While auth provider is loading, keep checking
    if (loading) {
      return () => clearTimeout(timeout)
    }

    const hasToken = typeof window !== 'undefined' && apiService.isAuthenticated()
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null

    console.log('🔍 JobseekerAuthGuard - State:', {
      loading,
      hasUser: !!user,
      userType: user?.userType,
      hasToken,
      hasStoredUser: !!storedUser,
      timeoutReached
    })
      
    if (!user) {
      // If we have a token, wait for profile fetch to hydrate user instead of redirecting
      if (hasToken && !timeoutReached) {
        console.log('🔍 JobseekerAuthGuard - Has token but no user yet, waiting...')
        setIsChecking(true)
        return () => clearTimeout(timeout)
      }
      
      // If we have stored user data but no user state, try to parse it
      if (hasToken && storedUser && !timeoutReached) {
        try {
          const userData = JSON.parse(storedUser)
          console.log('🔍 JobseekerAuthGuard - Found stored user data:', {
            id: userData.id,
            userType: userData.userType
          })
          
          // If stored user is jobseeker, allow access
          if (userData.userType === 'jobseeker') {
            console.log('✅ JobseekerAuthGuard - Stored user is jobseeker, allowing access')
            clearTimeout(timeout)
            setIsChecking(false)
            return
          }
        } catch (error) {
          console.error('Error parsing stored user data:', error)
        }
      }
      
      // No token and no user → go to login
      console.log('🔍 JobseekerAuthGuard - No valid auth, redirecting to login')
      clearTimeout(timeout)
      router.replace('/login')
      return
    }
      
    // We have a user - check if they're jobseeker
    if (user.userType !== 'jobseeker') {
      console.log('🔍 JobseekerAuthGuard - User is not jobseeker:', user.userType)
      clearTimeout(timeout)
      if (user.userType === 'employer' || user.userType === 'admin') {
        router.replace(user.region === 'gulf' ? '/gulf-dashboard' : '/employer-dashboard')
      } else {
        router.replace('/login')
      }
      return
    }
      
    // Auth OK
    console.log('✅ JobseekerAuthGuard - Auth OK, user is jobseeker')
    clearTimeout(timeout)
    setIsChecking(false)
    
    return () => clearTimeout(timeout)
  }, [user, loading, router, timeoutReached])

  // Show loading while checking authentication
  if (loading || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <User className="w-7 h-7 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              Job Seeker Access
            </CardTitle>
            <p className="text-slate-600 dark:text-slate-300 mt-2">
              {timeoutReached ? 'Taking longer than expected...' : 'Verifying your credentials...'}
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {timeoutReached 
                ? 'Still verifying your account. You can try refreshing the page.'
                : 'Please wait while we verify your job seeker account'
              }
            </p>
            {timeoutReached && (
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="mt-2"
              >
                Refresh Page
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show access denied if user is not a jobseeker
  if (user && user.userType !== 'jobseeker') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              Access Denied
            </CardTitle>
            <p className="text-slate-600 dark:text-slate-300 mt-2">
              This area is restricted to job seeker accounts only
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-slate-600 dark:text-slate-300">
              Your account is registered as an {user.userType}. Please use the appropriate dashboard.
            </p>
            <div className="space-y-2">
              {user.userType === 'employer' && (
                <Button 
                  onClick={() => router.push(user.region === 'gulf' ? '/gulf-dashboard' : '/employer-dashboard')}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Go to Employer Dashboard
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => router.push('/register')}
                className="w-full"
              >
                Register as Job Seeker
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User is authenticated and is a jobseeker, render children
  return <>{children}</>
}
