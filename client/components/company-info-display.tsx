"use client"

import { useState, useEffect } from 'react'
import { Building2, MapPin, Phone, Mail, Globe, Users, Calendar, Star, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { apiService } from '@/lib/api'

interface CompanyInfo {
  id: string
  name: string
  industry: string
  companySize: string
  website?: string
  email: string
  phone?: string
  description?: string
  address?: string
  city?: string
  state?: string
  country: string
  foundedYear?: number
  rating?: number
  totalReviews?: number
  isVerified?: boolean
  logo?: string
}

interface CompanyInfoDisplayProps {
  companyId: string
}

export function CompanyInfoDisplay({ companyId }: CompanyInfoDisplayProps) {
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiService.getCompany(companyId)
        if (response.success && response.data) {
          setCompany(response.data)
        } else {
          setError(response.message || 'Failed to load company information')
        }
      } catch (err: any) {
        console.error('Error fetching company info:', err)
        
        // Handle rate limiting specifically
        if (err.message && err.message.includes('Rate limit exceeded')) {
          setError('Too many requests. Please wait a moment before refreshing.')
        } else {
          setError(err.message || 'Failed to load company information')
        }
      } finally {
        setLoading(false)
      }
    }

    if (companyId) {
      fetchCompanyInfo()
    }
  }, [companyId])

  // Refresh company data when needed
  const refreshCompanyData = async () => {
    // Prevent multiple simultaneous refresh calls
    if (isRefreshing) {
      console.log('🔄 Company info refresh already in progress, skipping...')
      return
    }
    
    if (companyId) {
      try {
        setIsRefreshing(true)
        setLoading(true)
        setError(null)
        const response = await apiService.getCompany(companyId)
        if (response.success && response.data) {
          setCompany(response.data)
        } else {
          setError(response.message || 'Failed to load company information')
        }
      } catch (err: any) {
        console.error('Error refreshing company info:', err)
        
        // Handle rate limiting specifically
        if (err.message && err.message.includes('Rate limit exceeded')) {
          setError('Too many requests. Please wait a moment before refreshing.')
        } else {
          setError(err.message || 'Failed to load company information')
        }
      } finally {
        setLoading(false)
        setIsRefreshing(false)
      }
    }
  }

  if (loading) {
    return (
      <Card className="bg-white/50 backdrop-blur-xl border-white/40">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-48"></div>
                <div className="h-3 bg-slate-200 rounded w-32"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-slate-200 rounded w-full"></div>
              <div className="h-3 bg-slate-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !company) {
    return (
      <Card className="bg-white/50 backdrop-blur-xl border-white/40">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">{error || 'Company information not available'}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <Card className="bg-white/50 backdrop-blur-xl border-white/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Company Information
          </CardTitle>
          <button
            onClick={refreshCompanyData}
            disabled={loading || isRefreshing}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            title={isRefreshing ? "Refresh in progress..." : "Refresh company data"}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company Header */}
        <div className="flex items-center space-x-4">
          <Avatar className="w-16 h-16 ring-1 ring-white/40 bg-white/60 backdrop-blur">
            <AvatarImage 
              src={company.logo ? (company.logo.startsWith('http') ? company.logo : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}${company.logo}`) : "/placeholder-logo.png"} 
              alt={company.name}
              onLoad={() => {
                console.log('✅ Company logo loaded successfully:', company.logo);
              }}
              onError={(e) => {
                console.error('❌ Company logo failed to load:', company.logo);
                const img = e.target as HTMLImageElement;
                if (company.logo && !company.logo.startsWith('http')) {
                  img.src = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${company.logo}`;
                }
              }}
            />
            <AvatarFallback className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-lime-600 text-white">
              {getInitials(company.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-xl font-semibold text-slate-900">{company.name}</h3>
              {company.isVerified && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                  <Star className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-slate-600">{company.industry}</p>
            {company.rating && (
              <div className="flex items-center mt-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                <span className="text-sm font-medium">{company.rating}</span>
                {company.totalReviews && (
                  <span className="text-sm text-slate-500 ml-1">
                    ({company.totalReviews} reviews)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Company Description */}
        {company.description && (
          <div>
            <h4 className="font-medium text-slate-900 mb-2">About</h4>
            <p className="text-slate-600 text-sm leading-relaxed">{company.description}</p>
          </div>
        )}

        {/* Company Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600">Company Size:</span>
              <span className="text-sm font-medium">{company.companySize} employees</span>
            </div>
            
            {company.foundedYear && (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Founded:</span>
                <span className="text-sm font-medium">{company.foundedYear}</span>
              </div>
            )}

            {company.website && (
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Website:</span>
                <a 
                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  {company.website}
                </a>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {company.email && (
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Email:</span>
                <span className="text-sm font-medium">{company.email}</span>
              </div>
            )}

            {company.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Phone:</span>
                <span className="text-sm font-medium">{company.phone}</span>
              </div>
            )}

            {(company.address || company.city || company.state) && (
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                <span className="text-sm text-slate-600">Address:</span>
                <span className="text-sm font-medium">
                  {[company.address, company.city, company.state, company.country]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
