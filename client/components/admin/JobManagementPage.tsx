"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { apiService } from "@/lib/api"
import { toast } from "sonner"
import {
  Briefcase,
  Search,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Globe,
  Star,
  Users,
  Calendar,
  DollarSign,
  Clock,
  MoreVertical,
  CheckCircle2,
  XCircle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface JobManagementPageProps {
  portal: 'all' | 'normal' | 'gulf'
  title: string
  description: string
  icon: React.ReactNode
}

export default function JobManagementPage({ portal, title, description, icon }: JobManagementPageProps) {
  const { user } = useAuth()
  const router = useRouter()
  
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [showJobDialog, setShowJobDialog] = useState(false)

  useEffect(() => {
    if (!user || (user.userType !== 'admin' && user.userType !== 'superadmin')) {
      router.push('/admin-login')
      return
    }

    loadJobs()
  }, [user, router, currentPage, filterStatus, filterType])

  const loadJobs = async () => {
    try {
      setLoading(true)
      let response
      
      if (portal === 'all') {
        response = await apiService.getAllJobs({
          page: currentPage,
          limit: 20,
          search: searchTerm,
          status: filterStatus === 'all' ? undefined : filterStatus,
          jobType: filterType === 'all' ? undefined : filterType
        })
      } else {
        // For portal-specific jobs, we'll filter by region
        const region = portal === 'gulf' ? 'gulf' : 'india'
        response = await apiService.getAllJobs({
          page: currentPage,
          limit: 20,
          search: searchTerm,
          status: filterStatus === 'all' ? undefined : filterStatus,
          jobType: filterType === 'all' ? undefined : filterType,
          region: region
        })
      }
      
      if (response.success && response.data) {
        setJobs(response.data.jobs || [])
        setTotalPages(response.data.totalPages || 1)
      } else {
        toast.error(`Failed to load ${title.toLowerCase()}`)
        setJobs([])
        setTotalPages(1)
      }
    } catch (error) {
      console.error(`Failed to load ${title.toLowerCase()}:`, error)
      toast.error(`Failed to load ${title.toLowerCase()}`)
      setJobs([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const toggleJobStatus = async (jobId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      const response = await apiService.updateJobStatus(jobId, newStatus)
      
      if (response.success) {
        toast.success(`Job ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`)
        loadJobs()
      } else {
        toast.error('Failed to update job status')
      }
    } catch (error) {
      console.error('Failed to update job status:', error)
      toast.error('Failed to update job status')
    }
  }

  const deleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return
    }

    try {
      const response = await apiService.deleteJob(jobId)
      
      if (response.success) {
        toast.success('Job deleted successfully')
        loadJobs()
      } else {
        toast.error('Failed to delete job')
      }
    } catch (error) {
      console.error('Failed to delete job:', error)
      toast.error('Failed to delete job')
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadJobs()
  }

  const handleFilterChange = () => {
    setCurrentPage(1)
    loadJobs()
  }

  const exportJobs = async () => {
    try {
      const response = await apiService.exportJobs({
        status: filterStatus === 'all' ? undefined : filterStatus,
        jobType: filterType === 'all' ? undefined : filterType,
        region: portal === 'all' ? undefined : (portal === 'gulf' ? 'gulf' : 'india')
      })
      
      if (response.success && response.data) {
        const blob = new Blob([response.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${portal}-jobs-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success('Jobs exported successfully')
      } else {
        toast.error('Failed to export jobs')
      }
    } catch (error) {
      console.error('Failed to export jobs:', error)
      toast.error('Failed to export jobs')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-600'
      case 'inactive': return 'bg-gray-600'
      case 'draft': return 'bg-yellow-600'
      case 'paused': return 'bg-orange-600'
      case 'closed': return 'bg-red-600'
      case 'expired': return 'bg-purple-600'
      case 'deactivated': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'full-time': return 'bg-blue-600'
      case 'part-time': return 'bg-green-600'
      case 'contract': return 'bg-orange-600'
      case 'internship': return 'bg-purple-600'
      case 'freelance': return 'bg-pink-600'
      default: return 'bg-gray-600'
    }
  }

  if (loading && jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center">
        <div className="text-gray-900 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading {title.toLowerCase()}...</p>
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
              className="text-gray-900 hover:bg-gray-100 border border-gray-300"
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
              onClick={exportJobs}
              variant="outline"
              className="text-gray-900 border-gray-300 hover:bg-gray-100 bg-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={loadJobs}
              variant="outline"
              className="text-gray-900 border-gray-300 hover:bg-gray-100 bg-white"
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
                    placeholder="Search jobs by title or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={(value) => { setFilterStatus(value); handleFilterChange() }}>
                  <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={(value) => { setFilterType(value); handleFilterChange() }}>
                  <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="full-time">Full Time</SelectItem>
                    <SelectItem value="part-time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
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

        {/* Jobs List */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              {title} ({jobs.length})
            </CardTitle>
            <CardDescription className="text-gray-600">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600">No {title.toLowerCase()} match your current filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => {
                  // Calculate display status (consider expired jobs)
                  const now = new Date();
                  const validTill = job.validTill ? new Date(job.validTill) : null;
                  const isActuallyExpired = validTill && validTill < now;
                  // In admin, expired/deactivated are the same - show as "deactivated"
                  const displayStatus = isActuallyExpired ? 'deactivated' : (job.status || 'inactive');
                  
                  return (
                  <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{job.title}</h3>
                        <p className="text-gray-600 text-sm">{job.company?.name || 'Unknown Company'}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={getStatusColor(displayStatus)}>
                            {displayStatus}
                          </Badge>
                          <Badge className={getTypeColor(job.jobType)}>
                            {job.jobType}
                          </Badge>
                          {job.location && (
                            <Badge variant="outline" className="text-gray-600 border-gray-300">
                              <MapPin className="w-3 h-3 mr-1" />
                              {job.location}
                            </Badge>
                          )}
                          {job.region && (
                            <Badge 
                              variant="outline" 
                              className={job.region === 'india' ? 'border-orange-500 text-orange-400' : 'border-cyan-500 text-cyan-400'}
                            >
                              {job.region === 'india' ? (
                                <>
                                  <MapPin className="w-3 h-3 mr-1" />
                                  India
                                </>
                              ) : (
                                <>
                                  <Globe className="w-3 h-3 mr-1" />
                                  Gulf
                                </>
                              )}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                          {job.salary && (
                            <div className="flex items-center">
                              <DollarSign className="w-3 h-3 mr-1" />
                              {job.salary}
                            </div>
                          )}
                          {job.experienceLevel && (
                            <div className="flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {job.experienceLevel}
                            </div>
                          )}
                          {job.createdAt && (
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(job.createdAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          router.push(`/super-admin/jobs/${job.id}`)
                        }}
                        className="text-gray-900 hover:bg-gray-100 border-gray-300 bg-white"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleJobStatus(job.id, job.status)}
                        className={`text-gray-900 hover:bg-gray-100 border-gray-300 bg-white ${
                          job.status === 'active' ? 'hover:text-red-600' : 'hover:text-green-600'
                        }`}
                      >
                        {job.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="text-gray-900 hover:bg-gray-100 border-gray-300 bg-white">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => {
                            router.push(`/super-admin/jobs/${job.id}`)
                          }}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleJobStatus(job.id, job.status)}>
                            {job.status === 'active' ? (
                              <>
                                <XCircle className="w-4 h-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteJob(job.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-gray-600 text-sm">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="text-gray-900 border-gray-300 hover:bg-gray-100 bg-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="text-gray-900 border-gray-300 hover:bg-gray-100 bg-white"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Details Dialog */}
        <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
          <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Job Details
              </DialogTitle>
              <DialogDescription className="text-slate-300">
                Complete information about the selected job
              </DialogDescription>
            </DialogHeader>
            {selectedJob && (() => {
              // Calculate display status for selected job too
              const now = new Date();
              const validTill = selectedJob.validTill ? new Date(selectedJob.validTill) : null;
              const isActuallyExpired = validTill && validTill < now;
              const displayStatus = isActuallyExpired ? 'deactivated' : (selectedJob.status || 'inactive');
              
              return (
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white">{selectedJob.title}</h2>
                    <p className="text-gray-400">{selectedJob.company?.name || 'Unknown Company'}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getStatusColor(displayStatus)}>
                        {displayStatus}
                      </Badge>
                      <Badge className={getTypeColor(selectedJob.jobType)}>
                        {selectedJob.jobType}
                      </Badge>
                      {selectedJob.region && (
                        <Badge 
                          variant="outline" 
                          className={selectedJob.region === 'india' ? 'border-orange-500 text-orange-400' : 'border-cyan-500 text-cyan-400'}
                        >
                          {selectedJob.region === 'india' ? 'India' : 'Gulf'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400">Location</label>
                      <p className="text-white">{selectedJob.location || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Salary</label>
                      <p className="text-white">{selectedJob.salary || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Experience Level</label>
                      <p className="text-white">{selectedJob.experienceLevel || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Job Category</label>
                      <p className="text-white">{selectedJob.category || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Application Deadline</label>
                      <p className="text-white">
                        {selectedJob.applicationDeadline 
                          ? new Date(selectedJob.applicationDeadline).toLocaleDateString()
                          : 'Not specified'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400">Company</label>
                      <p className="text-white">{selectedJob.company?.name || 'Unknown Company'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Posted By</label>
                      <p className="text-white">{selectedJob.postedBy?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Created Date</label>
                      <p className="text-white">{new Date(selectedJob.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Last Updated</label>
                      <p className="text-white">{new Date(selectedJob.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Total Applications</label>
                      <p className="text-white">{selectedJob.totalApplications || 0}</p>
                    </div>
                  </div>
                </div>

                {selectedJob.description && (
                  <div>
                    <label className="text-sm text-gray-400">Description</label>
                    <div className="text-white mt-1 whitespace-pre-wrap">{selectedJob.description}</div>
                  </div>
                )}

                {selectedJob.requirements && (
                  <div>
                    <label className="text-sm text-gray-400">Requirements</label>
                    <div className="text-white mt-1 whitespace-pre-wrap">{selectedJob.requirements}</div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="text-sm text-gray-400">
                    Job ID: {selectedJob.id}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleJobStatus(selectedJob.id, selectedJob.status)}
                      className={`border-white/20 text-white hover:bg-white/10 bg-white/5 ${
                        selectedJob.status === 'active' ? 'hover:text-red-400' : 'hover:text-green-400'
                      }`}
                    >
                      {selectedJob.status === 'active' ? (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Activate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
