"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft,
  Bookmark,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  Save,
  Star,
  Eye,
  Briefcase,
  FileText
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { toast } from 'sonner'
import { apiService, JobBookmark } from '@/lib/api'
import { getJobById, Job } from '@/lib/mockJobs'
import { sampleJobManager } from '@/lib/sampleJobManager'
import { JobseekerAuthGuard } from '@/components/jobseeker-auth-guard'

export default function BookmarksPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [bookmarks, setBookmarks] = useState<JobBookmark[]>([])
  const [bookmarksLoading, setBookmarksLoading] = useState(true)
  const [editingBookmark, setEditingBookmark] = useState<JobBookmark | null>(null)
  const [formData, setFormData] = useState({
    folder: '',
    notes: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  })
  const [filterFolder, setFilterFolder] = useState('all')
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [filterApplied, setFilterApplied] = useState<'all' | 'applied' | 'not-applied'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'title' | 'company'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

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
      
      // Get backend bookmarks
      let backendBookmarks: any[] = []
      try {
        const response = await apiService.getBookmarks()
        if (response.success && response.data) {
          backendBookmarks = response.data
        }
      } catch (error) {
        console.error('Error fetching backend bookmarks:', error)
      }
      
      // Get sample bookmarks and combine with backend
      const sampleBookmarks = sampleJobManager.getBookmarks()
      const combinedBookmarks = [
        ...sampleBookmarks.map(book => ({
          ...book,
          isSample: true,
          id: `sample-${book.jobId}`,
          job: {
            id: book.jobId,
            title: book.jobTitle,
            company: { name: book.companyName },
            location: book.location,
            salary: book.salary,
            type: book.type
          }
        })),
        ...backendBookmarks
      ]
      setBookmarks(combinedBookmarks)
    } catch (error) {
      console.error('Error fetching bookmarks:', error)
      toast.error('Failed to load bookmarks')
    } finally {
      setBookmarksLoading(false)
    }
  }

  const handleUpdateBookmark = async () => {
    if (!editingBookmark) return

    try {
      // Check if this is a sample bookmark
      if ((editingBookmark as any).isSample) {
        const success = sampleJobManager.updateBookmark(editingBookmark.id, formData)
        if (success) {
          toast.success('Bookmark updated successfully')
          setEditingBookmark(null)
          resetForm()
          fetchBookmarks()
        } else {
          toast.error('Failed to update bookmark')
        }
        return
      }

      // For backend bookmarks
      const response = await apiService.updateBookmark(editingBookmark.id, formData)
      if (response.success) {
        toast.success('Bookmark updated successfully')
        setEditingBookmark(null)
        resetForm()
        fetchBookmarks()
      }
    } catch (error) {
      console.error('Error updating bookmark:', error)
      toast.error('Failed to update bookmark')
    }
  }

  const handleDeleteBookmark = async (bookmarkId: string) => {
    try {
      // Check if this is a sample bookmark
      const bookmark = bookmarks.find(b => b.id === bookmarkId)
      if ((bookmark as any)?.isSample) {
        const success = sampleJobManager.deleteBookmark(bookmarkId)
        if (success) {
          toast.success('Bookmark deleted successfully')
          fetchBookmarks()
        } else {
          toast.error('Failed to delete bookmark')
        }
        return
      }

      // For backend bookmarks
      const response = await apiService.deleteBookmark(bookmarkId)
      if (response.success) {
        toast.success('Bookmark deleted successfully')
        fetchBookmarks()
      }
    } catch (error) {
      console.error('Error deleting bookmark:', error)
      toast.error('Failed to delete bookmark')
    }
  }

  const handleToggleApplied = async (bookmark: JobBookmark) => {
    try {
      const response = await apiService.updateBookmark(bookmark.id, {
        isApplied: !bookmark.isApplied
      })
      if (response.success) {
        toast.success(bookmark.isApplied ? 'Marked as not applied' : 'Marked as applied')
        fetchBookmarks()
      }
    } catch (error) {
      console.error('Error updating bookmark:', error)
      toast.error('Failed to update bookmark')
    }
  }

  const handleEditBookmark = (bookmark: JobBookmark) => {
    setEditingBookmark(bookmark)
    setFormData({
      folder: bookmark.folder || '',
      notes: bookmark.notes || '',
      priority: bookmark.priority
    })
  }

  const resetForm = () => {
    setFormData({
      folder: '',
      notes: '',
      priority: 'medium'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Star className="w-4 h-4 fill-current" />
      case 'medium': return <Star className="w-4 h-4" />
      case 'low': return <Star className="w-4 h-4" />
      default: return <Star className="w-4 h-4" />
    }
  }

  const filteredBookmarks = bookmarks.filter(bookmark => {
    // Use actual job data from bookmark if available, otherwise fallback to mock data
    const jobDetails = bookmark.job || getJobById(bookmark.jobId)
    const matchesSearch = searchTerm === '' || 
      jobDetails?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobDetails?.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookmark.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookmark.folder?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFolder = filterFolder === 'all' || bookmark.folder === filterFolder
    const matchesPriority = filterPriority === 'all' || bookmark.priority === filterPriority
    const matchesApplied = filterApplied === 'all' || 
      (filterApplied === 'applied' && bookmark.isApplied) ||
      (filterApplied === 'not-applied' && !bookmark.isApplied)
    
    return matchesSearch && matchesFolder && matchesPriority && matchesApplied
  })

  // Sort bookmarks
  const sortedBookmarks = [...filteredBookmarks].sort((a, b) => {
    const jobA = a.job || getJobById(a.jobId)
    const jobB = b.job || getJobById(b.jobId)
    
    switch (sortBy) {
      case 'date':
        const dateA = new Date(a.createdAt || 0)
        const dateB = new Date(b.createdAt || 0)
        return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
      
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const priorityA = priorityOrder[a.priority] || 0
        const priorityB = priorityOrder[b.priority] || 0
        return sortOrder === 'asc' ? priorityA - priorityB : priorityB - priorityA
      
      case 'title':
        const titleA = jobA?.title?.toLowerCase() || ''
        const titleB = jobB?.title?.toLowerCase() || ''
        return sortOrder === 'asc' 
          ? titleA.localeCompare(titleB)
          : titleB.localeCompare(titleA)
      
      case 'company':
        const companyA = jobA?.company?.name?.toLowerCase() || ''
        const companyB = jobB?.company?.name?.toLowerCase() || ''
        return sortOrder === 'asc' 
          ? companyA.localeCompare(companyB)
          : companyB.localeCompare(companyA)
      
      default:
        return 0
    }
  })

  const folders = Array.from(new Set(bookmarks.map(b => b.folder).filter(Boolean)))

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
    <JobseekerAuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-auto">
      <Navbar />
      
      {/* Welcome Back Div Style Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Base gradient overlay matching welcome back div */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-200/45 via-blue-200/35 to-indigo-200/45"></div>
        <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-purple-300/10 to-blue-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-blue-300/10 to-indigo-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-indigo-300/10 to-purple-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        {/* Wide translucent gradient strip matching welcome back div */}
        <div className="absolute top-1/4 left-0 right-0 h-24 bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-indigo-400/20"></div>
      </div>
      
      <div className="pt-20 pb-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Saved Jobs
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Manage your bookmarked jobs and organize them with folders and notes
            </p>
          </div>

          {/* Filters and Sorting */}
          <div className="mb-6 space-y-4">
            {/* Search and Filter Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search bookmarks by title, company, notes, or folder..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterFolder} onValueChange={setFilterFolder}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Folders</SelectItem>
                    {folders.map(folder => (
                      <SelectItem key={folder} value={folder || 'default'}>{folder || 'Default'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={(value: 'all' | 'high' | 'medium' | 'low') => setFilterPriority(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterApplied} onValueChange={(value: 'all' | 'applied' | 'not-applied') => setFilterApplied(value)}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="not-applied">Not Applied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Sorting Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">Sort by:</span>
                <Select value={sortBy} onValueChange={(value: 'date' | 'priority' | 'title' | 'company') => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date Added</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="title">Job Title</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-8 h-8 p-0"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {sortedBookmarks.length} bookmark{sortedBookmarks.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>

          {/* Edit Form */}
          {editingBookmark && (
            <Card className="mb-8 bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(90,0,242,0.06)] rounded-3xl">
              <CardHeader>
                <CardTitle>Edit Bookmark</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="folder">Folder</Label>
                    <Input
                      id="folder"
                      value={formData.folder}
                      onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
                      placeholder="e.g., Frontend Jobs, Remote Work"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setFormData({ ...formData, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add your personal notes about this job..."
                    rows={3}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleUpdateBookmark}>
                    <Save className="w-4 h-4 mr-2" />
                    Update Bookmark
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setEditingBookmark(null)
                    resetForm()
                  }}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bookmarks List */}
          {bookmarksLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(90,0,242,0.06)] rounded-3xl">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sortedBookmarks.length === 0 ? (
            <Card className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(90,0,242,0.06)] rounded-3xl">
              <CardContent className="p-12 text-center">
                <Bookmark className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {searchTerm || filterFolder !== 'all' ? 'No matching bookmarks' : 'No bookmarks yet'}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  {searchTerm || filterFolder !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Start bookmarking jobs to save them for later review'
                  }
                </p>
                <Link href="/jobs">
                  <Button>Browse Jobs</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
                         <div className="space-y-4">
               {sortedBookmarks.map((bookmark) => {
                const jobDetails = bookmark.job || getJobById(bookmark.jobId)
                return (
                  <Card key={bookmark.id} className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(90,0,242,0.06)] rounded-3xl hover:shadow-[0_18px_60px_rgba(90,0,242,0.16)] transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                              {jobDetails?.title || 'Job Title'}
                            </h3>
                            <Badge className={getPriorityColor(bookmark.priority)}>
                              <span className="flex items-center space-x-1">
                                {getPriorityIcon(bookmark.priority)}
                                <span className="capitalize">{bookmark.priority}</span>
                              </span>
                            </Badge>
                            {bookmark.folder && (
                              <Badge variant="outline">
                                {bookmark.folder}
                              </Badge>
                            )}
                            {bookmark.isApplied && (
                              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                Applied
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-300 mb-3">
                            <div className="flex items-center space-x-1">
                              <Building2 className="w-4 h-4" />
                              <span>{jobDetails?.company?.name || 'Company Name'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{jobDetails?.location || 'Location'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4" />
                              <span>
                                {(jobDetails as any)?.salaryMin && (jobDetails as any)?.salaryMax 
                                  ? `${(jobDetails as any).salaryMin} - ${(jobDetails as any).salaryMax} ${(jobDetails as any).salaryCurrency || 'INR'}`
                                  : (jobDetails as any)?.salary || 'Salary'
                                }
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Briefcase className="w-4 h-4" />
                              <span>
                                {(jobDetails as any)?.experienceMin && (jobDetails as any)?.experienceMax
                                  ? `${(jobDetails as any).experienceMin}-${(jobDetails as any).experienceMax} years`
                                  : (jobDetails as any)?.experienceLevel || (jobDetails as any)?.experience || 'Experience'
                                }
                              </span>
                            </div>
                          </div>

                          {jobDetails?.description && (
                            <div className="mb-3">
                              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                                {jobDetails.description}
                              </p>
                            </div>
                          )}

                          {jobDetails?.skills && Array.isArray(jobDetails.skills) && jobDetails.skills.length > 0 && (
                            <div className="mb-3">
                              <div className="flex flex-wrap gap-1">
                                {jobDetails.skills.slice(0, 4).map((skill: any, index: number) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {typeof skill === 'string' ? skill : skill?.name || skill}
                                  </Badge>
                                ))}
                                {jobDetails.skills.length > 4 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{jobDetails.skills.length - 4} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {bookmark.notes && (
                            <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                <strong>Notes:</strong> {bookmark.notes}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Posted: {(jobDetails as any)?.createdAt 
                                  ? new Date((jobDetails as any).createdAt).toLocaleDateString()
                                  : (jobDetails as any)?.posted || 'Recently'
                                }
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye className="w-4 h-4" />
                              <span>{(jobDetails as any)?.applications || (jobDetails as any)?.applicants || 0} applicants</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          <Link href={`/jobs/${bookmark.jobId}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View Job
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" onClick={() => handleEditBookmark(bookmark)}>
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteBookmark(bookmark.id)}>
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
      </div>
    </JobseekerAuthGuard>
  )
}

