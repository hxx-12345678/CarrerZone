"use client"

import { useState } from "react"
import { 
  Building2, CheckCircle2, XCircle, FileText, Download, 
  Briefcase, Users, Star, Clock, AlertCircle, FileCheck, ShieldCheck,
  Mail, Phone, Globe, MapPin, Calendar, Eye, Trash2, Edit
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { apiService } from "@/lib/api"
import { useEffect } from "react"

interface CompanyDialogProps {
  company: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprove: (companyId: string) => void
  onReject: (companyId: string, reason: string, notes: string) => void
  onToggleStatus: (companyId: string, currentStatus: boolean) => void
  onToggleVerification: (companyId: string, currentVerification: boolean) => void
  processing: boolean
}

export function CompanyManagementDialog({
  company,
  open,
  onOpenChange,
  onApprove,
  onReject,
  onToggleStatus,
  onToggleVerification,
  processing
}: CompanyDialogProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectionNotes, setRejectionNotes] = useState("")
  const [detailedCompany, setDetailedCompany] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [showJobsList, setShowJobsList] = useState(false)

  // Fetch detailed company data when dialog opens
  useEffect(() => {
    if (open && company?.id) {
      fetchDetailedCompany()
    }
  }, [open, company?.id])

  const fetchDetailedCompany = async () => {
    if (!company?.id) return
    
    try {
      setLoadingDetails(true)
      const response = await apiService.getCompanyDetails(company.id)
      
      if (response.success && response.data) {
        setDetailedCompany(response.data)
      } else {
        // Fallback to the company data from the list
        setDetailedCompany(company)
      }
    } catch (error) {
      console.error('Error fetching detailed company data:', error)
      // Fallback to the company data from the list
      setDetailedCompany(company)
    } finally {
      setLoadingDetails(false)
    }
  }

  const getImageUrl = (path: string) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${path}`
  }

  const getVerificationStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
      case 'premium_verified':
        return <Badge className="bg-green-600 text-white"><CheckCircle2 className="w-3 h-3 mr-1" />Verified</Badge>
      case 'pending':
        return <Badge className="bg-amber-600 text-white"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'rejected':
        return <Badge className="bg-red-600 text-white"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge className="bg-gray-600 text-white"><AlertCircle className="w-3 h-3 mr-1" />Unverified</Badge>
    }
  }

  const getAccountTypeBadge = (type: string) => {
    switch (type) {
      case 'direct_employer':
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Direct Employer</Badge>
      case 'agency':
      case 'recruiting_agency':
      case 'consulting_firm':
        return <Badge variant="outline" className="border-purple-500 text-purple-600">Agency/Consultancy</Badge>
      default:
        return <Badge variant="outline" className="border-gray-500 text-gray-600">Unknown</Badge>
    }
  }

  const handleRejectClick = () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    onReject(company.id, rejectReason, rejectionNotes)
    setShowRejectDialog(false)
    setRejectReason('')
    setRejectionNotes('')
  }

  const handleVerifyClick = () => {
    onApprove(company.id)
  }

  const handleDeactivateClick = () => {
    onToggleStatus(company.id, company.isActive)
  }

  if (!company) return null

  // Use detailed company data if available, otherwise fallback to company from list
  const currentCompany = detailedCompany || company

  const verificationDocs = currentCompany.verificationDocuments || {}
  const documents = verificationDocs.documents || []
  const gstNumber = verificationDocs.gstNumber || verificationDocs.data?.gstNumber || ''
  const panNumber = verificationDocs.panNumber || verificationDocs.data?.panNumber || ''
  const additionalNotes = verificationDocs.additionalNotes || verificationDocs.data?.additionalNotes || ''
  const submittedBy = verificationDocs.submittedBy || verificationDocs.data?.submittedBy || {}

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-gray-900">
              <Building2 className="w-5 h-5 mr-2" />
              Company Details
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Complete information about {currentCompany.name}
            </DialogDescription>
          </DialogHeader>

          {loadingDetails && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading company details...</span>
            </div>
          )}

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100">
              <TabsTrigger value="details" className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900">Company Details</TabsTrigger>
              <TabsTrigger value="verification" className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <FileCheck className="w-4 h-4 mr-2" />
                Verification {currentCompany.verificationStatus === 'pending' && <Badge className="ml-2 bg-amber-600 text-white">Pending</Badge>}
              </TabsTrigger>
              <TabsTrigger value="statistics" className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900">Statistics</TabsTrigger>
            </TabsList>

            {/* Company Details Tab */}
            <TabsContent value="details" className="space-y-6 mt-6">
              <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  {currentCompany.logo ? (
                    <img src={getImageUrl(currentCompany.logo) || ''} alt={currentCompany.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-10 h-10 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900 truncate">{currentCompany.name}</h2>
                  <p className="text-gray-600 truncate">{currentCompany.email}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {currentCompany.region && (
                      <Badge variant="outline" className={currentCompany.region === 'india' ? 'border-orange-500 text-orange-600' : 'border-cyan-500 text-cyan-600'}>
                        {currentCompany.region === 'india' ? 'India' : 'Gulf'}
                      </Badge>
                    )}
                    {getVerificationStatusBadge(currentCompany.verificationStatus || 'unverified')}
                    {getAccountTypeBadge(currentCompany.companyAccountType)}
                    <Badge variant={currentCompany.isActive ? 'default' : 'destructive'} className={currentCompany.isActive ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
                      {currentCompany.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center">
                      <Building2 className="w-4 h-4 mr-2" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Company Name</label>
                      <p className="text-gray-900">{currentCompany.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900 flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        {currentCompany.email}
                      </p>
                    </div>
                    {currentCompany.phone_number && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Phone</label>
                        <p className="text-gray-900 flex items-center">
                          <Phone className="w-4 h-4 mr-2" />
                          {currentCompany.phone_number}
                        </p>
                      </div>
                    )}
                    {currentCompany.website && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Website</label>
                        <p className="text-gray-900 flex items-center">
                          <Globe className="w-4 h-4 mr-2" />
                          <a href={currentCompany.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {currentCompany.website}
                          </a>
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-600">Industries</label>
                      {currentCompany.industries && currentCompany.industries.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {currentCompany.industries.map((industry: string, index: number) => (
                            <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                              {industry}
                            </Badge>
                          ))}
                </div>
                      ) : (
                        <p className="text-gray-900">{currentCompany.industry || 'Not specified'}</p>
                      )}
                </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Company Size</label>
                      <p className="text-gray-900">{currentCompany.companySize || currentCompany.company_size || 'Not specified'}</p>
              </div>
                  </CardContent>
                </Card>

                {/* Location & Status */}
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Location & Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Region</label>
                      <p className="text-gray-900">{currentCompany.region || 'Not specified'}</p>
                    </div>
                    {currentCompany.address && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Address</label>
                        <p className="text-gray-900">{currentCompany.address}</p>
                      </div>
                    )}
                    {currentCompany.city && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">City</label>
                        <p className="text-gray-900">{currentCompany.city}</p>
                      </div>
                    )}
                    {currentCompany.state && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">State</label>
                        <p className="text-gray-900">{currentCompany.state}</p>
                      </div>
                    )}
                    {currentCompany.country && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Country</label>
                        <p className="text-gray-900">{currentCompany.country}</p>
                </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-600">Created</label>
                      <p className="text-gray-900 flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {currentCompany.createdAt ? new Date(currentCompany.createdAt).toLocaleDateString() : 'Not available'}
                      </p>
                </div>
                  </CardContent>
                </Card>
              </div>

              {currentCompany.description && (
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{currentCompany.description}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Verification Tab */}
            <TabsContent value="verification" className="space-y-6 mt-6">
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Verification Status
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Current verification status and documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Status</h3>
                      {getVerificationStatusBadge(currentCompany.verificationStatus || 'unverified')}
                    </div>
                    {currentCompany.verificationStatus !== 'verified' && (
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleVerifyClick}
                          disabled={processing}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {processing ? 'Processing...' : 'Approve Verification'}
                        </Button>
                        <Button
                          onClick={() => setShowRejectDialog(true)}
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                    </div>
                    )}
                  </div>

                  {documents.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Documents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {documents.map((doc: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">{doc.type || `Document ${index + 1}`}</h4>
                              {(doc.url || doc.filename) && (
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      try {
                                        // Extract filename from various possible formats
                                        let filename = doc.filename;
                                        if (!filename && doc.url) {
                                          // Extract filename from URL (handle various formats)
                                          const urlParts = doc.url.split('/');
                                          filename = urlParts[urlParts.length - 1];
                                          // Remove query parameters if any
                                          filename = filename.split('?')[0];
                                        }
                                        
                                        if (!filename) {
                                          toast.error('Document filename not available');
                                          return;
                                        }
                                        
                                        // Clean filename - remove any path prefixes
                                        filename = filename.replace(/^.*\//, '').trim();
                                        
                                        // Fetch document through API with authentication
                                        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                                        const token = localStorage.getItem('token');
                                        
                                        if (!token) {
                                          toast.error('Authentication required');
                                          return;
                                        }
                                        
                                        const response = await fetch(
                                          `${baseUrl}/api/admin/verification-documents/${encodeURIComponent(filename)}`,
                                          {
                                            method: 'GET',
                                            headers: {
                                              'Authorization': `Bearer ${token}`,
                                            },
                                          }
                                        );
                                        
                                        if (!response.ok) {
                                          throw new Error(`Failed to fetch document: ${response.status}`);
                                        }
                                        
                                        // Get the blob from response
                                        const blob = await response.blob();
                                        
                                        // Create a blob URL and open it
                                        const blobUrl = URL.createObjectURL(blob);
                                        const newWindow = window.open(blobUrl, '_blank');
                                        
                                        if (!newWindow) {
                                          URL.revokeObjectURL(blobUrl);
                                          toast.error('Please allow popups to view documents');
                                          return;
                                        }
                                        
                                        // Clean up the blob URL when the window is closed or after 10 minutes
                                        // (long enough for viewing, but prevents memory leaks)
                                        setTimeout(() => {
                                          try {
                                            URL.revokeObjectURL(blobUrl);
                                          } catch (e) {
                                            // Ignore errors if URL already revoked
                                          }
                                        }, 600000); // 10 minutes
                                      } catch (error: any) {
                                        console.error('Error viewing document:', error);
                                        toast.error(error.message || 'Failed to open document');
                                      }
                                    }}
                                    className="text-blue-600 border-blue-500 hover:bg-blue-50"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      try {
                                        // Extract filename from various possible formats
                                        let filename = doc.filename;
                                        if (!filename && doc.url) {
                                          const urlParts = doc.url.split('/');
                                          filename = urlParts[urlParts.length - 1];
                                          filename = filename.split('?')[0];
                                        }
                                        
                                        if (!filename) {
                                          toast.error('Document filename not available');
                                          return;
                                        }
                                        
                                        // Clean filename
                                        filename = filename.replace(/^.*\//, '').trim();
                                        
                                        // Fetch document through API with authentication
                                        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                                        const token = localStorage.getItem('token');
                                        
                                        if (!token) {
                                          toast.error('Authentication required');
                                          return;
                                        }
                                        
                                        const response = await fetch(
                                          `${baseUrl}/api/admin/verification-documents/${encodeURIComponent(filename)}`,
                                          {
                                            method: 'GET',
                                            headers: {
                                              'Authorization': `Bearer ${token}`,
                                            },
                                          }
                                        );
                                        
                                        if (!response.ok) {
                                          throw new Error(`Failed to fetch document: ${response.status}`);
                                        }
                                        
                                        // Get the blob from response
                                        const blob = await response.blob();
                                        
                                        // Create a download link
                                        const blobUrl = URL.createObjectURL(blob);
                                      const link = document.createElement('a');
                                        link.href = blobUrl;
                                        link.download = filename || `document-${index + 1}.pdf`;
                                        document.body.appendChild(link);
                                      link.click();
                                        document.body.removeChild(link);
                                        
                                        // Clean up the blob URL
                                        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                                        
                                        toast.success('Document downloaded');
                                      } catch (error: any) {
                                        console.error('Error downloading document:', error);
                                        toast.error(error.message || 'Failed to download document');
                                      }
                                    }}
                                    className="text-green-600 border-green-500 hover:bg-green-50"
                                  >
                                    <Download className="w-4 h-4 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              )}
                              </div>
                            {doc.description && (
                              <p className="text-sm text-gray-600">{doc.description}</p>
                            )}
                          </div>
                      ))}
                    </div>
                  </div>
                  )}

                  {(gstNumber || panNumber) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {gstNumber && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">GST Number</label>
                            <p className="text-gray-900">{gstNumber}</p>
                          </div>
                        )}
                        {panNumber && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">PAN Number</label>
                            <p className="text-gray-900">{panNumber}</p>
                          </div>
                        )}
                  </div>
                  </div>
                )}

                  {additionalNotes && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Notes</h3>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{additionalNotes}</p>
                  </div>
                )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-white border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowJobsList(true)}>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Briefcase className="w-8 h-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                        <p className="text-2xl font-bold text-gray-900">{currentCompany.statistics?.totalJobs || currentCompany.totalJobsPosted || 0}</p>
                        <p className="text-xs text-blue-600 mt-1">Click to view all jobs</p>
                    </div>
                  </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Users className="w-8 h-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Applications</p>
                        <p className="text-2xl font-bold text-gray-900">{currentCompany.statistics?.totalApplications || currentCompany.totalApplications || 0}</p>
                    </div>
                  </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Star className="w-8 h-8 text-yellow-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Rating</p>
                        <p className="text-2xl font-bold text-gray-900">{currentCompany.statistics?.averageRating || currentCompany.rating || 'N/A'}</p>
                    </div>
                  </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              {currentCompany.verificationStatus !== 'verified' && (
                <Button
                  onClick={handleVerifyClick}
                  disabled={processing}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {processing ? 'Processing...' : 'Approve Verification'}
                </Button>
              )}
              <Button
                onClick={handleDeactivateClick}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {currentCompany.isActive ? (
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
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-white border-gray-200 text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Reject Company Verification</DialogTitle>
            <DialogDescription className="text-gray-600">
              Please provide a reason for rejecting this company's verification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Reason for Rejection</label>
              <Select value={rejectReason} onValueChange={setRejectReason}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incomplete_documents">Incomplete Documents</SelectItem>
                  <SelectItem value="invalid_documents">Invalid Documents</SelectItem>
                  <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                  <SelectItem value="policy_violation">Policy Violation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Additional Notes</label>
              <Textarea
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="Provide additional details..."
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowRejectDialog(false)}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectClick}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Reject Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Jobs List Dialog */}
      <Dialog open={showJobsList} onOpenChange={setShowJobsList}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              Jobs for {currentCompany.name}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              All jobs posted by this company
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {currentCompany.jobs && currentCompany.jobs.length > 0 ? (
              <div className="space-y-4">
                {currentCompany.jobs.map((job: any, index: number) => (
                  <Card key={index} className="bg-white border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Location:</span>
                              <span className="ml-2 text-gray-900">{job.location || 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Type:</span>
                              <span className="ml-2 text-gray-900">{job.job_type || 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Salary:</span>
                              <span className="ml-2 text-gray-900">{job.salary || 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Status:</span>
                              {(() => {
                                // Calculate display status considering expired jobs
                                const now = new Date();
                                const validTill = job.valid_till || job.validTill ? new Date(job.valid_till || job.validTill) : null;
                                const isActuallyExpired = validTill && validTill < now;
                                const displayStatus = isActuallyExpired ? 'deactivated' : (job.status || 'inactive');
                                
                                // Get status color
                                let statusColor = 'bg-gray-600';
                                let statusText = displayStatus;
                                
                                if (displayStatus === 'active') {
                                  statusColor = 'bg-green-600';
                                } else if (displayStatus === 'deactivated' || displayStatus === 'expired') {
                                  statusColor = 'bg-red-600';
                                  statusText = 'deactivated';
                                } else if (displayStatus === 'paused') {
                                  statusColor = 'bg-yellow-600';
                                } else if (displayStatus === 'draft') {
                                  statusColor = 'bg-gray-500';
                                } else if (displayStatus === 'inactive' || displayStatus === 'closed') {
                                  statusColor = 'bg-red-600';
                                }
                                
                                return (
                                  <Badge className={`ml-2 ${statusColor}`}>
                                    {statusText}
                              </Badge>
                                );
                              })()}
                            </div>
                            <div>
                              <span className="text-gray-600">Applications:</span>
                              <span className="ml-2 text-gray-900">{job.jobApplications?.length || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Posted:</span>
                              <span className="ml-2 text-gray-900">
                                {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowJobsList(false)
                              onOpenChange(false)
                              window.open(`/super-admin/jobs/${job.id}`, '_blank')
                            }}
                            className="text-blue-600 border-blue-500 hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jobs Found</h3>
                <p className="text-gray-600">This company hasn't posted any jobs yet.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowJobsList(false)}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
