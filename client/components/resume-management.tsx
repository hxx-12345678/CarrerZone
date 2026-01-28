"use client"

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Star, 
  Eye, 
  X,
  Plus,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { apiService, Resume } from '@/lib/api'

interface ResumeManagementProps {
  className?: string
  showUploadButton?: boolean
  maxDisplay?: number
}

export function ResumeManagement({ 
  className = "", 
  showUploadButton = true, 
  maxDisplay = 3 
}: ResumeManagementProps) {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [resumesLoading, setResumesLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    try {
      setResumesLoading(true)
      const response = await apiService.getResumes()
      if (response.success && response.data) {
        setResumes(response.data)
      }
    } catch (error) {
      console.error('Error fetching resumes:', error)
      toast.error('Failed to load resumes')
    } finally {
      setResumesLoading(false)
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
      const response = await apiService.uploadResumeFile(file)
      if (response.success) {
        toast.success('Resume uploaded successfully!')
        fetchResumes()
        setShowUploadModal(false)
        
        // If this is the first resume, show additional info
        if (resumes.length === 0) {
          toast.success('This resume has been set as your default resume.')
        }
      }
    } catch (error) {
      console.error('Error uploading resume:', error)
      toast.error('Failed to upload resume. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteResume = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return

    try {
      const response = await apiService.deleteResume(resumeId)
      if (response.success) {
        toast.success('Resume deleted successfully')
        fetchResumes()
      }
    } catch (error) {
      console.error('Error deleting resume:', error)
      toast.error('Failed to delete resume')
    }
  }

  const handleSetDefault = async (resumeId: string) => {
    try {
      const response = await apiService.setDefaultResume(resumeId)
      if (response.success) {
        toast.success('Default resume updated')
        fetchResumes()
      }
    } catch (error) {
      console.error('Error setting default resume:', error)
      toast.error('Failed to set default resume')
    }
  }

  const handleDownloadResume = async (resumeId: string) => {
    try {
      await apiService.downloadResume(resumeId)
      toast.success('Resume downloaded successfully')
    } catch (error) {
      console.error('Error downloading resume:', error)
      toast.error('Failed to download resume')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
    return '📄'
  }

  return (
    <div className={className}>
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Resume Management</span>
            </div>
            <Badge variant="outline" className="text-sm">
              {resumes.length} resumes
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {resumesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : resumes.length === 0 ? (
              <div className="text-center py-6">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  No resumes uploaded yet
                </p>
                {showUploadButton && (
                  <Button onClick={() => setShowUploadModal(true)} size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload First Resume
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {resumes.slice(0, maxDisplay).map((resume) => (
                    <div key={resume.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {getFileIcon(resume.metadata?.mimeType || '')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-slate-900 dark:text-white truncate">
                              {resume.title}
                            </p>
                            {resume.isDefault && (
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                            <span>Updated {new Date(resume.lastUpdated).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{resume.views} views</span>
                            <span>•</span>
                            <span>{resume.downloads} downloads</span>
                            {resume.metadata?.fileSize && (
                              <>
                                <span>•</span>
                                <span>{formatFileSize(resume.metadata.fileSize)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadResume(resume.id)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Download resume"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {!resume.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(resume.id)}
                            className="text-yellow-600 hover:text-yellow-700"
                            title="Set as default"
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteResume(resume.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete resume"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {showUploadButton && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                    <Button variant="outline" size="sm" onClick={() => setShowUploadModal(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload New Resume
                    </Button>
                    {resumes.length > maxDisplay && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href="/resumes">View All Resumes</a>
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Upload Resume
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="resume-file">Select File</Label>
                <Input
                  id="resume-file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  disabled={uploading}
                />
                <p className="text-sm text-slate-500 mt-1">
                  Supported formats: PDF, DOC, DOCX (max 5MB)
                </p>
              </div>

              {uploading && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-600 dark:text-blue-400">Uploading resume...</span>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                <h4 className="font-medium text-slate-900 dark:text-white mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Upload Tips:
                </h4>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <li>• Use PDF format for best compatibility</li>
                  <li>• Keep file size under 5MB</li>
                  <li>• Ensure your resume is up-to-date</li>
                  <li>• First upload will be set as default</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
