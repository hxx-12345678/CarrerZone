"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Building2, Upload, Calendar, Shield, FileText, CheckCircle, Search, Plus, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { apiService } from '@/lib/api'
import { EmployerAuthGuard } from '@/components/employer-auth-guard'
import { EmployerNavbar } from '@/components/employer-navbar'

export default function AddClientPage() {
  return (
    <EmployerAuthGuard>
      <AddClientContent />
    </EmployerAuthGuard>
  )
}

function AddClientContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'select' | 'search' | 'new'>('select') // select, search, or new
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedExistingCompany, setSelectedExistingCompany] = useState<any>(null)
  const [step, setStep] = useState(1) // 1: Company Details, 2: Documents, 3: Contract
  
  // Search for existing companies
  const handleCompanySearch = async (term: string) => {
    setSearchTerm(term)
    
    if (term.length < 2) {
      setSearchResults([])
      return
    }
    
    setSearching(true)
    try {
      const response = await apiService.searchCompanies(term)
      if (response.success) {
        setSearchResults(response.data || [])
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Failed to search companies')
    } finally {
      setSearching(false)
    }
  }
  
  // Select an existing company
  const handleSelectExistingCompany = (company: any) => {
    setSelectedExistingCompany(company)
    setFormData(prev => ({
      ...prev,
      clientCompanyId: company.id,
      clientCompanyName: company.name,
      clientIndustry: company.industry || '',
      clientLocation: company.city || '',
      clientWebsite: company.website || ''
    }))
    setMode('new') // Go to document upload flow
    toast.success(`Selected: ${company.name}`)
  }
  
  // Download authorization letter template
  const downloadAuthorizationTemplate = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/agency/authorization-template`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Authorization_Letter_Template.txt';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Template downloaded successfully');
      } else {
        toast.error('Failed to download template');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download template');
    }
  };
  
  const [formData, setFormData] = useState({
    clientCompanyId: '', // For existing company selection
    clientCompanyName: '',
    clientIndustry: '',
    clientLocation: '',
    clientWebsite: '',
    contractStartDate: '',
    contractEndDate: '',
    autoRenew: false,
    maxActiveJobs: '',
    clientContactEmail: '',
    clientContactPhone: '',
    clientContactName: ''
  })
  const [files, setFiles] = useState<{[key: string]: File | null}>({
    authorizationLetter: null,
    serviceAgreement: null,
    clientGst: null,
    clientPan: null
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (field: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF and image files are allowed')
        return
      }

      setFiles(prev => ({ ...prev, [field]: file }))
      toast.success(`${field} selected`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.clientCompanyName || !formData.clientIndustry) {
      toast.error('Please fill all required fields')
      return
    }

    if (!files.authorizationLetter) {
      toast.error('Authorization letter is required')
      return
    }

    if (!formData.clientContactEmail) {
      toast.error('Client contact email is required for verification')
      return
    }

    setLoading(true)

    try {
      const submitFormData = new FormData()
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          submitFormData.append(key, value.toString())
        }
      })

      // Add files
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          submitFormData.append(key, file)
        }
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agency/clients/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: submitFormData
      })

      const data = await response.json()

      if (data.success) {
        toast.success('✅ Client authorization request submitted!')
        toast.info('Client will receive a verification email. You will be notified once approved.')
        
        setTimeout(() => {
          router.push('/employer-dashboard/manage-clients')
        }, 2000)
      } else {
        toast.error(data.message || 'Failed to submit authorization request')
      }
    } catch (error: any) {
      console.error('Add client error:', error)
      toast.error('Failed to add client. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900">
      <EmployerNavbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            Add New Client
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Submit client authorization to start posting jobs for them
          </p>
        </div>

        {/* Mode Selection: Search or Create New */}
        {mode === 'select' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>How do you want to add your client?</CardTitle>
                <CardDescription>Choose whether to search for an existing company or create a new profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <button
                  type="button"
                  onClick={() => setMode('search')}
                  className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                      <Search className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Search Existing Company</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        If your client already has an account on our platform, search and request authorization
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('new')}
                  className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                      <Plus className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Create New Company Profile</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        If your client is not registered on our platform, create a new company profile for them
                      </p>
                    </div>
                  </div>
                </button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search Mode */}
        {mode === 'search' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Search Existing Companies</CardTitle>
                    <CardDescription>Find and select your client company</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setMode('select')}>
                    Back
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by company name, city, or industry..."
                    value={searchTerm}
                    onChange={(e) => handleCompanySearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {searching && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Searching...</p>
                  </div>
                )}

                {!searching && searchResults.length > 0 && (
                  <div className="space-y-3 mt-4">
                    {searchResults.map((company) => (
                      <div
                        key={company.id}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer"
                        onClick={() => handleSelectExistingCompany(company)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {company.logo ? (
                              <img src={company.logo} alt={company.name} className="w-12 h-12 rounded-lg object-cover" />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">{company.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {company.industry} • {company.city}
                              </p>
                              {company.verificationStatus === 'verified' && (
                                <Badge className="mt-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                  ✓ Verified Company
                                </Badge>
                              )}
                            </div>
                          </div>
                          {company.authorizationStatus && (
                            <Badge variant="outline">
                              {company.authorizationStatus === 'active' && '✅ Active'}
                              {company.authorizationStatus === 'pending_client_confirm' && '⏳ Pending'}
                              {company.authorizationStatus === 'expired' && '❌ Expired'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!searching && searchTerm.length >= 2 && searchResults.length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">No companies found</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setMode('new')}
                    >
                      Create New Company Profile Instead
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Progress Steps */}
        {mode === 'new' && (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {[
                  { num: 1, title: 'Company Details', icon: Building2 },
                  { num: 2, title: 'Documents', icon: FileText },
                  { num: 3, title: 'Contract & Contact', icon: Calendar }
                ].map((s, idx) => (
                  <div key={s.num} className="flex items-center flex-1">
                    <div className={`flex items-center gap-2 ${step >= s.num ? 'text-blue-600' : 'text-gray-400'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step >= s.num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                      </div>
                      <span className="font-medium text-sm hidden md:block">{s.title}</span>
                    </div>
                    {idx < 2 && (
                      <div className={`flex-1 h-1 mx-2 ${step > s.num ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>
                {step === 1 && 'Client Company Information'}
                {step === 2 && 'Upload Client Documents'}
                {step === 3 && 'Contract Details & Client Contact'}
              </CardTitle>
              <CardDescription>
                {step === 1 && 'Provide basic information about the client company'}
                {step === 2 && 'Upload required documents for verification'}
                {step === 3 && 'Set contract terms and provide client contact for verification'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Company Details */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientCompanyName">Company Name *</Label>
                    <Input
                      id="clientCompanyName"
                      value={formData.clientCompanyName}
                      onChange={(e) => handleInputChange('clientCompanyName', e.target.value)}
                      placeholder="e.g., Tech Corp Solutions Pvt Ltd"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientIndustry">Industry *</Label>
                      <Select 
                        value={formData.clientIndustry} 
                        onValueChange={(value) => handleInputChange('clientIndustry', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="consulting">Consulting</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientLocation">Location *</Label>
                      <Input
                        id="clientLocation"
                        value={formData.clientLocation}
                        onChange={(e) => handleInputChange('clientLocation', e.target.value)}
                        placeholder="e.g., Bangalore"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientWebsite">Website (Optional)</Label>
                    <Input
                      id="clientWebsite"
                      type="url"
                      value={formData.clientWebsite}
                      onChange={(e) => handleInputChange('clientWebsite', e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Documents */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <h4 className="font-medium text-amber-900 dark:text-amber-200 mb-2">📌 Required Documents</h4>
                    <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
                      <li>• Authorization letter on client's letterhead (MANDATORY)</li>
                      <li>• Client's GST certificate (for instant verification)</li>
                      <li>• Client's PAN card</li>
                      <li>• Service agreement (optional but recommended)</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-semibold flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-600" />
                        Authorization Letter * (MANDATORY)
                      </Label>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange('authorizationLetter', e)}
                        required
                      />
                      {files.authorizationLetter && (
                        <p className="text-sm text-green-600">✓ {files.authorizationLetter.name}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Signed letter from client authorizing you to post jobs on their behalf
                      </p>
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-blue-600"
                        onClick={downloadAuthorizationTemplate}
                      >
                        📄 Download Sample Authorization Template
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-semibold">Client's GST Certificate (Recommended)</Label>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange('clientGst', e)}
                      />
                      {files.clientGst && (
                        <p className="text-sm text-green-600">✓ {files.clientGst.name}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        For instant automated verification
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-semibold">Client's PAN Card</Label>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange('clientPan', e)}
                      />
                      {files.clientPan && (
                        <p className="text-sm text-green-600">✓ {files.clientPan.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="font-semibold">Service Agreement (Optional)</Label>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange('serviceAgreement', e)}
                      />
                      {files.serviceAgreement && (
                        <p className="text-sm text-green-600">✓ {files.serviceAgreement.name}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Contract agreement between you and the client
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Contract & Contact */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Contract Terms</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contractStartDate">Contract Start Date *</Label>
                        <Input
                          id="contractStartDate"
                          type="date"
                          value={formData.contractStartDate}
                          onChange={(e) => handleInputChange('contractStartDate', e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contractEndDate">Contract End Date *</Label>
                        <Input
                          id="contractEndDate"
                          type="date"
                          value={formData.contractEndDate}
                          onChange={(e) => handleInputChange('contractEndDate', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Label htmlFor="maxActiveJobs">Maximum Active Jobs (Optional)</Label>
                      <Input
                        id="maxActiveJobs"
                        type="number"
                        value={formData.maxActiveJobs}
                        onChange={(e) => handleInputChange('maxActiveJobs', e.target.value)}
                        placeholder="Leave blank for unlimited"
                      />
                      <p className="text-xs text-gray-500">
                        Limit the number of active job postings for this client
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <Checkbox
                        id="autoRenew"
                        checked={formData.autoRenew}
                        onCheckedChange={(checked) => handleInputChange('autoRenew', checked)}
                      />
                      <Label htmlFor="autoRenew" className="cursor-pointer">
                        Auto-renew contract
                      </Label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Client Contact for Verification</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      We'll send a verification email to this contact to confirm authorization
                    </p>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="clientContactName">Contact Person Name</Label>
                        <Input
                          id="clientContactName"
                          value={formData.clientContactName}
                          onChange={(e) => handleInputChange('clientContactName', e.target.value)}
                          placeholder="e.g., Rajesh Kumar"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="clientContactEmail">Contact Email * (CRITICAL)</Label>
                        <Input
                          id="clientContactEmail"
                          type="email"
                          value={formData.clientContactEmail}
                          onChange={(e) => handleInputChange('clientContactEmail', e.target.value)}
                          placeholder="hr@clientcompany.com"
                          required
                        />
                        <p className="text-xs text-amber-600">
                          ⚠️ Client will receive verification email at this address
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="clientContactPhone">Contact Phone</Label>
                        <Input
                          id="clientContactPhone"
                          type="tel"
                          value={formData.clientContactPhone}
                          onChange={(e) => handleInputChange('clientContactPhone', e.target.value)}
                          placeholder="+91-9876543210"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-4 border-t">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    disabled={loading}
                  >
                    Previous
                  </Button>
                )}
                
                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    className="flex-1"
                    disabled={
                      (step === 1 && (!formData.clientCompanyName || !formData.clientIndustry)) ||
                      (step === 2 && !files.authorizationLetter)
                    }
                  >
                    Continue →
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {loading ? (
                      <>
                        <Upload className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Submit Authorization Request
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

