"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { apiService } from "@/lib/api"
import { toast } from "sonner"
import { Eye, EyeOff, Shield, Lock, Mail, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { user, loading: authLoading, manualRefreshUser, updateUser } = useAuth()

  // Redirect if already logged in as superadmin (only superadmin can use this page)
  useEffect(() => {
    if (authLoading) return
    
    if (user && user.userType === 'superadmin') {
      router.push('/super-admin/dashboard')
    }
  }, [user, authLoading, router])

  // Show loading if checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-gray-700 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Don't show login form if already logged in as superadmin
  if (user && user.userType === 'superadmin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-gray-700 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p>Redirecting to admin dashboard...</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error("Please fill in all fields")
      return
    }

    setLoading(true)
    
    try {
      // Use dedicated admin login method from API service
      const response = await apiService.adminLogin({ email, password })
      
      if (response.success && response.data) {
        const { user, token, redirectTo } = response.data
        
        // Store token and user data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        // Update the API service with the token
        apiService.setToken(token)
        
        // Update the auth context immediately
        updateUser(user)
        
        toast.success("Login successful!")
        
        // ALWAYS redirect to admin dashboard - no checks needed since backend validates superadmin
        router.push('/super-admin/dashboard')
      } else {
        toast.error(response.message || "Login failed")
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error("Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Base gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-gray-50/80 to-gray-100/90"></div>
        <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-gray-200/30 to-gray-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-gray-300/30 to-gray-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-gray-200/20 to-gray-300/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        {/* Wide translucent gradient strip */}
        <div className="absolute top-1/4 left-0 right-0 h-24 bg-gradient-to-r from-gray-300/20 via-gray-400/15 to-gray-500/20"></div>
      </div>
      
      <div className="w-full max-w-md">
        {/* Back to Home Link */}
        <div className="mb-6">
          <Link 
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Admin Login Card */}
        <Card className="bg-white/95 backdrop-blur-xl border-gray-200/50 text-gray-800 shadow-[0_20px_60px_rgba(0,0,0,0.1)] rounded-3xl">
          <CardHeader className="text-center bg-gradient-to-r from-gray-50/50 to-gray-100/50 rounded-t-3xl border-b border-gray-200/30">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-gray-700 to-gray-800 rounded-full shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">Admin Login</CardTitle>
            <CardDescription className="text-gray-600">
              Secure access to the administration panel
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@campus.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/80 border-gray-300 text-gray-800 placeholder:text-gray-500 focus:border-gray-500 focus:ring-gray-500/20 rounded-xl transition-all duration-200 hover:bg-white/90"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/80 border-gray-300 text-gray-800 placeholder:text-gray-500 focus:border-gray-500 focus:ring-gray-500/20 rounded-xl transition-all duration-200 hover:bg-white/90"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start space-x-2">
                <Shield className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-700">Security Notice</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    This is a secure admin portal. All login attempts are logged and monitored. 
                    Unauthorized access is strictly prohibited.
                  </p>
                </div>
              </div>
            </div>

            {/* Default Credentials Info */}
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <p className="text-xs text-gray-600 text-center">
                <strong className="text-gray-800">Default Admin Credentials:</strong><br />
                Email: admin@campus.com<br />
                Password: admin@123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
