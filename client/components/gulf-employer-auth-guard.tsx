"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Loader2, Shield, Globe } from 'lucide-react'
import { apiService } from '@/lib/api'

interface GulfEmployerAuthGuardProps {
  children: React.ReactNode
}

export function GulfEmployerAuthGuard({ children }: GulfEmployerAuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [timeoutReached, setTimeoutReached] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setTimeoutReached(true)
      setIsChecking(false)
    }, 5000)

    if (loading) {
      return () => clearTimeout(timeout)
    }

    const hasToken = typeof window !== 'undefined' && apiService.isAuthenticated()
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null

    if (!user) {
      if (hasToken && !timeoutReached) {
        setIsChecking(true)
        return () => clearTimeout(timeout)
      }
      if (hasToken && storedUser && !timeoutReached) {
        try {
          const userData = JSON.parse(storedUser)
          if ((userData.userType === 'employer' || userData.userType === 'admin')) {
            clearTimeout(timeout)
            setIsChecking(false)
            return
          }
        } catch {}
      }
      router.replace('/employer-login')
      return
    }

    if (user.userType !== 'employer' && user.userType !== 'admin') {
      clearTimeout(timeout)
      return
    }

    // Region enforcement for Gulf (honor explicit URL override)
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    const requestedRegion = params.get('region') || undefined
    const effectiveRegion = user.region || requestedRegion
    if (effectiveRegion !== 'gulf') {
      clearTimeout(timeout)
      setIsChecking(false)
      return
    }

    clearTimeout(timeout)
    setIsChecking(false)
    return () => clearTimeout(timeout)
  }, [user, loading, router, timeoutReached])

  if (loading || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50/30 to-blue-50/30 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 bg-white/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Gulf Employer Access
            </CardTitle>
            <p className="text-slate-600 mt-2">
              {timeoutReached ? 'Taking longer than expected...' : 'Verifying your credentials...'}
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
            <p className="text-slate-600 mb-4">
              {timeoutReached 
                ? 'Still verifying your account. You can try refreshing the page.'
                : 'Please wait while we verify your employer account'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Access denied for non-gulf employers without redirecting to normal dashboard
  if (user && (user.userType === 'employer' || user.userType === 'admin')) {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    const requestedRegion = params.get('region') || undefined
    const effectiveRegion = (user as any)?.region || requestedRegion
    if (effectiveRegion === 'gulf') {
      return <>{children}</>
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50/30 to-blue-50/30 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 bg-white/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Globe className="w-7 h-7 text-emerald-700" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Access Restricted to Gulf Employers
            </CardTitle>
            <p className="text-slate-600 mt-2">
              Your employer account is not configured for the Gulf region.
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <p className="text-slate-600">
              If you need Gulf access, please contact support to enable Gulf region for your account.
            </p>
            <Button variant="outline" onClick={() => router.push('/employer-dashboard')} className="w-full">
              Go to Your Employer Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}


