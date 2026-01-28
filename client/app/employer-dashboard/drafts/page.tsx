"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Plus, Search, Filter, MoreHorizontal, Eye, Edit, Send, Trash2,
  Users, Calendar, MapPin, Briefcase, Loader2, AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { EmployerNavbar } from "@/components/employer-navbar"
import { EmployerFooter } from "@/components/employer-footer"
import { useAuth } from "@/hooks/useAuth"
import { apiService } from "@/lib/api"
import { toast } from "sonner"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"

export default function DraftsPage() {
  const { user, loading: authLoading } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [drafts, setDrafts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    if (user && !authLoading) {
      fetchDrafts()
    }
  }, [user, authLoading, searchQuery, pagination.page])

  const fetchDrafts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching drafts with params:', {
        page: pagination.page,
        limit: pagination.limit,
        status: 'draft',
        search: searchQuery || undefined
      })

      const response = await apiService.getEmployerJobs({
        page: pagination.page,
        limit: pagination.limit,
        status: 'draft',
        search: searchQuery || undefined,
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      })

      if (response.success) {
        console.log('✅ Drafts fetched successfully:', response.data)
        
        // Filter to ensure only draft jobs are shown (in case backend doesn't filter properly)
        const draftJobsOnly = response.data.filter((job: any) => job.status === 'draft');
        console.log('🔍 Filtered drafts:', draftJobsOnly.length, 'out of', response.data.length, 'jobs');
        
        // Log any jobs that shouldn't be in drafts
        const nonDraftJobs = response.data.filter((job: any) => job.status !== 'draft');
        if (nonDraftJobs.length > 0) {
          console.log('⚠️ Found non-draft jobs in response:', nonDraftJobs.map((j: any) => ({ id: j.id, title: j.title, status: j.status })));
        }
        
        setDrafts(draftJobsOnly)
        setPagination(prev => ({
          ...prev,
          total: draftJobsOnly.length,
          pages: Math.ceil(draftJobsOnly.length / pagination.limit)
        }))
      } else {
        console.error('❌ Failed to fetch drafts:', response)
        setError(response.message || 'Failed to fetch drafts')
        toast.error(response.message || 'Failed to fetch drafts')
      }
    } catch (error: any) {
      console.error('❌ Error fetching drafts:', error)
      
      if (error.message?.includes('DATABASE_CONNECTION_ERROR')) {
        setError('Database connection error. Please try again later.')
        toast.error('Database connection error. Please try again later.')
      } else if (error.message?.includes('401') || error.message?.includes('403')) {
        setError('Authentication required. Please log in again.')
        toast.error('Authentication required. Please log in again.')
      } else {
        setError(error.message || 'Failed to fetch drafts')
        toast.error(error.message || 'Failed to fetch drafts')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (newSearch: string) => {
    setSearchQuery(newSearch)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handlePublishDraft = async (jobId: string) => {
    if (!confirm('Are you sure you want to publish this draft? It will become visible to job seekers.')) {
      return
    }

    try {
      console.log('📤 Publishing draft:', jobId)
      
      const response = await apiService.updateJobStatus(jobId, 'active')
      
      if (response.success) {
        console.log('✅ Draft published successfully')
        toast.success('Draft published successfully')
        fetchDrafts() // Refresh the drafts list
      } else {
        console.error('❌ Failed to publish draft:', response)
        toast.error(response.message || 'Failed to publish draft')
      }
    } catch (error: any) {
      console.error('❌ Error publishing draft:', error)
      toast.error(error.message || 'Failed to publish draft')
    }
  }

  const handleDeleteDraft = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      return
    }

    try {
      console.log('🗑️ Deleting draft:', jobId)
      
      const response = await apiService.deleteJob(jobId)
      
      if (response.success) {
        console.log('✅ Draft deleted successfully')
        toast.success('Draft deleted successfully')
        fetchDrafts() // Refresh the drafts list
      } else {
        console.error('❌ Failed to delete draft:', response)
        toast.error(response.message || 'Failed to delete draft')
      }
    } catch (error: any) {
      console.error('❌ Error deleting draft:', error)
      toast.error(error.message || 'Failed to delete draft')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  return (
    <EmployerAuthGuard>
      return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <EmployerNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Job Drafts</h1>
            <p className="text-slate-600">Manage your unpublished job drafts</p>
          </div>
          <Link href="/employer-dashboard/post-job">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Create New Draft
            </Button>
          </Link>
        </div>

        {/* Search */}
        <Card className="bg-white/80 backdrop-blur-xl border-slate-200/50 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search drafts by title, department..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Drafts List */}
        <Card className="bg-white/80 backdrop-blur-xl border-slate-200/50">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Loading State */}
              {loading && (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-slate-600">Loading your drafts...</p>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2"
                      onClick={fetchDrafts}
                    >
                      Try Again
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Drafts List */}
              {!loading && !error && drafts.length > 0 ? (
                drafts.map((draft: any, index: number) => (
                  <motion.div
                    key={draft.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                          <Link
                            href={`/employer-dashboard/post-job?draft=${draft.id}`}
                            className="text-xl font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            {draft.title || 'Untitled Job'}
                          </Link>
                          <Badge className="bg-gray-100 text-gray-800 border-gray-200">Draft</Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <Briefcase className="w-4 h-4" />
                            <span>{draft.department || 'Not specified'}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {draft.location || 'Not specified'} • {draft.jobType || draft.type || 'Not specified'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(draft.createdAt)}</span>
                          </div>
                        </div>

                        <div className="text-sm text-slate-600 mb-4">
                          {draft.description ? (
                            <p className="line-clamp-2">{draft.description}</p>
                          ) : (
                            <p className="text-slate-400 italic">No description added yet</p>
                          )}
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-slate-600">
                          <span>•</span>
                          <span>{draft.salary || (draft.salaryMin && draft.salaryMax ? `₹${draft.salaryMin}-${draft.salaryMax} LPA` : 'Salary not specified')}</span>
                          <span>•</span>
                          <span>{draft.skills?.length || 0} skills added</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Link href={`/employer-dashboard/post-job?draft=${draft.id}`}>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePublishDraft(draft.id)}>
                              <Send className="w-4 h-4 mr-2" />
                              Publish Draft
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteDraft(draft.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Draft
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : !loading && !error && drafts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-slate-400" />
                  </div>
                                     <h3 className="text-lg font-medium text-slate-900 mb-2">No drafts found</h3>
                   <p className="text-slate-600 mb-4">
                     {searchQuery
                       ? "Try adjusting your search"
                       : "To create a draft, go to Post a Job and click 'Save Draft' before publishing"}
                   </p>
                  <Link href="/employer-dashboard/post-job">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Draft
                    </Button>
                  </Link>
                </div>
              ) : null}

              {/* Pagination */}
              {!loading && !error && drafts.length > 0 && pagination.pages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                  <div className="text-sm text-slate-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} drafts
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-slate-600">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <EmployerFooter />
    </div>
    </EmployerAuthGuard>
  )
}
