"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Building2, Plus, CheckCircle, Clock, XCircle, AlertTriangle, Calendar, Briefcase, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiService } from '@/lib/api'
import { EmployerAuthGuard } from '@/components/employer-auth-guard'
import { EmployerDashboardNavbar } from '@/components/employer-dashboard-navbar'
import { EmployerDashboardFooter } from '@/components/employer-dashboard-footer'
import { useAuth } from '@/hooks/useAuth'

export default function ManageClientsPage() {
  return (
    <EmployerAuthGuard>
      <ManageClientsContent />
    </EmployerAuthGuard>
  )
}

function ManageClientsContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [isAgency, setIsAgency] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAgencyStatus()
  }, [user])

  const checkAgencyStatus = async () => {
    try {
      if (!user?.companyId) {
        setIsAgency(false)
        setError('You are not associated with a company')
        setLoading(false)
        return
      }

      const companyResponse = await apiService.getCompany(user.companyId)
      if (companyResponse.success && companyResponse.data) {
        const company = companyResponse.data
        const agencyCheck = company.companyAccountType === 'recruiting_agency' || 
                           company.companyAccountType === 'consulting_firm'
        setIsAgency(agencyCheck)
        
        if (agencyCheck) {
          loadClients()
        } else {
          setError('This page is only available for recruiting agencies and consulting firms')
          setLoading(false)
        }
      } else {
        setIsAgency(false)
        setError('Failed to load company information')
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Error checking agency status:', error)
      setIsAgency(false)
      setError('Failed to verify agency status')
      setLoading(false)
    }
  }

  const loadClients = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.getAgencyClients()
      
      if (response.success) {
        setClients(response.data || [])
      } else {
        setError(response.message || 'Failed to load clients')
        toast.error(response.message || 'Failed to load clients')
      }
    } catch (error: any) {
      console.error('Error loading clients:', error)
      const errorMessage = error.message || 'Failed to load clients'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Filter clients by status
  const getFilteredClients = (status: string) => {
    if (status === 'all') return clients
    if (status === 'active') return clients.filter((c: any) => c.status === 'active')
    if (status === 'pending') return clients.filter((c: any) => c.status.includes('pending'))
    if (status === 'expired') return clients.filter((c: any) => c.status === 'expired' || c.status === 'revoked')
    return clients
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>
      case 'pending':
      case 'pending_client_confirm':
      case 'pending_admin_review':
        return <Badge className="bg-yellow-600"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
      case 'expired':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Expired</Badge>
      case 'revoked':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Revoked</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Calculate stats
  const stats = {
    total: clients.length,
    active: clients.filter((c: any) => c.status === 'active').length,
    pending: clients.filter((c: any) => c.status.includes('pending')).length,
    expired: clients.filter((c: any) => c.status === 'expired' || c.status === 'revoked').length
  }

  // Render client card
  const ClientCard = ({ client }: { client: any }) => {
    const daysUntilExpiry = client.contractEndDate 
      ? Math.ceil((new Date(client.contractEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null

    return (
      <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)] transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {client.ClientCompany?.logo ? (
                <img 
                  src={client.ClientCompany.logo} 
                  alt={client.ClientCompany.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg">{client.ClientCompany?.name || 'Unknown Company'}</h3>
                <p className="text-sm text-gray-500">{client.ClientCompany?.industry} • {client.ClientCompany?.city}</p>
              </div>
            </div>
            {getStatusBadge(client.status)}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Contract Period
              </p>
              <p className="font-medium">
                {client.contractStartDate && new Date(client.contractStartDate).toLocaleDateString()} - {' '}
                {client.contractEndDate && new Date(client.contractEndDate).toLocaleDateString()}
              </p>
              {daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry < 30 && (
                <p className="text-xs text-amber-600 mt-1">⚠️ Expires in {daysUntilExpiry} days</p>
              )}
            </div>
            
            <div>
              <p className="text-gray-500 flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                Jobs Posted
              </p>
              <p className="font-medium">
                {client.jobsPosted || 0}
                {client.maxActiveJobs && ` / ${client.maxActiveJobs}`}
              </p>
            </div>
          </div>

          {client.status === 'active' && client.canPostJobs && (
            <div className="mt-4 flex gap-2">
              <Button 
                size="sm" 
                onClick={() => router.push(`/employer-dashboard/post-job?clientId=${client.id}`)}
                className="flex-1"
              >
                Post Job for this Client
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => router.push(`/employer-dashboard/manage-clients/${client.id}`)}
              >
                View Details
              </Button>
            </div>
          )}

          {client.status.includes('pending') && (
            <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                {client.status === 'pending_client_confirm' && '⏳ Waiting for client to confirm authorization'}
                {client.status === 'pending_admin_review' && '⏳ Admin reviewing authorization documents'}
                {client.status === 'pending' && '⏳ Verification in progress'}
              </p>
            </div>
          )}

          {client.status === 'expired' && (
            <div className="mt-4">
              <Button 
                size="sm" 
                variant="outline"
                className="w-full"
                onClick={() => toast.info('Contact client to renew authorization')}
              >
                Renew Authorization
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-hidden">
      {/* Background Effects - Blue theme matching employer dashboard */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200/45 via-cyan-200/35 to-indigo-200/45"></div>
        <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-300/10 to-cyan-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-indigo-300/10 to-violet-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-cyan-300/10 to-blue-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/4 left-0 right-0 h-24 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-indigo-400/20"></div>
      </div>
      
      <EmployerDashboardNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-16 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              Manage Clients
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              View and manage your authorized client companies
            </p>
          </div>
          
          {isAgency && (
            <Button
              onClick={() => router.push('/employer-dashboard/add-client')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Client
            </Button>
          )}
        </div>

        {/* Error State - Not an Agency */}
        {isAgency === false && (
          <Card className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)]">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Agency Access Required
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {error || 'This page is only available for recruiting agencies and consulting firms.'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mb-6">
                If you are a recruiting agency or consulting firm, please ensure your company account type is set correctly.
              </p>
              <Button
                onClick={() => router.push('/employer-dashboard')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && isAgency === null && (
          <Card className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)]">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading client information...</p>
            </CardContent>
          </Card>
        )}

        {/* Main Content - Only show if agency */}
        {isAgency === true && (
          <>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)] transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Clients</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)] transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)] transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)] transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Expired</p>
                  <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients List */}
        <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)] transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Client Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                <TabsTrigger value="expired">Expired ({stats.expired})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : getFilteredClients(activeTab).length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No clients found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {activeTab === 'all' && "You haven't added any clients yet"}
                      {activeTab === 'active' && "You don't have any active clients"}
                      {activeTab === 'pending' && "No pending authorizations"}
                      {activeTab === 'expired' && "No expired authorizations"}
                    </p>
                    {activeTab === 'all' && (
                      <Button onClick={() => router.push('/employer-dashboard/add-client')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Client
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getFilteredClients(activeTab).map((client: any) => (
                      <ClientCard key={client.id} client={client} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
          </>
        )}
      </div>
      
      <EmployerDashboardFooter />
    </div>
  )
}

