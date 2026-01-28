"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bookmark, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { apiService, JobBookmark } from '@/lib/api'
import { GulfJobseekerAuthGuard } from '@/components/gulf-jobseeker-auth-guard'

export default function GulfBookmarksPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [bookmarks, setBookmarks] = useState<JobBookmark[]>([])
  const [bookmarksLoading, setBookmarksLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please sign in to view your bookmarks')
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && !loading) {
      fetchBookmarks()
    }
  }, [user, loading])

  const fetchBookmarks = async () => {
    try {
      setBookmarksLoading(true)
      const response = await apiService.getGulfJobBookmarks()
      if (response.success && response.data) {
        setBookmarks(response.data.bookmarks || response.data)
      } else {
        setBookmarks([])
      }
    } catch (error) {
      console.error('Error fetching Gulf bookmarks:', error)
      setBookmarks([])
    } finally {
      setBookmarksLoading(false)
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
            <CardTitle className="text-green-700">Gulf Bookmarks</CardTitle>
          </div>
          <Badge variant="secondary">{bookmarks.length}</Badge>
        </div>

        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-400">
              <Bookmark className="w-5 h-5" />
              <span>Saved Jobs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookmarksLoading ? (
              <div className="text-sm text-slate-600">Loading...</div>
            ) : bookmarks.length === 0 ? (
              <div className="text-sm text-slate-600">No saved jobs yet</div>
            ) : (
              <div className="space-y-3">
                {bookmarks.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded border border-green-200">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{(b as any).job?.title || (b as any).jobTitle || 'Saved Job'}</div>
                      <div className="text-xs text-slate-600 truncate">{(b as any).job?.company?.name || (b as any).companyName || ''}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {b.priority && (
                        <Badge variant="secondary" className="text-xs capitalize">{b.priority}</Badge>
                      )}
                      {b.folder && (
                        <Badge variant="outline" className="text-xs">{b.folder}</Badge>
                      )}
                      { (b as any).job?.id ? (
                        <Link href={`/gulf-jobs`}>
                          <Button size="sm" variant="outline" className="border-green-600 text-green-600">View Job</Button>
                        </Link>
                      ) : (
                        <Link href="/gulf-jobs">
                          <Button size="sm" variant="outline" className="border-green-600 text-green-600">Browse Jobs</Button>
                        </Link>
                      )}
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


