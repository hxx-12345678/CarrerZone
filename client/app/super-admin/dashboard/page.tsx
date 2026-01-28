"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { apiService } from "@/lib/api"
import { toast } from "sonner"
import {
  Users,
  Building2,
  Briefcase,
  TrendingUp,
  Shield,
  AlertCircle,
  BarChart3,
  Globe,
  MapPin,
  Settings,
  LogOut,
  UserCheck,
  UserX,
  CheckCircle2,
  Clock,
  FileCheck,
  Bell,
  BellRing,
  Mail
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function AdminDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    if (authLoading || isLoggingOut) return

    // Redirect if not logged in or not admin
    if (!user) {
      router.push('/admin-login')
      return
    }

    if (user.userType !== 'admin' && user.userType !== 'superadmin') {
      toast.error('Access denied. Admin privileges required.')
      router.push('/')
      return
    }

    loadStats()
  }, [user, authLoading, router, isLoggingOut])

  // Handle tab persistence from URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab')
    if (tabFromUrl && ['overview', 'users', 'companies', 'jobs', 'notifications', 'support'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [searchParams])

  // Handle tab change and update URL
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', value)
    window.history.replaceState({}, '', url.toString())
  }

  const loadStats = async () => {
    try {
      setLoading(true)
      
      // Check if user is logging out
      if (isLoggingOut) {
        console.log('User is logging out, skipping stats load')
        return
      }
      
      // Check if user is still logged in before making API call
      const token = localStorage.getItem('token')
      if (!token) {
        console.log('No token found, skipping stats load')
        return
      }
      
      // Ensure API service has the latest token
      apiService.refreshToken()
      
      const response = await apiService.getAdminStats()
      
      if (response.success) {
        setStats(response.data)
      } else {
        toast.error('Failed to load statistics')
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
      // Don't show error toast if it's a 401 (unauthorized) error or if user is logging out
      if ((error as any)?.response?.status !== 401 && !isLoggingOut) {
        toast.error('Failed to load statistics')
      }
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-white flex items-center justify-center">
        <div className="text-gray-800 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || (user.userType !== 'admin' && user.userType !== 'superadmin')) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs sm:text-sm text-gray-600">System Administration Portal</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Badge className="bg-green-100 text-green-800 border border-green-200 text-xs">
                <UserCheck className="w-3 h-3 mr-1" />
                Admin
              </Badge>
              <span className="text-xs sm:text-sm text-gray-600">
                {user.firstName} {user.lastName}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                onClick={async () => {
                  try {
                    setIsLoggingOut(true)
                    // Use the proper logout method from useAuth
                    await logout()
                    // Show logout message
                    toast.success('Logged out successfully')
                  } catch (error) {
                    console.error('Logout error:', error)
                    // Fallback: clear storage manually and redirect
                    localStorage.clear()
                    sessionStorage.clear()
                    toast.success('Logged out successfully')
                    router.push('/admin-login')
                  }
                }}
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 bg-white border-gray-200 shadow-sm gap-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="companies" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm">
              <Building2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Companies</span>
              <span className="sm:hidden">Co.</span>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm">
              <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Jobs
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm">
              <Bell className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Support</span>
              <span className="sm:hidden">Help</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="space-y-6">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Total Users */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 text-gray-800 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs sm:text-sm font-medium flex items-center justify-between">
                      <span className="truncate">Total Users</span>
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold">{stats?.users?.total || 0}</div>
                    <p className="text-xs mt-1 text-blue-100">
                      +{stats?.users?.newLast30Days || 0} in last 30 days
                    </p>
                    <div className="mt-4 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Jobseekers:</span>
                        <span className="font-semibold">{stats?.users?.jobseekers || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Employers:</span>
                        <span className="font-semibold">{stats?.users?.employers || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Admins:</span>
                        <span className="font-semibold">{stats?.users?.admins || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Companies */}
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 text-gray-800 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs sm:text-sm font-medium flex items-center justify-between">
                      <span className="truncate">Companies</span>
                      <Building2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold">{stats?.companies?.total || 0}</div>
                    <p className="text-xs mt-1 text-purple-100">
                      +{stats?.companies?.newLast30Days || 0} in last 30 days
                    </p>
                    <div className="mt-4 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Verified:</span>
                        <span className="font-semibold">{stats?.companies?.verified || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Pending:</span>
                        <span className="font-semibold">{stats?.companies?.unverified || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Jobs */}
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 text-gray-800 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs sm:text-sm font-medium flex items-center justify-between">
                      <span className="truncate">Jobs Posted</span>
                      <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold">{stats?.jobs?.total || 0}</div>
                    <p className="text-xs mt-1 text-green-100">
                      +{stats?.jobs?.newLast30Days || 0} in last 30 days
                    </p>
                    <div className="mt-4 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Active:</span>
                        <span className="font-semibold">{stats?.jobs?.active || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>India:</span>
                        <span className="font-semibold">{stats?.jobs?.india || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Gulf:</span>
                        <span className="font-semibold">{stats?.jobs?.gulf || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Applications */}
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 text-gray-800 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs sm:text-sm font-medium flex items-center justify-between">
                      <span className="truncate">Applications</span>
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold">{stats?.applications?.total || 0}</div>
                    <p className="text-xs mt-1 text-orange-100">
                      Total applications submitted
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <Card className="bg-white border border-gray-200 text-gray-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="truncate">User Management</span>
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-xs sm:text-sm">
                      Manage all users, jobseekers, and employers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/super-admin/users/normal">
                      <Button className="w-full justify-between bg-blue-600 hover:bg-blue-700 text-sm">
                        <span className="truncate">Manage Users</span>
                        <Users className="w-4 h-4 flex-shrink-0" />
                      </Button>
                    </Link>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/5 rounded p-2">
                        <div className="text-gray-400">Active</div>
                        <div className="text-lg font-bold">{stats?.users?.active || 0}</div>
                      </div>
                      <div className="bg-white/5 rounded p-2">
                        <div className="text-gray-400">Inactive</div>
                        <div className="text-lg font-bold">{(stats?.users?.total || 0) - (stats?.users?.active || 0)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 text-gray-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                      <Building2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="truncate">Company Management</span>
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-xs sm:text-sm">
                      Verify and manage company accounts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/super-admin/companies/all">
                      <Button className="w-full justify-between bg-purple-600 hover:bg-purple-700 text-sm">
                        <span className="truncate">Manage Companies</span>
                        <Building2 className="w-4 h-4 flex-shrink-0" />
                      </Button>
                    </Link>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/5 rounded p-2">
                        <div className="text-gray-400">Verified</div>
                        <div className="text-lg font-bold">{stats?.companies?.verified || 0}</div>
                      </div>
                      <div className="bg-white/5 rounded p-2">
                        <div className="text-gray-400">Pending</div>
                        <div className="text-lg font-bold">{stats?.companies?.unverified || 0}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 text-gray-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                      <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="truncate">Job Management</span>
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-xs sm:text-sm">
                      Manage job postings and approvals
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/super-admin/jobs/all">
                      <Button className="w-full justify-between bg-green-600 hover:bg-green-700 text-sm">
                        <span className="truncate">Manage Jobs</span>
                        <Briefcase className="w-4 h-4 flex-shrink-0" />
                      </Button>
                    </Link>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/5 rounded p-2">
                        <div className="text-gray-400">Active</div>
                        <div className="text-lg font-bold">{stats?.jobs?.active || 0}</div>
                      </div>
                      <div className="bg-white/5 rounded p-2">
                        <div className="text-gray-400">Inactive</div>
                        <div className="text-lg font-bold">{stats?.jobs?.inactive || 0}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 text-gray-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                      <FileCheck className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="truncate">Verifications</span>
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-xs sm:text-sm">
                      Review employer verification requests
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/super-admin/dashboard/verifications">
                      <Button className="w-full justify-between bg-amber-600 hover:bg-amber-700 text-sm">
                        <span className="truncate">Check Verifications</span>
                        <FileCheck className="w-4 h-4 flex-shrink-0" />
                      </Button>
                    </Link>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/5 rounded p-2">
                        <div className="text-gray-400">Pending</div>
                        <div className="text-lg font-bold">{stats?.companies?.unverified || 0}</div>
                      </div>
                      <div className="bg-white/5 rounded p-2">
                        <div className="text-gray-400">Verified</div>
                        <div className="text-lg font-bold">{stats?.companies?.verified || 0}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Invitation Management - Special Section */}
              <div className="mt-8">
                <Card className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-3 text-indigo-700">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <span className="text-lg sm:text-xl font-bold">Invitation Management</span>
                        <p className="text-xs sm:text-sm font-normal text-indigo-600 mt-1">
                          Send professional invitations to jobseekers and companies
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link href="/super-admin/dashboard/invitations" className="flex-1">
                        <Button className="w-full justify-between bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200 text-sm sm:text-base">
                          <span className="font-semibold truncate">Manage Invitations</span>
                          <Mail className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        </Button>
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-indigo-100">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-xs sm:text-sm font-medium text-indigo-700">Jobseekers</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-indigo-800">Invite</div>
                        <div className="text-xs text-indigo-600">Send job opportunities</div>
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-indigo-100">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-xs sm:text-sm font-medium text-indigo-700">Companies</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-indigo-800">Invite</div>
                        <div className="text-xs text-indigo-600">Connect with talent</div>
                      </div>
                    </div>
                    <div className="bg-white/40 rounded-lg p-3 border border-indigo-100">
                      <div className="flex items-center space-x-2 text-xs sm:text-sm text-indigo-700">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0"></div>
                        <span className="truncate">Bulk email support • Custom templates • Email tracking</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Security Notice */}
              <Card className="bg-red-50 border-red-200 text-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <span>Security Notice</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    This is a secure admin portal. All actions are logged and monitored. 
                    Never share this URL with unauthorized users. If you notice any suspicious activity, 
                    change your password immediately.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                <div className="flex space-x-2">
                  <Link href="/super-admin/users/normal">
                    <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-white">
                      <Building2 className="w-4 h-4 mr-2" />
                      Normal Portal
                    </Button>
                  </Link>
                  <Link href="/super-admin/users/gulf-portal">
                    <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-white">
                      <Globe className="w-4 h-4 mr-2" />
                      Gulf Portal
                    </Button>
                  </Link>
                  <Link href="/super-admin/users/both">
                    <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-white">
                      <Users className="w-4 h-4 mr-2" />
                      Both Portals
                    </Button>
                  </Link>
                </div>
              </div>
              
                <Card className="bg-white border border-gray-200 text-gray-800 shadow-sm">
                  <CardHeader>
                    <CardTitle>All Users Overview</CardTitle>
                    <CardDescription className="text-gray-600">
                      Manage users across different portals: Normal Portal, Gulf Portal, and Both Portals
                    </CardDescription>
                  </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Total Users</p>
                          <p className="text-2xl font-bold">{stats?.users?.total || 0}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-400" />
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Active Users</p>
                          <p className="text-2xl font-bold text-green-400">{stats?.users?.active || 0}</p>
                        </div>
                        <UserCheck className="w-8 h-8 text-green-400" />
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">New This Month</p>
                          <p className="text-2xl font-bold text-blue-400">{stats?.users?.newLast30Days || 0}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-blue-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Link href="/super-admin/users/normal">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        <Users className="w-4 h-4 mr-2" />
                        View All Users
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Company Management</h2>
                <div className="flex space-x-2">
                  <Link href="/super-admin/companies/india">
                    <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-white">
                      <MapPin className="w-4 h-4 mr-2" />
                      India Companies
                    </Button>
                  </Link>
                  <Link href="/super-admin/companies/gulf">
                    <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-white">
                      <Globe className="w-4 h-4 mr-2" />
                      Gulf Companies
                    </Button>
                  </Link>
                </div>
              </div>
              
              <Card className="bg-white border border-gray-200 text-gray-800 shadow-sm">
                <CardHeader>
                  <CardTitle>All Companies Overview</CardTitle>
                  <CardDescription className="text-gray-600">
                    Manage all companies across India and Gulf regions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Total Companies</p>
                          <p className="text-2xl font-bold">{stats?.companies?.total || 0}</p>
                        </div>
                        <Building2 className="w-8 h-8 text-purple-400" />
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Verified</p>
                          <p className="text-2xl font-bold text-green-400">{stats?.companies?.verified || 0}</p>
                        </div>
                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Pending Verification</p>
                          <p className="text-2xl font-bold text-yellow-400">{stats?.companies?.pending || 0}</p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Link href="/super-admin/companies/all">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700">
                        <Building2 className="w-4 h-4 mr-2" />
                        View All Companies
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Job Management</h2>
                <div className="flex space-x-2">
                  <Link href="/super-admin/jobs/india">
                    <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-white">
                      <MapPin className="w-4 h-4 mr-2" />
                      India Jobs
                    </Button>
                  </Link>
                  <Link href="/super-admin/jobs/gulf">
                    <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-white">
                      <Globe className="w-4 h-4 mr-2" />
                      Gulf Jobs
                    </Button>
                  </Link>
                </div>
              </div>
              
              <Card className="bg-white border border-gray-200 text-gray-800 shadow-sm">
                <CardHeader>
                  <CardTitle>All Jobs Overview</CardTitle>
                  <CardDescription className="text-gray-600">
                    Manage all jobs across India and Gulf regions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Total Jobs</p>
                          <p className="text-2xl font-bold">{stats?.jobs?.total || 0}</p>
                        </div>
                        <Briefcase className="w-8 h-8 text-green-400" />
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Active Jobs</p>
                          <p className="text-2xl font-bold text-green-400">{stats?.jobs?.active || 0}</p>
                        </div>
                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">India Jobs</p>
                          <p className="text-2xl font-bold text-blue-400">{stats?.jobs?.india || 0}</p>
                        </div>
                        <MapPin className="w-8 h-8 text-blue-400" />
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Gulf Jobs</p>
                          <p className="text-2xl font-bold text-orange-400">{stats?.jobs?.gulf || 0}</p>
                        </div>
                        <Globe className="w-8 h-8 text-orange-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Link href="/super-admin/jobs/all">
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        <Briefcase className="w-4 h-4 mr-2" />
                        View All Jobs
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Admin Notifications</h2>
                <Link href="/super-admin/dashboard/notifications">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <BellRing className="w-4 h-4 mr-2" />
                    View All Notifications
                  </Button>
                </Link>
              </div>
              
              <Card className="bg-white border border-gray-200 text-gray-800 shadow-sm">
                <CardHeader>
                  <CardTitle>Notification Center</CardTitle>
                  <CardDescription className="text-gray-600">
                    Stay updated with platform activities, new registrations, and important events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-500 rounded-full">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <Badge className="bg-green-100 text-green-800">Registration</Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">New User Registrations</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Get notified when new admins, employers, or companies register on the platform.
                      </p>
                      <Link href="/super-admin/dashboard/notifications?category=registration">
                        <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-50">
                          View Registration Notifications
                        </Button>
                      </Link>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-500 rounded-full">
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">Verification</Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Company Verifications</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Track company verification approvals and rejections for compliance monitoring.
                      </p>
                      <Link href="/super-admin/dashboard/notifications?category=verification">
                        <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                          View Verification Notifications
                        </Button>
                      </Link>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-500 rounded-full">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <Badge className="bg-purple-100 text-purple-800">Milestone</Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Growth Milestones</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Celebrate platform growth with jobseeker milestone notifications (10, 50, 100, 500, 1000+ users).
                      </p>
                      <Link href="/super-admin/dashboard/notifications?category=milestone">
                        <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                          View Milestone Notifications
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-500 rounded-full">
                        <Bell className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Real-time Notifications</h3>
                        <p className="text-gray-600 text-sm">
                          All notifications are created automatically when events occur. You can view, filter, and manage them in the dedicated notifications page.
                        </p>
                      </div>
                      <Link href="/super-admin/dashboard/notifications">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <BellRing className="w-4 h-4 mr-2" />
                          Open Notifications
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Support Center</h2>
                <Link href="/super-admin/support">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Shield className="w-4 h-4 mr-2" />
                    Open Support Center
                  </Button>
                </Link>
              </div>
              
              <Card className="bg-white border border-gray-200 text-gray-800 shadow-sm">
                <CardHeader>
                  <CardTitle>Support & Whistleblower Reports</CardTitle>
                  <CardDescription className="text-gray-600">
                    Manage customer support messages and handle anonymous whistleblower reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-500 rounded-full">
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">General</Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Support</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Handle general support requests, technical issues, and customer inquiries.
                      </p>
                      <Link href="/super-admin/support?filter=all">
                        <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                          View All Support
                        </Button>
                      </Link>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-500 rounded-full">
                          <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                        <Badge className="bg-red-100 text-red-800">🚨 Urgent</Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Whistleblower Reports</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Review anonymous reports of fraud, misconduct, and other serious violations.
                      </p>
                      <Link href="/super-admin/support?filter=whistleblower">
                        <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50">
                          View Whistleblower Reports
                        </Button>
                      </Link>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-500 rounded-full">
                          <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                        <Badge className="bg-orange-100 text-orange-800">High Priority</Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Fraud & Spam</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Investigate reports of fraudulent activities and spam violations.
                      </p>
                      <Link href="/super-admin/support?filter=fraud">
                        <Button variant="outline" size="sm" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                          View Fraud Reports
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-red-500 rounded-full">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">🚨 Urgent Priority System</h3>
                        <p className="text-gray-600 text-sm">
                          Whistleblower reports are automatically flagged as urgent priority and require immediate attention. 
                          All reports are handled with strict confidentiality and legal protection.
                        </p>
                      </div>
                      <Link href="/super-admin/support?filter=urgent">
                        <Button className="bg-red-600 hover:bg-red-700">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          View Urgent Reports
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
