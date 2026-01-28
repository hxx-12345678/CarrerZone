"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  Briefcase,
  Bell,
  BellOff,
  Search,
  Heart,
  Loader2,
  ExternalLink
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { toast } from 'sonner'
import { apiService } from '@/lib/api'
import { JobseekerAuthGuard } from '@/components/jobseeker-auth-guard'

interface FollowedCompany {
  id: string
  companyId: string
  followedAt: string
  company: {
    id: string
    name: string
    slug: string
    industry: string
    logo: string
    location?: string
    size?: string
    description?: string
  }
}

export default function FollowedCompaniesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [companies, setCompanies] = useState<FollowedCompany[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<FollowedCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Please sign in to view followed companies')
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && !authLoading) {
      fetchFollowedCompanies()
    }
  }, [user, authLoading])

  useEffect(() => {
    if (searchTerm) {
      const filtered = companies.filter(follow =>
        follow.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        follow.company.industry?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCompanies(filtered)
    } else {
      setFilteredCompanies(companies)
    }
  }, [searchTerm, companies])

  const fetchFollowedCompanies = async () => {
    try {
      setLoading(true)
      const response = await apiService.getFollowedCompanies()
      if (response.success && response.data) {
        setCompanies(response.data)
        setFilteredCompanies(response.data)
      }
    } catch (error) {
      console.error('Error fetching followed companies:', error)
      toast.error('Failed to load followed companies')
    } finally {
      setLoading(false)
    }
  }

  const handleUnfollow = async (companyId: string) => {
    try {
      setUnfollowingId(companyId)
      const response = await apiService.unfollowCompany(companyId)
      if (response.success) {
        toast.success('Successfully unfollowed company')
        // Remove from list
        setCompanies(prev => prev.filter(c => c.companyId !== companyId))
      } else {
        toast.error(response.message || 'Failed to unfollow company')
      }
    } catch (error) {
      console.error('Error unfollowing company:', error)
      toast.error('Failed to unfollow company')
    } finally {
      setUnfollowingId(null)
    }
  }

  if (authLoading || loading) {
    return (
      <JobseekerAuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-auto">
        {/* Welcome Back Div Style Background Effects */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-200/45 via-blue-200/35 to-indigo-200/45"></div>
          <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-purple-300/10 to-blue-300/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-blue-300/10 to-indigo-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-indigo-300/10 to-purple-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/4 left-0 right-0 h-24 bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-indigo-400/20"></div>
        </div>
          <Navbar />
          <div className="pt-20 pb-12 relative z-10">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-300">Loading followed companies...</p>
              </div>
            </div>
          </div>
        </div>
      </JobseekerAuthGuard>
    )
  }

  if (!user) return null

  return (
    <JobseekerAuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Navbar />
        
        <div className="pt-16 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    Followed Companies
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300">
                    Companies you're following • {filteredCompanies.length} {filteredCompanies.length === 1 ? 'company' : 'companies'}
                  </p>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search followed companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Companies List */}
            {filteredCompanies.length === 0 ? (
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Building2 className="w-16 h-16 text-slate-400 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {searchTerm ? 'No companies found' : 'No followed companies yet'}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-center max-w-md mb-6">
                    {searchTerm 
                      ? 'Try adjusting your search term'
                      : 'Start following companies to get updates about their job postings and company news'
                    }
                  </p>
                  {!searchTerm && (
                    <Link href="/companies">
                      <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                        <Building2 className="w-4 h-4 mr-2" />
                        Explore Companies
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map((follow) => (
                  <Card key={follow.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl hover:shadow-lg transition-all duration-200 group">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {follow.company.logo ? (
                            <img
                              src={follow.company.logo}
                              alt={follow.company.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                              {follow.company.name}
                            </CardTitle>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {follow.company.industry || 'Company'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-current text-red-500" />
                          Following
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {follow.company.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {follow.company.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-400">
                        {follow.company.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {follow.company.location}
                          </div>
                        )}
                        {follow.company.size && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {follow.company.size}
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Following since {new Date(follow.followedAt).toLocaleDateString()}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Link href={`/companies/${follow.company.slug || follow.companyId}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Profile
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnfollow(follow.companyId)}
                          disabled={unfollowingId === follow.companyId}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {unfollowingId === follow.companyId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Heart className="w-4 h-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Info Card */}
            <Card className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                      Stay Updated
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      You'll receive notifications when companies you follow post new jobs or make important updates. 
                      Manage your notification preferences in your account settings.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </JobseekerAuthGuard>
  )
}

