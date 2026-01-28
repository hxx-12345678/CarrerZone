"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, X, Plus } from "lucide-react"
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
import { EmployerDashboardFooter } from "@/components/employer-dashboard-footer"
import { useToast } from "@/hooks/use-toast"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"
import { apiService } from "@/lib/api"
import IndustryDropdown from "@/components/ui/industry-dropdown"
import DepartmentDropdown from "@/components/ui/department-dropdown"
import { ChevronDown } from "lucide-react"

export default function EditRequirementPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [currentSkill, setCurrentSkill] = useState("")
  const [currentIncludeSkill, setCurrentIncludeSkill] = useState("")
  const [currentExcludeSkill, setCurrentExcludeSkill] = useState("")
  const [currentIncludeLocation, setCurrentIncludeLocation] = useState("")
  const [currentExcludeLocation, setCurrentExcludeLocation] = useState("")
  const [currentBenefit, setCurrentBenefit] = useState("")
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false)

  const [requirement, setRequirement] = useState<any>(null)
  const [formData, setFormData] = useState<any>(null)

  const normalizeLocations = (value: any): string[] => {
    if (value === undefined || value === null) return []
    const list = Array.isArray(value) ? value : [value]
    const seen = new Set<string>()
    return list
      .map((loc) => (typeof loc === "string" ? loc.trim() : ""))
      .filter((loc) => {
        if (!loc) return false
        const key = loc.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
  }

  // Fetch requirement data from API
  useEffect(() => {
    const fetchRequirement = async () => {
      if (!params.id || typeof params.id !== 'string') {
        toast({
          title: "Error",
          description: "Invalid requirement ID",
          variant: "destructive",
        })
        router.push('/employer-dashboard/requirements')
        return
      }

      try {
        setFetching(true)
        const response = await apiService.getRequirement(params.id)
        
        if (response.success && response.data) {
          const req = response.data
          console.log('📥 Fetched requirement data:', {
            industry: req.industry,
            department: req.department,
            location: req.location,
            jobType: req.jobType,
            education: req.education,
            metadata: req.metadata
          })
          // Normalize data for form - include all fields from create page
          const normalized = {
            id: req.id,
            title: req.title || "",
            description: req.description || "",
            location: (req.location && req.location.trim() !== '') ? req.location.trim() : "",
            experience: req.experience || "",
            salary: req.salary || "",
            jobType: (() => {
              if (!req.jobType || req.jobType.trim() === '') return "Full-time";
              // Handle both "full-time" and "Full-time" formats
              const normalized = req.jobType.toLowerCase().replace(/\s+/g, '-');
              const capitalized = normalized.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join('-');
              // Ensure it matches one of the valid SelectItem values
              const validTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
              return validTypes.includes(capitalized) ? capitalized : "Full-time";
            })(),
            skills: Array.isArray(req.skills) ? req.skills : [],
            // IMPORTANT: Merge keySkills (Additional Skills) into includeSkills for display
            // Backend already merges them, but we need to show them in the UI
            includeSkills: (() => {
              const includeSkillsFromApi = Array.isArray((req as any).includeSkills) ? (req as any).includeSkills : [];
              const keySkillsFromApi = Array.isArray(req.keySkills) ? req.keySkills : [];
              // Merge keySkills into includeSkills (all additional skills should be in include skills)
              return [...new Set([...includeSkillsFromApi, ...keySkillsFromApi])].filter(Boolean);
            })(),
            excludeSkills: Array.isArray((req as any).excludeSkills) ? (req as any).excludeSkills : [],
            education: (req.education && req.education.trim() !== '') ? req.education.trim() : "",
            industry: (req.industry && req.industry.trim() !== '') ? req.industry.trim() : "",
            department: (req.department && req.department.trim() !== '') ? req.department.trim() : "",
            validTill: req.validTill ? new Date(req.validTill).toISOString().split('T')[0] : "",
            noticePeriod: req.noticePeriod || "",
            remoteWork: (() => {
              const rw = req.remoteWork || (req as any).location_type || "Hybrid";
              const normalized = typeof rw === 'string' ? rw.toLowerCase() : '';
              if (normalized === 'remote' || normalized === 'Remote') return 'Remote';
              if (normalized === 'on-site' || normalized === 'onsite' || normalized === 'On-site') return 'On-site';
              if (normalized === 'hybrid' || normalized === 'Hybrid') return 'Hybrid';
              return rw || "Hybrid";
            })(),
            travelRequired: (() => {
              const tr = req.travelRequired;
              if (tr === true) return "Frequently";
              if (tr === false) return "No";
              if (typeof tr === 'string') {
                // Normalize string values
                const lower = String(tr).toLowerCase();
                if (lower === 'no' || lower === 'false') return "No";
                if (lower === 'occasionally' || lower === 'sometimes') return "Occasionally";
                if (lower === 'frequently' || lower === 'yes' || lower === 'true') return "Frequently";
                return tr; // Return as-is if it's a valid string
              }
              return "No";
            })(),
            benefits: Array.isArray(req.benefits) ? req.benefits : [],
            keySkills: Array.isArray(req.keySkills) ? req.keySkills : [],
            candidateDesignations: Array.isArray(req.candidateDesignations) ? req.candidateDesignations : [],
            currentDesignation: (req as any).currentDesignation || "",
            candidateLocations: normalizeLocations((req as any).candidateLocations ?? (req as any).candidate_locations ?? req.candidateLocations ?? []),
            excludeLocations: normalizeLocations((req as any).excludeLocations ?? (req as any).exclude_locations ?? []),
            includeWillingToRelocate: (() => {
              const value = (req as any).includeWillingToRelocate ?? (req as any).include_willing_to_relocate ?? req.includeWillingToRelocate ?? false
              if (typeof value === "string") {
                return value.toLowerCase() === "true"
              }
              return Boolean(value)
            })(),
            workExperienceMin: (req.experienceMin !== undefined && req.experienceMin !== null) ? req.experienceMin.toString() : ((req as any).workExperienceMin !== undefined && (req as any).workExperienceMin !== null ? (req as any).workExperienceMin.toString() : ""),
            workExperienceMax: (req.experienceMax !== undefined && req.experienceMax !== null) ? req.experienceMax.toString() : ((req as any).workExperienceMax !== undefined && (req as any).workExperienceMax !== null ? (req as any).workExperienceMax.toString() : ""),
            currentSalaryMin: (req.currentSalaryMin !== undefined && req.currentSalaryMin !== null) ? req.currentSalaryMin.toString() : ((req.salaryMin !== undefined && req.salaryMin !== null) ? req.salaryMin.toString() : ""),
            currentSalaryMax: (req.currentSalaryMax !== undefined && req.currentSalaryMax !== null) ? req.currentSalaryMax.toString() : ((req.salaryMax !== undefined && req.salaryMax !== null) ? req.salaryMax.toString() : ""),
            currency: req.currency || "INR",
            includeNotMentioned: req.includeNotMentioned || false,
            // Additional fields from create page
            institute: (req as any).institute || "",
            resumeFreshness: (req as any).resumeFreshness ? new Date((req as any).resumeFreshness).toISOString().split('T')[0] : "",
            currentCompany: (req as any).currentCompany || "",
            lastActive: (req as any).lastActive !== undefined && (req as any).lastActive !== null ? (req as any).lastActive.toString() : "",
            diversityPreference: Array.isArray((req as any).diversityPreference) ? (req as any).diversityPreference : ((req as any).diversityPreference ? [(req as any).diversityPreference] : []),
          }
          console.log('📝 Normalized form data:', {
            industry: normalized.industry,
            department: normalized.department,
            location: normalized.location
          })
          setRequirement(normalized)
          setFormData(normalized)
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to fetch requirement",
            variant: "destructive",
          })
          router.push('/employer-dashboard/requirements')
        }
      } catch (error: any) {
        console.error('Error fetching requirement:', error)
        toast({
          title: "Error",
          description: error.message || "Failed to fetch requirement",
          variant: "destructive",
        })
        router.push('/employer-dashboard/requirements')
      } finally {
        setFetching(false)
      }
    }

    fetchRequirement()
  }, [params.id, router, toast])

  const handleInputChange = (field: string, value: string | string[] | boolean) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSkillChange = (skill: string, action: 'add' | 'remove') => {
    if (action === 'add' && !formData.skills.includes(skill)) {
      setFormData((prev: any) => ({
        ...prev,
        skills: [...prev.skills, skill]
      }))
    } else if (action === 'remove') {
      setFormData((prev: any) => ({
        ...prev,
        skills: prev.skills.filter((s: string) => s !== skill)
      }))
    }
  }

  const handleBenefitChange = (benefit: string, action: 'add' | 'remove') => {
    if (action === 'add' && !formData.benefits.includes(benefit)) {
      setFormData((prev: any) => ({
        ...prev,
        benefits: [...prev.benefits, benefit]
      }))
    } else if (action === 'remove') {
      setFormData((prev: any) => ({
        ...prev,
        benefits: prev.benefits.filter((b: string) => b !== benefit)
      }))
    }
  }

  const handleAddSkill = () => {
    if (currentSkill.trim() && !formData.keySkills.includes(currentSkill.trim())) {
      const skillToAdd = currentSkill.trim();
      setFormData((prev: any) => ({
        ...prev,
        keySkills: [...prev.keySkills, skillToAdd],
        // IMPORTANT: Automatically add to includeSkills (all additional skills should be included)
        includeSkills: [...new Set([...prev.includeSkills, skillToAdd])]
      }))
      setCurrentSkill("")
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev: any) => ({
      ...prev,
      keySkills: prev.keySkills.filter((s: string) => s !== skill)
      // Note: We don't remove from includeSkills automatically - user might have added it separately
    }))
  }

  const handleAddIncludeSkill = () => {
    if (currentIncludeSkill.trim() && formData && !formData.includeSkills?.includes(currentIncludeSkill.trim())) {
      setFormData((prev: any) => ({
        ...prev,
        includeSkills: [...(prev.includeSkills || []), currentIncludeSkill.trim()]
      }))
      setCurrentIncludeSkill("")
    }
  }

  const handleRemoveIncludeSkill = (skill: string) => {
    setFormData((prev: any) => ({
      ...prev,
      includeSkills: (prev.includeSkills || []).filter((s: string) => s !== skill)
    }))
  }

  const handleAddExcludeSkill = () => {
    if (currentExcludeSkill.trim() && formData && !formData.excludeSkills?.includes(currentExcludeSkill.trim())) {
      setFormData((prev: any) => ({
        ...prev,
        excludeSkills: [...(prev.excludeSkills || []), currentExcludeSkill.trim()]
      }))
      setCurrentExcludeSkill("")
    }
  }

  const handleRemoveExcludeSkill = (skill: string) => {
    setFormData((prev: any) => ({
      ...prev,
      excludeSkills: (prev.excludeSkills || []).filter((s: string) => s !== skill)
    }))
  }

  const handleAddIncludeLocation = () => {
    const location = currentIncludeLocation.trim()
    if (!location) return
    setFormData((prev: any) => {
      if (!prev) return prev
      const updatedIncludes = normalizeLocations([...(prev.candidateLocations || []), location])
      const locationKey = location.toLowerCase()
      const updatedExcludes = (prev.excludeLocations || []).filter((loc: string) => loc?.toLowerCase() !== locationKey)
      return {
        ...prev,
        candidateLocations: updatedIncludes,
        excludeLocations: updatedExcludes
      }
    })
    setCurrentIncludeLocation("")
  }

  const handleRemoveIncludeLocation = (location: string) => {
    setFormData((prev: any) => ({
      ...prev,
      candidateLocations: (prev.candidateLocations || []).filter((loc: string) => loc?.toLowerCase() !== location.toLowerCase())
    }))
  }

  const handleAddExcludeLocation = () => {
    const location = currentExcludeLocation.trim()
    if (!location) return
    setFormData((prev: any) => {
      if (!prev) return prev
      const updatedExcludes = normalizeLocations([...(prev.excludeLocations || []), location])
      const locationKey = location.toLowerCase()
      const updatedIncludes = (prev.candidateLocations || []).filter((loc: string) => loc?.toLowerCase() !== locationKey)
      return {
        ...prev,
        excludeLocations: updatedExcludes,
        candidateLocations: updatedIncludes
      }
    })
    setCurrentExcludeLocation("")
  }

  const handleRemoveExcludeLocation = (location: string) => {
    setFormData((prev: any) => ({
      ...prev,
      excludeLocations: (prev.excludeLocations || []).filter((loc: string) => loc?.toLowerCase() !== location.toLowerCase())
    }))
  }

  const handleAddBenefit = () => {
    if (currentBenefit.trim() && !formData.benefits.includes(currentBenefit.trim())) {
      setFormData((prev: any) => ({
        ...prev,
        benefits: [...prev.benefits, currentBenefit.trim()]
      }))
      setCurrentBenefit("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData || !params.id || typeof params.id !== 'string') return
    
    setIsLoading(true)

    try {
      console.log('📤 Submitting update with formData:', {
        industry: formData.industry,
        department: formData.department,
        location: null,
        jobType: formData.jobType,
        education: formData.education
      })
      const includeLocations = normalizeLocations(formData.candidateLocations)
      const excludeLocations = normalizeLocations(formData.excludeLocations)

      // Prepare update data - include all fields
      const updateData = {
        title: formData.title,
        description: formData.description,
        location: null,
        jobType: formData.jobType,
        skills: formData.skills,
        keySkills: formData.keySkills,
        includeSkills: formData.includeSkills || [],
        excludeSkills: formData.excludeSkills || [],
        education: formData.education,
        industry: formData.industry,
        department: formData.department,
        validTill: formData.validTill || null,
        noticePeriod: formData.noticePeriod,
        remoteWork: formData.remoteWork,
        travelRequired: formData.travelRequired,
        benefits: formData.benefits,
        candidateDesignations: formData.candidateDesignations,
        currentDesignation: formData.currentDesignation || null,
        candidateLocations: includeLocations,
        excludeLocations: excludeLocations,
        includeWillingToRelocate: Boolean(formData.includeWillingToRelocate),
        workExperienceMin: formData.workExperienceMin ? Number(formData.workExperienceMin) : null,
        workExperienceMax: formData.workExperienceMax ? Number(formData.workExperienceMax) : null,
        currentSalaryMin: formData.currentSalaryMin ? Number(formData.currentSalaryMin) : null,
        currentSalaryMax: formData.currentSalaryMax ? Number(formData.currentSalaryMax) : null,
        currency: formData.currency,
        includeNotMentioned: formData.includeNotMentioned,
        institute: formData.institute || null,
        resumeFreshness: formData.resumeFreshness || null,
        currentCompany: formData.currentCompany || null,
        lastActive: formData.lastActive ? Number(formData.lastActive) : null,
        diversityPreference: formData.diversityPreference && formData.diversityPreference.length > 0 ? formData.diversityPreference : null,
      }

      const response = await apiService.updateRequirement(params.id, updateData)
      
      if (response.success) {
      toast({
        title: "Requirement Updated",
        description: "Your requirement has been updated successfully.",
      })
        // Reload the page data to show updated values
        const refreshResponse = await apiService.getRequirement(params.id)
        if (refreshResponse.success && refreshResponse.data) {
          const req = refreshResponse.data
          const normalized = {
            id: req.id,
            title: req.title || "",
            description: req.description || "",
            location: null,
            experience: req.experience || "",
            salary: req.salary || "",
            jobType: (() => {
              if (!req.jobType || req.jobType.trim() === '') return "Full-time";
              // Handle both "full-time" and "Full-time" formats
              const normalized = req.jobType.toLowerCase().replace(/\s+/g, '-');
              const capitalized = normalized.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join('-');
              // Ensure it matches one of the valid SelectItem values
              const validTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
              return validTypes.includes(capitalized) ? capitalized : "Full-time";
            })(),
            skills: Array.isArray(req.skills) ? req.skills : [],
            education: (req.education && req.education.trim() !== '') ? req.education.trim() : "",
            industry: (req.industry && req.industry.trim() !== '') ? req.industry.trim() : "",
            department: (req.department && req.department.trim() !== '') ? req.department.trim() : "",
            validTill: req.validTill ? new Date(req.validTill).toISOString().split('T')[0] : "",
            noticePeriod: req.noticePeriod || "",
            remoteWork: (() => {
              const rw = req.remoteWork || (req as any).location_type || "Hybrid";
              const normalized = typeof rw === 'string' ? rw.toLowerCase() : '';
              if (normalized === 'remote' || normalized === 'Remote') return 'Remote';
              if (normalized === 'on-site' || normalized === 'onsite' || normalized === 'On-site') return 'On-site';
              if (normalized === 'hybrid' || normalized === 'Hybrid') return 'Hybrid';
              return rw || "Hybrid";
            })(),
            travelRequired: req.travelRequired === true ? "Frequently" : req.travelRequired === false ? "No" : (typeof req.travelRequired === 'string' ? req.travelRequired : "No"),
            shiftTiming: req.shiftTiming === 'day' ? 'Day' : req.shiftTiming === 'night' ? 'Night' : req.shiftTiming === 'rotational' ? 'Rotational' : req.shiftTiming === 'flexible' ? 'Flexible' : (req.shiftTiming || "Day"),
            benefits: Array.isArray(req.benefits) ? req.benefits : [],
            keySkills: Array.isArray(req.keySkills) ? req.keySkills : [],
            candidateDesignations: Array.isArray(req.candidateDesignations) ? req.candidateDesignations : [],
            candidateLocations: normalizeLocations((req as any).candidateLocations ?? (req as any).candidate_locations ?? req.candidateLocations ?? []),
            excludeLocations: normalizeLocations((req as any).excludeLocations ?? (req as any).exclude_locations ?? []),
            includeWillingToRelocate: (() => {
              const value = (req as any).includeWillingToRelocate ?? (req as any).include_willing_to_relocate ?? req.includeWillingToRelocate ?? false
              if (typeof value === "string") {
                return value.toLowerCase() === "true"
              }
              return Boolean(value)
            })(),
            workExperienceMin: req.experienceMin?.toString() || "",
            workExperienceMax: req.experienceMax?.toString() || "",
            currentSalaryMin: req.salaryMin?.toString() || "",
            currentSalaryMax: req.salaryMax?.toString() || "",
            currency: req.currency || "INR",
            includeNotMentioned: req.includeNotMentioned || false,
            institute: (req as any).institute || "",
            resumeFreshness: (req as any).resumeFreshness ? new Date((req as any).resumeFreshness).toISOString().split('T')[0] : "",
            currentCompany: (req as any).currentCompany || "",
          }
          setFormData(normalized)
          setRequirement(normalized)
          console.log('✅ Form refreshed with updated data:', normalized)
        }
        // Redirect to candidates page to see updated results
        router.push(`/employer-dashboard/requirements/${params.id}/candidates`)
      } else {
        throw new Error(response.message || "Failed to update requirement")
      }
    } catch (error: any) {
      console.error('Error updating requirement:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update requirement. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const commonSkills = ["React", "Node.js", "JavaScript", "TypeScript", "Python", "Java", "C++", "MongoDB", "PostgreSQL", "AWS", "Docker", "Kubernetes"]
  const commonBenefits = ["Competitive salary", "Health insurance", "Flexible working hours", "Professional development", "Remote work", "Stock options", "Gym membership", "Free lunch"]

  if (fetching || !formData) {
  return (
    <EmployerAuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading requirement...</p>
          </div>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-16 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Edit Job Posting</h1>
              <p className="text-slate-600">Update your job posting details</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)]">
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
                      <Select 
                        value={formData.jobType && formData.jobType.trim() !== "" ? formData.jobType : "Full-time"} 
                        onValueChange={(value) => handleInputChange('jobType', value)}
                      >
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
                            value={formData.workExperienceMin || ""}
                            onChange={(e) => handleInputChange('workExperienceMin', e.target.value)}
                            placeholder="Min (e.g., 3)"
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={formData.workExperienceMax || ""}
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
                            value={formData.currentSalaryMin || ""}
                            onChange={(e) => handleInputChange('currentSalaryMin', e.target.value)}
                            placeholder="Min (e.g., 8)"
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.currentSalaryMax || ""}
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
              <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)]">
                <CardHeader>
                  <CardTitle>Required Skills</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Include Skills */}
                  <div>
                    <Label className="text-green-700 font-semibold">Include Skills (Must Have)</Label>
                    <p className="text-xs text-slate-500 mb-2">Candidates must have these skills</p>
                    <div className="flex flex-wrap gap-2 mt-2 mb-3">
                      {(formData.includeSkills || []).map((skill: string) => (
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
                      {(formData.excludeSkills || []).map((skill: string) => (
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

                  {/* Additional Skills - These are automatically included in Include Skills */}
                  <div>
                    <Label>Additional Skills</Label>
                    <p className="text-xs text-slate-500 mb-2">These skills are automatically included in "Include Skills" above</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.keySkills.map((skill: string) => (
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
                      {commonSkills.filter(skill => !formData.keySkills.includes(skill)).slice(0, 10).map((skill) => (
                        <Button
                          key={skill}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const skillToAdd = skill;
                            setFormData((prev: any) => ({
                              ...prev,
                              keySkills: [...prev.keySkills, skillToAdd],
                              // Automatically add to includeSkills
                              includeSkills: [...new Set([...prev.includeSkills, skillToAdd])]
                            }))
                          }}
                        >
                          + {skill}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location Preferences */}
              <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)]">
                <CardHeader>
                  <CardTitle>Location Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-slate-700 font-semibold">Include Locations</Label>
                    <p className="text-xs text-slate-500 mb-2">Candidates must be located in one of these cities/regions.</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(formData.candidateLocations || []).map((location: string) => (
                        <Badge key={location} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 flex items-center space-x-1">
                          <span>{location}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveIncludeLocation(location)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex space-x-2 mt-2">
                      <Input
                        placeholder="Add location to include"
                        value={currentIncludeLocation}
                        onChange={(e) => setCurrentIncludeLocation(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddIncludeLocation()
                          }
                        }}
                      />
                      <Button type="button" onClick={handleAddIncludeLocation} size="sm" variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-700 font-semibold">Exclude Locations</Label>
                    <p className="text-xs text-slate-500 mb-2">Candidates from these locations will be filtered out.</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(formData.excludeLocations || []).map((location: string) => (
                        <Badge key={location} variant="secondary" className="bg-red-100 text-red-800 border-red-200 flex items-center space-x-1">
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
                    <div className="flex space-x-2 mt-2">
                      <Input
                        placeholder="Add location to exclude"
                        value={currentExcludeLocation}
                        onChange={(e) => setCurrentExcludeLocation(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddExcludeLocation()
                          }
                        }}
                      />
                      <Button type="button" onClick={handleAddExcludeLocation} size="sm" variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="include-willing-to-relocate"
                      checked={formData.includeWillingToRelocate === true}
                      onCheckedChange={(checked) => setFormData((prev: any) => ({
                        ...prev,
                        includeWillingToRelocate: checked === true
                      }))}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="include-willing-to-relocate" className="text-slate-700">
                        Include candidates willing to relocate
                      </Label>
                      <p className="text-xs text-slate-500">
                        When enabled, candidates who marked themselves as willing to relocate will be included even if they are not currently in the included locations.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    Leave the include list empty to allow candidates from any location. Exclude locations are always respected.
                  </p>
                </CardContent>
              </Card>

              {/* Benefits */}
              <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)]">
                <CardHeader>
                  <CardTitle>Benefits & Perks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Selected Benefits</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.benefits.map((benefit: string) => (
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
              <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)]">
                <CardHeader>
                  <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="education">Education</Label>
                    <Select value={formData.education || ""} onValueChange={(value) => handleInputChange('education', value)}>
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
                      <span className={`${formData.industry ? "text-slate-900" : "text-slate-500"} truncate`}>
                        {formData.industry || "Select industry"}
                      </span>
                      <ChevronDown className="w-4 h-4 flex-shrink-0 ml-2" />
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
                      <span className={`${formData.department ? "text-slate-900" : "text-slate-500"} truncate`}>
                        {formData.department || "Select department"}
                      </span>
                      <ChevronDown className="w-4 h-4 flex-shrink-0 ml-2" />
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
                    <Select value={formData.noticePeriod || ""} onValueChange={(value) => handleInputChange('noticePeriod', value)}>
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
                      value={formData.institute || ""}
                      onChange={(e) => handleInputChange('institute', e.target.value)}
                      placeholder="e.g., IIT Bombay, IIM Ahmedabad"
                    />
                  </div>

                  <div>
                    <Label htmlFor="resumeFreshness">Resume Freshness / Last Updated Date</Label>
                    <Input
                      id="resumeFreshness"
                      type="date"
                      value={formData.resumeFreshness || ""}
                      onChange={(e) => handleInputChange('resumeFreshness', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="currentCompany">Current Company</Label>
                    <Input
                      id="currentCompany"
                      value={formData.currentCompany || ""}
                      onChange={(e) => handleInputChange('currentCompany', e.target.value)}
                      placeholder="e.g., Infosys, TCS"
                    />
                  </div>

                  <div>
                    <Label htmlFor="currentDesignation">Current Designation</Label>
                    <Input
                      id="currentDesignation"
                      value={formData.currentDesignation || ""}
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
                      value={formData.lastActive || ""}
                      onChange={(e) => handleInputChange('lastActive', e.target.value)}
                      placeholder="e.g., 30 (optional)"
                    />
                    <p className="text-xs text-slate-500 mt-1">Show candidates active within this many days</p>
                  </div>
                </CardContent>
              </Card>

              {/* Work Preferences */}
              <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)]">
                <CardHeader>
                  <CardTitle>Work Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="remoteWork">Remote Work</Label>
                    <Select value={formData.remoteWork || "Hybrid"} onValueChange={(value) => handleInputChange('remoteWork', value)}>
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
                    <Select value={formData.travelRequired || "No"} onValueChange={(value) => handleInputChange('travelRequired', value)}>
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
                          checked={(formData.diversityPreference || []).includes('all')}
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
                          checked={(formData.diversityPreference || []).includes('male')}
                          onCheckedChange={(checked) => {
                            const current = (formData.diversityPreference || []).filter((d: string) => d !== 'all')
                            if (checked) {
                              handleInputChange('diversityPreference', [...current, 'male'])
                            } else {
                              handleInputChange('diversityPreference', current.filter((d: string) => d !== 'male'))
                            }
                          }}
                        />
                        <Label htmlFor="diversity-male" className="font-normal cursor-pointer">Male</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="diversity-female"
                          checked={(formData.diversityPreference || []).includes('female')}
                          onCheckedChange={(checked) => {
                            const current = (formData.diversityPreference || []).filter((d: string) => d !== 'all')
                            if (checked) {
                              handleInputChange('diversityPreference', [...current, 'female'])
                            } else {
                              handleInputChange('diversityPreference', current.filter((d: string) => d !== 'female'))
                            }
                          }}
                        />
                        <Label htmlFor="diversity-female" className="font-normal cursor-pointer">Female</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="diversity-other"
                          checked={(formData.diversityPreference || []).includes('other')}
                          onCheckedChange={(checked) => {
                            const current = (formData.diversityPreference || []).filter((d: string) => d !== 'all')
                            if (checked) {
                              handleInputChange('diversityPreference', [...current, 'other'])
                            } else {
                              handleInputChange('diversityPreference', current.filter((d: string) => d !== 'other'))
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
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>

      <EmployerDashboardFooter />
    </div>
    </EmployerAuthGuard>
  )
} 
