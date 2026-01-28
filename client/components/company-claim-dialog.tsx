"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Building2, CheckCircle, AlertCircle, Plus } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Company {
  id: string
  name: string
  industry: string
  city: string
  createdAt: string
  createdByAgencyId?: string
}

interface CompanyClaimDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CompanyClaimDialog({ open, onOpenChange, onSuccess }: CompanyClaimDialogProps) {
  const router = useRouter()
  const [step, setStep] = useState<'search' | 'claim' | 'create'>('search')
  const [searchTerm, setSearchTerm] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    companySize: '1-50',
    website: '',
    userName: '',
    userEmail: '',
    userPhone: '',
    password: '',
    confirmPassword: '',
    region: 'india'
  })

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a company name to search')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/companies/claim/search?name=${encodeURIComponent(searchTerm)}`)
      const data = await response.json()

      if (data.success) {
        setCompanies(data.data)
        if (data.data.length === 0) {
          toast.info('No existing company found. You can create a new one.')
        }
      } else {
        toast.error(data.message || 'Search failed')
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Failed to search for companies')
    } finally {
      setLoading(false)
    }
  }

  const handleClaimCompany = async () => {
    if (!selectedCompany) return

    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/companies/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          userEmail: formData.userEmail,
          userName: formData.userName,
          userPhone: formData.userPhone,
          password: formData.password
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Company claimed successfully! You can now login.')
        onSuccess?.()
        onOpenChange(false)
        router.push('/login')
      } else {
        toast.error(data.message || 'Failed to claim company')
      }
    } catch (error) {
      console.error('Claim error:', error)
      toast.error('Failed to claim company')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCompany = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/companies/claim/create-new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          industry: formData.industry,
          companySize: formData.companySize,
          website: formData.website,
          userEmail: formData.userEmail,
          userName: formData.userName,
          userPhone: formData.userPhone,
          password: formData.password,
          region: formData.region
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Company created successfully! You can now login.')
        onSuccess?.()
        onOpenChange(false)
        router.push('/login')
      } else {
        toast.error(data.message || 'Failed to create company')
      }
    } catch (error) {
      console.error('Create error:', error)
      toast.error('Failed to create company')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep('search')
    setSearchTerm('')
    setCompanies([])
    setSelectedCompany(null)
    setFormData({
      companyName: '',
      industry: '',
      companySize: '1-50',
      website: '',
      userName: '',
      userEmail: '',
      userPhone: '',
      password: '',
      confirmPassword: '',
      region: 'india'
    })
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        resetForm()
      }
      onOpenChange(open)
    }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Register Your Company
          </DialogTitle>
          <DialogDescription>
            {step === 'search' && 'Search for your company or create a new one'}
            {step === 'claim' && 'Claim your existing company profile'}
            {step === 'create' && 'Create a new company profile'}
          </DialogDescription>
        </DialogHeader>

        {step === 'search' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="search">Company Name</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="search"
                    placeholder="Enter your company name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={loading}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {companies.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium">Found Companies</h3>
                {companies.map((company) => (
                  <Card 
                    key={company.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedCompany(company)
                      setStep('claim')
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{company.name}</h4>
                          <p className="text-sm text-slate-600">
                            {company.industry} • {company.city}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Created: {new Date(company.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Available to Claim
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-slate-600 mb-4">Don't see your company?</p>
              <Button 
                variant="outline" 
                onClick={() => setStep('create')}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Company
              </Button>
            </div>
          </div>
        )}

        {step === 'claim' && selectedCompany && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">Claiming Company</h3>
              </div>
              <p className="text-blue-800">
                <strong>{selectedCompany.name}</strong><br />
                {selectedCompany.industry} • {selectedCompany.city}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="userName">Your Full Name</Label>
                <Input
                  id="userName"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="userEmail">Email Address</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={formData.userEmail}
                  onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <Label htmlFor="userPhone">Phone Number</Label>
                <Input
                  id="userPhone"
                  value={formData.userPhone}
                  onChange={(e) => setFormData({ ...formData, userPhone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create a strong password"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('search')}>
                Back to Search
              </Button>
              <Button onClick={handleClaimCompany} disabled={loading}>
                {loading ? 'Claiming...' : 'Claim Company'}
              </Button>
            </div>
          </div>
        )}

        {step === 'create' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Plus className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-900">Create New Company</h3>
              </div>
              <p className="text-green-800">
                Create a new company profile for your organization
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Your Company Name"
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select value={formData.industry} onValueChange={(value) => setFormData({ ...formData, industry: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="companySize">Company Size</Label>
                <Select value={formData.companySize} onValueChange={(value) => setFormData({ ...formData, companySize: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-50">1-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="501-1000">501-1000 employees</SelectItem>
                    <SelectItem value="1000+">1000+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://yourcompany.com"
                />
              </div>
              <div>
                <Label htmlFor="region">Region</Label>
                <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="india">India</SelectItem>
                    <SelectItem value="gulf">Gulf</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="userName">Your Full Name</Label>
                <Input
                  id="userName"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="userEmail">Email Address</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={formData.userEmail}
                  onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <Label htmlFor="userPhone">Phone Number</Label>
                <Input
                  id="userPhone"
                  value={formData.userPhone}
                  onChange={(e) => setFormData({ ...formData, userPhone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create a strong password"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('search')}>
                Back to Search
              </Button>
              <Button onClick={handleCreateCompany} disabled={loading}>
                {loading ? 'Creating...' : 'Create Company'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
