"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Search,
  Filter,
  Edit,
  Copy,
  Trash2,
  BookOpen,
  Users,
  User,
  Star,
  Clock,
  Globe,
  Lock,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { GulfEmployerNavbar } from "@/components/gulf-employer-navbar"
import { EmployerFooter } from "@/components/employer-footer"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"
import { GulfEmployerAuthGuard } from "@/components/gulf-employer-auth-guard"
import DepartmentDropdown from "@/components/ui/department-dropdown"
import IndustryDropdown from "@/components/ui/industry-dropdown"
import RoleCategoryDropdown from "@/components/ui/role-category-dropdown"
import { apiService } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"

interface JobTemplate {
  id: string
  name: string
  description: string
  category: string
  isPublic: boolean
  usageCount: number
  lastUsedAt?: string
  tags: string[]
  templateData: any
  createdBy: string
  createdAt?: string
  updatedAt?: string
}

export default function GulfJobTemplatesPage() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<JobTemplate[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<JobTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)

  const isGulfTemplate = (template: JobTemplate) => {
    const regionCandidates = [
      (template as any)?.templateData?.region,
      (template as any)?.templateData?.jobRegion,
      (template as any)?.templateData?.metadata?.region,
      (template as any)?.templateData?.metadata?.jobRegion,
    ]
      .filter(Boolean)
      .map((value: any) => String(value).toLowerCase())

    if (regionCandidates.length === 0) {
      // If region is not specified, default to showing template so employers can migrate it
      return true
    }

    return regionCandidates.includes("gulf")
  }

  const normalizeTemplatePayload = (template: any) => {
    const normalizedTemplate = {
      ...template,
      tags: Array.from(new Set([...(template.tags || []), "gulf", "gulf-region"])),
      templateData: {
        ...template.templateData,
        region: template.templateData?.region || "gulf",
        jobRegion: template.templateData?.jobRegion || "gulf",
        metadata: {
          ...(template.templateData?.metadata || {}),
          region: "gulf",
          jobRegion: "gulf",
        },
      },
    }

    return normalizedTemplate
  }

  useEffect(() => {
    if (user) {
      fetchTemplates()
    }
  }, [user])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await apiService.getJobTemplates({
        category: selectedCategory === "all" ? undefined : selectedCategory,
        search: searchQuery || undefined,
      })

      if (response.success) {
        const rawTemplates = Array.isArray(response.data)
          ? response.data
          : Array.isArray((response as any)?.data)
          ? (response as any).data
          : []

        const gulfTemplates = rawTemplates.filter(isGulfTemplate)
        setTemplates(gulfTemplates)
      } else {
        toast.error("Failed to fetch templates")
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
      toast.error("Failed to fetch templates")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchTemplates()
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    fetchTemplates()
  }

  const handleCreateTemplate = async (formData: any) => {
    try {
      setCreating(true)
      const payload = normalizeTemplatePayload(formData)
      const response = await apiService.createJobTemplate(payload)

      if (response.success) {
        toast.success("Template created successfully")
        setIsCreateDialogOpen(false)
        fetchTemplates()
      } else {
        toast.error(response.message || "Failed to create template")
      }
    } catch (error) {
      console.error("Error creating template:", error)
      toast.error("Failed to create template")
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateTemplate = async (id: string, formData: any) => {
    try {
      setUpdating(true)
      const payload = normalizeTemplatePayload(formData)
      const response = await apiService.updateJobTemplate(id, payload)

      if (response.success) {
        toast.success("Template updated successfully")
        setIsEditDialogOpen(false)
        setEditingTemplate(null)
        fetchTemplates()
      } else {
        toast.error(response.message || "Failed to update template")
      }
    } catch (error) {
      console.error("Error updating template:", error)
      toast.error("Failed to update template")
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return

    try {
      const response = await apiService.deleteJobTemplate(id)

      if (response.success) {
        toast.success("Template deleted successfully")
        fetchTemplates()
      } else {
        toast.error(response.message || "Failed to delete template")
      }
    } catch (error) {
      console.error("Error deleting template:", error)
      toast.error("Failed to delete template")
    }
  }

  const handleTogglePublic = async (id: string) => {
    try {
      const response = await apiService.toggleTemplatePublic(id)

      if (response.success) {
        toast.success(response.message || "Template visibility updated")
        fetchTemplates()
      } else {
        toast.error(response.message || "Failed to update template visibility")
      }
    } catch (error) {
      console.error("Error toggling template visibility:", error)
      toast.error("Failed to update template visibility")
    }
  }

  const handleUseTemplate = async (id: string) => {
    try {
      const response = await apiService.useJobTemplate(id)

      if (response.success) {
        toast.success("Template usage recorded")
        fetchTemplates()
      } else {
        toast.error(response.message || "Failed to record template usage")
      }
    } catch (error) {
      console.error("Error recording template usage:", error)
      toast.error("Failed to record template usage")
    }
  }

  const handleCreateJobFromTemplate = async (templateId: string) => {
    try {
      const response = await apiService.createJobFromTemplate(templateId)
      if (response.success && response.data?.prefill) {
        const tmpl = templates.find((t) => t.id === templateId)
        const templateName = encodeURIComponent(tmpl?.name || "Template")
        const templateData = encodeURIComponent(JSON.stringify(response.data.prefill))
        toast.success("Template applied. Prefilling job form...")
        window.location.href = `/gulf-dashboard/post-job?template=${templateId}&templateName=${templateName}&templateData=${templateData}`
      } else {
        toast.error(response.message || "Failed to load template for job creation")
      }
    } catch (error) {
      console.error("Error creating job from template:", error)
      toast.error("Failed to create job from template")
    }
  }

  const handleEditTemplate = (template: JobTemplate) => {
    setEditingTemplate(template)
    setIsEditDialogOpen(true)
  }

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "technical":
        return <BookOpen className="w-4 h-4" />
      case "non-technical":
        return <Users className="w-4 h-4" />
      case "management":
        return <Star className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "technical":
        return "bg-blue-100 text-blue-800"
      case "non-technical":
        return "bg-green-100 text-green-800"
      case "management":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const renderLoadingState = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-teal-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-hidden">
            <GulfEmployerNavbar />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/45 via-teal-200/35 to-amber-200/45"></div>
        <div className="absolute top-20 left-16 w-44 h-44 bg-gradient-to-br from-emerald-300/15 to-teal-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-24 right-12 w-40 h-40 bg-gradient-to-br from-amber-300/15 to-emerald-200/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 bg-gradient-to-br from-teal-300/10 to-emerald-200/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-4 text-slate-600">Loading templates...</p>
              </div>
            </div>
            <EmployerFooter />
          </div>
  )

  if (loading) {
    return (
      <EmployerAuthGuard>
        <GulfEmployerAuthGuard>{renderLoadingState()}</GulfEmployerAuthGuard>
      </EmployerAuthGuard>
    )
  }

  return (
    <EmployerAuthGuard>
      <GulfEmployerAuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-teal-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-hidden">
          <GulfEmployerNavbar />

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/45 via-teal-200/35 to-amber-200/45"></div>
            <div className="absolute top-20 left-16 w-44 h-44 bg-gradient-to-br from-emerald-300/15 to-teal-300/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-24 right-12 w-40 h-40 bg-gradient-to-br from-amber-300/15 to-emerald-200/10 rounded-full blur-3xl animate-pulse delay-500"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 bg-gradient-to-br from-teal-300/10 to-emerald-200/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Gulf Job Templates</h1>
                <p className="text-slate-600">Create and manage reusable Gulf job posting templates</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
                    <DialogDescription>Create a reusable template for job postings</DialogDescription>
              </DialogHeader>
              <CreateTemplateForm onSubmit={handleCreateTemplate} loading={creating} />
            </DialogContent>
          </Dialog>
        </div>

            <Card className="mb-6 rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(16,185,129,0.12)] hover:shadow-[0_18px_60px_rgba(20,184,166,0.2)]">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Search Templates</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Category</Label>
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="non-technical">Non-Technical</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full" onClick={handleSearch}>
                  <Filter className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(16,185,129,0.12)] hover:shadow-[0_18px_60px_rgba(20,184,166,0.2)] transition-all duration-300"
                >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(template.category)}
                        <Badge className={getCategoryColor(template.category)}>{template.category}</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    {template.createdBy === user?.id ? (
                          <Badge variant="outline" className="text-xs flex items-center bg-emerald-50 text-emerald-700 border-emerald-200">
                        <User className="w-3 h-3 mr-1" />
                        My Template
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs flex items-center bg-gray-50 text-gray-600 border-gray-200">
                        <Users className="w-3 h-3 mr-1" />
                        Shared
                      </Badge>
                    )}
                    {template.isPublic ? (
                      <Badge variant="outline" className="text-xs flex items-center">
                        <Globe className="w-3 h-3 mr-1" />
                        Public
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs flex items-center">
                        <Lock className="w-3 h-3 mr-1" />
                        Private
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Used {template.usageCount} times</span>
                        <span>Last used: {template.lastUsedAt ? new Date(template.lastUsedAt).toLocaleDateString() : "Never"}</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                    ))}
                    {template.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.tags.length - 3} more
                          </Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                        <Button
                          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                          onClick={() => handleCreateJobFromTemplate(template.id)}
                        >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Job from Template
                    </Button>

                    <div className="flex items-center justify-between">
                      <div className="flex space-x-1">
                        {template.createdBy === user?.id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditTemplate(template)}
                                title="Edit Template"
                              >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUseTemplate(template.id)}
                              title="Copy Template"
                            >
                          <Copy className="w-4 h-4" />
                        </Button>
                        {template.createdBy === user?.id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTogglePublic(template.id)}
                                title={template.isPublic ? "Make Private" : "Make Public"}
                              >
                            {template.isPublic ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                      {template.createdBy === user?.id && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteTemplate(template.id)}
                              title="Delete Template"
                            >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && !loading && (
              <Card className="text-center py-12 rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(16,185,129,0.12)]">
            <CardContent>
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No templates found</h3>
                  <p className="text-slate-600 mb-4">
                    {searchQuery || selectedCategory !== "all"
                      ? "Try adjusting your search criteria"
                      : "Create your first job template to get started"}
                  </p>
                  {!searchQuery && selectedCategory === "all" && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>Update your job template</DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <EditTemplateForm 
              template={editingTemplate} 
              onSubmit={(data) => handleUpdateTemplate(editingTemplate.id, data)}
              loading={updating}
            />
          )}
        </DialogContent>
      </Dialog>

          <EmployerFooter />
        </div>
      </GulfEmployerAuthGuard>
    </EmployerAuthGuard>
  )
}

