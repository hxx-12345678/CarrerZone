"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  AlertCircle, 
  Star, 
  Zap, 
  TrendingUp, 
  Users, 
  Clock, 
  DollarSign,
  Crown,
  Flame,
  Target,
  Building2,
  MapPin,
  Calendar,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EmployerDashboardNavbar } from "@/components/employer-dashboard-navbar"
import { EmployerFooter } from "@/components/employer-footer"
import { apiService } from "@/lib/api"
import { toast } from "sonner"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"

interface HotVacancy {
  id: string;
  title: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  salary: string;
  salaryMin?: number;
  salaryMax?: number;
  status: 'draft' | 'active' | 'paused' | 'closed';
  urgencyLevel: 'high' | 'critical' | 'immediate';
  tierLevel: 'basic' | 'premium' | 'enterprise' | 'super-premium';
  pricingTier: string;
  hotVacancyPrice: number; // Use this instead of price
  hotVacancyCurrency: string; // Use this instead of currency
  views: number; // This might map to impressions
  impressions?: number;
  clicks?: number;
  applications: number; // This comes from applicationsCount
  applicationsCount?: number;
  createdAt: string;
  publishedAt?: string;
  validTill?: string;
  urgentHiring: boolean;
  boostedSearch: boolean;
  proactiveAlerts: boolean;
  superFeatured: boolean;
  featuredBadge: boolean;
  priorityListing: boolean;
  company?: {
    name: string;
    logo?: string;
    industry?: string;
    industries?: string[];
    companySize?: string;
    website?: string;
  };
  companyName?: string;
}

