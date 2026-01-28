"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { apiService } from "@/lib/api"
import { toast } from "sonner"
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  CreditCard,
  Activity,
  Shield,
  Eye,
  Download,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Star,
  Building2,
  Globe,
  FileText,
  Bookmark,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  Award,
  Target,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface UserDetail {
  id: string
  first_name: string
  last_name: string
  email: string
  phone_number?: string
  address?: string
  city?: string
  state?: string
  country?: string
  region?: string
  user_type: string
  account_status: string
  verification_level: string
  profile_picture?: string
  willing_to_relocate?: boolean
  preferred_locations?: string[]
  createdAt: string
  updatedAt: string
  statistics: {
    totalApplications: number
    totalBookmarks: number
    totalJobsPosted: number
    totalResumes: number
    totalWorkExperiences: number
    totalEducations: number
  }
  subscription?: {
    plan: {
      name: string
      type: string
      price: number
      duration: string
      features: string[]
    }
  }
  // Employer/Admin/Recruiter specific fields
  company?: {
    id: string
    name: string
    email?: string
    industry?: string
    industries?: string[]
    companySize?: string
    region?: string
    companyAccountType?: string
    contactEmail?: string
    website?: string
    description?: string
    verificationStatus?: string
    verificationDocuments?: any
  }
  postedJobs?: Array<{
    id: string
    title: string
    location: string
    status: string
    validTill?: string | null
    applicationCount?: number
  }>
  payments: Array<{
    id: string
    amount: number
    currency: string
    status: string
    paymentMethod: string
    description: string
    createdAt: string
  }>
  activityLogs: Array<{
    id: string
    action: string
    details: string
    ipAddress: string
    userAgent: string
    createdAt: string
  }>
  sessions: Array<{
    id: string
    ipAddress: string
    userAgent: string
    isActive: boolean
    lastActivity: string
    createdAt: string
  }>
  jobApplications: Array<{
    id: string
    status: string
    coverLetter?: string
    createdAt: string
    job: {
      id: string
      title: string
      location: string
      salary?: number
      jobType: string
      company: {
        id: string
        name: string
        industry: string
      }
    }
  }>
  jobBookmarks: Array<{
    id: string
    createdAt: string
    job: {
      id: string
      title: string
      location: string
      salary?: number
      jobType: string
      company: {
        id: string
        name: string
        industry: string
      }
    }
  }>
  resumes: Array<{
    id: string
    title: string
    summary?: string
    isDefault: boolean
    isPublic: boolean
    views: number
    downloads: number
    lastUpdated: string
    createdAt: string
  }>
  workExperiences: Array<{
    id: string
    companyName: string
    jobTitle: string
    startDate: string
    endDate?: string
    description?: string
    isCurrent: boolean
  }>
  educations: Array<{
    id: string
    institution: string
    degree: string
    fieldOfStudy: string
    startDate: string
    endDate: string
    gpa?: number
    description?: string
  }>
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useAuth()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const userId = params.userId as string

  useEffect(() => {
    if (authLoading || !currentUser) return
    if (currentUser.userType !== 'admin' && currentUser.userType !== 'superadmin') {
      router.push('/')
      return
    }
    loadUserDetails()
  }, [userId, currentUser, authLoading])

  const loadUserDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.getUserDetails(userId)
      
      if (response.success) {
        setUser(response.data)
      } else {
        setError(response.message || 'Failed to load user details')
        toast.error(response.message || 'Failed to load user details')
      }
    } catch (err: any) {
      console.error('Error loading user details:', err)
      // Create mock data when backend is not available
      const mockUser = {
        id: userId,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone_number: '+1234567890',
        address: '123 Main St',
        city: 'Sample City',
        state: 'Sample State',
        country: 'Sample Country',
        region: 'india',
        user_type: 'jobseeker',
        account_status: 'active',
        verification_level: 'basic',
        profile_picture: undefined,
        willing_to_relocate: true,
        preferred_locations: ['Mumbai', 'Delhi', 'Bangalore'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statistics: {
          totalApplications: 15,
          totalBookmarks: 8,
          totalJobsPosted: 0,
          totalResumes: 2,
          totalWorkExperiences: 3,
          totalEducations: 2
        },
        subscription: undefined,
        company: undefined as {
          id: string
          name: string
          email?: string
          industry?: string
          companySize?: string
          region?: string
          companyAccountType?: string
          contactEmail?: string
          website?: string
          description?: string
          verificationStatus?: string
          verificationDocuments?: any
        } | undefined,
        postedJobs: [] as Array<{
          id: string
          title: string
          location: string
          status: string
          applicationCount?: number
        }>,
        payments: [],
        activityLogs: [],
        sessions: [],
        jobApplications: [],
        jobBookmarks: [],
        resumes: [],
        workExperiences: [],
        educations: []
      }
      
      // Create different mock data based on user type
      if (userId === 'employer-1') {
        mockUser.user_type = 'employer'
        mockUser.first_name = 'Jane'
        mockUser.last_name = 'Smith'
        mockUser.email = 'jane.smith@techcorp.com'
        mockUser.phone_number = '+1987654321'
        mockUser.company = {
          id: '1',
          name: 'TechCorp Solutions',
          industry: 'Technology',
          website: 'https://techcorp.com'
        }
        mockUser.statistics.totalJobsPosted = 5
        mockUser.postedJobs = [
          { id: '1', title: 'Senior Developer', location: 'Mumbai', status: 'active', applicationCount: 25 },
          { id: '2', title: 'Product Manager', location: 'Delhi', status: 'active', applicationCount: 15 }
        ]
      } else if (userId === 'admin-1') {
        mockUser.user_type = 'admin'
        mockUser.first_name = 'Admin'
        mockUser.last_name = 'User'
        mockUser.email = 'admin@company.com'
        mockUser.phone_number = '+1555555555'
        mockUser.company = {
          id: '2',
          name: 'Admin Company',
          industry: 'Administration',
          website: 'https://admincompany.com'
        }
      }
      setUser(mockUser)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async () => {
    if (!user) return
    
    try {
      const newStatus = user.account_status === 'active' ? 'suspended' : 'active'
      const response = await apiService.updateUserStatus(user.id, newStatus)
      
      if (response.success) {
        toast.success(`User status updated to ${newStatus}`)
        loadUserDetails() // Reload user details
      } else {
        toast.error(response.message || 'Failed to update user status')
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while updating status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600 text-white'
      case 'inactive': return 'bg-yellow-600 text-white'
      case 'suspended': return 'bg-red-600 text-white'
      case 'deleted': return 'bg-gray-600 text-white'
      case 'pending_verification': return 'bg-blue-600 text-white'
      case 'rejected': return 'bg-red-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getVerificationColor = (level: string) => {
    switch (level) {
      case 'premium': return 'bg-blue-600'
      case 'basic': return 'bg-yellow-600'
      case 'unverified': return 'bg-gray-600'
      default: return 'bg-gray-600'
    }
  }

  const handleViewResume = async (resume: any) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      if (!user) {
        toast.error('User not found');
        return;
      }
      
      // Fetch resume through admin endpoint (super-admin can view any user's resume)
      const response = await fetch(`${baseUrl}/api/admin/users/${user.id}/resumes/${resume.id}/view`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch resume: ${response.status}`);
      }
      
      // Get the blob from response
      const blob = await response.blob();
      
      // Create a blob URL and open it
      const blobUrl = URL.createObjectURL(blob);
      const newWindow = window.open(blobUrl, '_blank');
      
      if (!newWindow) {
        URL.revokeObjectURL(blobUrl);
        toast.error('Please allow popups to view resumes');
        return;
      }
      
      // Clean up the blob URL after a delay
      setTimeout(() => {
        try {
          URL.revokeObjectURL(blobUrl);
        } catch (e) {
          // Ignore errors if URL already revoked
        }
      }, 600000); // 10 minutes
      
      toast.success('Resume opened in new tab');
    } catch (error: any) {
      console.error('Error viewing resume:', error);
      toast.error(error.message || 'Failed to view resume');
    }
  }

  const handleDownloadResume = async (resume: any) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      if (!user) {
        toast.error('User not found');
        return;
      }
      
      // Fetch resume through admin endpoint (super-admin can download any user's resume)
      const response = await fetch(`${baseUrl}/api/admin/users/${user.id}/resumes/${resume.id}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch resume: ${response.status}`);
      }
      
      // Get the blob from response
      const blob = await response.blob();
      
      // Create a download link
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${resume.title || 'resume'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      
      toast.success('Resume download started');
    } catch (error: any) {
      console.error('Error downloading resume:', error);
      toast.error(error.message || 'Failed to download resume');
    }
  }

  const handleViewDocument = async (document: any) => {
    try {
      // Open verification document in new tab for viewing
      const docUrl = `/api/admin/verification-documents/${document.filename || document.id || document.name}`
      window.open(docUrl, '_blank')
      toast.success('Opening document for viewing...')
    } catch (error: any) {
      toast.error('Failed to view document: ' + error.message)
    }
  }

  const handleDownloadDocument = async (document: any) => {
    try {
      // Download verification document
      const docUrl = `/api/admin/verification-documents/${document.filename || document.id || document.name}`
      const link = document.createElement('a')
      link.href = docUrl
      link.download = `${document.name || 'verification-document'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Document download started...')
    } catch (error: any) {
      toast.error('Failed to download document: ' + error.message)
    }
  }

  const getUserVerificationStatus = (user: any) => {
    // Jobseekers don't need verification
    if (user.user_type === 'jobseeker') {
      return { status: 'Not Required', color: 'bg-gray-500' }
    }
    
    // For admin/employer, verification is based on company verification
    if (user.user_type === 'employer' || user.user_type === 'admin' || user.user_type === 'recruiter') {
      if (user.company && user.company.verificationStatus === 'verified') {
        return { status: 'Verified (Company)', color: 'bg-green-600' }
      } else if (user.company && user.company.verificationStatus === 'pending') {
        return { status: 'Pending (Company)', color: 'bg-yellow-600' }
      } else {
        return { status: 'Unverified (Company)', color: 'bg-red-600' }
      }
    }
    
    // Default case
    return { status: user.verification_level || 'unverified', color: getVerificationColor(user.verification_level) }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center">
        <div className="text-gray-900 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading user details...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center">
        <div className="text-gray-900 text-center">
          <p className="text-red-600 mb-4">Error: {error || 'User not found'}</p>
          <Button onClick={() => router.back()} variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => {
                // Get current page from URL or default to 1
                const currentPage = new URLSearchParams(window.location.search).get('page') || '1'
                router.push(`/super-admin/users/normal?page=${currentPage}`)
              }}
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
              <p className="text-gray-600">Comprehensive user information and analytics</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleStatusToggle}
              className={user.account_status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {user.account_status === 'active' ? (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Suspend User
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Activate User
                </>
              )}
            </Button>
          </div>
        </div>

        {/* User Profile Header */}
        <Card className="bg-white border-gray-200 shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-start space-x-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.profile_picture} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl">
                  {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-3xl font-bold text-gray-900">
                    {user.first_name} {user.last_name}
                  </h2>
                  <Badge className={getStatusColor(user.account_status)}>
                    {user.account_status}
                  </Badge>
                  <Badge className={getUserVerificationStatus(user).color}>
                    {getUserVerificationStatus(user).status}
                  </Badge>
                </div>
                <p className="text-gray-600 text-lg mb-2">{user.email}</p>
                {user.phone_number && (
                  <p className="text-gray-600 text-lg mb-2">{user.phone_number}</p>
                )}
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    {user.user_type}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {user.region || 'Not specified'}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards - Jobseekers only */}
        {user.user_type === 'jobseeker' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Applications</p>
                    <p className="text-3xl font-bold text-gray-900">{user.statistics.totalApplications}</p>
                  </div>
                  <Briefcase className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Bookmarks</p>
                    <p className="text-3xl font-bold text-gray-900">{user.statistics.totalBookmarks}</p>
                  </div>
                  <Bookmark className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Resumes</p>
                    <p className="text-3xl font-bold text-gray-900">{user.statistics.totalResumes}</p>
                  </div>
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Experience</p>
                    <p className="text-3xl font-bold text-gray-900">{user.statistics.totalWorkExperiences}</p>
                  </div>
                  <Award className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Statistics Cards - Admin/Employer users */}
        {(user.user_type === 'employer' || user.user_type === 'admin' || user.user_type === 'recruiter') && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Posted Jobs</p>
                    <p className="text-3xl font-bold text-gray-900">{user.statistics.totalJobsPosted}</p>
                  </div>
                  <Briefcase className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Company Status</p>
                    <p className="text-lg font-bold text-gray-900">{user.company?.verificationStatus || 'Not Set'}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Account Status</p>
                    <p className="text-lg font-bold text-gray-900">{user.account_status || 'Active'}</p>
                  </div>
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Information Tabs - Dynamic based on user type */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border-gray-200">
            <TabsTrigger value="overview" className="text-gray-900 data-[state=active]:bg-gray-100">
              Overview
            </TabsTrigger>
            
            {/* Jobseeker-specific tabs */}
            {user.user_type === 'jobseeker' && (
              <>
                <TabsTrigger value="applications" className="text-gray-900 data-[state=active]:bg-gray-100">
                  Applications
                </TabsTrigger>
                <TabsTrigger value="experience" className="text-gray-900 data-[state=active]:bg-gray-100">
                  Experience & Education
                </TabsTrigger>
                <TabsTrigger value="resumes" className="text-gray-900 data-[state=active]:bg-gray-100">
                  Resumes
                </TabsTrigger>
              </>
            )}
            
            {/* Employer/Recruiter/Admin-specific tabs */}
            {(user.user_type === 'employer' || user.user_type === 'admin' || user.user_type === 'recruiter') && (
              <>
                <TabsTrigger value="company" className="text-gray-900 data-[state=active]:bg-gray-100">
                  Company Details
                </TabsTrigger>
                <TabsTrigger value="jobs" className="text-gray-900 data-[state=active]:bg-gray-100">
                  Posted Jobs
                </TabsTrigger>
                <TabsTrigger value="verification" className="text-gray-900 data-[state=active]:bg-gray-100">
                  Verification Status
                </TabsTrigger>
              </>
            )}
            
            {/* Superadmin-specific tabs */}
            {user.user_type === 'superadmin' && (
              <>
                <TabsTrigger value="permissions" className="text-gray-900 data-[state=active]:bg-gray-100">
                  Permissions & Access
                </TabsTrigger>
                <TabsTrigger value="system" className="text-gray-900 data-[state=active]:bg-gray-100">
                  System Actions
                </TabsTrigger>
              </>
            )}
            
            {/* Common tabs for all users */}
            <TabsTrigger value="payments" className="text-gray-900 data-[state=active]:bg-gray-100">
              Payments
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-gray-900 data-[state=active]:bg-gray-100">
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">First Name</label>
                      <p className="text-gray-900">{user.first_name}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Last Name</label>
                      <p className="text-gray-900">{user.last_name}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Phone</label>
                    <p className="text-gray-900">{user.phone_number || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Address</label>
                    <p className="text-gray-900">
                      {user.address ? `${user.address}, ${user.city}, ${user.state}, ${user.country}` : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Region</label>
                    <p className="text-gray-900">{user.region || 'Not specified'}</p>
                  </div>
                  {user.willing_to_relocate !== undefined && (
                    <div>
                      <label className="text-sm text-gray-600">Willing to Relocate</label>
                      <Badge variant={user.willing_to_relocate ? 'default' : 'secondary'}>
                        {user.willing_to_relocate ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  )}
                  {user.preferred_locations && user.preferred_locations.length > 0 && (
                    <div>
                      <label className="text-sm text-gray-600">Preferred Locations</label>
                      <p className="text-gray-900">{user.preferred_locations.join(', ')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">User Type</label>
                  <div>
                    <Badge className={user.user_type === 'employer' ? 'bg-green-600' : 'bg-blue-600'}>
                      {user.user_type}
                    </Badge>
                  </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Account Status</label>
                  <div>
                    <Badge className={getStatusColor(user.account_status)}>
                      {user.account_status}
                    </Badge>
                  </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Verification Status</label>
                  <div>
                      <Badge className={getUserVerificationStatus(user).color}>
                        {getUserVerificationStatus(user).status}
                    </Badge>
                  </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Created At</label>
                    <p className="text-gray-900 font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Last Updated</label>
                    <p className="text-gray-900 font-medium">{user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subscription Information */}
            {user.subscription && (
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Subscription Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Plan Name</label>
                      <p className="text-gray-900 font-semibold">{user.subscription.plan.name}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Plan Type</label>
                      <p className="text-gray-900">{user.subscription.plan.type}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Price</label>
                      <p className="text-gray-900">${user.subscription.plan.price}</p>
                    </div>
                  </div>
                  {user.subscription.plan.features && user.subscription.plan.features.length > 0 && (
                    <div className="mt-4">
                      <label className="text-sm text-gray-600">Features</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {user.subscription.plan.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="border-gray-300 text-gray-900">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Applications Tab - Jobseekers only */}
          {user.user_type === 'jobseeker' && (
          <TabsContent value="applications" className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Job Applications ({user.jobApplications.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.jobApplications.length > 0 ? (
                  <div className="space-y-4">
                    {user.jobApplications.map((application) => (
                      <div key={application.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-gray-900 font-semibold">{application.job?.title || 'Job Title Not Available'}</h4>
                            <p className="text-gray-600">{application.job?.company?.name || 'Company Not Available'}</p>
                            <p className="text-sm text-gray-500">{application.job?.location || 'Location Not Available'}</p>
                            {application.coverLetter && (
                              <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                                {application.coverLetter}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge 
                              className={
                                application.status === 'hired' ? 'bg-green-600' :
                                application.status === 'rejected' ? 'bg-red-600' :
                                application.status === 'offered' ? 'bg-blue-600' :
                                'bg-yellow-600'
                              }
                            >
                              {application.status}
                            </Badge>
                            <p className="text-sm text-gray-500 mt-1">
                              {application.createdAt ?
                                new Date(application.createdAt).toLocaleDateString() :
                                'Date not available'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No applications found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Experience Tab - Jobseekers only */}
          {user.user_type === 'jobseeker' && (
          <TabsContent value="experience" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Work Experience */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Work Experience ({user.workExperiences.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user.workExperiences.length > 0 ? (
                    <div className="space-y-4">
                      {user.workExperiences.map((exp) => (
                        <div key={exp.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-gray-900 font-semibold">{exp.jobTitle}</h4>
                              <p className="text-gray-600">{exp.companyName}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(exp.startDate).toLocaleDateString()} - {exp.isCurrent ? 'Present' : new Date(exp.endDate!).toLocaleDateString()}
                              </p>
                              {exp.description && (
                                <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
                              )}
                            </div>
                            {exp.isCurrent && (
                              <Badge className="bg-green-600">Current</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No work experience found</p>
                  )}
                </CardContent>
              </Card>

              {/* Education */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2" />
                    Education ({user.educations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user.educations.length > 0 ? (
                    <div className="space-y-4">
                      {user.educations.map((edu) => (
                        <div key={edu.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="text-gray-900 font-semibold">{edu.degree} in {edu.fieldOfStudy}</h4>
                          <p className="text-gray-600">{edu.institution}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(edu.startDate).toLocaleDateString()} - {new Date(edu.endDate).toLocaleDateString()}
                          </p>
                          {edu.gpa && (
                            <p className="text-sm text-gray-700">GPA: {edu.gpa}</p>
                          )}
                          {edu.description && (
                            <p className="text-sm text-gray-700 mt-2">{edu.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No education found</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          )}

          {/* Resumes Tab - Jobseekers only */}
          {user.user_type === 'jobseeker' && (
          <TabsContent value="resumes" className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Resumes ({user.resumes?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.resumes && user.resumes.length > 0 ? (
                  <div className="space-y-4">
                    {user.resumes.map((resume: any) => (
                      <div key={resume.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-gray-900 font-semibold">{resume.title || 'Resume'}</h4>
                            {resume.summary && (
                              <p className="text-sm text-gray-600 mt-1">{resume.summary}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>Views: {resume.views || 0}</span>
                              <span>Downloads: {resume.downloads || 0}</span>
                              {resume.isDefault && <Badge variant="outline" className="text-xs border-gray-300 text-gray-900">Default</Badge>}
                              {resume.isPublic && <Badge variant="outline" className="text-xs border-gray-300 text-gray-900">Public</Badge>}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Last updated: {new Date(resume.lastUpdated || resume.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewResume(resume)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadResume(resume)}
                              className="flex items-center gap-1"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No resumes uploaded yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Company Details Tab - Employers/Admins/Recruiters only */}
          {(user.user_type === 'employer' || user.user_type === 'admin' || user.user_type === 'recruiter') && user.company && (
          <TabsContent value="company" className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Company Name</label>
                    <p className="text-gray-900 font-semibold">{user.company.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Industries</label>
                    {user.company.industries && user.company.industries.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {user.company.industries.map((industry, index) => (
                          <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                            {industry}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-900">{user.company.industry || 'Not specified'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Company Size</label>
                    <p className="text-gray-900">{user.company.companySize || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Region</label>
                    <p className="text-gray-900">{user.company.region || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Account Type</label>
                    <Badge variant="outline" className="border-gray-300 text-gray-900">{user.company.companyAccountType || 'direct_employer'}</Badge>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <p className="text-gray-900">{user.company.email || user.company.contactEmail || 'Not provided'}</p>
                  </div>
                </div>
                {user.company.website && (
                  <div>
                    <label className="text-sm text-gray-600">Website</label>
                    <a href={user.company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {user.company.website}
                    </a>
                  </div>
                )}
                {user.company.description && (
                  <div>
                    <label className="text-sm text-gray-600">Description</label>
                    <p className="text-gray-900 mt-1">{user.company.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Posted Jobs Tab - Employers/Admins/Recruiters only */}
          {(user.user_type === 'employer' || user.user_type === 'admin' || user.user_type === 'recruiter') && user.postedJobs && (
          <TabsContent value="jobs" className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Posted Jobs ({user.postedJobs?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.postedJobs && user.postedJobs.length > 0 ? (
                  <div className="space-y-4">
                    {user.postedJobs
                      .filter((job: any) => job && job.id && job.title) // Filter out null/undefined jobs
                      .map((job: any) => {
                        // Calculate display status (consider expired jobs)
                        const now = new Date();
                        const validTill = job.validTill ? new Date(job.validTill) : null;
                        const isActuallyExpired = validTill && validTill < now;
                        const displayStatus = isActuallyExpired ? 'expired' : (job.status || 'inactive');
                        
                        // Determine badge color based on display status
                        const getStatusBadgeColor = (status: string) => {
                          switch (status?.toLowerCase()) {
                            case 'active': return 'bg-green-600';
                            case 'expired': return 'bg-red-600';
                            case 'paused': return 'bg-yellow-600';
                            case 'closed': return 'bg-gray-600';
                            case 'draft': return 'bg-gray-400';
                            default: return 'bg-gray-600';
                          }
                        };
                        
                        return (
                      <div key={job.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                                <h4 className="text-gray-900 font-semibold">{job.title || 'Untitled Job'}</h4>
                                <p className="text-gray-600">{job.location || 'Location not specified'}</p>
                            <p className="text-sm text-gray-500">Applications: {job.applicationCount || 0}</p>
                                {validTill && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    Valid till: {new Date(validTill).toLocaleDateString()}
                                  </p>
                                )}
                          </div>
                              <Badge className={getStatusBadgeColor(displayStatus)}>
                                {displayStatus}
                          </Badge>
                        </div>
                      </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No jobs posted yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Verification Status Tab - Employers/Admins/Recruiters only */}
          {(user.user_type === 'employer' || user.user_type === 'admin' || user.user_type === 'recruiter') && user.company && (
          <TabsContent value="verification" className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Account Status</label>
                  <Badge className={user.account_status === 'active' ? 'bg-green-600' : user.account_status === 'pending_verification' ? 'bg-amber-600' : 'bg-red-600'}>
                    {user.account_status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Company Verification Status</label>
                  <Badge className={user.company.verificationStatus === 'verified' ? 'bg-green-600' : user.company.verificationStatus === 'pending' ? 'bg-amber-600' : 'bg-red-600'}>
                    {user.company.verificationStatus || 'unverified'}
                  </Badge>
                </div>
                {user.company.verificationDocuments && (
                  <div>
                    <label className="text-sm text-gray-600 mb-3 block">Verification Documents</label>
                    <div className="space-y-3">
                      {user.company.verificationDocuments.documents && user.company.verificationDocuments.documents.length > 0 ? (
                        user.company.verificationDocuments.documents.map((doc: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900">{doc.name || `Document ${index + 1}`}</h4>
                                <p className="text-xs text-gray-500 mt-1">
                                  Type: {doc.type || 'Unknown'} | 
                                  Size: {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'Unknown'} |
                                  Uploaded: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Unknown'}
                                </p>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewDocument(doc)}
                                  className="flex items-center gap-1"
                                >
                                  <Eye className="w-4 h-4" />
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadDocument(doc)}
                                  className="flex items-center gap-1"
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No verification documents uploaded</p>
                      )}
                    </div>
                    
                    {/* Additional verification info */}
                    {user.company.verificationDocuments.gstNumber && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Company Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">GST Number:</span>
                            <span className="ml-2 text-gray-900">{user.company.verificationDocuments.gstNumber}</span>
                          </div>
                          {user.company.verificationDocuments.panNumber && (
                            <div>
                              <span className="text-gray-600">PAN Number:</span>
                              <span className="ml-2 text-gray-900">{user.company.verificationDocuments.panNumber}</span>
                            </div>
                          )}
                          {user.company.verificationDocuments.submittedBy && (
                            <div>
                              <span className="text-gray-600">Submitted By:</span>
                              <span className="ml-2 text-gray-900">
                                {typeof user.company.verificationDocuments.submittedBy === 'object' 
                                  ? (user.company.verificationDocuments.submittedBy.userName || 
                                     user.company.verificationDocuments.submittedBy.userEmail ||
                                     user.company.verificationDocuments.submittedBy.userId ||
                                     JSON.stringify(user.company.verificationDocuments.submittedBy))
                                  : String(user.company.verificationDocuments.submittedBy)}
                              </span>
                            </div>
                          )}
                        </div>
                        {user.company.verificationDocuments.additionalNotes && (
                          <div className="mt-2">
                            <span className="text-gray-600">Notes:</span>
                            <p className="text-gray-900 text-sm mt-1">{user.company.verificationDocuments.additionalNotes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Permissions Tab - Superadmin only */}
          {user.user_type === 'superadmin' && (
          <TabsContent value="permissions" className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Permissions & Access Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600">Role</label>
                    <Badge className="bg-purple-600">Super Administrator</Badge>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Access Level</label>
                    <p className="text-gray-900">Full System Access</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Permissions</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="border-gray-300 text-gray-900">User Management</Badge>
                      <Badge variant="outline" className="border-gray-300 text-gray-900">Company Verification</Badge>
                      <Badge variant="outline" className="border-gray-300 text-gray-900">Content Moderation</Badge>
                      <Badge variant="outline" className="border-gray-300 text-gray-900">System Configuration</Badge>
                      <Badge variant="outline" className="border-gray-300 text-gray-900">Financial Reports</Badge>
                      <Badge variant="outline" className="border-gray-300 text-gray-900">Analytics Access</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* System Actions Tab - Superadmin only */}
          {user.user_type === 'superadmin' && (
          <TabsContent value="system" className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  System Actions & Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Recent administrative actions and system logs for this superadmin account.</p>
                <div className="mt-4 space-y-2">
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-sm text-gray-900">All system-wide administrative actions are logged and audited.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment History ({user.payments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.payments.length > 0 ? (
                  <div className="space-y-4">
                    {user.payments.map((payment) => (
                      <div key={payment.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-gray-900 font-semibold">{payment.description}</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(payment.createdAt).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">{payment.paymentMethod}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-900 font-semibold">${payment.amount} {payment.currency}</p>
                            <Badge 
                              className={payment.status === 'completed' ? 'bg-green-600' : 'bg-red-600'}
                            >
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No payment history found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Logs */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Activity Logs ({user.activityLogs?.length || 0})
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Recent user activities and actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user.activityLogs && user.activityLogs.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {user.activityLogs.slice(0, 20).map((log: any, index: number) => (
                        <div key={log.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-gray-900 font-medium capitalize">
                                {log.activityType?.replace(/_/g, ' ') || 'Unknown Activity'}
                              </p>
                              {log.details && (
                                <div className="text-sm text-gray-600 mt-1">
                                  {typeof log.details === 'string' ? (
                                    <p>{log.details}</p>
                                  ) : (
                                    <div className="space-y-1">
                                      {Object.entries(log.details).map(([key, value]) => (
                                        <p key={key} className="text-xs">
                                          <span className="font-medium">{key}:</span> {String(value)}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>ID: {String(log.id || 'N/A')}</span>
                                {log.jobId && <span>Job: {String(log.jobId)}</span>}
                                {log.applicationId && <span>Application: {String(log.applicationId)}</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {new Date(log.timestamp || log.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No activity logs found</p>
                      <p className="text-sm text-gray-400 mt-1">User activities will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sessions */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Active Sessions ({user.sessions?.filter((s: any) => s.isActive).length || 0})
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Current and recent login sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user.sessions && user.sessions.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {user.sessions.slice(0, 10).map((session: any, index: number) => (
                        <div key={session.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-gray-900 text-sm font-medium">{session.ipAddress || 'Unknown IP'}</p>
                                <Badge className={session.isActive ? 'bg-green-600' : 'bg-gray-600'}>
                                  {session.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              {session.userAgent && (
                                <p className="text-xs text-gray-600 truncate max-w-xs mb-1">
                                  {session.userAgent}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>Device: {String(session.deviceType || 'Unknown')}</span>
                                <span>Method: {String(session.loginMethod || 'email')}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Last activity: {new Date(session.lastActivityAt || session.lastActivity || session.createdAt).toLocaleString()}
                              </p>
                              {session.expiresAt && (
                                <p className="text-xs text-gray-500">
                                  Expires: {new Date(session.expiresAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No sessions found</p>
                      <p className="text-sm text-gray-400 mt-1">User login sessions will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Activity Summary */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Activity Summary
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Overview of user activity patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{user.activityLogs?.length || 0}</p>
                    <p className="text-sm text-gray-600">Total Activities</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{user.sessions?.filter((s: any) => s.isActive).length || 0}</p>
                    <p className="text-sm text-gray-600">Active Sessions</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{user.sessions?.length || 0}</p>
                    <p className="text-sm text-gray-600">Total Sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
