"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Send,
  Trash2,
  Users,
  Calendar,
  MapPin,
  Briefcase,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { GulfEmployerNavbar } from "@/components/gulf-employer-navbar"
import { EmployerFooter } from "@/components/employer-footer"
import { useAuth } from "@/hooks/useAuth"
import { apiService } from "@/lib/api"
import { toast } from "sonner"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"
import { GulfEmployerAuthGuard } from "@/components/gulf-employer-auth-guard"

interface PaginationState {
  page: number
  limit: number
  total: number
  pages: number
}

export default function GulfDraftsPage() {
  return (
    <EmployerAuthGuard>
      <GulfEmployerAuthGuard>
        <GulfDraftsContent />
      </GulfEmployerAuthGuard>
    </EmployerAuthGuard>
  )
}

function GulfDraftsContent() {
  const { user, loading: authLoading } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [drafts, setDrafts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })

  useEffect(() => {
    if (user && !authLoading) {
      fetchDrafts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, searchQuery, pagination.page])

  const isGulfJob = (job: any) => {
    const regionCandidates = [
      job?.region,
      job?.metadata?.region,
      job?.metadata?.jobRegion,
      job?.metadata?.targetRegion,
      job?.preferences?.region,
      job?.metadata?.regions?.[0],
    ]
      .filter(Boolean)
      .map((value: any) => String(value).toLowerCase())

    if (regionCandidates.length === 0) {
      // If region is not specified, default to including the draft so employers can recover it
      return true
    }

    return regionCandidates.includes("gulf")
  }

  const fetchDrafts = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiService.getEmployerJobs({
        page: pagination.page,
        limit: pagination.limit,
        status: "draft",
        search: searchQuery || undefined,
        sortBy: "createdAt",
        sortOrder: "DESC",
      })

      if (response.success) {
        const rawJobs = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.jobs)
          ? response.data.jobs
          : []

        const draftJobsOnly = rawJobs.filter((job: any) => job.status === "draft")
        const gulfDraftsOnly = draftJobsOnly.filter(isGulfJob)

        setDrafts(gulfDraftsOnly)
        setPagination((prev) => ({
          ...prev,
          total: gulfDraftsOnly.length,
          pages: Math.max(1, Math.ceil(gulfDraftsOnly.length / prev.limit)),
        }))
      } else {
        setError(response.message || "Failed to fetch drafts")
        toast.error(response.message || "Failed to fetch drafts")
      }
    } catch (error: any) {
      setError(error.message || "Failed to fetch drafts")
      toast.error(error.message || "Failed to fetch drafts")
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (newSearch: string) => {
    setSearchQuery(newSearch)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  const handlePublishDraft = async (jobId: string) => {
    if (!confirm("Publish this draft? It will become visible to job seekers.")) {
      return
    }

    try {
      const response = await apiService.updateJobStatus(jobId, "active")

      if (response.success) {
        toast.success("Draft published successfully")
        fetchDrafts()
      } else {
        toast.error(response.message || "Failed to publish draft")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to publish draft")
    }
  }

  const handleDeleteDraft = async (jobId: string) => {
    if (!confirm("Delete this draft? This action cannot be undone.")) {
      return
    }

    try {
      const response = await apiService.deleteJob(jobId)

      if (response.success) {
        toast.success("Draft deleted successfully")
        fetchDrafts()
      } else {
        toast.error(response.message || "Failed to delete draft")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete draft")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "1 day ago"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Briefcase className="w-8 h-8 text-emerald-500" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-2">No drafts found</h3>
      <p className="text-slate-600 mb-4">
        {searchQuery
          ? "Try adjusting your search"
          : "To create a draft, go to Post a Job and click 'Save Draft' before publishing"}
      </p>
      <Link href="/gulf-dashboard/post-job">
        <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Your First Draft
        </Button>
      </Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-teal-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-hidden">
      <GulfEmployerNavbar />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/45 via-teal-200/35 to-amber-200/45"></div>
        <div className="absolute top-20 left-16 w-44 h-44 bg-gradient-to-br from-emerald-300/15 to-teal-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-24 right-12 w-40 h-40 bg-gradient-to-br from-amber-300/15 to-emerald-200/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 bg-gradient-to-br from-teal-300/10 to-emerald-200/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Gulf Job Drafts</h1>
            <p className="text-slate-600">Manage your unpublished Gulf job drafts</p>
          </div>
          <Link href="/gulf-dashboard/post-job">
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              Create New Draft
            </Button>
          </Link>
        </div>

        <Card className="bg-white/70 backdrop-blur-xl border-emerald-100/60 mb-8">
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

        <Card className="bg-white/70 backdrop-blur-xl border-emerald-100/60">
          <CardContent className="p-6">
            <div className="space-y-6">
              {loading && (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
                  <p className="text-slate-600">Loading your drafts...</p>
                </div>
              )}

              {error && !loading && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                    <Button variant="outline" size="sm" className="ml-2" onClick={fetchDrafts}>
                      Try Again
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {!loading && !error && drafts.length > 0 &&
                drafts.map((draft: any, index: number) => (
                  <motion.div
                    key={draft.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="border border-emerald-100 rounded-lg p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <Link
                            href={`/gulf-dashboard/post-job?draft=${draft.id}`}
                            className="text-xl font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                          >
                            {draft.title || "Untitled Job"}
                          </Link>
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Draft</Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <Briefcase className="w-4 h-4" />
                            <span>{draft.department || "Not specified"}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {draft.location || "Not specified"} • {draft.jobType || draft.type || "Not specified"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(draft.createdAt || draft.created_at)}</span>
                          </div>
                        </div>

                        <div className="text-sm text-slate-600 mb-4">
                          {draft.description ? (
                            <p className="line-clamp-2">{draft.description}</p>
                          ) : (
                            <p className="text-slate-400 italic">No description added yet</p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                          <span>{draft.salary || (draft.salaryMin && draft.salaryMax ? `${draft.salaryMin}-${draft.salaryMax}` : "Salary not specified")}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{draft.skills?.length || 0} skills added</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Link href={`/gulf-dashboard/post-job?draft=${draft.id}`}>
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
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteDraft(draft.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Draft
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </motion.div>
                ))}

              {!loading && !error && drafts.length === 0 && renderEmptyState()}

              {!loading && !error && drafts.length > 0 && pagination.pages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-emerald-100">
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
                    <span className="text-sm text-slate-600">Page {pagination.page} of {pagination.pages}</span>
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
  )
}
