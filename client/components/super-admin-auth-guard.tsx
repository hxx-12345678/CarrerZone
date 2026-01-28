"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Loader2, Shield, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface SuperAdminAuthGuardProps {
  children: React.ReactNode
}

export function SuperAdminAuthGuard({ children }: SuperAdminAuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!loading) {
      setIsChecking(false)
      
      if (!user) {
        // User not logged in, redirect to login
        router.push("/login")
        return
      }
      
      if (user.userType !== "superadmin" && user.userType !== "admin") {
        // User is not an admin or super admin, redirect to appropriate dashboard
        if (user.userType === "employer") {
          router.push("/employer-dashboard")
        } else if (user.userType === "jobseeker") {
          router.push("/dashboard")
        } else {
          router.push("/")
        }
        return
      }
    }
  }, [user, loading, router])

  if (loading || isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Verifying Access</h3>
            <p className="text-gray-600">Please wait while we verify your admin privileges...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600 mb-4">You need to be logged in to access this page.</p>
            <Button onClick={() => router.push("/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (user.userType !== "superadmin" && user.userType !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">
              You don't have permission to access the admin panel. 
              This area is restricted to administrators and super administrators only.
            </p>
            <div className="space-y-2">
              {user.userType === "employer" ? (
                <Button onClick={() => router.push("/employer-dashboard")} className="w-full">
                  Go to Employer Dashboard
                </Button>
              ) : user.userType === "jobseeker" ? (
                <Button onClick={() => router.push("/dashboard")} className="w-full">
                  Go to Job Seeker Dashboard
                </Button>
              ) : (
                <Button onClick={() => router.push("/")} className="w-full">
                  Go to Home
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User is authenticated and is an admin or super admin
  return <>{children}</>
}
