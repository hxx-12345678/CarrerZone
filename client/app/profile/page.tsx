"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { constructAvatarUrl } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  User,
  Save,
  Camera,
  Edit3,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  FileText,
  Star,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { toast } from 'sonner'
import { apiService } from '@/lib/api'

export default function ProfilePage() {
  const { user, loading, updateUser, refreshUser, debouncedRefreshUser, refreshing } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    currentLocation: '',
    headline: '',
    summary: '',
    skills: '',
    languages: '',
    expectedSalary: '',
    noticePeriod: '',
    willingToRelocate: false,
    linkedin: '',
    github: ''
  })
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [profileCompletion, setProfileCompletion] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please sign in to edit your profile')
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        currentLocation: user.currentLocation || '',
        headline: user.headline || '',
        summary: user.summary || '',
        skills: Array.isArray(user.skills) ? user.skills.join(', ') : user.skills || '',
        languages: Array.isArray(user.languages) ? user.languages.join(', ') : user.languages || '',
        expectedSalary: user.expectedSalary?.toString() || '',
        noticePeriod: user.noticePeriod?.toString() || '',
        willingToRelocate: user.willingToRelocate || false,
        linkedin: (user as any)?.socialLinks?.linkedin || '',
        github: (user as any)?.socialLinks?.github || ''
      })
      calculateProfileCompletion()
    }
  }, [user])

  // Refresh user data when component mounts to ensure we have the latest data
  useEffect(() => {
    if (!loading && user) {
      refreshUser()
    }
  }, [loading, user, refreshUser])

  // Remove the aggressive 30-second interval that was causing rate limiting
  // Instead, we'll refresh only when needed (after updates, etc.)

  const calculateProfileCompletion = () => {
    if (!user) return
    
    const fields = [
      user.firstName,
      user.lastName,
      user.email,
      user.phone,
      user.currentLocation,
      user.headline,
      user.summary,
      user.avatar,
      user.skills,
      user.languages
    ]
    
    const completedFields = fields.filter(field => {
      if (Array.isArray(field)) {
        return field.length > 0
      }
      return field && field.toString().trim() !== ''
    }).length
    
    const completion = Math.round((completedFields / fields.length) * 100)
    setProfileCompletion(completion)
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, GIF, WebP)')
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB')
      return
    }

    try {
      setUploadingAvatar(true)
      console.log('🔍 Uploading avatar file:', file.name, file.size, file.type)
      console.log('🔍 Current user avatar before upload:', user?.avatar)
      
      const response = await apiService.uploadAvatar(file)
      console.log('🔍 Avatar upload response:', response)
      
      if (response.success) {
        console.log('🔍 Response data:', response.data)
        
        // Update user data in context and localStorage immediately
        if (response.data?.user) {
          console.log('🔍 Updating user with new avatar:', response.data.user.avatar)
          updateUser(response.data.user)
          
          // Force a re-render by updating local state
          setFormData(prev => ({
            ...prev,
            // Trigger re-render
            _avatarUpdated: Date.now()
          }))
        }
        
        toast.success('Profile photo updated successfully')
        
        // Refresh user data from server to ensure consistency
        setTimeout(async () => {
          try {
            await refreshUser()
            calculateProfileCompletion()
            console.log('🔍 User avatar after refresh:', user?.avatar)
          } catch (error) {
            console.error('Error refreshing user data:', error)
          }
        }, 1000)
        
        console.log('🔍 User avatar after upload:', user?.avatar)
      } else {
        throw new Error(response.message || 'Upload failed')
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast.error(error.message || 'Failed to upload profile photo')
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Format data for backend
      const profileData = {
        ...formData,
        skills: formData.skills ? formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill !== '') : [],
        languages: formData.languages ? formData.languages.split(',').map(lang => lang.trim()).filter(lang => lang !== '') : [],
        expectedSalary: formData.expectedSalary ? parseFloat(formData.expectedSalary.replace(/[^0-9.]/g, '')) || undefined : undefined,
        noticePeriod: formData.noticePeriod ? parseInt(formData.noticePeriod) || undefined : undefined,
        socialLinks: {
          ...(user as any)?.socialLinks,
          linkedin: formData.linkedin?.trim() || null,
          github: formData.github?.trim() || null
        }
      }
      
      console.log('🔍 Saving profile data:', profileData)
      
      const response = await apiService.updateProfile(profileData)
      console.log('🔍 Profile update response:', response)
      
      if (response.success && response.data?.user) {
        updateUser(response.data.user)
        toast.success('Profile updated successfully')
        calculateProfileCompletion()
        // Use debounced refresh to avoid rate limiting
        debouncedRefreshUser()
      } else {
        throw new Error(response.message || 'Update failed')
      }
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }



  const getInitials = () => {
    if (!user) return ''
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-300">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Navbar />
      
      <div className="pt-16 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link href={user?.userType === 'employer' ? (user?.region === 'gulf' ? '/gulf-dashboard' : '/employer-dashboard') : (user?.region === 'gulf' ? '/jobseeker-gulf-dashboard' : '/dashboard')}>
                <Button variant="ghost" size="sm" className="hover:bg-slate-200 dark:hover:bg-slate-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Edit Profile
                </h1>
                <p className="text-slate-600 dark:text-slate-300">
                  Update your personal information and professional details
                </p>
              </div>
                             <div className="flex items-center space-x-2">
                 <Badge variant="outline" className="text-sm">
                   <Star className="w-3 h-3 mr-1" />
                   {profileCompletion}% Complete
                 </Badge>
                 {refreshing && (
                   <Badge variant="secondary" className="text-sm">
                     <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                     Syncing...
                   </Badge>
                 )}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Photo Section */}
            <div className="lg:col-span-1">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Camera className="w-5 h-5" />
                    <span>Profile Photo</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative group">
                      <Avatar className="w-32 h-32 border-4 border-white dark:border-slate-700 shadow-lg" key={user?.avatar || 'no-avatar'}>
                        <AvatarImage 
                          src={constructAvatarUrl(user.avatar)} 
                          alt={`${user.firstName} ${user.lastName}`}
                          onLoad={() => console.log('✅ Avatar image loaded successfully')}
                          onError={(e) => {
                            console.error('❌ Avatar image failed to load:', e);
                            console.log('🔍 Avatar URL that failed:', user.avatar);
                            console.log('🔍 Constructed avatar URL:', constructAvatarUrl(user.avatar));
                          }}
                        />
                        <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      {!user.avatar && (
                        <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                          No Photo
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-white dark:bg-slate-700 border-2 border-white dark:border-slate-700"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    
                    <div className="text-center space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="w-full"
                      >
                        {uploadingAvatar ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="w-4 h-4 mr-2" />
                            Change Photo
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-slate-500">
                        JPG, PNG, GIF up to 2MB
                      </p>
                      {user.avatar && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          ✓ Profile photo uploaded
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Stats */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Profile Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Completion</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300"
                            style={{ width: `${profileCompletion}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{profileCompletion}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Account Type</span>
                      <Badge variant="secondary" className="capitalize">
                        {user.userType}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Status</span>
                      <Badge variant={user.accountStatus === 'active' ? 'default' : 'destructive'}>
                        {user.accountStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Profile Photo</span>
                      <Badge variant={user.avatar ? 'default' : 'secondary'}>
                        {user.avatar ? 'Uploaded' : 'Not set'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Profile Form */}
            <div className="lg:col-span-2">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Personal Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>First Name</span>
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="Enter your first name"
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Last Name</span>
                      </Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Enter your last name"
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>Phone Number</span>
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Enter your phone number"
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="currentLocation" className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>Current Location</span>
                      </Label>
                      <Input
                        id="currentLocation"
                        value={formData.currentLocation}
                        onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                        placeholder="City, Country"
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="headline" className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4" />
                        <span>Professional Headline</span>
                      </Label>
                      <Input
                        id="headline"
                        value={formData.headline}
                        onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                        placeholder="e.g., Senior Software Engineer"
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="summary" className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Professional Summary</span>
                      </Label>
                      <Textarea
                        id="summary"
                        value={formData.summary}
                        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                        placeholder="Brief description of your professional background and expertise"
                        rows={4}
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                    
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="skills" className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4" />
                        <span>Skills</span>
                      </Label>
                      <Input
                        id="skills"
                        value={formData.skills}
                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                        placeholder="e.g., JavaScript, React, Node.js, Python"
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="languages" className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Languages</span>
                      </Label>
                      <Input
                        id="languages"
                        value={formData.languages}
                        onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                        placeholder="e.g., English, Spanish, French"
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                  {/* Social Links */}
                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="flex items-center space-x-2">
                      <Eye className="w-4 h-4" />
                      <span>LinkedIn URL</span>
                    </Label>
                    <Input
                      id="linkedin"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      placeholder="https://www.linkedin.com/in/username"
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="github" className="flex items-center space-x-2">
                      <Eye className="w-4 h-4" />
                      <span>GitHub URL</span>
                    </Label>
                    <Input
                      id="github"
                      value={formData.github}
                      onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                      placeholder="https://github.com/username"
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="expectedSalary" className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4" />
                        <span>Expected Salary (LPA)</span>
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="expectedSalary"
                          value={formData.expectedSalary}
                          onChange={(e) => setFormData({ ...formData, expectedSalary: e.target.value })}
                          placeholder="e.g., 12"
                          type="number"
                          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">LPA</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="noticePeriod" className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Notice Period (days)</span>
                      </Label>
                      <Input
                        id="noticePeriod"
                        value={formData.noticePeriod}
                        onChange={(e) => setFormData({ ...formData, noticePeriod: e.target.value })}
                        placeholder="e.g., 30"
                        type="number"
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>Willing to Relocate</span>
                      </Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="willingToRelocate"
                          checked={formData.willingToRelocate}
                          onChange={(e) => setFormData({ ...formData, willingToRelocate: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor="willingToRelocate" className="text-sm text-slate-600 dark:text-slate-300">
                          Yes, I'm willing to relocate for the right opportunity
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-8 space-y-4 sm:space-y-0">
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      <p>💡 <strong>Profile Photo:</strong> Click the camera icon above to upload a new profile picture</p>
                      <p>💾 <strong>Auto-save:</strong> Profile photo uploads are saved immediately</p>
                    </div>
                    <Button 
                      onClick={handleSave} 
                      disabled={saving}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Profile Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
