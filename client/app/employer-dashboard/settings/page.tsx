"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, Building2, Mail, Phone, MapPin, Shield, Bell, CreditCard, Settings, LogOut, Edit, Save, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { EmployerDashboardNavbar } from "@/components/employer-dashboard-navbar"
import { EmployerDashboardFooter } from "@/components/employer-dashboard-footer"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { apiService } from "@/lib/api"
import { toast } from "sonner"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"
import { CompanyManagement } from "@/components/company-management"
import { CompanyRegistration } from "@/components/company-registration"

export default function EmployerSettingsPage() {
  const router = useRouter()
  const { toast: toastNotification } = useToast()
  const { user, loading, refreshUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Dynamic user data from API
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    designation: "",
    location: "",
    avatar: "",
    companyLogo: "",
    companySize: "",
    industries: [] as string[],
    website: "",
    address: "",
    about: "",
    notifications: {
      email: true,
      sms: false,
      jobApplications: true,
      candidateMatches: true,
      systemUpdates: false,
      marketing: false
    },
    subscription: {
      plan: "Basic",
      status: "Active",
      nextBilling: "",
      features: ["Job Postings", "Basic Analytics", "Email Support"]
    }
  })

  const [formData, setFormData] = useState(userData)

  // Load user and company data
  const loadProfileData = useCallback(async () => {
    if (!user) return
    
    try {
      setLoadingData(true)
      console.log('🔄 Loading employer profile data for user:', user.id)

      // Load user profile data
      const userProfileResponse = await apiService.getUserProfile()
      if (userProfileResponse.success && userProfileResponse.data?.user) {
        const userProfile = userProfileResponse.data.user
        console.log('✅ User profile loaded:', userProfile)
        
        // Load company data if user has a company
        let companyData = null
        if (userProfile.companyId) {
          try {
            const companyResponse = await apiService.getCompany(userProfile.companyId)
            if (companyResponse.success && companyResponse.data) {
              companyData = companyResponse.data
              console.log('✅ Company data loaded:', companyData)
            }
          } catch (error) {
            console.error('❌ Error loading company data:', error)
          }
        }

        // Load notification preferences from backend
        let notificationPrefs = {
          email: true,
          sms: false,
          jobApplications: true,
          candidateMatches: true,
          systemUpdates: false,
          marketing: false
        }
        
        try {
          const notifResponse = await apiService.getNotificationPreferences()
          if (notifResponse.success && notifResponse.data?.notifications) {
            notificationPrefs = {
              ...notificationPrefs,
              ...notifResponse.data.notifications
            }
            console.log('✅ Notification preferences loaded:', notificationPrefs)
          }
        } catch (error) {
          console.error('❌ Error loading notification preferences:', error)
        }

        // Combine user and company data
        const combinedData = {
          firstName: userProfile.firstName || '',
          lastName: userProfile.lastName || '',
          email: userProfile.email || '',
          phone: userProfile.phone || '',
          company: companyData?.name || '',
          designation: userProfile.designation || userProfile.headline || '',
          location: userProfile.currentLocation || '',
          avatar: userProfile.avatar || '',
          companyLogo: companyData?.logo || '',
          companySize: companyData?.companySize || '',
          industries: companyData?.industries || [],
          website: companyData?.website || '',
          address: companyData?.address || '',
          about: companyData?.description || '',
          notifications: notificationPrefs,
          subscription: {
            plan: "Basic",
            status: "Active",
            nextBilling: "",
            features: ["Job Postings", "Basic Analytics", "Email Support"]
          }
        }

        setUserData(combinedData)
        setFormData(combinedData)
        console.log('✅ Profile data combined and set:', combinedData)
      }
    } catch (error) {
      console.error('❌ Error loading profile data:', error)
      toast.error('Failed to load profile data')
    } finally {
      setLoadingData(false)
    }
  }, [user])

  // Load profile data on component mount
  useEffect(() => {
    if (user && !loading) {
      loadProfileData()
    }
  }, [user, loading, loadProfileData])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNotificationChange = async (key: string, value: boolean) => {
    // Update local state immediately for responsive UI
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }))

    // Auto-save to backend
    try {
      console.log(`🔄 Saving notification preference: ${key} = ${value}`)
      
      const updatedNotifications = {
        ...formData.notifications,
        [key]: value
      }

      const response = await apiService.updateNotificationPreferencesFlexible(updatedNotifications)
      
      if (response.success) {
        console.log('✅ Notification preference saved successfully')
        // Update userData to reflect saved state
        setUserData(prev => ({
          ...prev,
          notifications: updatedNotifications
        }))
        toast.success(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ${value ? 'enabled' : 'disabled'}`)
      } else {
        // Revert on failure
        setFormData(prev => ({
          ...prev,
          notifications: {
            ...prev.notifications,
            [key]: !value
          }
        }))
        toast.error('Failed to update notification preference')
      }
    } catch (error: any) {
      console.error('❌ Error saving notification preference:', error)
      // Revert on error
      setFormData(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [key]: !value
        }
      }))
      toast.error('Failed to save notification settings')
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      console.log('💾 Saving employer profile data:', formData)

      // Update user profile
      const userUpdateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        currentLocation: formData.location,
        designation: formData.designation
      }

      const userResponse = await apiService.updateProfile(userUpdateData)
      
      if (userResponse.success) {
        console.log('✅ User profile updated successfully')
        
        // Update company data if user has a company
        if (user?.companyId) {
          try {
            const companyUpdateData = {
              name: formData.company,
              industries: formData.industries,
              companySize: formData.companySize,
              website: formData.website,
              description: formData.about,
              address: formData.address
            }

            const companyResponse = await apiService.updateCompany(user.companyId, companyUpdateData)
            if (companyResponse.success) {
              console.log('✅ Company data updated successfully')
            }
          } catch (error) {
            console.error('❌ Error updating company data:', error)
            // Don't fail the entire save if company update fails
          }
        }

        setUserData(formData)
        setIsEditing(false)
        toast.success('Profile updated successfully!')
        console.log('✅ Profile update completed')
      } else {
        throw new Error(userResponse.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('❌ Error saving profile:', error)
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData(userData)
    setIsEditing(false)
  }

  const handleDeleteAccount = async () => {
    // Verify confirmation text
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" to confirm account deletion')
      return
    }

    setIsDeleting(true)

    try {
      // Get current password from user
      const currentPassword = prompt('Please enter your current password to confirm account deletion:')
      if (!currentPassword) {
        toast.error('Password is required to delete account')
        setIsDeleting(false)
        return
      }

      // Call the delete account API with proper parameters
      const response = await apiService.deleteAccount({
        currentPassword,
        confirmationText: deleteConfirmText
      })
      
      if (response.success) {
        toast.success('Account deleted successfully')
        
        // Clear all local storage
        localStorage.clear()
        sessionStorage.clear()
        
        // Redirect to home page
        setTimeout(() => {
          router.push('/')
        }, 3000)
      } else {
        toast.error(response.message || 'Failed to delete account')
      }
    } catch (error: any) {
      console.error('Delete account error:', error)
      toast.error('Failed to delete account. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // Show loading state while checking authentication or loading data
  if (loading || loadingData) {
    return (
      <EmployerAuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-hidden">
          <EmployerDashboardNavbar />
          <div className="flex items-center justify-center min-h-screen pt-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Loading profile data...</p>
            </div>
          </div>
        </div>
      </EmployerAuthGuard>
    )
  }

  // Redirect if not authenticated
  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <EmployerAuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-auto">
      <EmployerDashboardNavbar />

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200/45 via-cyan-200/35 to-indigo-200/45"></div>
        <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-300/10 to-cyan-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-indigo-300/10 to-violet-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-cyan-300/10 to-blue-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/4 left-0 right-0 h-24 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-indigo-400/20"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
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
              <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
              <p className="text-slate-600">Manage your profile and preferences</p>
            </div>
          </div>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="company" className="flex items-center space-x-2">
              <Building2 className="w-4 h-4" />
              <span>Company</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>Subscription</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-6">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={userData.avatar} alt={`${userData.firstName} ${userData.lastName}`} />
                    <AvatarFallback className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                      {getInitials(userData.firstName, userData.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {userData.firstName} {userData.lastName}
                    </h3>
                    <p className="text-slate-600">{userData.designation}</p>
                    <p className="text-sm text-slate-500">{userData.company}</p>
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="company" className="space-y-6">
            {user?.companyId ? (
              <CompanyManagement 
                companyId={user.companyId}
                onCompanyUpdated={() => {
                  // Refresh user data
                  loadProfileData()
                }}
              />
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                      No Company Registered
                    </h3>
                    <p className="text-slate-600 mb-4">
                      You need to register a company to access company features
                    </p>
                    <CompanyRegistration 
                      onCompanyCreated={async () => {
                        // Wait a moment for backend to complete user update
                        setTimeout(async () => {
                          try {
                            await refreshUser()
                            toast.success('Company created successfully! User data refreshed.')
                          } catch (error) {
                            console.error('Error refreshing user data:', error)
                            // Fallback to page reload
                            window.location.reload()
                          }
                        }, 1000) // Wait 1 second for backend to complete
                      }}
                      userId={user?.id || ''}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <div>
                      <h4 className="font-medium text-slate-900">Email Notifications</h4>
                      <p className="text-sm text-slate-600">Receive updates via email</p>
                    </div>
                    <Switch
                      checked={formData.notifications.email}
                      onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <div>
                      <h4 className="font-medium text-slate-900">SMS Notifications</h4>
                      <p className="text-sm text-slate-600">Receive updates via SMS</p>
                    </div>
                    <Switch
                      checked={formData.notifications.sms}
                      onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <div>
                      <h4 className="font-medium text-slate-900">Job Application Alerts</h4>
                      <p className="text-sm text-slate-600">Notify when candidates apply to your jobs</p>
                    </div>
                    <Switch
                      checked={formData.notifications.jobApplications}
                      onCheckedChange={(checked) => handleNotificationChange('jobApplications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <div>
                      <h4 className="font-medium text-slate-900">Candidate Match Alerts</h4>
                      <p className="text-sm text-slate-600">Notify when candidates match your requirements</p>
                    </div>
                    <Switch
                      checked={formData.notifications.candidateMatches}
                      onCheckedChange={(checked) => handleNotificationChange('candidateMatches', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <div>
                      <h4 className="font-medium text-slate-900">System Updates</h4>
                      <p className="text-sm text-slate-600">Important platform updates and announcements</p>
                    </div>
                    <Switch
                      checked={formData.notifications.systemUpdates}
                      onCheckedChange={(checked) => handleNotificationChange('systemUpdates', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <div>
                      <h4 className="font-medium text-slate-900">Marketing & Promotions</h4>
                      <p className="text-sm text-slate-600">Special offers and promotional content</p>
                    </div>
                    <Switch
                      checked={formData.notifications.marketing}
                      onCheckedChange={(checked) => handleNotificationChange('marketing', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Subscription Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{userData.subscription.plan} Plan</h3>
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        {userData.subscription.status}
                      </Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      onClick={() => router.push('/pricing')}
                    >
                      Upgrade Plan
                    </Button>
                  </div>
                  <p className="text-slate-600 mb-4">Next billing date: {userData.subscription.nextBilling}</p>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-900">Included Features:</h4>
                    <ul className="space-y-1">
                      {userData.subscription.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm text-slate-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button variant="outline" className="flex-1">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Billing History
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Shield className="w-4 h-4 mr-2" />
                    Security Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Danger Zone */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-red-700">Delete Account</h4>
                  <p className="text-sm text-red-600">Permanently delete your account and all data</p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>

              {/* Delete Confirmation Dialog */}
              {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <Card className="w-full max-w-md">
                    <CardHeader>
                      <CardTitle className="text-red-600">⚠️ Confirm Account Deletion</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800 font-medium mb-2">
                          This action cannot be undone. This will permanently delete:
                        </p>
                        <ul className="text-sm text-red-700 space-y-1 ml-4 list-disc">
                          <li>Your user account</li>
                          <li>All uploaded documents and resumes</li>
                          <li>Job applications and bookmarks</li>
                          <li>Interview schedules</li>
                          <li>Messages and notifications</li>
                          {user?.userType === 'admin' && (
                            <>
                              <li className="font-semibold">Your company profile (if you're the only admin)</li>
                              <li className="font-semibold">All company jobs and applications</li>
                            </>
                          )}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="delete-confirm" className="text-sm font-medium">
                          Type <span className="font-mono font-bold bg-red-100 px-2 py-1 rounded">DELETE MY ACCOUNT</span> to confirm
                        </Label>
                        <Input
                          id="delete-confirm"
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="Type DELETE MY ACCOUNT"
                          className="font-mono"
                          autoFocus
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowDeleteConfirm(false)
                            setDeleteConfirmText('')
                          }}
                          disabled={isDeleting}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteAccount}
                          disabled={isDeleting || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                          className="flex-1"
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <LogOut className="w-4 h-4 mr-2" />
                              Delete Forever
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <EmployerDashboardFooter />
      </div>
    </EmployerAuthGuard>
  )
} 