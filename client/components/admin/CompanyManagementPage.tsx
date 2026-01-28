"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { apiService } from "@/lib/api"
import { toast } from "sonner"
import {
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowLeft,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Globe,
  Star,
  Users,
  Briefcase,
  MoreVertical,
  Trash2,
  FileText,
  AlertCircle,
  Clock,
  ShieldCheck,
  FileCheck
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CompanyManagementDialog } from "./CompanyManagementDialog"

interface CompanyManagementPageProps {
  portal: 'all' | 'normal' | 'gulf'
  title: string
  description: string
  icon: React.ReactNode
}

export default function CompanyManagementPage({ portal, title, description, icon }: CompanyManagementPageProps) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterVerification, setFilterVerification] = useState("all")
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [showCompanyDialog, setShowCompanyDialog] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user || (user.userType !== 'admin' && user.userType !== 'superadmin')) {
      router.push('/admin-login')
      return
    }

    loadCompanies()
  }, [user, authLoading, router, currentPage, filterStatus, filterVerification])

  const loadCompanies = async () => {
    try {
      setLoading(true)
      let response
      
      if (portal === 'all') {
        response = await apiService.getAllCompanies({
          page: currentPage,
          limit: 20,
          search: searchTerm,
          status: filterStatus === 'all' ? undefined : filterStatus,
          verification: filterVerification === 'all' ? undefined : filterVerification
        })
      } else {
        // For portal-specific companies, we'll filter by region
        const region = portal === 'gulf' ? 'gulf' : 'india'
        response = await apiService.getAllCompanies({
          page: currentPage,
          limit: 20,
          search: searchTerm,
          status: filterStatus === 'all' ? undefined : filterStatus,
          verification: filterVerification === 'all' ? undefined : filterVerification,
          region: region
        })
      }
      
      if (response.success && response.data) {
        setCompanies(response.data.companies || [])
        setTotalPages(response.data.totalPages || 1)
      } else {
        toast.error(`Failed to load ${title.toLowerCase()}`)
        setCompanies([])
        setTotalPages(1)
      }
    } catch (error) {
      console.error(`Failed to load ${title.toLowerCase()}:`, error)
      toast.error(`Failed to load ${title.toLowerCase()}. Please check your connection and try again.`)
      
      // Set empty array when backend is not available - no mock data
      setCompanies([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const toggleCompanyStatus = async (companyId: string, currentStatus: boolean | string) => {
    try {
      const isCurrentlyActive = typeof currentStatus === 'boolean' ? currentStatus : currentStatus === 'true'
      const newStatus = isCurrentlyActive ? 'inactive' : 'active'
      const response = await apiService.updateCompanyStatus(companyId, newStatus)
      
      if (response.success) {
        toast.success(`Company ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`)
        loadCompanies()
      } else {
        toast.error('Failed to update company status')
      }
    } catch (error) {
      console.error('Failed to update company status:', error)
      toast.error('Failed to update company status')
    }
  }

  const toggleVerification = async (companyId: string, currentVerification: boolean | string) => {
    try {
      const isCurrentlyVerified = typeof currentVerification === 'boolean' ? currentVerification : currentVerification === 'true'
      const newVerificationStatus = isCurrentlyVerified ? 'unverified' : 'verified'
      const response = await apiService.updateCompanyVerification(companyId, newVerificationStatus)
      
      if (response.success) {
        toast.success(`Company ${newVerificationStatus === 'verified' ? 'verified' : 'unverified'} successfully`)
        loadCompanies()
      } else {
        toast.error('Failed to update company verification')
      }
    } catch (error) {
      console.error('Failed to update company verification:', error)
      toast.error('Failed to update company verification')
    }
  }

  const deleteCompany = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      return
    }

    try {
      const response = await apiService.deleteCompany(companyId)
      
      if (response.success) {
        toast.success('Company deleted successfully')
        loadCompanies()
      } else {
        toast.error('Failed to delete company')
      }
    } catch (error) {
      console.error('Failed to delete company:', error)
      toast.error('Failed to delete company')
    }
  }

  const handleApproveVerification = async (companyId: string) => {
    if (!confirm('Are you sure you want to approve this company\'s verification?')) {
      return
    }

    try {
      setProcessing(true)
      const response = await apiService.approveVerification(companyId)
      
      if (response.success) {
        toast.success('Company verification approved successfully')
        setShowCompanyDialog(false)
        loadCompanies()
      } else {
        toast.error(response.message || 'Failed to approve verification')
      }
    } catch (error) {
      console.error('Failed to approve verification:', error)
      toast.error('Failed to approve verification')
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectVerification = async (companyId: string, reason: string, notes: string) => {
    try {
      setProcessing(true)
      const response = await apiService.rejectVerification(companyId, {
        reason,
        notes
      })
      
      if (response.success) {
        toast.success('Company verification rejected successfully')
        setShowCompanyDialog(false)
        loadCompanies()
      } else {
        toast.error(response.message || 'Failed to reject verification')
      }
    } catch (error) {
      console.error('Failed to reject verification:', error)
      toast.error('Failed to reject verification')
    } finally {
      setProcessing(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadCompanies()
  }

  const handleFilterChange = () => {
    setCurrentPage(1)
    loadCompanies()
  }

  const exportCompanies = async () => {
    try {
      const response = await apiService.exportCompanies({
        status: filterStatus === 'all' ? undefined : filterStatus,
        verification: filterVerification === 'all' ? undefined : filterVerification,
        region: portal === 'all' ? undefined : (portal === 'gulf' ? 'gulf' : 'india')
      })
      
      if (response.success && response.data) {
        const blob = new Blob([response.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${portal}-companies-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success('Companies exported successfully')
      } else {
        toast.error('Failed to export companies')
      }
    } catch (error) {
      console.error('Failed to export companies:', error)
      toast.error('Failed to export companies')
    }
  }

  const getImageUrl = (logoPath: string) => {
    if (!logoPath) return null
    // If it's already a full URL, return as is
    if (logoPath.startsWith('http')) return logoPath
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${logoPath}`
  }

  const getDocumentUrl = (docPath: string) => {
    if (!docPath) return null
    if (docPath.startsWith('http')) return docPath
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${docPath}`
  }

  const getVerificationStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
      case 'premium_verified':
        return (
          <Badge className="bg-green-600 text-xs px-2 py-1">
            <ShieldCheck className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-amber-600 text-xs px-2 py-1">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-600 text-xs px-2 py-1">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-600 text-xs px-2 py-1">
            <AlertCircle className="w-3 h-3 mr-1" />
            Unverified
          </Badge>
        )
    }
  }

  const getAccountTypeBadge = (companyAccountType: string) => {
    switch (companyAccountType) {
      case 'direct_employer':
        return <Badge variant="outline" className="border-blue-500 text-blue-400">Direct Employer</Badge>
      case 'recruitment_agency':
        return <Badge variant="outline" className="border-purple-500 text-purple-400">Recruitment Agency</Badge>
      case 'consulting_firm':
        return <Badge variant="outline" className="border-green-500 text-green-400">Consulting Firm</Badge>
      default:
        return <Badge variant="outline" className="border-gray-500 text-gray-400">Unknown</Badge>
    }
  }

  if (loading && companies.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center">
        <div className="text-gray-900 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading companies...</p>
        </div>
      </div>
    )
  }

  if (!user || (user.userType !== 'admin' && user.userType !== 'superadmin')) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/super-admin/dashboard')}
              className="text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center space-x-3">
              {icon}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                <p className="text-gray-600">{description}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={exportCompanies}
              variant="outline"
              className="text-gray-900 border-gray-300 hover:bg-gray-100 bg-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={loadCompanies}
              variant="outline"
              className="text-gray-900 border-gray-300 hover:bg-gray-100 bg-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white border-gray-200">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search companies by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Select value={filterStatus} onValueChange={(value) => { setFilterStatus(value); handleFilterChange() }}>
                  <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterVerification} onValueChange={(value) => { setFilterVerification(value); handleFilterChange() }}>
                  <SelectTrigger className="w-40 bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Verification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Verification</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="unverified">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Companies List */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              {title} ({companies.length})
            </CardTitle>
            <CardDescription className="text-gray-600">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {companies.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No companies found</h3>
                <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {companies.map((company) => (
                  <Card key={company.id} className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow h-fit">
                    <CardContent className="p-4">
                      {/* Header Section */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            <Building2 className="w-6 h-6 text-white" style={{ display: company.logo ? 'none' : 'flex' }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 text-sm truncate" title={company.name}>
                              {company.name}
                            </h3>
                            <p className="text-xs text-gray-600 truncate" title={company.email}>
                              {company.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-1 flex-shrink-0">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${company.region === 'india' ? 'border-orange-500 text-orange-400' : 'border-cyan-500 text-cyan-400'}`}
                          >
                            {company.region === 'india' ? (
                              <>
                                <MapPin className="w-2 h-2 mr-1" />
                                India
                              </>
                            ) : (
                              <>
                                <Globe className="w-2 h-2 mr-1" />
                                Gulf
                              </>
                            )}
                          </Badge>
                          <Badge 
                            variant={company.isActive ? 'default' : 'destructive'}
                            className={`text-xs ${company.isActive ? 'bg-blue-600' : 'bg-gray-600'}`}
                          >
                            {company.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>

                      {/* Industry Tags */}
                      <div className="mb-3">
                        {company.industries && company.industries.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {company.industries.slice(0, 2).map((industry: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs bg-gray-100 text-gray-700 px-2 py-1">
                                {industry}
                              </Badge>
                            ))}
                            {company.industries.length > 2 && (
                              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 px-2 py-1">
                                +{company.industries.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : company.industry && (
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 px-2 py-1">
                            {company.industry}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Stats Section */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="flex items-center text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                          <Briefcase className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{company.totalJobsPosted || 0} jobs</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                          <Users className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{company.totalApplications || 0} apps</span>
                        </div>
                      </div>

                      {/* Verification Status */}
                      <div className="mb-3">
                        {getVerificationStatusBadge(company.verificationStatus)}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCompany(company)
                              setShowCompanyDialog(true)
                            }}
                            className="text-gray-700 hover:bg-gray-100 border-gray-300 bg-white text-xs px-2 py-1 h-7"
                            title="View Details"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          {company.verificationStatus !== 'verified' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveVerification(company.id)}
                              className="text-gray-700 hover:bg-green-50 hover:text-green-600 border-gray-300 bg-white text-xs px-2 py-1 h-7"
                              title="Approve Verification"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-gray-700 hover:bg-gray-100 border-gray-300 bg-white text-xs px-2 py-1 h-7"
                              title="More Actions"
                            >
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => {
                              setSelectedCompany(company)
                              setShowCompanyDialog(true)
                            }}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {company.verificationStatus !== 'verified' && (
                              <DropdownMenuItem onClick={() => handleApproveVerification(company.id)}>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Approve Verification
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => toggleCompanyStatus(company.id, company.isActive)}>
                              {company.isActive ? (
                                <>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Deactivate Company
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Activate Company
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => deleteCompany(company.id)}
                              className="text-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-gray-600 text-sm">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="text-gray-900 border-gray-300 hover:bg-gray-100 bg-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="text-gray-900 border-gray-300 hover:bg-gray-100 bg-white"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Company Management Dialog */}
        <CompanyManagementDialog
          company={selectedCompany}
          open={showCompanyDialog}
          onOpenChange={setShowCompanyDialog}
          onApprove={handleApproveVerification}
          onReject={handleRejectVerification}
          onToggleStatus={toggleCompanyStatus}
          onToggleVerification={toggleVerification}
          processing={processing}
        />
      </div>
    </div>
  )
}
