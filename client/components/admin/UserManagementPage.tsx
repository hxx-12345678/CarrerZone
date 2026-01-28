"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { apiService } from "@/lib/api"
import { toast } from "sonner"
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Eye,
  ArrowLeft,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Building2,
  Globe
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface UserManagementPageProps {
  portal: 'normal' | 'gulf' | 'both'
  title: string
  description: string
  icon: React.ReactNode
}

// Helper functions for status display
const getStatusVariant = (status: string) => {
  switch (status) {
    case 'active':
      return 'default'
    case 'suspended':
    case 'deleted':
    case 'rejected':
      return 'destructive'
    case 'inactive':
    case 'pending_verification':
      return 'secondary'
    default:
      return 'secondary'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-600 text-white'
    case 'suspended':
      return 'bg-red-600 text-white'
    case 'inactive':
      return 'bg-yellow-600 text-white'
    case 'deleted':
      return 'bg-gray-600 text-white'
    case 'pending_verification':
      return 'bg-blue-600 text-white'
    case 'rejected':
      return 'bg-red-500 text-white'
    default:
      return 'bg-gray-500 text-white'
  }
}

const getStatusDisplayText = (status: string) => {
  switch (status) {
    case 'active':
      return 'Active'
    case 'suspended':
      return 'Suspended'
    case 'inactive':
      return 'Inactive'
    case 'deleted':
      return 'Deleted'
    case 'pending_verification':
      return 'Pending Verification'
    case 'rejected':
      return 'Rejected'
    default:
      return status || 'Unknown'
  }
}

