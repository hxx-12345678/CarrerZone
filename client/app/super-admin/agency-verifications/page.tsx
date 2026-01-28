"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, FileText, CheckCircle, XCircle, Clock, Eye, Building2, Users, TrendingUp, AlertCircle, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { apiService } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

export default function AgencyVerificationsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<any>(null)
  const [verifications, setVerifications] = useState<any>({ agencies: [], clientAuthorizations: [] })
  const [loadingData, setLoadingData] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  
  // Dialog states
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [actionNotes, setActionNotes] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)

  // Check if user is admin
  useEffect(() => {
    if (!loading && (!user || (user.userType !== 'admin' && user.userType !== 'superadmin'))) {
      router.push('/admin-login')
    }
  }, [user, loading, router])

  // Load statistics
  useEffect(() => {
    if (user && (user.userType === 'admin' || user.userType === 'superadmin')) {
      loadStats()
    }
  }, [user])

  // Load verifications
  useEffect(() => {
    if (user && (user.userType === 'admin' || user.userType === 'superadmin')) {
      loadVerifications()
    }
  }, [user, filterStatus, filterType, searchTerm])

  const loadStats = async () => {
    try {
      const response = await apiService.getVerificationStats()
      if (response.success) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadVerifications = async () => {
    setLoadingData(true)
    try {
      const response = await apiService.getAgencyVerifications({
        status: filterStatus || undefined,
        type: filterType || undefined,
        search: searchTerm || undefined,
        limit: 50,
        offset: 0
      })
      
      if (response.success) {
        setVerifications(response.data)
      }
    } catch (error) {
      console.error('Error loading verifications:', error)
      toast.error('Failed to load verifications')
    } finally {
      setLoadingData(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedItem) return
    
    setProcessing(true)
    try {
      let response
      if (selectedItem.type === 'agency') {
        response = await apiService.approveAgencyVerification(selectedItem.id, actionNotes || undefined)
      } else {
        response = await apiService.approveClientAuthorization(selectedItem.id, actionNotes || undefined)
      }
      
      if (response.success) {
        toast.success(`${selectedItem.type === 'agency' ? 'Agency' : 'Client authorization'} approved successfully`)
        setShowApproveDialog(false)
        setActionNotes('')
        setSelectedItem(null)
        loadVerifications()
        loadStats()
      } else {
        toast.error(response.message || 'Failed to approve')
      }
    } catch (error: any) {
      console.error('Error approving:', error)
      toast.error(error.message || 'Failed to approve')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedItem || !rejectReason.trim()) {
      toast.error('Rejection reason is required')
      return
    }
    
    setProcessing(true)
    try {
      let response
      if (selectedItem.type === 'agency') {
        response = await apiService.rejectAgencyVerification(selectedItem.id, rejectReason)
      } else {
        response = await apiService.rejectClientAuthorization(selectedItem.id, rejectReason)
      }
      
      if (response.success) {
        toast.success(`${selectedItem.type === 'agency' ? 'Agency' : 'Client authorization'} rejected`)
        setShowRejectDialog(false)
        setRejectReason('')
        setSelectedItem(null)
        loadVerifications()
        loadStats()
      } else {
        toast.error(response.message || 'Failed to reject')
      }
    } catch (error: any) {
      console.error('Error rejecting:', error)
      toast.error(error.message || 'Failed to reject')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Pending' },
      pending_client_confirm: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', label: 'Awaiting Client' },
      pending_admin_review: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', label: 'Admin Review' },
      pending_manual_review: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', label: 'Manual Review' },
      active: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: 'Active' },
      verified: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: 'Verified' },
      rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: 'Rejected' },
      expired: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', label: 'Expired' },
      revoked: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: 'Revoked' },
    }
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status }
    return <Badge className={config.color}>{config.label}</Badge>
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Agency Verifications</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage recruiting agency and client authorization verifications
              </p>
            </div>
            <Button onClick={() => router.push('/super-admin/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Agencies</CardTitle>
                <Building2 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.agencies.total}</div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {stats.agencies.verified} verified, {stats.agencies.pending} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Client Authorizations</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.clientAuthorizations.total}</div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {stats.clientAuthorizations.active} active, {stats.clientAuthorizations.pending} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.agencies.pending + stats.clientAuthorizations.pending}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Requires immediate attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verification Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.agencies.total > 0 
                    ? Math.round((stats.agencies.verified / stats.agencies.total) * 100) 
                    : 0}%
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Agency approval rate
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search agencies or companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="agency">Agency KYC</SelectItem>
                  <SelectItem value="client">Client Authorizations</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="pending_admin_review">Admin Review</SelectItem>
                  <SelectItem value="pending_client_confirm">Client Confirmation</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Verification Lists */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">All Verifications</TabsTrigger>
            <TabsTrigger value="pending">Pending Only ({(stats?.agencies.pending || 0) + (stats?.clientAuthorizations.pending || 0)})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Agency KYC Verifications */}
            {(!filterType || filterType === 'agency') && verifications.agencies.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  Agency KYC Verifications ({verifications.agencies.length})
                </h2>
                <div className="space-y-4">
                  {verifications.agencies.map((agency: any) => (
                    <Card key={agency.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                  {agency.name}
                                </h3>
                                {getStatusBadge(agency.verificationStatus)}
                                <Badge variant="outline" className="text-xs">
                                  {agency.companyAccountType === 'recruiting_agency' ? 'Recruiting Agency' : 'Consulting Firm'}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                {agency.industry} • Registered {new Date(agency.createdAt).toLocaleDateString()}
                              </p>
                              {agency.verificationMethod && (
                                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                  Verification: {agency.verificationMethod.replace(/_/g, ' ')}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedItem({ ...agency, type: 'agency' })
                                setShowDetailsDialog(true)
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            
                            {(agency.verificationStatus === 'pending' || agency.verificationStatus === 'pending_manual_review') && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    setSelectedItem({ ...agency, type: 'agency' })
                                    setShowApproveDialog(true)
                                  }}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedItem({ ...agency, type: 'agency' })
                                    setShowRejectDialog(true)
                                  }}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Client Authorizations */}
            {(!filterType || filterType === 'client') && verifications.clientAuthorizations.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  Client Authorizations ({verifications.clientAuthorizations.length})
                </h2>
                <div className="space-y-4">
                  {verifications.clientAuthorizations.map((auth: any) => (
                    <Card key={auth.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                              <Users className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                  {auth.ClientCompany?.name}
                                </h3>
                                {getStatusBadge(auth.status)}
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                Agency: {auth.AgencyCompany?.name}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                Submitted {new Date(auth.createdAt).toLocaleDateString()} • 
                                {auth.contractStartDate && auth.contractEndDate && (
                                  <> Contract: {new Date(auth.contractStartDate).toLocaleDateString()} - {new Date(auth.contractEndDate).toLocaleDateString()}</>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedItem({ ...auth, type: 'client' })
                                setShowDetailsDialog(true)
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            
                            {(auth.status === 'pending_admin_review' || auth.status === 'pending_client_confirm') && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    setSelectedItem({ ...auth, type: 'client' })
                                    setShowApproveDialog(true)
                                  }}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedItem({ ...auth, type: 'client' })
                                    setShowRejectDialog(true)
                                  }}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {!loadingData && verifications.agencies.length === 0 && verifications.clientAuthorizations.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">No verifications found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-6 mt-6">
            {/* Show only pending items */}
            {loadingData ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-slate-600">Loading pending verifications...</p>
              </div>
            ) : (
              <>
                {verifications.agencies.filter((a: any) => a.verificationStatus === 'pending' || a.verificationStatus === 'pending_manual_review').length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Pending Agency KYC</h2>
                    <div className="space-y-4">
                      {verifications.agencies
                        .filter((a: any) => a.verificationStatus === 'pending' || a.verificationStatus === 'pending_manual_review')
                        .map((agency: any) => (
                          <Card key={agency.id} className="border-yellow-200 dark:border-yellow-800">
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4 flex-1">
                                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-yellow-600" />
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{agency.name}</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                      {agency.industry} • Submitted {new Date(agency.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => { setSelectedItem({ ...agency, type: 'agency' }); setShowApproveDialog(true); }}>
                                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => { setSelectedItem({ ...agency, type: 'agency' }); setShowRejectDialog(true); }}>
                                    <XCircle className="w-4 h-4 mr-1" /> Reject
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                )}

                {verifications.clientAuthorizations.filter((a: any) => a.status === 'pending_admin_review' || a.status === 'pending_client_confirm').length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 mt-8">Pending Client Authorizations</h2>
                    <div className="space-y-4">
                      {verifications.clientAuthorizations
                        .filter((a: any) => a.status === 'pending_admin_review' || a.status === 'pending_client_confirm')
                        .map((auth: any) => (
                          <Card key={auth.id} className="border-blue-200 dark:border-blue-800">
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4 flex-1">
                                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-blue-600" />
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{auth.ClientCompany?.name}</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                      Agency: {auth.AgencyCompany?.name} • Submitted {new Date(auth.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => { setSelectedItem({ ...auth, type: 'client' }); setShowApproveDialog(true); }}>
                                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => { setSelectedItem({ ...auth, type: 'client' }); setShowRejectDialog(true); }}>
                                    <XCircle className="w-4 h-4 mr-1" /> Reject
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                )}

                {verifications.agencies.filter((a: any) => a.verificationStatus === 'pending' || a.verificationStatus === 'pending_manual_review').length === 0 &&
                 verifications.clientAuthorizations.filter((a: any) => a.status === 'pending_admin_review' || a.status === 'pending_client_confirm').length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-400">No pending verifications! All caught up.</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Approve Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve {selectedItem?.type === 'agency' ? 'Agency' : 'Client Authorization'}</DialogTitle>
              <DialogDescription>
                You are about to approve {selectedItem?.name || selectedItem?.ClientCompany?.name}.
                This action will grant them access to post jobs.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes (optional)</label>
                <Textarea
                  placeholder="Add any internal notes..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApproveDialog(false)} disabled={processing}>
                Cancel
              </Button>
              <Button onClick={handleApprove} disabled={processing}>
                {processing ? 'Processing...' : 'Approve'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject {selectedItem?.type === 'agency' ? 'Agency' : 'Client Authorization'}</DialogTitle>
              <DialogDescription>
                You are about to reject {selectedItem?.name || selectedItem?.ClientCompany?.name}.
                Please provide a reason for rejection.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Rejection Reason *</label>
                <Textarea
                  placeholder="Enter the reason for rejection (will be sent to the agency)..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={processing}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={processing || !rejectReason.trim()}>
                {processing ? 'Processing...' : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}


