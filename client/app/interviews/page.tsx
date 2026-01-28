"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { apiService } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Phone, 
  Users, 
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { toast } from "sonner"
import Link from "next/link"
import { JobseekerAuthGuard } from "@/components/jobseeker-auth-guard"

export default function InterviewsPage() {
  const { user, loading: authLoading } = useAuth()
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && !authLoading) {
      fetchInterviews()
    }
  }, [user, authLoading])

  const fetchInterviews = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.getCandidateInterviews()
      
      if (response.success) {
        setInterviews(response.data.interviews || [])
      } else {
        setError(response.message || 'Failed to fetch interviews')
      }
    } catch (error) {
      console.error('Error fetching interviews:', error)
      setError('Failed to fetch interviews')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'rescheduled': return 'bg-orange-100 text-orange-800'
      case 'no_show': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />
      case 'confirmed': return <CheckCircle className="h-4 w-4" />
      case 'in_progress': return <AlertCircle className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      case 'rescheduled': return <Clock className="h-4 w-4" />
      case 'no_show': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'phone': return <Phone className="h-4 w-4" />
      case 'video': return <Video className="h-4 w-4" />
      case 'in_person': return <MapPin className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getInterviewTypeLabel = (type: string) => {
    switch (type) {
      case 'phone': return 'Phone Interview'
      case 'video': return 'Video Interview'
      case 'in_person': return 'In-Person Interview'
      case 'technical': return 'Technical Interview'
      case 'hr': return 'HR Interview'
      case 'final': return 'Final Interview'
      default: return type
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  const upcomingInterviews = interviews.filter(interview => 
    interview.status === 'scheduled' || interview.status === 'confirmed'
  )

  const pastInterviews = interviews.filter(interview => 
    interview.status === 'completed' || interview.status === 'cancelled' || interview.status === 'no_show'
  )

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading interviews...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Interviews</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchInterviews}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <JobseekerAuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-auto">
      <Navbar />
      
      {/* Welcome Back Div Style Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Base gradient overlay matching welcome back div */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-200/45 via-blue-200/35 to-indigo-200/45"></div>
        <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-purple-300/10 to-blue-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-blue-300/10 to-indigo-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-indigo-300/10 to-purple-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        {/* Wide translucent gradient strip matching welcome back div */}
        <div className="absolute top-1/4 left-0 right-0 h-24 bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-indigo-400/20"></div>
      </div>
      
      <div className="container mx-auto px-4 pt-20 pb-12 relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Interviews</h1>
          <p className="text-gray-600">Manage and view your scheduled interviews</p>
        </div>

        {interviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Interviews Scheduled</h3>
              <p className="text-gray-600 mb-4">
                You don't have any interviews scheduled yet. Keep applying to jobs to get interview opportunities!
              </p>
              <Link href="/jobs">
                <Button>Browse Jobs</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingInterviews.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({pastInterviews.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingInterviews.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No upcoming interviews</p>
                  </CardContent>
                </Card>
              ) : (
                upcomingInterviews.map((interview) => {
                  const { date, time } = formatDateTime(interview.scheduledAt)
                  return (
                    <Card key={interview.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              {getInterviewTypeIcon(interview.interviewType)}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{interview.title}</CardTitle>
                              <p className="text-sm text-gray-600 mt-1">
                                {getInterviewTypeLabel(interview.interviewType)}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(interview.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(interview.status)}
                              {interview.status.replace('_', ' ')}
                            </div>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-2" />
                              {date}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-2" />
                              {time} ({interview.duration} minutes)
                            </div>
                            {interview.interviewType === 'in_person' && interview.location?.address && (
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="h-4 w-4 mr-2" />
                                {interview.location.address}
                              </div>
                            )}
                            {interview.interviewType === 'video' && interview.meetingLink && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Video className="h-4 w-4 mr-2" />
                                <a 
                                  href={interview.meetingLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  Join Meeting
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            {interview.jobApplication?.job && (
                              <div className="text-sm">
                                <span className="font-medium">Position:</span> {interview.jobApplication.job.title}
                              </div>
                            )}
                            {interview.jobApplication?.employer && (
                              <div className="text-sm">
                                <span className="font-medium">Company:</span> {interview.jobApplication.employer.name}
                              </div>
                            )}
                            {interview.description && (
                              <div className="text-sm">
                                <span className="font-medium">Description:</span> {interview.description}
                              </div>
                            )}
                          </div>
                        </div>
                        {interview.notes && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gray-700">Additional Notes:</p>
                                <p className="text-sm text-gray-600">{interview.notes}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastInterviews.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <CheckCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No past interviews</p>
                  </CardContent>
                </Card>
              ) : (
                pastInterviews.map((interview) => {
                  const { date, time } = formatDateTime(interview.scheduledAt)
                  return (
                    <Card key={interview.id} className="opacity-75">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              {getInterviewTypeIcon(interview.interviewType)}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{interview.title}</CardTitle>
                              <p className="text-sm text-gray-600 mt-1">
                                {getInterviewTypeLabel(interview.interviewType)}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(interview.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(interview.status)}
                              {interview.status.replace('_', ' ')}
                            </div>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-2" />
                              {date}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-2" />
                              {time}
                            </div>
                          </div>
                          <div className="space-y-2">
                            {interview.jobApplication?.job && (
                              <div className="text-sm">
                                <span className="font-medium">Position:</span> {interview.jobApplication.job.title}
                              </div>
                            )}
                            {interview.jobApplication?.employer && (
                              <div className="text-sm">
                                <span className="font-medium">Company:</span> {interview.jobApplication.employer.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
      </div>
    </JobseekerAuthGuard>
  )
}
