"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  MessageSquare,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Filter,
  Search,
  Settings,
  Play,
  Pause,
  Eye,
  EyeOff,
  Zap,
  Target,
  TrendingUp,
  Users,
  Building2,
  Calendar,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import JobAtPaceNavbar from "@/components/job-at-pace/JobAtPaceNavbar"

interface JobAlert {
  id: string
  title: string
  keywords: string[]
  location: string
  salaryMin: number
  salaryMax: number
  experience: string
  jobType: string
  industry: string
  companies: string[]
  frequency: string
  channels: {
    email: boolean
    sms: boolean
    whatsapp: boolean
    push: boolean
  }
  isActive: boolean
  createdAt: string
  lastTriggered?: string
  matchCount: number
  clickRate: number
}

const mockAlerts: JobAlert[] = [
  {
    id: "1",
    title: "Senior Software Engineer - Remote",
    keywords: ["React", "Node.js", "TypeScript", "Full Stack"],
    location: "Remote",
    salaryMin: 1200000,
    salaryMax: 2500000,
    experience: "5-8 years",
    jobType: "Full-time",
    industry: "Technology",
    companies: ["Google", "Microsoft", "Amazon"],
    frequency: "Instant",
    channels: {
      email: true,
      sms: true,
      whatsapp: true,
      push: true
    },
    isActive: true,
    createdAt: "2024-01-15",
    lastTriggered: "2024-01-20",
    matchCount: 15,
    clickRate: 85
  },
  {
    id: "2", 
    title: "Product Manager - Fintech",
    keywords: ["Product Management", "Fintech", "Strategy", "Analytics"],
    location: "Bangalore",
    salaryMin: 1500000,
    salaryMax: 3000000,
    experience: "3-6 years",
    jobType: "Full-time",
    industry: "Financial Services",
    companies: ["Razorpay", "Paytm", "PhonePe"],
    frequency: "Daily",
    channels: {
      email: true,
      sms: false,
      whatsapp: true,
      push: true
    },
    isActive: true,
    createdAt: "2024-01-10",
    lastTriggered: "2024-01-19",
    matchCount: 8,
    clickRate: 92
  },
  {
    id: "3",
    title: "Data Scientist - Healthcare",
    keywords: ["Machine Learning", "Python", "Healthcare", "AI"],
    location: "Mumbai",
    salaryMin: 1000000,
    salaryMax: 2000000,
    experience: "2-5 years",
    jobType: "Full-time",
    industry: "Healthcare",
    companies: [],
    frequency: "Weekly",
    channels: {
      email: true,
      sms: false,
      whatsapp: false,
      push: true
    },
    isActive: false,
    createdAt: "2024-01-05",
    lastTriggered: "2024-01-15",
    matchCount: 3,
    clickRate: 67
  }
]

const alertStats = {
  totalAlerts: 3,
  activeAlerts: 2,
  totalMatches: 26,
  avgClickRate: 81,
  weeklyMatches: 12,
  topPerformer: "Senior Software Engineer - Remote"
}

