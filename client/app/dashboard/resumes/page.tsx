"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    ArrowLeft,
    Upload,
    FileText,
    Trash2,
    Star,
    Eye,
    Download,
    AlertCircle,
    RefreshCw,
    X
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { toast } from 'sonner'
import { apiService, Resume } from '@/lib/api'
import { JobseekerAuthGuard } from '@/components/jobseeker-auth-guard'

export default function DashboardResumesPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [resumes, setResumes] = useState<Resume[]>([])
    const [resumesLoading, setResumesLoading] = useState(true)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        if (!loading && !user) {
            toast.error('Please sign in to manage your resumes')
            router.push('/login')
        }
    }, [user, loading, router])

    useEffect(() => {
        if (user && !loading) {
            fetchResumes()
        }
    }, [user, loading])

    const fetchResumes = async (showToast = false) => {
        try {
            setResumesLoading(true)
            console.log('🔄 Fetching resumes...')
            const response = await apiService.getResumes()

            if (response.success && response.data) {
                setResumes(response.data)
                if (showToast) {
                    toast.success('Resume list refreshed')
                }
            } else {
                setResumes([])
            }
        } catch (error) {
            console.error('Error fetching resumes:', error)
            toast.error('Failed to load resumes')
            setResumes([])
        } finally {
            setResumesLoading(false)
        }
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

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
            } else {
                toast.error(response.message || 'Failed to upload resume')
            }
        } catch (error: any) {
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
            } else {
                toast.error(response.message || 'Failed to delete resume')
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
        } catch (error: any) {
            console.error('Error downloading resume:', error)
            toast.error('Failed to download resume')
        }
    }

    const handleViewResume = async (resumeId: string) => {
        try {
            await apiService.viewResume(resumeId)
        } catch (error: any) {
            console.error('Error viewing resume:', error)
            toast.error(error.message || 'Failed to view resume')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!user) return null

    return (
        <JobseekerAuthGuard>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
                <Navbar />
                <div className="pt-24 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <Link href="/dashboard" className="flex items-center text-sm text-slate-500 hover:text-blue-600 mb-2 transition-colors">
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back to Dashboard
                            </Link>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manage Resumes</h1>
                            <p className="text-slate-600 dark:text-slate-400">View and manage your professional resumes</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => fetchResumes(true)} disabled={resumesLoading}>
                                <RefreshCw className={`w-4 h-4 mr-2 ${resumesLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            <Button size="sm" onClick={() => fileInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-700">
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Resume
                            </Button>
                            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" />
                        </div>
                    </div>

                    {resumesLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2].map((i) => (
                                <div key={i} className="h-48 bg-white dark:bg-slate-800 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : resumes.length === 0 ? (
                        <Card className="bg-white dark:bg-slate-800 border-none shadow-sm">
                            <CardContent className="p-12 text-center">
                                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Resumes Found</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">Upload your resume to start applying for jobs</p>
                                <Button onClick={() => fileInputRef.current?.click()} className="bg-blue-600">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload First Resume
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {resumes.map((resume) => (
                                <Card key={resume.id} className={`bg-white dark:bg-slate-800 border-none shadow-sm hover:shadow-md transition-all ${resume.isDefault ? 'ring-2 ring-blue-500/20' : ''}`}>
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                                                        {resume.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {resume.isDefault && (
                                                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-[10px] h-4">Default</Badge>
                                                        )}
                                                        <span className="text-[11px] text-slate-500">
                                                            Updated {new Date(resume.lastUpdated).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleViewResume(resume.id)} title="View">
                                                    <Eye className="w-4 h-4 text-slate-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDownloadResume(resume.id)} title="Download">
                                                    <Download className="w-4 h-4 text-slate-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteResume(resume.id)} title="Delete" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                                            <div className="flex items-center gap-2">
                                                {resume.metadata?.fileSize && (
                                                    <span className="text-xs text-slate-500">{(resume.metadata.fileSize / 1024).toFixed(0)} KB</span>
                                                )}
                                            </div>
                                            {!resume.isDefault && (
                                                <Button variant="ghost" size="sm" onClick={() => handleSetDefault(resume.id)} className="text-xs text-blue-600 hover:text-blue-700">
                                                    <Star className="w-3 h-3 mr-1" />
                                                    Set as Default
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </JobseekerAuthGuard>
    )
}