function CreateTemplateForm({ onSubmit, loading }: { onSubmit: (data: any) => void; loading: boolean }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "technical",
    isPublic: true,
    tags: ["gulf", "gulf-region"] as string[],
    templateData: {
      title: "",
      companyName: "",
      department: "",
      location: "",
      type: "",
      experience: "",
      salary: "",
      description: "",
      requirements: "",
      benefits: "",
      skills: [] as string[],
      role: "",
      industryType: "",
      roleCategory: "",
      education: [] as string[],
      employmentType: "",
      postingType: "company" as "company" | "consultancy",
      consultancyName: "",
      hiringCompanyName: "",
      hiringCompanyIndustry: "",
      hiringCompanyDescription: "",
      showHiringCompanyDetails: false,
      whyWorkWithUs: "",
      companyProfile: "",
      externalApplyUrl: "",
      keywords: [] as string[],
      region: "gulf",
      jobRegion: "gulf",
      metadata: {
        region: "gulf",
        jobRegion: "gulf",
      } as Record<string, any>,
    },
  })
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false)
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)
  const [showRoleCategoryDropdown, setShowRoleCategoryDropdown] = useState(false)
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [selectedRoleCategories, setSelectedRoleCategories] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")
  const [currentSkill, setCurrentSkill] = useState("")
  const [currentKeyword, setCurrentKeyword] = useState("")
  const [selectedEducation, setSelectedEducation] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.category) {
      toast.error("Please fill in all required fields")
      return
    }

    const requiredFields = ["title", "department", "location", "type", "experience", "description", "requirements"]
    const missingFields = requiredFields.filter((field) => !formData.templateData[field as keyof typeof formData.templateData])

    if (missingFields.length > 0) {
      toast.error(`Please fill in required job fields: ${missingFields.join(", ")}`)
      return
    }

    onSubmit(formData)
  }

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }))
      setCurrentTag("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  const handleAddSkill = () => {
    if (currentSkill.trim() && !formData.templateData.skills.includes(currentSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        templateData: {
          ...prev.templateData,
          skills: [...prev.templateData.skills, currentSkill.trim()],
        },
      }))
      setCurrentSkill("")
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        skills: prev.templateData.skills.filter((s: string) => s !== skill),
      },
    }))
  }

  const handleAddKeyword = () => {
    if (currentKeyword.trim() && !formData.templateData.keywords.includes(currentKeyword.trim())) {
      setFormData((prev) => ({
        ...prev,
        templateData: {
          ...prev.templateData,
          keywords: [...prev.templateData.keywords, currentKeyword.trim()],
        },
      }))
      setCurrentKeyword("")
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setFormData((prev) => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        keywords: prev.templateData.keywords.filter((k: string) => k !== keyword),
      },
    }))
  }

  const handleEducationChange = (education: string[]) => {
    setSelectedEducation(education)
    setFormData((prev) => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        education: education,
      },
    }))
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8 max-h-[80vh] overflow-y-auto">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Template Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Senior Software Engineer"
                required
              />
        </div>
          </div>

        <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this template is for..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="flex items-center">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-2 text-red-500 hover:text-red-700">
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPublic: checked as boolean }))}
            />
            <Label htmlFor="isPublic">Make this template public</Label>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Job Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.templateData.title}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    templateData: { ...prev.templateData, title: e.target.value },
                  }))
                }
                placeholder="e.g., Senior Software Engineer"
                required
              />
            </div>
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.templateData.companyName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    templateData: { ...prev.templateData, companyName: e.target.value },
                  }))
                }
                placeholder="Company name"
              />
            </div>
            <div>
              <Label htmlFor="department">Department *</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => setShowDepartmentDropdown(true)}
              >
                <span>{formData.templateData.department || "Select department"}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>

              {showDepartmentDropdown && (
                <DepartmentDropdown
                  selectedDepartments={formData.templateData.department ? [formData.templateData.department] : []}
                  onDepartmentChange={(departments: string[]) => {
                    if (departments.length > 0) {
                      setFormData((prev) => ({
                        ...prev,
                        templateData: { ...prev.templateData, department: departments[0] },
                      }))
                    }
                    setShowDepartmentDropdown(false)
                  }}
                  onClose={() => setShowDepartmentDropdown(false)}
                  hideSelectAllButtons={true}
                />
              )}
            </div>
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.templateData.location}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    templateData: { ...prev.templateData, location: e.target.value },
                  }))
                }
                placeholder="e.g., Dubai, UAE"
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Job Type *</Label>
              <Select
                value={formData.templateData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    templateData: { ...prev.templateData, type: value },
                  }))
                }
              >
            <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
            </SelectTrigger>
            <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
            </SelectContent>
          </Select>
        </div>
            <div>
              <Label htmlFor="experience">Experience Level *</Label>
              <Select
                value={formData.templateData.experience}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    templateData: { ...prev.templateData, experience: value },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience level">
                    {formData.templateData.experience === "fresher" && "Fresher (0-1 years)"}
                    {formData.templateData.experience === "junior" && "Junior (1-3 years)"}
                    {formData.templateData.experience === "mid" && "Mid-level (3-5 years)"}
                    {formData.templateData.experience === "senior" && "Senior (5+ years)"}
                    {!formData.templateData.experience && "Select experience level"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fresher">Fresher (0-1 years)</SelectItem>
                  <SelectItem value="junior">Junior (1-3 years)</SelectItem>
                  <SelectItem value="mid">Mid-level (3-5 years)</SelectItem>
                  <SelectItem value="senior">Senior (5+ years)</SelectItem>
                </SelectContent>
              </Select>
      </div>
      <div>
              <Label htmlFor="salary">Salary Range</Label>
              <Input
                id="salary"
                value={formData.templateData.salary}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    templateData: { ...prev.templateData, salary: e.target.value },
                  }))
                }
                placeholder="e.g., 25,000 - 35,000 AED"
              />
      </div>
      <div>
              <Label htmlFor="employmentType">Employment Type</Label>
              <Select
                value={formData.templateData.employmentType}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    templateData: { ...prev.templateData, employmentType: value },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full Time, Permanent">Full Time, Permanent</SelectItem>
                  <SelectItem value="Part Time, Permanent">Part Time, Permanent</SelectItem>
                  <SelectItem value="Full Time, Contract">Full Time, Contract</SelectItem>
                  <SelectItem value="Part Time, Contract">Part Time, Contract</SelectItem>
                  <SelectItem value="Freelance">Freelance</SelectItem>
                  <SelectItem value="Temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Job Description *</Label>
            <Textarea
              id="description"
              value={formData.templateData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  templateData: { ...prev.templateData, description: e.target.value },
                }))
              }
              placeholder="Describe the role and responsibilities..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="requirements">Requirements *</Label>
            <Textarea
              id="requirements"
              value={formData.templateData.requirements}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  templateData: { ...prev.templateData, requirements: e.target.value },
                }))
              }
              placeholder="List the required qualifications and skills..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="benefits">Benefits & Perks</Label>
            <Textarea
              id="benefits"
              value={formData.templateData.benefits}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  templateData: { ...prev.templateData, benefits: e.target.value },
                }))
              }
              placeholder="List the benefits and perks offered..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="whyWorkWithUs">Why Work With Us</Label>
            <Textarea
              id="whyWorkWithUs"
              value={formData.templateData.whyWorkWithUs}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  templateData: { ...prev.templateData, whyWorkWithUs: e.target.value },
                }))
              }
              placeholder="Describe why candidates should work with your company..."
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Skills & Keywords</h3>

          <div>
            <Label htmlFor="skills">Required Skills</Label>
        <div className="flex space-x-2 mb-2">
              <Input
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                placeholder="Add a skill..."
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
              />
              <Button type="button" variant="outline" onClick={handleAddSkill}>
                Add
              </Button>
        </div>
        <div className="flex flex-wrap gap-2">
              {formData.templateData.skills.map((skill: string, index: number) => (
            <Badge key={index} variant="outline" className="flex items-center">
                  {skill}
                  <button type="button" onClick={() => handleRemoveSkill(skill)} className="ml-2 text-red-500 hover:text-red-700">
                    ×
                  </button>
            </Badge>
          ))}
        </div>
      </div>

          <div>
            <Label htmlFor="keywords">Keywords</Label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={currentKeyword}
                onChange={(e) => setCurrentKeyword(e.target.value)}
                placeholder="Add a keyword..."
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddKeyword())}
              />
              <Button type="button" variant="outline" onClick={handleAddKeyword}>
                Add
              </Button>
      </div>
            <div className="flex flex-wrap gap-2">
              {formData.templateData.keywords.map((keyword: string, index: number) => (
                <Badge key={index} variant="outline" className="flex items-center">
                  {keyword}
                  <button type="button" onClick={() => handleRemoveKeyword(keyword)} className="ml-2 text-red-500 hover:text-red-700">
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={formData.templateData.role}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    templateData: { ...prev.templateData, role: e.target.value },
                  }))
                }
                placeholder="e.g., Software Developer"
              />
            </div>
            <div>
              <Label htmlFor="industryType">Industry Type</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => setShowIndustryDropdown(true)}
              >
                {selectedIndustries.length > 0
                  ? `${selectedIndustries.length} industry${selectedIndustries.length > 1 ? "ies" : ""} selected`
                  : "Select industry type"}
                <ChevronDown className="w-4 h-4" />
              </Button>

              {showIndustryDropdown && (
                <IndustryDropdown
                  selectedIndustries={selectedIndustries}
                  onIndustryChange={(industries) => {
                    setSelectedIndustries(industries)
                    setFormData((prev) => ({
                      ...prev,
                      templateData: { ...prev.templateData, industryType: industries.join(", ") },
                    }))
                  }}
                  onClose={() => setShowIndustryDropdown(false)}
                  hideSelectAllButtons={false}
                />
              )}
            </div>
            <div>
              <Label htmlFor="roleCategory">Role Category</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => setShowRoleCategoryDropdown(true)}
              >
                {selectedRoleCategories.length > 0
                  ? `${selectedRoleCategories.length} role${selectedRoleCategories.length > 1 ? "s" : ""} selected`
                  : "Select role category"}
                <ChevronDown className="w-4 h-4" />
              </Button>

              {showRoleCategoryDropdown && (
                <RoleCategoryDropdown
                  selectedRoles={selectedRoleCategories}
                  onRoleChange={(roles) => {
                    setSelectedRoleCategories(roles)
                    setFormData((prev) => ({
                      ...prev,
                      templateData: { ...prev.templateData, roleCategory: roles.join(", ") },
                    }))
                  }}
                  onClose={() => setShowRoleCategoryDropdown(false)}
                  hideSelectAllButtons={true}
                />
              )}
            </div>
            <div>
              <Label htmlFor="externalApplyUrl">External Apply URL</Label>
              <Input
                id="externalApplyUrl"
                value={formData.templateData.externalApplyUrl}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    templateData: { ...prev.templateData, externalApplyUrl: e.target.value },
                  }))
                }
                placeholder="https://company.com/apply"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="companyProfile">Company Profile</Label>
            <Textarea
              id="companyProfile"
              value={formData.templateData.companyProfile}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  templateData: { ...prev.templateData, companyProfile: e.target.value },
                }))
              }
              placeholder="Brief description of your company..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Template"}
          </Button>
      </div>
    </form>

      {showDepartmentDropdown && (
        <DepartmentDropdown
          selectedDepartments={formData.templateData.department ? [formData.templateData.department] : []}
          onDepartmentChange={(departments: string[]) => {
            if (departments.length > 0) {
              setFormData((prev) => ({
                ...prev,
                templateData: { ...prev.templateData, department: departments[0] },
              }))
            }
            setShowDepartmentDropdown(false)
          }}
          onClose={() => setShowDepartmentDropdown(false)}
          hideSelectAllButtons={true}
        />
      )}

      {showIndustryDropdown && (
        <IndustryDropdown
          selectedIndustries={selectedIndustries}
          onIndustryChange={(industries) => {
            setSelectedIndustries(industries)
            setFormData((prev) => ({
              ...prev,
              templateData: { ...prev.templateData, industryType: industries.join(", ") },
            }))
          }}
          onClose={() => setShowIndustryDropdown(false)}
          hideSelectAllButtons={false}
        />
      )}

      {showRoleCategoryDropdown && (
        <RoleCategoryDropdown
          selectedRoles={selectedRoleCategories}
          onRoleChange={(roles) => {
            setSelectedRoleCategories(roles)
            setFormData((prev) => ({
              ...prev,
              templateData: { ...prev.templateData, roleCategory: roles.join(", ") },
            }))
          }}
          onClose={() => setShowRoleCategoryDropdown(false)}
          hideSelectAllButtons={true}
        />
      )}
    </>
  )
}

