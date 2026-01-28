"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Eye, 
  Download,
  Mail,
  Phone,
  Calendar,
  User,
  Globe,
  X,
  FileText,
  MapPin,
  Briefcase,
  Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import { GulfEmployerNavbar } from "@/components/gulf-employer-navbar"
import { EmployerFooter } from "@/components/employer-footer"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"
import { useAuth } from "@/hooks/useAuth"
import { apiService } from "@/lib/api"

export default function GulfApplicationsPage() {
  const { user } = useAuth()

  return (
    <EmployerAuthGuard>
      <GulfApplicationsContent user={user} />
    </EmployerAuthGuard>
  )
}

function GulfApplicationsContent({ user }: { user: any }) {
  const router = useRouter()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      setLoading(true)
      const response = await apiService.getGulfEmployerApplications()
      if (response.success && response.data) {
        setApplications(response.data)
      }
    } catch (error) {
      console.error('Error loading applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (application: any) => {
    try {
      const response = await apiService.getEmployerApplicationDetails(application.id)
      if (response.success) {
        setSelectedApplication(response.data)
        setIsDetailModalOpen(true)
      } else {
        toast.error('Failed to load application details')
      }
    } catch (error) {
      console.error('Error fetching application details:', error)
      toast.error('Failed to load application details')
    }
  }

  const handleDownloadResume = async (resume: any, applicationId: string) => {
    if (!resume?.id) {
      toast.error('Resume not available for download')
      return
    }

    try {
      // For applications, we need to use the application-based download endpoint
      const response = await apiService.downloadApplicationResume(resume.id, applicationId)
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`)
      }
      
      // Get the filename from the response headers or use a default
      const contentDisposition = response.headers.get('content-disposition')
      let filename = resume.metadata?.filename || `${resume.title || 'Resume'}.pdf`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)
      
      toast.success('Resume downloaded successfully')
    } catch (error) {
      console.error('Error downloading resume:', error)
      toast.error('Failed to download resume')
    }
  }

  const handleViewResume = async (resume: any, applicationId: string) => {
    if (!resume?.id) {
      toast.error('Resume not available for viewing')
      return
    }

    try {
      // First log the resume view activity
      try {
        await apiService.viewApplicationResume(applicationId)
        console.log('✅ Resume view activity logged')
      } catch (activityError) {
        console.error('Failed to log resume view activity:', activityError)
        // Don't fail the view if activity logging fails
      }

      // First try to use the metadata fileUrl if available
      if (resume.metadata?.fileUrl) {
        window.open(resume.metadata.fileUrl, '_blank', 'noopener,noreferrer')
        return
      }

      // If no direct URL, fetch the resume file and create a blob URL for viewing
      const response = await apiService.downloadApplicationResume(resume.id, applicationId)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        
        // Open the resume in a new tab
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
        
        // Clean up the blob URL after a delay to allow the browser to load it
        setTimeout(() => {
          window.URL.revokeObjectURL(url)
        }, 10000)
        
        if (!newWindow) {
          toast.error('Please allow popups to view the resume')
        }
      } else {
        toast.error('Failed to load resume for viewing')
      }
    } catch (error) {
      console.error('Error viewing resume:', error)
      toast.error('Failed to view resume')
    }
  }

  const handleDownloadCoverLetter = async (coverLetter: any) => {
    if (!coverLetter?.id) {
      toast.error('Cover letter not available for download')
      return
    }

    try {
      // Use the cover letter download endpoint
      const response = await apiService.downloadCoverLetter(coverLetter.id)
      
      // Get the filename from the response headers or use a default
      const contentDisposition = response.headers.get('content-disposition')
      let filename = coverLetter.metadata?.filename || `${coverLetter.title || 'CoverLetter'}.pdf`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Cover letter downloaded successfully')
    } catch (error) {
      console.error('Error downloading cover letter:', error)
      toast.error('Failed to download cover letter')
    }
  }

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      const response = await apiService.updateEmployerApplicationStatus(applicationId, newStatus)
      if (response.success) {
        toast.success('Application status updated successfully')
        loadApplications()
      } else {
        toast.error('Failed to update application status')
      }
    } catch (error) {
      console.error('Error updating application status:', error)
      toast.error('Failed to update application status')
    }
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.applicant?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicant?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      applied: { color: "bg-blue-100 text-blue-800", label: "Applied" },
      reviewing: { color: "bg-yellow-100 text-yellow-800", label: "Under Review" },
      shortlisted: { color: "bg-purple-100 text-purple-800", label: "Shortlisted" },
      interview_scheduled: { color: "bg-orange-100 text-orange-800", label: "Interview Scheduled" },
      hired: { color: "bg-green-100 text-green-800", label: "Hired" },
      rejected: { color: "bg-red-100 text-red-800", label: "Rejected" }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.applied
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-lime-50/40 to-yellow-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-hidden">
      <GulfEmployerNavbar />

      {/* Background Effects - Gulf theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-emerald-300/10 to-lime-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-yellow-300/10 to-amber-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-lime-300/10 to-emerald-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-0 right-0 h-24 bg-gradient-to-r from-emerald-400/20 via-lime-400/20 to-yellow-400/20"></div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-20 sm:pt-24 lg:pt-28 pb-6 sm:pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Applications - Gulf Region</h1>
              <p className="text-slate-600">Manage job applications for your Gulf region postings</p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6"
        >
          <Card className="bg-white/60 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(16,185,129,0.06)]">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search by candidate name or job title..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="reviewing">Under Review</SelectItem>
                      <SelectItem value="shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Applications List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {loading ? (
            <Card className="bg-white/60 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(16,185,129,0.06)]">
              <CardContent className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading applications...</p>
              </CardContent>
            </Card>
          ) : filteredApplications.length > 0 ? (
            <div className="grid gap-6">
              {filteredApplications.map((application, index) => (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="bg-white/60 backdrop-blur-xl border-white/40 hover:shadow-[0_18px_50px_rgba(16,185,129,0.14)] transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02]">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={application.applicant?.avatar} />
                          <AvatarFallback>
                            {getInitials(application.applicant?.first_name, application.applicant?.last_name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">
                                {application.applicant?.first_name} {application.applicant?.last_name}
                              </h3>
                              <p className="text-slate-600">{application.job?.title}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(application.status)}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-4">
                            <div className="flex items-center space-x-1">
                              <Mail className="w-4 h-4" />
                              <span>{application.applicant?.email}</span>
                            </div>
                            {application.applicant?.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="w-4 h-4" />
                                <span>{application.applicant.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>Applied {new Date(application.appliedAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {application.applicant?.headline && (
                            <p className="text-slate-600 text-sm mb-4">
                              {application.applicant.headline}
                            </p>
                          )}

                          {application.applicant?.skills && application.applicant.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {application.applicant.skills.slice(0, 5).map((skill: string, skillIndex: number) => (
                                <Badge key={skillIndex} variant="secondary" className="text-xs bg-emerald-50 text-emerald-700">
                                  {skill}
                                </Badge>
                              ))}
                              {application.applicant.skills.length > 5 && (
                                <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700">
                                  +{application.applicant.skills.length - 5} more
                                </Badge>
                              )}
                            </div>
                          )}

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(application)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                            
                            <Select
                              value={application.status}
                              onValueChange={(value) => handleStatusChange(application.id, value)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="applied">Applied</SelectItem>
                                <SelectItem value="reviewing">Under Review</SelectItem>
                                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                                <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                                <SelectItem value="hired">Hired</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>

                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="bg-white/60 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(16,185,129,0.06)]">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No applications found</h3>
                <p className="text-slate-600 mb-6">
                  {searchTerm || statusFilter !== "all" 
                    ? "No applications match your current filters. Try adjusting your search criteria."
                    : "You haven't received any applications yet. Make sure your jobs are active and visible."
                  }
                </p>
                <Button
                  onClick={() => router.push('/gulf-dashboard/post-job')}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl"
                >
                  Post a New Job
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      <EmployerFooter />

      {/* Application Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Application Details</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6">
              {/* Candidate Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Candidate Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={selectedApplication.applicant?.avatar} />
                      <AvatarFallback>
                        {getInitials(selectedApplication.applicant?.first_name, selectedApplication.applicant?.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-slate-900">
                        {selectedApplication.applicant?.first_name} {selectedApplication.applicant?.last_name}
                      </h3>
                      <p className="text-slate-600 mb-2">{selectedApplication.applicant?.headline}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span>{selectedApplication.applicant?.email}</span>
                        </div>
                        {selectedApplication.applicant?.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <span>{selectedApplication.applicant.phone}</span>
                          </div>
                        )}
                        {selectedApplication.applicant?.current_location && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span>{selectedApplication.applicant.current_location}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>Applied {new Date(selectedApplication.appliedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(selectedApplication.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Job Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Briefcase className="w-5 h-5" />
                    <span>Job Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-slate-900">{selectedApplication.job?.title}</h4>
                      <p className="text-slate-600">{selectedApplication.job?.company?.name}</p>
                    </div>
                    {selectedApplication.job?.location && (
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <MapPin className="w-4 h-4" />
                        <span>{selectedApplication.job.location}</span>
                      </div>
                    )}
                    {selectedApplication.job?.description && (
                      <div>
                        <h5 className="font-medium text-slate-900 mb-2">Job Description</h5>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">
                          {selectedApplication.job.description}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Skills */}
              {selectedApplication.applicant?.skills && selectedApplication.applicant.skills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>Skills</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplication.applicant.skills.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Experience */}
              {selectedApplication.applicant?.experience_years && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="w-5 h-5" />
                      <span>Experience</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">
                      {selectedApplication.applicant.experience_years} years of experience
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Cover Letter */}
              {(selectedApplication.coverLetter || selectedApplication.jobCoverLetter) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-5 h-5" />
                        <span>Cover Letter</span>
                      </div>
                      {selectedApplication.jobCoverLetter?.metadata?.fileUrl && (
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a href={selectedApplication.jobCoverLetter.metadata.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Eye className="w-4 h-4 mr-2" />
                              View File
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadCoverLetter(selectedApplication.jobCoverLetter)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedApplication.coverLetter && (
                      <div className="bg-slate-50 p-4 rounded-lg mb-4">
                        <p className="text-slate-600 whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                      </div>
                    )}
                    {selectedApplication.jobCoverLetter && (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-slate-900">{selectedApplication.jobCoverLetter.title}</h4>
                          {selectedApplication.jobCoverLetter.summary && (
                            <p className="text-slate-600 mt-2">{selectedApplication.jobCoverLetter.summary}</p>
                          )}
                        </div>
                        
                        {selectedApplication.jobCoverLetter.skills && selectedApplication.jobCoverLetter.skills.length > 0 && (
                          <div>
                            <h5 className="font-medium text-slate-900 mb-2">Cover Letter Skills</h5>
                            <div className="flex flex-wrap gap-1">
                              {selectedApplication.jobCoverLetter.skills.map((skill: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center text-sm text-slate-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          Last updated: {new Date(selectedApplication.jobCoverLetter.lastUpdated).toLocaleDateString()}
                        </div>
                        
                        {selectedApplication.jobCoverLetter.metadata?.filename && (
                          <div className="flex items-center text-sm text-slate-500">
                            <FileText className="w-4 h-4 mr-1" />
                            File: {selectedApplication.jobCoverLetter.metadata.filename}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Resume */}
              {selectedApplication.jobResume && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-5 h-5" />
                        <span>Resume/CV</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewResume(selectedApplication.jobResume, selectedApplication.id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadResume(selectedApplication.jobResume, selectedApplication.id)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-slate-900">{selectedApplication.jobResume.title}</h4>
                        {selectedApplication.jobResume.summary && (
                          <p className="text-slate-600 mt-2">{selectedApplication.jobResume.summary}</p>
                        )}
                      </div>
                      
                      {selectedApplication.jobResume.skills && selectedApplication.jobResume.skills.length > 0 && (
                        <div>
                          <h5 className="font-medium text-slate-900 mb-2">Resume Skills</h5>
                          <div className="flex flex-wrap gap-1">
                            {selectedApplication.jobResume.skills.map((skill: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-slate-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        Last updated: {new Date(selectedApplication.jobResume.lastUpdated).toLocaleDateString()}
                      </div>
                      
                      {selectedApplication.jobResume.metadata?.filename && (
                        <div className="flex items-center text-sm text-slate-500">
                          <FileText className="w-4 h-4 mr-1" />
                          File: {selectedApplication.jobResume.metadata.filename}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