export default function JobAlertsPage() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<JobAlert[]>(mockAlerts)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<JobAlert | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "paused">("all")

  const [newAlert, setNewAlert] = useState({
    title: "",
    keywords: "",
    location: "",
    salaryMin: "",
    salaryMax: "",
    experience: "",
    jobType: "",
    industry: "",
    companies: "",
    frequency: "daily",
    channels: {
      email: true,
      sms: false,
      whatsapp: false,
      push: true
    }
  })

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && alert.isActive) ||
                         (filterStatus === "paused" && !alert.isActive)
    return matchesSearch && matchesStatus
  })

  const toggleAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, isActive: !alert.isActive } : alert
    ))
  }

  const deleteAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId))
  }

  const createAlert = () => {
    const alert: JobAlert = {
      id: Date.now().toString(),
      title: newAlert.title,
      keywords: newAlert.keywords.split(",").map(k => k.trim()).filter(k => k),
      location: newAlert.location,
      salaryMin: parseInt(newAlert.salaryMin) || 0,
      salaryMax: parseInt(newAlert.salaryMax) || 0,
      experience: newAlert.experience,
      jobType: newAlert.jobType,
      industry: newAlert.industry,
      companies: newAlert.companies.split(",").map(c => c.trim()).filter(c => c),
      frequency: newAlert.frequency,
      channels: newAlert.channels,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      matchCount: 0,
      clickRate: 0
    }
    
    setAlerts([...alerts, alert])
    setIsCreateDialogOpen(false)
    setNewAlert({
      title: "",
      keywords: "",
      location: "",
      salaryMin: "",
      salaryMax: "",
      experience: "",
      jobType: "",
      industry: "",
      companies: "",
      frequency: "daily",
      channels: {
        email: true,
        sms: false,
        whatsapp: false,
        push: true
      }
    })
  }

  const formatSalary = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`
    }
    return `₹${amount.toLocaleString()}`
  }

  const getChannelIcons = (channels: JobAlert['channels']) => {
    const activeChannels = []
    if (channels.email) activeChannels.push({ icon: Mail, label: "Email" })
    if (channels.sms) activeChannels.push({ icon: Phone, label: "SMS" })
    if (channels.whatsapp) activeChannels.push({ icon: MessageSquare, label: "WhatsApp" })
    if (channels.push) activeChannels.push({ icon: Bell, label: "Push" })
    return activeChannels
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <JobAtPaceNavbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Smart Job Alerts</h1>
              <p className="text-lg text-gray-600">
                Get instant notifications for jobs that match your preferences
              </p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Alert
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Job Alert</DialogTitle>
                  <DialogDescription>
                    Set up a personalized job alert to get notified about relevant opportunities
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="title">Alert Title</Label>
                      <Input
                        id="title"
                        value={newAlert.title}
                        onChange={(e) => setNewAlert({...newAlert, title: e.target.value})}
                        placeholder="e.g., Senior React Developer"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                      <Input
                        id="keywords"
                        value={newAlert.keywords}
                        onChange={(e) => setNewAlert({...newAlert, keywords: e.target.value})}
                        placeholder="e.g., React, Node.js, JavaScript, Full Stack"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={newAlert.location}
                          onChange={(e) => setNewAlert({...newAlert, location: e.target.value})}
                          placeholder="e.g., Bangalore, Remote"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="experience">Experience</Label>
                        <Select value={newAlert.experience} onValueChange={(value) => setNewAlert({...newAlert, experience: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select experience" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0-1 years">0-1 years</SelectItem>
                            <SelectItem value="1-3 years">1-3 years</SelectItem>
                            <SelectItem value="3-5 years">3-5 years</SelectItem>
                            <SelectItem value="5-8 years">5-8 years</SelectItem>
                            <SelectItem value="8+ years">8+ years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="salaryMin">Minimum Salary (₹)</Label>
                        <Input
                          id="salaryMin"
                          type="number"
                          value={newAlert.salaryMin}
                          onChange={(e) => setNewAlert({...newAlert, salaryMin: e.target.value})}
                          placeholder="e.g., 1200000"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="salaryMax">Maximum Salary (₹)</Label>
                        <Input
                          id="salaryMax"
                          type="number"
                          value={newAlert.salaryMax}
                          onChange={(e) => setNewAlert({...newAlert, salaryMax: e.target.value})}
                          placeholder="e.g., 2500000"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="jobType">Job Type</Label>
                        <Select value={newAlert.jobType} onValueChange={(value) => setNewAlert({...newAlert, jobType: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                            <SelectItem value="Freelance">Freelance</SelectItem>
                            <SelectItem value="Internship">Internship</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="industry">Industry</Label>
                        <Select value={newAlert.industry} onValueChange={(value) => setNewAlert({...newAlert, industry: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Technology">Technology</SelectItem>
                            <SelectItem value="Financial Services">Financial Services</SelectItem>
                            <SelectItem value="Healthcare">Healthcare</SelectItem>
                            <SelectItem value="E-commerce">E-commerce</SelectItem>
                            <SelectItem value="Education">Education</SelectItem>
                            <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="companies">Preferred Companies (comma-separated, optional)</Label>
                      <Input
                        id="companies"
                        value={newAlert.companies}
                        onChange={(e) => setNewAlert({...newAlert, companies: e.target.value})}
                        placeholder="e.g., Google, Microsoft, Amazon"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="frequency">Alert Frequency</Label>
                      <Select value={newAlert.frequency} onValueChange={(value) => setNewAlert({...newAlert, frequency: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instant">Instant</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Notification Channels</Label>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={newAlert.channels.email}
                            onCheckedChange={(checked) => setNewAlert({
                              ...newAlert, 
                              channels: {...newAlert.channels, email: checked}
                            })}
                          />
                          <Mail className="h-4 w-4" />
                          <Label>Email</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={newAlert.channels.sms}
                            onCheckedChange={(checked) => setNewAlert({
                              ...newAlert, 
                              channels: {...newAlert.channels, sms: checked}
                            })}
                          />
                          <Phone className="h-4 w-4" />
                          <Label>SMS</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={newAlert.channels.whatsapp}
                            onCheckedChange={(checked) => setNewAlert({
                              ...newAlert, 
                              channels: {...newAlert.channels, whatsapp: checked}
                            })}
                          />
                          <MessageSquare className="h-4 w-4" />
                          <Label>WhatsApp</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={newAlert.channels.push}
                            onCheckedChange={(checked) => setNewAlert({
                              ...newAlert, 
                              channels: {...newAlert.channels, push: checked}
                            })}
                          />
                          <Bell className="h-4 w-4" />
                          <Label>Push</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createAlert} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    Create Alert
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Alerts</p>
                    <p className="text-3xl font-bold">{alertStats.totalAlerts}</p>
                  </div>
                  <Bell className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Active Alerts</p>
                    <p className="text-3xl font-bold">{alertStats.activeAlerts}</p>
                  </div>
                  <Play className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-600 to-purple-700 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Weekly Matches</p>
                    <p className="text-3xl font-bold">{alertStats.weeklyMatches}</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-600 to-orange-700 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Avg. Click Rate</p>
                    <p className="text-3xl font-bold">{alertStats.avgClickRate}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search alerts by title or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="paused">Paused Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-6">
          {filteredAlerts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Job Alerts Found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || filterStatus !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "Create your first job alert to get started"
                  }
                </p>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Alert
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert) => (
              <Card key={alert.id} className={`hover:shadow-lg transition-all duration-300 ${
                alert.isActive ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-gray-300'
              }`}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">{alert.title}</h3>
                        <Badge className={`${
                          alert.isActive 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        } border`}>
                          {alert.isActive ? 'Active' : 'Paused'}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 border">
                          {alert.frequency}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Search className="h-4 w-4" />
                          <span className="text-sm">
                            {alert.keywords.slice(0, 3).join(", ")}
                            {alert.keywords.length > 3 && ` +${alert.keywords.length - 3} more`}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">{alert.location}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-sm">
                            {formatSalary(alert.salaryMin)} - {formatSalary(alert.salaryMax)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Briefcase className="h-4 w-4" />
                          <span className="text-sm">{alert.experience}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Building2 className="h-4 w-4" />
                          <span className="text-sm">{alert.industry}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">{alert.jobType}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Channels:</span>
                          <div className="flex space-x-1">
                            {getChannelIcons(alert.channels).map((channel, index) => (
                              <div key={index} className="p-1 bg-blue-100 rounded">
                                <channel.icon className="h-3 w-3 text-blue-600" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Target className="h-4 w-4" />
                          <span>{alert.matchCount} matches</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>{alert.clickRate}% click rate</span>
                        </div>
                        {alert.lastTriggered && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>Last: {new Date(alert.lastTriggered).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={alert.isActive}
                        onCheckedChange={() => toggleAlert(alert.id)}
                      />
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteAlert(alert.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Performance Insights */}
        {filteredAlerts.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Performance Insights</span>
              </CardTitle>
              <CardDescription>
                Optimize your job alerts based on performance data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-green-800">Top Performer</h3>
                  <p className="text-sm text-green-600">{alertStats.topPerformer}</p>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Info className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-blue-800">Recommendation</h3>
                  <p className="text-sm text-blue-600">Add more specific keywords to improve match quality</p>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <AlertCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-orange-800">Tip</h3>
                  <p className="text-sm text-orange-600">Enable WhatsApp alerts for faster response times</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
