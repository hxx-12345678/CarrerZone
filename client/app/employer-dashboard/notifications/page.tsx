"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bell, Check, X, Clock, AlertCircle, Info, CheckCircle, Loader2, RefreshCw, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { EmployerDashboardNavbar } from "@/components/employer-dashboard-navbar"
import { EmployerDashboardFooter } from "@/components/employer-dashboard-footer"
import { apiService } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"
import { toast } from "sonner"

export default function NotificationsPage() {
  const { user } = useAuth()

  return (
    <EmployerAuthGuard>
      <NotificationsPageContent user={user} />
    </EmployerAuthGuard>
  )
}

function NotificationsPageContent({ user }: { user: any }) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch notifications on component mount
  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user, pagination.page])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching employer notifications...')
      const response = await apiService.getEmployerNotifications(pagination.page, pagination.limit)
      
      if (response.success && response.data) {
        console.log('✅ Notifications fetched successfully:', response.data)
        setNotifications(response.data)
        
        // Update pagination if available
        if ((response as any).pagination) {
          setPagination(prev => ({
            ...prev,
            total: (response as any).pagination.total,
            pages: (response as any).pagination.pages
          }))
        }
      } else {
        console.error('❌ Failed to fetch notifications:', response)
        setError(response.message || 'Failed to fetch notifications')
        toast.error(response.message || 'Failed to fetch notifications')
      }
    } catch (error: any) {
      console.error('❌ Error fetching notifications:', error)
      setError('Failed to fetch notifications')
      toast.error('Failed to fetch notifications')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await apiService.markNotificationAsRead(id)
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === id ? { ...notification, isRead: true } : notification
          )
        )
        toast.success('Notification marked as read')
      } else {
        toast.error(response.message || 'Failed to mark notification as read')
      }
    } catch (error: any) {
      console.error('❌ Error marking notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await apiService.markAllNotificationsAsRead()
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        )
        toast.success('All notifications marked as read')
      } else {
        toast.error(response.message || 'Failed to mark all notifications as read')
      }
    } catch (error: any) {
      console.error('❌ Error marking all notifications as read:', error)
      toast.error('Failed to mark all notifications as read')
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const response = await apiService.deleteNotification(id)
      
      if (response.success) {
        setNotifications(prev => prev.filter(notification => notification.id !== id))
        toast.success('Notification deleted')
      } else {
        toast.error(response.message || 'Failed to delete notification')
      }
    } catch (error: any) {
      console.error('❌ Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const refreshNotifications = () => {
    setIsRefreshing(true)
    fetchNotifications()
  }

  const getNotificationIcon = (type: string, icon?: string) => {
    // Check for specific icon from metadata first
    if (icon === 'fire') {
      return <Flame className="w-5 h-5 text-orange-600" />
    }
    
    switch (type) {
      case "job_application":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "application_status":
        return <AlertCircle className="w-5 h-5 text-blue-600" />
      case "job_recommendation":
        return <Bell className="w-5 h-5 text-purple-600" />
      case "company_update":
        return <Info className="w-5 h-5 text-orange-600" />
      case "system":
        return <Info className="w-5 h-5 text-slate-600" />
      case "marketing":
        return <Bell className="w-5 h-5 text-pink-600" />
      default:
        return <Bell className="w-5 h-5 text-slate-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return date.toLocaleDateString()
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-auto">
      <EmployerDashboardNavbar />
      
      {/* Background Effects - Blue theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Base blue gradient overlay to ensure visible background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200/45 via-cyan-200/35 to-indigo-200/45"></div>
        <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-300/10 to-cyan-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-indigo-300/10 to-violet-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-cyan-300/10 to-blue-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        {/* Wide translucent blue gradient strip */}
        <div className="absolute top-1/3 left-0 right-0 h-24 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-indigo-400/20"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
              <p className="text-slate-600">
                {loading ? "Loading notifications..." : 
                 unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={refreshNotifications}
              variant="outline"
              disabled={isRefreshing}
              className="border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Check className="w-4 h-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)]">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4 animate-pulse">
                      <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)]">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Error loading notifications</h3>
                <p className="text-slate-600 text-center mb-4">{error}</p>
                <Button onClick={refreshNotifications} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : notifications.length === 0 ? (
            <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)]">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No notifications</h3>
                <p className="text-slate-600 text-center">
                  You're all caught up! New notifications will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)] transition-all duration-300 ${
                  !notification.isRead ? 'bg-blue-50/80 border-blue-200/60' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarFallback className="bg-slate-100">
                        {getNotificationIcon(notification.type, notification.metadata?.icon)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className={`font-semibold ${!notification.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                            <Badge variant="outline" className={`text-xs ${getPriorityColor(notification.priority)}`}>
                              {notification.priority}
                            </Badge>
                          </div>
                          <p className="text-slate-600 mb-3">{notification.message}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <span className="text-xs text-slate-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTimeAgo(notification.createdAt || notification.created_at)}
                              </span>
                              {notification.metadata?.action && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  {notification.metadata.action}
                                </Button>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-slate-600 hover:text-slate-900"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                                className="text-slate-600 hover:text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Load More */}
        {notifications.length > 0 && pagination.page < pagination.pages && (
          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              className="border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Load More Notifications
            </Button>
          </div>
        )}
      </div>

      <EmployerDashboardFooter />
    </div>
  )
} 