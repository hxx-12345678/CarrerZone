"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (authLoading) return

    // Add a small delay to ensure auth context is fully initialized
    const checkAuth = () => {
      // If not logged in, redirect to admin login
      if (!user) {
        router.push('/admin-login')
        return
      }

      // If logged in but not admin or superadmin, redirect to home
      if (user.userType !== 'admin' && user.userType !== 'superadmin') {
        router.push('/')
        return
      }

      // If accessing admin-login while already logged in as admin or superadmin, redirect to dashboard
      if (pathname === '/admin-login' && (user.userType === 'admin' || user.userType === 'superadmin')) {
        router.push('/super-admin/dashboard')
        return
      }

      setIsChecking(false)
    }

    // Small delay to ensure auth context is fully initialized
    const timeoutId = setTimeout(checkAuth, 100)
    
    return () => clearTimeout(timeoutId)
  }, [user, authLoading, router, pathname])

  // Show loading while checking authentication
  if (authLoading || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // If not authenticated or not admin/superadmin, don't render children
  if (!user || (user.userType !== 'admin' && user.userType !== 'superadmin')) {
    return null
  }

  return <>{children}</>
}
