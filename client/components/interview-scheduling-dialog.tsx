"use client"

import { useState } from "react"
import { Calendar, Clock, MapPin, Video, Phone, Users, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiService } from "@/lib/api"
import { toast } from "sonner"

interface InterviewSchedulingDialogProps {
  isOpen: boolean
  onClose: () => void
  application: {
    id: string
    candidateId?: string
    jobId?: string
    candidate?: {
      id: string
      name?: string
      fullName?: string
      first_name?: string
      last_name?: string
      email: string
    }
    applicant?: {
      id: string
      name?: string
      fullName?: string
      first_name?: string
      last_name?: string
      email: string
    }
    job?: {
      id: string
      title: string
    }
  }
  onSuccess?: () => void
}

export function InterviewSchedulingDialog({ 
  isOpen, 
  onClose, 
  application, 
  onSuccess 
}: InterviewSchedulingDialogProps) {
  // Don't render if no application is provided
  if (!application) {
    return null;
  }

  // Get candidate data (either from candidate or applicant property)
  const candidate = application.candidate || application.applicant;
  const candidateId = application.candidateId || candidate?.id;
  
  // Get the candidate name (could be 'name' or 'fullName')
  const candidateName = candidate?.name || candidate?.fullName || candidate?.first_name + ' ' + candidate?.last_name;

  // Debug logging
  console.log('🔍 InterviewSchedulingDialog - Application:', application);
  console.log('🔍 InterviewSchedulingDialog - Candidate:', candidate);
  console.log('🔍 InterviewSchedulingDialog - CandidateId:', candidateId);

  // Don't render if no candidate data is available
  if (!candidate || !candidateId || !candidateName) {
    console.error('❌ Missing candidate data:', { candidate, candidateId, candidateName });
    return null;
  }

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    interviewType: 'phone' as 'phone' | 'video' | 'in_person' | 'technical' | 'hr' | 'final',
    scheduledAt: '',
    duration: 60,
    timezone: 'Asia/Kolkata',
    location: '',
    meetingLink: '',
    meetingPassword: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const interviewData = {
        jobApplicationId: application.id,
        candidateId: candidateId,
        jobId: application.jobId,
        title: formData.title || `${formData.interviewType.charAt(0).toUpperCase() + formData.interviewType.slice(1)} Interview`,
        description: formData.description,
        interviewType: formData.interviewType,
        scheduledAt: formData.scheduledAt,
        duration: formData.duration,
        timezone: formData.timezone,
        location: formData.interviewType === 'in_person' ? {
          address: formData.location,
          type: 'physical'
        } : formData.interviewType === 'video' ? {
          link: formData.meetingLink,
          password: formData.meetingPassword,
          type: 'virtual'
        } : null,
        meetingLink: formData.meetingLink,
        meetingPassword: formData.meetingPassword,
        notes: formData.notes
      }

      const response = await apiService.scheduleInterview(interviewData)

      if (response.success) {
        toast.success('Interview scheduled successfully!', {
          description: `Interview scheduled for ${candidateName} on ${new Date(formData.scheduledAt).toLocaleDateString()}`
        })
        onSuccess?.()
        onClose()
        // Reset form
        setFormData({
          title: '',
          description: '',
          interviewType: 'phone',
          scheduledAt: '',
          duration: 60,
          timezone: 'Asia/Kolkata',
          location: '',
          meetingLink: '',
          meetingPassword: '',
          notes: ''
        })
      } else {
        toast.error(response.message || 'Failed to schedule interview')
      }
    } catch (error) {
      console.error('Error scheduling interview:', error)
      toast.error('Failed to schedule interview')
    } finally {
      setIsSubmitting(false)
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Interview
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Candidate Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Candidate Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {candidateName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{candidateName}</p>
                  <p className="text-sm text-gray-600">{candidate.email || 'No email'}</p>
                  {application.job && (
                    <Badge variant="secondary" className="mt-1">
                      {application.job.title}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interview Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Interview Type */}
              <div className="space-y-2">
                <Label htmlFor="interviewType">Interview Type</Label>
                <Select 
                  value={formData.interviewType} 
                  onValueChange={(value) => handleInputChange('interviewType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Interview
                      </div>
                    </SelectItem>
                    <SelectItem value="video">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Video Interview
                      </div>
                    </SelectItem>
                    <SelectItem value="in_person">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        In-Person Interview
                      </div>
                    </SelectItem>
                    <SelectItem value="technical">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Technical Interview
                      </div>
                    </SelectItem>
                    <SelectItem value="hr">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        HR Interview
                      </div>
                    </SelectItem>
                    <SelectItem value="final">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Final Interview
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select 
                  value={formData.duration.toString()} 
                  onValueChange={(value) => handleInputChange('duration', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Date & Time</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select 
                  value={formData.timezone} 
                  onValueChange={(value) => handleInputChange('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Interview Title (Optional)</Label>
              <Input
                id="title"
                placeholder={`${getInterviewTypeLabel(formData.interviewType)} with ${candidateName}`}
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the interview..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>

            {/* Location/Meeting Details */}
            {formData.interviewType === 'in_person' && (
              <div className="space-y-2">
                <Label htmlFor="location">Interview Location</Label>
                <Input
                  id="location"
                  placeholder="Enter the interview venue address"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              </div>
            )}

            {formData.interviewType === 'video' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meetingLink">Meeting Link</Label>
                  <Input
                    id="meetingLink"
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    value={formData.meetingLink}
                    onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meetingPassword">Meeting Password (Optional)</Label>
                  <Input
                    id="meetingPassword"
                    placeholder="Enter meeting password if required"
                    value={formData.meetingPassword}
                    onChange={(e) => handleInputChange('meetingPassword', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information for the candidate..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.scheduledAt}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Interview
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
