"use client"

import { useState, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, MapPin, Briefcase, Clock, DollarSign, Star, Building2, Users, Filter, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import GulfNavbar from "@/components/gulf-navbar"
import ErrorBoundary from "@/components/ErrorBoundary"
import Link from "next/link"
import { apiService, Job, Company } from '@/lib/api'
import { sampleJobManager } from '@/lib/sampleJobManager'
import { toast } from "sonner"

function GulfDepartmentJobsPage() {
  const params = useParams()
  const router = useRouter()
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const companyId = params.id as string
  const departmentName = decodeURIComponent(params.department as string)

  const [company, setCompany] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError("")
      try {
        // Try to get company data
        try {
          const companyResp = await apiService.getCompany(companyId)
          if (companyResp.success) setCompany(companyResp.data)
        } catch (e) {
          console.log('Company endpoint failed, trying fallback:', e)
        }
        
        // Try to get jobs data
        try {
          const jobsResp = await apiService.getCompanyJobs(companyId)
          const list = Array.isArray((jobsResp as any).data) ? (jobsResp as any).data : (Array.isArray((jobsResp as any).data?.rows) ? (jobsResp as any).data.rows : [])
          setJobs(list)
        } catch (e) {
          console.log('Company jobs endpoint failed, trying alternative:', e)
          // Try alternative endpoint
          try {
            const altResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/gulf/jobs?companyId=${companyId}`)
            if (altResponse.ok) {
              const altData = await altResponse.json()
              if (altData.success) {
                const jobs = Array.isArray(altData.data) ? altData.data : (Array.isArray(altData.data?.rows) ? altData.data.rows : [])
                setJobs(jobs)
              }
            }
          } catch (altError) {
            console.log('Alternative jobs endpoint also failed:', altError)
            setError('Failed to load department jobs')
          }
        }
      } catch (e: any) {
        setError('Failed to load department jobs')
      } finally {
        setLoading(false)
      }
    }
    if (companyId) load()
  }, [companyId])

  const getSectorColor = (sector: string) => {
    const colors = {
      technology: "from-green-500 to-emerald-500",
      finance: "from-emerald-500 to-teal-500",
      automotive: "from-teal-500 to-cyan-500",
      healthcare: "from-green-600 to-emerald-600",
      energy: "from-emerald-600 to-teal-600",
    }
    return colors[sector as keyof typeof colors] || "from-green-500 to-emerald-500"
  }

  const handleApply = async (jobId: number) => {
    if (!isAuthenticated) {
      setShowAuthDialog(true)
      return
    }

    try {
      console.log(`Applying for job ${jobId}...`)
      
      const response = await apiService.applyJob(jobId.toString(), {
        coverLetter: '',
        expectedSalary: undefined,
        noticePeriod: undefined,
        isWillingToRelocate: false
      })
      
      if (response.success) {
        toast.success('Application submitted successfully!')
        console.log('Application submitted:', response.data)
      } else {
        toast.error(response.message || 'Failed to submit application')
      }
    } catch (error) {
      console.error('Error applying for job:', error)
      toast.error('Failed to submit application. Please try again.')
    }
  }

  const handleBackNavigation = () => {
    router.push(`/gulf-companies/${companyId}`)
  }

  const companySector = (company?.industry || '').toLowerCase().includes('tech') ? 'technology'
    : (company?.industry || '').toLowerCase().includes('fin') ? 'finance'
    : (company?.industry || '').toLowerCase().includes('health') ? 'healthcare'
    : (company?.industry || '').toLowerCase().includes('auto') ? 'automotive'
    : (company?.industry || '').toLowerCase().includes('energy') ? 'energy'
    : 'technology'

  const departmentJobs = useMemo(() => {
    return jobs
      .filter((j) => {
        // Filter by department
        const matchesDepartment = (j.department || j.category || '').toString() === departmentName
        
        // Exclude ALL consultancy/agency jobs - only show direct company jobs
        // Check multiple indicators for consultancy/agency jobs
        const metadata = j.metadata || {}
        const isConsultancyJob = metadata.postingType === 'consultancy' || 
                                 j.isConsultancy || 
                                 metadata.consultancyName ||
                                 j.isAgencyPosted ||
                                 j.PostedByAgency ||
                                 j.hiringCompanyId ||
                                 j.postedByAgencyId
        
        const isDirectCompanyJob = !isConsultancyJob
        
        return matchesDepartment && isDirectCompanyJob
      })
      .map((j) => ({
        id: j.id,
        title: j.title,
        department: j.department || j.category || departmentName,
        location: j.location || j.city || j.state || j.country || '—',
        experience: j.experience || j.experienceLevel || '',
        salary: j.salary || (j.salaryMin && j.salaryMax ? `${j.salaryMin}-${j.salaryMax} AED` : ''),
        skills: Array.isArray(j.skills) ? j.skills : [],
        posted: j.createdAt || '',
        applicants: j.applications || 0,
        type: j.type || j.jobType || '—',
        description: j.description || ''
      }))
  }, [jobs, departmentName])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/30 to-teal-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <GulfNavbar />
        <div className="pt-20 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-slate-600 dark:text-slate-300">Loading department jobs...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/30 to-teal-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <GulfNavbar />
        <div className="pt-20 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-16">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Company Not Found</h1>
              <p className="text-slate-600 dark:text-slate-400">We couldn't load the company details. Please go back and try again.</p>
              <div className="mt-6">
                <Button variant="outline" onClick={() => router.push(`/gulf-companies/${companyId}`)}>Back to Company</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary fallback={<div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/30 to-teal-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"><GulfNavbar /><div className="pt-20 pb-12"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="text-center py-16"><h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h1><p className="text-slate-600 dark:text-slate-400">We couldn't load this department. Please go back and try again.</p><div className="mt-6"><Button variant="outline" onClick={() => router.push(`/gulf-companies/${companyId}`)}>Back to Company</Button></div></div></div></div></div>}>
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/30 to-teal-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <GulfNavbar />

      <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Button
              variant="ghost"
              className="text-slate-600 dark:text-slate-400 hover:text-green-600"
              onClick={handleBackNavigation}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {company?.name || 'Company'}
            </Button>
          </motion.div>

          {/* Department Header */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl mb-8">
              <CardContent className="p-8">
                <div className="flex items-center space-x-6">
                  <Avatar className="w-20 h-20 ring-2 ring-white/50">
                    <AvatarImage src={company.logo || "/placeholder.svg"} alt={company.name} />
                    <AvatarFallback className="text-2xl font-bold text-green-600">{(company.name||'')[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {departmentName} Jobs at {company?.name || ''}
                    </h1>
                    <div className="flex items-center space-x-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        <span className="font-semibold">{company?.rating || 0}</span>
                        <span className="text-sm ml-1">({company?.reviews || 0} reviews)</span>
                      </div>
                      <Badge className="bg-green-50 text-green-700 border-green-200">
                        {departmentJobs.length} openings
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Filters and Sort */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {departmentJobs.length} jobs in {departmentName}
              </h2>
              <p className="text-slate-600 dark:text-slate-300">Explore opportunities in this department</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Select defaultValue="recent">
                <SelectTrigger className="w-48 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="salary">Highest Salary</SelectItem>
                  <SelectItem value="experience">Experience Level</SelectItem>
                  <SelectItem value="applicants">Least Applicants</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Jobs List */}
          <div className="space-y-6">
                  {departmentJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Link href={`/gulf-jobs/${job.id}`}>
                  <Card className="border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 group cursor-pointer overflow-hidden">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${getSectorColor(company.sector)} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                    />

                    <CardContent className="p-8 relative">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-6">
                            <div>
                              <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-green-600 transition-colors mb-2">
                                {job.title}
                              </h3>
                              <div className="text-lg text-slate-600 dark:text-slate-400 font-medium mb-4">
                                {company.name}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="flex items-center text-slate-600 dark:text-slate-300">
                                  <Building2 className="w-5 h-5 mr-2 text-slate-400" />
                                  <div>
                                    <div className="font-medium">{job.department}</div>
                                    <div className="text-sm text-slate-500">Department</div>
                                  </div>
                                </div>
                                <div className="flex items-center text-slate-600 dark:text-slate-300">
                                  <MapPin className="w-5 h-5 mr-2 text-slate-400" />
                                  <div>
                                    <div className="font-medium">{job.location}</div>
                                    <div className="text-sm text-slate-500">Location</div>
                                  </div>
                                </div>
                                <div className="flex items-center text-slate-600 dark:text-slate-300">
                                  <Briefcase className="w-5 h-5 mr-2 text-slate-400" />
                                  <div>
                                    <div className="font-medium">
                                      {(() => {
                                        const exp = job.experience || 'Not specified';
                                        if (exp === 'fresher' || exp === 'entry') return 'Fresher (0-1 years)';
                                        if (exp === 'junior') return 'Junior (1-3 years)';
                                        if (exp === 'mid') return 'Mid-level (3-5 years)';
                                        if (exp === 'senior') return 'Senior (5+ years)';
                                        if (exp === 'lead') return 'Lead (7+ years)';
                                        if (exp === 'executive') return 'Executive (10+ years)';
                                        return exp;
                                      })()}
                                    </div>
                                    <div className="text-sm text-slate-500">Experience Level</div>
                                  </div>
                                </div>
                                <div className="flex items-center text-slate-600 dark:text-slate-300">
                                  <DollarSign className="w-5 h-5 mr-2 text-slate-400" />
                                  <div>
                                    <div className="font-medium">
                                      {job.salary ? (job.salary.includes('AED') ? job.salary : `${job.salary} AED`) : 'Salary not specified'}
                                    </div>
                                    <div className="text-sm text-slate-500">Salary</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col space-y-2">
                              <Button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleApply(job.id)
                                }}
                                className={`h-10 px-6 ${
                                  sampleJobManager.hasApplied(job.id.toString())
                                    ? 'bg-green-600 hover:bg-green-700 cursor-default'
                                    : `bg-gradient-to-r ${getSectorColor(companySector)} hover:shadow-lg transition-all duration-300`
                                }`}
                                disabled={sampleJobManager.hasApplied(job.id.toString())}
                              >
                                {sampleJobManager.hasApplied(job.id.toString()) ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Applied
                                  </>
                                ) : (
                                  'Apply Now'
                                )}
                              </Button>
                              {!isAuthenticated && (
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setShowAuthDialog(true)
                                    }}
                                    className="text-xs"
                                  >
                                    Register
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setShowAuthDialog(true)
                                    }}
                                    className="text-xs"
                                  >
                                    Login
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">{job.description}</p>

                          <div className="flex flex-wrap gap-2 mb-6">
                            {job.skills.map((skill: string, skillIndex: number) => (
                              <Badge
                                key={skillIndex}
                                variant="secondary"
                                className="bg-green-50 text-green-700 border-green-200"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center space-x-6 text-sm text-slate-500">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {job.posted}
                              </div>
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {job.applicants} applicants
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {job.type}
                              </Badge>
                            </div>
                            <Button variant="outline" size="sm">
                              Save Job
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

        </div>
      </div>

      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You need to be logged in to apply for jobs. Please register or login to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-3 mt-6">
            <Link href="/register">
              <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                Register Now
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="w-full bg-transparent">
                Login
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </ErrorBoundary>
  )
}

export default dynamic(() => Promise.resolve(GulfDepartmentJobsPage), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/30 to-teal-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-300">Loading department jobs...</p>
          </div>
        </div>
      </div>
    </div>
  )
})

