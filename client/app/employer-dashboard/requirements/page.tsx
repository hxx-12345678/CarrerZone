"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Filter, Plus, Search, MoreHorizontal, Edit, Trash2, Copy, X, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { EmployerDashboardNavbar } from "@/components/employer-dashboard-navbar"
import { EmployerDashboardFooter } from "@/components/employer-dashboard-footer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { apiService, Requirement } from "@/lib/api"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"

export default function RequirementsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [requirementStatusFilter, setRequirementStatusFilter] = useState({
    active: true,
    limitReached: true,
    expired: true,
  })
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [requirementStats, setRequirementStats] = useState<{[key: string]: any}>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [requirementToDelete, setRequirementToDelete] = useState<string | null>(null)

  // Fetch requirements from API
  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('🔍 Frontend: Starting to fetch requirements...')
        console.log('🔍 Frontend: Checking authentication...')
        
        // Check if user is authenticated
        const token = localStorage.getItem('token')
        const user = localStorage.getItem('user')
        const company = localStorage.getItem('company')
        
        console.log('🔍 Frontend: Token exists:', !!token)
        console.log('🔍 Frontend: User exists:', !!user)
        console.log('🔍 Frontend: Company exists:', !!company)
        
        if (!token || !user) {
          console.log('❌ Frontend: User not authenticated, redirecting to login')
          setError('Please log in to view requirements.')
          setTimeout(() => {
            router.push('/employer-login')
          }, 2000)
          return
        }
        
        // Refresh user data from server to ensure we have correct field names
        console.log('🔍 Frontend: Refreshing user data from server...')
        try {
          const userResponse = await apiService.getCurrentUser()
          if (userResponse.success && userResponse.data?.user) {
            console.log('✅ Frontend: Successfully refreshed user data')
            localStorage.setItem('user', JSON.stringify(userResponse.data.user))
            const refreshedUser = userResponse.data.user
            console.log('🔍 Frontend: Refreshed user data:', {
              id: refreshedUser.id,
              email: refreshedUser.email,
              userType: refreshedUser.userType,
              companyId: refreshedUser.companyId
            })
            
            // Check if user is an employer or admin
            if (refreshedUser.userType !== 'employer' && refreshedUser.userType !== 'admin') {
              console.log('❌ Frontend: User is not an employer')
              console.log('❌ Frontend: Expected "employer", got:', refreshedUser.userType)
              setError('Access denied. Only employers and admins can view requirements.')
              return
            }
          } else {
            console.log('❌ Frontend: Failed to refresh user data')
            // Fall back to localStorage data
            const userData = JSON.parse(user)
            console.log('🔍 Frontend: Using localStorage user data:', userData)
            
            // Check if user is an employer or admin
            if (userData.userType !== 'employer' && userData.userType !== 'admin') {
              console.log('❌ Frontend: User is not an employer')
              console.log('❌ Frontend: Expected "employer", got:', userData.userType)
              setError('Access denied. Only employers and admins can view requirements.')
              return
            }
          }
        } catch (userError) {
          console.log('❌ Frontend: Error refreshing user data, using localStorage:', userError)
          // Fall back to localStorage data
          const userData = JSON.parse(user)
          
          // Check if user is an employer or admin
          if (userData.userType !== 'employer' && userData.userType !== 'admin') {
            console.log('❌ Frontend: User is not an employer')
            console.log('❌ Frontend: Expected "employer", got:', userData.userType)
            setError('Access denied. Only employers and admins can view requirements.')
            return
          }
        }
        
        const response = await apiService.getRequirements()
        
        console.log('🔍 Frontend: API response:', response)
        
        if (response.success && response.data) {
          console.log('✅ Frontend: Successfully fetched requirements:', response.data.length)
          setRequirements(response.data)
          
          // Fetch stats for each requirement
          const statsPromises = response.data.map(async (requirement: Requirement) => {
            try {
              const statsResponse = await apiService.getRequirementStats(requirement.id)
              if (statsResponse.success && statsResponse.data) {
                return {
                  id: requirement.id,
                  ...statsResponse.data
                }
              }
            } catch (error) {
              console.error(`❌ Error fetching stats for requirement ${requirement.id}:`, error)
            }
            return {
              id: requirement.id,
              totalCandidates: 0,
              accessedCandidates: 0,
              cvAccessLeft: 0
            }
          })
          
          const statsResults = await Promise.all(statsPromises)
          const statsMap = statsResults.reduce((acc, stat) => {
            acc[stat.id] = stat
            return acc
          }, {} as {[key: string]: any})
          
          setRequirementStats(statsMap)
          console.log('✅ Frontend: Successfully fetched requirement stats:', statsMap)
        } else {
          console.error('❌ Frontend: Failed to fetch requirements:', response.message)
          
          // Handle specific error cases
          if (response.message?.includes('Access denied') || response.message?.includes('Invalid or expired token')) {
            setError('Your session has expired. Please log in again.')
            setTimeout(() => {
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              localStorage.removeItem('company')
              router.push('/employer-login')
            }, 2000)
          } else if (response.message?.includes('no company associated')) {
            setError('Your account is not associated with a company. Please contact support.')
          } else {
            setError(response.message || 'Failed to load requirements. Please try again later.')
          }
        }
      } catch (error: any) {
        console.error('❌ Frontend: Error fetching requirements:', error)
        
        // Handle network errors
        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
          setError('Unable to connect to the server. Please check your internet connection and try again.')
        } else if (error.message?.includes('Access denied') || error.message?.includes('Invalid or expired token')) {
          setError('Your session has expired. Please log in again.')
          setTimeout(() => {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            localStorage.removeItem('company')
            router.push('/employer-login')
          }, 2000)
        } else {
          setError(error.message || 'Failed to load requirements. Please try again later.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRequirements()
  }, [router])

  // Helper functions to map database fields to UI display
  const getRequirementStatus = (requirement: Requirement) => {
    if (requirement.status === 'closed') return 'expired'
    if (requirement.status === 'paused') return 'limit-reached'
    if (requirement.status === 'draft') return 'active' // Treat draft as active for display
    return requirement.status // 'active' stays as 'active'
  }

  const getValidTillDate = (requirement: Requirement) => {
    if (!requirement.validTill) return 'No expiry date'
    return new Date(requirement.validTill).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getCvAccessLeft = (requirement: Requirement) => {
    return requirementStats[requirement.id]?.cvAccessLeft || 0
  }

  const getCandidatesCount = (requirement: Requirement) => {
    return requirementStats[requirement.id]?.totalCandidates || 0
  }

  const getAccessedCount = (requirement: Requirement) => {
    const count = requirementStats[requirement.id]?.accessedCandidates || 0;
    console.log(`🔍 Getting accessed count for ${requirement.title}:`, count, requirementStats[requirement.id]);
    return count;
  }
  
  // Refresh stats function
  const refreshStats = useCallback(() => {
    console.log('🔄 Refreshing requirement stats...');
    requirements.forEach(req => {
      apiService.getRequirementStats(req.id).then(resp => {
        if (resp.success && resp.data) {
          setRequirementStats(prev => ({
            ...prev,
            [req.id]: {
              ...prev[req.id],
              accessedCandidates: resp.data.accessedCandidates || 0,
              totalCandidates: resp.data.totalCandidates || 0,
              cvAccessLeft: resp.data.cvAccessLeft || 0
            }
          }));
          console.log(`✅ Updated stats for ${req.title}:`, resp.data.accessedCandidates);
        }
      }).catch(err => console.error('❌ Failed to refresh stats:', err));
    });
  }, [requirements]);
  
  // Periodically refresh requirement stats
  useEffect(() => {
    // Initial refresh
    refreshStats();
    
    const interval = setInterval(() => {
      refreshStats();
    }, 3000); // Refresh every 3 seconds for faster updates
    
    // Also refresh when page becomes visible (e.g., when returning from edit page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Page visible, refreshing stats...');
        refreshStats();
      }
    };
    
    // Refresh when window gains focus (user navigates back)
    const handleFocus = () => {
      console.log('🎯 Window focused, refreshing stats...');
      refreshStats();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    // Initial refresh
    refreshStats();
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshStats])

  // Filter requirements based on search query and status filters
  const filteredRequirements = requirements.filter((req) => {
    const title = (req.title || '').toString()
    const location = (req.location || '').toString()
    const description = (req.description || '').toString()
    const q = (searchQuery || '').toString().toLowerCase()

    const matchesSearch = title.toLowerCase().includes(q) ||
                         location.toLowerCase().includes(q) ||
                         description.toLowerCase().includes(q)
    
    const uiStatus = getRequirementStatus(req)
    const matchesStatus = 
      (requirementStatusFilter.active && uiStatus === "active") ||
      (requirementStatusFilter.limitReached && uiStatus === "limit-reached") ||
      (requirementStatusFilter.expired && uiStatus === "expired")
    
    return matchesSearch && matchesStatus
  })

  console.log('🔍 Frontend: Filtered requirements count:', filteredRequirements.length)
  console.log('🔍 Frontend: Total requirements count:', requirements.length)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 border-green-200">ACTIVE</Badge>
      case "limit-reached":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">LIMIT REACHED</Badge>
      case "expired":
        return <Badge className="bg-red-100 text-red-800 border-red-200">EXPIRED</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const handleEditRequirement = (id: string) => {
    router.push(`/employer-dashboard/requirements/${id}/edit`)
    toast({
      title: "Edit Requirement",
      description: "Redirecting to edit page...",
    })
  }

  const handleDuplicateRequirement = (id: string) => {
    const requirement = requirements.find(req => req.id === id)
    if (requirement) {
      // In a real implementation, this would call the API to create a duplicate
      toast({
        title: "Duplicate Feature",
        description: "Duplicate functionality will be implemented with API integration.",
      })
    }
  }

  const handleDeleteRequirement = (id: string) => {
    setRequirementToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!requirementToDelete) return
    
    try {
      const response = await apiService.deleteRequirement(requirementToDelete)
      
      if (response.success) {
      setRequirements(requirements.filter(req => req.id !== requirementToDelete))
      toast({
        title: "Requirement Deleted",
        description: "The requirement has been deleted successfully.",
      })
      setDeleteDialogOpen(false)
      setRequirementToDelete(null)
      } else {
        throw new Error(response.message || "Failed to delete requirement")
      }
    } catch (error: any) {
      console.error('Error deleting requirement:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete requirement. Please try again.",
        variant: "destructive",
      })
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  const clearFilters = () => {
    setRequirementStatusFilter({
      active: true,
      limitReached: true,
      expired: true,
    })
  }



  return (
    <EmployerAuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-auto">
      <EmployerDashboardNavbar />
      
      {/* Background Effects - Blue theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Base blue gradient overlay to ensure visible background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200/45 via-cyan-200/35 to-indigo-200/45"></div>
        <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-300/10 to-cyan-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-indigo-300/10 to-violet-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-cyan-300/10 to-blue-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        {/* Wide translucent blue gradient strip */}
        <div className="absolute top-1/3 left-0 right-0 h-24 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-indigo-400/20"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">My requirements</h1>
          </div>
          <Link href="/employer-dashboard/create-requirement">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Create new requirement
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)] sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900 flex items-center justify-between">
                  <div className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Filter
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Clear
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div className="space-y-2">
                  <h3 className="font-medium text-slate-900">Search</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search requirements..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-8"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSearch}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>



                {/* Requirement Status */}
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-900">Requirement status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="active"
                        checked={requirementStatusFilter.active}
                        onCheckedChange={(checked) =>
                          setRequirementStatusFilter((prev) => ({ ...prev, active: checked as boolean }))
                        }
                      />
                      <label htmlFor="active" className="text-sm text-slate-700">
                        Active ({requirements.filter(r => getRequirementStatus(r) === "active").length})
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="limit-reached"
                        checked={requirementStatusFilter.limitReached}
                        onCheckedChange={(checked) =>
                          setRequirementStatusFilter((prev) => ({ ...prev, limitReached: checked as boolean }))
                        }
                      />
                      <label htmlFor="limit-reached" className="text-sm text-slate-700">
                        Limit reached ({requirements.filter(r => getRequirementStatus(r) === "limit-reached").length})
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="expired"
                        checked={requirementStatusFilter.expired}
                        onCheckedChange={(checked) =>
                          setRequirementStatusFilter((prev) => ({ ...prev, expired: checked as boolean }))
                        }
                      />
                      <label htmlFor="expired" className="text-sm text-slate-700">
                        Expired ({requirements.filter(r => getRequirementStatus(r) === "expired").length})
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-slate-900">
                    All requirements ({filteredRequirements.length})
                  </h2>
                  {searchQuery && (
                    <div className="text-sm text-slate-600">
                      Showing results for "{searchQuery}"
                    </div>
                  )}
                </div>

                {/* Requirements List */}
                <AnimatePresence>
                  {loading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Loading requirements...</h3>
                    </motion.div>
                  ) : error ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="w-8 h-8 text-red-600" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Error loading requirements</h3>
                      <p className="text-slate-600 mb-4">{error}</p>
                      <div className="flex space-x-3">
                        <Button 
                          onClick={() => window.location.reload()} 
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                          Try Again
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => router.push('/employer-login')}
                        >
                          Go to Login
                        </Button>
                      </div>
                    </motion.div>
                  ) : filteredRequirements.length > 0 ? (
                    filteredRequirements.map((requirement, index) => (
                    <motion.div
                      key={requirement.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className="border border-slate-200 rounded-lg p-6 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-xl font-semibold text-slate-900">
                              {requirement.title}
                            </h3>
                            {getStatusBadge(getRequirementStatus(requirement))}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-slate-600 mb-4">
                            <span>{requirement.location}</span>
                            <span>•</span>
                            <span>Valid till {getValidTillDate(requirement)}</span>
                            <span>•</span>
                            <span>CV access left: {getCvAccessLeft(requirement)}</span>
                          </div>
                          <p className="text-sm text-slate-700 mb-4">{requirement.description}</p>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <Link href={`/employer-dashboard/requirements/${requirement.id}/candidates`}>
                              <div className="text-2xl font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors">
                                {getCandidatesCount(requirement)}
                              </div>
                            </Link>
                            <div className="text-sm text-slate-500">Candidates</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{getAccessedCount(requirement)}</div>
                            <div className="text-sm text-slate-500">Accessed</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Link href={`/employer-dashboard/requirements/${requirement.id}/candidates`}>
                              <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                <Users className="w-4 h-4 mr-1" />
                                View Candidates
                              </Button>
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditRequirement(requirement.id)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Requirement
                                </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDuplicateRequirement(requirement.id)}>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => handleDeleteRequirement(requirement.id)}
                                  >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No requirements found</h3>
                      <p className="text-slate-600 mb-4">
                        {searchQuery 
                          ? `No requirements match "${searchQuery}". Try adjusting your search.`
                          : requirements.length === 0 
                            ? "You haven't created any requirements yet. Create your first requirement to get started."
                            : "Try adjusting your filters or create a new requirement."
                        }
                      </p>
                      <Link href="/employer-dashboard/create-requirement">
                      <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                        Create Requirement
                      </Button>
                    </Link>
                    </motion.div>
                )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Requirement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this requirement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>



      <EmployerDashboardFooter />
    </div>
    </EmployerAuthGuard>
  )
}
