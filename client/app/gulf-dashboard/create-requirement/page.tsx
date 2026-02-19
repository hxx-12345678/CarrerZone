"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, X, Plus, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { GulfEmployerNavbar } from "@/components/gulf-employer-navbar"
import { EmployerFooter } from "@/components/employer-footer"
import { toast } from "sonner"
import { apiService } from "@/lib/api"
import IndustryDropdown from "@/components/ui/industry-dropdown"
import DepartmentDropdown from "@/components/ui/department-dropdown"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"
import { GulfEmployerAuthGuard } from "@/components/gulf-employer-auth-guard"
import { PermissionGuard } from "@/components/permission-guard"

const commonSkills = [
  "React", "Node.js", "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "PHP", "Ruby", "Go", "Swift", "Kotlin",
  "HTML", "CSS", "SQL", "NoSQL", "MongoDB", "PostgreSQL", "MySQL", "Redis", "Elasticsearch",
  "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Jenkins", "Git", "GitLab", "GitHub",
  "Machine Learning", "Data Science", "Analytics", "Business Intelligence", "Project Management", "Agile", "Scrum",
  "Communication", "Leadership", "Problem Solving", "Teamwork", "Time Management", "Critical Thinking",
  "Sales", "Marketing", "Customer Service", "Finance", "Accounting", "HR", "Operations", "Strategy"
]

const commonBenefits = [
  "Competitive salary", "Health insurance", "Flexible working hours", "Professional development",
  "Remote work", "Stock options", "Gym membership", "Free lunch"
]

const formatSkillText = (text: string) =>
  text
    .trim()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")

