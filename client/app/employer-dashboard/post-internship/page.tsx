"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Eye, Send, AlertCircle, Camera, Upload, X, Image as ImageIcon, CheckCircle, GraduationCap } from "lucide-react"
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
import { EmployerDashboardNavbar } from "@/components/employer-dashboard-navbar"
import { EmployerDashboardFooter } from "@/components/employer-dashboard-footer"
import { useAuth } from "@/hooks/useAuth"
import { apiService } from "@/lib/api"
import { toast } from "sonner"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"

export default function PostInternshipPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
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
    type: "internship", // Default to internship
    experience: "fresher", // Default to fresher for internships
    salary: "",
    description: "",
    requirements: "",
    benefits: "",
    skills: [] as string[],
    duration: "", // Internship specific field
    startDate: "", // Internship specific field
    workMode: "", // Remote/On-site/Hybrid
    learningObjectives: "", // What the intern will learn
    mentorship: "", // Mentorship details
  })
  const [jobPhotos, setJobPhotos] = useState<any[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [uploadedJobId, setUploadedJobId] = useState<string | null>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [postedJobId, setPostedJobId] = useState<string | null>(null)

  const steps = [
    { id: 1, title: "Internship Details", description: "Basic internship information" },
    { id: 2, title: "Requirements", description: "Skills and qualifications" },
    { id: 3, title: "Learning & Benefits", description: "What interns will gain" },
    { id: 4, title: "Photos", description: "Showcase your workplace" },
    { id: 5, title: "Review & Post", description: "Final review" },
  ]

  // Load job photos when uploadedJobId changes
  useEffect(() => {
    const loadJobPhotos = async () => {
      if (uploadedJobId && user) {
        try {
          console.log('🔍 Loading job photos for job ID:', uploadedJobId)
          const photosResponse = await apiService.getJobPhotos(uploadedJobId)
          if (photosResponse.success) {
            console.log('✅ Job photos loaded:', photosResponse.data)
            setJobPhotos(photosResponse.data || [])
          } else {
            console.error('❌ Failed to load photos:', photosResponse)
          }
        } catch (error) {
          console.error('Failed to load job photos:', error)
        }
      }
    }

    loadJobPhotos()
  }, [uploadedJobId, user])

  // Load job data when editing
  useEffect(() => {
    const loadJobData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const jobId = urlParams.get('draft') || urlParams.get('job');
      
      if (jobId && user) {
        try {
          setLoadingDraft(true);
          console.log('🔍 Loading internship data for job ID:', jobId);
          
          const response = await apiService.getJobForEdit(jobId);
          
          if (response.success) {
            const jobData = response.data;
            setEditingJobId(jobId);
            setFormData({
              title: jobData.title || "",
              department: jobData.department || "",
              location: jobData.location || "",
              type: jobData.jobType || "internship",
              experience: jobData.experienceLevel || "fresher",
              salary: jobData.salary || "",
              description: jobData.description || "",
              requirements: jobData.requirements || "",
              benefits: jobData.benefits || "",
              skills: jobData.skills || [],
              duration: jobData.duration || "",
              startDate: jobData.startDate || "",
              workMode: jobData.workMode || "",
              learningObjectives: jobData.learningObjectives || "",
              mentorship: jobData.mentorship || "",
            });
            setUploadedJobId(jobId);
            console.log('✅ Internship data loaded successfully');
          } else {
            console.error('❌ Failed to load internship data:', response.message);
            toast.error('Failed to load internship data');
          }
        } catch (error) {
          console.error('❌ Error loading internship data:', error);
          toast.error('Error loading internship data');
        } finally {
          setLoadingDraft(false);
        }
      }
    }

    if (user) {
      loadJobData();
    }
  }, [user]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSkillAdd = (skill: string) => {
    if (skill.trim() && !formData.skills.includes(skill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }))
    }
  }

  const handleSkillRemove = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const handlePublishJob = async () => {
    // Check authentication when trying to publish
    if (!user) {
      setShowAuthDialog(true)
      return
    }

    // Comprehensive validation
    const validationErrors = []
    
    // Basic required fields
    if (!formData.title.trim()) validationErrors.push('Internship title')
    if (!formData.description.trim()) validationErrors.push('Internship description')
    if (!formData.location.trim()) validationErrors.push('Location')
    if (!formData.requirements.trim()) validationErrors.push('Requirements')
    
    // Internship-specific required fields
    if (!formData.duration.trim()) validationErrors.push('Duration')
    if (!formData.startDate.trim()) validationErrors.push('Start date')
    if (!formData.workMode.trim()) validationErrors.push('Work mode')
    
    // Recommended fields (show warning but allow submission)
    const recommendedFields = []
    if (!formData.learningObjectives.trim()) recommendedFields.push('Learning objectives')
    if (!formData.mentorship.trim()) recommendedFields.push('Mentorship details')
    if (!formData.salary.trim()) recommendedFields.push('Compensation')
    if (formData.skills.length === 0) recommendedFields.push('Required skills')

    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.length === 1 
        ? `Please fill in the required field: ${validationErrors[0]}`
        : `Please fill in the following required fields: ${validationErrors.join(', ')}`
      toast.error(errorMessage)
      return
    }

    // Show warning for recommended fields
    if (recommendedFields.length > 0) {
      const warningMessage = recommendedFields.length === 1
        ? `Consider adding: ${recommendedFields[0]}`
        : `Consider adding: ${recommendedFields.join(', ')}`
      toast.warning(warningMessage)
    }

    try {
      setPublishing(true)
      console.log('📝 Submitting internship data:', formData)
      
      const jobData = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        location: formData.location,
        type: 'internship', // Always set to internship
        experience: formData.experience || 'fresher',
        salary: formData.salary,
        benefits: formData.benefits,
        skills: formData.skills,
        department: formData.department,
        status: 'active',
        // Internship specific fields
        duration: formData.duration,
        startDate: formData.startDate,
        workMode: formData.workMode,
        learningObjectives: formData.learningObjectives,
        mentorship: formData.mentorship,
      }

      let response;
      if (editingJobId) {
        // Update existing internship
        console.log('🔄 Publishing existing internship:', editingJobId);
        response = await apiService.updateJob(editingJobId, jobData);
        setUploadedJobId(editingJobId);
      } else {
        // Create new internship
        console.log('🆕 Creating new internship');
        response = await apiService.postJob(jobData);
        if (response.success && response.data?.id) {
          setUploadedJobId(response.data.id);
        }
      }
      
      if (response.success) {
        setPostedJobId(response.data?.id || editingJobId);
        setShowSuccessDialog(true);
        toast.success('Internship posted successfully!');
        console.log('✅ Internship posted successfully');
      } else {
        console.error('❌ Failed to post internship:', response.message);
        // Provide more specific error messages
        if (response.message?.includes('validation')) {
          toast.error('Please check all required fields and try again.');
        } else if (response.message?.includes('duplicate')) {
          toast.error('An internship with this title already exists. Please use a different title.');
        } else if (response.message?.includes('unauthorized')) {
          toast.error('You are not authorized to post internships. Please log in again.');
        } else {
          toast.error(response.message || 'Failed to post internship. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('❌ Error posting internship:', error);
      // Provide more specific error messages based on error type
      if (error.message?.includes('Network')) {
        toast.error('Network error. Please check your connection and try again.');
      } else if (error.message?.includes('timeout')) {
        toast.error('Request timed out. Please try again.');
      } else if (error.response?.status === 400) {
        toast.error('Invalid data provided. Please check all fields and try again.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to post internships.');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setPublishing(false);
    }
  }

  const handleSaveDraft = async () => {
    if (!user) {
      setShowAuthDialog(true)
      return
    }

    try {
      setSavingDraft(true)
      console.log('💾 Saving internship draft:', formData)
      
      const jobData = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        location: formData.location,
        type: 'internship',
        experience: formData.experience || 'fresher',
        salary: formData.salary,
        benefits: formData.benefits,
        skills: formData.skills,
        department: formData.department,
        status: 'draft',
        duration: formData.duration,
        startDate: formData.startDate,
        workMode: formData.workMode,
        learningObjectives: formData.learningObjectives,
        mentorship: formData.mentorship,
      }

      let response;
      if (editingJobId) {
        response = await apiService.updateJob(editingJobId, jobData);
      } else {
        response = await apiService.postJob(jobData);
        if (response.success && response.data?.id) {
          setEditingJobId(response.data.id);
          setUploadedJobId(response.data.id);
        }
      }
      
      if (response.success) {
        toast.success('Internship draft saved successfully!');
        console.log('✅ Internship draft saved successfully');
      } else {
        console.error('❌ Failed to save draft:', response.message);
        toast.error(response.message || 'Failed to save draft');
      }
    } catch (error) {
      console.error('❌ Error saving draft:', error);
      toast.error('Error saving draft. Please try again.');
    } finally {
      setSavingDraft(false);
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handlePhotoUpload = async (files: FileList) => {
    if (!uploadedJobId) {
      toast.error('Please save the internship first before uploading photos')
      return
    }

    setUploadingPhotos(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('photo', file)
        formData.append('jobId', uploadedJobId)
        
        const response = await apiService.uploadJobPhoto(formData)
        return response
      })

      const results = await Promise.all(uploadPromises)
      const successfulUploads = results.filter(result => result.success)
      
      if (successfulUploads.length > 0) {
        toast.success(`${successfulUploads.length} photo(s) uploaded successfully`)
        // Reload photos
        const photosResponse = await apiService.getJobPhotos(uploadedJobId)
        if (photosResponse.success) {
          setJobPhotos(photosResponse.data || [])
        }
      } else {
        toast.error('Failed to upload photos')
      }
    } catch (error) {
      console.error('Error uploading photos:', error)
      toast.error('Error uploading photos')
    } finally {
      setUploadingPhotos(false)
    }
  }

  const handlePhotoDelete = async (photoId: string) => {
    try {
      const response = await apiService.deleteJobPhoto(photoId)
      if (response.success) {
        toast.success('Photo deleted successfully')
        setJobPhotos(prev => prev.filter(photo => photo.id !== photoId))
      } else {
        toast.error('Failed to delete photo')
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
      toast.error('Error deleting photo')
    }
  }

  if (loading || loadingDraft) {
    return (
    <EmployerAuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-auto">
        <EmployerDashboardNavbar />
        
        {/* Background Effects - Blue theme */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-200/45 via-cyan-200/35 to-indigo-200/45"></div>
          <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-300/10 to-cyan-300/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-indigo-300/10 to-violet-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-300">Loading internship form...</p>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-auto">
        <EmployerDashboardNavbar />

        {/* Background Effects - Blue theme */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Base blue gradient overlay to ensure visible background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-200/45 via-cyan-200/35 to-indigo-200/45"></div>
          <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-300/10 to-cyan-300/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-indigo-300/10 to-violet-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-cyan-300/10 to-blue-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          {/* Wide translucent blue gradient strip (raised a bit like hero strip) */}
          <div className="absolute top-1/4 left-0 right-0 h-24 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-indigo-400/20"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 min-w-0 flex-1">
            <Link href="/employer-dashboard" className="flex-shrink-0">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center break-words">
                <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-blue-600 flex-shrink-0" />
                <span className="truncate">Post an Internship</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm sm:text-base break-words">Create an internship opportunity for talented students</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <Card className="mb-8 bg-white/50 backdrop-blur-2xl border-white/40 shadow-xl overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 overflow-hidden">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center w-full sm:w-auto min-w-0 flex-shrink-0">
                  <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex-shrink-0 ${
                    currentStep >= step.id 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-slate-300 text-slate-500'
                  }`}>
                    {currentStep > step.id ? (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <span className="text-xs sm:text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  <div className="ml-2 sm:ml-3 flex-1 sm:flex-none min-w-0">
                    <p className={`text-xs sm:text-sm font-medium truncate ${
                      currentStep >= step.id ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`hidden sm:block w-8 sm:w-16 h-0.5 mx-2 sm:mx-4 flex-shrink-0 ${
                      currentStep > step.id ? 'bg-blue-600' : 'bg-slate-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="min-h-[500px]"
        >
          {/* Validation Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <div className="text-sm">
                <p className="text-blue-800 dark:text-blue-200 font-medium mb-1">Form Validation</p>
                <p className="text-blue-700 dark:text-blue-300">
                  Fields marked with <span className="text-red-500 font-bold">*</span> are required. 
                  Other fields are recommended to make your internship posting more attractive to candidates.
                </p>
              </div>
            </div>
          </div>

          {/* Current Step Indicator */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">{currentStep}</span>
              </div>
              <div>
                <p className="text-blue-800 dark:text-blue-200 font-semibold">
                  Step {currentStep} of 5
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  {currentStep === 1 && "Internship Details"}
                  {currentStep === 2 && "Requirements & Skills"}
                  {currentStep === 3 && "Benefits & Compensation"}
                  {currentStep === 4 && "Workplace Photos"}
                  {currentStep === 5 && "Review & Post"}
                </p>
              </div>
            </div>
          </div>
          
          {/* Step 1 - Internship Details */}
          {currentStep === 1 && (
            <Card className="bg-white/50 backdrop-blur-2xl border-white/40 shadow-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white break-words">Internship Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Internship Title *
                    </label>
                    <Input
                      placeholder="e.g., Software Development Intern"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Department
                    </label>
                    <Input
                      placeholder="e.g., Engineering, Marketing"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Location *
                    </label>
                    <Input
                      placeholder="e.g., New York, NY or Remote"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Work Mode *
                    </label>
                    <Select value={formData.workMode} onValueChange={(value) => handleInputChange('workMode', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select work mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="on-site">On-site</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Duration *
                    </label>
                    <Input
                      placeholder="e.g., 3 months, 6 months"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Start Date *
                    </label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 break-words">
                    Internship Description *
                  </label>
                  <Textarea
                    placeholder="Describe the internship role, what the intern will be working on, and the overall experience..."
                    rows={6}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="resize-none overflow-wrap-anywhere break-words"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 break-words">
                    Learning Objectives
                  </label>
                  <Textarea
                    placeholder="What skills and knowledge will the intern gain from this experience?"
                    rows={4}
                    value={formData.learningObjectives}
                    onChange={(e) => handleInputChange('learningObjectives', e.target.value)}
                    className="resize-none overflow-wrap-anywhere break-words"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 break-words">
                    Mentorship Details
                  </label>
                  <Textarea
                    placeholder="Describe the mentorship and guidance the intern will receive..."
                    rows={4}
                    value={formData.mentorship}
                    onChange={(e) => handleInputChange('mentorship', e.target.value)}
                    className="resize-none overflow-wrap-anywhere break-words"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2 - Requirements & Skills */}
          {currentStep === 2 && (
            <Card className="bg-white/50 backdrop-blur-2xl border-white/40 shadow-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white break-words">Requirements & Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 overflow-hidden">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 break-words">
                    Requirements *
                  </label>
                  <Textarea
                    placeholder="List the requirements, qualifications, and what you're looking for in an intern..."
                    rows={6}
                    value={formData.requirements}
                    onChange={(e) => handleInputChange('requirements', e.target.value)}
                    className="resize-none overflow-wrap-anywhere break-words"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Required Skills
                  </label>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleSkillRemove(skill)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a skill (e.g., React, Python, Communication)"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleSkillAdd(e.currentTarget.value)
                            e.currentTarget.value = ''
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement
                          handleSkillAdd(input.value)
                          input.value = ''
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Experience Level
                  </label>
                  <Select value={formData.experience} onValueChange={(value) => handleInputChange('experience', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fresher">Fresher/Student</SelectItem>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="junior">Junior Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3 - Benefits & Compensation */}
          {currentStep === 3 && (
            <Card className="bg-white/50 backdrop-blur-2xl border-white/40 shadow-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white break-words">Benefits & Compensation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 overflow-hidden">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Stipend/Compensation
                  </label>
                  <Input
                    placeholder="e.g., $500/month, Unpaid, Course credit"
                    value={formData.salary}
                    onChange={(e) => handleInputChange('salary', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 break-words">
                    Benefits & Perks
                  </label>
                  <Textarea
                    placeholder="List any benefits, perks, or additional opportunities (e.g., flexible hours, networking events, certificate of completion, job offer potential)..."
                    rows={6}
                    value={formData.benefits}
                    onChange={(e) => handleInputChange('benefits', e.target.value)}
                    className="resize-none overflow-wrap-anywhere break-words"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4 - Workplace Photos */}
          {currentStep === 4 && (
            <Card className="bg-white/50 backdrop-blur-2xl border-white/40 shadow-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white break-words">Workplace Photos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 overflow-hidden">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
                  <Camera className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2 break-words">Upload Workplace Photos</h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-4 break-words">
                    Show potential interns what your workplace looks like
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
                    className="hidden"
                    id="photo-upload"
                    disabled={uploadingPhotos}
                  />
                  <label htmlFor="photo-upload">
                    <Button asChild disabled={uploadingPhotos}>
                      <span>
                        {uploadingPhotos ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Choose Photos
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>

                {jobPhotos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {jobPhotos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.fileUrl}
                          alt="Workplace"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handlePhotoDelete(photo.id)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 5 - Review & Post */}
          {currentStep === 5 && (
            <Card className="bg-white/50 backdrop-blur-2xl border-white/40 shadow-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white break-words">Review & Post</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white break-words">{formData.title}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="break-words">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Department:</span>
                      <span className="ml-2 text-slate-600 dark:text-slate-400">{formData.department || 'Not specified'}</span>
                    </div>
                    <div className="break-words">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Location:</span>
                      <span className="ml-2 text-slate-600 dark:text-slate-400">{formData.location}</span>
                    </div>
                    <div className="break-words">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Duration:</span>
                      <span className="ml-2 text-slate-600 dark:text-slate-400">{formData.duration}</span>
                    </div>
                    <div className="break-words">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Start Date:</span>
                      <span className="ml-2 text-slate-600 dark:text-slate-400">{formData.startDate}</span>
                    </div>
                    <div className="break-words">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Work Mode:</span>
                      <span className="ml-2 text-slate-600 dark:text-slate-400">{formData.workMode || 'Not specified'}</span>
                    </div>
                    <div className="break-words">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Compensation:</span>
                      <span className="ml-2 text-slate-600 dark:text-slate-400">{formData.salary || 'Not specified'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Skills Required:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="break-words">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-slate-700 dark:text-slate-300">
                    Review your internship posting carefully. Once published, it will be visible to students and job seekers.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            {currentStep > 1 && (
              <Button variant="outline" onClick={prevStep} className="w-full sm:w-auto">
                Previous
              </Button>
            )}
            <Button variant="outline" onClick={handleSaveDraft} disabled={savingDraft} className="w-full sm:w-auto">
              {savingDraft ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600 mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </>
              )}
            </Button>
          </div>
          <div className="flex w-full sm:w-auto">
            {currentStep < steps.length ? (
              <Button onClick={nextStep} className="w-full sm:w-auto">
                Next
              </Button>
            ) : (
              <Button onClick={handlePublishJob} disabled={publishing} className="w-full sm:w-auto">
                {publishing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Publish Internship
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
              Internship Posted Successfully!
            </DialogTitle>
            <DialogDescription>
              Your internship has been published and is now visible to students and job seekers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => router.push('/employer-dashboard')}>
              Back to Dashboard
            </Button>
            <Button variant="outline" onClick={() => setShowSuccessDialog(false)}>
              Post Another
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
            <DialogDescription>
              You need to be logged in to post an internship. Please log in to continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => router.push('/employer-login')}>
              Log In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EmployerDashboardFooter />
    </div>
    </EmployerAuthGuard>
  )
}
