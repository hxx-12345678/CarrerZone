"use client"

import { useState, useEffect } from "react"
import { Plus, TrendingUp, Eye, Users, DollarSign, Calendar, Target, BarChart3, Settings, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { GulfEmployerNavbar } from "@/components/gulf-employer-navbar"
import { EmployerFooter } from "@/components/employer-footer"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"
import { GulfEmployerAuthGuard } from "@/components/gulf-employer-auth-guard"
import { apiService } from "@/lib/api"

export default function GulfFeaturedJobsPage() {
  const [featuredJobs, setFeaturedJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [pricingPlans, setPricingPlans] = useState<any>({})
  const [employerJobs, setEmployerJobs] = useState<any[]>([])

  useEffect(() => {
    fetchFeaturedJobs()
    fetchPricingPlans()
    fetchEmployerJobs()
  }, [])

  const fetchFeaturedJobs = async () => {
    try {
      setLoading(true)
      const response = await apiService.getEmployerFeaturedJobs()
      if (response.success) {
        setFeaturedJobs(response.data.featuredJobs || [])
      } else {
        setError(response.message || 'Failed to fetch featured jobs')
      }
    } catch (err) {
      setError('Failed to fetch featured jobs')
    } finally {
      setLoading(false)
    }
  }

  const fetchPricingPlans = async () => {
    try {
      const response = await apiService.getFeaturedJobPricingPlans()
      if (response.success) {
        setPricingPlans(response.data || {})
      }
    } catch (err) {
      console.error('Failed to fetch pricing plans:', err)
    }
  }

  const fetchEmployerJobs = async () => {
    try {
      const response = await apiService.getEmployerJobsForPromotion()
      if (response.success) {
        setEmployerJobs(Array.isArray(response.data) ? response.data : [])
      }
    } catch (err) {
      console.error('Failed to fetch employer jobs:', err)
    }
  }

  const getPromotionTypeColor = (type: string) => {
    switch (type) {
      case "featured":
        return "bg-blue-100 text-blue-800"
      case "premium":
        return "bg-purple-100 text-purple-800"
      case "urgent":
        return "bg-red-100 text-red-800"
      case "sponsored":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "expired":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPromotionTypeIcon = (type: string) => {
    switch (type) {
      case "featured":
        return <TrendingUp className="w-4 h-4" />
      case "premium":
        return <DollarSign className="w-4 h-4" />
      case "urgent":
        return <Target className="w-4 h-4" />
      case "sponsored":
        return <BarChart3 className="w-4 h-4" />
      default:
        return <TrendingUp className="w-4 h-4" />
    }
  }

  const totalBudget = featuredJobs.reduce((sum, job) => sum + job.budget, 0)
  const totalSpent = featuredJobs.reduce((sum, job) => sum + job.spentAmount, 0)
  const totalImpressions = featuredJobs.reduce((sum, job) => sum + job.impressions, 0)
  const totalApplications = featuredJobs.reduce((sum, job) => sum + job.applications, 0)

  return (
    <EmployerAuthGuard>
      <GulfEmployerAuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/30 to-teal-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900">
          <GulfEmployerNavbar />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-20 sm:pt-24 lg:pt-28 pb-6 sm:pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Gulf Featured Jobs</h1>
            <p className="text-slate-600">Manage paid promotions and featured job listings for Gulf region</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Promotion
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Job Promotion</DialogTitle>
                <DialogDescription>
                  Promote your job posting to reach more candidates in the Gulf
                </DialogDescription>
              </DialogHeader>
              <CreatePromotionForm 
                pricingPlans={pricingPlans}
                employerJobs={employerJobs}
                onClose={() => setIsCreateDialogOpen(false)}
                onSuccess={fetchFeaturedJobs}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Budget</p>
                  <p className="text-2xl font-bold text-slate-900">₹{totalBudget.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Spent</p>
                  <p className="text-2xl font-bold text-blue-600">₹{totalSpent.toLocaleString()}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Impressions</p>
                  <p className="text-2xl font-bold text-purple-600">{totalImpressions.toLocaleString()}</p>
                </div>
                <Eye className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Applications</p>
                  <p className="text-2xl font-bold text-green-600">{totalApplications}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Promotions</CardTitle>
            <CardDescription>Manage your featured job promotions and track performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Loading featured jobs...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={fetchFeaturedJobs} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : featuredJobs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600 mb-4">No featured job promotions yet.</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Promotion
                  </Button>
                </div>
              ) : (
                featuredJobs.map((job) => (
                  <div key={job.id} className="border border-slate-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getPromotionTypeIcon(job.promotionType)}
                        <div>
                          <h3 className="font-semibold text-slate-900 text-lg">{job.job?.title || 'Unknown Job'}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getPromotionTypeColor(job.promotionType)}>
                              {job.promotionType}
                            </Badge>
                            <Badge className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                            <Badge variant="outline">
                              Priority {job.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          Pause
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Budget & Spending</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold">₹{job.spentAmount.toFixed(2)}</span>
                          <span className="text-sm text-slate-500">/ ₹{job.budget}</span>
                        </div>
                        <Progress value={(job.spentAmount / job.budget) * 100} className="mt-2" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Impressions</p>
                        <p className="text-lg font-semibold">{job.impressions.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">Views</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Clicks</p>
                        <p className="text-lg font-semibold">{job.clicks}</p>
                        <p className="text-xs text-slate-500">{job.ctr}% CTR</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Applications</p>
                        <p className="text-lg font-semibold">{job.applications}</p>
                        <p className="text-xs text-slate-500">{job.conversionRate}% conversion</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <div className="flex items-center space-x-4">
                        <span>Duration: {job.startDate} - {job.endDate}</span>
                        <span>•</span>
                        <span>₹{(job.spentAmount / job.impressions * 1000).toFixed(2)} per 1K impressions</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

          <EmployerFooter />
        </div>
      </GulfEmployerAuthGuard>
    </EmployerAuthGuard>
  )
}

function CreatePromotionForm({ 
  pricingPlans, 
  employerJobs, 
  onClose, 
  onSuccess 
}: { 
  pricingPlans: any; 
  employerJobs: any[]; 
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const [promotionType, setPromotionType] = useState("featured")
  const [selectedJob, setSelectedJob] = useState("")
  const [budget, setBudget] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedJob || !budget || !startDate || !endDate) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await apiService.createFeaturedJob({
        jobId: selectedJob,
        promotionType: promotionType as any,
        startDate,
        endDate,
        budget: parseFloat(budget)
      })
      if (response.success) {
        onSuccess()
        onClose()
      } else {
        setError(response.message || 'Failed to create promotion')
      }
    } catch (err) {
      setError('Failed to create promotion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="job">Select Job</Label>
        <Select value={selectedJob} onValueChange={setSelectedJob}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a job to promote" />
          </SelectTrigger>
          <SelectContent>
            {employerJobs.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500">No active jobs found.</div>
            ) : (
              employerJobs.map((job: any) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title} {job.location ? `- ${job.location}` : ''}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Promotion Type</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {Object.entries(pricingPlans).map(([key, plan]: [string, any]) => (
              <div
                key={key}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  promotionType === key
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                onClick={() => setPromotionType(key)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{plan.name}</span>
                  <span className="text-sm font-semibold text-emerald-600">₹{plan.basePrice}/{plan.duration}</span>
                </div>
                <p className="text-sm text-slate-600">{plan.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="budget">Budget (₹)</Label>
            <Input id="budget" type="number" placeholder="500" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="priority">Priority Level</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">High Priority</SelectItem>
                <SelectItem value="2">Medium Priority</SelectItem>
                <SelectItem value="3">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div>
        <Label htmlFor="targetAudience">Target Audience (Optional)</Label>
        <Textarea id="targetAudience" placeholder="Describe your target audience..." rows={3} />
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={!selectedJob || !budget || !startDate || !endDate || loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Promotion'
          )}
        </Button>
      </div>
    </form>
  )
}


