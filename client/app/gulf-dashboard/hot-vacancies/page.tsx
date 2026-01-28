"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import {
  Plus,
  Search,
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
  Flame,
  Target,
  Building2,
  MapPin,
  Calendar,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { GulfEmployerNavbar } from "@/components/gulf-employer-navbar"
import { EmployerFooter } from "@/components/employer-footer"
import { apiService } from "@/lib/api"
import { toast } from "sonner"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"
import { GulfEmployerAuthGuard } from "@/components/gulf-employer-auth-guard"

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
  hotVacancyPrice: number;
  hotVacancyCurrency: string;
  views: number;
  impressions?: number;
  clicks?: number;
  applications: number;
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

const gulfGradient = "bg-gradient-to-br from-slate-50 via-emerald-50/40 to-teal-50/40 dark:from-gray-900 dark:via-gray-800/60 dark:to-gray-900"

export default function GulfHotVacanciesPage() {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadHotVacancies = async () => {
    try {
      setLoadingVacancies(true)
      const response = await apiService.getHotVacancies({
        search: searchQuery,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        tier: tierFilter !== 'all' ? tierFilter : undefined,
        sort: sortBy,
        region: "gulf"
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
        toast.error(response.message || "Failed to load Gulf hot vacancies")
      }
    } catch (error) {
      console.error('Error loading Gulf hot vacancies:', error)
      toast.error("Failed to load Gulf hot vacancies")
    } finally {
      setLoadingVacancies(false)
    }
  }

  useEffect(() => {
    loadHotVacancies()
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      draft: { color: "bg-slate-200 text-slate-800", icon: Edit },
      active: { color: "bg-emerald-100 text-emerald-800", icon: Eye },
      paused: { color: "bg-amber-100 text-amber-800", icon: Clock },
      closed: { color: "bg-rose-100 text-rose-800", icon: Trash2 }
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
      basic: { color: "bg-cyan-100 text-cyan-800", icon: Star },
      premium: { color: "bg-emerald-100 text-emerald-800", icon: Zap },
      enterprise: { color: "bg-teal-100 text-teal-800", icon: TrendingUp },
      'super-premium': { color: "bg-amber-100 text-amber-800", icon: Flame }
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
        <Badge className="bg-rose-100 text-rose-800 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          URGENT
        </Badge>
      )
    }
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'AED',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <EmployerAuthGuard>
        <GulfEmployerAuthGuard>
          <div className="min-h-screen flex items-center justify-center bg-slate-900/5">
            <div className="animate-spin rounded-full h-24 w-24 border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        </GulfEmployerAuthGuard>
      </EmployerAuthGuard>
    )
  }

  return (
    <EmployerAuthGuard>
      <GulfEmployerAuthGuard>
        <div className={`min-h-screen ${gulfGradient} overflow-hidden`}>
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/40 via-teal-100/30 to-cyan-100/40"></div>
            <div className="absolute top-24 -left-10 w-48 h-48 bg-emerald-300/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-teal-300/10 rounded-full blur-3xl animate-pulse delay-300"></div>
          </div>

          <GulfEmployerNavbar />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 w-full">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    Gulf Hot Vacancies
                    <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white flex items-center gap-1 shadow-sm">
                      <Flame className="h-3 w-3" />
                      Premium
                    </Badge>
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 mt-2 max-w-2xl">
                    Manage your Gulf premium listings to attract top regional talent with boosted visibility, proactive alerts, and priority placement.
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/gulf-dashboard/post-job?hotVacancy=true')}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Gulf Hot Vacancy
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="border-none shadow-lg shadow-emerald-100/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Hot Vacancies</p>
                      <p className="text-2xl font-bold text-slate-900">{hotVacancies.length}</p>
                    </div>
                    <Flame className="h-8 w-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg shadow-teal-100/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Active Listings</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {hotVacancies.filter(v => v.status === 'active').length}
                      </p>
                    </div>
                    <Eye className="h-8 w-8 text-teal-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg shadow-teal-100/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Views</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {hotVacancies.reduce((sum, v) => sum + (v.views || v.impressions || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-cyan-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg shadow-emerald-100/60">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Applications</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {hotVacancies.reduce((sum, v) => sum + (v.applications || v.applicationsCount || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6 border-none shadow-lg shadow-emerald-100/60">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        placeholder="Search Gulf hot vacancies..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 border-emerald-100 focus-visible:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="border-emerald-100 focus:ring-emerald-500">
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
                    <SelectTrigger className="border-emerald-100 focus:ring-emerald-500">
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
                    <SelectTrigger className="border-emerald-100 focus:ring-emerald-500">
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
              <div className="flex items-center justify-center py-12 text-emerald-600">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading Gulf hot vacancies...</span>
              </div>
            ) : hotVacancies.length === 0 ? (
              <Card className="border-none shadow-lg shadow-emerald-100/60">
                <CardContent className="p-12 text-center">
                  <Flame className="h-16 w-16 text-emerald-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Gulf Hot Vacancies</h3>
                  <p className="text-slate-600 mb-6">
                    Launch your first Gulf hot vacancy to reach top regional candidates with premium visibility.
                  </p>
                  <Button
                    onClick={() => router.push('/gulf-dashboard/post-job?hotVacancy=true')}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Gulf Hot Vacancy
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {hotVacancies.map((vacancy) => (
                  <Card key={vacancy.id} className="border-none backdrop-blur bg-white/70 hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex-1 min-w-[260px]">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <Flame className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                            <h3 className="text-lg font-semibold text-slate-900">{vacancy.title}</h3>
                            {getStatusBadge(vacancy.status)}
                            {getTierBadge(vacancy.tierLevel)}
                            {getUrgencyBadge(vacancy.urgencyLevel)}
                            {vacancy.featuredBadge && (
                              <Badge className="bg-amber-100 text-amber-800 flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                Featured
                              </Badge>
                            )}
                          </div>

                          {vacancy.company?.name && (
                            <div className="flex items-center flex-wrap gap-2 mb-4 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                {vacancy.company.name}
                              </span>
                              {vacancy.company.industry && (
                                <span className="text-xs text-slate-400">• {vacancy.company.industry}</span>
                              )}
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-emerald-500" />
                              {vacancy.location || 'Location not specified'}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-emerald-500" />
                              {vacancy.jobType}
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-emerald-500" />
                              {vacancy.experienceLevel}
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-emerald-500" />
                              {vacancy.salary ||
                                (vacancy.salaryMin && vacancy.salaryMax
                                  ? `${formatCurrency(vacancy.salaryMin, vacancy.hotVacancyCurrency || 'AED')} - ${formatCurrency(vacancy.salaryMax, vacancy.hotVacancyCurrency || 'AED')}`
                                  : 'Not specified')}
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-sm text-slate-600 mb-4 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4 text-emerald-500" />
                              {(vacancy.views || vacancy.impressions || 0).toLocaleString()} views
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-emerald-500" />
                              {(vacancy.applications || vacancy.applicationsCount || 0).toLocaleString()} applications
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-emerald-500" />
                              Created {formatDate(vacancy.createdAt)}
                            </div>
                            {vacancy.validTill && (
                              <div className="flex items-center gap-1">
                                <Target className="h-4 w-4 text-emerald-500" />
                                Valid till {formatDate(vacancy.validTill)}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <span className="text-sm font-medium text-slate-700">Premium Features:</span>
                            {vacancy.boostedSearch && (
                              <Badge variant="outline" className="border-emerald-200 text-emerald-600">Boosted Search</Badge>
                            )}
                            {vacancy.proactiveAlerts && (
                              <Badge variant="outline" className="border-emerald-200 text-emerald-600">Proactive Alerts</Badge>
                            )}
                            {vacancy.urgentHiring && (
                              <Badge variant="outline" className="border-emerald-200 text-emerald-600">Urgent Hiring</Badge>
                            )}
                            {vacancy.superFeatured && (
                              <Badge variant="outline" className="border-emerald-200 text-emerald-600">Super Featured</Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 ml-auto">
                          <div className="text-right">
                            <div className="text-lg font-bold text-slate-900">
                              {formatCurrency(vacancy.hotVacancyPrice, vacancy.hotVacancyCurrency || 'AED')}
                            </div>
                            <div className="text-sm text-slate-500 capitalize">
                              {vacancy.pricingTier || vacancy.tierLevel || 'premium'} tier
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-slate-500 hover:text-emerald-600">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/gulf-dashboard/hot-vacancies/${vacancy.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/gulf-dashboard/hot-vacancies/${vacancy.id}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(vacancy.id)}
                                className="text-rose-600 focus:text-rose-600"
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
      </GulfEmployerAuthGuard>
    </EmployerAuthGuard>
  )
}