export default function HotVacanciesPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [hotVacancies, setHotVacancies] = useState<HotVacancy[]>([])
  const [loadingVacancies, setLoadingVacancies] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [tierFilter, setTierFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")

  useEffect(() => {
    if (user) {
      loadHotVacancies()
    }
  }, [user])

  const loadHotVacancies = async () => {
    try {
      setLoadingVacancies(true)
      const response = await apiService.getHotVacancies({
        search: searchQuery,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        tier: tierFilter !== 'all' ? tierFilter : undefined,
        sort: sortBy
      })
      
      if (response.success) {
        const vacancies = Array.isArray(response.data) ? response.data : []
        const sanitizedVacancies = vacancies.map((vacancy: any) => {
          const locationValue = typeof vacancy.location === "string" ? vacancy.location.trim() : ""
          const normalizedLocation = locationValue && locationValue.toLowerCase() !== "null" && locationValue.toLowerCase() !== "undefined"
            ? locationValue
            : "Location not specified"

          const company = vacancy.company ? {
            ...vacancy.company,
            industry: vacancy.company.industry ?? (
              Array.isArray(vacancy.company.industries)
                ? vacancy.company.industries.filter(Boolean).join(', ')
                : undefined
            )
          } : undefined

          return {
            ...vacancy,
            location: normalizedLocation,
            company,
          }
        })

        setHotVacancies(sanitizedVacancies as HotVacancy[])
      } else {
        toast.error(response.message || "Failed to load hot vacancies")
      }
    } catch (error) {
      console.error('Error loading hot vacancies:', error)
      toast.error("Failed to load hot vacancies")
    } finally {
      setLoadingVacancies(false)
    }
  }

  useEffect(() => {
    loadHotVacancies()
  }, [searchQuery, statusFilter, tierFilter, sortBy])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this hot vacancy?")) return
    
    try {
      const response = await apiService.deleteHotVacancy(id)
      if (response.success) {
        toast.success("Hot vacancy deleted successfully")
        loadHotVacancies()
      } else {
        toast.error(response.message || "Failed to delete hot vacancy")
      }
    } catch (error) {
      console.error('Error deleting hot vacancy:', error)
      toast.error("Failed to delete hot vacancy")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: "bg-gray-100 text-gray-800", icon: Edit },
      active: { color: "bg-green-100 text-green-800", icon: Eye },
      paused: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      closed: { color: "bg-red-100 text-red-800", icon: Trash2 }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const Icon = config.icon
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getTierBadge = (tier: string) => {
    const tierConfig = {
      basic: { color: "bg-blue-100 text-blue-800", icon: Star },
      premium: { color: "bg-purple-100 text-purple-800", icon: Crown },
      enterprise: { color: "bg-orange-100 text-orange-800", icon: TrendingUp },
      'super-premium': { color: "bg-red-100 text-red-800", icon: Flame }
    }
    
    const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.premium
    const Icon = config.icon
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {tier.replace('-', ' ').toUpperCase()}
      </Badge>
    )
  }

  const getUrgencyBadge = (urgency: string) => {
    if (urgency === 'critical' || urgency === 'immediate') {
      return (
        <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          URGENT
        </Badge>
      )
    }
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
    <EmployerAuthGuard>
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    </EmployerAuthGuard>
    )
  }

  return (
    <EmployerAuthGuard>
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
        <EmployerDashboardNavbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 w-full">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                  Hot Vacancies
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  Premium
                </Badge>
                </h1>
              <p className="text-gray-600 mt-2">
                Manage your premium hot vacancy listings with advanced features
                </p>
              </div>
            <Button 
              onClick={() => router.push('/employer-dashboard/post-job?hotVacancy=true')}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus className="h-4 w-4 mr-2" />
                  Create Hot Vacancy
                </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">Total Hot Vacancies</p>
                  <p className="text-2xl font-bold">{hotVacancies.length}</p>
                  </div>
                <Flame className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          
            <Card>
              <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold">
                      {hotVacancies.filter(v => v.status === 'active').length}
                    </p>
                  </div>
                <Eye className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          
            <Card>
              <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold">
                    {hotVacancies.reduce((sum, v) => sum + (v.views || v.impressions || 0), 0).toLocaleString()}
                    </p>
                  </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          
            <Card>
              <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold">
                    {hotVacancies.reduce((sum, v) => sum + (v.applications || v.applicationsCount || 0), 0).toLocaleString()}
                    </p>
                  </div>
                <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                  <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search hot vacancies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="super-premium">Super Premium</SelectItem>
                  </SelectContent>
                </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="views">Most Views</SelectItem>
                  <SelectItem value="applications">Most Applications</SelectItem>
                  <SelectItem value="price">Price (High to Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Hot Vacancies List */}
        {loadingVacancies ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2">Loading hot vacancies...</span>
            </div>
        ) : hotVacancies.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Flame className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Hot Vacancies Yet</h3>
                <p className="text-gray-600 mb-6">
                Create your first hot vacancy to get premium visibility and attract top candidates.
              </p>
              <Button 
                onClick={() => router.push('/employer-dashboard/post-job?hotVacancy=true')}
                className="bg-red-600 hover:bg-red-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                    Create Hot Vacancy
                  </Button>
              </CardContent>
            </Card>
          ) : (
          <div className="space-y-4">
            {hotVacancies.map((vacancy) => (
              <Card key={vacancy.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Flame className="h-5 w-5 text-red-600 flex-shrink-0" />
                        <h3 className="text-lg font-semibold text-gray-900">{vacancy.title}</h3>
                        {getStatusBadge(vacancy.status)}
                        {getTierBadge(vacancy.tierLevel)}
                        {getUrgencyBadge(vacancy.urgencyLevel)}
                        {vacancy.featuredBadge && (
                          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Featured
                          </Badge>
                        )}
                      </div>

                      {vacancy.company?.name && (
                        <div className="flex items-center flex-wrap gap-2 mb-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {vacancy.company.name}
                          </span>
                          {vacancy.company.industry && (
                            <span className="text-xs text-gray-400">• {vacancy.company.industry}</span>
                          )}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {vacancy.location || 'Location not specified'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {vacancy.jobType}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          {vacancy.experienceLevel}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          {vacancy.salary || (vacancy.salaryMin && vacancy.salaryMax ? `₹${(vacancy.salaryMin/100000).toFixed(0)}-${(vacancy.salaryMax/100000).toFixed(0)} LPA` : 'Not specified')}
                          </div>
                        </div>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {(vacancy.views || vacancy.impressions || 0).toLocaleString()} views
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {(vacancy.applications || vacancy.applicationsCount || 0).toLocaleString()} applications
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Created {formatDate(vacancy.createdAt)}
                      </div>
                        {vacancy.validTill && (
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            Valid till {formatDate(vacancy.validTill)}
                          </div>
                        )}
                        </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Premium Features:</span>
                        {vacancy.boostedSearch && (
                          <Badge variant="outline" className="text-xs">Boosted Search</Badge>
                        )}
                        {vacancy.proactiveAlerts && (
                          <Badge variant="outline" className="text-xs">Proactive Alerts</Badge>
                        )}
                        {vacancy.urgentHiring && (
                          <Badge variant="outline" className="text-xs">Urgent Hiring</Badge>
                        )}
                        {vacancy.superFeatured && (
                          <Badge variant="outline" className="text-xs">Super Featured</Badge>
                        )}
                        </div>
                        </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(vacancy.hotVacancyPrice, vacancy.hotVacancyCurrency)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {vacancy.pricingTier || vacancy.tierLevel || 'premium'} tier
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/employer-dashboard/hot-vacancies/${vacancy.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/employer-dashboard/hot-vacancies/${vacancy.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(vacancy.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                      </div>
                    </CardContent>
                  </Card>
              ))}
            </div>
          )}
        </div>
        
        <EmployerFooter />
      </div>
    </EmployerAuthGuard>
  )
}
