"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Eye, Send, AlertCircle, Camera, Upload, X, Image as ImageIcon, CheckCircle, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import { GulfEmployerNavbar } from "@/components/gulf-employer-navbar"
import { EmployerFooter } from "@/components/employer-footer"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"
import { useAuth } from "@/hooks/useAuth"
import { apiService } from "@/lib/api"
import { toast } from "sonner"

export default function GulfEditJobPage() {
  return (
    <EmployerAuthGuard>
      <GulfEditJobContent />
    </EmployerAuthGuard>
  )
}

function GulfEditJobContent() {
  const router = useRouter()
  const { user } = useAuth()
  const params = useParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [publishing, setPublishing] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [loadingDraft, setLoadingDraft] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [editingJobId, setEditingJobId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    type: "",
    experience: "",
    salary: "",
    description: "",
    requirements: "",
    benefits: "",
    skills: [] as string[],
  })
  const [jobPhotos, setJobPhotos] = useState<any[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [uploadedJobId, setUploadedJobId] = useState<string | null>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  useEffect(() => {
    if (params.jobId) {
      setEditingJobId(params.jobId as string)
      loadJobForEdit(params.jobId as string)
    }
  }, [params.jobId])

  const loadJobForEdit = async (jobId: string) => {
    try {
      setLoadingDraft(true)
      console.log('🔍 Loading Gulf job for edit:', jobId)
      
      const response = await apiService.getJobForEdit(jobId)
      
      if (response.success && response.data) {
        console.log('✅ Gulf job loaded for edit:', response.data)
        const job = response.data
        
        setFormData({
          title: job.title || "",
          department: job.department || "",
          location: job.location || "",
          type: job.jobType || job.type || "",
          experience: job.experienceLevel || job.experience || "",
          salary: job.salary || "",
          description: job.description || "",
          requirements: job.requirements || "",
          benefits: job.benefits || "",
          skills: Array.isArray(job.skills) ? job.skills : (job.skills ? job.skills.split(',').map((s: string) => s.trim()) : []),
        })
        
        toast.success('Job loaded successfully for editing')
      } else {
        console.error('❌ Failed to load Gulf job for edit:', response)
        toast.error(response.message || 'Failed to load job for editing')
        router.push('/gulf-dashboard/manage-jobs')
      }
    } catch (error: any) {
      console.error('❌ Error loading Gulf job for edit:', error)
      toast.error('Failed to load job for editing')
      router.push('/gulf-dashboard/manage-jobs')
    } finally {
      setLoadingDraft(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSkillsChange = (skillsString: string) => {
    const skillsArray = skillsString.split(',').map(skill => skill.trim()).filter(skill => skill)
    setFormData(prev => ({
      ...prev,
      skills: skillsArray
    }))
  }

  const handleSaveDraft = async () => {
    if (!user || (user.userType !== 'employer' && user.userType !== 'admin')) {
      setShowAuthDialog(true)
      return
    }

    try {
      setSavingDraft(true)
      console.log('💾 Saving Gulf job as draft:', formData)
      
      const response = await apiService.createJob({
        ...formData,
        status: 'draft',
        region: 'gulf',
        companyId: user.companyId,
      })

      if (response.success) {
        toast.success('Gulf job saved as draft successfully!')
        setUploadedJobId(response.data?.id || null)
      } else {
        toast.error(response.message || 'Failed to save job as draft')
      }
    } catch (error: any) {
      console.error('❌ Error saving Gulf job as draft:', error)
      toast.error('Failed to save job as draft')
    } finally {
      setSavingDraft(false)
    }
  }

  const handlePublish = async () => {
    if (!user || (user.userType !== 'employer' && user.userType !== 'admin')) {
      setShowAuthDialog(true)
      return
    }

    try {
      setPublishing(true)
      console.log('🚀 Publishing Gulf job:', formData)
      
      const response = await apiService.createJob({
        ...formData,
        status: 'active',
        region: 'gulf',
        companyId: user.companyId,
      })

      if (response.success) {
        toast.success('Gulf job published successfully!')
        setShowSuccessDialog(true)
        setUploadedJobId(response.data?.id || null)
      } else {
        toast.error(response.message || 'Failed to publish job')
      }
    } catch (error: any) {
      console.error('❌ Error publishing Gulf job:', error)
      toast.error('Failed to publish job')
    } finally {
      setPublishing(false)
    }
  }

  const handleUpdateJob = async () => {
    if (!editingJobId) return

    try {
      setPublishing(true)
      console.log('🔄 Updating Gulf job:', editingJobId, formData)
      
      const response = await apiService.updateJob(editingJobId, {
        ...formData,
        region: 'gulf',
      })

      if (response.success) {
        toast.success('Gulf job updated successfully!')
        setShowSuccessDialog(true)
      } else {
        toast.error(response.message || 'Failed to update job')
      }
    } catch (error: any) {
      console.error('❌ Error updating Gulf job:', error)
      toast.error('Failed to update job')
    } finally {
      setPublishing(false)
    }
  }

  if (loadingDraft) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900">
        <GulfEmployerNavbar />
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 pt-20 sm:pt-24 lg:pt-28 pb-6 sm:pb-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading job for editing...</p>
            </div>
          </div>
        </div>
        <EmployerFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900">
      <GulfEmployerNavbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-6">
            <Link href="/gulf-dashboard/manage-jobs">
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Gulf Jobs</span>
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Edit className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  {editingJobId ? 'Edit Gulf Job' : 'Post New Gulf Job'}
                </h1>
                <p className="text-slate-600">Create or edit job postings for the Gulf region</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-white/80 backdrop-blur-xl border-slate-200/50">
            <CardContent className="p-8">
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Job Title *
                      </label>
                      <Input
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="e.g., Senior Software Engineer"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Department
                      </label>
                      <Input
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        placeholder="e.g., Engineering, Marketing"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Location *
                      </label>
                      <Input
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="e.g., Dubai, UAE"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Job Type
                      </label>
                      <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Experience Level
                      </label>
                      <Select value={formData.experience} onValueChange={(value) => handleInputChange('experience', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entry">Entry Level</SelectItem>
                          <SelectItem value="mid">Mid Level</SelectItem>
                          <SelectItem value="senior">Senior Level</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Salary Range
                      </label>
                      <Input
                        value={formData.salary}
                        onChange={(e) => handleInputChange('salary', e.target.value)}
                        placeholder="e.g., AED 8,000 - 12,000"
                      />
                    </div>
                  </div>
                </div>

                {/* Job Description */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Job Description</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description *
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe the role, responsibilities, and what you're looking for..."
                      rows={6}
                      required
                    />
                  </div>
                </div>

                {/* Requirements */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Requirements</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Requirements
                    </label>
                    <Textarea
                      value={formData.requirements}
                      onChange={(e) => handleInputChange('requirements', e.target.value)}
                      placeholder="List the key requirements for this position..."
                      rows={4}
                    />
                  </div>
                </div>

                {/* Benefits */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Benefits & Perks</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Benefits
                    </label>
                    <Textarea
                      value={formData.benefits}
                      onChange={(e) => handleInputChange('benefits', e.target.value)}
                      placeholder="List the benefits and perks you offer..."
                      rows={4}
                    />
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Required Skills</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Skills (comma-separated)
                    </label>
                    <Input
                      value={formData.skills.join(', ')}
                      onChange={(e) => handleSkillsChange(e.target.value)}
                      placeholder="e.g., JavaScript, React, Node.js, Python"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      Separate multiple skills with commas
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                  <div className="flex items-center space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={savingDraft}
                      className="flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{savingDraft ? 'Saving...' : 'Save as Draft'}</span>
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/gulf-dashboard/manage-jobs')}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={editingJobId ? handleUpdateJob : handlePublish}
                      disabled={publishing}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 flex items-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {publishing 
                          ? (editingJobId ? 'Updating...' : 'Publishing...') 
                          : (editingJobId ? 'Update Job' : 'Publish Job')
                        }
                      </span>
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <EmployerFooter />

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <span>Job {editingJobId ? 'Updated' : 'Published'} Successfully!</span>
            </DialogTitle>
            <DialogDescription>
              Your Gulf job has been {editingJobId ? 'updated' : 'published'} and is now live.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => router.push('/gulf-dashboard/manage-jobs')}>
              View All Jobs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
