"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Bell,
  Mail,
  Smartphone,
  Save,
  Briefcase,
  FileText,
  Eye,
  ArrowUp,
  CheckCircle,
  Star,
  Building2,
  MessageCircle,
  Settings,
  Calendar,
  Video,
  Phone,
  MapPin,
  UserCheck,
  Clock,
  XCircle
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { toast } from 'sonner'
import { apiService } from '@/lib/api'

export default function NotificationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    jobAlerts: true,
    applicationUpdates: true,
    profileViews: true,
    interviewScheduled: true,
    interviewReminders: true,
    marketingEmails: false
  })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications')

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please sign in to manage notifications')
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && !loading) {
      fetchNotifications()

      // Auto-refresh to surface new notifications (e.g., shortlisted) promptly
      const intervalId = setInterval(() => {
        fetchNotifications()
      }, 30000)

      return () => clearInterval(intervalId)
    }
  }, [user, loading])

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true)
      const response = await apiService.getNotifications()
      if (response.success && response.data) {
        // Prioritize shortlisted types at the top, then by recency
        const prioritized = [...response.data].sort((a: any, b: any) => {
          const isShortA = a.type === 'candidate_shortlisted' || a.type === 'application_shortlisted'
          const isShortB = b.type === 'candidate_shortlisted' || b.type === 'application_shortlisted'
          if (isShortA !== isShortB) return isShortA ? -1 : 1
          return new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime()
        })
        setNotifications(prioritized)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setNotificationsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      // Here you would typically save to backend
      // For now, we'll just show a success message
      toast.success('Notification settings updated successfully')
    } catch (error) {
      console.error('Error updating notification settings:', error)
      toast.error('Failed to update notification settings')
    } finally {
      setSaving(false)
    }
  }

  const getNotificationIcon = (type: string, icon?: string) => {
    if (icon) {
      switch (icon) {
        case 'arrow-up': return <ArrowUp className="w-5 h-5" />
        case 'eye': return <Eye className="w-5 h-5" />
        case 'briefcase': return <Briefcase className="w-5 h-5" />
        case 'check-circle': return <CheckCircle className="w-5 h-5" />
        case 'star': return <Star className="w-5 h-5" />
        case 'building': return <Building2 className="w-5 h-5" />
        case 'message-circle': return <MessageCircle className="w-5 h-5" />
        case 'calendar': return <Calendar className="w-5 h-5" />
        case 'video': return <Video className="w-5 h-5" />
        case 'phone': return <Phone className="w-5 h-5" />
        case 'map-pin': return <MapPin className="w-5 h-5" />
        case 'user-check': return <UserCheck className="w-5 h-5" />
        case 'clock': return <Clock className="w-5 h-5" />
        case 'x-circle': return <XCircle className="w-5 h-5" />
        default: return <Bell className="w-5 h-5" />
      }
    }
    
    switch (type) {
      case 'profile_view': return <Eye className="w-5 h-5" />
      case 'job_application': return <Briefcase className="w-5 h-5" />
      case 'application_status': return <CheckCircle className="w-5 h-5" />
      case 'job_recommendation': return <Star className="w-5 h-5" />
      case 'company_update': return <Building2 className="w-5 h-5" />
      case 'message': return <MessageCircle className="w-5 h-5" />
      case 'interview_scheduled': return <Calendar className="w-5 h-5" />
      case 'interview_cancelled': return <Calendar className="w-5 h-5" />
      case 'interview_reminder': return <Calendar className="w-5 h-5" />
      case 'candidate_shortlisted': return <UserCheck className="w-5 h-5" />
      case 'application_shortlisted': return <CheckCircle className="w-5 h-5" />
      default: return <Bell className="w-5 h-5" />
    }
  }

  const getNotificationColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100 dark:bg-red-900/30'
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30'
      case 'medium': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
      case 'low': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30'
      default: return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Recently'
    
    const date = new Date(dateString)
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString)
      return 'Recently'
    }
    
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    
    // Handle future dates
    if (diffInMs < 0) return 'Just now'
    
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInDays < 7) return `${diffInDays}d ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}mo ago`
    return `${Math.floor(diffInDays / 365)}y ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-300">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-auto">
      <Navbar />
      
      {/* Welcome Back Div Style Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-200/45 via-blue-200/35 to-indigo-200/45"></div>
        <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-purple-300/10 to-blue-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-blue-300/10 to-indigo-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-indigo-300/10 to-purple-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/4 left-0 right-0 h-24 bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-indigo-400/20"></div>
      </div>
      
      <div className="pt-20 pb-12 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link href={user?.region === 'gulf' ? (user?.userType === 'employer' ? '/gulf-dashboard' : '/jobseeker-gulf-dashboard') : '/dashboard'}>
                <Button variant="ghost" size="sm" className="hover:bg-slate-200 dark:hover:bg-slate-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Notifications
                </h1>
                <p className="text-slate-600 dark:text-slate-300">
                  View your notifications and manage notification settings
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-sm">
                  <Bell className="w-3 h-3 mr-1" />
                  {notifications.filter(n => !n.isRead).length} unread
                </Badge>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Bell className="w-4 h-4 inline mr-2" />
                Notifications
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Settings
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'notifications' ? (
            <div className="space-y-6">
              {/* Notifications List */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <Bell className="w-5 h-5" />
                      <span>Recent Notifications</span>
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchNotifications}
                      disabled={notificationsLoading}
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {notificationsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-slate-600 dark:text-slate-300">Loading notifications...</span>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No notifications</h3>
                      <p className="text-slate-600 dark:text-slate-300">
                        You're all caught up! New notifications will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border transition-colors ${
                            notification.isRead 
                              ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600' 
                              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getNotificationColor(notification.priority)}`}>
                              {getNotificationIcon(notification.type, notification.icon)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                  {notification.title}
                                </h4>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {formatTimeAgo(notification.createdAt || notification.created_at)}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                {notification.message}
                              </p>
                              {notification.priority === 'urgent' && (
                                <Badge variant="destructive" className="mt-2 text-xs">
                                  Urgent
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Notification Channels */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="w-5 h-5" />
                    <span>Notification Channels</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <Label htmlFor="email-notifications" className="text-base font-medium">
                            Email Notifications
                          </Label>
                          <p className="text-sm text-slate-500">Receive notifications via email</p>
                        </div>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => 
                          setSettings({ ...settings, emailNotifications: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                          <Bell className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <Label htmlFor="push-notifications" className="text-base font-medium">
                            Push Notifications
                          </Label>
                          <p className="text-sm text-slate-500">Receive notifications in your browser</p>
                        </div>
                      </div>
                      <Switch
                        id="push-notifications"
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) => 
                          setSettings({ ...settings, pushNotifications: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <Label htmlFor="sms-notifications" className="text-base font-medium">
                            SMS Notifications
                          </Label>
                          <p className="text-sm text-slate-500">Receive notifications via SMS</p>
                        </div>
                      </div>
                      <Switch
                        id="sms-notifications"
                        checked={settings.smsNotifications}
                        onCheckedChange={(checked) => 
                          setSettings({ ...settings, smsNotifications: checked })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Types */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="w-5 h-5" />
                    <span>Notification Types</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <Label htmlFor="job-alerts" className="text-base font-medium">
                            Job Alerts
                          </Label>
                          <p className="text-sm text-slate-500">New job opportunities matching your criteria</p>
                        </div>
                      </div>
                      <Switch
                        id="job-alerts"
                        checked={settings.jobAlerts}
                        onCheckedChange={(checked) => 
                          setSettings({ ...settings, jobAlerts: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <Label htmlFor="application-updates" className="text-base font-medium">
                            Application Updates
                          </Label>
                          <p className="text-sm text-slate-500">Status changes for your job applications</p>
                        </div>
                      </div>
                      <Switch
                        id="application-updates"
                        checked={settings.applicationUpdates}
                        onCheckedChange={(checked) => 
                          setSettings({ ...settings, applicationUpdates: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Eye className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <Label htmlFor="profile-views" className="text-base font-medium">
                            Profile Views
                          </Label>
                          <p className="text-sm text-slate-500">When employers view your profile</p>
                        </div>
                      </div>
                      <Switch
                        id="profile-views"
                        checked={settings.profileViews}
                        onCheckedChange={(checked) => 
                          setSettings({ ...settings, profileViews: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <Label htmlFor="interview-scheduled" className="text-base font-medium">
                            Interview Scheduled
                          </Label>
                          <p className="text-sm text-slate-500">When an interview is scheduled for you</p>
                        </div>
                      </div>
                      <Switch
                        id="interview-scheduled"
                        checked={settings.interviewScheduled}
                        onCheckedChange={(checked) => 
                          setSettings({ ...settings, interviewScheduled: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                          <Bell className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <Label htmlFor="interview-reminders" className="text-base font-medium">
                            Interview Reminders
                          </Label>
                          <p className="text-sm text-slate-500">Reminders before your scheduled interviews</p>
                        </div>
                      </div>
                      <Switch
                        id="interview-reminders"
                        checked={settings.interviewReminders}
                        onCheckedChange={(checked) => 
                          setSettings({ ...settings, interviewReminders: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                          <Mail className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <Label htmlFor="marketing-emails" className="text-base font-medium">
                            Marketing Emails
                          </Label>
                          <p className="text-sm text-slate-500">Promotional content and newsletters</p>
                        </div>
                      </div>
                      <Switch
                        id="marketing-emails"
                        checked={settings.marketingEmails}
                        onCheckedChange={(checked) => 
                          setSettings({ ...settings, marketingEmails: checked })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Save Button - Only show on settings tab */}
          {activeTab === 'settings' && (
            <div className="flex justify-end mt-8">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
