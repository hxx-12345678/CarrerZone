"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft,
  Upload,
  FileText,
  Edit,
  Trash2,
  Star,
  Eye,
  Download,
  Plus,
  X
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { toast } from 'sonner'
import { apiService, CoverLetter } from '@/lib/api'
import { JobseekerAuthGuard } from '@/components/jobseeker-auth-guard'

export default function CoverLettersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [coverLettersLoading, setCoverLettersLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please sign in to manage your cover letters')
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && !loading) {
      fetchCoverLetters()
    }
  }, [user, loading])

  const fetchCoverLetters = async () => {
    try {
      setCoverLettersLoading(true)
      const response = await apiService.getCoverLetters()
      if (response.success && response.data) {
        setCoverLetters(response.data)
      }
    } catch (error) {
      console.error('Error fetching cover letters:', error)
      toast.error('Failed to load cover letters')
    } finally {
      setCoverLettersLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // File validation
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF, DOC, or DOCX files only.')
      return
    }

    if (file.size > maxSize) {
      toast.error('File size too large. Please upload a file smaller than 5MB.')
      return
    }

    try {
      setUploading(true)
      const response = await apiService.uploadCoverLetterFile(file)
      if (response.success) {
        toast.success('Cover letter uploaded successfully!')
        fetchCoverLetters()
        
        // If this is the first cover letter, show additional info
        if (coverLetters.length === 0) {
          toast.success('This cover letter has been set as your default cover letter.')
        }
      }
    } catch (error) {
      console.error('Error uploading cover letter:', error)
      toast.error('Failed to upload cover letter. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDownload = async (coverLetterId: string) => {
    try {
      await apiService.downloadCoverLetter(coverLetterId)
    } catch (error) {
      console.error('Error downloading cover letter:', error)
      toast.error('Failed to download cover letter')
    }
  }

  const handleView = async (coverLetterId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/user/cover-letters/${coverLetterId}/download`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to view cover letter');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Clean up the URL after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error('Error viewing cover letter:', error)
      toast.error('Failed to view cover letter')
    }
  }

  const handleDelete = async (coverLetterId: string) => {
    if (!confirm('Are you sure you want to delete this cover letter?')) {
      return
    }

    try {
      const response = await apiService.deleteCoverLetter(coverLetterId)
      if (response.success) {
        toast.success('Cover letter deleted successfully')
        fetchCoverLetters()
      } else {
        toast.error(response.message || 'Failed to delete cover letter')
      }
    } catch (error) {
      console.error('Error deleting cover letter:', error)
      toast.error('Failed to delete cover letter')
    }
  }

  const handleSetDefault = async (coverLetterId: string) => {
    try {
      const response = await apiService.setDefaultCoverLetter(coverLetterId)
      if (response.success) {
        toast.success('Default cover letter updated')
        fetchCoverLetters()
      } else {
        toast.error(response.message || 'Failed to set default cover letter')
      }
    } catch (error) {
      console.error('Error setting default cover letter:', error)
      toast.error('Failed to set default cover letter')
    }
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
    <JobseekerAuthGuard>
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
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Plus className="w-4 h-4 mr-2" />
                Upload Cover Letter
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              My Cover Letters
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Manage your cover letters and set your default one
            </p>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Cover Letters List */}
          {coverLettersLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : coverLetters.length === 0 ? (
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  No cover letters yet
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  Upload your first cover letter to get started
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Cover Letter
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {coverLetters.map((coverLetter) => (
                <Card key={coverLetter.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {coverLetter.title || 'Untitled Cover Letter'}
                          </h3>
                          {coverLetter.isDefault && (
                            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              Default
                            </Badge>
                          )}
                        </div>
                        
                        {coverLetter.summary && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                            {coverLetter.summary}
                          </p>
                        )}

                        <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                          <div className="flex items-center space-x-1">
                            <FileText className="w-4 h-4" />
                            <span>
                              {coverLetter.metadata?.originalName || 'Unknown file'}
                            </span>
                          </div>
                          {coverLetter.metadata?.fileSize && (
                            <div className="flex items-center space-x-1">
                              <span>
                                {(coverLetter.metadata.fileSize / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <span>
                              Uploaded: {new Date(coverLetter.lastUpdated).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleView(coverLetter.id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDownload(coverLetter.id)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        {!coverLetter.isDefault && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleSetDefault(coverLetter.id)}
                          >
                            <Star className="w-4 h-4 mr-1" />
                            Set Default
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(coverLetter.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </JobseekerAuthGuard>
  )
}
