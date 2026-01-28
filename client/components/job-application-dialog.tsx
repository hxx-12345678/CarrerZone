"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { apiService, Resume } from "@/lib/api"
import { toast } from "sonner"
import { Upload, FileText, Check, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface JobApplicationDialogProps {
  isOpen: boolean
  onClose: () => void
  job: {
    id: string
    title: string
    company: {
      name: string
    }
    location: string
  }
  onSuccess?: () => void
  isGulfJob?: boolean
}

export function JobApplicationDialog({ 
  isOpen, 
  onClose, 
  job, 
  onSuccess,
  isGulfJob = false 
}: JobApplicationDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loadingResumes, setLoadingResumes] = useState(true)
  const [selectedResumeId, setSelectedResumeId] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [applicationData, setApplicationData] = useState({
    expectedSalary: '',
    noticePeriod: '30',
    coverLetter: '',
    willingToRelocate: isGulfJob // Default to true for Gulf jobs
  })

  // Fetch resumes when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchResumes()
    }
  }, [isOpen])

  const fetchResumes = async () => {
    try {
      setLoadingResumes(true)
      const response = await apiService.getResumes()
      if (response.success && response.data) {
        setResumes(response.data)
        // Auto-select default resume if available
        const defaultResume = response.data.find((r: Resume) => r.isDefault)
        if (defaultResume) {
          setSelectedResumeId(defaultResume.id)
        } else if (response.data.length > 0) {
          setSelectedResumeId(response.data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching resumes:', error)
      toast.error('Failed to load resumes')
    } finally {
      setLoadingResumes(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // File validation
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF, DOC, or DOCX files only.')
      return
    }

    if (file.size > maxSize) {
      toast.error('File size too large. Please upload a file smaller than 5MB.')
      return
    }

    try {
      setUploading(true)
      const response = await apiService.uploadResumeFile(file)
      if (response.success && response.data) {
        toast.success('Resume uploaded successfully!')
        // Refresh resumes list
        await fetchResumes()
        // Auto-select the newly uploaded resume
        if (response.data.resumeId) {
          setSelectedResumeId(response.data.resumeId)
        }
      }
    } catch (error) {
      console.error('Error uploading resume:', error)
      toast.error('Failed to upload resume. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSubmit = async () => {
    if (!job) return

    // Validate resume selection
    if (!selectedResumeId) {
      toast.error('Please select a resume or upload a new one before applying.')
      return
    }

    setSubmitting(true)
    try {
      const response = await apiService.applyJob(job.id, {
        coverLetter: applicationData.coverLetter || `I am interested in the ${job.title} position at ${job.company.name}.${isGulfJob ? ' I am excited about the opportunity to work in the Gulf region.' : ''}`,
        expectedSalary: applicationData.expectedSalary ? parseInt(applicationData.expectedSalary) : undefined,
        noticePeriod: applicationData.noticePeriod ? parseInt(applicationData.noticePeriod) : 30,
        availableFrom: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isWillingToRelocate: applicationData.willingToRelocate,
        preferredLocations: [job.location],
        resumeId: selectedResumeId
      })
      
      if (response.success) {
        toast.success(`Application submitted successfully for ${job.title} at ${job.company.name}!`, {
          description: 'Your application has been submitted and is under review.',
          duration: 5000,
        })
        onClose()
        setApplicationData({
          expectedSalary: '',
          noticePeriod: '30',
          coverLetter: '',
          willingToRelocate: isGulfJob
        })
        setSelectedResumeId('')
        onSuccess?.()
      } else {
        toast.error(response.message || 'Failed to submit application')
      }
    } catch (error) {
      console.error('Error applying for job:', error)
      toast.error('Failed to submit application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting && !uploading) {
      onClose()
      // Reset form on close
      setApplicationData({
        expectedSalary: '',
        noticePeriod: '30',
        coverLetter: '',
        willingToRelocate: isGulfJob
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for {job?.title}</DialogTitle>
          <DialogDescription>
            {isGulfJob 
              ? "Complete your application for this Gulf opportunity. Make sure your profile and resume are up to date."
              : "Submit your application for this position. Make sure your profile and resume are up to date."
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Resume Selection Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Select Resume/CV *</Label>
            {loadingResumes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-sm text-slate-600">Loading resumes...</span>
              </div>
            ) : resumes.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-300 dark:border-slate-600">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <FileText className="w-12 h-12 text-slate-400 mb-3" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">No resumes found. Please upload one to continue.</p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Resume
                      </>
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <RadioGroup value={selectedResumeId} onValueChange={setSelectedResumeId}>
                  {resumes.map((resume) => (
                    <Card 
                      key={resume.id} 
                      className={`cursor-pointer transition-all ${
                        selectedResumeId === resume.id 
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20' 
                          : 'hover:border-blue-400'
                      }`}
                      onClick={() => setSelectedResumeId(resume.id)}
                    >
                      <CardContent className="flex items-center p-4">
                        <RadioGroupItem value={resume.id} id={resume.id} className="mr-3" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span className="font-medium text-sm truncate">
                              {resume.title || 'Untitled Resume'}
                            </span>
                            {resume.isDefault && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full flex-shrink-0">
                                Default
                              </span>
                            )}
                          </div>
                          {resume.summary && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate">
                              {resume.summary}
                            </p>
                          )}
                        </div>
                        {selectedResumeId === resume.id && (
                          <Check className="w-5 h-5 text-blue-600 ml-2 flex-shrink-0" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </RadioGroup>

                {/* Upload New Resume Button */}
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload New Resume
                    </>
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <p className="text-xs text-slate-500 text-center">
                  Supported formats: PDF, DOC, DOCX (max 5MB)
                </p>
              </div>
            )}
          </div>

          {/* Application Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expectedSalary">
                Expected Salary {isGulfJob ? '(USD)' : '(LPA)'}
              </Label>
              <Input
                id="expectedSalary"
                type="number"
                placeholder={isGulfJob ? "e.g., 50000" : "e.g., 8-12"}
                value={applicationData.expectedSalary}
                onChange={(e) => setApplicationData(prev => ({ ...prev, expectedSalary: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="noticePeriod">Notice Period (Days)</Label>
              <Input
                id="noticePeriod"
                type="number"
                placeholder="e.g., 30"
                value={applicationData.noticePeriod}
                onChange={(e) => setApplicationData(prev => ({ ...prev, noticePeriod: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="coverLetter">Cover Letter</Label>
            <Textarea
              id="coverLetter"
              placeholder="Tell us why you're interested in this position and what makes you a great fit..."
              rows={4}
              value={applicationData.coverLetter}
              onChange={(e) => setApplicationData(prev => ({ ...prev, coverLetter: e.target.value }))}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="willingToRelocate"
              checked={applicationData.willingToRelocate}
              onChange={(e) => setApplicationData(prev => ({ ...prev, willingToRelocate: e.target.checked }))}
              className="rounded border-slate-300 dark:border-slate-600"
            />
            <Label htmlFor="willingToRelocate">
              I am willing to relocate for this position
            </Label>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={handleSubmit}
              disabled={submitting || !selectedResumeId || uploading}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
