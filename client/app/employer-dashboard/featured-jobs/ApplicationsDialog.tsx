"use client"

import { useState, useEffect } from "react"
import { Users, Mail, Phone, MapPin, FileText, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { apiService } from "@/lib/api"

export function ApplicationsDialog({ 
  featuredJobId, 
  jobTitle, 
  applicationCount 
}: { 
  featuredJobId: string; 
  jobTitle: string; 
  applicationCount: number;
}) {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const fetchApplications = async () => {
    if (!isOpen) return;
    
    try {
      setLoading(true)
      const response = await apiService.getFeaturedJobApplications(featuredJobId)
      if (response.success) {
        setApplications(response.data.applications || [])
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchApplications()
    }
  }, [isOpen, featuredJobId])

  const formatDate = (date: string) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          View Details ({applicationCount})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Applications for {jobTitle}</DialogTitle>
          <DialogDescription>
            {applicationCount} {applicationCount === 1 ? 'application' : 'applications'} received
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading applications...</span>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600">No applications received yet.</p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {applications.map((application: any) => (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={application.applicant?.avatar} />
                        <AvatarFallback>
                          {application.applicant?.first_name?.[0]}{application.applicant?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-slate-900">
                          {application.applicant?.first_name} {application.applicant?.last_name}
                        </h3>
                        {application.applicant?.headline && (
                          <p className="text-sm text-slate-600 mt-1">{application.applicant.headline}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {application.applicant?.email && (
                            <Badge variant="outline" className="text-xs">
                              <Mail className="w-3 h-3 mr-1" />
                              {application.applicant.email}
                            </Badge>
                          )}
                          {application.applicant?.phone && (
                            <Badge variant="outline" className="text-xs">
                              <Phone className="w-3 h-3 mr-1" />
                              {application.applicant.phone}
                            </Badge>
                          )}
                          {application.applicant?.current_location && (
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              {application.applicant.current_location}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge className={application.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                                     application.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                     'bg-blue-100 text-blue-800'}>
                      {application.status || 'pending'}
                    </Badge>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {application.applicant?.experience_years !== undefined && (
                      <div>
                        <p className="text-xs text-slate-500">Experience</p>
                        <p className="font-semibold">{application.applicant.experience_years} years</p>
                      </div>
                    )}
                    {application.applicant?.current_company && (
                      <div>
                        <p className="text-xs text-slate-500">Current Company</p>
                        <p className="font-semibold">{application.applicant.current_company}</p>
                      </div>
                    )}
                    {application.applicant?.current_role && (
                      <div>
                        <p className="text-xs text-slate-500">Current Role</p>
                        <p className="font-semibold">{application.applicant.current_role}</p>
                      </div>
                    )}
                    {application.applicant?.notice_period && (
                      <div>
                        <p className="text-xs text-slate-500">Notice Period</p>
                        <p className="font-semibold">{application.applicant.notice_period}</p>
                      </div>
                    )}
                    {application.applicant?.expected_salary && (
                      <div>
                        <p className="text-xs text-slate-500">Expected Salary</p>
                        <p className="font-semibold">₹{application.applicant.expected_salary.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {application.applicant?.summary && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-1">Summary</p>
                      <p className="text-sm text-slate-700">{application.applicant.summary}</p>
                    </div>
                  )}

                  {application.applicant?.skills && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(application.applicant.skills) ? application.applicant.skills : 
                          typeof application.applicant.skills === 'string' ? application.applicant.skills.split(',') : []
                        ).slice(0, 10).map((skill: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-slate-600">
                      Applied on {formatDate(application.appliedAt)}
                    </div>
                    <div className="flex space-x-2">
                      {application.jobResume && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={`/resume/${application.jobResume.id}`} target="_blank" rel="noopener noreferrer">
                            <FileText className="w-4 h-4 mr-2" />
                            View Resume
                          </a>
                        </Button>
                      )}
                      {application.jobCoverLetter && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={`/cover-letter/${application.jobCoverLetter.id}`} target="_blank" rel="noopener noreferrer">
                            <FileText className="w-4 h-4 mr-2" />
                            View Cover Letter
                          </a>
                        </Button>
                      )}
                      <Button size="sm" variant="outline" asChild>
                        <a href={`/employer-dashboard/applications/${application.id}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Full Details
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

