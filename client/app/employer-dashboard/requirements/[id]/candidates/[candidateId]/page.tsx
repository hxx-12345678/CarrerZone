"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { 
  ArrowLeft, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Clock, 
  Mail, 
  Phone, 
  Download, 
  Star, 
  Calendar,
  Users,
  Building2,
  Award,
  Globe,
  Linkedin,
  Github,
  ExternalLink,
  Eye,
  Share2,
  FileText,
  Loader2,
  X,
  MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { EmployerDashboardNavbar } from "@/components/employer-dashboard-navbar"
import { EmployerDashboardFooter } from "@/components/employer-dashboard-footer"
import { PDFViewer } from "@/components/pdf-viewer"
import { apiService, constructAvatarUrl } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"

export default function CandidateProfilePage() {
  const params = useParams()
  const requirementId: string = String((params as any)?.id || '')
  const candidateIdStr: string = String((params as any)?.candidateId || '')
  const [activeTab, setActiveTab] = useState("overview")
  const [candidate, setCandidate] = useState<any>(null)
  const [requirement, setRequirement] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isShortlisted, setIsShortlisted] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isContacting, setIsContacting] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [message, setMessage] = useState("")
  const [subject, setSubject] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(true)
  const [pdfError, setPdfError] = useState(false)
  const [pdfLoaded, setPdfLoaded] = useState(false)
  const { toast } = useToast()

  // Ensure API links hit backend, not the Next.js origin
  const toAbsoluteApiUrl = (url?: string) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    if (!base) return url;
    const normalizedBase = base.replace(/\/$/, "");
    let normalizedUrl = url.startsWith("/") ? url : `/${url}`;
    // Avoid /api/api duplication
    if (normalizedBase.endsWith('/api') && normalizedUrl.startsWith('/api')) {
      normalizedUrl = normalizedUrl.replace(/^\/api/, '');
      if (!normalizedUrl.startsWith('/')) normalizedUrl = `/${normalizedUrl}`;
    }
    return `${normalizedBase}${normalizedUrl}`;
  }

  useEffect(() => {
    const fetchCandidateProfile = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // NOTE: Profile view tracking is handled by the backend API endpoint
        // (/api/requirements/:id/candidates/:candidateId) which correctly includes
        // the requirementId (jobId) in the view tracking. This ensures the "accessed"
        // count on the requirements page is incremented correctly.
        // Do NOT call trackProfileView here as it would create a duplicate view
        // without the requirementId, preventing proper accessed count tracking.
        
        const response = await apiService.getCandidateProfile(
          requirementId,
          candidateIdStr
        )
        
        if (response.success) {
          console.log('📄 Candidate data received:', response.data.candidate)
          console.log('📄 Resumes in candidate data:', response.data.candidate?.resumes)
          console.log('💼 Work Experience in candidate data:', response.data.candidate?.workExperience)
          console.log('💼 Work Experience length:', response.data.candidate?.workExperience?.length)
          console.log('✅ Verification data:', {
            phoneVerified: response.data.candidate?.phoneVerified,
            emailVerified: response.data.candidate?.emailVerified,
            profileCompletion: response.data.candidate?.profileCompletion
          })
          setCandidate(response.data.candidate)
          setRequirement(response.data.requirement)
          setIsShortlisted(response.data.candidate?.isShortlisted || false)
        } else {
          setError(response.message || 'Failed to fetch candidate profile')
          toast({
            title: "Error",
            description: response.message || 'Failed to fetch candidate profile',
            variant: "destructive"
          })
        }
      } catch (err) {
        console.error('Error fetching candidate profile:', err)
        setError('Failed to fetch candidate profile')
        toast({
          title: "Error",
          description: 'Failed to fetch candidate profile',
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.id && params.candidateId) {
      fetchCandidateProfile()
    }
  }, [params.id, params.candidateId, toast])

  // Reset PDF states when candidate changes
  useEffect(() => {
    setPdfLoading(true);
    setPdfError(false);
    setPdfLoaded(false);
    
    // Set a timeout to show error if PDF doesn't load within 10 seconds
    const timeout = setTimeout(() => {
      if (pdfLoading && !pdfLoaded) {
        console.log('📄 PDF loading timeout - showing error');
        setPdfError(true);
        setPdfLoading(false);
      }
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, [candidate?.id, pdfLoading, pdfLoaded])

  // Additional timeout for better error handling
  useEffect(() => {
    if (pdfLoading && !pdfLoaded) {
      const timeout = setTimeout(() => {
        console.log('📄 PDF loading timeout - showing error state');
        setPdfError(true);
        setPdfLoading(false);
      }, 8000); // 8 second timeout

      return () => clearTimeout(timeout);
    }
  }, [pdfLoading, pdfLoaded])

  // Handle resume download
  const handleDownloadResume = async (resume: any) => {
    if (!resume?.id) {
      toast({
        title: "Error",
        description: "Resume not available for download",
        variant: "destructive"
      })
      return
    }

    try {
      setIsDownloading(true)
      
      // Use the API service to download the resume
      const response = await apiService.downloadCandidateResume(requirementId, candidateIdStr, resume.id)
      
      // Get the filename from the response headers or use a default
      const contentDisposition = response.headers.get('content-disposition')
      let filename = resume.filename || `${candidate.name}_Resume.pdf`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Success",
        description: "Resume download started"
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download resume",
        variant: "destructive"
      })
    } finally {
      setIsDownloading(false)
    }
  }

  // Handle resume view (mimic Applications viewer)
  const handleViewResume = async (resume: any) => {
    if (!resume?.id) {
      toast({
        title: "Error",
        description: "Resume not available for viewing",
        variant: "destructive"
      })
      return
    }

    try {
      // Get token for authentication
      const token = localStorage.getItem('token')
      
      // Create view URL with token
      const viewUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/requirements/${requirementId}/candidates/${candidateIdStr}/resume/${resume.id}/view${token ? `?token=${encodeURIComponent(token)}` : ''}`
      
      // Open in new tab
      window.open(viewUrl, '_blank', 'noopener,noreferrer')
      
      toast({
        title: "Success",
        description: "Resume opened in new tab"
      })
    } catch (error) {
      console.error('View error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to view resume",
        variant: "destructive"
      })
    }
  }

  // Handle cover letter view
  const handleViewCoverLetter = (coverLetter: any) => {
    try {
      // Try direct url first
      const direct = toAbsoluteApiUrl(coverLetter?.fileUrl || coverLetter?.metadata?.fileUrl)
      if (direct) {
        window.open(direct, '_blank', 'noopener,noreferrer')
        return
      }
      // Fallback to API download -> blob view
      if (coverLetter?.id) {
        apiService.downloadCandidateCoverLetter(candidate.id, coverLetter.id)
          .then(async (resp) => {
            if (!resp.ok) throw new Error(`Failed: ${resp.status}`)
            const blob = await resp.blob()
            const url = window.URL.createObjectURL(blob)
            const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
            setTimeout(() => window.URL.revokeObjectURL(url), 10000)
            if (!newWindow) {
              toast({ title: 'Popup blocked', description: 'Please allow popups to view the cover letter', variant: 'destructive' })
            }
          })
          .catch((e) => {
            console.error('Cover letter view error:', e)
            toast({ title: 'Error', description: 'Failed to view cover letter', variant: 'destructive' })
          })
        return
      }
      // Last resort: show inline content
      toast({ title: 'Cover Letter', description: coverLetter?.content || 'Cover letter not available' })
    } catch (e) {
      console.error('Cover letter view error:', e)
      toast({ title: 'Error', description: 'Failed to view cover letter', variant: 'destructive' })
    }
  }

  // Handle cover letter download
  const handleDownloadCoverLetter = async (coverLetter: any) => {
    console.log('🔍 Downloading cover letter:', coverLetter)
    
    if (!coverLetter?.id) {
      toast({
        title: "Error",
        description: "Cover letter not available for download",
        variant: "destructive"
      })
      return
    }

    try {
      setIsDownloading(true)
      
      // Try direct file download first if fileUrl is available
      const fileUrl = toAbsoluteApiUrl(coverLetter?.fileUrl || coverLetter?.metadata?.fileUrl)
      if (fileUrl) {
        console.log('📄 Downloading cover letter file directly:', fileUrl)
        
        // Get filename from cover letter data
        const filename = coverLetter.filename || 
                        coverLetter.metadata?.filename || 
                        coverLetter.metadata?.originalName || 
                        `${candidate.name}_CoverLetter.pdf`
        
        // Create a temporary link to download the file
        const link = document.createElement('a')
        link.href = fileUrl
        link.download = filename
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast({
          title: "Success",
          description: "Cover letter download started"
        })
        return
      }
      
      // Fallback to API download
      console.log('📄 Downloading cover letter via API:', coverLetter.id)
      const response = await apiService.downloadCandidateCoverLetter(candidateIdStr, String(coverLetter.id))
      
      // Get the filename from the response headers or use a default
      const contentDisposition = response.headers.get('content-disposition')
      let filename = coverLetter.filename || 
                    coverLetter.metadata?.filename || 
                    coverLetter.metadata?.originalName || 
                    `${candidate.name}_CoverLetter.pdf`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Success",
        description: "Cover letter download started"
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download cover letter",
        variant: "destructive"
      })
    } finally {
      setIsDownloading(false)
    }
  }

  // Handle shortlist candidate
  const handleShortlistCandidate = async () => {
    try {
      setIsContacting(true) // Reuse this state for shortlist loading
      
      const response = await apiService.shortlistCandidate(
        params.id as string,
        params.candidateId as string
      )
      
      if (response.success) {
        setIsShortlisted(!isShortlisted)
        toast({
          title: "Success",
          description: isShortlisted ? "Candidate removed from shortlist" : "Candidate added to shortlist"
        })
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update shortlist",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Shortlist error:', error)
      toast({
        title: "Error",
        description: "Failed to update shortlist",
        variant: "destructive"
      })
    } finally {
      setIsContacting(false)
    }
  }

  // Handle contact candidate - directly open message modal
  const handleContactCandidate = () => {
    setShowMessageModal(true)
    setSubject(`Job Opportunity: ${requirement?.title || ''}`)
    setMessage(`Hello ${candidate?.name || 'Candidate'},\n\nI'm interested in discussing the ${requirement?.title || 'position'} position with you. Please let me know if you're available for a conversation.\n\nBest regards`)
  }

  // Handle send message
  const handleSendMessage = async () => {
    if (!message.trim() || !subject.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both subject and message",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSendingMessage(true)
      
      const response = await apiService.contactCandidate(
        params.id as string,
        params.candidateId as string,
        message.trim(),
        subject.trim()
      )
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Message sent to candidate successfully"
        })
        setShowMessageModal(false)
        setMessage("")
        setSubject("")
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to send message",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Send message error:', error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      })
    } finally {
      setIsSendingMessage(false)
    }
  }

  if (loading) {
    return (
    <EmployerAuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
        <EmployerDashboardNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-slate-600">Loading candidate profile...</p>
            </div>
          </div>
        </div>
        <EmployerDashboardFooter />
      </div>
    </EmployerAuthGuard>
    )
  }

  if (error || !candidate) {
    return (
      <EmployerAuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
        <EmployerDashboardNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Profile Not Found</h2>
              <p className="text-slate-600 mb-4">{error || 'The candidate profile could not be found.'}</p>
              <Link href="/employer-dashboard/requirements">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Requirements
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <EmployerDashboardFooter />
      </div>
      </EmployerAuthGuard>
    )
  }

  return (
    <EmployerAuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/3 w-60 h-60 bg-gradient-to-br from-cyan-400/10 to-indigo-400/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>
      
      {/* Blue gradient strip */}
      <div className="absolute top-1/3 left-0 right-0 h-32 bg-gradient-to-r from-blue-400/10 via-cyan-400/5 to-indigo-400/10 blur-3xl"></div>
      
      <EmployerDashboardNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-16 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Link href="/employer-dashboard/requirements">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Requirements
              </Button>
            </Link>
            {requirement && (
              <div className="text-sm text-slate-600">
                Viewing profile for requirement: <span className="font-medium">{requirement.title}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Profile Header */}
            <div className="flex-1">
              <div className="flex items-start space-x-6">
                <div className="flex flex-col items-center">
                  <Avatar className="w-32 h-32 border-4 border-slate-200 shadow-lg">
                    <AvatarImage 
                      src={constructAvatarUrl(candidate.avatar)} 
                      alt={candidate.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {candidate.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Verification Badges Below Profile Photo */}
                  <div className="flex flex-col items-center gap-2 mt-4">
                    {(candidate.phoneVerified === true || (candidate as any).phoneVerified === true) && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                        <Phone className="w-3 h-3 mr-1" />
                        Phone Verified
                      </Badge>
                    )}
                    {(candidate.emailVerified === true || (candidate as any).emailVerified === true) && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                        <Mail className="w-3 h-3 mr-1" />
                        Email Verified
                      </Badge>
                    )}
                    {((candidate.profileCompletion && candidate.profileCompletion >= 80) || 
                      ((candidate as any).profileCompletion && (candidate as any).profileCompletion >= 80)) && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                        <Award className="w-3 h-3 mr-1" />
                        Profile Complete ({candidate.profileCompletion || (candidate as any).profileCompletion}%)
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-3xl font-bold text-slate-900">{candidate.name}</h1>
                        {(candidate?.verification_level === 'premium' || (candidate as any)?.verificationLevel === 'premium' || (candidate as any)?.preferences?.premium) && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Premium</Badge>
                        )}
                      </div>
                      <p className="text-xl text-slate-600 mb-2">{candidate.designation}</p>
                      <p className="text-slate-500">{candidate.about}</p>
                    </div>
                  </div>
                  
                  <TooltipProvider>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center space-x-2 cursor-help">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600">{candidate.location || 'Not specified'}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Current Location: The candidate's current geographical location</p>
                        </TooltipContent>
                      </Tooltip>
                      {(() => {
                        // Calculate experience from work experiences
                        let totalDays = 0;
                        if (candidate.workExperience && Array.isArray(candidate.workExperience) && candidate.workExperience.length > 0) {
                          candidate.workExperience.forEach((exp: any) => {
                            if (exp.startDate) {
                              try {
                                const start = new Date(exp.startDate);
                                const end = exp.isCurrent ? new Date() : (exp.endDate ? new Date(exp.endDate) : new Date());
                                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                                  const diffTime = Math.abs(end.getTime() - start.getTime());
                                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                  totalDays += diffDays;
                                }
                              } catch (e) {
                                // Ignore invalid dates
                              }
                            }
                          });
                        }
                        
                        let experienceDisplay = 'Not specified';
                        if (totalDays > 0) {
                          const years = Math.floor(totalDays / 365);
                          const remainingDays = totalDays % 365;
                          const months = Math.floor(remainingDays / 30);
                          const days = remainingDays % 30;
                          const parts = [];
                          if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
                          if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
                          if (days > 0 && years === 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
                          experienceDisplay = parts.length > 0 ? parts.join(', ') : 'Fresher';
                        } else if (candidate.experienceYears !== undefined && candidate.experienceYears !== null) {
                          // Fallback to experienceYears if available
                          const totalYears = Number(candidate.experienceYears);
                          const years = Math.floor(totalYears);
                          const fractionalPart = totalYears - years;
                          const months = Math.floor(fractionalPart * 12);
                          const days = Math.floor((fractionalPart * 12 - months) * 30);
                          const parts = [];
                          if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
                          if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
                          if (days > 0 && years === 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
                          experienceDisplay = parts.length > 0 ? parts.join(', ') : 'Fresher';
                        } else if (candidate.experience) {
                          experienceDisplay = candidate.experience;
                        }
                        
                        return (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center space-x-2 cursor-help">
                                <Briefcase className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-600 font-medium">{experienceDisplay}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Experience: Total professional work experience (calculated from work history)</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })()}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center space-x-2 cursor-help">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600">{candidate.noticePeriod || 'Not specified'}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Notice Period: The duration the candidate needs to serve before joining a new role (typically in days)</p>
                        </TooltipContent>
                      </Tooltip>
                      {requirement && requirement.validTill && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center space-x-2 cursor-help">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span className="text-sm text-slate-600">Requirement Deadline: {new Date(requirement.validTill).toLocaleDateString()}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Requirement Deadline: The last date to fill this job requirement</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center space-x-2 cursor-help">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600">Active {candidate.activeStatus || 'Recently'}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Active Status: When the candidate was last active on the platform</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                  
                  {candidate.keySkills && Array.isArray(candidate.keySkills) && candidate.keySkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {candidate.keySkills.slice(0, 8).map((skill: string, idx: number) => (
                        <Badge key={`candidate_skill_${idx}_${String(skill)}`} variant="secondary" className="bg-blue-100 text-blue-800">
                          {skill}
                        </Badge>
                      ))}
                      {candidate.keySkills.length > 8 && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                          +{candidate.keySkills.length - 8} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleContactCandidate}
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Candidate
              </Button>
              
              {candidate?.resumes && candidate.resumes.length > 0 && (
                <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => handleDownloadResume(candidate.resumes[0])}
                  disabled={isDownloading}
                >
                <Download className="w-4 h-4 mr-2" />
                  {isDownloading ? "Downloading..." : "Download Resume"}
                  </Button>
                  {candidate.resumes.length > 1 && (
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab('cv')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View All CVs ({candidate.resumes.length})
              </Button>
                  )}
                </div>
              )}
              
              <Button 
                variant={isShortlisted ? "destructive" : "default"}
                onClick={handleShortlistCandidate}
                disabled={isContacting}
                className={isShortlisted ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
              >
                <Star className={`w-4 h-4 mr-2 ${isShortlisted ? 'fill-current' : ''}`} />
                {isContacting ? "Updating..." : (isShortlisted ? "Remove from Shortlist" : "Add to Shortlist")}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="cv">CV</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Contact Information */}
              <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)]">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Contact Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">{candidate.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">{candidate.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">{candidate.location}</span>
                  </div>
                  {candidate.portfolio && (
                    <div className="flex items-center space-x-3">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <a
                        href={candidate.portfolio.startsWith('http') ? candidate.portfolio : `https://${candidate.portfolio}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {candidate.portfolio}
                      </a>
                    </div>
                  )}
                  {candidate.linkedin && (
                    <div className="flex items-center space-x-3">
                      <Linkedin className="w-4 h-4 text-slate-400" />
                      <a
                        href={candidate.linkedin.startsWith('http') ? candidate.linkedin : `https://${candidate.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                  {candidate.github && (
                    <div className="flex items-center space-x-3">
                      <Github className="w-4 h-4 text-slate-400" />
                      <a
                        href={candidate.github.startsWith('http') ? candidate.github : `https://${candidate.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        GitHub Profile
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Salary & Preferences */}
              <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)]">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="w-5 h-5" />
                    <span>Salary & Preferences</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <p className="text-sm text-slate-500">Current Salary</p>
                          <p className="font-medium">
                            {candidate.currentSalary && candidate.currentSalary !== 'Not specified' && candidate.currentSalary !== 'null' && candidate.currentSalary !== null
                              ? (typeof candidate.currentSalary === 'string' && (candidate.currentSalary.includes('LPA') || candidate.currentSalary.includes('INR'))
                                  ? candidate.currentSalary 
                                  : `${candidate.currentSalary} LPA`)
                              : 'Not specified'}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Current Salary: The candidate's current annual compensation in LPA (Lakhs Per Annum)</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <p className="text-sm text-slate-500">Expected Salary</p>
                          <p className="font-medium">{candidate.expectedSalary}</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Expected Salary: The candidate's expected annual compensation in LPA (Lakhs Per Annum)</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <p className="text-sm text-slate-500">Notice Period</p>
                          <p className="font-medium">{candidate.noticePeriod}</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Notice Period: The duration the candidate needs to serve before joining a new role (typically in days)</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <p className="text-sm text-slate-500">Preferred Locations</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {candidate.preferredLocations.map((location: string) => (
                              <Badge key={location} variant="outline" className="text-xs">
                                {location}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Preferred Locations: Geographic locations where the candidate is willing to work</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardContent>
              </Card>

              {/* Skills & Languages */}
              <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)]">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5" />
                    <span>Skills & Languages</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Technical Skills</p>
                    {candidate.keySkills && candidate.keySkills.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {candidate.keySkills.map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">No skills listed</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Languages</p>
                    {candidate.languages && candidate.languages.length > 0 ? (
                      <div className="space-y-1">
                        {candidate.languages.map((language: any, index: number) => {
                          // Handle both object format {name, proficiency} and string format
                          const langName = typeof language === 'string' ? language : (language?.name || language);
                          const langProficiency = typeof language === 'object' ? (language?.proficiency || 'Not specified') : 'Not specified';
                          
                          return (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{langName}</span>
                              {langProficiency !== 'Not specified' && (
                                <span className="text-slate-500">{langProficiency}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">No languages listed</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Certifications */}
            <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)]">
              <CardHeader>
                <CardTitle>Certifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {candidate.certifications && candidate.certifications.length > 0 ? (
                    candidate.certifications.map((cert: { id: string; name: string; issuer: string; date: string }, index: number) => (
                    <div key={cert.id || `cert_${index}`} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-1">{cert.name}</h4>
                      <p className="text-sm text-slate-600 mb-2">{cert.issuer}</p>
                      <p className="text-xs text-slate-500">{cert.date}</p>
                    </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-500">No certifications available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experience" className="space-y-6">
            <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)]">
              <CardHeader>
                <CardTitle>Work Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {candidate.workExperience && candidate.workExperience.length > 0 ? (
                    candidate.workExperience.map((exp: { id: string; title: string; company: string; currentDesignation?: string; duration: string; location: string; description?: string; skills?: string[]; isCurrent?: boolean }, index: number) => (
                      <div key={exp.id || `exp_${index}_${exp.title || ''}`} className="border-l-4 border-blue-500 pl-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{exp.title || 'Not specified'}</h3>
                            {exp.currentDesignation && exp.currentDesignation !== exp.title && (
                              <p className="text-sm text-slate-700 font-medium mt-1">Current Designation: {exp.currentDesignation}</p>
                            )}
                            <p className="text-slate-600 mt-1">{exp.company || 'Not specified'}</p>
                            {exp.isCurrent && (
                              <Badge className="mt-1 bg-green-100 text-green-800 text-xs">Current</Badge>
                            )}
                          </div>
                          <TooltipProvider>
                            <div className="text-right">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="text-sm text-slate-500 cursor-help">{exp.duration || 'Not specified'}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Duration: The employment period for this role (start date to end date or present)</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="text-sm text-slate-500 cursor-help">{exp.location || 'Not specified'}</p>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Location: The work location for this role</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </div>
                        {exp.description && (
                          <p className="text-slate-600 mb-3">{exp.description}</p>
                        )}
                        {exp.skills && Array.isArray(exp.skills) && exp.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {exp.skills.map((skill: string, idx: number) => (
                              <Badge key={`${exp.id}_skill_${idx}_${String(skill)}`} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-500">No work experience details available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="education" className="space-y-6">
            <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)]">
              <CardHeader>
                <CardTitle>Education</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {candidate.educationDetails && candidate.educationDetails.length > 0 ? (
                    candidate.educationDetails.map((edu: { id: string; degree: string; institution: string; fieldOfStudy?: string; duration: string; location: string; cgpa?: string | number | null; percentage?: string | number | null; relevantCourses?: string[] }) => {
                      // Format degree name (e.g., "bachelor" -> "Bachelor's Degree", "btech" -> "B.Tech", etc.)
                      const formatDegreeName = (degree: string): string => {
                        if (!degree || degree.toLowerCase() === 'not specified') return '';
                        const degreeLower = degree.toLowerCase().trim();
                        // Common degree mappings
                        const degreeMap: Record<string, string> = {
                          'bachelor': "Bachelor's Degree",
                          'bachelors': "Bachelor's Degree",
                          'btech': 'B.Tech',
                          'b.tech': 'B.Tech',
                          'be': 'B.E.',
                          'b.e.': 'B.E.',
                          'bsc': 'B.Sc',
                          'b.sc': 'B.Sc',
                          'ba': 'B.A.',
                          'b.a.': 'B.A.',
                          'master': "Master's Degree",
                          'masters': "Master's Degree",
                          'mtech': 'M.Tech',
                          'm.tech': 'M.Tech',
                          'me': 'M.E.',
                          'm.e.': 'M.E.',
                          'msc': 'M.Sc',
                          'm.sc': 'M.Sc',
                          'ma': 'M.A.',
                          'm.a.': 'M.A.',
                          'mba': 'MBA',
                          'phd': 'Ph.D',
                          'ph.d': 'Ph.D',
                          'diploma': 'Diploma',
                          'certification': 'Certification',
                          'high-school': 'High School',
                          'highschool': 'High School'
                        };
                        
                        // Check exact match first
                        if (degreeMap[degreeLower]) {
                          return degreeMap[degreeLower];
                        }
                        
                        // Check if contains any key
                        for (const [key, value] of Object.entries(degreeMap)) {
                          if (degreeLower.includes(key)) {
                            return value;
                          }
                        }
                        
                        // Capitalize first letter of each word
                        return degree.split(' ').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                        ).join(' ');
                      };
                      
                      const formattedDegree = formatDegreeName(edu.degree || '');
                      const displayInstitution = edu.institution && edu.institution.toLowerCase() !== 'not specified' && edu.institution.trim() !== '' ? edu.institution : '';
                      const displayFieldOfStudy = edu.fieldOfStudy && edu.fieldOfStudy.toLowerCase() !== 'not specified' && edu.fieldOfStudy.trim() !== '' ? edu.fieldOfStudy : '';
                      const displayDuration = edu.duration && edu.duration.toLowerCase() !== 'not specified' && edu.duration.trim() !== '' ? edu.duration : '';
                      const displayLocation = edu.location && edu.location.toLowerCase() !== 'not specified' && edu.location.trim() !== '' ? edu.location : '';
                      
                      // Skip if no meaningful data - but show if we have degree OR institution
                      if (!formattedDegree && !displayInstitution) {
                        return null;
                      }
                      
                      return (
                        <div key={edu.id} className="border-l-4 border-green-500 pl-6">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              {formattedDegree && (
                                <h3 className="font-semibold text-lg">{formattedDegree}</h3>
                              )}
                              {displayInstitution && (
                                <p className="text-slate-600">{displayInstitution}</p>
                              )}
                              {displayFieldOfStudy && (
                                <p className="text-sm text-slate-500 mt-1">Field of Study: {displayFieldOfStudy}</p>
                              )}
                            </div>
                            {(displayDuration || displayLocation) && (
                              <div className="text-right">
                                {displayDuration && (
                                  <p className="text-sm text-slate-500">{displayDuration}</p>
                                )}
                                {displayLocation && (
                                  <p className="text-sm text-slate-500">{displayLocation}</p>
                                )}
                              </div>
                            )}
                          </div>
                          {edu.cgpa && (
                            <p className="text-sm text-slate-600 mb-2">CGPA: {edu.cgpa}</p>
                          )}
                          {edu.percentage && (
                            <p className="text-sm text-slate-600 mb-2">Percentage: {edu.percentage}%</p>
                          )}
                          {edu.relevantCourses && edu.relevantCourses.length > 0 && (
                            <div>
                              <p className="text-sm text-slate-500 mb-2">Relevant Courses:</p>
                              <div className="flex flex-wrap gap-2">
                                {edu.relevantCourses.map((course: string) => (
                                  <Badge key={course} variant="outline" className="text-xs">
                                    {course}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }).filter(Boolean)
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-500">No education details available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cv" className="space-y-6">
            {/* Resume/CV Section */}
            <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                  <Download className="w-5 h-5" />
                  <span>Resume/CV</span>
                    {candidate.resumes && candidate.resumes.length > 1 && (
                      <Badge variant="secondary" className="ml-2">
                        {candidate.resumes.length} CVs
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {candidate.resumes && candidate.resumes.length > 0 ? (
                    <>
                      {/* Get default CV - Backend orders by is_primary DESC, so first resume is default */}
                      {(() => {
                        // Backend orders resumes by is_primary DESC and sets isDefault/is_default
                        // Priority: 1) Explicit isDefault flag, 2) First resume in array (if backend ordered correctly)
                        const defaultResume = candidate.resumes.find((r: any) => 
                          r.isDefault === true || 
                          r.isDefault === 'true' || 
                          (r.is_default === true || r.is_default === 'true') ||
                          r.is_primary === true
                        ) || candidate.resumes[0]; // Fallback to first resume (should be default after backend ordering)
                        
                        const otherResumes = candidate.resumes.filter((r: any) => 
                          r.id !== defaultResume?.id
                        );
                        
                        console.log('📄 Total Resumes:', candidate.resumes.length);
                        console.log('📄 Default Resume:', defaultResume?.id, defaultResume?.title, 'isDefault:', defaultResume?.isDefault, 'is_default:', defaultResume?.is_default);
                        console.log('📄 Other Resumes count:', otherResumes.length);
                        if (otherResumes.length > 0) {
                          console.log('📄 Other Resumes:', otherResumes.map((r: any) => ({ id: r.id, title: r.title, isDefault: r.isDefault })));
                        }
                        return (
                          <>
                            {/* Multiple CVs Selection - Only show if there are other CVs besides default */}
                            {otherResumes.length > 0 && (
                              <div className="mb-6" data-available-cvs>
                          <h4 className="text-lg font-semibold mb-3">Available CVs</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {otherResumes.map((resume: any, index: number) => (
                              <Card key={resume.id} className="cursor-pointer rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)] transition-all duration-300">
                                <CardContent className="p-4">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                      <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {resume.filename || resume.title || `CV ${index + 1}`}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {resume.fileSize || 'PDF'} • {new Date(resume.uploadDate || resume.lastUpdated).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex space-x-2 mt-3">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1"
                                      onClick={() => handleViewResume(resume)}
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      View
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1"
                                      onClick={() => handleDownloadResume(resume)}
                                      disabled={isDownloading}
                                    >
                                      <Download className="w-3 h-3 mr-1" />
                                      Download
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                            {/* Primary CV Preview - Use default CV */}
                            {(() => {
                              const primaryResume = defaultResume;
                              return (
                                <>
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Download className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                        {primaryResume.filename || primaryResume.title || 'Resume'}
                                        {primaryResume.isDefault && (
                                          <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">Default</Badge>
                                        )}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                        PDF • {primaryResume.fileSize || 'Document'} • Uploaded {new Date(primaryResume.uploadDate || primaryResume.lastUpdated).toLocaleDateString()}
                      </p>
                      
                                      {/* CV Preview using PDFViewer - white background to eliminate black space */}
                                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden mb-4 shadow-sm" style={{ background: 'white', padding: '0' }}>
                        {(() => {
                          // Use the view URL with token for preview
                          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                                          const pdfUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/requirements/${requirementId}/candidates/${candidateIdStr}/resume/${primaryResume.id}/view`;
                          console.log('📄 PDF URL for preview:', pdfUrl);
                          
                                          if (!pdfUrl || !primaryResume?.id) {
                            return (
                                              <div className="flex items-center justify-center h-[600px] sm:h-[700px] lg:h-[800px] xl:h-[900px] bg-slate-50 dark:bg-slate-800">
                                <div className="text-center p-8">
                                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-8 h-8 text-red-600 dark:text-red-400" />
                                  </div>
                                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No PDF URL</h3>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">Resume URL not available.</p>
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                            <PDFViewer 
                              pdfUrl={pdfUrl} 
                                              className="w-full"
                            />
                          );
                        })()}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleViewResume(primaryResume)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View CV
                            </Button>
                            <Button 
                              variant="outline" 
                                          onClick={() => handleDownloadResume(primaryResume)}
                              disabled={isDownloading}
                            >
                          <Download className="w-4 h-4 mr-2" />
                          {isDownloading ? "Downloading..." : "Download PDF"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* CV Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)]">
                      <CardHeader>
                        <CardTitle className="text-lg">CV Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">File Name</span>
                                          <span className="font-medium">{primaryResume.filename || primaryResume.title || 'Resume'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">File Size</span>
                                          <span className="font-medium">{primaryResume.fileSize || 'PDF Document'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Upload Date</span>
                                          <span className="font-medium">{new Date(primaryResume.uploadDate || primaryResume.lastUpdated).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Last Updated</span>
                                          <span className="font-medium">{new Date(primaryResume.lastUpdated).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Format</span>
                                          <span className="font-medium">{primaryResume.metadata?.mimeType?.includes('pdf') ? 'PDF' : 'Document'}</span>
                        </div>
                                        {primaryResume.metadata?.originalName && (
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Original Name</span>
                                            <span className="font-medium">{primaryResume.metadata.originalName}</span>
                                          </div>
                                        )}
                                        {primaryResume.isDefault && (
                                          <div className="flex justify-between">
                                            <span className="text-slate-600 dark:text-slate-400">Status</span>
                                            <Badge variant="secondary" className="bg-green-100 text-green-800">Default CV</Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)]">
                      <CardHeader>
                        <CardTitle className="text-lg">CV Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleViewResume(primaryResume)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Full CV
                            </Button>
                            <Button 
                              variant="outline" 
                              className="w-full"
                                          onClick={() => handleDownloadResume(primaryResume)}
                              disabled={isDownloading}
                            >
                          <Download className="w-4 h-4 mr-2" />
                          {isDownloading ? "Downloading..." : "Download CV"}
                        </Button>
                        {candidate.resumes.length > 1 && (
                          <Button 
                            variant="outline" 
                            className="w-full"
                                            onClick={() => {
                                              // Scroll to available CVs section
                                              document.querySelector('[data-available-cvs]')?.scrollIntoView({ behavior: 'smooth' });
                                            }}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View All CVs ({candidate.resumes.length})
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={async () => {
                            try {
                              // Get the resume view URL
                              const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                              const resumeId = primaryResume?.id;
                              if (!resumeId) {
                                toast({
                                  title: "Error",
                                  description: "Resume not available for sharing",
                                  variant: "destructive"
                                });
                                return;
                              }
                              
                              const shareUrl = `${window.location.origin}/employer-dashboard/requirements/${requirementId}/candidates/${candidateIdStr}?resume=${resumeId}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
                              
                              // Try Web Share API first (mobile)
                              if (navigator.share) {
                                try {
                                  await navigator.share({
                                    title: `${candidate.name}'s Resume`,
                                    text: `Resume for ${candidate.name}`,
                                    url: shareUrl
                                  });
                                  toast({
                                    title: "Success",
                                    description: "Resume shared successfully"
                                  });
                                  return;
                                } catch (shareError: any) {
                                  // User cancelled or error - fall through to clipboard
                                  if (shareError.name !== 'AbortError') {
                                    console.error('Share error:', shareError);
                                  }
                                }
                              }
                              
                              // Fallback to clipboard
                              await navigator.clipboard.writeText(shareUrl);
                              toast({
                                title: "Success",
                                description: "Resume link copied to clipboard"
                              });
                            } catch (error) {
                              console.error('Share error:', error);
                              toast({
                                title: "Error",
                                description: "Failed to share resume",
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share CV
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            if (candidate?.email) {
                              const subject = encodeURIComponent(`Resume for ${candidate.name}`);
                              const body = encodeURIComponent(`Please find the resume for ${candidate.name} attached.`);
                              window.location.href = `mailto:${candidate.email}?subject=${subject}&body=${body}`;
                            } else {
                              toast({
                                title: "Error",
                                description: "Candidate email not available",
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Email CV
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Resume Summary and Skills */}
                                  {primaryResume.summary && (
                    <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)]">
                      <CardHeader>
                        <CardTitle className="text-lg">Resume Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                                        <p className="text-gray-600 whitespace-pre-wrap">{primaryResume.summary}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Resume Skills */}
                                  {primaryResume.skills && primaryResume.skills.length > 0 && (
                    <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)]">
                      <CardHeader>
                        <CardTitle className="text-lg">Resume Skills</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                                          {primaryResume.skills.map((skill: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-sm">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                                </>
                              );
                            })()}
                          </>
                        );
                      })()}

                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No Resume Available</h3>
                      <p className="text-slate-600">This candidate hasn't uploaded a resume yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cover Letter Section */}
            <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Cover Letters</span>
                    {candidate.coverLetters && candidate.coverLetters.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {candidate.coverLetters.length} Letters
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {candidate.coverLetters && candidate.coverLetters.length > 0 ? (
                    <>
                      {/* Multiple Cover Letters */}
                      {candidate.coverLetters.length > 1 && (
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold mb-3">Available Cover Letters</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {candidate.coverLetters.map((coverLetter: any, index: number) => (
                              <Card key={coverLetter.id} className="cursor-pointer rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)] transition-all duration-300">
                                <CardContent className="p-4">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                      <FileText className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {coverLetter.title || `Cover Letter ${index + 1}`}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {coverLetter.isDefault ? 'Default' : 'Custom'} • {new Date(coverLetter.lastUpdated).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex space-x-2 mt-3">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1"
                                      onClick={() => handleViewCoverLetter(coverLetter)}
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      View
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1"
                                      onClick={() => handleDownloadCoverLetter(coverLetter)}
                                    >
                                      <Download className="w-3 h-3 mr-1" />
                                      Download
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Primary Cover Letter Display */}
                      <div className="border-2 border-dashed border-green-300 dark:border-green-600 rounded-lg p-8 text-center">
                        <div className="max-w-md mx-auto">
                          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            {candidate.coverLetters[0].title || 'Cover Letter'}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            {candidate.coverLetters[0].isDefault ? 'Default Cover Letter' : 'Custom Cover Letter'} • 
                            Updated {new Date(candidate.coverLetters[0].lastUpdated).toLocaleDateString()}
                          </p>
                          
                          {/* Cover Letter Preview */}
                          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-4">
                            <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Cover Letter Preview</p>
                                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Click to view full content</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleViewCoverLetter(candidate.coverLetters[0])}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Cover Letter
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => handleDownloadCoverLetter(candidate.coverLetters[0])}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Cover Letter Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)]">
                          <CardHeader>
                            <CardTitle className="text-lg">Cover Letter Details</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Title</span>
                              <span className="font-medium">{candidate.coverLetters[0].title || 'Cover Letter'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Type</span>
                              <span className="font-medium">{candidate.coverLetters[0].isDefault ? 'Default' : 'Custom'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Last Updated</span>
                              <span className="font-medium">{new Date(candidate.coverLetters[0].lastUpdated).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Status</span>
                              <span className="font-medium">{candidate.coverLetters[0].isPublic ? 'Public' : 'Private'}</span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)]">
                          <CardHeader>
                            <CardTitle className="text-lg">Cover Letter Actions</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleViewCoverLetter(candidate.coverLetters[0])}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Full Cover Letter
                            </Button>
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => handleDownloadCoverLetter(candidate.coverLetters[0])}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download Cover Letter
                            </Button>
                            {candidate.coverLetters.length > 1 && (
                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => setActiveTab('cv')}
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                View All Letters ({candidate.coverLetters.length})
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* Cover Letter Summary */}
                      {candidate.coverLetters[0].summary && (
                        <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)]">
                          <CardHeader>
                            <CardTitle className="text-lg">Cover Letter Summary</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-600 whitespace-pre-wrap">{candidate.coverLetters[0].summary}</p>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No Cover Letters Available</h3>
                      <p className="text-gray-600">This candidate hasn't uploaded any cover letters yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Contact Information Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{candidate?.email || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{candidate?.phone || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t space-y-3">
                <Button
                  onClick={() => {
                    setShowContactModal(false)
                    setShowMessageModal(true)
                    setSubject(`Job Opportunity: ${requirement?.title}`)
                    setMessage(`Hello ${candidate?.name},\n\nI'm interested in discussing the ${requirement?.title} position with you. Please let me know if you're available for a conversation.\n\nBest regards`)
                  }}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                
                {candidate?.email && (
                  <a
                    href={`mailto:${candidate.email}?subject=Job Opportunity: ${requirement?.title}&body=Hello ${candidate.name},%0D%0A%0D%0AI'm interested in discussing the ${requirement?.title} position with you. Please let me know if you're available for a conversation.%0D%0A%0D%0ABest regards`}
                    className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </a>
                )}
                
                {candidate?.phone && (
                  <a
                    href={`tel:${candidate.phone}`}
                    className="inline-flex items-center justify-center w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Contact {candidate?.name}</h3>
              <button
                onClick={() => {
                  setShowMessageModal(false)
                  setMessage("")
                  setSubject("")
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Contact Options */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {candidate?.email && (
                  <a
                    href={`mailto:${candidate.email}?subject=${encodeURIComponent(subject || `Job Opportunity: ${requirement?.title || ''}`)}&body=${encodeURIComponent(message || '')}`}
                    className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </a>
                )}
                {candidate?.phone && (
                  <a
                    href={`tel:${candidate.phone}`}
                    className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </a>
                )}
              </div>
              
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter message subject"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your message to the candidate"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={handleSendMessage}
                  disabled={isSendingMessage || !message.trim() || !subject.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isSendingMessage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMessageModal(false)
                    setMessage("")
                    setSubject("")
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <EmployerDashboardFooter />
    </div>
    </EmployerAuthGuard>
  )
} 