"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft,
  Search,
  Clock,
  Calendar,
  RefreshCw,
  X,
  Save,
  Share2
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { toast } from 'sonner'
import { apiService, SearchHistory } from '@/lib/api'

export default function GulfSearchHistoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [filteredHistory, setFilteredHistory] = useState<SearchHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please sign in to view search history')
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && !loading) {
      fetchSearchHistory()
    }
  }, [user, loading])

  useEffect(() => {
    filterAndSortHistory()
  }, [searchHistory, searchTerm, filterBy, sortBy])

  const filterAndSortHistory = () => {
    let filtered = [...searchHistory]

    if (searchTerm) {
      filtered = filtered.filter(history => 
        getSearchQuery(history.searchQuery).toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(history.filters).toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterBy !== 'all') {
      filtered = filtered.filter(history => {
        if (filterBy === 'location' && history.filters?.location) return true
        if (filterBy === 'category' && history.filters?.category) return true
        if (filterBy === 'salary' && (history.filters?.salaryMin || history.filters?.salaryMax)) return true
        return false
      })
    }

    filtered.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      return 0
    })

    setFilteredHistory(filtered)
  }

  const fetchSearchHistory = async () => {
    try {
      setHistoryLoading(true)
      const response = await apiService.getSearchHistory()
      if (response.success && response.data) {
        setSearchHistory(response.data)
      }
    } catch (error) {
      console.error('Error fetching search history:', error)
      toast.error('Failed to load search history')
    } finally {
      setHistoryLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSearchQuery = (searchData: any) => {
    if (typeof searchData === 'string') {
      return searchData
    }
    if (searchData?.query) {
      return searchData.query
    }
    if (searchData?.keywords) {
      return searchData.keywords.join(', ')
    }
    return 'Search query'
  }

  const getSearchFilters = (filters: any) => {
    if (!filters) return []
    const filterList: string[] = []
    if (filters.location) filterList.push(`📍 ${filters.location}`)
    if (filters.category) filterList.push(`🏢 ${filters.category}`)
    if (filters.experienceLevel) filterList.push(`👤 ${filters.experienceLevel}`)
    if (filters.salaryMin || filters.salaryMax) {
      const salary = `${filters.salaryMin || 0} - ${filters.salaryMax || '∞'}`
      filterList.push(`💰 $${salary}`)
    }
    if (filters.jobType) filterList.push(`📋 ${filters.jobType}`)
    return filterList
  }

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedItems.length === filteredHistory.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredHistory.map(item => item.id))
    }
  }

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) return
    if (confirm(`Are you sure you want to delete ${selectedItems.length} search history items?`)) {
      setSearchHistory(prev => prev.filter(item => !selectedItems.includes(item.id)))
      setSelectedItems([])
      toast.success(`${selectedItems.length} items deleted`)
    }
  }

  const handleClearAll = () => {
    if (searchHistory.length === 0) return
    if (confirm('Are you sure you want to clear all search history?')) {
      setSearchHistory([])
      setSelectedItems([])
      toast.success('All search history cleared')
    }
  }

  const handleSaveSearch = (history: SearchHistory) => {
    toast.success('Search saved to job alerts')
  }

  const handleShareSearch = (history: SearchHistory) => {
    const searchUrl = `/jobs?q=${encodeURIComponent(getSearchQuery(history.searchQuery))}`
    navigator.clipboard.writeText(`${window.location.origin}${searchUrl}`)
    toast.success('Search link copied to clipboard')
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link href={user?.region === 'gulf' ? (user?.userType === 'employer' ? '/gulf-dashboard' : '/jobseeker-gulf-dashboard') : '/dashboard'}>
                <Button variant="ghost" size="sm" className="hover:bg-slate-200 dark:hover:bg-slate-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Search History</h1>
                <p className="text-slate-600 dark:text-slate-300">View and manage your recent job searches and filters</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-sm">
                  <Clock className="w-3 h-3 mr-1" />
                  {searchHistory.length} searches
                </Badge>
              </div>
            </div>
          </div>

          <Card className="mb-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input placeholder="Search in history..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All searches</SelectItem>
                    <SelectItem value="location">With location</SelectItem>
                    <SelectItem value="category">With category</SelectItem>
                    <SelectItem value="salary">With salary</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most recent</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleClearAll} disabled={searchHistory.length === 0} className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                  <Button variant="outline" size="sm" onClick={fetchSearchHistory} className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedItems.length > 0 && (
            <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-blue-700 dark:text-blue-300">{selectedItems.length} items selected</span>
                    <Button variant="outline" size="sm" onClick={handleSelectAll} className="text-blue-600 hover:text-blue-700">
                      {selectedItems.length === filteredHistory.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                    Delete Selected
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {historyLoading ? (
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
          ) : searchHistory.length === 0 ? (
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
              <CardContent className="p-12 text-center">
                <Search className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No search history yet</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">Your job searches will appear here for easy reference</p>
                <Link href="/jobs">
                  <Button>Start Searching</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredHistory.length === 0 ? (
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                  <CardContent className="p-12 text-center">
                    <Search className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{searchTerm || filterBy !== 'all' ? 'No matching searches' : 'No search history yet'}</h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">{searchTerm || filterBy !== 'all' ? 'Try adjusting your search or filter criteria' : 'Your job searches will appear here for easy reference'}</p>
                    {(searchTerm || filterBy !== 'all') && (
                      <Button variant="outline" onClick={() => { setSearchTerm(''); setFilterBy('all') }} className="mr-2">
                        <X className="w-4 h-4 mr-1" />
                        Clear Filters
                      </Button>
                    )}
                    <Link href="/jobs">
                      <Button>Start Searching</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                filteredHistory.map((history) => (
                  <Card key={history.id} className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl transition-all duration-200 hover:shadow-lg ${selectedItems.includes(history.id) ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start space-x-3 mb-3">
                            <input type="checkbox" checked={selectedItems.includes(history.id)} onChange={() => handleSelectItem(history.id)} className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{getSearchQuery(history.searchQuery)}</h3>
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatDate(history.createdAt)}
                                </Badge>
                              </div>
                              {history.filters && Object.keys(history.filters).length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {getSearchFilters(history.filters).map((filter, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">{filter}</Badge>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                                <div className="flex items-center space-x-1">
                                  <Search className="w-4 h-4" />
                                  <span>Search performed</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{new Date(history.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 ml-4">
                          <Link href={`/jobs?q=${encodeURIComponent(getSearchQuery(history.searchQuery))}`}>
                            <Button variant="outline" size="sm" className="w-full">
                              <Search className="w-4 h-4 mr-1" />
                              Search Again
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" onClick={() => handleSaveSearch(history)} className="w-full">
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleShareSearch(history)} className="w-full">
                            <Share2 className="w-4 h-4 mr-1" />
                            Share
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


