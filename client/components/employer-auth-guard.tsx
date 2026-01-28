"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Loader2, Shield } from 'lucide-react'
import { apiService } from '@/lib/api'

interface EmployerAuthGuardProps {
  children: React.ReactNode
}

export function EmployerAuthGuard({ children }: EmployerAuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [timeoutReached, setTimeoutReached] = useState(false)

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('⏰ EmployerAuthGuard timeout reached')
      setTimeoutReached(true)
      setIsChecking(false)
    }, 5000) // Reduced to 5 seconds for faster response

    // While auth provider is loading, keep checking
    if (loading) {
      return () => clearTimeout(timeout)
    }

    const hasToken = typeof window !== 'undefined' && apiService.isAuthenticated()
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null

    console.log('🔍 EmployerAuthGuard - State:', {
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
        console.log('🔍 EmployerAuthGuard - Has token but no user yet, waiting...')
        setIsChecking(true)
        return () => clearTimeout(timeout)
      }
      
      // If we have stored user data but no user state, try to parse it
      if (hasToken && storedUser && !timeoutReached) {
        try {
          const userData = JSON.parse(storedUser)
          console.log('🔍 EmployerAuthGuard - Found stored user data:', {
            id: userData.id,
            userType: userData.userType
          })
          
          // If stored user is employer/admin, allow access
          if (userData.userType === 'employer' || userData.userType === 'admin') {
            console.log('✅ EmployerAuthGuard - Stored user is employer, allowing access')
            clearTimeout(timeout)
            setIsChecking(false)
            return
          }
        } catch (error) {
          console.error('Error parsing stored user data:', error)
        }
      }
      
      // No token and no user → go to employer-login
      console.log('🔍 EmployerAuthGuard - No valid auth, redirecting to employer-login')
      clearTimeout(timeout)
      router.replace('/employer-login')
      return
    }
      
    // We have a user - check if they're employer or admin
    if (user.userType !== 'employer' && user.userType !== 'admin') {
      console.log('🔍 EmployerAuthGuard - User is not employer/admin:', user.userType)
      clearTimeout(timeout)
      if (user.userType === 'jobseeker') {
        router.replace('/dashboard')
      } else {
        router.replace('/login')
      }
      return
    }

    // Check if user account is pending verification
    if (user.accountStatus === 'pending_verification') {
      console.log('⏳ EmployerAuthGuard - Account pending verification:', user.accountStatus)
      clearTimeout(timeout)
      setIsChecking(false)
      return
    }

    // Check if user account is rejected
    if (user.accountStatus === 'rejected') {
      console.log('❌ EmployerAuthGuard - Account rejected:', user.accountStatus)
      clearTimeout(timeout)
      router.replace('/employer-register')
      return
    }
      
    // Auth OK
    console.log('✅ EmployerAuthGuard - Auth OK, user is employer/admin')
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
                <Building2 className="w-7 h-7 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              Employer Access
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
                : 'Please wait while we verify your employer account'
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

  // Show verification pending message
  if (user && user.accountStatus === 'pending_verification') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-amber-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              Verification Pending
            </CardTitle>
            <p className="text-slate-600 dark:text-slate-300 mt-2">
              Your employer account is being verified
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-slate-600 dark:text-slate-300">
              We are reviewing your submitted documents. You will be notified once verification is complete.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.reload()}
                variant="default"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Check Verification Status
              </Button>
              <Button 
                onClick={async () => {
                  // Log out the user first to prevent redirect loop
                  try {
                    await apiService.logout()
                    localStorage.clear()
                    sessionStorage.clear()
                    router.push('/employer-login')
                  } catch (error) {
                    console.error('Error during logout:', error)
                    // Fallback: clear storage and redirect
                    localStorage.clear()
                    sessionStorage.clear()
                    router.push('/employer-login')
                  }
                }}
                variant="outline"
                className="w-full"
              >
                Logout & Return to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show access denied if user is not an employer or admin
  if (user && user.userType !== 'employer' && user.userType !== 'admin') {
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
              This area is restricted to employer and admin accounts only
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-slate-600 dark:text-slate-300">
              Your account is registered as a job seeker. Please use the job seeker dashboard.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => router.push('/dashboard')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Go to Job Seeker Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/employer-register')}
                className="w-full"
              >
                Register as Employer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User is authenticated and is an employer, render children
  return <>{children}</>
}
