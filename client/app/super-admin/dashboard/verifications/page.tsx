"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, CheckCircle, XCircle, Clock, Eye, FileText, User, Phone, Mail, Globe, Calendar } from "lucide-react"
import { toast } from "sonner"
import { apiService } from "@/lib/api"

interface PendingVerification {
  id: string
  name: string
  slug: string
  industry: string
  companySize: string
  website?: string
  email: string
  phone: string
  contactPerson: string
  contactEmail: string
  contactPhone: string
  companyAccountType: string
  verificationDocuments?: {
    gstNumber?: string
    panNumber?: string
    additionalNotes?: string
    submittedBy?: {
      userName: string
      userEmail: string
    }
    documents?: Array<{
    type: string
    url: string
    name: string
  }>
  }
  createdAt: string
  users: Array<{
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
  }>
}

export default function AdminVerificationsPage() {
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState<PendingVerification | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectNotes, setRejectNotes] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  const fetchPendingVerifications = async () => {
    try {
      setLoading(true)
      const response = await apiService.getPendingVerifications()
      
      if (response.success) {
        setPendingVerifications(response.data || [])
      } else {
        toast.error('Failed to fetch pending verifications')
      }
    } catch (error) {
      console.error('Error fetching pending verifications:', error)
      toast.error('Failed to fetch pending verifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingVerifications()
  }, [])

  const handleApprove = async () => {
    if (!selectedCompany) return

    try {
      setActionLoading(true)
      const response = await apiService.approveVerification(selectedCompany.id)
      
      if (response.success) {
        toast.success('Company verification approved successfully')
        setShowApproveDialog(false)
        setSelectedCompany(null)
        fetchPendingVerifications()
      } else {
        toast.error(response.message || 'Failed to approve verification')
      }
    } catch (error) {
      console.error('Error approving verification:', error)
      toast.error('Failed to approve verification')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedCompany || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      setActionLoading(true)
      const response = await apiService.rejectVerification(selectedCompany.id, {
        reason: rejectReason,
        notes: rejectNotes
      })
      
      if (response.success) {
        toast.success('Company verification rejected')
        setShowRejectDialog(false)
        setSelectedCompany(null)
        setRejectReason("")
        setRejectNotes("")
        fetchPendingVerifications()
      } else {
        toast.error(response.message || 'Failed to reject verification')
      }
    } catch (error) {
      console.error('Error rejecting verification:', error)
      toast.error('Failed to reject verification')
    } finally {
      setActionLoading(false)
    }
  }

  const openDetailsDialog = (company: PendingVerification) => {
    setSelectedCompany(company)
    setShowDetailsDialog(true)
  }

  const getAccountTypeBadge = (type: string) => {
    const types = {
      'direct': { label: 'Direct Company', variant: 'default' as const },
      'agency': { label: 'Agency/Consultancy', variant: 'secondary' as const },
      'recruiting_agency': { label: 'Recruiting Agency', variant: 'secondary' as const },
      'consulting_firm': { label: 'Consulting Firm', variant: 'outline' as const }
    }
    
    const config = types[type as keyof typeof types] || types.direct
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading pending verifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Employer Verifications</h1>
        <p className="text-slate-600">Review and approve employer verification requests</p>
      </div>

      {pendingVerifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Pending Verifications</h3>
            <p className="text-slate-600">All employer verification requests have been processed.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {pendingVerifications.map((company) => (
            <Card key={company.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{company.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{company.industry}</Badge>
                        <Badge variant="secondary">{company.companySize}</Badge>
                        {getAccountTypeBadge(company.companyAccountType)}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">{company.contactPerson}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">{company.contactEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">{company.contactPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">{formatDate(company.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">
                      {company.verificationDocuments?.documents?.length || 0} documents uploaded
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetailsDialog(company)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Company Verification Details
            </DialogTitle>
            <DialogDescription>
              Review company information and verification documents
            </DialogDescription>
          </DialogHeader>

          {selectedCompany && (
            <div className="space-y-6">
              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Company Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Company Name</Label>
                      <p className="text-sm text-slate-600">{selectedCompany.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Industry</Label>
                      <p className="text-sm text-slate-600">{selectedCompany.industry}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Company Size</Label>
                      <p className="text-sm text-slate-600">{selectedCompany.companySize}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Account Type</Label>
                      <div className="mt-1">{getAccountTypeBadge(selectedCompany.companyAccountType)}</div>
                    </div>
                    {selectedCompany.website && (
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium">Website</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Globe className="w-4 h-4 text-slate-500" />
                          <a 
                            href={selectedCompany.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            {selectedCompany.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Contact Person</Label>
                      <p className="text-sm text-slate-600">{selectedCompany.contactPerson}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Contact Email</Label>
                      <p className="text-sm text-slate-600">{selectedCompany.contactEmail}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Contact Phone</Label>
                      <p className="text-sm text-slate-600">{selectedCompany.contactPhone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Verification Information */}
              {selectedCompany.verificationDocuments && typeof selectedCompany.verificationDocuments === 'object' && (
                <>
                  {(selectedCompany.verificationDocuments.gstNumber || selectedCompany.verificationDocuments.panNumber || selectedCompany.verificationDocuments.additionalNotes) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Additional Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedCompany.verificationDocuments.gstNumber && (
                            <div>
                              <Label className="text-sm font-medium">GST Number</Label>
                              <p className="text-sm text-slate-600 font-mono">{selectedCompany.verificationDocuments.gstNumber}</p>
                            </div>
                          )}
                          {selectedCompany.verificationDocuments.panNumber && (
                            <div>
                              <Label className="text-sm font-medium">PAN Number</Label>
                              <p className="text-sm text-slate-600 font-mono">{selectedCompany.verificationDocuments.panNumber}</p>
                            </div>
                          )}
                          {selectedCompany.verificationDocuments.additionalNotes && (
                            <div className="md:col-span-2">
                              <Label className="text-sm font-medium">Additional Notes</Label>
                              <p className="text-sm text-slate-600 mt-1 p-3 bg-slate-50 rounded-lg">{selectedCompany.verificationDocuments.additionalNotes}</p>
                            </div>
                          )}
                          {selectedCompany.verificationDocuments.submittedBy && (
                            <div className="md:col-span-2">
                              <Label className="text-sm font-medium">Submitted By</Label>
                              <p className="text-sm text-slate-600">
                                {selectedCompany.verificationDocuments.submittedBy.userName} ({selectedCompany.verificationDocuments.submittedBy.userEmail})
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Verification Documents */}
                  {selectedCompany.verificationDocuments.documents && selectedCompany.verificationDocuments.documents.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Verification Documents</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedCompany.verificationDocuments.documents.map((doc, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-sm capitalize">{doc.type.replace('_', ' ')}</span>
                              </div>
                              <p className="text-sm text-slate-600 mb-3">{doc.name}</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    // Extract filename from the document URL
                                    const filename = doc.url.split('/').pop();
                                    if (!filename) {
                                      toast.error('Invalid document URL');
                                      return;
                                    }
                                    
                                    console.log('🔍 Requesting signed URL for:', filename);
                                    
                                    // Generate signed URL for document access
                                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/verification/documents/access`, {
                                      method: 'POST',
                                      headers: {
                                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({ filename }),
                                    });
                                    
                                    const result = await response.json();
                                    
                                    if (result.success && result.signedUrl) {
                                      // Use API base URL to construct full signed URL
                                      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
                                      const serverBaseUrl = apiBaseUrl.replace('/api', ''); // Remove /api to get server base URL
                                      const fullSignedUrl = `${serverBaseUrl}${result.signedUrl}`;
                                      
                                      console.log('✅ Opening signed URL:', fullSignedUrl);
                                      window.open(fullSignedUrl, '_blank');
                                    } else {
                                      console.error('Failed to generate signed URL:', result.message);
                                      toast.error(result.message || 'Failed to access document');
                                    }
                                  } catch (error) {
                                    console.error('Error accessing document:', error);
                                    toast.error('Failed to open document');
                                  }
                                }}
                              >
                                View Document
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Fallback for old format */}
              {selectedCompany.verificationDocuments && Array.isArray(selectedCompany.verificationDocuments) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Verification Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedCompany.verificationDocuments.map((doc, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-sm capitalize">{doc.type.replace('_', ' ')}</span>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">{doc.name}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                // Extract filename from the document URL
                                const filename = doc.url.split('/').pop();
                                if (!filename) {
                                  toast.error('Invalid document URL');
                                  return;
                                }
                                
                                console.log('🔍 Requesting signed URL for (fallback):', filename);
                                
                                // Generate signed URL for document access
                                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/verification/documents/access`, {
                                  method: 'POST',
                                  headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({ filename }),
                                });
                                
                                const result = await response.json();
                                
                                if (result.success && result.signedUrl) {
                                  // Use API base URL to construct full signed URL
                                  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
                                  const serverBaseUrl = apiBaseUrl.replace('/api', ''); // Remove /api to get server base URL
                                  const fullSignedUrl = `${serverBaseUrl}${result.signedUrl}`;
                                  
                                  console.log('✅ Opening signed URL (fallback):', fullSignedUrl);
                                  window.open(fullSignedUrl, '_blank');
                                } else {
                                  console.error('Failed to generate signed URL (fallback):', result.message);
                                  toast.error(result.message || 'Failed to access document');
                                }
                              } catch (error) {
                                console.error('Error accessing document (fallback):', error);
                                toast.error('Failed to open document');
                              }
                            }}
                          >
                            View Document
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Company Users */}
              {selectedCompany.users && selectedCompany.users.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Company Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedCompany.users.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{user.first_name} {user.last_name}</p>
                            <p className="text-sm text-slate-600">{user.email}</p>
                          </div>
                          <div className="text-sm text-slate-600">
                            {user.phone}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDetailsDialog(false)
                setShowRejectDialog(true)
              }}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Reject
            </Button>
            <Button
              onClick={() => {
                setShowDetailsDialog(false)
                setShowApproveDialog(true)
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Approve Verification
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this company verification? This will activate their account and allow them to post jobs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Reject Verification
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this verification request. The company will be notified and can resubmit with corrected documents.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectReason">Rejection Reason *</Label>
              <select
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a reason</option>
                <option value="Incomplete documents">Incomplete documents</option>
                <option value="Invalid documents">Invalid documents</option>
                <option value="Poor document quality">Poor document quality</option>
                <option value="Mismatched information">Mismatched information</option>
                <option value="Suspicious activity">Suspicious activity</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="rejectNotes">Additional Notes (Optional)</Label>
              <Textarea
                id="rejectNotes"
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Provide additional details about the rejection..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
            >
              {actionLoading ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
