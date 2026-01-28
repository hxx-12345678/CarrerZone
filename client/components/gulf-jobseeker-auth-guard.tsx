"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Loader2, Shield, Globe } from 'lucide-react'
import { apiService } from '@/lib/api'

interface GulfJobseekerAuthGuardProps {
  children: React.ReactNode
}

export function GulfJobseekerAuthGuard({ children }: GulfJobseekerAuthGuardProps) {
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
          if (userData.userType === 'jobseeker') {
            clearTimeout(timeout)
            setIsChecking(false)
            return
          }
        } catch {}
      }
      router.replace('/gulf-opportunities')
      return
    }

    if (user.userType !== 'jobseeker') {
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
                <User className="w-7 h-7 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Gulf Job Seeker Access
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
                : 'Please wait while we verify your Gulf job seeker account'
              }
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Allow all jobseekers to access (including normal portal users without Gulf access)
  if (user && user.userType === 'jobseeker') {
    return <>{children}</>
  }

  return <>{children}</>
}
