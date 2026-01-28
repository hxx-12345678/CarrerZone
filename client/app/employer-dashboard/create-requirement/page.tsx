"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, X, Plus, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { motion } from "framer-motion"
import { EmployerDashboardNavbar } from "@/components/employer-dashboard-navbar"
import { EmployerFooter } from "@/components/employer-footer"
import { toast } from "sonner"
import { apiService } from "@/lib/api"
import IndustryDropdown from "@/components/ui/industry-dropdown"
import DepartmentDropdown from "@/components/ui/department-dropdown"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"

export default function CreateRequirementPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentSkill, setCurrentSkill] = useState("")
  const [currentIncludeSkill, setCurrentIncludeSkill] = useState("")
  const [currentExcludeSkill, setCurrentExcludeSkill] = useState("")
  const [currentBenefit, setCurrentBenefit] = useState("")
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false)

  // Initialize form data - same structure as edit page
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    experience: "",
    salary: "",
    jobType: "Full-time",
    skills: [] as string[],
    includeSkills: [] as string[],
    excludeSkills: [] as string[],
    education: "B.Tech/B.E.",
    industry: "",
    department: "",
    validTill: "",
    noticePeriod: "Immediately",
    remoteWork: "Hybrid",
    travelRequired: "No",
    benefits: [] as string[],
    // Additional fields for create form
    keySkills: [] as string[],
    candidateDesignations: [] as string[],
    currentDesignation: "",
    candidateLocations: [] as string[],
    includeWillingToRelocate: false,
    workExperienceMin: "",
    workExperienceMax: "",
    currentSalaryMin: "",
    currentSalaryMax: "",
    currency: "INR",
    includeNotMentioned: false,
    // Newly added fields
    institute: "",
    resumeFreshness: "",
    currentCompany: "",
    lastActive: "",
    diversityPreference: [] as string[], // ['all', 'male', 'female', 'other']
  })

  const handleInputChange = (field: string, value: string | string[] | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSkillChange = (skill: string, action: 'add' | 'remove') => {
    if (action === 'add' && !formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }))
    } else if (action === 'remove') {
      setFormData(prev => ({
        ...prev,
        skills: prev.skills.filter(s => s !== skill)
      }))
    }
  }

  const handleBenefitChange = (benefit: string, action: 'add' | 'remove') => {
    if (action === 'add' && !formData.benefits.includes(benefit)) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, benefit]
      }))
    } else if (action === 'remove') {
      setFormData(prev => ({
        ...prev,
        benefits: prev.benefits.filter(b => b !== benefit)
      }))
    }
  }

  // Function to format skill text to proper case
  const formatSkillText = (text: string) => {
    return text
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const handleAddSkill = () => {
    const formattedSkill = formatSkillText(currentSkill)
    if (formattedSkill && !formData.keySkills.includes(formattedSkill)) {
      setFormData(prev => ({
        ...prev,
        keySkills: [...prev.keySkills, formattedSkill]
      }))
      setCurrentSkill("")
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      keySkills: prev.keySkills.filter(s => s !== skill)
    }))
  }

  const handleAddIncludeSkill = () => {
    const formattedSkill = formatSkillText(currentIncludeSkill)
    if (formattedSkill && !formData.includeSkills.includes(formattedSkill)) {
      setFormData(prev => ({
        ...prev,
        includeSkills: [...prev.includeSkills, formattedSkill]
      }))
      setCurrentIncludeSkill("")
    }
  }

  const handleRemoveIncludeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      includeSkills: prev.includeSkills.filter(s => s !== skill)
    }))
  }

  const handleAddExcludeSkill = () => {
    const formattedSkill = formatSkillText(currentExcludeSkill)
    if (formattedSkill && !formData.excludeSkills.includes(formattedSkill)) {
      setFormData(prev => ({
        ...prev,
        excludeSkills: [...prev.excludeSkills, formattedSkill]
      }))
      setCurrentExcludeSkill("")
    }
  }

  const handleRemoveExcludeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      excludeSkills: prev.excludeSkills.filter(s => s !== skill)
    }))
  }

  const handleAddBenefit = () => {
    if (currentBenefit.trim() && !formData.benefits.includes(currentBenefit.trim())) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, currentBenefit.trim()]
      }))
      setCurrentBenefit("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Front-end validation for required fields
    const missing: string[] = []
    if (!formData.title.trim()) missing.push('Job Title')
    if (!formData.description.trim()) missing.push('Job Description')
    if (!formData.location.trim()) missing.push('Location')
    if (!formData.industry.trim()) missing.push('Industry')
    if (!formData.department.trim()) missing.push('Department')
    
    // Validate salary ranges
    if (formData.currentSalaryMin && formData.currentSalaryMax && Number(formData.currentSalaryMin) > Number(formData.currentSalaryMax)) {
      missing.push('Minimum salary cannot be greater than maximum salary')
    }
    
    // Validate experience ranges
    if (formData.workExperienceMin && formData.workExperienceMax && Number(formData.workExperienceMin) > Number(formData.workExperienceMax)) {
      missing.push('Minimum experience cannot be greater than maximum experience')
    }
    
    if (missing.length > 0) {
      toast.error('Missing or invalid fields', {
        description: `Please fix: ${missing.join(', ')}`
      })
      return
    }

    setIsLoading(true)

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        workExperienceMin: formData.workExperienceMin && String(formData.workExperienceMin).trim() !== '' ? Number(formData.workExperienceMin) : undefined,
        workExperienceMax: formData.workExperienceMax && String(formData.workExperienceMax).trim() !== '' ? Number(formData.workExperienceMax) : undefined,
        currentSalaryMin: formData.currentSalaryMin && String(formData.currentSalaryMin).trim() !== '' ? Number(formData.currentSalaryMin) : undefined,
        currentSalaryMax: formData.currentSalaryMax && String(formData.currentSalaryMax).trim() !== '' ? Number(formData.currentSalaryMax) : undefined,
        currency: formData.currency,
        jobType: formData.jobType,
        skills: formData.skills,
        keySkills: formData.keySkills,
        includeSkills: formData.includeSkills,
        excludeSkills: formData.excludeSkills,
        education: formData.education,
        industry: formData.industry,
        department: formData.department,
        validTill: formData.validTill || undefined,
        noticePeriod: formData.noticePeriod,
        remoteWork: formData.remoteWork,
        travelRequired: formData.travelRequired === 'Yes' ? true : (formData.travelRequired === 'No' ? false : undefined),
        candidateLocations: formData.candidateLocations,
        candidateDesignations: formData.candidateDesignations,
        currentDesignation: formData.currentDesignation || undefined,
        includeWillingToRelocate: !!formData.includeWillingToRelocate,
        includeNotMentioned: !!formData.includeNotMentioned,
        benefits: formData.benefits,
        institute: formData.institute || undefined,
        resumeFreshness: formData.resumeFreshness || undefined,
        currentCompany: formData.currentCompany || undefined,
        lastActive: formData.lastActive && String(formData.lastActive).trim() !== '' ? Number(formData.lastActive) : undefined,
        diversityPreference: formData.diversityPreference.length > 0 ? formData.diversityPreference : undefined,
      }

      console.log('🔍 Submitting requirement payload:', payload)
      const response = await apiService.createRequirement(payload)
      console.log('✅ Requirement API response:', response)
      if (!response.success) {
        console.error('❌ Requirement creation failed:', response)
        console.error('❌ Response details:', {
          success: response.success,
          message: response.message,
          errors: (response as any).errors,
          data: response.data
        })
        
        // Handle specific error messages
        let errorMessage = response.message || 'Failed to create requirement. Please try again.'
        
        if (response.message?.includes('quota') || response.message?.includes('Quota')) {
          errorMessage = '📊 Quota Limit Reached: You have reached your monthly requirement posting limit. Please contact support or upgrade your plan to create more requirements.'
        } else if (response.message?.includes('unauthorized') || response.message?.includes('permission')) {
          errorMessage = '🔒 Permission Denied: You do not have permission to create requirements. Please contact your administrator.'
        } else if (response.message?.includes('already exists')) {
          errorMessage = '⚠️ Duplicate: A similar requirement already exists. Please check your existing requirements.'
        }
        
        throw new Error(errorMessage)
      }
      
      const createdId = response.data?.id || response.data?.data?.id || ''
      // End loading before navigating so the toast renders instantly
      setIsLoading(false)
      toast.success("✅ Requirement Created", {
        description: createdId ? `Your requirement has been created successfully. ID: ${createdId}` : 'Your requirement has been created successfully.',
      })
      router.push(createdId 
        ? `/employer-dashboard/requirements/${createdId}/candidates`
        : '/employer-dashboard/requirements')
    } catch (error: any) {
      console.error('❌ Error creating requirement:', error?.message || error)
      
      // Provide context-specific error messages
      let displayMessage = error?.message || "Failed to create requirement. Please try again."
      let displayTitle = "Creation Failed"
      
      // Add helpful suggestions based on error type
      if (displayMessage.includes('Quota')) {
        displayTitle = "📊 Quota Limit Reached"
        displayMessage = "You have reached your monthly requirement posting limit. Upgrade your plan to post more requirements or contact support."
      } else if (displayMessage.includes('Permission') || displayMessage.includes('unauthorized')) {
        displayTitle = "🔒 Permission Denied"
      } else if (displayMessage.includes('Duplicate') || displayMessage.includes('already exists')) {
        displayTitle = "⚠️ Duplicate Requirement"
      } else if (displayMessage.includes('Invalid') || displayMessage.includes('validation')) {
        displayTitle = "⚠️ Invalid Input"
      }
      
      toast.error(displayTitle, {
        description: displayMessage,
      })
    } finally {
      // Keep as a safeguard; if we navigated above, this is harmless
      setIsLoading(false)
    }
  }

  const commonSkills = [
    "React", "Node.js", "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "PHP", "Ruby", "Go", "Swift", "Kotlin",
    "HTML", "CSS", "SQL", "NoSQL", "MongoDB", "PostgreSQL", "MySQL", "Redis", "Elasticsearch",
    "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Jenkins", "Git", "GitLab", "GitHub",
    "Machine Learning", "Data Science", "Analytics", "Business Intelligence", "Project Management", "Agile", "Scrum",
    "Communication", "Leadership", "Problem Solving", "Teamwork", "Time Management", "Critical Thinking",
    "Sales", "Marketing", "Customer Service", "Finance", "Accounting", "HR", "Operations", "Strategy"
  ]
  const commonBenefits = ["Competitive salary", "Health insurance", "Flexible working hours", "Professional development", "Remote work", "Stock options", "Gym membership", "Free lunch"]
  // Removed industries and departments arrays - using custom dropdowns now

  return (
    <EmployerAuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-auto">
        <EmployerDashboardNavbar />
        
        {/* Background decorative elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-200/45 via-cyan-200/35 to-indigo-200/45"></div>
          <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-300/10 to-cyan-300/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-indigo-300/10 to-violet-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/employer-dashboard')}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Create New Requirement</h1>
              <p className="text-slate-600">Define your hiring requirement</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(59,130,246,0.06)]">
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="e.g., Senior Software Engineer"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Job Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe the role, responsibilities, and requirements..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="e.g., Bangalore, Karnataka"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="jobType">Job Type</Label>
                      <Select value={formData.jobType} onValueChange={(value) => handleInputChange('jobType', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Experience Required (Years)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={formData.workExperienceMin}
                            onChange={(e) => handleInputChange('workExperienceMin', e.target.value)}
                            placeholder="Min (e.g., 3)"
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={formData.workExperienceMax}
                            onChange={(e) => handleInputChange('workExperienceMax', e.target.value)}
                            placeholder="Max (e.g., 5)"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Leave empty for no limit</p>
                    </div>
                    
                    <div>
                      <Label>Current Salary Range (LPA)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.currentSalaryMin}
                            onChange={(e) => handleInputChange('currentSalaryMin', e.target.value)}
                            placeholder="Min (e.g., 8)"
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.currentSalaryMax}
                            onChange={(e) => handleInputChange('currentSalaryMax', e.target.value)}
                            placeholder="Max (e.g., 15)"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Leave empty for no limit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skills */}
              <Card className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(59,130,246,0.06)]">
                <CardHeader>
                  <CardTitle>Required Skills</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Include Skills */}
                  <div>
                    <Label className="text-green-700 font-semibold">Include Skills (Must Have)</Label>
                    <p className="text-xs text-slate-500 mb-2">Candidates must have these skills</p>
                    <div className="flex flex-wrap gap-2 mt-2 mb-3">
                      {formData.includeSkills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="bg-green-100 text-green-800 border-green-200 flex items-center space-x-1">
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveIncludeSkill(skill)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Add skill to include"
                        value={currentIncludeSkill}
                        onChange={(e) => setCurrentIncludeSkill(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddIncludeSkill())}
                      />
                      <Button type="button" onClick={handleAddIncludeSkill} size="sm" variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Exclude Skills */}
                  <div>
                    <Label className="text-red-700 font-semibold">Exclude Skills (Must Not Have)</Label>
                    <p className="text-xs text-slate-500 mb-2">Candidates must NOT have these skills</p>
                    <div className="flex flex-wrap gap-2 mt-2 mb-3">
                      {formData.excludeSkills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="bg-red-100 text-red-800 border-red-200 flex items-center space-x-1">
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExcludeSkill(skill)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Add skill to exclude"
                        value={currentExcludeSkill}
                        onChange={(e) => setCurrentExcludeSkill(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddExcludeSkill())}
                      />
                      <Button type="button" onClick={handleAddExcludeSkill} size="sm" variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Additional Skills - Manual List */}
                  <div>
                    <Label>Key Skills (Optional)</Label>
                    <p className="text-xs text-slate-500 mb-2">Add skills that you'd like to highlight for this position. Add them individually to "Include Skills" section if you want to use them for filtering.</p>
                    <div className="flex flex-wrap gap-2 mt-2 mb-3">
                      {formData.keySkills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="flex items-center space-x-1">
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex space-x-2 mt-2 mb-3">
                      <Input
                        placeholder="Add skill"
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                      />
                      <Button type="button" onClick={handleAddSkill} size="sm" variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-slate-600 mb-2 font-medium">Popular Skills:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {commonSkills.filter(skill => !formData.keySkills.includes(skill)).slice(0, 10).map((skill) => (
                        <Button
                          key={skill}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const formattedSkill = formatSkillText(skill);
                            if (formattedSkill && !formData.keySkills.includes(formattedSkill)) {
                              setFormData(prev => ({
                                ...prev,
                                keySkills: [...prev.keySkills, formattedSkill]
                              }))
                            }
                          }}
                        >
                          + {skill}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Benefits */}
              <Card className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(59,130,246,0.06)]">
                <CardHeader>
                  <CardTitle>Benefits & Perks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Selected Benefits</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.benefits.map((benefit) => (
                        <Badge key={benefit} variant="secondary" className="flex items-center space-x-1">
                          <span>{benefit}</span>
                          <button
                            type="button"
                            onClick={() => handleBenefitChange(benefit, 'remove')}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Add Benefits</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {commonBenefits.filter(benefit => !formData.benefits.includes(benefit)).map((benefit) => (
                        <Button
                          key={benefit}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleBenefitChange(benefit, 'add')}
                        >
                          + {benefit}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Benefits Input */}
                  <div>
                    <Label>Add Custom Benefits</Label>
                    <div className="flex space-x-2 mt-2">
                      <Input
                        placeholder="Add custom benefit"
                        value={currentBenefit}
                        onChange={(e) => setCurrentBenefit(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddBenefit())}
                      />
                      <Button type="button" onClick={handleAddBenefit} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Job Details */}
              <Card className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(59,130,246,0.06)]">
                <CardHeader>
                  <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="education">Education</Label>
                    <Select value={formData.education} onValueChange={(value) => handleInputChange('education', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select education" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="B.Tech/B.E.">B.Tech/B.E.</SelectItem>
                        <SelectItem value="M.Tech/M.E.">M.Tech/M.E.</SelectItem>
                        <SelectItem value="MBA">MBA</SelectItem>
                        <SelectItem value="B.Sc">B.Sc</SelectItem>
                        <SelectItem value="M.Sc">M.Sc</SelectItem>
                        <SelectItem value="Any Graduate">Any Graduate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowIndustryDropdown(true)
                      }}
                    >
                      <span>{formData.industry || "Select industry"}</span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    
                    {showIndustryDropdown && (
                      <IndustryDropdown
                        selectedIndustries={formData.industry ? [formData.industry] : []}
                        onIndustryChange={(industries: string[]) => {
                          // For requirements, we only allow single selection
                          if (industries.length > 0) {
                            handleInputChange('industry', industries[0])
                          } else {
                            handleInputChange('industry', '')
                          }
                        }}
                        onClose={() => setShowIndustryDropdown(false)}
                        hideSelectAllButtons={true}
                      />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowDepartmentDropdown(true)
                      }}
                    >
                      <span>{formData.department || "Select department"}</span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    
                    {showDepartmentDropdown && (
                      <DepartmentDropdown
                        selectedDepartments={formData.department ? [formData.department] : []}
                        onDepartmentChange={(departments: string[]) => {
                          // For requirements, we only allow single selection
                          if (departments.length > 0) {
                            handleInputChange('department', departments[0])
                          } else {
                            handleInputChange('department', '')
                          }
                        }}
                        onClose={() => setShowDepartmentDropdown(false)}
                        hideSelectAllButtons={true}
                      />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="validTill">Valid Till</Label>
                    <Input
                      id="validTill"
                      type="date"
                      value={formData.validTill}
                      onChange={(e) => handleInputChange('validTill', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="noticePeriod">Notice Period</Label>
                    <Select value={formData.noticePeriod} onValueChange={(value) => handleInputChange('noticePeriod', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select notice period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Immediately">Immediately</SelectItem>
                        <SelectItem value="15 days">15 days</SelectItem>
                        <SelectItem value="30 days">30 days</SelectItem>
                        <SelectItem value="60 days">60 days</SelectItem>
                        <SelectItem value="90 days">90 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="institute">Institute / University</Label>
                    <Input
                      id="institute"
                      value={formData.institute}
                      onChange={(e) => handleInputChange('institute', e.target.value)}
                      placeholder="e.g., IIT Bombay, IIM Ahmedabad"
                    />
                  </div>

                  <div>
                    <Label htmlFor="resumeFreshness">Resume Freshness / Last Updated Date</Label>
                    <Input
                      id="resumeFreshness"
                      type="date"
                      value={formData.resumeFreshness}
                      onChange={(e) => handleInputChange('resumeFreshness', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="currentCompany">Current Company</Label>
                    <Input
                      id="currentCompany"
                      value={formData.currentCompany}
                      onChange={(e) => handleInputChange('currentCompany', e.target.value)}
                      placeholder="e.g., Infosys, TCS"
                    />
                  </div>

                  <div>
                    <Label htmlFor="currentDesignation">Current Designation</Label>
                    <Input
                      id="currentDesignation"
                      value={formData.currentDesignation}
                      onChange={(e) => handleInputChange('currentDesignation', e.target.value)}
                      placeholder="e.g., Software Engineer, Product Manager"
                    />
                  </div>

                  <div>
                    <Label htmlFor="lastActive">Last Active (Days Ago)</Label>
                    <Input
                      id="lastActive"
                      type="number"
                      min="0"
                      value={formData.lastActive}
                      onChange={(e) => handleInputChange('lastActive', e.target.value)}
                      placeholder="e.g., 30 (optional)"
                    />
                    <p className="text-xs text-slate-500 mt-1">Show candidates active within this many days</p>
                  </div>
                </CardContent>
              </Card>

              {/* Work Preferences */}
              <Card className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(59,130,246,0.06)]">
                <CardHeader>
                  <CardTitle>Work Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="remoteWork">Remote Work</Label>
                    <Select value={formData.remoteWork} onValueChange={(value) => handleInputChange('remoteWork', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select remote work option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="On-site">On-site</SelectItem>
                        <SelectItem value="Remote">Remote</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="travelRequired">Travel Required</Label>
                    <Select value={formData.travelRequired} onValueChange={(value) => handleInputChange('travelRequired', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select travel requirement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Occasionally">Occasionally</SelectItem>
                        <SelectItem value="Frequently">Frequently</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Diversity Preference (Gender)</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="diversity-all"
                          checked={formData.diversityPreference.includes('all')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleInputChange('diversityPreference', ['all'])
                            } else {
                              handleInputChange('diversityPreference', [])
                            }
                          }}
                        />
                        <Label htmlFor="diversity-all" className="font-normal cursor-pointer">All (No preference)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="diversity-male"
                          checked={formData.diversityPreference.includes('male')}
                          onCheckedChange={(checked) => {
                            const current = formData.diversityPreference.filter(d => d !== 'all')
                            if (checked) {
                              handleInputChange('diversityPreference', [...current, 'male'])
                            } else {
                              handleInputChange('diversityPreference', current.filter(d => d !== 'male'))
                            }
                          }}
                        />
                        <Label htmlFor="diversity-male" className="font-normal cursor-pointer">Male</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="diversity-female"
                          checked={formData.diversityPreference.includes('female')}
                          onCheckedChange={(checked) => {
                            const current = formData.diversityPreference.filter(d => d !== 'all')
                            if (checked) {
                              handleInputChange('diversityPreference', [...current, 'female'])
                            } else {
                              handleInputChange('diversityPreference', current.filter(d => d !== 'female'))
                            }
                          }}
                        />
                        <Label htmlFor="diversity-female" className="font-normal cursor-pointer">Female</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="diversity-other"
                          checked={formData.diversityPreference.includes('other')}
                          onCheckedChange={(checked) => {
                            const current = formData.diversityPreference.filter(d => d !== 'all')
                            if (checked) {
                              handleInputChange('diversityPreference', [...current, 'other'])
                            } else {
                              handleInputChange('diversityPreference', current.filter(d => d !== 'other'))
                            }
                          }}
                        />
                        <Label htmlFor="diversity-other" className="font-normal cursor-pointer">Other</Label>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Select one or more options. Leave all unchecked for no preference.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/employer-dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-[0_8px_30px_rgba(59,130,246,0.3)]"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Create Requirement</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>

      <EmployerFooter />
    </div>
    </EmployerAuthGuard>
  )
} 