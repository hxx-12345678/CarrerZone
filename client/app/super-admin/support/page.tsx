"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Filter, 
  Search,
  Eye,
  Reply,
  User,
  Mail,
  Calendar,
  Tag,
  Loader2,
  BarChart3
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { apiService } from "@/lib/api"
import { toast } from "sonner"
import { SuperAdminAuthGuard } from "@/components/super-admin-auth-guard"

interface SupportMessage {
  id: string
  firstName: string
  lastName: string
  email: string
  subject: string
  message: string
  category: string
  status: string
  priority: string
  response?: string
  respondedAt?: string
  respondedBy?: string
  readBy?: string[]
  lastReadAt?: string
  createdAt: string
  updatedAt: string
}

export default function SupportPage() {
  return (
    <SuperAdminAuthGuard>
      <SupportPageContent />
    </SuperAdminAuthGuard>
  )
}

function SupportPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null)
  const [response, setResponse] = useState("")
  const [status, setStatus] = useState("")
  const [isResponding, setIsResponding] = useState(false)
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // Set initial filter from URL parameters
    const urlFilter = searchParams.get('filter')
    if (urlFilter) {
      setFilter(urlFilter)
    }
    
    fetchSupportMessages()
  }, [searchParams])

  const fetchSupportMessages = async () => {
    try {
      setLoading(true)
      const response = await apiService.getSupportMessages()
      if (response.success) {
        setMessages(response.data || [])
      } else {
        toast.error("Failed to fetch support messages")
      }
    } catch (error) {
      console.error("Error fetching support messages:", error)
      toast.error("Failed to fetch support messages")
    } finally {
      setLoading(false)
    }
  }

  const handleRespond = async () => {
    if (!selectedMessage || !response.trim()) {
      toast.error("Please enter a response")
      return
    }

    try {
      setIsResponding(true)
      const responseData = await apiService.updateSupportMessage(selectedMessage.id, {
        status: status || selectedMessage.status,
        response: response
      })

      if (responseData.success) {
        toast.success("Response sent successfully and email notification sent to user")
        setResponse("")
        setStatus("")
        setSelectedMessage(null)
        fetchSupportMessages()
      } else {
        toast.error("Failed to send response")
      }
    } catch (error) {
      console.error("Error sending response:", error)
      toast.error("Failed to send response")
    } finally {
      setIsResponding(false)
    }
  }

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await apiService.markSupportMessageAsRead(messageId)
      // Refresh messages to update read status
      fetchSupportMessages()
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-red-100 text-red-800"
      case "in_progress": return "bg-yellow-100 text-yellow-800"
      case "resolved": return "bg-green-100 text-green-800"
      case "closed": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800"
      case "high": return "bg-orange-100 text-orange-800"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "low": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "technical": return "bg-blue-100 text-blue-800"
      case "sales": return "bg-purple-100 text-purple-800"
      case "billing": return "bg-green-100 text-green-800"
      case "bug": return "bg-red-100 text-red-800"
      case "feature": return "bg-indigo-100 text-indigo-800"
      case "fraud": return "bg-red-100 text-red-800 border-2 border-red-300"
      case "spam": return "bg-orange-100 text-orange-800 border-2 border-orange-300"
      case "misconduct": return "bg-yellow-100 text-yellow-800 border-2 border-yellow-300"
      case "whistleblower": return "bg-purple-100 text-purple-800 border-2 border-purple-300"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const filteredMessages = messages.filter(message => {
    let matchesFilter = false
    
    if (filter === "all") {
      matchesFilter = true
    } else if (filter === "whistleblower") {
      matchesFilter = ['fraud', 'spam', 'misconduct', 'whistleblower'].includes(message.category)
    } else if (filter === "fraud") {
      matchesFilter = message.category === "fraud"
    } else if (filter === "spam") {
      matchesFilter = message.category === "spam"
    } else if (filter === "misconduct") {
      matchesFilter = message.category === "misconduct"
    } else if (filter === "urgent") {
      matchesFilter = message.priority === "urgent"
    } else {
      matchesFilter = message.status === filter
    }
    
    const matchesSearch = searchTerm === "" || 
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const stats = {
    total: messages.length,
    new: messages.filter(m => m.status === "new").length,
    inProgress: messages.filter(m => m.status === "in_progress").length,
    resolved: messages.filter(m => m.status === "resolved").length,
    whistleblower: messages.filter(m => ['fraud', 'spam', 'misconduct', 'whistleblower'].includes(m.category)).length,
    urgent: messages.filter(m => m.priority === "urgent").length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading support messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Center</h1>
              <p className="text-gray-600">Manage and respond to customer support messages and whistleblower reports</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => router.push('/super-admin/dashboard?tab=support')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Messages</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.new}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-red-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Whistleblower</p>
                  <p className="text-2xl font-bold text-red-600">{stats.whistleblower}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-orange-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Urgent</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.urgent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Messages</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="whistleblower">🚨 Whistleblower Reports</SelectItem>
              <SelectItem value="fraud">🚨 Fraud Reports</SelectItem>
              <SelectItem value="spam">🚨 Spam Reports</SelectItem>
              <SelectItem value="misconduct">🚨 Misconduct Reports</SelectItem>
              <SelectItem value="urgent">⚡ Urgent Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Messages List */}
        <div className="space-y-4">
          {filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No support messages</h3>
                <p className="text-gray-600">No messages match your current filters.</p>
              </CardContent>
            </Card>
          ) : (
            filteredMessages.map((message) => {
              const isWhistleblower = ['fraud', 'spam', 'misconduct', 'whistleblower'].includes(message.category)
              const isAnonymous = message.firstName === 'Anonymous' && message.lastName === 'Reporter'
              
              return (
              <Card 
                key={message.id} 
                className={`hover:shadow-md transition-shadow ${
                  isWhistleblower 
                    ? 'border-2 border-red-300 bg-red-50/30' 
                    : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{message.subject}</h3>
                        <Badge className={getStatusColor(message.status)}>
                          {message.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(message.priority)}>
                          {message.priority}
                        </Badge>
                        <Badge className={getCategoryColor(message.category)}>
                          {message.category}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {isAnonymous ? (
                            <span className="text-orange-600 font-medium">🔒 Anonymous Reporter</span>
                          ) : (
                            `${message.firstName} ${message.lastName}`
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {message.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(message.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <p className="text-gray-700 line-clamp-2">{message.message}</p>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleMarkAsRead(message.id)}
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Read
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedMessage(message)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <MessageSquare className="h-5 w-5" />
                              Support Message
                            </DialogTitle>
                          </DialogHeader>
                          
                          {selectedMessage && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-600">From</label>
                                  <p className="text-gray-900">{selectedMessage.firstName} {selectedMessage.lastName}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Email</label>
                                  <p className="text-gray-900">{selectedMessage.email}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Category</label>
                                  <Badge className={getCategoryColor(selectedMessage.category)}>
                                    {selectedMessage.category}
                                  </Badge>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Priority</label>
                                  <Badge className={getPriorityColor(selectedMessage.priority)}>
                                    {selectedMessage.priority}
                                  </Badge>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Created</label>
                                  <p className="text-gray-900">{new Date(selectedMessage.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Read Status</label>
                                  <div className="flex items-center gap-2">
                                    {selectedMessage.readBy && selectedMessage.readBy.length > 0 ? (
                                      <Badge className="bg-green-100 text-green-800">
                                        Read by {selectedMessage.readBy.length} admin(s)
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-red-100 text-red-800">
                                        Unread
                                      </Badge>
                                    )}
                                    {selectedMessage.lastReadAt && (
                                      <span className="text-xs text-gray-500">
                                        Last read: {new Date(selectedMessage.lastReadAt).toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium text-gray-600">Subject</label>
                                <p className="text-gray-900 font-medium">{selectedMessage.subject}</p>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium text-gray-600">Message</label>
                                <div className="mt-1 p-4 bg-gray-50 rounded-md">
                                  <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                                </div>
                              </div>
                              
                              {selectedMessage.response && (
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Previous Response</label>
                                  <div className="mt-1 p-4 bg-blue-50 rounded-md">
                                    <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.response}</p>
                                  </div>
                                </div>
                              )}
                              
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Status</label>
                                  <Select value={status || selectedMessage.status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="new">New</SelectItem>
                                      <SelectItem value="in_progress">In Progress</SelectItem>
                                      <SelectItem value="resolved">Resolved</SelectItem>
                                      <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Response</label>
                                  <Textarea
                                    value={response}
                                    onChange={(e) => setResponse(e.target.value)}
                                    placeholder="Enter your response..."
                                    rows={4}
                                  />
                                </div>
                                
                                <Button 
                                  onClick={handleRespond}
                                  disabled={isResponding}
                                  className="w-full"
                                >
                                  {isResponding ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <Reply className="h-4 w-4 mr-2" />
                                      Send Response
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
