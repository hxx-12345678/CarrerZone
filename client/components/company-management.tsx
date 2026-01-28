"use client"

import { useState, useEffect } from "react"
import { Building2, Edit, Save, X, Loader2, Globe, MapPin, Phone, Mail, Users, Calendar, ChevronDown, Briefcase, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { apiService } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"
import IndustryDropdown from "@/components/ui/industry-dropdown"
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown"

interface CompanyManagementProps {
  companyId: string
  onCompanyUpdated: () => void
}

export function CompanyManagement({ companyId, onCompanyUpdated }: CompanyManagementProps) {
  const [company, setCompany] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photos, setPhotos] = useState<any[]>([])
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)
  const [showNatureOfBusinessDropdown, setShowNatureOfBusinessDropdown] = useState(false)
  const [showCompanyTypesDropdown, setShowCompanyTypesDropdown] = useState(false)
  const auth = useAuth() as any

  const companySizes = [
    "1-50", "51-200", "201-500", "500-1000", "1000+"
  ]

  const natureOfBusinessOptions = [
    "SaaS (Software as a Service)",
    "PaaS (Platform as a Service)",
    "IaaS (Infrastructure as a Service)",
    "B2B (Business to Business)",
    "B2C (Business to Consumer)",
    "B2B2C (Business to Business to Consumer)",
    "D2C (Direct to Consumer)",
    "C2C (Consumer to Consumer)",
    "B2G (Business to Government)",
    "Enterprise Software",
    "Product-based",
    "Service-based",
    "Consulting",
    "Manufacturing",
    "E-commerce",
    "Fintech",
    "Healthcare",
    "EdTech",
    "AgriTech",
    "Other"
  ]

  const companyTypeOptions = [
    "Corporate",
    "Foreign MNC",
    "Indian MNC",
    "Startup",
    "Unicorn (₹1000+ Cr valuation)",
    "Govt/PSU",
    "MNC",
    "SME (Small & Medium Enterprise)",
    "Private Limited",
    "Public Limited",
    "Partnership Firm",
    "Sole Proprietorship",
    "Non-Profit / NGO",
    "Others"
  ]

  // Remove the old industries array - we'll use the custom dropdown

  useEffect(() => {
    loadCompanyData()
  }, [companyId])

  const loadCompanyData = async () => {
    try {
      setIsLoading(true)
      const response = await apiService.getCompany(companyId)
      if (response.success && response.data) {
        setCompany(response.data)
        setFormData(response.data)
        // fetch photos
        try {
          const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
          const res = await fetch(`${base}/companies/${companyId}/photos`)
          if (res.ok) {
            const data = await res.json()
            if (data?.success && Array.isArray(data.data)) setPhotos(data.data)
          }
        } catch {}
      } else {
        toast.error("Failed to load company data")
      }
    } catch (error: any) {
      console.error("Error loading company data:", error)
      toast.error("Failed to load company data")
    } finally {
      setIsLoading(false)
    }
  }
  const handlePhotoUpload = async (file: File) => {
    if (!file) return
    try {
      setUploadingPhoto(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      const form = new FormData()
      form.append('photo', file)
      form.append('altText', `${company?.name || 'Company'} photo`)
      form.append('isPrimary', photos.length === 0 ? 'true' : 'false')
      const res = await fetch(`${base}/companies/${companyId}/photos`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.success) {
        toast.success('Photo uploaded')
        setPhotos(prev => [data.data, ...prev])
      } else {
        toast.error(data?.message || 'Upload failed')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Upload failed')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handlePhotoDelete = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      const res = await fetch(`${base}/companies/photos/${photoId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.success) {
        toast.success('Photo deleted')
        setPhotos(prev => prev.filter(p => p.id !== photoId))
      } else {
        toast.error(data?.message || 'Delete failed')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed')
    }
  }

  const handleSetPlaceholder = async (photoId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      const res = await fetch(`${base}/companies/${companyId}/photos/${photoId}/set-placeholder`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.success) {
        toast.success('Placeholder image set successfully')
        // Update photos to reflect the new placeholder status
        setPhotos(prev => prev.map(p => ({
          ...p,
          isPlaceholder: p.id === photoId
        })))
      } else {
        toast.error(data?.message || 'Failed to set placeholder')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to set placeholder')
    }
  }

  const handleLogoUpload = async (file: File) => {
    if (!file) return
    try {
      setUploadingLogo(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      const form = new FormData()
      form.append('logo', file)
      const res = await fetch(`${base}/companies/${companyId}/logo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.success) {
        toast.success('Logo updated')
        setCompany((prev:any) => ({ ...(prev||{}), logo: data.data.logo }))
      } else {
        toast.error(data?.message || 'Logo upload failed')
      }
    } catch (e:any) {
      toast.error(e?.message || 'Logo upload failed')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleBannerUpload = async (file: File) => {
    if (!file) return
    try {
      setUploadingBanner(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      const form = new FormData()
      form.append('banner', file)
      const res = await fetch(`${base}/companies/${companyId}/banner`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.success) {
        toast.success('Banner updated')
        setCompany((prev:any) => ({ ...(prev||{}), banner: data.data.banner }))
      } else {
        toast.error(data?.message || 'Banner upload failed')
      }
    } catch (e:any) {
      toast.error(e?.message || 'Banner upload failed')
    } finally {
      setUploadingBanner(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await apiService.updateCompany(companyId, formData)
      if (response.success) {
        setCompany(response.data)
        setIsEditing(false)
        toast.success("Company updated successfully")
        onCompanyUpdated()
      } else {
        toast.error(response.message || "Failed to update company")
      }
    } catch (error: any) {
      console.error("Error updating company:", error)
      toast.error("Failed to update company")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(company)
    setIsEditing(false)
  }

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading company data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!company) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-slate-500">
            Company data not found
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Company Profile</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Manage your company information
              </p>
            </div>
          </div>
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isEditing ? (
          // Edit Form
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Company name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="industries">Industries</Label>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setShowIndustryDropdown(true)}
                >
                  <span>{formData.industries && formData.industries.length > 0 ? `${formData.industries.length} industr${formData.industries.length > 1 ? 'ies' : 'y'} selected` : "Select industries"}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
                
                {formData.industries && formData.industries.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.industries.map((industry: string, index: number) => (
                      <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                        {industry}
                        <button
                          type="button"
                          onClick={() => {
                            const newIndustries = formData.industries.filter((_: string, i: number) => i !== index)
                            handleInputChange("industries", newIndustries)
                          }}
                          className="ml-2 hover:text-blue-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                
                {showIndustryDropdown && (
                  <IndustryDropdown
                    selectedIndustries={formData.industries || []}
                    onIndustryChange={(industries: string[]) => {
                      handleInputChange("industries", industries)
                    }}
                    onClose={() => setShowIndustryDropdown(false)}
                  />
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size</Label>
                <Select value={formData.companySize || ""} onValueChange={(value) => handleInputChange("companySize", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    {companySizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size} employees
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website || ""}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://company.com"
                />
              </div>
            </div>

            {/* Company Photos */}
            <div className="space-y-2">
              <Label>Workplace Photos (Max 5)</Label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*,.jfif,.svg"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      if (photos.length >= 5) {
                        toast.error("Maximum 5 photos allowed")
                        return
                      }
                      handlePhotoUpload(file)
                    }
                  }}
                  disabled={uploadingPhoto || photos.length >= 5}
                />
                {uploadingPhoto && <span className="text-sm">Uploading...</span>}
                {photos.length >= 5 && <span className="text-sm text-orange-600">Maximum photos reached</span>}
              </div>
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {photos.map((p:any) => (
                    <div key={p.id} className="relative overflow-hidden rounded-lg border group">
                      <img 
                        src={p.fileUrl} 
                        alt={p.altText || 'Photo'} 
                        className="w-full h-24 object-cover"
                        onLoad={() => {
                          console.log('✅ Management image loaded:', p.fileUrl);
                        }}
                        onError={(e) => {
                          console.error('❌ Management image failed:', p.fileUrl);
                          console.log('🔍 Photo data:', p);
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSetPlaceholder(p.id)}
                            className="bg-blue-500 text-white rounded px-2 py-1 text-xs hover:bg-blue-600"
                            title="Set as placeholder image"
                          >
                            Set Placeholder
                          </button>
                          <button
                            onClick={() => handlePhotoDelete(p.id)}
                            className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                            title="Delete photo"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      {p.isPlaceholder && (
                        <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          Placeholder
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Company Logo */}
            <div className="space-y-2">
              <Label>Company Logo</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Recommended: 200x200px (square), Max 2MB. Formats: JPG, PNG, JFIF, SVG
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*,.jfif,.svg"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleLogoUpload(file)
                  }}
                  disabled={uploadingLogo}
                />
                {uploadingLogo && <span className="text-sm">Uploading...</span>}
              </div>
              {company?.logo && (
                <div className="mt-2 w-28 h-28 border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900/30">
                  <img src={company.logo} alt="Company logo" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Company Banner */}
            <div className="space-y-2">
              <Label>Company Banner/Placeholder Image</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Recommended: 1200x400px (3:1 ratio), Max 5MB. Formats: JPG, PNG, JFIF, SVG
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*,.jfif,.svg"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleBannerUpload(file)
                  }}
                  disabled={uploadingBanner}
                />
                {uploadingBanner && <span className="text-sm">Uploading...</span>}
              </div>
              {company?.banner && (
                <div className="mt-2 w-full h-32 border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900/30">
                  <img src={company.banner} alt="Company banner" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            
            <Separator className="my-6" />
            
            {/* About Company Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                About Company
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="about">Company Description</Label>
                <Textarea
                  id="about"
                  value={formData.about || formData.description || ""}
                  onChange={(e) => handleInputChange("about", e.target.value)}
                  placeholder="Tell candidates about your company, culture, and values..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whyJoinUs">Why Join Us</Label>
                <Textarea
                  id="whyJoinUs"
                  value={formData.whyJoinUs || ""}
                  onChange={(e) => handleInputChange("whyJoinUs", e.target.value)}
                  placeholder="Tell jobseekers why they should join your company"
                  rows={4}
                />
              </div>

              {/* Nature of Business - Multi-select */}
              <div className="space-y-2">
                <Label>Nature of Business (Multiple Selection)</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setShowNatureOfBusinessDropdown(true)}
                >
                  <span className="text-left flex-1 truncate">
                    {formData.natureOfBusiness && formData.natureOfBusiness.length > 0
                      ? `${formData.natureOfBusiness.length} selected`
                      : "Select nature of business"}
                  </span>
                  <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                </Button>
                
                {/* Display selected values */}
                {formData.natureOfBusiness && formData.natureOfBusiness.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.natureOfBusiness.map((item: string) => (
                      <Badge key={item} variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                        {item}
                      </Badge>
                    ))}
                  </div>
                )}

                {showNatureOfBusinessDropdown && (
                  <MultiSelectDropdown
                    title="Select Nature of Business"
                    options={natureOfBusinessOptions}
                    selectedValues={formData.natureOfBusiness || []}
                    onChange={(values) => {
                      handleInputChange("natureOfBusiness", values)
                    }}
                    onClose={() => setShowNatureOfBusinessDropdown(false)}
                  />
                )}
              </div>

              {/* Company Type - Multi-select */}
              <div className="space-y-2">
                <Label>Company Type (Multiple Selection)</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setShowCompanyTypesDropdown(true)}
                >
                  <span className="text-left flex-1 truncate">
                    {formData.companyTypes && formData.companyTypes.length > 0
                      ? `${formData.companyTypes.length} selected`
                      : "Select company type(s)"}
                  </span>
                  <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                </Button>
                
                {/* Display selected values */}
                {formData.companyTypes && formData.companyTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.companyTypes.map((type: string) => (
                      <Badge key={type} variant="secondary" className="text-xs bg-purple-100 text-purple-800 border-purple-200">
                        {type}
                      </Badge>
                    ))}
                  </div>
                )}

                {showCompanyTypesDropdown && (
                  <MultiSelectDropdown
                    title="Select Company Type(s)"
                    options={companyTypeOptions}
                    selectedValues={formData.companyTypes || []}
                    onChange={(values) => {
                      handleInputChange("companyTypes", values)
                    }}
                    onClose={() => setShowCompanyTypesDropdown(false)}
                  />
                )}
              </div>
            </div>

            <Separator className="my-6" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Company Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Company Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="contact@company.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Company Address</Label>
              <Textarea
                id="address"
                value={formData.address || ""}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Full company address"
                rows={2}
              />
            </div>
            
            <div className="flex space-x-3">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          // Display View
          <div className="space-y-6">
            {/* Company Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Building2 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="text-sm text-slate-600 dark:text-slate-300">Company</div>
                <div className="font-semibold text-slate-900 dark:text-white">{company.name}</div>
              </div>
              
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Users className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="text-sm text-slate-600 dark:text-slate-300">Size</div>
                <div className="font-semibold text-slate-900 dark:text-white">{company.companySize || 'N/A'}</div>
              </div>
              
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Globe className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <div className="text-sm text-slate-600 dark:text-slate-300">Industries</div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  {company.industries && company.industries.length > 0 ? company.industries.join(', ') : 'N/A'}
                </div>
              </div>
              
            </div>

            <Separator />

            {/* Company Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Company Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-slate-500">Company Name</Label>
                    <p className="font-medium">{company.name}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-slate-500">Industries</Label>
                    <p className="font-medium">
                      {company.industries && company.industries.length > 0 ? company.industries.join(', ') : 'Not specified'}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-slate-500">Company Size</Label>
                    <p className="font-medium">{company.companySize || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-slate-500">About</Label>
                    <p className="text-slate-700 dark:text-slate-300">
                      {company.about || company.description || 'No description provided'}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-slate-500">Why Join Us</Label>
                    <p className="text-slate-700 dark:text-slate-300">
                      {company.whyJoinUs || 'No information provided'}
                    </p>
                  </div>

                  {/* Nature of Business Display */}
                  <div>
                    <Label className="text-sm text-slate-500">Nature of Business</Label>
                    {company.natureOfBusiness && company.natureOfBusiness.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {company.natureOfBusiness.map((item: string) => (
                          <Badge key={item} variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-700 dark:text-slate-300">Not specified</p>
                    )}
                  </div>

                  {/* Company Types Display */}
                  <div>
                    <Label className="text-sm text-slate-500">Company Type</Label>
                    {company.companyTypes && company.companyTypes.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {company.companyTypes.map((type: string) => (
                          <Badge key={type} variant="secondary" className="text-xs bg-purple-100 text-purple-800 border-purple-200">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-700 dark:text-slate-300">Not specified</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <div>
                      <Label className="text-sm text-slate-500">Website</Label>
                      <p className="font-medium">
                        {company.website ? (
                          <a href={company.website} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-600 hover:underline">
                            {company.website}
                          </a>
                        ) : 'Not specified'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <div>
                      <Label className="text-sm text-slate-500">Phone</Label>
                      <p className="font-medium">{company.phone || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <div>
                      <Label className="text-sm text-slate-500">Email</Label>
                      <p className="font-medium">{company.email || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <div>
                      <Label className="text-sm text-slate-500">Address</Label>
                      <p className="font-medium">{company.address || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Photos Display */}
            {photos.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Workplace Photos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((p: any) => (
                    <div key={p.id} className="relative overflow-hidden rounded-lg border group">
                      <img 
                        src={p.fileUrl} 
                        alt={p.altText || 'Photo'} 
                        className="w-full h-32 object-cover"
                        onLoad={() => {
                          console.log('✅ Display image loaded:', p.fileUrl);
                        }}
                        onError={(e) => {
                          console.error('❌ Display image failed:', p.fileUrl);
                          console.log('🔍 Photo data:', p);
                        }}
                      />
                      <button
                        onClick={() => handlePhotoDelete(p.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        title="Delete photo"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Company Logo Display */}
            {company?.logo && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Company Logo</h3>
                <div className="w-32 h-32 border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900/30">
                  <img 
                    src={company.logo} 
                    alt="Company logo" 
                    className="w-full h-full object-cover"
                    onLoad={() => {
                      console.log('✅ Logo loaded:', company.logo);
                    }}
                    onError={(e) => {
                      console.error('❌ Logo failed:', company.logo);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Company Banner Display */}
            {company?.banner && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Company Banner</h3>
                <div className="w-full h-48 border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900/30">
                  <img 
                    src={company.banner} 
                    alt="Company banner" 
                    className="w-full h-full object-cover"
                    onLoad={() => {
                      console.log('✅ Banner loaded:', company.banner);
                    }}
                    onError={(e) => {
                      console.error('❌ Banner failed:', company.banner);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
