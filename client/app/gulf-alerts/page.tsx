"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Bell, ArrowLeft, Plus, Search, MapPin, Briefcase, DollarSign, Edit, Trash2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { apiService, JobAlert } from '@/lib/api'

export default function GulfAlertsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [alerts, setAlerts] = useState<JobAlert[]>([])
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAlert, setEditingAlert] = useState<JobAlert | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    keywords: '',
    locations: 'Dubai, Abu Dhabi, Doha',
    categories: '',
    jobType: '',
    experienceLevel: 'any',
    salaryMin: '',
    salaryMax: '',
    currency: 'AED',
    remoteWork: 'any' as 'on_site' | 'hybrid' | 'remote' | 'any',
    maxResults: 10,
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    isActive: true,
  })

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please sign in to manage Gulf job alerts')
      router.replace('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && !loading) {
      fetchAlerts()
    }
  }, [user, loading])

  const fetchAlerts = async () => {
    try {
      setAlertsLoading(true)
      const resp = await apiService.getGulfJobAlerts()
      if (resp.success && resp.data) {
        setAlerts(resp.data.alerts || [])
      } else {
        setAlerts([])
      }
    } catch (err) {
      console.error('Error fetching Gulf alerts:', err)
      setAlerts([])
    } finally {
      setAlertsLoading(false)
    }
  }

  const resetForm = () => {
    setForm({
      name: '',
      keywords: '',
      locations: 'Dubai, Abu Dhabi, Doha',
      categories: '',
      jobType: '',
      experienceLevel: 'any',
      salaryMin: '',
      salaryMax: '',
      currency: 'AED',
      remoteWork: 'any',
      maxResults: 10,
      frequency: 'weekly',
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      isActive: true,
    })
  }

  const toPayload = () => ({
    keywords: form.keywords ? form.keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
    location: form.locations,
    jobType: form.jobType ? form.jobType.split(',').map(t => t.trim()) : [],
    experienceLevel: form.experienceLevel === 'any' ? undefined : form.experienceLevel,
    salaryMin: form.salaryMin ? parseInt(form.salaryMin) : undefined,
    salaryMax: form.salaryMax ? parseInt(form.salaryMax) : undefined,
    isActive: form.isActive,
  })

  const handleCreateOrUpdate = async () => {
    try {
      setSubmitting(true)
      if (!form.name.trim()) {
        toast.error('Alert name is required')
        return
      }
      const payload = toPayload()
      if (editingAlert) {
        const resp = await apiService.updateGulfJobAlert(editingAlert.id, payload)
        if (resp.success) {
          toast.success('Gulf job alert updated')
          setEditingAlert(null)
          setShowForm(false)
          resetForm()
          fetchAlerts()
        } else {
          toast.error(resp.message || 'Failed to update alert')
        }
      } else {
        const resp = await apiService.createGulfJobAlert(payload as any)
        if (resp.success) {
          toast.success('Gulf job alert created')
          setShowForm(false)
          resetForm()
          fetchAlerts()
        } else {
          toast.error(resp.message || 'Failed to create alert')
        }
      }
    } catch (err: any) {
      console.error('Gulf alert submit error:', err)
      toast.error(err?.message || 'Failed to submit alert')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const resp = await apiService.deleteGulfJobAlert(id)
      if (resp.success) {
        toast.success('Alert deleted')
        fetchAlerts()
      } else {
        toast.error(resp.message || 'Failed to delete alert')
      }
    } catch (err) {
      console.error('Delete error:', err)
      toast.error('Failed to delete alert')
    }
  }

  const handleToggle = async (alert: JobAlert) => {
    try {
      const resp = await apiService.updateGulfJobAlert(alert.id, { isActive: !alert.isActive })
      if (resp.success) {
        fetchAlerts()
      } else {
        toast.error(resp.message || 'Failed to toggle alert')
      }
    } catch (err) {
      console.error('Toggle error:', err)
      toast.error('Failed to toggle alert')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/30 to-teal-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Navbar />
      <div className="pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Link href="/jobseeker-gulf-dashboard">
                  <Button variant="ghost" size="sm" className="text-green-700">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Gulf Dashboard
                  </Button>
                </Link>
              </div>
              <Button onClick={() => { setShowForm(true); setEditingAlert(null); }} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" /> Create Alert
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Gulf Job Alerts</h1>
            <p className="text-slate-600 dark:text-slate-300">Manage alerts for Gulf region jobs</p>
          </div>

          {(showForm || editingAlert) && (
            <Card className="mb-8 bg-white/80 dark:bg-slate-800/80 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-green-700">{editingAlert ? 'Edit Gulf Job Alert' : 'Create Gulf Job Alert'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Alert Name</Label>
                    <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Dubai React Jobs" />
                  </div>
                  <div>
                    <Label htmlFor="keywords">Keywords</Label>
                    <Input id="keywords" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="e.g., React, Node.js" />
                  </div>
                  <div>
                    <Label htmlFor="locations">Locations</Label>
                    <Input id="locations" value={form.locations} onChange={(e) => setForm({ ...form, locations: e.target.value })} placeholder="e.g., Dubai, Abu Dhabi" />
                  </div>
                  <div>
                    <Label htmlFor="categories">Categories</Label>
                    <Input id="categories" value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} placeholder="e.g., Technology, Engineering" />
                  </div>
                  <div>
                    <Label htmlFor="jobType">Job Type</Label>
                    <Input id="jobType" value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })} placeholder="e.g., Full-time, Contract" />
                  </div>
                  <div>
                    <Label htmlFor="experienceLevel">Experience Level</Label>
                    <Select value={form.experienceLevel} onValueChange={(v) => setForm({ ...form, experienceLevel: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="fresher">Fresher</SelectItem>
                        <SelectItem value="junior">Junior</SelectItem>
                        <SelectItem value="mid">Mid</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="maxResults">Max Results</Label>
                    <Input id="maxResults" type="number" value={form.maxResults} onChange={(e) => setForm({ ...form, maxResults: parseInt(e.target.value) || 10 })} />
                  </div>
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={form.frequency} onValueChange={(v: 'daily' | 'weekly' | 'monthly') => setForm({ ...form, frequency: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="salaryMin">Minimum Salary (AED)</Label>
                    <Input id="salaryMin" type="number" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="salaryMax">Maximum Salary (AED)</Label>
                    <Input id="salaryMax" type="number" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Notification Settings</Label>
                  <div className="flex items-center space-x-2">
                    <Switch id="emailEnabled" checked={form.emailEnabled} onCheckedChange={(checked) => setForm({ ...form, emailEnabled: checked })} />
                    <Label htmlFor="emailEnabled">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="pushEnabled" checked={form.pushEnabled} onCheckedChange={(checked) => setForm({ ...form, pushEnabled: checked })} />
                    <Label htmlFor="pushEnabled">Push</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="smsEnabled" checked={form.smsEnabled} onCheckedChange={(checked) => setForm({ ...form, smsEnabled: checked })} />
                    <Label htmlFor="smsEnabled">SMS</Label>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleCreateOrUpdate} disabled={submitting} className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" /> {editingAlert ? 'Update Alert' : 'Create Alert'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setShowForm(false); setEditingAlert(null); resetForm(); }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alerts List */}
          {alertsLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <Card key={i} className="bg-white/80 dark:bg-slate-800/80 border-green-200 dark:border-green-800">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <Card className="bg-white/80 dark:bg-slate-800/80 border-green-200 dark:border-green-800">
              <CardContent className="p-12 text-center">
                <Bell className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Gulf alerts yet</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">Create your first alert to get notified about new Gulf jobs</p>
                <Button onClick={() => { setShowForm(true); setEditingAlert(null); }} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" /> Create Alert
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card key={alert.id} className="bg-white/80 dark:bg-slate-800/80 border-green-200 dark:border-green-800">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{alert.name || (alert as any).title || 'Gulf Alert'}</h3>
                          <Badge variant={alert.isActive ? 'default' : 'secondary'}>{alert.isActive ? 'Active' : 'Inactive'}</Badge>
                          <Badge variant="outline" className="capitalize">{(alert as any).frequency || 'weekly'}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-300">
                          {(alert as any).keywords && (
                            <div className="flex items-center space-x-1">
                              <Search className="w-4 h-4" />
                              <span>{Array.isArray((alert as any).keywords) ? (alert as any).keywords.join(', ') : (alert as any).keywords}</span>
                            </div>
                          )}
                          {(alert as any).locations && ((alert as any).locations.length > 0) && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{(alert as any).locations.join(', ')}</span>
                            </div>
                          )}
                          {(alert as any).experienceLevel && (
                            <div className="flex items-center space-x-1">
                              <Briefcase className="w-4 h-4" />
                              <span className="capitalize">{(alert as any).experienceLevel}</span>
                            </div>
                          )}
                          {((alert as any).salaryMin || (alert as any).salaryMax) && (
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4" />
                              <span>
                                {(alert as any).salaryMin && `AED ${(alert as any).salaryMin.toLocaleString()}`}
                                {(alert as any).salaryMin && (alert as any).salaryMax && ' - '}
                                {(alert as any).salaryMax && `AED ${(alert as any).salaryMax.toLocaleString()}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button variant={alert.isActive ? 'outline' : 'default'} size="sm" onClick={() => handleToggle(alert)}>
                          {alert.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          setEditingAlert(alert)
                          setShowForm(true)
                          setForm({
                            name: alert.name || '',
                            keywords: Array.isArray((alert as any).keywords) ? (alert as any).keywords.join(', ') : ((alert as any).keywords || ''),
                            locations: ((alert as any).locations && (alert as any).locations.length > 0) ? (alert as any).locations.join(', ') : 'Dubai, Abu Dhabi, Doha',
                            categories: (alert as any).categories ? (alert as any).categories.join(', ') : '',
                            jobType: Array.isArray((alert as any).jobType) ? (alert as any).jobType.join(', ') : ((alert as any).jobType || ''),
                            experienceLevel: (alert as any).experienceLevel || 'any',
                            salaryMin: (alert as any).salaryMin ? String((alert as any).salaryMin) : '',
                            salaryMax: (alert as any).salaryMax ? String((alert as any).salaryMax) : '',
                            currency: 'AED',
                            remoteWork: ((alert as any).remoteWork || 'any') as any,
                            maxResults: (alert as any).maxResults || 10,
                            frequency: (alert as any).frequency || 'weekly',
                            emailEnabled: (alert as any).emailEnabled ?? true,
                            pushEnabled: (alert as any).pushEnabled ?? true,
                            smsEnabled: (alert as any).smsEnabled ?? false,
                            isActive: alert.isActive ?? true,
                          })
                        }}>
                          <Edit className="w-4 h-4 mr-1" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(alert.id)}>
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

