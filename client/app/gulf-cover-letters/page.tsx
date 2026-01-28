"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Eye, Download, ArrowLeft, Trash2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { apiService, CoverLetter } from '@/lib/api'
import { GulfJobseekerAuthGuard } from '@/components/gulf-jobseeker-auth-guard'

export default function GulfCoverLettersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [loadingCL, setLoadingCL] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set())
  const [viewingIds, setViewingIds] = useState<Set<string>>(new Set())

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
      setLoadingCL(true)
      const response = await apiService.getCoverLetters()
      if (response.success && response.data) {
        setCoverLetters(response.data)
      }
    } catch (error) {
      console.error('Error fetching cover letters:', error)
      toast.error('Failed to load cover letters')
    } finally {
      setLoadingCL(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const response = await apiService.uploadCoverLetterFile(file)
      if (response.success) {
        toast.success('Cover letter uploaded successfully!')
        fetchCoverLetters()
      }
    } catch (error) {
      console.error('Error uploading cover letter:', error)
      toast.error('Failed to upload cover letter')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleView = async (id: string) => {
    try {
      if (viewingIds.has(id)) return
      setViewingIds(prev => new Set([...prev, id]))
      const response = await apiService.fetchCoverLetterFile(id)
      const blob = await response.blob()
      const mime = response.headers.get('content-type') || 'application/pdf'
      const url = window.URL.createObjectURL(new Blob([blob], { type: mime }))
      window.open(url, '_blank')
      setTimeout(() => window.URL.revokeObjectURL(url), 60000)
    } catch (error) {
      console.error('Error viewing cover letter:', error)
      const message = (error as Error)?.message?.includes('FILE_NOT_FOUND')
        ? 'Cover letter file missing on server. Please re-upload.'
        : 'Failed to view cover letter'
      toast.error(message)
    } finally {
      setViewingIds(prev => { const n = new Set(prev); n.delete(id); return n })
    }
  }

  const handleDownload = async (id: string) => {
    try {
      if (downloadingIds.has(id)) return
      setDownloadingIds(prev => new Set([...prev, id]))
      const response = await apiService.downloadCoverLetter(id)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'cover-letter.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading cover letter:', error)
      const message = (error as Error)?.message?.includes('FILE_NOT_FOUND')
        ? 'Cover letter file missing on server. Please re-upload.'
        : 'Failed to download cover letter'
      toast.error(message)
    } finally {
      setDownloadingIds(prev => { const n = new Set(prev); n.delete(id); return n })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      if (!confirm('Delete this cover letter? This action cannot be undone.')) return
      if (deletingIds.has(id)) return
      setDeletingIds(prev => new Set([...prev, id]))
      const res = await apiService.deleteCoverLetter(id)
      if (res.success) {
        toast.success('Cover letter deleted')
        fetchCoverLetters()
      } else {
        toast.error(res.message || 'Failed to delete cover letter')
      }
    } catch (error) {
      console.error('Error deleting cover letter:', error)
      toast.error('Failed to delete cover letter')
    } finally {
      setDeletingIds(prev => { const n = new Set(prev); n.delete(id); return n })
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const resp = await apiService.setDefaultCoverLetter(id)
      if (resp.success) {
        toast.success('Default cover letter updated')
        fetchCoverLetters()
      } else {
        toast.error(resp.message || 'Failed to set default cover letter')
      }
    } catch (error) {
      console.error('Error setting default cover letter:', error)
      toast.error('Failed to set default cover letter')
    }
  }

  return (
    <GulfJobseekerAuthGuard>
      <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/jobseeker-gulf-dashboard">
              <Button variant="outline" size="sm" className="border-green-600 text-green-600">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </Link>
            <CardTitle className="text-green-700">Gulf Cover Letters</CardTitle>
          </div>
          <div>
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} />
            <Button onClick={() => fileInputRef.current?.click()} className="bg-green-600 hover:bg-green-700" disabled={uploading}>
              <Upload className="w-4 h-4 mr-2" /> {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>

        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-400">
              <FileText className="w-5 h-5" />
              <span>My Cover Letters</span>
              <Badge variant="secondary" className="ml-2">{coverLetters.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCL ? (
              <div className="text-sm text-slate-600">Loading...</div>
            ) : coverLetters.length === 0 ? (
              <div className="text-sm text-slate-600">No cover letters uploaded yet</div>
            ) : (
              <div className="space-y-3">
                {coverLetters.map(cl => (
                  <div key={(cl as any).id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded border border-green-200">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{(cl as any).title || 'Untitled Cover Letter'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleView((cl as any).id)} disabled={viewingIds.has((cl as any).id)} className="border-green-600 text-green-600">
                        <Eye className="w-4 h-4 mr-1" /> {viewingIds.has((cl as any).id) ? 'Opening...' : 'View'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownload((cl as any).id)} disabled={downloadingIds.has((cl as any).id)} className="border-green-600 text-green-600">
                        <Download className="w-4 h-4 mr-1" /> {downloadingIds.has((cl as any).id) ? 'Downloading...' : 'Download'}
                      </Button>
                      {!((cl as any).isDefault) && (
                        <Button size="sm" variant="outline" onClick={() => handleSetDefault((cl as any).id)} className="border-green-600 text-green-600">
                          <Star className="w-4 h-4 mr-1" /> Set Default
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDelete((cl as any).id)} disabled={deletingIds.has((cl as any).id)} className="border-red-600 text-red-600">
                        <Trash2 className="w-4 h-4 mr-1" /> {deletingIds.has((cl as any).id) ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </GulfJobseekerAuthGuard>
  )
}