export default function UserManagementPage({ portal, title, description, icon }: UserManagementPageProps) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)

  // Initialize state from URL parameters and load users
  useEffect(() => {
    if (authLoading) return

    if (!user || (user.userType !== 'admin' && user.userType !== 'superadmin')) {
      router.push('/admin-login')
      return
    }

    // Get parameters from URL
    const page = searchParams.get('page')
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    
    // Update state from URL parameters
    if (page) setCurrentPage(parseInt(page))
    if (search) setSearchTerm(search)
    if (type) setFilterType(type)
    if (status) setFilterStatus(status)

    // Load users with URL parameters
    loadUsers(
      page ? parseInt(page) : undefined,
      search || undefined,
      type || undefined,
      status || undefined
    )
  }, [user, authLoading, router, searchParams])

  // Update URL parameters when state changes
  const updateURL = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== 1) {
        params.set(key, value.toString())
      } else {
        params.delete(key)
      }
    })
    
    const newURL = `${window.location.pathname}?${params.toString()}`
    router.replace(newURL, { scroll: false })
  }

  const loadUsers = async (page?: number, search?: string, type?: string, status?: string) => {
    try {
      setLoading(true)
      
      // Use provided parameters or current state
      const pageNum = page ?? currentPage
      const searchQuery = search ?? searchTerm
      const userType = type ?? filterType
      const userStatus = status ?? filterStatus
      
      const response = await apiService.getUsersByPortal(portal, {
        page: pageNum,
        limit: 20,
        search: searchQuery,
        userType: userType === 'all' ? undefined : userType,
        status: userStatus === 'all' ? undefined : userStatus
      })
      
      if (response.success && response.data) {
        setUsers(response.data.users || [])
        setTotalPages(response.data.totalPages || 1)
      } else {
        toast.error(`Failed to load ${title.toLowerCase()} users`)
        setUsers([])
        setTotalPages(1)
      }
    } catch (error) {
      console.error(`Failed to load ${title.toLowerCase()} users:`, error)
      toast.error(`Failed to load ${title.toLowerCase()} users`)
      setUsers([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      // Determine new status based on current status
      let newStatus: string
      if (currentStatus === 'active') {
        newStatus = 'suspended'
      } else if (currentStatus === 'suspended') {
        newStatus = 'active'
      } else {
        // For other statuses, toggle to active
        newStatus = 'active'
      }
      
      const response = await apiService.updateUserStatus(userId, newStatus)
      
      if (response.success) {
        toast.success(`User status updated to ${getStatusDisplayText(newStatus)}`)
        loadUsers()
      } else {
        toast.error('Failed to update user status')
      }
    } catch (error) {
      console.error('Failed to update user status:', error)
      toast.error('Failed to update user status')
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    updateURL({ page: 1, search: searchTerm })
    loadUsers()
  }

  const handleFilterChange = () => {
    setCurrentPage(1)
    updateURL({ page: 1, type: filterType, status: filterStatus })
    loadUsers()
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    updateURL({ page: newPage })
    loadUsers()
  }

  const exportUsers = async () => {
    try {
      const response = await apiService.exportUsers({
        userType: filterType === 'all' ? undefined : filterType,
        status: filterStatus === 'all' ? undefined : filterStatus,
        region: portal === 'gulf' ? 'gulf' : portal === 'normal' ? 'india' : undefined
      })
      
      if (response.success && response.data) {
        const csvContent = response.data
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${portal}-portal-users-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success('Users exported successfully')
      } else {
        toast.error('Failed to export users')
      }
    } catch (error) {
      console.error('Failed to export users:', error)
      toast.error('Failed to export users')
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center">
        <div className="text-gray-900 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading {title.toLowerCase()} users...</p>
        </div>
      </div>
    )
  }

  if (!user || (user.userType !== 'admin' && user.userType !== 'superadmin')) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/super-admin/dashboard')}
              className="text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                {icon}
                <span className="ml-3">{title}</span>
              </h1>
              <p className="text-gray-600 mt-2">{description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={exportUsers}
              variant="outline"
              className="text-white border-white/20 hover:bg-white/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
              <Button
                onClick={() => loadUsers()}
                variant="outline"
                className="text-white border-white/20 hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white border-gray-200">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={(value) => { setFilterType(value); handleFilterChange() }}>
                  <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="User Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="jobseeker">Jobseekers</SelectItem>
                    <SelectItem value="employer">Employers</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                    <SelectItem value="superadmin">Super Admins</SelectItem>
                    <SelectItem value="recruiter">Recruiters</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(value) => { setFilterStatus(value); handleFilterChange() }}>
                  <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="deleted">Deleted</SelectItem>
                    <SelectItem value="pending_verification">Pending Verification</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              {title} ({users.length})
            </CardTitle>
            <CardDescription className="text-gray-600">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No users found</h3>
                <p className="text-blue-200">No {title.toLowerCase()} users match your current filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {user.first_name?.[0] || user.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {user.first_name && user.last_name 
                            ? `${user.first_name} ${user.last_name}` 
                            : user.email
                          }
                        </h3>
                        <p className="text-gray-600 text-sm">{user.email}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <Badge 
                            variant={user.user_type === 'employer' ? 'default' : 'secondary'}
                            className={user.user_type === 'employer' ? 'bg-green-600' : 'bg-blue-600'}
                          >
                            {user.user_type}
                          </Badge>
                          <Badge 
                            variant={getStatusVariant(user.account_status)}
                            className={getStatusColor(user.account_status)}
                          >
                            {getStatusDisplayText(user.account_status)}
                          </Badge>
                          {user.region && (
                            <Badge variant="outline" className="text-blue-200 border-blue-200">
                              {user.region}
                            </Badge>
                          )}
                          {portal === 'both' && user.willing_to_relocate && (
                            <Badge variant="outline" className="text-green-200 border-green-200">
                              Willing to Relocate
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          router.push(`/super-admin/users/${user.id}`)
                        }}
                        className="text-gray-900 hover:bg-gray-100"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleUserStatus(user.id, user.account_status)}
                        className={user.account_status === 'active' ? 'hover:text-red-400' : 'hover:text-green-400'}
                      >
                        {user.account_status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-blue-200 text-sm">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="text-gray-900 border-gray-300 hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="text-gray-900 border-gray-300 hover:bg-gray-100"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Details Dialog */}
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                User Details
              </DialogTitle>
              <DialogDescription className="text-slate-300">
                Detailed information about the selected user
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300">Name</label>
                    <p className="text-white">
                      {selectedUser.first_name && selectedUser.last_name 
                        ? `${selectedUser.first_name} ${selectedUser.last_name}` 
                        : 'Not provided'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300">Email</label>
                    <p className="text-white">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300">User Type</label>
                    <Badge 
                      variant={selectedUser.user_type === 'employer' ? 'default' : 'secondary'}
                      className={selectedUser.user_type === 'employer' ? 'bg-green-600' : 'bg-blue-600'}
                    >
                      {selectedUser.user_type}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300">Status</label>
                    <Badge 
                      variant={getStatusVariant(selectedUser.account_status)}
                      className={getStatusColor(selectedUser.account_status)}
                    >
                      {getStatusDisplayText(selectedUser.account_status)}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300">Region</label>
                    <p className="text-white">{selectedUser.region || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300">Phone</label>
                    <p className="text-white">{selectedUser.phone || 'Not provided'}</p>
                  </div>
                  {portal === 'both' && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-slate-300">Willing to Relocate</label>
                        <Badge variant={selectedUser.willing_to_relocate ? 'default' : 'secondary'}>
                          {selectedUser.willing_to_relocate ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-300">Preferred Locations</label>
                        <p className="text-white">
                          {selectedUser.preferred_locations && selectedUser.preferred_locations.length > 0
                            ? selectedUser.preferred_locations.join(', ')
                            : 'Not specified'
                          }
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowUserDialog(false)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => toggleUserStatus(selectedUser.id, selectedUser.account_status)}
                    className={selectedUser.account_status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                  >
                    {selectedUser.account_status === 'active' ? 'Suspend' : 'Activate'} User
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
