"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Bell, 
  Eye, 
  Briefcase, 
  CheckCircle, 
  Star, 
  Building2, 
  MessageCircle, 
  Calendar, 
  Video, 
  Phone, 
  MapPin,
  UserCheck,
  Clock,
  XCircle,
  ArrowRight,
  ArrowUp
} from 'lucide-react'
import { apiService } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  priority: string
  isRead: boolean
  createdAt: string
  icon?: string
  actionUrl?: string
  actionText?: string
}

interface RecentNotificationsProps {
  limit?: number
  showViewAll?: boolean
  className?: string
}

export function RecentNotifications({ 
  limit = 3, 
  showViewAll = true, 
  className = "" 
}: RecentNotificationsProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [latestSeenCreatedAt, setLatestSeenCreatedAt] = useState<string | null>(null)

  useEffect(() => {
    fetchNotifications(false)

    // Poll for new notifications periodically to simulate push updates
    const intervalId = setInterval(() => {
      fetchNotifications(true)
    }, 30000)

    return () => clearInterval(intervalId)
  }, [])

  const fetchNotifications = async (isBackground: boolean) => {
    try {
      setLoading(true)
      console.log('🔔 Fetching notifications...')
      const response = await apiService.getNotifications()
      console.log('🔔 Notifications response:', response)
      
      if (response.success && response.data) {
        // Sort by creation date (newest first) and limit
        const sortedNotifications = response.data
          .sort((a: Notification, b: Notification) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, limit)
        
        console.log('🔔 Processed notifications:', {
          total: response.data.length,
          displayed: sortedNotifications.length,
          types: sortedNotifications.map(n => n.type),
          shortlisted: sortedNotifications.filter(n => n.type === 'application_shortlisted' || n.type === 'candidate_shortlisted')
        })
        
        // Detect and surface new shortlist notifications when polling in background
        if (isBackground) {
          const newestCreatedAt = sortedNotifications[0]?.createdAt || null
          if (newestCreatedAt && newestCreatedAt !== latestSeenCreatedAt) {
            const newlyCreated = sortedNotifications.filter(n => !latestSeenCreatedAt || new Date(n.createdAt) > new Date(latestSeenCreatedAt))
            const newShortlists = newlyCreated.filter(n => n.type === 'candidate_shortlisted' || n.type === 'application_shortlisted')
            if (newShortlists.length > 0) {
              const first = newShortlists[0]
              toast({
                title: 'Shortlisted!',
                description: first.message,
              })

              if (typeof window !== 'undefined' && 'Notification' in window) {
                if (Notification.permission === 'granted') {
                  new Notification(first.title, { body: first.message })
                } else if (Notification.permission !== 'denied') {
                  Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                      new Notification(first.title, { body: first.message })
                    }
                  })
                }
              }
            }
            setLatestSeenCreatedAt(newestCreatedAt)
          }
        } else {
          const newestCreatedAt = sortedNotifications[0]?.createdAt || null
          if (newestCreatedAt) setLatestSeenCreatedAt(newestCreatedAt)
        }

        setNotifications(sortedNotifications)
      } else {
        console.log('🔔 No notifications found or error:', response)
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const getNotificationIcon = (type: string, icon?: string) => {
    if (icon) {
      switch (icon) {
        case 'arrow-up': return <ArrowUp className="w-4 h-4" />
        case 'eye': return <Eye className="w-4 h-4" />
        case 'briefcase': return <Briefcase className="w-4 h-4" />
        case 'check-circle': return <CheckCircle className="w-4 h-4" />
        case 'star': return <Star className="w-4 h-4" />
        case 'building': return <Building2 className="w-4 h-4" />
        case 'message-circle': return <MessageCircle className="w-4 h-4" />
        case 'calendar': return <Calendar className="w-4 h-4" />
        case 'video': return <Video className="w-4 h-4" />
        case 'phone': return <Phone className="w-4 h-4" />
        case 'map-pin': return <MapPin className="w-4 h-4" />
        case 'user-check': return <UserCheck className="w-4 h-4" />
        case 'clock': return <Clock className="w-4 h-4" />
        case 'x-circle': return <XCircle className="w-4 h-4" />
        default: return <Bell className="w-4 h-4" />
      }
    }
    
    switch (type) {
      case 'profile_view': return <Eye className="w-4 h-4" />
      case 'job_application': return <Briefcase className="w-4 h-4" />
      case 'application_status': return <CheckCircle className="w-4 h-4" />
      case 'job_recommendation': return <Star className="w-4 h-4" />
      case 'company_update': return <Building2 className="w-4 h-4" />
      case 'message': return <MessageCircle className="w-4 h-4" />
      case 'interview_scheduled': return <Calendar className="w-4 h-4" />
      case 'interview_cancelled': return <Calendar className="w-4 h-4" />
      case 'interview_reminder': return <Calendar className="w-4 h-4" />
      case 'candidate_shortlisted': return <UserCheck className="w-4 h-4" />
      case 'application_shortlisted': return <CheckCircle className="w-4 h-4" />
      case 'preferred_job_posted': return <Star className="w-4 h-4" />
      default: return <Bell className="w-4 h-4" />
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
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const handleNotificationClick = (notification: Notification) => {
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  const handleViewAll = () => {
    router.push('/notifications')
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Recent Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Recent Notifications</span>
          </CardTitle>
          {showViewAll && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleViewAll}
              className="text-sm"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-6">
            <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No notifications yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  notification.isRead 
                    ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' 
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getNotificationColor(notification.priority)}`}>
                    {getNotificationIcon(notification.type, notification.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {notification.title}
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    {notification.priority === 'urgent' && (
                      <Badge variant="destructive" className="mt-2 text-xs">
                        Urgent
                      </Badge>
                    )}
                    {notification.priority === 'high' && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        High Priority
                      </Badge>
                    )}
                    {notification.type === 'preferred_job_posted' && (
                      <Badge className="mt-2 text-xs bg-blue-100 text-blue-800 border-blue-200">
                        <Star className="w-3 h-3 mr-1" />
                        Preferred Job
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
  )
}