function EditTemplateForm({
  template,
  onSubmit,
  loading,
}: {
  template: JobTemplate
  onSubmit: (data: any) => void
  loading: boolean
}) {
  const [formData, setFormData] = useState({
    name: template.name,
    description: template.description,
    category: template.category,
    isPublic: template.isPublic,
    tags: Array.from(new Set([...(template.tags || []), "gulf", "gulf-region"])),
    templateData: {
      title: template.templateData?.title || "",
      companyName: template.templateData?.companyName || "",
      department: template.templateData?.department || "",
      location: template.templateData?.location || "",
      type: template.templateData?.type || "",
      experience: template.templateData?.experience || "",
      salary: template.templateData?.salary || "",
      description: template.templateData?.description || "",
      requirements: template.templateData?.requirements || "",
      benefits: template.templateData?.benefits || "",
      skills: template.templateData?.skills || [],
      role: template.templateData?.role || "",
      industryType: template.templateData?.industryType || "",
      roleCategory: template.templateData?.roleCategory || "",
      education: template.templateData?.education || [],
      employmentType: template.templateData?.employmentType || "",
      postingType: template.templateData?.postingType || "company",
      consultancyName: template.templateData?.consultancyName || "",
      hiringCompanyName: template.templateData?.hiringCompanyName || "",
      hiringCompanyIndustry: template.templateData?.hiringCompanyIndustry || "",
      hiringCompanyDescription: template.templateData?.hiringCompanyDescription || "",
      showHiringCompanyDetails: template.templateData?.showHiringCompanyDetails || false,
      whyWorkWithUs: template.templateData?.whyWorkWithUs || "",
      companyProfile: template.templateData?.companyProfile || "",
      externalApplyUrl: template.templateData?.externalApplyUrl || "",
      keywords: template.templateData?.keywords || [],
      region: template.templateData?.region || "gulf",
      jobRegion: template.templateData?.jobRegion || "gulf",
      metadata: {
        ...(template.templateData?.metadata || {}),
        region: "gulf",
        jobRegion: "gulf",
      },
    },
  })
  const [currentTag, setCurrentTag] = useState("")
  const [currentSkill, setCurrentSkill] = useState("")
  const [currentKeyword, setCurrentKeyword] = useState("")
  const [selectedEducation, setSelectedEducation] = useState<string[]>(template.templateData?.education || [])
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false)
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)
  const [showRoleCategoryDropdown, setShowRoleCategoryDropdown] = useState(false)
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(
    template.templateData?.industryType ? template.templateData.industryType.split(", ") : []
  )
  const [selectedRoleCategories, setSelectedRoleCategories] = useState<string[]>(
    template.templateData?.roleCategory ? template.templateData.roleCategory.split(", ") : []
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.category) {
      toast.error("Please fill in all required fields")
      return
    }

    const requiredFields = ["title", "department", "location", "type", "experience", "description", "requirements"]
    const missingFields = requiredFields.filter((field) => !formData.templateData[field as keyof typeof formData.templateData])

    if (missingFields.length > 0) {
      toast.error(`Please fill in required job fields: ${missingFields.join(", ")}`)
      return
    }

    onSubmit(formData)
  }

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }))
      setCurrentTag("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  const handleAddSkill = () => {
    if (currentSkill.trim() && !formData.templateData.skills.includes(currentSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        templateData: {
          ...prev.templateData,
          skills: [...prev.templateData.skills, currentSkill.trim()],
        },
      }))
      setCurrentSkill("")
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        skills: prev.templateData.skills.filter((s: string) => s !== skill),
      },
    }))
  }

  const handleAddKeyword = () => {
    if (currentKeyword.trim() && !formData.templateData.keywords.includes(currentKeyword.trim())) {
      setFormData((prev) => ({
        ...prev,
        templateData: {
          ...prev.templateData,
          keywords: [...prev.templateData.keywords, currentKeyword.trim()],
        },
      }))
      setCurrentKeyword("")
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setFormData((prev) => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        keywords: prev.templateData.keywords.filter((k: string) => k !== keyword),
      },
    }))
  }

  const handleEducationChange = (education: string[]) => {
    setSelectedEducation(education)
    setFormData((prev) => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        education: education,
      },
    }))
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8 max-h-[80vh] overflow-y-auto">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Template Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Senior Software Engineer"
                required
              />
        </div>
          </div>

        <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this template is for..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="flex items-center">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-2 text-red-500 hover:text-red-700">
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPublic: checked as boolean }))}
            />
            <Label htmlFor="isPublic">Make this template public</Label>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Job Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.templateData.title}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    templateData: { ...prev.templateData, title: e.target.value },
                  }))
                }
                placeholder="e.g., Senior Software Engineer"
                required
              />
            </div>
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.templateData.companyName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    templateData: { ...prev.templateData, companyName: e.target.value },
                  }))
                }
                placeholder="Company name"
              />
            </div>
            <div>
              <Label htmlFor="department">Department *</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => setShowDepartmentDropdown(true)}
              >
                <span>{formData.templateData.department || "Select department"}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>

              {showDepartmentDropdown && (
                <DepartmentDropdown
                  selectedDepartments={formData.templateData.department ? [formData.templateData.department] : []}
                  onDepartmentChange={(departments: string[]) => {
                    if (departments.length > 0) {
                      setFormData((prev) => ({
                        ...prev,
                        templateData: { ...prev.templateData, department: departments[0] },
                      }))
                    }
                    setShowDepartmentDropdown(false)
                  }}
                  onClose={() => setShowDepartmentDropdown(false)}
                  hideSelectAllButtons={true}
                />
              )}
            </div>
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.templateData.location}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    templateData: { ...prev.templateData, location: e.target.value },
                  }))
                }
                placeholder="e.g., Dubai, UAE"
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Job Type *</Label>
              <Select
                value={formData.templateData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    templateData: { ...prev.templateData, type: value },
                  }))
                }
              >
            <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
            </SelectTrigger>
            <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
            </SelectContent>
          </Select>
        </div>
            <div>
              <Label htmlFor="experience">Experience Level *</Label>
              <Select
                value={formData.templateData.experience}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    templateData: { ...prev.templateData, experience: value },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience level">
                    {formData.templateData.experience === "fresher" && "Fresher (0-1 years)"}
                    {formData.templateData.experience === "junior" && "Junior (1-3 years)"}
                    {formData.templateData.experience === "mid" && "Mid-level (3-5 years)"}
                    {formData.templateData.experience === "senior" && "Senior (5+ years)"}
                    {!formData.templateData.experience && "Select experience level"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fresher">Fresher (0-1 years)</SelectItem>
                  <SelectItem value="junior">Junior (1-3 years)</SelectItem>
                  <SelectItem value="mid">Mid-level (3-5 years)</SelectItem>
                  <SelectItem value="senior">Senior (5+ years)</SelectItem>
                </SelectContent>
              </Select>
      </div>
      <div>
              <Label htmlFor="salary">Salary Range</Label>
              <Input
                id="salary"
                value={formData.templateData.salary}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    templateData: { ...prev.templateData, salary: e.target.value },
                  }))
                }
                placeholder="e.g., 25,000 - 35,000 AED"
              />
      </div>
      <div>
              <Label htmlFor="employmentType">Employment Type</Label>
              <Select
                value={formData.templateData.employmentType}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    templateData: { ...prev.templateData, employmentType: value },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full Time, Permanent">Full Time, Permanent</SelectItem>
                  <SelectItem value="Part Time, Permanent">Part Time, Permanent</SelectItem>
                  <SelectItem value="Full Time, Contract">Full Time, Contract</SelectItem>
                  <SelectItem value="Part Time, Contract">Part Time, Contract</SelectItem>
                  <SelectItem value="Freelance">Freelance</SelectItem>
                  <SelectItem value="Temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Job Description *</Label>
            <Textarea
              id="description"
              value={formData.templateData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  templateData: { ...prev.templateData, description: e.target.value },
                }))
              }
              placeholder="Describe the role and responsibilities..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="requirements">Requirements *</Label>
            <Textarea
              id="requirements"
              value={formData.templateData.requirements}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  templateData: { ...prev.templateData, requirements: e.target.value },
                }))
              }
              placeholder="List the required qualifications and skills..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="benefits">Benefits & Perks</Label>
            <Textarea
              id="benefits"
              value={formData.templateData.benefits}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  templateData: { ...prev.templateData, benefits: e.target.value },
                }))
              }
              placeholder="List the benefits and perks offered..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="whyWorkWithUs">Why Work With Us</Label>
            <Textarea
              id="whyWorkWithUs"
              value={formData.templateData.whyWorkWithUs}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  templateData: { ...prev.templateData, whyWorkWithUs: e.target.value },
                }))
              }
              placeholder="Describe why candidates should work with your company..."
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Skills & Keywords</h3>
          <div>
            <Label htmlFor="skills">Required Skills</Label>
        <div className="flex space-x-2 mb-2">
              <Input
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                placeholder="Add a skill..."
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
              />
              <Button type="button" variant="outline" onClick={handleAddSkill}>
                Add
              </Button>
        </div>
        <div className="flex flex-wrap gap-2">
              {formData.templateData.skills.map((skill: string, index: number) => (
            <Badge key={index} variant="outline" className="flex items-center">
                  {skill}
                  <button type="button" onClick={() => handleRemoveSkill(skill)} className="ml-2 text-red-500 hover:text-red-700">
                    ×
                  </button>
            </Badge>
          ))}
        </div>
      </div>

          <div>
            <Label htmlFor="keywords">Keywords</Label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={currentKeyword}
                onChange={(e) => setCurrentKeyword(e.target.value)}
                placeholder="Add a keyword..."
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddKeyword())}
              />
              <Button type="button" variant="outline" onClick={handleAddKeyword}>
                Add
              </Button>
      </div>
            <div className="flex flex-wrap gap-2">
              {formData.templateData.keywords.map((keyword: string, index: number) => (
                <Badge key={index} variant="outline" className="flex items-center">
                  {keyword}
                  <button type="button" onClick={() => handleRemoveKeyword(keyword)} className="ml-2 text-red-500 hover:text-red-700">
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={formData.templateData.role}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    templateData: { ...prev.templateData, role: e.target.value },
                  }))
                }
                placeholder="e.g., Software Developer"
              />
            </div>
            <div>
              <Label htmlFor="industryType">Industry Type</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => setShowIndustryDropdown(true)}
              >
                {selectedIndustries.length > 0
                  ? `${selectedIndustries.length} industry${selectedIndustries.length > 1 ? "ies" : ""} selected`
                  : "Select industry type"}
                <ChevronDown className="w-4 h-4" />
              </Button>

              {showIndustryDropdown && (
                <IndustryDropdown
                  selectedIndustries={selectedIndustries}
                  onIndustryChange={(industries) => {
                    setSelectedIndustries(industries)
                    setFormData((prev) => ({
                      ...prev,
                      templateData: { ...prev.templateData, industryType: industries.join(", ") },
                    }))
                  }}
                  onClose={() => setShowIndustryDropdown(false)}
                  hideSelectAllButtons={false}
                />
              )}
            </div>
            <div>
              <Label htmlFor="roleCategory">Role Category</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => setShowRoleCategoryDropdown(true)}
              >
                {selectedRoleCategories.length > 0
                  ? `${selectedRoleCategories.length} role${selectedRoleCategories.length > 1 ? "s" : ""} selected`
                  : "Select role category"}
                <ChevronDown className="w-4 h-4" />
              </Button>

              {showRoleCategoryDropdown && (
                <RoleCategoryDropdown
                  selectedRoles={selectedRoleCategories}
                  onRoleChange={(roles) => {
                    setSelectedRoleCategories(roles)
                    setFormData((prev) => ({
                      ...prev,
                      templateData: { ...prev.templateData, roleCategory: roles.join(", ") },
                    }))
                  }}
                  onClose={() => setShowRoleCategoryDropdown(false)}
                  hideSelectAllButtons={true}
                />
              )}
            </div>
            <div>
              <Label htmlFor="externalApplyUrl">External Apply URL</Label>
              <Input
                id="externalApplyUrl"
                value={formData.templateData.externalApplyUrl}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    templateData: { ...prev.templateData, externalApplyUrl: e.target.value },
                  }))
                }
                placeholder="https://company.com/apply"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="companyProfile">Company Profile</Label>
            <Textarea
              id="companyProfile"
              value={formData.templateData.companyProfile}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  templateData: { ...prev.templateData, companyProfile: e.target.value },
                }))
              }
              placeholder="Brief description of your company..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Template"}
          </Button>
      </div>
    </form>

      {showDepartmentDropdown && (
        <DepartmentDropdown
          selectedDepartments={formData.templateData.department ? [formData.templateData.department] : []}
          onDepartmentChange={(departments: string[]) => {
            if (departments.length > 0) {
              setFormData((prev) => ({
                ...prev,
                templateData: { ...prev.templateData, department: departments[0] },
              }))
            }
            setShowDepartmentDropdown(false)
          }}
          onClose={() => setShowDepartmentDropdown(false)}
          hideSelectAllButtons={true}
        />
      )}

      {showIndustryDropdown && (
        <IndustryDropdown
          selectedIndustries={selectedIndustries}
          onIndustryChange={(industries) => {
            setSelectedIndustries(industries)
            setFormData((prev) => ({
              ...prev,
              templateData: { ...prev.templateData, industryType: industries.join(", ") },
            }))
          }}
          onClose={() => setShowIndustryDropdown(false)}
          hideSelectAllButtons={false}
        />
      )}

      {showRoleCategoryDropdown && (
        <RoleCategoryDropdown
          selectedRoles={selectedRoleCategories}
          onRoleChange={(roles) => {
            setSelectedRoleCategories(roles)
            setFormData((prev) => ({
              ...prev,
              templateData: { ...prev.templateData, roleCategory: roles.join(", ") },
            }))
          }}
          onClose={() => setShowRoleCategoryDropdown(false)}
          hideSelectAllButtons={true}
        />
      )}
    </>
  )
}