const normalizeLocations = (values: string[]): string[] => {
  const seen = new Set<string>()
  return values
    .map(value => value.trim())
    .filter(value => {
      if (!value) return false
      const key = value.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

export default function GulfCreateRequirementPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentSkill, setCurrentSkill] = useState("")
  const [currentIncludeSkill, setCurrentIncludeSkill] = useState("")
  const [currentExcludeSkill, setCurrentExcludeSkill] = useState("")
  const [currentBenefit, setCurrentBenefit] = useState("")
  const [currentCandidateDesignation, setCurrentCandidateDesignation] = useState("")
  const [currentLocation, setCurrentLocation] = useState("")
  const [currentExcludeLocation, setCurrentExcludeLocation] = useState("")
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false)

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
    keySkills: [] as string[],
    candidateDesignations: [] as string[],
    candidateLocations: [] as string[],
    excludeLocations: [] as string[],
    includeWillingToRelocate: false,
    workExperienceMin: "",
    workExperienceMax: "",
    currentSalaryMin: "",
    currentSalaryMax: "",
    currency: "AED",
    includeNotMentioned: false,
    institute: "",
    resumeFreshness: "",
    currentCompany: "",
    lastActive: "",
    diversityPreference: [] as string[],
  })

  const handleInputChange = (field: string, value: string | string[] | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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

  const handleAddSkill = () => {
    const formattedSkill = formatSkillText(currentSkill)
    if (formattedSkill && !formData.keySkills.includes(formattedSkill)) {
      setFormData(prev => ({
        ...prev,
        keySkills: [...prev.keySkills, formattedSkill],
        includeSkills: [...new Set([...(prev.includeSkills || []), formattedSkill])]
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

  const handleAddDesignation = () => {
    const designation = formatSkillText(currentCandidateDesignation)
    if (designation && !formData.candidateDesignations.includes(designation)) {
      setFormData(prev => ({
        ...prev,
        candidateDesignations: [...prev.candidateDesignations, designation]
      }))
      setCurrentCandidateDesignation("")
    }
  }

  const handleRemoveDesignation = (designation: string) => {
    setFormData(prev => ({
      ...prev,
      candidateDesignations: prev.candidateDesignations.filter(d => d !== designation)
    }))
  }

  const handleAddLocation = () => {
    const location = currentLocation.trim()
    if (!location) return
    setFormData(prev => {
      const updatedIncludes = normalizeLocations([...(prev.candidateLocations || []), location])
      const locationKey = location.toLowerCase()
      const updatedExcludes = (prev.excludeLocations || []).filter(loc => loc?.toLowerCase() !== locationKey)
      return {
        ...prev,
        candidateLocations: updatedIncludes,
        excludeLocations: updatedExcludes
      }
    })
    setCurrentLocation("")
  }

  const handleRemoveLocation = (location: string) => {
    setFormData(prev => ({
      ...prev,
      candidateLocations: (prev.candidateLocations || []).filter(loc => loc?.toLowerCase() !== location.toLowerCase())
    }))
  }

  const handleAddExcludeLocation = () => {
    const location = currentExcludeLocation.trim()
    if (!location) return
    setFormData(prev => {
      const updatedExcludes = normalizeLocations([...(prev.excludeLocations || []), location])
      const locationKey = location.toLowerCase()
      const updatedIncludes = (prev.candidateLocations || []).filter(loc => loc?.toLowerCase() !== locationKey)
      return {
        ...prev,
        excludeLocations: updatedExcludes,
        candidateLocations: updatedIncludes
      }
    })
    setCurrentExcludeLocation("")
  }

  const handleRemoveExcludeLocation = (location: string) => {
    setFormData(prev => ({
      ...prev,
      excludeLocations: (prev.excludeLocations || []).filter(loc => loc?.toLowerCase() !== location.toLowerCase())
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const missing: string[] = []
    if (!formData.title.trim()) missing.push('Job Title')
    if (!formData.description.trim()) missing.push('Job Description')
    if (!formData.location.trim()) missing.push('Location')
    if (missing.length > 0) {
      toast.error('Missing required fields', {
        description: `Please fill: ${missing.join(', ')}`
      })
      return
    }

    setIsLoading(true)

    try {
      const jobLocation = formData.location.trim()
      let includeLocations = normalizeLocations(formData.candidateLocations || [])
      const excludeLocations = normalizeLocations(formData.excludeLocations || [])
      const includeSkills = Array.from(new Set([...(formData.includeSkills || []), ...(formData.keySkills || [])]))

      if (jobLocation) {
        includeLocations = normalizeLocations([...(includeLocations || []), jobLocation])
      }

      const payload: any = {
        title: formData.title,
        description: formData.description,
        location: jobLocation,
        workExperienceMin: formData.workExperienceMin && String(formData.workExperienceMin).trim() !== '' ? Number(formData.workExperienceMin) : undefined,
        workExperienceMax: formData.workExperienceMax && String(formData.workExperienceMax).trim() !== '' ? Number(formData.workExperienceMax) : undefined,
        currentSalaryMin: formData.currentSalaryMin && String(formData.currentSalaryMin).trim() !== '' ? Number(formData.currentSalaryMin) : undefined,
        currentSalaryMax: formData.currentSalaryMax && String(formData.currentSalaryMax).trim() !== '' ? Number(formData.currentSalaryMax) : undefined,
        currency: formData.currency,
        jobType: formData.jobType,
        skills: formData.skills,
        keySkills: formData.keySkills,
        includeSkills,
        excludeSkills: formData.excludeSkills,
        education: formData.education,
        industry: formData.industry,
        department: formData.department,
        validTill: formData.validTill || undefined,
        noticePeriod: formData.noticePeriod,
        remoteWork: formData.remoteWork,
        travelRequired: formData.travelRequired === 'Yes' ? true : (formData.travelRequired === 'No' ? false : undefined),
        candidateLocations: includeLocations,
        excludeLocations,
        candidateDesignations: formData.candidateDesignations,
        includeWillingToRelocate: !!formData.includeWillingToRelocate,
        includeNotMentioned: !!formData.includeNotMentioned,
        benefits: formData.benefits,
        institute: formData.institute || undefined,
        resumeFreshness: formData.resumeFreshness || undefined,
        currentCompany: formData.currentCompany || undefined,
        lastActive: formData.lastActive && String(formData.lastActive).trim() !== '' ? Number(formData.lastActive) : undefined,
        diversityPreference: formData.diversityPreference.length > 0 ? formData.diversityPreference : undefined,
        region: "gulf",
      }

      console.log('🔍 Submitting Gulf requirement payload:', payload)
      const response = await apiService.createRequirement(payload)
      console.log('✅ Gulf requirement API response:', response)
      if (!response.success) {
        console.error('❌ Gulf requirement creation failed:', response)
        throw new Error(response.message || 'Failed to create requirement')
      }

      const createdId = response.data?.id || response.data?.data?.id || ''
      setIsLoading(false)
      toast.success("✅ Gulf Requirement Created", {
        description: createdId ? `Your Gulf requirement has been created successfully. ID: ${createdId}` : 'Your Gulf requirement has been created successfully.',
      })
      router.push(createdId ? `/gulf-dashboard/requirements/${createdId}/candidates` : '/gulf-dashboard/requirements')
    } catch (error: any) {
      console.error('❌ Error creating Gulf requirement:', error?.message || error)
      toast.error("❌ Creation Failed", {
        description: error?.message || "Failed to create requirement. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <EmployerAuthGuard>
      <GulfEmployerAuthGuard>
        <PermissionGuard permission="resumeDatabase">
          <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50/40 to-teal-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-auto">
            <GulfEmployerNavbar />

            {/* Background decorative elements */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/45 via-teal-200/35 to-cyan-200/45"></div>
              <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-emerald-300/10 to-teal-300/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-teal-300/10 to-cyan-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/gulf-dashboard')}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Create New Requirement - Gulf Region</h1>
                <p className="text-slate-600">Define your hiring requirement for Gulf region</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <Card className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(16,185,129,0.06)]">
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
                      <div>
                        <Label htmlFor="location">Job Location *</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          placeholder="e.g., Dubai, UAE"
                          required
                        />
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
                        <Label>Current Salary Range</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.currentSalaryMin}
                              onChange={(e) => handleInputChange('currentSalaryMin', e.target.value)}
                              placeholder="Min (e.g., 5000)"
                            />
                          </div>
                          <div>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.currentSalaryMax}
                              onChange={(e) => handleInputChange('currentSalaryMax', e.target.value)}
                              placeholder="Max (e.g., 10000)"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Leave empty for no limit</p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AED">AED (UAE Dirham)</SelectItem>
                          <SelectItem value="SAR">SAR (Saudi Riyal)</SelectItem>
                          <SelectItem value="QAR">QAR (Qatari Riyal)</SelectItem>
                          <SelectItem value="KWD">KWD (Kuwaiti Dinar)</SelectItem>
                          <SelectItem value="BHD">BHD (Bahraini Dinar)</SelectItem>
                          <SelectItem value="OMR">OMR (Omani Rial)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Skills */}
                <Card className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(16,185,129,0.06)]">
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

                    {/* Additional Skills */}
                    <div>
                      <Label>Additional Skills</Label>
                      <p className="text-xs text-slate-500 mb-2">
                        These skills are automatically included in &quot;Include Skills&quot; above
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
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
                      <div className="flex space-x-2 mt-2">
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
                      <div className="flex flex-wrap gap-2 mt-2">
                        {commonSkills
                          .filter(skill => !formData.keySkills.includes(skill))
                          .slice(0, 10)
                          .map((skill) => (
                            <Button
                              key={skill}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const formattedSkill = formatSkillText(skill)
                                if (formattedSkill && !formData.keySkills.includes(formattedSkill)) {
                                  setFormData(prev => ({
                                    ...prev,
                                    keySkills: [...prev.keySkills, formattedSkill],
                                    includeSkills: [...new Set([...(prev.includeSkills || []), formattedSkill])]
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

                {/* Candidate Profile Preferences */}
                <Card className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(16,185,129,0.06)]">
                  <CardHeader>
                    <CardTitle>Candidate Profile Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="text-slate-700">Candidate designations</Label>
                      <div className="mt-2 space-y-3">
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Add designations similar to the role you're hiring for"
                            value={currentCandidateDesignation}
                            onChange={(e) => setCurrentCandidateDesignation(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                handleAddDesignation()
                              }
                            }}
                            className="bg-white border-slate-200"
                          />
                          <Button type="button" onClick={handleAddDesignation} size="sm">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        {formData.candidateDesignations.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {formData.candidateDesignations.map((designation) => (
                              <Badge
                                key={designation}
                                variant="secondary"
                                className="bg-emerald-100 text-emerald-800 border-emerald-200 flex items-center space-x-1"
                              >
                                <span>{designation}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDesignation(designation)}
                                  className="ml-1 hover:text-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-6 space-y-4">
                        <Label className="text-slate-700">Candidate locations *</Label>
                        <div className="space-y-3">
                          <div className="flex space-x-2">
                            <Input
                              placeholder="Add preferred candidate locations (e.g., Dubai, Riyadh)"
                              value={currentLocation}
                              onChange={(e) => setCurrentLocation(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  handleAddLocation()
                                }
                              }}
                              className="bg-white border-slate-200"
                            />
                            <Button type="button" onClick={handleAddLocation} size="sm">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          {formData.candidateLocations.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {formData.candidateLocations.map((location) => (
                                <Badge
                                  key={location}
                                  variant="secondary"
                                  className="bg-purple-100 text-purple-800 border-purple-200 flex items-center space-x-1"
                                >
                                  <span>{location}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLocation(location)}
                                    className="ml-1 hover:text-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm text-slate-600">Exclude locations (optional)</Label>
                          <div className="flex space-x-2">
                            <Input
                              placeholder="Add locations to exclude"
                              value={currentExcludeLocation}
                              onChange={(e) => setCurrentExcludeLocation(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  handleAddExcludeLocation()
                                }
                              }}
                              className="bg-white border-slate-200"
                            />
                            <Button type="button" onClick={handleAddExcludeLocation} size="sm" variant="outline">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          {formData.excludeLocations.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {formData.excludeLocations.map((location) => (
                                <Badge
                                  key={location}
                                  variant="secondary"
                                  className="bg-red-100 text-red-800 border-red-200 flex items-center space-x-1"
                                >
                                  <span>{location}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveExcludeLocation(location)}
                                    className="ml-1 hover:text-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="include-willing"
                            checked={formData.includeWillingToRelocate}
                            onCheckedChange={(checked) =>
                              setFormData(prev => ({ ...prev, includeWillingToRelocate: checked === true }))
                            }
                          />
                          <div className="space-y-1">
                            <Label htmlFor="include-willing" className="text-sm text-slate-600">
                              Include candidates willing to relocate to the included locations
                            </Label>
                            <p className="text-xs text-slate-500">
                              When enabled, candidates who marked themselves as willing to relocate will also be included.
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500">
                          Leave the include list empty to allow candidates from any location. Excluded locations are always applied.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Benefits */}
                <Card className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(16,185,129,0.06)]">
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
                <Card className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(16,185,129,0.06)]">
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
                        placeholder="e.g., IIT Bombay, KAUST"
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
                        placeholder="e.g., Emirates, Aramco"
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
                <Card className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(16,185,129,0.06)]">
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
                onClick={() => router.push('/gulf-dashboard')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-[0_8px_30px_rgba(16,185,129,0.3)]"
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
    </PermissionGuard>
  </GulfEmployerAuthGuard>
</EmployerAuthGuard>
)
}
