"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { constructAvatarUrl } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { 
  ArrowLeft,
  User, 
  FileText, 
  Settings, 
  Bell, 
  Shield, 
  CreditCard,
  LogOut,
  Edit,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Star,
  Eye,
  Download,
  Save,
  X,
  Plus,
  Trash2,
  ChevronDown
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { ResumeManagement } from '@/components/resume-management'
import { toast } from 'sonner'
import { apiService, WorkExperience } from '@/lib/api'
import IndustryDropdown from '@/components/ui/industry-dropdown'

export default function AccountPage() {
  const { user, loading, logout, refreshUser, updateUser } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [resumeStats, setResumeStats] = useState<any>(null)
  
  // Edit states
  const [editingPersonal, setEditingPersonal] = useState(false)
  const [editingProfessional, setEditingProfessional] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  
  // Form data states
  const [personalData, setPersonalData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: ''
  })
  
  const [professionalData, setProfessionalData] = useState({
    headline: '',
    currentLocation: '',
    summary: '',
    expectedSalary: '',
    currentSalary: '',
    noticePeriod: '',
    willingToRelocate: false,
    experienceYears: '',
    experienceMonths: '',
    experienceDays: '',
    skills: [] as string[],
    languages: [] as string[],
    socialLinks: {
      linkedin: '',
      github: '',
      portfolio: ''
    },
    jobPreferences: {
      preferredJobTitles: [] as string[],
      preferredIndustries: [] as string[],
      preferredLocations: [] as string[],
      preferredJobTypes: [] as string[],
      preferredEmploymentType: '',
      preferredCompanySize: '',
      preferredExperienceLevels: [] as string[],
      preferredSalaryMin: '',
      preferredSalaryMax: '',
      preferredSkills: [] as string[],
      preferredWorkMode: [] as string[],
      willingToTravel: false
    }
  })
  
  // Education state
  const [educations, setEducations] = useState<any[]>([])
  const [loadingEducations, setLoadingEducations] = useState(false)
  const [editingEducation, setEditingEducation] = useState<any | null>(null)
  const [showEducationForm, setShowEducationForm] = useState(false)
  const [educationForm, setEducationForm] = useState({
    degree: '',
    institution: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    gpa: '',
    percentage: '',
    grade: '',
    description: '',
    location: '',
    educationType: ''
  })
  
  const [newSkill, setNewSkill] = useState('')
  const [newLanguage, setNewLanguage] = useState('')
  const [newJobTitle, setNewJobTitle] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newPreferredSkill, setNewPreferredSkill] = useState('')
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)

  // Work Experience state
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([])
  const [loadingWorkExperiences, setLoadingWorkExperiences] = useState(false)
  const [editingWorkExperience, setEditingWorkExperience] = useState<WorkExperience | null>(null)
  const [showWorkExperienceForm, setShowWorkExperienceForm] = useState(false)
  const [workExperienceForm, setWorkExperienceForm] = useState<Partial<WorkExperience>>({
    companyName: '',
    jobTitle: '',
    currentDesignation: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
    employmentType: 'full-time'
  })

  // Security-related state
  const [showChangeEmail, setShowChangeEmail] = useState(false)
  const [showChangePhone, setShowChangePhone] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [securityLoading, setSecurityLoading] = useState(false)
  
  // Security form data
  const [emailData, setEmailData] = useState({
    newEmail: '',
    currentPassword: ''
  })
  const [phoneData, setPhoneData] = useState({
    newPhone: '',
    currentPassword: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please sign in to access your account')
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && !loading) {
      fetchResumeStats()
      fetchJobPreferences()
      fetchWorkExperiences()
      fetchEducations()
      // Initialize form data after fetching work experiences
      setTimeout(() => {
        initializeFormData()
      }, 100)
    }
  }, [user, loading])
  
  // Re-initialize professional data when work experiences are loaded
  // This ensures experience is recalculated when work experiences are updated
  useEffect(() => {
    if (workExperiences && user) {
      // Recalculate experience from work experiences
      let totalDays = 0;
      workExperiences.forEach((exp: any) => {
        if (exp.startDate) {
          const start = new Date(exp.startDate);
          const end = exp.isCurrent ? new Date() : (exp.endDate ? new Date(exp.endDate) : new Date());
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            totalDays += diffDays;
          }
        }
      });
      
      if (totalDays > 0) {
        const years = Math.floor(totalDays / 365);
        const remainingDays = totalDays % 365;
        const months = Math.floor(remainingDays / 30);
        const days = remainingDays % 30;
        
        setProfessionalData(prev => ({
          ...prev,
          experienceYears: years.toString(),
          experienceMonths: months.toString(),
          experienceDays: days.toString()
        }));
      } else if (user.experienceYears !== undefined && user.experienceYears !== null) {
        // Fallback to user.experienceYears if no work experiences or calculation failed
        const totalYears = Number(user.experienceYears);
        const years = Math.floor(totalYears);
        const fractionalPart = totalYears - years;
        const months = Math.floor(fractionalPart * 12);
        const days = Math.floor((fractionalPart * 12 - months) * 30);
        
        setProfessionalData(prev => ({
          ...prev,
          experienceYears: years.toString(),
          experienceMonths: months.toString(),
          experienceDays: days.toString()
        }));
      }
    }
  }, [workExperiences, user])
  
  // Education functions
  const fetchEducations = async () => {
    try {
      setLoadingEducations(true)
      const response = await apiService.getEducations()
      if (response.success && response.data) {
        setEducations(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching educations:', error)
      toast.error('Failed to load educations')
    } finally {
      setLoadingEducations(false)
    }
  }
  
  const handleAddEducation = () => {
    setEditingEducation(null)
    setEducationForm({
      degree: '',
      institution: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      gpa: '',
      percentage: '',
      grade: '',
      description: '',
      location: '',
      educationType: ''
    })
    setShowEducationForm(true)
  }
  
  const handleEditEducation = (edu: any) => {
    setEditingEducation(edu)
    setEducationForm({
      degree: edu.degree || '',
      institution: edu.institution || '',
      fieldOfStudy: edu.fieldOfStudy || '',
      startDate: edu.startDate ? edu.startDate.split('T')[0] : '',
      endDate: edu.endDate ? edu.endDate.split('T')[0] : '',
      isCurrent: edu.isCurrent || false,
      gpa: edu.cgpa || edu.gpa || '',
      percentage: edu.percentage || '',
      grade: edu.grade || '',
      description: edu.description || '',
      location: edu.location || '',
      educationType: edu.educationType || ''
    })
    setShowEducationForm(true)
  }
  
  const handleSaveEducation = async () => {
    if (!educationForm.degree || !educationForm.institution || !educationForm.startDate) {
      toast.error('Degree, institution, and start date are required')
      return
    }
    
    try {
      const data = {
        degree: educationForm.degree,
        institution: educationForm.institution,
        fieldOfStudy: educationForm.fieldOfStudy || undefined,
        startDate: educationForm.startDate,
        endDate: educationForm.isCurrent ? undefined : (educationForm.endDate || undefined),
        isCurrent: educationForm.isCurrent,
        gpa: educationForm.gpa ? parseFloat(educationForm.gpa) : undefined,
        percentage: educationForm.percentage ? parseFloat(educationForm.percentage) : undefined,
        grade: educationForm.grade || undefined,
        description: educationForm.description || undefined,
        location: educationForm.location || undefined,
        educationType: educationForm.educationType || undefined
      }
      
      if (editingEducation) {
        await apiService.updateEducation(editingEducation.id, data)
        toast.success('Education updated successfully')
      } else {
        await apiService.createEducation(data)
        toast.success('Education added successfully')
      }
      
      setShowEducationForm(false)
      fetchEducations()
    } catch (error: any) {
      console.error('Error saving education:', error)
      toast.error(error.message || 'Failed to save education')
    }
  }
  
  const handleDeleteEducation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this education?')) return
    
    try {
      await apiService.deleteEducation(id)
      toast.success('Education deleted successfully')
      fetchEducations()
    } catch (error: any) {
      console.error('Error deleting education:', error)
      toast.error(error.message || 'Failed to delete education')
    }
  }

  // Refresh user data on mount to ensure latest data is loaded
  useEffect(() => {
    if (!loading && !user) {
      refreshUser()
    }
  }, [loading])

  const initializeFormData = () => {
    if (user) {
      setPersonalData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        email: user.email || '',
        dateOfBirth: (user.dateOfBirth || (user as any).dateOfBirth) ? (typeof (user.dateOfBirth || (user as any).dateOfBirth) === 'string' ? (user.dateOfBirth || (user as any).dateOfBirth).split('T')[0] : '') : '',
        gender: (user as any).gender || ''
      })
      
      // Convert experience_years back to years, months, days
      // PRIORITY: Calculate from work experiences if available (most accurate)
      let expYears = '';
      let expMonths = '';
      let expDays = '';
      
      // Check if workExperiences are already loaded and use them
      if (workExperiences && workExperiences.length > 0) {
        // Calculate total experience from work experiences
        let totalDays = 0;
        workExperiences.forEach((exp: any) => {
          if (exp.startDate) {
            const start = new Date(exp.startDate);
            const end = exp.isCurrent ? new Date() : (exp.endDate ? new Date(exp.endDate) : new Date());
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
              const diffTime = Math.abs(end.getTime() - start.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              totalDays += diffDays;
            }
          }
        });
        if (totalDays > 0) {
          const years = Math.floor(totalDays / 365);
          const remainingDays = totalDays % 365;
          const months = Math.floor(remainingDays / 30);
          const days = remainingDays % 30;
          expYears = years.toString();
          expMonths = months.toString();
          expDays = days.toString();
        }
      }
      
      // Fallback: Use experience_years field if work experiences not available or no experience calculated
      if (!expYears && user.experienceYears !== undefined && user.experienceYears !== null) {
        const totalYears = Number(user.experienceYears);
        expYears = Math.floor(totalYears).toString();
        const fractionalPart = totalYears - Math.floor(totalYears);
        const remainingMonths = Math.floor(fractionalPart * 12);
        expMonths = remainingMonths.toString();
        const remainingDays = Math.floor((fractionalPart * 12 - remainingMonths) * 30);
        expDays = remainingDays.toString();
      }
      
      setProfessionalData({
        headline: user.headline || '',
        currentLocation: user.currentLocation || '',
        summary: user.summary || '',
        expectedSalary: user.expectedSalary?.toString() || '',
        noticePeriod: user.noticePeriod?.toString() || '',
        willingToRelocate: user.willingToRelocate || false,
        experienceYears: expYears,
        experienceMonths: expMonths,
        experienceDays: expDays,
        // Get current salary from user object (check multiple possible sources)
        // Priority: user.currentSalary (from API) > (user as any).currentSalary > empty string
        currentSalary: (user.currentSalary !== undefined && user.currentSalary !== null)
          ? user.currentSalary.toString()
          : ((user as any).currentSalary !== undefined && (user as any).currentSalary !== null) 
            ? ((user as any).currentSalary).toString() 
            : '',
        skills: Array.isArray(user.skills) ? user.skills : [],
        languages: Array.isArray(user.languages) ? user.languages : [],
        socialLinks: {
          linkedin: user.socialLinks?.linkedin || '',
          github: user.socialLinks?.github || '',
          portfolio: user.socialLinks?.portfolio || ''
        },
        jobPreferences: {
          preferredJobTitles: Array.isArray(user.preferredJobTitles) ? user.preferredJobTitles : (Array.isArray((user as any).preferredJobTitles) ? (user as any).preferredJobTitles : (Array.isArray(user.preferences?.preferredJobTitles) ? user.preferences.preferredJobTitles : [])),
          preferredIndustries: Array.isArray(user.preferredIndustries) ? user.preferredIndustries : (Array.isArray((user as any).preferredIndustries) ? (user as any).preferredIndustries : (Array.isArray(user.preferences?.preferredIndustries) ? user.preferences.preferredIndustries : [])),
          preferredLocations: Array.isArray(user.preferredLocations) ? user.preferredLocations : (Array.isArray((user as any).preferredLocations) ? (user as any).preferredLocations : (Array.isArray(user.preferences?.preferredLocations) ? user.preferences.preferredLocations : [])),
          preferredJobTypes: Array.isArray(user.preferences?.preferredJobTypes) ? user.preferences.preferredJobTypes : [],
          preferredEmploymentType: user.preferredEmploymentType || (user as any).preferredEmploymentType || user.preferences?.preferredEmploymentType || '',
          preferredCompanySize: user.preferredCompanySize || (user as any).preferredCompanySize || user.preferences?.preferredCompanySize || '',
          preferredExperienceLevels: Array.isArray(user.preferences?.preferredExperienceLevels) ? user.preferences.preferredExperienceLevels : [],
          preferredSalaryMin: user.preferences?.preferredSalaryMin?.toString() || '',
          preferredSalaryMax: user.preferences?.preferredSalaryMax?.toString() || '',
          preferredSkills: Array.isArray(user.preferences?.preferredSkills) ? user.preferences.preferredSkills : [],
          preferredWorkMode: (() => {
            // Get work mode from multiple possible sources
            let workMode = user.preferredWorkMode || (user as any).preferredWorkMode || user.preferences?.preferredWorkMode;
            
            if (Array.isArray(workMode)) {
              // Normalize array: convert "onsite" to "on-site"
              return workMode.map(m => {
                const normalized = String(m).toLowerCase().replace(/_/g, '-');
                return normalized === 'onsite' ? 'on-site' : normalized;
              });
            } else if (typeof workMode === 'string') {
              // Normalize string: convert "onsite" to "on-site"
              const normalized = workMode.toLowerCase().replace(/_/g, '-');
              return [normalized === 'onsite' ? 'on-site' : normalized];
            }
            return [];
          })(),
          willingToTravel: user.preferences?.willingToTravel !== undefined ? user.preferences.willingToTravel : false
        }
      })
    }
  }

  const fetchResumeStats = async () => {
    try {
      const response = await apiService.getResumeStats()
      if (response.success && response.data) {
        setResumeStats(response.data)
      }
    } catch (error) {
      console.error('Error fetching resume stats:', error)
    }
  }

  const fetchJobPreferences = async () => {
    try {
      const response = await apiService.getJobPreferences()
      if (response.success && response.data) {
        setProfessionalData(prev => ({
          ...prev,
          jobPreferences: {
            preferredJobTitles: Array.isArray(response.data.preferredJobTitles) ? response.data.preferredJobTitles : [],
            preferredIndustries: Array.isArray(response.data.preferredIndustries) ? response.data.preferredIndustries : (prev.jobPreferences?.preferredIndustries || []),
            preferredLocations: Array.isArray(response.data.preferredLocations) ? response.data.preferredLocations : [],
            preferredJobTypes: Array.isArray(response.data.preferredJobTypes) ? response.data.preferredJobTypes : [],
            preferredEmploymentType: response.data.preferredEmploymentType || (prev.jobPreferences?.preferredEmploymentType || ''),
            preferredCompanySize: response.data.preferredCompanySize || (prev.jobPreferences?.preferredCompanySize || ''),
            preferredExperienceLevels: Array.isArray(response.data.preferredExperienceLevels) ? response.data.preferredExperienceLevels : [],
            preferredSalaryMin: response.data.preferredSalaryMin?.toString() || '',
            preferredSalaryMax: response.data.preferredSalaryMax?.toString() || '',
            preferredSkills: Array.isArray(response.data.preferredSkills) ? response.data.preferredSkills : [],
            preferredWorkMode: Array.isArray(response.data.preferredWorkMode) ? response.data.preferredWorkMode : [],
            willingToTravel: response.data.willingToTravel || false
          }
        }))
      }
    } catch (error) {
      console.error('Error fetching job preferences:', error)
      // If API fails, keep the default empty preferences
      // This ensures the form still works even if the backend is not ready
    }
  }

  // Work Experience functions
  const fetchWorkExperiences = async () => {
    try {
      setLoadingWorkExperiences(true)
      const response = await apiService.getWorkExperiences()
      if (response.success && response.data) {
        setWorkExperiences(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching work experiences:', error)
      toast.error('Failed to load work experiences')
    } finally {
      setLoadingWorkExperiences(false)
    }
  }

  const handleAddWorkExperience = () => {
    setEditingWorkExperience(null)
    setWorkExperienceForm({
      companyName: '',
      jobTitle: '',
      currentDesignation: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
      employmentType: 'full-time'
    })
    setShowWorkExperienceForm(true)
  }

  const handleEditWorkExperience = (exp: WorkExperience) => {
    setEditingWorkExperience(exp)
    setWorkExperienceForm({
      companyName: exp.companyName || '',
      jobTitle: exp.jobTitle || '',
      currentDesignation: exp.currentDesignation || '',
      location: exp.location || '',
      startDate: exp.startDate ? exp.startDate.split('T')[0] : '',
      endDate: exp.endDate ? exp.endDate.split('T')[0] : '',
      isCurrent: exp.isCurrent || false,
      description: exp.description || '',
      employmentType: exp.employmentType || 'full-time'
    })
    setShowWorkExperienceForm(true)
  }

  const handleSaveWorkExperience = async () => {
    if (!workExperienceForm.jobTitle || !workExperienceForm.startDate) {
      toast.error('Job title and start date are required')
      return
    }

    try {
      setSaving(true)
      if (editingWorkExperience?.id) {
        const response = await apiService.updateWorkExperience(editingWorkExperience.id, workExperienceForm)
        if (response.success) {
          toast.success('Work experience updated successfully')
          await fetchWorkExperiences()
          setShowWorkExperienceForm(false)
        } else {
          toast.error(response.message || 'Failed to update work experience')
        }
      } else {
        const response = await apiService.createWorkExperience(workExperienceForm as WorkExperience)
        if (response.success) {
          toast.success('Work experience added successfully')
          await fetchWorkExperiences()
          setShowWorkExperienceForm(false)
        } else {
          toast.error(response.message || 'Failed to add work experience')
        }
      }
    } catch (error: any) {
      console.error('Error saving work experience:', error)
      toast.error(error.message || 'Failed to save work experience')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteWorkExperience = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work experience?')) {
      return
    }

    try {
      setSaving(true)
      const response = await apiService.deleteWorkExperience(id)
      if (response.success) {
        toast.success('Work experience deleted successfully')
        await fetchWorkExperiences()
      } else {
        toast.error(response.message || 'Failed to delete work experience')
      }
    } catch (error: any) {
      console.error('Error deleting work experience:', error)
      toast.error(error.message || 'Failed to delete work experience')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
      router.push('/')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  // Security functions
  const handleChangeEmail = async () => {
    if (!emailData.newEmail || !emailData.currentPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (emailData.newEmail === user?.email) {
      toast.error('New email must be different from current email')
      return
    }

    try {
      setSecurityLoading(true)
      const response = await apiService.updateUserEmail({
        newEmail: emailData.newEmail,
        currentPassword: emailData.currentPassword
      })

      if (response.success) {
        toast.success('Email updated successfully. Please check your new email for verification.')
        setEmailData({ newEmail: '', currentPassword: '' })
        setShowChangeEmail(false)
        await refreshUser()
      } else {
        toast.error(response.message || 'Failed to update email')
      }
    } catch (error: any) {
      console.error('Email update error:', error)
      toast.error(error.response?.data?.message || 'Failed to update email')
    } finally {
      setSecurityLoading(false)
    }
  }

  const handleChangePhone = async () => {
    if (!phoneData.newPhone || !phoneData.currentPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (phoneData.newPhone === user?.phone) {
      toast.error('New phone must be different from current phone')
      return
    }

    try {
      setSecurityLoading(true)
      const response = await apiService.updateUserPhone({
        newPhone: phoneData.newPhone,
        currentPassword: phoneData.currentPassword
      })

      if (response.success) {
        toast.success('Phone number updated successfully')
        setPhoneData({ newPhone: '', currentPassword: '' })
        setShowChangePhone(false)
        await refreshUser()
      } else {
        toast.error(response.message || 'Failed to update phone')
      }
    } catch (error: any) {
      console.error('Phone update error:', error)
      toast.error(error.response?.data?.message || 'Failed to update phone')
    } finally {
      setSecurityLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long')
      return
    }

    try {
      setSecurityLoading(true)
      const response = await apiService.updateUserPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })

      if (response.success) {
        toast.success('Password updated successfully')
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setShowChangePassword(false)
      } else {
        toast.error(response.message || 'Failed to update password')
      }
    } catch (error: any) {
      console.error('Password update error:', error)
      toast.error(error.response?.data?.message || 'Failed to update password')
    } finally {
      setSecurityLoading(false)
    }
  }

  const savePersonalData = async () => {
    try {
      setSaving(true)
      const response = await apiService.updateProfile({
        ...personalData,
        gender: personalData.gender ? (personalData.gender as 'male' | 'female' | 'other') : undefined
      })
      
      if (response.success) {
        await refreshUser()
        setEditingPersonal(false)
        toast.success('Personal information updated successfully')
      } else {
        toast.error(response.message || 'Failed to update personal information')
      }
    } catch (error) {
      console.error('Error updating personal data:', error)
      toast.error('Failed to update personal information')
    } finally {
      setSaving(false)
    }
  }

  const saveProfessionalData = async () => {
    try {
      setSaving(true)
      
      // Calculate total experience in years (convert months and days to years)
      let totalExperienceYears = 0
      if (professionalData.experienceYears) {
        totalExperienceYears += Number(professionalData.experienceYears)
      }
      if (professionalData.experienceMonths) {
        totalExperienceYears += Number(professionalData.experienceMonths) / 12
      }
      if (professionalData.experienceDays) {
        totalExperienceYears += Number(professionalData.experienceDays) / 365
      }
      
      // Save professional data
      const response = await apiService.updateProfile({
        ...professionalData,
        expectedSalary: professionalData.expectedSalary ? Number(professionalData.expectedSalary) : undefined,
        currentSalary: professionalData.currentSalary ? Number(professionalData.currentSalary) : undefined,
        noticePeriod: professionalData.noticePeriod ? Number(professionalData.noticePeriod) : undefined,
        experienceYears: totalExperienceYears > 0 ? totalExperienceYears : undefined,
        preferredJobTitles: professionalData.jobPreferences?.preferredJobTitles || [],
        preferredIndustries: professionalData.jobPreferences?.preferredIndustries || [],
        preferredLocations: professionalData.jobPreferences?.preferredLocations || [],
        preferredCompanySize: professionalData.jobPreferences?.preferredCompanySize || undefined,
        preferredWorkMode: (professionalData.jobPreferences?.preferredWorkMode?.length || 0) > 0 ? ((professionalData.jobPreferences.preferredWorkMode || [])[0]) : undefined,
        preferredEmploymentType: professionalData.jobPreferences?.preferredEmploymentType || undefined
      })
      
      if (response.success) {
        // Re-fetch work experiences to ensure experience is recalculated
        await fetchWorkExperiences()
        
        // Save job preferences
        const preferencesResponse = await apiService.updateJobPreferences(professionalData.jobPreferences || {})
        
        // Refresh user data AFTER work experiences are fetched (so experience can be recalculated)
        await refreshUser()
        
        // Re-initialize form data with latest user data after refresh
        setTimeout(() => {
          initializeFormData()
        }, 200)
        
        if (preferencesResponse.success) {
          // Re-fetch job preferences to update display
          await fetchJobPreferences()
          await refreshUser()
          // Re-initialize form data with updated user data to ensure display is correct
          setTimeout(() => {
            initializeFormData()
          }, 100)
          setEditingProfessional(false)
          toast.success('Professional details and job preferences updated successfully')
        } else {
          await refreshUser()
          // Re-initialize form data with updated user data to ensure display is correct
          setTimeout(() => {
            initializeFormData()
          }, 100)
          setEditingProfessional(false)
          toast.success('Professional details updated successfully, but job preferences failed to save')
        }
      } else {
        toast.error(response.message || 'Failed to update professional details')
      }
    } catch (error) {
      console.error('Error updating professional data:', error)
      toast.error('Failed to update professional details')
    } finally {
      setSaving(false)
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && !professionalData.skills.includes(newSkill.trim())) {
      setProfessionalData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }))
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setProfessionalData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const addLanguage = () => {
    if (newLanguage.trim() && !professionalData.languages.includes(newLanguage.trim())) {
      setProfessionalData(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()]
      }))
      setNewLanguage('')
    }
  }

  const removeLanguage = (languageToRemove: string) => {
    setProfessionalData(prev => ({
      ...prev,
      languages: prev.languages.filter(lang => lang !== languageToRemove)
    }))
  }

  // Job preferences helper functions
  const addJobTitle = () => {
    if (newJobTitle.trim() && !(professionalData.jobPreferences?.preferredJobTitles || []).includes(newJobTitle.trim())) {
      setProfessionalData(prev => ({
        ...prev,
        jobPreferences: {
          ...prev.jobPreferences,
          preferredJobTitles: [...(prev.jobPreferences?.preferredJobTitles || []), newJobTitle.trim()]
        }
      }))
      setNewJobTitle('')
    }
  }

  const removeJobTitle = (titleToRemove: string) => {
    setProfessionalData(prev => ({
      ...prev,
      jobPreferences: {
        ...prev.jobPreferences,
        preferredJobTitles: (prev.jobPreferences?.preferredJobTitles || []).filter(title => title !== titleToRemove)
      }
    }))
  }


  const addLocation = () => {
    if (newLocation.trim() && !(professionalData.jobPreferences?.preferredLocations || []).includes(newLocation.trim())) {
      setProfessionalData(prev => ({
        ...prev,
        jobPreferences: {
          ...prev.jobPreferences || {},
          preferredLocations: [...(prev.jobPreferences?.preferredLocations || []), newLocation.trim()]
        }
      }))
      setNewLocation('')
    }
  }

  const removeLocation = (locationToRemove: string) => {
    setProfessionalData(prev => ({
      ...prev,
      jobPreferences: {
        ...prev.jobPreferences || {},
        preferredLocations: (prev.jobPreferences?.preferredLocations || []).filter(location => location !== locationToRemove)
      }
    }))
  }


  const addJobType = (jobType: string) => {
    if (!(professionalData.jobPreferences?.preferredJobTypes || []).includes(jobType)) {
      setProfessionalData(prev => ({
        ...prev,
        jobPreferences: {
          ...prev.jobPreferences || {},
          preferredJobTypes: [...(prev.jobPreferences?.preferredJobTypes || []), jobType]
        }
      }))
    }
  }

  const removeJobType = (jobTypeToRemove: string) => {
    setProfessionalData(prev => ({
      ...prev,
      jobPreferences: {
        ...prev.jobPreferences || {},
        preferredJobTypes: (prev.jobPreferences?.preferredJobTypes || []).filter(type => type !== jobTypeToRemove)
      }
    }))
  }

  const addExperienceLevel = (level: string) => {
    if (!(professionalData.jobPreferences?.preferredExperienceLevels || []).includes(level)) {
      setProfessionalData(prev => ({
        ...prev,
        jobPreferences: {
          ...prev.jobPreferences || {},
          preferredExperienceLevels: [...(prev.jobPreferences?.preferredExperienceLevels || []), level]
        }
      }))
    }
  }

  const removeExperienceLevel = (levelToRemove: string) => {
    setProfessionalData(prev => ({
      ...prev,
      jobPreferences: {
        ...prev.jobPreferences || {},
        preferredExperienceLevels: (prev.jobPreferences?.preferredExperienceLevels || []).filter(level => level !== levelToRemove)
      }
    }))
  }

  const toggleWorkMode = (mode: string, checked: boolean) => {
    setProfessionalData(prev => {
      const currentModes = Array.isArray(prev.jobPreferences?.preferredWorkMode) 
        ? prev.jobPreferences.preferredWorkMode 
        : (prev.jobPreferences?.preferredWorkMode 
            ? [String(prev.jobPreferences.preferredWorkMode)] 
            : []);
      
      // Normalize existing modes for comparison (convert "onsite" to "on-site")
      const normalizedCurrentModes = currentModes.map(m => {
        const normalized = String(m).toLowerCase().replace(/_/g, '-');
        return normalized === 'onsite' ? 'on-site' : normalized;
      });
      
      if (checked) {
        // Add mode if not already present
        if (!normalizedCurrentModes.includes(mode.toLowerCase())) {
          return {
            ...prev,
            jobPreferences: {
              ...prev.jobPreferences || {},
              preferredWorkMode: [...currentModes, mode]
            }
          };
        }
      } else {
        // Remove mode (check both "on-site" and "onsite" variants)
        const filtered = currentModes.filter(m => {
          const normalized = String(m).toLowerCase().replace(/_/g, '-');
          const normalizedM = normalized === 'onsite' ? 'on-site' : normalized;
          return normalizedM !== mode.toLowerCase() && normalizedM !== mode.toLowerCase().replace('on-site', 'onsite');
        });
        return {
          ...prev,
          jobPreferences: {
            ...prev.jobPreferences || {},
            preferredWorkMode: filtered
          }
        };
      }
      return prev;
    })
  }

  const addPreferredSkill = () => {
    if (newPreferredSkill.trim() && !(professionalData.jobPreferences?.preferredSkills || []).includes(newPreferredSkill.trim())) {
      setProfessionalData(prev => ({
        ...prev,
        jobPreferences: {
          ...prev.jobPreferences,
          preferredSkills: [...(prev.jobPreferences?.preferredSkills || []), newPreferredSkill.trim()]
        }
      }))
      setNewPreferredSkill('')
    }
  }

  const removePreferredSkill = (skillToRemove: string) => {
    setProfessionalData(prev => ({
      ...prev,
      jobPreferences: {
        ...prev.jobPreferences,
        preferredSkills: (prev.jobPreferences?.preferredSkills || []).filter(skill => skill !== skillToRemove)
      }
    }))
  }

  const cancelEdit = (type: 'personal' | 'professional') => {
    if (type === 'personal') {
      setEditingPersonal(false)
      initializeFormData()
    } else {
      setEditingProfessional(false)
      initializeFormData()
    }
  }

  const getProfileCompletion = () => {
    if (!user) return 0
    
    let completion = 0
    const fields = [
      user.firstName, user.lastName, user.email, user.phone,
      user.currentLocation, user.headline, user.summary
    ]
    
    fields.forEach(field => {
      if (field && field.trim() !== '') completion += 14.28
    })
    
    return Math.min(100, Math.round(completion))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-auto">
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-auto">
      <Navbar />
      
      {/* Welcome Back Div Style Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-200/45 via-blue-200/35 to-indigo-200/45"></div>
        <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-purple-300/10 to-blue-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-blue-300/10 to-indigo-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-indigo-300/10 to-purple-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/4 left-0 right-0 h-24 bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-indigo-400/20"></div>
      </div>
      
      <div className="pt-20 pb-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link href={user?.region === 'gulf' ? '/gulf-dashboard' : '/dashboard'}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Account Settings
                </h1>
                <p className="text-slate-600 dark:text-slate-300">
                  Manage your profile, resumes, and account preferences
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-sm">
                  <User className="w-3 h-3 mr-1" />
                  {user.userType}
                </Badge>
                <Badge variant={user.accountStatus === 'active' ? 'default' : 'destructive'}>
                  {user.accountStatus}
                </Badge>
              </div>
            </div>
          </div>

          {/* Profile Overview Card */}
          <Card className="mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="flex-shrink-0 relative">
                  <Avatar className="w-20 h-20 border-4 border-white dark:border-slate-700 shadow-lg">
                    <AvatarImage 
                      src={constructAvatarUrl(user.avatar)} 
                      alt={`${user.firstName} ${user.lastName}`}
                    />
                    <AvatarFallback className="text-xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {`${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="absolute -bottom-1 -right-1 rounded-full p-1 h-8 w-8 shadow-lg"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      
                      try {
                        setUploadingAvatar(true)
                        const response = await apiService.uploadAvatar(file)
                        
                        if (response.success) {
                          if (response.data?.user) {
                            updateUser(response.data.user)
                          }
                          toast.success('Profile photo updated successfully')
                          setTimeout(async () => {
                            await refreshUser()
                          }, 1000)
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
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Name</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {user.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Profile Completion</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300"
                            style={{ width: `${getProfileCompletion()}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{getProfileCompletion()}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Member Since</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="resumes" className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Resumes</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>Personal Information</span>
                      </div>
                      {!editingPersonal && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingPersonal(true)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {editingPersonal ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              value={personalData.firstName}
                              onChange={(e) => setPersonalData(prev => ({ ...prev, firstName: e.target.value }))}
                              placeholder="Enter your first name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              value={personalData.lastName}
                              onChange={(e) => setPersonalData(prev => ({ ...prev, lastName: e.target.value }))}
                              placeholder="Enter your last name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={personalData.email}
                              onChange={(e) => setPersonalData(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="Enter your email"
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={personalData.phone}
                              onChange={(e) => setPersonalData(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="Enter your phone number"
                            />
                          </div>
                          <div>
                            <Label htmlFor="dateOfBirth">Date of Birth</Label>
                            <Input
                              id="dateOfBirth"
                              type="date"
                              value={personalData.dateOfBirth}
                              onChange={(e) => setPersonalData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="gender">Gender</Label>
                            <Select value={personalData.gender} onValueChange={(value) => setPersonalData(prev => ({ ...prev, gender: value }))}>
                              <SelectTrigger id="gender">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            onClick={savePersonalData}
                            disabled={saving}
                            className="flex-1"
                          >
                            {saving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => cancelEdit('personal')}
                            disabled={saving}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">First Name</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {user.firstName || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Last Name</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {user.lastName || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {user.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Phone</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {user.phone || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Date of Birth</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {user.dateOfBirth ? (() => {
                            try {
                              const dob = user.dateOfBirth;
                              // Handle both string dates and Date objects
                              const dateStr = typeof dob === 'string' ? dob.split('T')[0] : dob;
                              return new Date(dateStr).toLocaleDateString();
                            } catch (e) {
                              return user.dateOfBirth || 'Not provided';
                            }
                          })() : (user as any).dateOfBirth ? (() => {
                            try {
                              const dob = (user as any).dateOfBirth;
                              const dateStr = typeof dob === 'string' ? dob.split('T')[0] : dob;
                              return new Date(dateStr).toLocaleDateString();
                            } catch (e) {
                              return (user as any).dateOfBirth || 'Not provided';
                            }
                          })() : 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Gender</p>
                        <p className="font-medium text-slate-900 dark:text-white capitalize">
                          {(user as any).gender || 'Not provided'}
                        </p>
                      </div>
                    </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5" />
                      <span>Professional Details</span>
                      </div>
                      {!editingProfessional && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={async () => {
                            // Refresh user data first to get latest values
                            await refreshUser()
                            // Re-fetch work experiences to ensure we have latest data
                            await fetchWorkExperiences()
                            // Wait a bit for state to update
                            setTimeout(() => {
                              // Re-initialize form data from latest user data when entering edit mode
                              initializeFormData()
                              setEditingProfessional(true)
                            }, 100)
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {editingProfessional ? (
                      <div className="space-y-6">
                        {/* Basic Professional Info */}
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="headline">Professional Headline</Label>
                            <Input
                              id="headline"
                              value={professionalData.headline}
                              onChange={(e) => setProfessionalData(prev => ({ ...prev, headline: e.target.value }))}
                              placeholder="e.g., Software Engineer, UI/UX Designer"
                            />
                          </div>
                          <div>
                            <Label htmlFor="currentLocation">Current Location</Label>
                            <Input
                              id="currentLocation"
                              value={professionalData.currentLocation}
                              onChange={(e) => setProfessionalData(prev => ({ ...prev, currentLocation: e.target.value }))}
                              placeholder="e.g., Mumbai, Maharashtra"
                            />
                          </div>
                          <div>
                            <Label htmlFor="summary">Professional Summary</Label>
                            <Textarea
                              id="summary"
                              value={professionalData.summary}
                              onChange={(e) => setProfessionalData(prev => ({ ...prev, summary: e.target.value }))}
                              placeholder="Tell us about your professional background, skills, and career goals..."
                              rows={4}
                            />
                          </div>
                        </div>

                        {/* Professional Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="experienceYears">Years of Experience</Label>
                            <Input
                              id="experienceYears"
                              type="number"
                              min="0"
                              value={professionalData.experienceYears}
                              onChange={(e) => setProfessionalData(prev => ({ ...prev, experienceYears: e.target.value }))}
                              placeholder="e.g., 5"
                            />
                          </div>
                          <div>
                            <Label htmlFor="experienceMonths">Months</Label>
                            <Input
                              id="experienceMonths"
                              type="number"
                              min="0"
                              max="11"
                              value={professionalData.experienceMonths}
                              onChange={(e) => setProfessionalData(prev => ({ ...prev, experienceMonths: e.target.value }))}
                              placeholder="e.g., 6"
                            />
                          </div>
                          <div>
                            <Label htmlFor="experienceDays">Days</Label>
                            <Input
                              id="experienceDays"
                              type="number"
                              min="0"
                              max="30"
                              value={professionalData.experienceDays}
                              onChange={(e) => setProfessionalData(prev => ({ ...prev, experienceDays: e.target.value }))}
                              placeholder="e.g., 15"
                            />
                          </div>
                        </div>

                        {/* Education Management */}
                        <div>
                          <Label>Education</Label>
                          <div className="mt-2 space-y-2">
                            {loadingEducations ? (
                              <p className="text-sm text-slate-500">Loading educations...</p>
                            ) : educations.length === 0 ? (
                              <p className="text-sm text-slate-500">No education added yet</p>
                            ) : (
                              educations.map((edu) => (
                                <div key={edu.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                  <div>
                                    <p className="font-medium">{edu.degree} - {edu.institution}</p>
                                    {edu.fieldOfStudy && <p className="text-sm text-slate-500">{edu.fieldOfStudy}</p>}
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button type="button" variant="ghost" size="sm" onClick={() => handleEditEducation(edu)}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => handleDeleteEducation(edu.id)}>
                                      <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                            <Button type="button" variant="outline" onClick={handleAddEducation} className="w-full">
                              <Plus className="w-4 h-4 mr-2" />
                              Add Education
                            </Button>
                          </div>
                        </div>

                        {/* Salary and Preferences */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="currentSalary">Current Salary (LPA)</Label>
                            <Input
                              id="currentSalary"
                              type="number"
                              min="0"
                              step="0.01"
                              value={professionalData.currentSalary}
                              onChange={(e) => setProfessionalData(prev => ({ ...prev, currentSalary: e.target.value }))}
                              placeholder="e.g., 10.5"
                            />
                            <p className="text-xs text-slate-500 mt-1">Enter your current salary in LPA (Lakhs Per Annum)</p>
                          </div>
                          <div>
                            <Label htmlFor="expectedSalary">Expected Salary (LPA)</Label>
                            <Input
                              id="expectedSalary"
                              type="number"
                              value={professionalData.expectedSalary}
                              onChange={(e) => setProfessionalData(prev => ({ ...prev, expectedSalary: e.target.value }))}
                              placeholder="e.g., 8"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="noticePeriod">Notice Period (days)</Label>
                            <Input
                              id="noticePeriod"
                              type="number"
                              value={professionalData.noticePeriod}
                              onChange={(e) => setProfessionalData(prev => ({ ...prev, noticePeriod: e.target.value }))}
                              placeholder="e.g., 30"
                            />
                          </div>
                        </div>

                        {/* Willing to Relocate */}
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="willingToRelocate"
                            checked={professionalData.willingToRelocate}
                            onCheckedChange={(checked) => setProfessionalData(prev => ({ ...prev, willingToRelocate: !!checked }))}
                          />
                          <Label htmlFor="willingToRelocate">Willing to relocate</Label>
                        </div>

                        {/* Skills Management */}
                        <div>
                          <Label>Skills</Label>
                          <div className="flex flex-wrap gap-2 mt-2 mb-3">
                            {professionalData.skills.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                {skill}
                                <button
                                  onClick={() => removeSkill(skill)}
                                  className="ml-1 hover:text-red-500"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex space-x-2">
                            <Input
                              value={newSkill}
                              onChange={(e) => setNewSkill(e.target.value)}
                              placeholder="Add a skill"
                              onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                            />
                            <Button type="button" onClick={addSkill} size="sm">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Languages Management */}
                        <div>
                          <Label>Languages</Label>
                          <div className="flex flex-wrap gap-2 mt-2 mb-3">
                            {professionalData.languages.map((language, index) => (
                              <Badge key={index} variant="outline" className="flex items-center gap-1">
                                {language}
                                <button
                                  onClick={() => removeLanguage(language)}
                                  className="ml-1 hover:text-red-500"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex space-x-2">
                            <Input
                              value={newLanguage}
                              onChange={(e) => setNewLanguage(e.target.value)}
                              placeholder="Add a language"
                              onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
                            />
                            <Button type="button" onClick={addLanguage} size="sm">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Work Experience Management */}
                        <div className="space-y-6 border-t pt-6 mt-6">
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-5 h-5" />
                            <Label className="text-lg font-semibold">Work Experience</Label>
                          </div>

                          {loadingWorkExperiences ? (
                            <div className="text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                              <p className="text-sm text-slate-500 mt-2">Loading work experiences...</p>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {/* Current Company Section */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white">Current Company</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Your current employment details</p>
                                  </div>
                                  {(() => {
                                    const currentExp = workExperiences.find(exp => exp.isCurrent);
                                    return currentExp ? (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditWorkExperience(currentExp)}
                                      >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                      </Button>
                                    ) : (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setWorkExperienceForm({
                                            companyName: '',
                                            jobTitle: '',
                                            currentDesignation: '',
                                            location: '',
                                            startDate: '',
                                            endDate: '',
                                            isCurrent: true,
                                            description: '',
                                            employmentType: 'full-time'
                                          });
                                          setEditingWorkExperience(null);
                                          setShowWorkExperienceForm(true);
                                        }}
                                      >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Current Company
                                      </Button>
                                    );
                                  })()}
                                </div>
                                {(() => {
                                  const currentExp = workExperiences.find(exp => exp.isCurrent);
                                  if (!currentExp) {
                                    return (
                                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50 dark:bg-slate-800/30">
                                        <p className="text-sm text-slate-500 text-center">No current company added</p>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-semibold text-slate-900 dark:text-white">
                                              {currentExp.jobTitle}
                                            </h4>
                                            <Badge className="bg-green-100 text-green-800 border-green-200">
                                              Current
                                            </Badge>
                                          </div>
                                          {currentExp.currentDesignation && (
                                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-1 italic">
                                              Designation: {currentExp.currentDesignation}
                                            </p>
                                          )}
                                          <p className="text-slate-700 dark:text-slate-300 mb-1">
                                            {currentExp.companyName || 'Company not specified'}
                                          </p>
                                          <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {currentExp.startDate ? new Date(currentExp.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : ''} - Present
                                            {currentExp.location && ` • ${currentExp.location}`}
                                          </p>
                                          {currentExp.description && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                              {currentExp.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Previous Company Section */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white">Previous Company</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Your most recent past employment</p>
                                  </div>
                                  {(() => {
                                    const previousExp = workExperiences
                                      .filter(exp => !exp.isCurrent)
                                      .sort((a, b) => {
                                        const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
                                        const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
                                        return dateB - dateA;
                                      })[0];
                                    return previousExp ? (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditWorkExperience(previousExp)}
                                      >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                      </Button>
                                    ) : (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setWorkExperienceForm({
                                            companyName: '',
                                            jobTitle: '',
                                            currentDesignation: '',
                                            location: '',
                                            startDate: '',
                                            endDate: '',
                                            isCurrent: false,
                                            description: '',
                                            employmentType: 'full-time'
                                          });
                                          setEditingWorkExperience(null);
                                          setShowWorkExperienceForm(true);
                                        }}
                                      >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Previous Company
                                      </Button>
                                    );
                                  })()}
                                </div>
                                {(() => {
                                  const previousExp = workExperiences
                                    .filter(exp => !exp.isCurrent)
                                    .sort((a, b) => {
                                      const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
                                      const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
                                      return dateB - dateA;
                                    })[0];
                                  if (!previousExp) {
                                    return (
                                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50 dark:bg-slate-800/30">
                                        <p className="text-sm text-slate-500 text-center">No previous company added</p>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                                            {previousExp.jobTitle}
                                          </h4>
                                          {previousExp.currentDesignation && (
                                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-1 italic">
                                              Designation: {previousExp.currentDesignation}
                                            </p>
                                          )}
                                          <p className="text-slate-700 dark:text-slate-300 mb-1">
                                            {previousExp.companyName || 'Company not specified'}
                                          </p>
                                          <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {previousExp.startDate ? new Date(previousExp.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : ''} -{' '}
                                            {previousExp.endDate ? new Date(previousExp.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : ''}
                                            {previousExp.location && ` • ${previousExp.location}`}
                                          </p>
                                          {previousExp.description && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                              {previousExp.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Other Companies Section */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white">Other Companies</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Additional past employment (optional)</p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setWorkExperienceForm({
                                        companyName: '',
                                        jobTitle: '',
                                        currentDesignation: '',
                                        location: '',
                                        startDate: '',
                                        endDate: '',
                                        isCurrent: false,
                                        description: '',
                                        employmentType: 'full-time'
                                      });
                                      setEditingWorkExperience(null);
                                      setShowWorkExperienceForm(true);
                                    }}
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Other Company
                                  </Button>
                                </div>
                                {(() => {
                                  const otherExps = workExperiences
                                    .filter(exp => !exp.isCurrent)
                                    .sort((a, b) => {
                                      const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
                                      const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
                                      return dateB - dateA;
                                    })
                                    .slice(1); // Skip the first one (Previous Company)
                                  
                                  if (otherExps.length === 0) {
                                    return (
                                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50 dark:bg-slate-800/30">
                                        <p className="text-sm text-slate-500 text-center">No other companies added</p>
                                      </div>
                                    );
                                  }
                                  
                                  return (
                                    <div className="space-y-3">
                                      {otherExps.map((exp) => (
                                        <div
                                          key={exp.id}
                                          className="border border-slate-200 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50"
                                        >
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                                                {exp.jobTitle}
                                              </h4>
                                              {exp.currentDesignation && (
                                                <p className="text-slate-600 dark:text-slate-400 text-sm mb-1 italic">
                                                  Designation: {exp.currentDesignation}
                                                </p>
                                              )}
                                              <p className="text-slate-700 dark:text-slate-300 mb-1">
                                                {exp.companyName || 'Company not specified'}
                                              </p>
                                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : ''} -{' '}
                                                {exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : ''}
                                                {exp.location && ` • ${exp.location}`}
                                              </p>
                                              {exp.description && (
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                                  {exp.description}
                                                </p>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditWorkExperience(exp)}
                                              >
                                                <Edit className="w-4 h-4" />
                                              </Button>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => exp.id && handleDeleteWorkExperience(exp.id)}
                                                className="text-red-600 hover:text-red-700"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>

                            </div>
                          )}
                        </div>

                        {/* Job Preferences Section */}
                        <div className="space-y-6 border-t pt-6 mt-6">
                          <div className="flex items-center space-x-2 mb-4">
                            <Star className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold">Job Preferences</h3>
                          </div>
                          
                          {/* Preferred Job Titles */}
                          <div>
                            <Label>Preferred Job Titles</Label>
                            <div className="flex flex-wrap gap-2 mt-2 mb-3">
                              {(professionalData.jobPreferences?.preferredJobTitles || []).map((title, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                  {title}
                                  <button
                                    onClick={() => removeJobTitle(title)}
                                    className="ml-1 hover:text-red-500"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                            <div className="flex space-x-2">
                              <Input
                                value={newJobTitle}
                                onChange={(e) => setNewJobTitle(e.target.value)}
                                placeholder="e.g., Software Engineer, Product Manager"
                                onKeyPress={(e) => e.key === 'Enter' && addJobTitle()}
                              />
                              <Button type="button" onClick={addJobTitle} size="sm">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>


                          {/* Preferred Industries */}
                          <div>
                            <Label>Preferred Industries</Label>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-between mt-2"
                              onClick={() => setShowIndustryDropdown(true)}
                            >
                              <span className="text-left flex-1 truncate">
                                {(professionalData.jobPreferences?.preferredIndustries?.length || 0) > 0
                                  ? `${professionalData.jobPreferences.preferredIndustries?.length || 0} industry${(professionalData.jobPreferences.preferredIndustries?.length || 0) !== 1 ? 'ies' : ''} selected`
                                  : "Select preferred industries"}
                              </span>
                              <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                            </Button>
                            {(professionalData.jobPreferences?.preferredIndustries?.length || 0) > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {(professionalData.jobPreferences.preferredIndustries || []).slice(0, 5).map((industry: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                    {industry}
                                    <button
                                      onClick={() => setProfessionalData(prev => ({
                                        ...prev,
                                        jobPreferences: {
                                          ...prev.jobPreferences,
                                          preferredIndustries: (prev.jobPreferences?.preferredIndustries || []).filter((_, i) => i !== index)
                                        }
                                      }))}
                                      className="ml-1 hover:text-red-500"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ))}
                                {(professionalData.jobPreferences?.preferredIndustries?.length || 0) > 5 && (
                                  <Badge variant="outline">+{(professionalData.jobPreferences.preferredIndustries || []).length - 5} more</Badge>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Preferred Locations */}
                          <div>
                            <Label>Preferred Locations</Label>
                            <div className="flex flex-wrap gap-2 mt-2 mb-3">
                              {(professionalData.jobPreferences?.preferredLocations || []).map((location, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                  {location}
                                  <button
                                    onClick={() => removeLocation(location)}
                                    className="ml-1 hover:text-red-500"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                            <div className="flex space-x-2">
                              <Input
                                value={newLocation}
                                onChange={(e) => setNewLocation(e.target.value)}
                                placeholder="e.g., Mumbai, Bangalore, Remote"
                                onKeyPress={(e) => e.key === 'Enter' && addLocation()}
                              />
                              <Button type="button" onClick={addLocation} size="sm">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Preferred Company Size and Employment Type */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="preferredCompanySize">Preferred Company Size</Label>
                              <Select value={professionalData.jobPreferences?.preferredCompanySize || ''} onValueChange={(value) => setProfessionalData(prev => ({
                                ...prev,
                                jobPreferences: {
                                  ...prev.jobPreferences || {},
                                  preferredCompanySize: value
                                }
                              }))}>
                                <SelectTrigger id="preferredCompanySize">
                                  <SelectValue placeholder="Select company size">
                                    {professionalData.jobPreferences?.preferredCompanySize ? (
                                      professionalData.jobPreferences.preferredCompanySize === 'startup' ? 'Startup (1-50)' :
                                      professionalData.jobPreferences.preferredCompanySize === 'small' ? 'Small (51-200)' :
                                      professionalData.jobPreferences.preferredCompanySize === 'medium' ? 'Medium (201-1000)' :
                                      professionalData.jobPreferences.preferredCompanySize === 'large' ? 'Large (1000+)' :
                                      professionalData.jobPreferences.preferredCompanySize === 'any' ? 'Any Size' :
                                      professionalData.jobPreferences.preferredCompanySize
                                    ) : 'Select company size'}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="startup">Startup (1-50)</SelectItem>
                                  <SelectItem value="small">Small (51-200)</SelectItem>
                                  <SelectItem value="medium">Medium (201-1000)</SelectItem>
                                  <SelectItem value="large">Large (1000+)</SelectItem>
                                  <SelectItem value="any">Any Size</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="preferredEmploymentType">Preferred Employment Type</Label>
                              <Select value={professionalData.jobPreferences?.preferredEmploymentType || ''} onValueChange={(value) => setProfessionalData(prev => ({
                                ...prev,
                                jobPreferences: {
                                  ...prev.jobPreferences || {},
                                  preferredEmploymentType: value
                                }
                              }))}>
                                <SelectTrigger id="preferredEmploymentType">
                                  <SelectValue placeholder="Select employment type">
                                    {professionalData.jobPreferences?.preferredEmploymentType ? (
                                      professionalData.jobPreferences.preferredEmploymentType === 'full-time' ? 'Full-Time' :
                                      professionalData.jobPreferences.preferredEmploymentType === 'part-time' ? 'Part-Time' :
                                      professionalData.jobPreferences.preferredEmploymentType === 'contract' ? 'Contract' :
                                      professionalData.jobPreferences.preferredEmploymentType === 'freelance' ? 'Freelance' :
                                      professionalData.jobPreferences.preferredEmploymentType === 'internship' ? 'Internship' :
                                      professionalData.jobPreferences.preferredEmploymentType
                                    ) : 'Select employment type'}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="full-time">Full-Time</SelectItem>
                                  <SelectItem value="part-time">Part-Time</SelectItem>
                                  <SelectItem value="contract">Contract</SelectItem>
                                  <SelectItem value="freelance">Freelance</SelectItem>
                                  <SelectItem value="internship">Internship</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>


                          {/* Job Type and Experience Preferences */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label>Preferred Job Types</Label>
                              <Select
                                value=""
                                onValueChange={(value) => addJobType(value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select job type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="full-time">Full-time</SelectItem>
                                  <SelectItem value="part-time">Part-time</SelectItem>
                                  <SelectItem value="contract">Contract</SelectItem>
                                  <SelectItem value="internship">Internship</SelectItem>
                                  <SelectItem value="freelance">Freelance</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {(professionalData.jobPreferences?.preferredJobTypes || []).map((type, index) => (
                                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                    {type}
                                    <button
                                      onClick={() => removeJobType(type)}
                                      className="ml-1 hover:text-red-500"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div>
                              <Label>Preferred Experience Levels</Label>
                              <Select
                                value=""
                                onValueChange={(value) => addExperienceLevel(value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select experience level" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="entry">Entry Level</SelectItem>
                                  <SelectItem value="junior">Junior</SelectItem>
                                  <SelectItem value="mid">Mid Level</SelectItem>
                                  <SelectItem value="senior">Senior</SelectItem>
                                  <SelectItem value="lead">Lead</SelectItem>
                                  <SelectItem value="executive">Executive</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {(professionalData.jobPreferences?.preferredExperienceLevels || []).map((level, index) => (
                                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                                    {level}
                                    <button
                                      onClick={() => removeExperienceLevel(level)}
                                      className="ml-1 hover:text-red-500"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Work Mode Preferences */}
                          <div>
                            <Label>Preferred Work Mode</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {['on-site', 'remote', 'hybrid'].map((mode) => {
                                const workModes = Array.isArray(professionalData.jobPreferences?.preferredWorkMode) 
                                  ? professionalData.jobPreferences.preferredWorkMode 
                                  : (professionalData.jobPreferences?.preferredWorkMode 
                                      ? [String(professionalData.jobPreferences.preferredWorkMode)] 
                                      : []);
                                // Normalize work modes: convert "onsite" to "on-site" for comparison
                                const normalizedModes = workModes.map(m => {
                                  const normalized = String(m).toLowerCase().replace(/_/g, '-');
                                  return normalized === 'onsite' ? 'on-site' : normalized;
                                });
                                const normalizedMode = mode.toLowerCase();
                                const isChecked = normalizedModes.includes(normalizedMode) || normalizedModes.includes(normalizedMode.replace('on-site', 'onsite'));
                                return (
                                  <div key={mode} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`workMode-${mode}`}
                                      checked={isChecked}
                                      onCheckedChange={(checked) => toggleWorkMode(mode, !!checked)}
                                    />
                                    <Label htmlFor={`workMode-${mode}`} className="capitalize">
                                      {mode.replace('-', ' ')}
                                    </Label>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Preferred Skills */}
                          <div className="border-t pt-4 mt-4">
                            <Label className="text-base font-semibold mb-3 block">Preferred Skills</Label>
                            <div className="flex flex-wrap gap-2 mb-3 min-h-[40px]">
                              {(professionalData.jobPreferences?.preferredSkills && professionalData.jobPreferences.preferredSkills.length > 0) ? (
                                professionalData.jobPreferences.preferredSkills.map((skill, index) => (
                                  <Badge key={index} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                                    {skill}
                                    <button
                                      onClick={() => removePreferredSkill(skill)}
                                      className="ml-1 hover:text-red-500 transition-colors"
                                      type="button"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ))
                              ) : (
                                <p className="text-sm text-slate-500 dark:text-slate-400 italic">No preferred skills added yet</p>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <Input
                                value={newPreferredSkill}
                                onChange={(e) => setNewPreferredSkill(e.target.value)}
                                placeholder="e.g., React, Python, Machine Learning"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addPreferredSkill();
                                  }
                                }}
                                className="flex-1"
                              />
                              <Button 
                                type="button" 
                                onClick={addPreferredSkill} 
                                size="sm"
                                disabled={!newPreferredSkill.trim()}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Salary Preferences */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label>Preferred Minimum Salary (LPA)</Label>
                              <Input
                                type="number"
                                value={professionalData.jobPreferences?.preferredSalaryMin || ''}
                                onChange={(e) => setProfessionalData(prev => ({
                                  ...prev,
                                  jobPreferences: {
                                    ...prev.jobPreferences || {},
                                    preferredSalaryMin: e.target.value
                                  }
                                }))}
                                placeholder="e.g., 5"
                              />
                            </div>
                            <div>
                              <Label>Preferred Maximum Salary (LPA)</Label>
                              <Input
                                type="number"
                                value={professionalData.jobPreferences?.preferredSalaryMax || ''}
                                onChange={(e) => setProfessionalData(prev => ({
                                  ...prev,
                                  jobPreferences: {
                                    ...prev.jobPreferences || {},
                                    preferredSalaryMax: e.target.value
                                  }
                                }))}
                                placeholder="e.g., 15"
                              />
                            </div>
                          </div>

                          {/* Additional Preferences */}
                          <div className="space-y-4 border-t pt-4 mt-4">
                            <div className="flex items-center space-x-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                              <Checkbox
                                id="willingToTravel"
                                checked={professionalData.jobPreferences?.willingToTravel === true}
                                onCheckedChange={(checked) => setProfessionalData(prev => ({
                                  ...prev,
                                  jobPreferences: {
                                    ...prev.jobPreferences || {},
                                    willingToTravel: checked === true
                                  }
                                }))}
                              />
                              <Label htmlFor="willingToTravel" className="text-sm font-medium cursor-pointer">
                                Willing to travel for work
                              </Label>
                            </div>
                          </div>
                        </div>

                        {/* Social Links */}
                        <div className="space-y-4">
                          <Label>Social Links</Label>
                          <div>
                            <Label htmlFor="linkedin">LinkedIn</Label>
                            <Input
                              id="linkedin"
                              value={professionalData.socialLinks.linkedin}
                              onChange={(e) => setProfessionalData(prev => ({ 
                                ...prev, 
                                socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                              }))}
                              placeholder="https://linkedin.com/in/yourprofile"
                            />
                          </div>
                          <div>
                            <Label htmlFor="github">GitHub</Label>
                            <Input
                              id="github"
                              value={professionalData.socialLinks.github}
                              onChange={(e) => setProfessionalData(prev => ({ 
                                ...prev, 
                                socialLinks: { ...prev.socialLinks, github: e.target.value }
                              }))}
                              placeholder="https://github.com/yourusername"
                            />
                          </div>
                          <div>
                            <Label htmlFor="portfolio">Portfolio</Label>
                            <Input
                              id="portfolio"
                              value={professionalData.socialLinks.portfolio}
                              onChange={(e) => setProfessionalData(prev => ({ 
                                ...prev, 
                                socialLinks: { ...prev.socialLinks, portfolio: e.target.value }
                              }))}
                              placeholder="https://yourportfolio.com"
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <Button 
                            onClick={saveProfessionalData}
                            disabled={saving}
                            className="flex-1"
                          >
                            {saving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => cancelEdit('professional')}
                            disabled={saving}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Headline</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {user.headline || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Location</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {user.currentLocation || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Summary</p>
                        <p className="font-medium text-slate-900 dark:text-white line-clamp-3">
                          {user.summary || 'No summary provided'}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(() => {
                          // Priority 1: Use professionalData values if they exist (user just entered them)
                          let experienceDisplay = null;
                          if (professionalData.experienceYears || professionalData.experienceMonths || professionalData.experienceDays) {
                            const years = Number(professionalData.experienceYears) || 0;
                            const months = Number(professionalData.experienceMonths) || 0;
                            const days = Number(professionalData.experienceDays) || 0;
                            const parts = [];
                            if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
                            if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
                            if (days > 0 && years === 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
                            experienceDisplay = parts.length > 0 ? parts.join(', ') : 'No experience';
                          } else if (workExperiences && workExperiences.length > 0) {
                            // Priority 2: Calculate experience from work experiences (most accurate)
                            let totalDays = 0;
                            workExperiences.forEach((exp: any) => {
                              const start = new Date(exp.startDate);
                              const end = exp.isCurrent ? new Date() : new Date(exp.endDate || new Date());
                              if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                                const diffTime = Math.abs(end.getTime() - start.getTime());
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                totalDays += diffDays;
                              }
                            });
                            const years = Math.floor(totalDays / 365);
                            const remainingDays = totalDays % 365;
                            const months = Math.floor(remainingDays / 30);
                            const days = remainingDays % 30;
                            const parts = [];
                            if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
                            if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
                            if (days > 0 && years === 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
                            experienceDisplay = parts.length > 0 ? parts.join(', ') : 'No experience';
                          } else if (user.experienceYears !== undefined && user.experienceYears !== null) {
                            // Priority 3: Fallback to experience_years field
                            const totalYears = user.experienceYears || 0;
                            const years = Math.floor(totalYears);
                            const months = Math.floor((totalYears - years) * 12);
                            const days = Math.floor(((totalYears - years) * 12 - months) * 30);
                            const parts = [];
                            if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
                            if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
                            if (days > 0 && years === 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
                            experienceDisplay = parts.length > 0 ? parts.join(', ') : 'No experience';
                          }
                          
                          return experienceDisplay ? (
                            <div>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Experience</p>
                              <p className="font-medium text-slate-900 dark:text-white">{experienceDisplay}</p>
                            </div>
                          ) : null;
                        })()}
                        {(user.highestEducation || (user as any).highestEducation) && (
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Highest Education</p>
                            <p className="font-medium text-slate-900 dark:text-white capitalize">{(user.highestEducation || (user as any).highestEducation || '').replace('_', ' ')}</p>
                          </div>
                        )}
                        {(user.fieldOfStudy || (user as any).fieldOfStudy) && (
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Field of Study</p>
                            <p className="font-medium text-slate-900 dark:text-white">{user.fieldOfStudy || (user as any).fieldOfStudy}</p>
                          </div>
                        )}
                        {(() => {
                          // Get current salary - check user object first (database value), then professionalData
                          const userSalary = (user as any).currentSalary !== undefined && (user as any).currentSalary !== null 
                            ? (user as any).currentSalary 
                            : (user.currentSalary !== undefined && user.currentSalary !== null ? user.currentSalary : null);
                          const currentSalary = userSalary || (professionalData.currentSalary || null);
                          
                          // Check if salary exists and is valid
                          if (currentSalary === null || currentSalary === undefined || currentSalary === '' || currentSalary === '0') {
                            return null;
                          }
                          
                          // Format the salary value
                          let salaryValue = '';
                          if (typeof currentSalary === 'number' && currentSalary > 0) {
                            salaryValue = `₹${currentSalary} LPA`;
                          } else if (typeof currentSalary === 'string') {
                            const salaryStr = currentSalary.toString().trim();
                            if (salaryStr === '' || salaryStr === '0') return null;
                            
                            if (salaryStr.includes('LPA') || salaryStr.includes('lpa')) {
                              salaryValue = salaryStr.startsWith('₹') ? salaryStr : `₹${salaryStr}`;
                            } else {
                              // Try to parse as number
                              const numValue = parseFloat(salaryStr);
                              if (!isNaN(numValue) && numValue > 0) {
                                salaryValue = `₹${numValue} LPA`;
                              } else {
                                salaryValue = `₹${salaryStr} LPA`;
                              }
                            }
                          } else {
                            return null;
                          }
                          
                          return (
                            <div>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Current Salary</p>
                              <p className="font-medium text-slate-900 dark:text-white">{salaryValue}</p>
                            </div>
                          );
                        })()}
                        {user.expectedSalary && (
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Expected Salary</p>
                            <p className="font-medium text-slate-900 dark:text-white">₹{user.expectedSalary} LPA</p>
                          </div>
                        )}
                        {user.noticePeriod && (
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Notice Period</p>
                            <p className="font-medium text-slate-900 dark:text-white">{user.noticePeriod} days</p>
                          </div>
                        )}
                        {(user.dateOfBirth || (user as any).dateOfBirth) && (
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Date of Birth</p>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {(() => {
                                try {
                                  const dob = user.dateOfBirth || (user as any).dateOfBirth;
                                  const dateStr = typeof dob === 'string' ? dob.split('T')[0] : dob;
                                  return new Date(dateStr).toLocaleDateString();
                                } catch (e) {
                                  return user.dateOfBirth || (user as any).dateOfBirth || 'Not provided';
                                }
                              })()}
                            </p>
                          </div>
                        )}
                        {(user as any).gender && (
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Gender</p>
                            <p className="font-medium text-slate-900 dark:text-white capitalize">
                              {(user as any).gender}
                            </p>
                          </div>
                        )}
                        {user.willingToRelocate !== undefined && (
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Willing to Relocate</p>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {user.willingToRelocate ? 'Yes' : 'No'}
                            </p>
                          </div>
                        )}
                      </div>
                        {user.skills && user.skills.length > 0 && (
                          <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Skills</p>
                            <div className="flex flex-wrap gap-2">
                              {user.skills.slice(0, 5).map((skill, index) => (
                                <Badge key={index} variant="secondary">{skill}</Badge>
                              ))}
                              {user.skills.length > 5 && (
                                <Badge variant="outline">+{user.skills.length - 5} more</Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Job Preferences Section */}
                        {((user.preferredJobTitles && user.preferredJobTitles.length > 0) ||
                           ((user as any).preferredJobTitles && (user as any).preferredJobTitles.length > 0) ||
                           (user.preferences?.preferredJobTitles && user.preferences.preferredJobTitles.length > 0) ||
                           (user.preferredIndustries && user.preferredIndustries.length > 0) ||
                           ((user as any).preferredIndustries && (user as any).preferredIndustries.length > 0) ||
                           (user.preferences?.preferredIndustries && user.preferences.preferredIndustries.length > 0) ||
                           (user.preferredLocations && user.preferredLocations.length > 0) ||
                           ((user as any).preferredLocations && (user as any).preferredLocations.length > 0) ||
                           (user.preferredWorkMode && (Array.isArray(user.preferredWorkMode) ? user.preferredWorkMode.length > 0 : true)) ||
                           ((user as any).preferredWorkMode && ((user as any).preferredWorkMode.length > 0 || (user as any).preferredWorkMode)) ||
                           user.preferredCompanySize ||
                           (user as any).preferredCompanySize ||
                           user.preferredEmploymentType ||
                           (user as any).preferredEmploymentType) && (
                          <div className="space-y-4 border-t pt-6 mt-6">
                            <div className="flex items-center space-x-2 mb-4">
                              <Star className="w-5 h-5 text-blue-600" />
                              <h3 className="text-lg font-semibold">Job Preferences</h3>
                            </div>
                            
                            {/* Preferred Job Titles */}
                            {((user.preferredJobTitles && user.preferredJobTitles.length > 0) || ((user as any).preferredJobTitles && (user as any).preferredJobTitles.length > 0) || (user.preferences?.preferredJobTitles && user.preferences.preferredJobTitles.length > 0)) ? (
                              <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Preferred Job Titles</p>
                                <div className="flex flex-wrap gap-2">
                                  {(user.preferredJobTitles || (user as any).preferredJobTitles || user.preferences?.preferredJobTitles || []).slice(0, 5).map((title: string, index: number) => (
                                    <Badge key={index} variant="secondary">{title}</Badge>
                                  ))}
                                  {(user.preferredJobTitles || (user as any).preferredJobTitles || user.preferences?.preferredJobTitles || []).length > 5 && (
                                    <Badge variant="outline">+{(user.preferredJobTitles || (user as any).preferredJobTitles || user.preferences?.preferredJobTitles || []).length - 5} more</Badge>
                                  )}
                                </div>
                              </div>
                            ) : null}
                            
                            {/* Preferred Industries */}
                            {((user.preferredIndustries && user.preferredIndustries.length > 0) || ((user as any).preferredIndustries && (user as any).preferredIndustries.length > 0) || (user.preferences?.preferredIndustries && user.preferences.preferredIndustries.length > 0)) ? (
                              <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Preferred Industries</p>
                                <div className="flex flex-wrap gap-2">
                                  {(user.preferredIndustries || (user as any).preferredIndustries || user.preferences?.preferredIndustries || []).slice(0, 5).map((industry: string, index: number) => (
                                    <Badge key={index} variant="outline">{industry}</Badge>
                                  ))}
                                  {(user.preferredIndustries || (user as any).preferredIndustries || user.preferences?.preferredIndustries || []).length > 5 && (
                                    <Badge variant="outline">+{(user.preferredIndustries || (user as any).preferredIndustries || user.preferences?.preferredIndustries || []).length - 5} more</Badge>
                                  )}
                                </div>
                              </div>
                            ) : null}
                            
                            {/* Preferred Locations */}
                            {((user.preferredLocations && user.preferredLocations.length > 0) || ((user as any).preferredLocations && (user as any).preferredLocations.length > 0)) && (
                              <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Preferred Locations</p>
                                <div className="flex flex-wrap gap-2">
                                  {(user.preferredLocations || (user as any).preferredLocations || []).slice(0, 5).map((location: string, index: number) => (
                                    <Badge key={index} variant="outline">{location}</Badge>
                                  ))}
                                  {(user.preferredLocations || (user as any).preferredLocations || []).length > 5 && (
                                    <Badge variant="outline">+{(user.preferredLocations || (user as any).preferredLocations || []).length - 5} more</Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Preferred Work Mode */}
                            {((user.preferredWorkMode && (Array.isArray(user.preferredWorkMode) ? user.preferredWorkMode.length > 0 : true)) || ((user as any).preferredWorkMode && ((user as any).preferredWorkMode.length > 0 || (user as any).preferredWorkMode))) && (
                              <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Preferred Work Mode</p>
                                <div className="flex flex-wrap gap-2">
                                  {Array.isArray(user.preferredWorkMode || (user as any).preferredWorkMode) 
                                    ? ((user.preferredWorkMode || (user as any).preferredWorkMode) || []).map((mode: string, index: number) => (
                                        <Badge key={index} variant="outline" className="capitalize">{mode}</Badge>
                                      ))
                                    : <Badge variant="outline" className="capitalize">{user.preferredWorkMode || (user as any).preferredWorkMode}</Badge>
                                  }
                                </div>
                              </div>
                            )}
                            
                            {/* Preferred Company Size */}
                            {(user.preferredCompanySize || (user as any).preferredCompanySize) && (
                              <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Preferred Company Size</p>
                                <p className="font-medium text-slate-900 dark:text-white capitalize">
                                  {(user.preferredCompanySize || (user as any).preferredCompanySize || '').replace('_', ' ')}
                                </p>
                              </div>
                            )}
                            
                            {/* Preferred Employment Type */}
                            {(user.preferredEmploymentType || (user as any).preferredEmploymentType) && (
                              <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Preferred Employment Type</p>
                                <p className="font-medium text-slate-900 dark:text-white capitalize">
                                  {(user.preferredEmploymentType || (user as any).preferredEmploymentType || '').replace('_', ' ')}
                                </p>
                              </div>
                            )}
                            
                            {/* Preferred Job Types */}
                            {((user.preferences?.preferredJobTypes && user.preferences.preferredJobTypes.length > 0) || (professionalData.jobPreferences?.preferredJobTypes && professionalData.jobPreferences.preferredJobTypes.length > 0)) && (
                              <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Preferred Job Types</p>
                                <div className="flex flex-wrap gap-2">
                                  {(user.preferences?.preferredJobTypes || professionalData.jobPreferences?.preferredJobTypes || []).map((type: string, index: number) => (
                                    <Badge key={index} variant="outline" className="capitalize">{type}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Preferred Skills */}
                            {((user.preferences?.preferredSkills && user.preferences.preferredSkills.length > 0) || (professionalData.jobPreferences?.preferredSkills && professionalData.jobPreferences.preferredSkills.length > 0)) && (
                              <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Preferred Skills</p>
                                <div className="flex flex-wrap gap-2">
                                  {(user.preferences?.preferredSkills || professionalData.jobPreferences?.preferredSkills || []).map((skill: string, index: number) => (
                                    <Badge key={index} variant="secondary">{skill}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Resumes Tab */}
            <TabsContent value="resumes" className="space-y-6">
              <ResumeManagement />
              
              {resumeStats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                          {resumeStats.totalResumes}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-300">Total Resumes</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                          {resumeStats.totalDownloads}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-300">Total Downloads</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="w-5 h-5" />
                      <span>Notifications</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-300">Job Alerts</span>
                        <Badge variant="default">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-300">Application Updates</span>
                        <Badge variant="default">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-300">Profile Views</span>
                        <Badge variant="secondary">Disabled</Badge>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Notifications
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="w-5 h-5" />
                      <span>Billing & Subscription</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-300">Current Plan</span>
                        <Badge variant="outline">Free</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-300">Next Billing</span>
                        <span className="text-sm text-slate-900 dark:text-white">-</span>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Upgrade Plan
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <div className="max-w-2xl mx-auto">
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <LogOut className="w-5 h-5" />
                      <span>Account Actions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Change Email Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-5 h-5 text-blue-600" />
                          <div>
                            <h3 className="font-medium">Change Email</h3>
                            <p className="text-sm text-slate-500">Update your email address</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowChangeEmail(!showChangeEmail)}
                        >
                          {showChangeEmail ? 'Cancel' : 'Change'}
                        </Button>
                      </div>
                      
                      {showChangeEmail && (
                        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <div>
                            <Label htmlFor="new-email">New Email Address</Label>
                            <Input
                              id="new-email"
                              type="email"
                              value={emailData.newEmail}
                              onChange={(e) => setEmailData({...emailData, newEmail: e.target.value})}
                              placeholder="Enter new email address"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email-password">Current Password</Label>
                            <Input
                              id="email-password"
                              type="password"
                              value={emailData.currentPassword}
                              onChange={(e) => setEmailData({...emailData, currentPassword: e.target.value})}
                              placeholder="Enter current password"
                            />
                          </div>
                          <Button 
                            onClick={handleChangeEmail}
                            disabled={securityLoading}
                            className="w-full"
                          >
                            {securityLoading ? 'Updating...' : 'Update Email'}
                          </Button>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Change Phone Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-5 h-5 text-green-600" />
                          <div>
                            <h3 className="font-medium">Change Phone</h3>
                            <p className="text-sm text-slate-500">Update your phone number</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowChangePhone(!showChangePhone)}
                        >
                          {showChangePhone ? 'Cancel' : 'Change'}
                        </Button>
                      </div>
                      
                      {showChangePhone && (
                        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <div>
                            <Label htmlFor="new-phone">New Phone Number</Label>
                            <Input
                              id="new-phone"
                              type="tel"
                              value={phoneData.newPhone}
                              onChange={(e) => setPhoneData({...phoneData, newPhone: e.target.value})}
                              placeholder="Enter new phone number"
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone-password">Current Password</Label>
                            <Input
                              id="phone-password"
                              type="password"
                              value={phoneData.currentPassword}
                              onChange={(e) => setPhoneData({...phoneData, currentPassword: e.target.value})}
                              placeholder="Enter current password"
                            />
                          </div>
                          <Button 
                            onClick={handleChangePhone}
                            disabled={securityLoading}
                            className="w-full"
                          >
                            {securityLoading ? 'Updating...' : 'Update Phone'}
                          </Button>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Change Password Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-5 h-5 text-red-600" />
                          <div>
                            <h3 className="font-medium">Change Password</h3>
                            <p className="text-sm text-slate-500">Update your account password</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowChangePassword(!showChangePassword)}
                        >
                          {showChangePassword ? 'Cancel' : 'Change'}
                        </Button>
                      </div>
                      
                      {showChangePassword && (
                        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <div>
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input
                              id="current-password"
                              type="password"
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                              placeholder="Enter current password"
                            />
                          </div>
                          <div>
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                              id="new-password"
                              type="password"
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                              placeholder="Enter new password"
                            />
                          </div>
                          <div>
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input
                              id="confirm-password"
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                              placeholder="Confirm new password"
                            />
                          </div>
                          <Button 
                            onClick={handleChangePassword}
                            disabled={securityLoading}
                            className="w-full"
                          >
                            {securityLoading ? 'Updating...' : 'Update Password'}
                          </Button>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {showIndustryDropdown && (
        <IndustryDropdown
          selectedIndustries={professionalData.jobPreferences?.preferredIndustries || []}
          onIndustryChange={(industries) => {
            setProfessionalData(prev => ({
              ...prev,
              jobPreferences: {
                ...prev.jobPreferences || {},
                preferredIndustries: industries
              }
            }))
          }}
          onClose={() => setShowIndustryDropdown(false)}
        />
      )}

      {/* Work Experience Dialog */}
      <Dialog open={showWorkExperienceForm} onOpenChange={setShowWorkExperienceForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWorkExperience ? 'Edit Work Experience' : 'Add Work Experience'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Input
                  id="jobTitle"
                  value={workExperienceForm.jobTitle || ''}
                  onChange={(e) => setWorkExperienceForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                  placeholder="e.g., Software Engineer"
                />
              </div>
              <div>
                <Label htmlFor="currentDesignation">Current Designation</Label>
                <Input
                  id="currentDesignation"
                  value={workExperienceForm.currentDesignation || ''}
                  onChange={(e) => setWorkExperienceForm(prev => ({ ...prev, currentDesignation: e.target.value }))}
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={workExperienceForm.companyName || ''}
                  onChange={(e) => setWorkExperienceForm(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="e.g., Tech Solutions Inc."
                />
              </div>
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={workExperienceForm.startDate || ''}
                  onChange={(e) => setWorkExperienceForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={workExperienceForm.endDate || ''}
                  onChange={(e) => setWorkExperienceForm(prev => ({ ...prev, endDate: e.target.value }))}
                  disabled={workExperienceForm.isCurrent}
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={workExperienceForm.location || ''}
                  onChange={(e) => setWorkExperienceForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Mumbai, India"
                />
              </div>
              <div>
                <Label htmlFor="employmentType">Employment Type</Label>
                <Select
                  value={workExperienceForm.employmentType || 'full-time'}
                  onValueChange={(value) => setWorkExperienceForm(prev => ({ ...prev, employmentType: value as any }))}
                >
                  <SelectTrigger id="employmentType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 flex items-center space-x-2">
                <Checkbox
                  id="isCurrent"
                  checked={workExperienceForm.isCurrent || false}
                  onCheckedChange={(checked) => {
                    setWorkExperienceForm(prev => ({
                      ...prev,
                      isCurrent: !!checked,
                      endDate: checked ? '' : prev.endDate
                    }))
                  }}
                />
                <Label htmlFor="isCurrent">This is my current job</Label>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={workExperienceForm.description || ''}
                  onChange={(e) => setWorkExperienceForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your role and responsibilities..."
                  rows={4}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWorkExperienceForm(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveWorkExperience}
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingWorkExperience ? 'Update' : 'Add'} Experience
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Education Dialog */}
      <Dialog open={showEducationForm} onOpenChange={setShowEducationForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEducation ? 'Edit Education' : 'Add Education'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="degree">Degree *</Label>
                <Input
                  id="degree"
                  value={educationForm.degree}
                  onChange={(e) => setEducationForm(prev => ({ ...prev, degree: e.target.value }))}
                  placeholder="e.g., Bachelor of Science"
                />
              </div>
              <div>
                <Label htmlFor="institution">Institution/University *</Label>
                <Input
                  id="institution"
                  value={educationForm.institution}
                  onChange={(e) => setEducationForm(prev => ({ ...prev, institution: e.target.value }))}
                  placeholder="e.g., University of Mumbai"
                />
              </div>
              <div>
                <Label htmlFor="fieldOfStudy">Field of Study</Label>
                <Input
                  id="fieldOfStudy"
                  value={educationForm.fieldOfStudy}
                  onChange={(e) => setEducationForm(prev => ({ ...prev, fieldOfStudy: e.target.value }))}
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div>
                <Label htmlFor="educationType">Education Type</Label>
                <Select
                  value={educationForm.educationType}
                  onValueChange={(value) => setEducationForm(prev => ({ ...prev, educationType: value }))}
                >
                  <SelectTrigger id="educationType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bachelor">Bachelor's</SelectItem>
                    <SelectItem value="master">Master's</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                    <SelectItem value="diploma">Diploma</SelectItem>
                    <SelectItem value="certification">Certification</SelectItem>
                    <SelectItem value="high-school">High School</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={educationForm.startDate}
                  onChange={(e) => setEducationForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={educationForm.endDate}
                  onChange={(e) => setEducationForm(prev => ({ ...prev, endDate: e.target.value }))}
                  disabled={educationForm.isCurrent}
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={educationForm.location}
                  onChange={(e) => setEducationForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Mumbai, India"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isCurrent"
                  checked={educationForm.isCurrent}
                  onCheckedChange={(checked) => {
                    setEducationForm(prev => ({
                      ...prev,
                      isCurrent: !!checked,
                      endDate: checked ? '' : prev.endDate
                    }))
                  }}
                />
                <Label htmlFor="isCurrent">Currently studying</Label>
              </div>
              <div>
                <Label htmlFor="gpa">GPA/CGPA</Label>
                <Input
                  id="gpa"
                  type="number"
                  step="0.01"
                  value={educationForm.gpa}
                  onChange={(e) => setEducationForm(prev => ({ ...prev, gpa: e.target.value }))}
                  placeholder="e.g., 8.5"
                />
              </div>
              <div>
                <Label htmlFor="percentage">Percentage</Label>
                <Input
                  id="percentage"
                  type="number"
                  step="0.01"
                  value={educationForm.percentage}
                  onChange={(e) => setEducationForm(prev => ({ ...prev, percentage: e.target.value }))}
                  placeholder="e.g., 85.5"
                />
              </div>
              <div>
                <Label htmlFor="grade">Grade</Label>
                <Input
                  id="grade"
                  value={educationForm.grade}
                  onChange={(e) => setEducationForm(prev => ({ ...prev, grade: e.target.value }))}
                  placeholder="e.g., A, First Class"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={educationForm.description}
                  onChange={(e) => setEducationForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional details about your education..."
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEducationForm(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEducation}
            >
              <Save className="w-4 h-4 mr-2" />
              {editingEducation ? 'Update' : 'Add'} Education
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
