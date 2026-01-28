"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { apiService } from "@/lib/api"
import { toast } from "sonner"
import {
  Bell,
  BellRing,
  CheckCircle2,
  XCircle,
  Users,
  Building2,
  UserPlus,
  Briefcase,
  AlertTriangle,
  Shield,
  TrendingUp,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Calendar,
  Clock,
  ArrowLeft
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

interface AdminNotification {
  id: string
  type: string
  title: string
  message: string
  shortMessage: string
  isRead: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'registration' | 'verification' | 'milestone' | 'system' | 'security'
  actionUrl?: string
  actionText?: string
  icon?: string
  metadata: any
  createdAt: string
  readAt?: string
  relatedUser?: {
    id: string
    email: string
    first_name: string
    last_name: string
    user_type: string
  }
  relatedCompany?: {
    id: string
    name: string
    industry: string
    companySize: string
  }
  triggeredByAdmin?: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
}

interface NotificationStats {
  total: number
  unread: number
  byCategory: Record<string, number>
  byPriority: Record<string, number>
}

export default function AdminNotificationsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null)
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [selectedReadStatus, setSelectedReadStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (authLoading) return

    if (!user || (user.userType !== 'admin' && user.userType !== 'superadmin')) {
      router.push('/admin-login')
      return
    }

    loadNotifications()
    loadStats()
  }, [user, authLoading, router, selectedCategory, selectedPriority, selectedReadStatus, currentPage])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      // Load notifications from backend using API service
      const response = await apiService.getAdminNotifications({
        page: currentPage,
        limit: 20,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        priority: selectedPriority === 'all' ? undefined : selectedPriority,
        isRead: selectedReadStatus === 'all' ? undefined : selectedReadStatus === 'read'
      })
      
      if (response.success && response.data) {
        setNotifications(response.data)
        setTotalPages((response as any).pagination?.totalPages || 1)
      } else {
        setError(response.message || 'Failed to load notifications')
        setNotifications([])
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      setError('Failed to load notifications. Please try again later.')
      setNotifications([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await apiService.getAdminNotificationStats()
      
      if (response.success && response.data) {
        setStats(response.data)
      } else {
        setStats({
          total: 0,
          unread: 0,
          byCategory: {},
          byPriority: {}
        })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
      setStats({
        total: 0,
        unread: 0,
        byCategory: {},
        byPriority: {}
      })
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      setMarkingAsRead(notificationId)
      const response = await apiService.markAdminNotificationAsRead(notificationId)

      if (response.success) {
      // Update local state
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      ))
      
      // Update stats
      if (stats) {
        setStats(prev => prev ? { ...prev, unread: Math.max(0, prev.unread - 1) } : null)
      }

      toast.success('Notification marked as read')
      } else {
        toast.error(response.message || 'Failed to mark as read')
      }
    } catch (error) {
      console.error('Error marking as read:', error)
      toast.error('Failed to mark as read')
    } finally {
      setMarkingAsRead(null)
    }
  }

  const markAllAsRead = async () => {
    try {
      setMarkingAllAsRead(true)
      const response = await apiService.markAllAdminNotificationsAsRead()

      if (response.success) {
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
      
      // Update stats
      if (stats) {
        setStats(prev => prev ? { ...prev, unread: 0 } : null)
      }

      toast.success('All notifications marked as read')
      } else {
        toast.error(response.message || 'Failed to mark all as read')
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark all as read')
    } finally {
      setMarkingAllAsRead(false)
    }
  }

  const refreshNotifications = async () => {
    try {
      setRefreshing(true)
      await Promise.all([loadNotifications(), loadStats()])
      toast.success('Notifications refreshed')
    } catch (error) {
      console.error('Error refreshing notifications:', error)
      toast.error('Failed to refresh notifications')
    } finally {
      setRefreshing(false)
    }
  }

  const getNotificationIcon = (type: string, icon?: string) => {
    if (icon) {
      const iconMap: Record<string, any> = {
        'user-plus': UserPlus,
        'briefcase': Briefcase,
        'building-2': Building2,
        'check-circle': CheckCircle2,
        'x-circle': XCircle,
        'users': Users,
        'alert-triangle': AlertTriangle,
        'shield-alert': Shield,
        'trending-up': TrendingUp,
        'bell': Bell
      }
      const IconComponent = iconMap[icon] || Bell
      return <IconComponent className="w-5 h-5" />
    }

    const typeIconMap: Record<string, any> = {
      'new_admin_registration': UserPlus,
      'new_employer_registration': Briefcase,
      'new_company_registration': Building2,
      'company_verification_approved': CheckCircle2,
      'company_verification_rejected': XCircle,
      'jobseeker_milestone_10': Users,
      'jobseeker_milestone_50': Users,
      'jobseeker_milestone_100': Users,
      'jobseeker_milestone_500': Users,
      'jobseeker_milestone_1000': Users,
      'jobseeker_milestone_5000': Users,
      'jobseeker_milestone_10000': Users,
      'system_alert': AlertTriangle,
      'security_alert': Shield,
      'performance_alert': TrendingUp
    }
    
    const IconComponent = typeIconMap[type] || Bell
    return <IconComponent className="w-5 h-5" />
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    }
    return colors[priority as keyof typeof colors] || colors.medium
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      registration: 'bg-green-100 text-green-800',
      verification: 'bg-blue-100 text-blue-800',
      milestone: 'bg-purple-100 text-purple-800',
      system: 'bg-gray-100 text-gray-800',
      security: 'bg-red-100 text-red-800'
    }
    return colors[category as keyof typeof colors] || colors.system
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query) ||
        notification.relatedUser?.email.toLowerCase().includes(query) ||
        notification.relatedCompany?.name.toLowerCase().includes(query)
      )
    }
    return true
  })

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center">
        <div className="text-gray-900 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/super-admin/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-900 hover:bg-gray-100">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <BellRing className="w-8 h-8 mr-3" />
                  Admin Notifications
                </h1>
                <p className="text-gray-600 mt-1">
                  Stay updated with platform activities and important events
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={refreshNotifications}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="text-gray-900 border-gray-300 hover:bg-gray-100"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {stats && stats.unread > 0 && (
                <Button
                  onClick={markAllAsRead}
                  disabled={markingAllAsRead}
                  variant="default"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark All Read
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Notifications</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <Bell className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Unread</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.unread}</p>
                  </div>
                  <BellRing className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Registrations</p>
                    <p className="text-3xl font-bold text-green-600">{stats.byCategory.registration || 0}</p>
                  </div>
                  <UserPlus className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Verifications</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.byCategory.verification || 0}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="bg-white border-gray-200 shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-gray-700 text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-gray-700 text-sm font-medium mb-2 block">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="registration">Registration</SelectItem>
                    <SelectItem value="verification">Verification</SelectItem>
                    <SelectItem value="milestone">Milestone</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-gray-700 text-sm font-medium mb-2 block">Priority</label>
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-gray-700 text-sm font-medium mb-2 block">Status</label>
                <Select value={selectedReadStatus} onValueChange={setSelectedReadStatus}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSelectedCategory('all')
                    setSelectedPriority('all')
                    setSelectedReadStatus('all')
                    setSearchQuery('')
                    setCurrentPage(1)
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full text-gray-900 border-gray-300 hover:bg-gray-100"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-12 text-center">
                <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No notifications found</h3>
                <p className="text-gray-600">
                  {searchQuery || selectedCategory !== 'all' || selectedPriority !== 'all' || selectedReadStatus !== 'all'
                    ? 'Try adjusting your filters to see more notifications.'
                    : 'You\'re all caught up! New notifications will appear here.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`bg-white border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md ${
                  !notification.isRead ? 'ring-2 ring-blue-500/50' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-full ${
                      notification.isRead ? 'bg-gray-100' : 'bg-blue-100'
                    }`}>
                      {getNotificationIcon(notification.type, notification.icon)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className={`text-lg font-semibold ${
                              notification.isRead ? 'text-gray-600' : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          
                          <p className={`text-sm mb-3 ${
                            notification.isRead ? 'text-gray-500' : 'text-gray-700'
                          }`}>
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(notification.createdAt)}</span>
                            </div>
                            
                            <Badge className={getCategoryColor(notification.category)}>
                              {notification.category}
                            </Badge>
                            
                            <Badge className={getPriorityColor(notification.priority)}>
                              {notification.priority}
                            </Badge>
                            
                            {notification.relatedUser && (
                              <span>User: {notification.relatedUser.email}</span>
                            )}
                            
                            {notification.relatedCompany && (
                              <span>Company: {notification.relatedCompany.name}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {notification.actionUrl && (
                            <Link href={notification.actionUrl}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-gray-900 border-gray-300 hover:bg-gray-100"
                              >
                                {notification.actionText || 'View'}
                              </Button>
                            </Link>
                          )}
                          
                          {!notification.isRead && (
                            <Button
                              onClick={() => markAsRead(notification.id)}
                              disabled={markingAsRead === notification.id}
                              variant="ghost"
                              size="sm"
                              className="text-gray-900 hover:bg-gray-100"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="text-gray-900 border-gray-300 hover:bg-gray-100"
              >
                Previous
              </Button>
              
              <span className="text-gray-900 px-4">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="text-gray-900 border-gray-300 hover:bg-gray-100"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
