"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Filter, ChevronDown, Search, MapPin, Briefcase, GraduationCap, Star, Clock, Users, ArrowLeft, Loader2, ArrowUp, Brain, Phone, Mail, CheckCircle2, Save, Eye, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { GulfEmployerNavbar } from "@/components/gulf-employer-navbar"
import { EmployerFooter } from "@/components/employer-footer"
import { apiService, constructAvatarUrl } from "@/lib/api"
import { toast } from "sonner"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"
import { GulfEmployerAuthGuard } from "@/components/gulf-employer-auth-guard"

interface Candidate {
  id: string;
  name: string;
  headline?: string;
  designation: string;
  experience: string;
  location: string;
  education: string;
  keySkills: string[];
  preferredLocations: string[];
  avatar: string;
  isAttached: boolean;
  lastModified: string;
  activeStatus: string;
  lastActive?: string | null;
  additionalInfo: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  phone?: string | null;
  email?: string | null;
  currentSalary: string;
  expectedSalary: string;
  noticePeriod: string;
  profileCompletion: number;
  likeCount?: number;
  likedByCurrent?: boolean;
  atsScore?: number | null;
  atsCalculatedAt?: string | null;
  relevanceScore?: number;
  matchReasons?: string[];
  currentCompany?: string | null;
  previousCompany?: string | null;
  currentDesignation?: string | null;
  isViewed?: boolean;
  isSaved?: boolean;
  workExperiences?: any[];
  educationDetails?: any[];
}

interface Requirement {
  id: string;
  title: string;
  totalCandidates: number;
  accessedCandidates: number;
}

export default function CandidatesPage() {
  const params = useParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("relevance")
  const [showCount, setShowCount] = useState("50")
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [calculatingATS, setCalculatingATS] = useState(false)
  
  // Data states
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [requirement, setRequirement] = useState<Requirement | null>(null)
  const [revealedPhones, setRevealedPhones] = useState<Set<string>>(new Set())
  const [revealedEmails, setRevealedEmails] = useState<Set<string>>(new Set())
  const [savingCandidate, setSavingCandidate] = useState<string | null>(null)
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })
  
  // Filter states
  const [filters, setFilters] = useState<{
    experience: number[],
    salary: number[],
    locationInclude: string,
    locationExclude: string,
    skillsInclude: string,
    skillsExclude: string,
    keyword: string,
    education: string[],
    availability: string[],
    verification: string[],
    lastActive: string[],
    saved: boolean,
    accessed: boolean,
  }>({
    experience: [0, 20],
    salary: [0, 50],
    locationInclude: '',
    locationExclude: '',
    skillsInclude: '',
    skillsExclude: '',
    keyword: '',
    education: [],
    availability: [],
    verification: [],
    lastActive: [],
    saved: false,
    accessed: false,
  })

  // Filter options
  const filterOptions = {
    locations: ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Pune", "Ahmedabad", "Kolkata", "Vadodara"],
    skills: ["JavaScript", "React", "Node.js", "Python", "Java", "AWS", "Docker", "Kubernetes", "MongoDB", "PostgreSQL", "CSS", "HTML", "UI/UX", "C++"],
    education: ["B.Tech", "M.Tech", "B.E", "M.E", "BCA", "MCA", "B.Sc", "M.Sc", "MBA", "Ph.D", "Diploma"],
    availability: ["Immediately", "15 days", "1 month", "2 months", "3 months"],
    verification: ["Phone Verified", "Email Verified", "Profile Complete"],
    lastActive: ["Today", "This week", "This month", "Last 3 months", "Last 6 months"],
  }

  // Fetch candidates data
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('🔍 Fetching candidates for requirement:', params.id)
        console.log('🔍 Previous candidates count:', candidates.length)
        
        const response = await apiService.getRequirementCandidates(params.id as string, {
          page: pagination.page,
          limit: parseInt(showCount),
          search: searchQuery || undefined,
          sortBy: sortBy
        })
        
        console.log('🔍 Candidates API response:', response)
        
        if (response.success && response.data) {
          const newCandidates = response.data.candidates || []
          console.log('📊 New candidates data with ATS scores:', newCandidates.map((c: Candidate) => ({ 
            name: c.name, 
            atsScore: c.atsScore,
            requirementId: params.id 
          })))
          
          // Verify no old ATS scores are persisting
          const candidatesWithOldScores = newCandidates.filter((c: Candidate) => 
            c.atsScore !== null && c.atsCalculatedAt && 
            new Date(c.atsCalculatedAt).getTime() < Date.now() - 60000 // More than 1 minute old
          )
          
          if (candidatesWithOldScores.length > 0) {
            console.log('⚠️ Found candidates with potentially old ATS scores:', candidatesWithOldScores.length)
          }
          
          setCandidates(newCandidates)
          setRequirement(response.data.requirement)
          setPagination(response.data.pagination || pagination)
          console.log('✅ Successfully fetched candidates:', newCandidates.length)
        } else {
          console.error('❌ Failed to fetch candidates:', response.message)
          setError(response.message || 'Failed to load candidates')
        }
      } catch (error: any) {
        console.error('❌ Error fetching candidates:', error)
        setError(error.message || 'Failed to load candidates. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      console.log('🔄 Requirement changed, clearing candidates and fetching new data')
      // Clear any existing ATS scores when requirement changes
      setCandidates([])
      setRequirement(null)
      fetchCandidates()
    }
  }, [params.id, pagination.page, showCount, searchQuery, sortBy])

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (params.id) {
        setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page on search
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, params.id])

  const handleFilterChange = (filterType: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      experience: [0, 20],
      salary: [0, 50],
      locationInclude: '',
      locationExclude: '',
      skillsInclude: '',
      skillsExclude: '',
      keyword: '',
      education: [],
      availability: [],
      verification: [],
      lastActive: [],
      saved: false,
      accessed: false,
    })
  }
  
  // Apply filters to candidates using useMemo for proper re-rendering
  const filteredCandidates = useMemo(() => {
    console.log('🔍 Applying filters:', filters, 'to', candidates.length, 'candidates');
    let result = [...candidates];
    
    // Filter by saved status
    if (filters.saved) {
      result = result.filter(c => c.isSaved);
      console.log('✅ After saved filter:', result.length);
    }
    
    // Filter by accessed/viewed status
    if (filters.accessed) {
      result = result.filter(c => c.isViewed);
      console.log('✅ After accessed filter:', result.length);
    }
    
    // Filter by keyword (name, designation, etc.)
    if (filters.keyword.trim()) {
      const keywordLower = filters.keyword.toLowerCase().trim();
      result = result.filter(c => {
        const nameMatch = c.name.toLowerCase().includes(keywordLower);
        const designationMatch = (c.designation || '').toLowerCase().includes(keywordLower);
        const headlineMatch = ((c as any).headline || '').toLowerCase().includes(keywordLower);
        const summaryMatch = (c.additionalInfo || '').toLowerCase().includes(keywordLower);
        return nameMatch || designationMatch || headlineMatch || summaryMatch;
      });
      console.log('✅ After keyword filter:', result.length);
    }
    
    // Filter by location - Include
    if (filters.locationInclude.trim()) {
      const locationLower = filters.locationInclude.toLowerCase().trim();
      result = result.filter(c => {
        const currentLocationMatch = (c.location || '').toLowerCase().includes(locationLower);
        const preferredLocationMatch = (c.preferredLocations || []).some((loc: string) => 
          loc.toLowerCase().includes(locationLower)
        );
        return currentLocationMatch || preferredLocationMatch;
      });
      console.log('✅ After location include filter:', result.length);
    }
    
    // Filter by location - Exclude
    if (filters.locationExclude.trim()) {
      const locationLower = filters.locationExclude.toLowerCase().trim();
      result = result.filter(c => {
        const currentLocationMatch = (c.location || '').toLowerCase().includes(locationLower);
        const preferredLocationMatch = (c.preferredLocations || []).some((loc: string) => 
          loc.toLowerCase().includes(locationLower)
        );
        return !currentLocationMatch && !preferredLocationMatch;
      });
      console.log('✅ After location exclude filter:', result.length);
    }
    
    // Filter by skills - Include
    if (filters.skillsInclude.trim()) {
      const skillsLower = filters.skillsInclude.toLowerCase().trim();
      const includeSkills = skillsLower.split(',').map(s => s.trim()).filter(s => s.length > 0);
      result = result.filter(c => {
        const candidateSkills = (c.keySkills || []).map((s: string) => s.toLowerCase());
        return includeSkills.some(skill => 
          candidateSkills.some((cs: string) => cs.includes(skill))
        );
      });
      console.log('✅ After skills include filter:', result.length);
    }
    
    // Filter by skills - Exclude
    if (filters.skillsExclude.trim()) {
      const skillsLower = filters.skillsExclude.toLowerCase().trim();
      const excludeSkills = skillsLower.split(',').map(s => s.trim()).filter(s => s.length > 0);
      result = result.filter(c => {
        const candidateSkills = (c.keySkills || []).map((s: string) => s.toLowerCase());
        return !excludeSkills.some(skill => 
          candidateSkills.some((cs: string) => cs.includes(skill))
        );
      });
      console.log('✅ After skills exclude filter:', result.length);
    }
    
    // Filter by experience range
    if (filters.experience && filters.experience.length === 2 && (filters.experience[0] > 0 || filters.experience[1] < 20)) {
      const [minExp, maxExp] = filters.experience;
      result = result.filter(c => {
        let expYears = 0;
        
        // Method 1: Check workExperiences to calculate total experience (most accurate)
        if (c.workExperiences && Array.isArray(c.workExperiences) && c.workExperiences.length > 0) {
          let totalMonths = 0;
          c.workExperiences.forEach((exp: any) => {
            const startDate = exp.startDate || exp.start_date;
            const endDate = exp.endDate || exp.end_date;
            const isCurrent = exp.isCurrent || exp.is_current || false;
            
            if (startDate) {
              try {
                const start = new Date(startDate);
                const end = isCurrent ? new Date() : (endDate ? new Date(endDate) : new Date());
                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                  totalMonths += Math.max(0, months);
                }
              } catch (e) {
                // Ignore invalid dates
              }
            }
          });
          expYears = totalMonths / 12;
          if (expYears > 0) {
            return expYears >= minExp && expYears <= maxExp;
          }
        }
        
        // Method 2: Extract years from experience string (e.g., "3 years" or "3.5 years" -> 3.5)
        const expMatch = (c.experience || '').match(/(\d+(?:\.\d+)?)/);
        if (expMatch) {
          expYears = parseFloat(expMatch[1]);
          return expYears >= minExp && expYears <= maxExp;
        }
        
        // Method 3: Check if candidate has experience_years field (from backend)
        if ((c as any).experienceYears !== undefined) {
          expYears = Number((c as any).experienceYears) || 0;
          return expYears >= minExp && expYears <= maxExp;
        }
        
        // If no experience data and min > 0, exclude (freshers)
        if (minExp > 0) return false;
        // If min is 0, include candidates with no experience (freshers)
        return true;
      });
      console.log(`✅ After experience filter (${minExp}-${maxExp} years):`, result.length);
    }
    
    // Filter by salary range
    if (filters.salary && filters.salary.length === 2 && (filters.salary[0] > 0 || filters.salary[1] < 50)) {
      const [minSalary, maxSalary] = filters.salary;
      result = result.filter(c => {
        const parseSalary = (salaryStr: string): number | null => {
          if (!salaryStr || salaryStr === 'Not specified' || salaryStr === 'null') {
            return null;
          }
          
          // Try to extract number from salary string (handles formats like "INR 50000", "50000 LPA", "5 LPA", etc.)
          const salaryMatch = salaryStr.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
          if (salaryMatch) {
            let salary = parseFloat(salaryMatch[1].replace(/,/g, ''));
            
            // Check if string contains "LPA" or "lakh" - already in LPA
            if (salaryStr.toLowerCase().includes('lpa') || salaryStr.toLowerCase().includes('lakh')) {
              return salary;
            }
            
            // If salary is very large (>= 100000), assume it's already in LPA
            if (salary >= 100000) {
              return salary / 100000; // Convert to LPA (e.g., 500000 -> 5 LPA)
            }
            
            // If salary is between 1000-100000, assume it's monthly and convert to LPA
            if (salary >= 1000 && salary < 100000) {
              return (salary * 12) / 100000; // Convert monthly to LPA
            }
            
            // If salary is < 1000, assume it's already in LPA
            return salary;
          }
          
          return null;
        };
        
        // Check currentSalary first
        const currentSalaryValue = parseSalary(c.currentSalary || '');
        if (currentSalaryValue !== null && currentSalaryValue >= minSalary && currentSalaryValue <= maxSalary) {
          return true;
        }
        
        // Also check expectedSalary
        const expectedSalaryValue = parseSalary(c.expectedSalary || '');
        if (expectedSalaryValue !== null && expectedSalaryValue >= minSalary && expectedSalaryValue <= maxSalary) {
          return true;
        }
        
        // If no salary data and filters are not at default, exclude
        return false;
      });
      console.log(`✅ After salary filter (${minSalary}-${maxSalary} LPA):`, result.length);
    }
    
    // Filter by verification
    if (filters.verification.length > 0) {
      result = result.filter(c => {
        const checks = [];
        if (filters.verification.includes('Phone Verified')) {
          checks.push(c.phoneVerified === true);
        }
        if (filters.verification.includes('Email Verified')) {
          checks.push(c.emailVerified === true);
        }
        if (filters.verification.includes('Profile Complete')) {
          // Consider profile complete if profileCompletion >= 80
          const isComplete = (c.profileCompletion || 0) >= 80;
          checks.push(isComplete);
        }
        // If multiple verification filters selected, candidate must match ALL selected
        return checks.length > 0 && checks.every(Boolean);
      });
      console.log('✅ After verification filter:', result.length);
    }
    
    // Filter by education
    if (filters.education.length > 0) {
      result = result.filter(c => {
        const eduText = c.education || '';
        const eduDetails = c.educationDetails || [];
        const eduDegree = eduDetails.length > 0 ? (eduDetails[0].degree || '') : '';
        return filters.education.some(edu => 
          eduText.toLowerCase().includes(edu.toLowerCase()) ||
          eduDegree.toLowerCase().includes(edu.toLowerCase())
        );
      });
    }
    
    console.log('✅ Final filtered candidates:', result.length);
    return result;
  }, [candidates, filters]);

  const handleCalculateATS = async (processAll = false) => {
    try {
      setCalculatingATS(true)
      
      const candidateCount = processAll ? 'all candidates' : candidates.length
      toast.info('Starting STREAMING ATS calculation...', {
        description: `Processing ${candidateCount} one by one for real-time updates.`
      })
      
      // Prepare request body based on processing mode
      const requestBody = processAll 
        ? { 
            processAll: true 
            // Don't send page/limit - backend will process ALL candidates for the requirement
          }
        : { 
            candidateIds: filteredCandidates.map(c => c.id) 
            // Only process candidates visible on current page (after filters)
          }
      
      console.log('🚀 STREAMING ATS calculation request:', { processAll, requestBody })
      
      // Start streaming ATS calculation
      const response = await apiService.calculateATSScores(params.id as string, requestBody)
      
      if (response.success && response.data.streaming) {
        const { candidateIds: targetCandidateIds, totalCandidates } = response.data
        
        console.log('✅ Streaming ATS started:', { targetCandidateIds: targetCandidateIds.length, totalCandidates })
        
        toast.success('ATS streaming started!', {
          description: `Processing ${targetCandidateIds.length} candidates one by one...`
        })
        
        // Process candidates one by one with streaming updates
        let completedCount = 0
        let failedCount = 0
        
        for (let i = 0; i < targetCandidateIds.length; i++) {
          const candidateId = targetCandidateIds[i]
          
          try {
            console.log(`🎯 Processing candidate ${i + 1}/${targetCandidateIds.length}: ${candidateId}`)
            
            // Calculate ATS for individual candidate
            const individualResponse = await apiService.calculateIndividualATS(params.id as string, candidateId)
            
            if (individualResponse.success) {
              const { atsScore, candidate } = individualResponse.data
              completedCount++
              
              console.log(`✅ ATS score calculated for ${candidate.name}: ${atsScore}`)
              
              // Update the specific candidate in the current list
              setCandidates(prevCandidates => {
                const updatedCandidates = prevCandidates.map(c => 
                  c.id === candidateId 
                    ? { ...c, atsScore: atsScore, atsCalculatedAt: new Date().toISOString() }
                    : c
                )
                
                // Sort by ATS score (highest first) after each update
                return updatedCandidates.sort((a, b) => {
                  const scoreA = a.atsScore || 0
                  const scoreB = b.atsScore || 0
                  return scoreB - scoreA
                })
              })
              
              // Show progress toast for each completed candidate
              if (completedCount % 2 === 0 || completedCount === targetCandidateIds.length) {
                toast.success(`Progress: ${completedCount}/${targetCandidateIds.length} completed`, {
                  description: `Latest: ${candidate.name} - ATS Score: ${atsScore}`
                })
              }
              
            } else {
              failedCount++
              console.log(`❌ ATS calculation failed for candidate ${candidateId}: ${individualResponse.message}`)
            }
            
            // Small delay between candidates to avoid overwhelming the server
            if (i < targetCandidateIds.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 800))
            }
            
          } catch (error) {
            failedCount++
            console.error(`❌ Error processing candidate ${candidateId}:`, error)
          }
        }
        
        // Final success message
        toast.success('ATS streaming completed!', {
          description: `Successfully processed ${completedCount} candidates. ${failedCount > 0 ? `${failedCount} failed.` : 'All candidates scored!'}`
        })
        
        // Set sort to ATS by default after completion
        setSortBy('ats')
        
      } else {
        toast.error('Failed to start streaming ATS calculation', {
          description: response.message || 'Unknown error occurred'
        })
      }
    } catch (error: any) {
      console.error('❌ Error calculating ATS scores:', error)
      toast.error('Failed to calculate ATS scores', {
        description: error.message || 'Please try again later'
      })
    } finally {
      setCalculatingATS(false)
    }
  }

  return (
    <EmployerAuthGuard>
      <GulfEmployerAuthGuard>
      <div key={String(params.id)} className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-teal-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-teal-400/20 to-emerald-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/3 w-60 h-60 bg-gradient-to-br from-teal-400/10 to-emerald-400/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>
      
      {/* Blue gradient strip */}
      <div className="absolute top-1/3 left-0 right-0 h-32 bg-gradient-to-r from-emerald-400/10 via-teal-400/5 to-cyan-400/10 blur-3xl"></div>
      
      <GulfEmployerNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-16 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/gulf-dashboard/manage-requirements">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Requirements
              </Button>
          </Link>
        </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                <span className="text-slate-600">Loading candidates...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">
                <h3 className="text-lg font-medium">Error loading candidates</h3>
                <p className="text-sm">{error}</p>
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                Try Again
              </Button>
            </div>
          ) : requirement ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Candidates for {requirement.title}</h1>
                <p className="text-slate-600">Found {requirement.totalCandidates} matching candidates</p>
              </div>
              <div className="text-right">
              </div>
            </div>
            
            {/* Show Applied Filters */}
            {(requirement as any).appliedFilters && (requirement as any).appliedFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-sm text-slate-600 font-medium">Active Filters:</span>
                {(requirement as any).appliedFilters.map((filter: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                    {filter}
                  </Badge>
                ))}
                {(requirement as any).fallbackApplied && (
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                    ⚡ Smart Fallback Applied
                  </Badge>
                )}
              </div>
            )}
          </div>
          ) : null}
        </div>

        {/* Matching Statistics Summary */}
        {!loading && !error && requirement && (
          <Card className="mb-6 rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(16,185,129,0.08)] hover:shadow-[0_18px_60px_rgba(16,185,129,0.16)]">
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{requirement.totalCandidates || 0}</div>
                  <div className="text-xs text-slate-600">Total Found</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {candidates.filter((c: any) => c.relevanceScore >= 80).length}
                  </div>
                  <div className="text-xs text-slate-600">Excellent (80%+)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {candidates.filter((c: any) => c.relevanceScore >= 60 && c.relevanceScore < 80).length}
                  </div>
                  <div className="text-xs text-slate-600">Good (60-79%)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {candidates.filter((c: any) => c.relevanceScore >= 40 && c.relevanceScore < 60).length}
                  </div>
                  <div className="text-xs text-slate-600">Potential (40-59%)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {candidates.filter((c: any) => c.atsScore && c.atsScore > 0).length}
                  </div>
                  <div className="text-xs text-slate-600">ATS Scored</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {candidates.filter((c: any) => c.phoneVerified && c.emailVerified).length}
                  </div>
                  <div className="text-xs text-slate-600">Verified</div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                placeholder="Search candidates by name, skills, designation, or location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
          </div>

            {/* ATS Score Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => handleCalculateATS(false)}
                disabled={calculatingATS || candidates.length === 0}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {calculatingATS ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Calculating ATS...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    <span>{calculatingATS ? 'Streaming...' : 'Stream ATS (Current)'}</span>
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => handleCalculateATS(true)}
                disabled={calculatingATS}
                variant="outline"
                className="flex items-center space-x-2 border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                {calculatingATS ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing All...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    <span>{calculatingATS ? 'Streaming...' : 'Stream ATS (All)'}</span>
                  </>
                )}
              </Button>
          </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>

            {/* Sort and Count */}
            <div className="flex space-x-2">
                        <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="relevance">Relevance</SelectItem>
                            <SelectItem value="ats">ATS Score</SelectItem>
                            <SelectItem value="experience">Experience</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="lastActive">Last Active</SelectItem>
                            <SelectItem value="salary">Salary</SelectItem>
                          </SelectContent>
                        </Select>
              
                        <Select value={showCount} onValueChange={setShowCount}>
                <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <Card className="mt-4 p-6 rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(16,185,129,0.08)] hover:shadow-[0_18px_60px_rgba(16,185,129,0.16)]">
              <div className="mb-6 pb-6 border-b space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="saved-only"
                    checked={filters.saved}
                    onCheckedChange={(checked) => setFilters(prev => ({ ...prev, saved: checked as boolean }))}
                  />
                  <Label htmlFor="saved-only" className="text-sm font-medium cursor-pointer">
                    Show Saved Candidates Only
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="accessed-only"
                    checked={filters.accessed}
                    onCheckedChange={(checked) => setFilters(prev => ({ ...prev, accessed: checked as boolean }))}
                  />
                  <Label htmlFor="accessed-only" className="text-sm font-medium cursor-pointer">
                    Show Accessed/Viewed Candidates Only
                  </Label>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Experience Range */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Experience (Years)</Label>
                  <div className="space-y-2">
                    <Slider
                      value={filters.experience}
                      onValueChange={(value) => handleFilterChange('experience', value)}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{filters.experience[0]} years</span>
                      <span>{filters.experience[1]} years</span>
                    </div>
                  </div>
                </div>

                {/* Salary Range */}
                            <div>
                  <Label className="text-sm font-medium mb-3 block">Salary Range (LPA)</Label>
                  <div className="space-y-2">
                    <Slider
                      value={filters.salary}
                      onValueChange={(value) => handleFilterChange('salary', value)}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{filters.salary[0]} LPA</span>
                      <span>{filters.salary[1]} LPA</span>
                              </div>
                            </div>
                          </div>

                {/* Keyword/Name Filter */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Keyword/Name</Label>
                  <Input
                    type="text"
                    placeholder="Search by name, designation, or keyword..."
                    value={filters.keyword}
                    onChange={(e) => handleFilterChange('keyword', e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">Searches in name, designation, headline, and summary</p>
                </div>

                {/* Location - Include */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Include Location</Label>
                  <Input
                    type="text"
                    placeholder="Enter location to include (e.g., Bangalore, Mumbai)"
                    value={filters.locationInclude}
                    onChange={(e) => handleFilterChange('locationInclude', e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">Shows candidates with this location in current or preferred locations</p>
                </div>

                {/* Location - Exclude */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Exclude Location</Label>
                  <Input
                    type="text"
                    placeholder="Enter location to exclude (e.g., Delhi)"
                    value={filters.locationExclude}
                    onChange={(e) => handleFilterChange('locationExclude', e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">Hides candidates with this location</p>
                </div>

                {/* Skills - Include */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Include Key Skills</Label>
                  <Input
                    type="text"
                    placeholder="Enter skills separated by comma (e.g., React, Node.js, Python)"
                    value={filters.skillsInclude}
                    onChange={(e) => handleFilterChange('skillsInclude', e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">Shows candidates with any of these skills</p>
                </div>

                {/* Skills - Exclude */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Exclude Key Skills</Label>
                  <Input
                    type="text"
                    placeholder="Enter skills separated by comma (e.g., Java, C++)"
                    value={filters.skillsExclude}
                    onChange={(e) => handleFilterChange('skillsExclude', e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">Hides candidates with any of these skills</p>
                </div>

                {/* Education */}
                            <div>
                  <Label className="text-sm font-medium mb-3 block">Education</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {filterOptions.education.map((edu) => (
                      <div key={edu} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edu-${edu}`}
                          checked={filters.education.includes(edu)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleFilterChange('education', [...filters.education, edu])
                            } else {
                              handleFilterChange('education', filters.education.filter(e => e !== edu))
                            }
                          }}
                        />
                        <Label htmlFor={`edu-${edu}`} className="text-sm">{edu}</Label>
                      </div>
                    ))}
                              </div>
                            </div>

                {/* Verification */}
                              <div>
                  <Label className="text-sm font-medium mb-3 block">Verification</Label>
                  <div className="space-y-2">
                    {filterOptions.verification.map((verification) => (
                      <div key={verification} className="flex items-center space-x-2">
                        <Checkbox
                          id={`verification-${verification}`}
                          checked={filters.verification.includes(verification)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleFilterChange('verification', [...filters.verification, verification])
                            } else {
                              handleFilterChange('verification', filters.verification.filter(v => v !== verification))
                            }
                          }}
                        />
                        <Label htmlFor={`verification-${verification}`} className="text-sm">{verification}</Label>
                      </div>
                    ))}
                  </div>
                              </div>
                              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear All Filters
                </Button>
                <div className="text-sm text-slate-600">
                  {candidates.length} candidates found
                              </div>
                              </div>
            </Card>
                            )}
                          </div>

        {/* ATS Streaming Progress */}
        {calculatingATS && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                <div>
                  <h3 className="text-sm font-medium text-purple-900">Streaming ATS Calculation</h3>
                  <p className="text-xs text-purple-700">
                    Processing candidates one by one with real-time UI updates. 
                    Each score appears immediately when calculated...
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-purple-500">Real-time streaming</p>
                <p className="text-xs text-purple-400">Individual processing</p>
                <p className="text-xs text-purple-300">Live UI updates</p>
              </div>
            </div>
          </div>
        )}

        {/* Candidates List */}
        {!loading && !error && (
        <div className="space-y-4">
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((candidate) => (
            <Card key={candidate.id} className={`rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(16,185,129,0.08)] hover:shadow-[0_18px_60px_rgba(16,185,129,0.16)] transition-all duration-300 ${calculatingATS ? 'opacity-75' : ''} ${candidate.isViewed ? 'border-green-300 border-2' : ''}`}>
              <div className="flex items-stretch">
                {/* LEFT PARTITION - Profile Picture, Education & Summary */}
                <div className="border-r border-slate-200 p-6 flex flex-col items-center w-40 flex-shrink-0 bg-gradient-to-b from-slate-50 to-white">
                  <Avatar className="w-28 h-28 mb-4 border-2 border-slate-300 shadow-lg">
                    <AvatarImage 
                      src={constructAvatarUrl(candidate.avatar || null)} 
                      alt={candidate.name}
                      className="object-cover w-full h-full"
                      onLoad={() => console.log('✅ Avatar loaded:', candidate.name)}
                      onError={(e) => {
                        console.log('❌ Avatar failed:', candidate.name);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white w-full h-full flex items-center justify-center">
                      {candidate.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Education */}
                  <div className="text-center w-full mb-3">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Education</p>
                    <p className="text-xs font-medium text-slate-700 line-clamp-2">
                      {(() => {
                        // Debug logging
                        console.log('🔍 Education Debug for', candidate.name, ':', {
                          educationDetails: candidate.educationDetails,
                          educationString: candidate.education,
                          hasEducationDetails: !!candidate.educationDetails,
                          isArray: Array.isArray(candidate.educationDetails),
                          length: candidate.educationDetails?.length
                        });
                        
                        // Check educationDetails first (from database)
                        if (candidate.educationDetails && Array.isArray(candidate.educationDetails) && candidate.educationDetails.length > 0) {
                          const edu = candidate.educationDetails[0];
                          // Format: "Degree - Institution" or "Degree - Field of Study - Institution"
                          const degree = edu.degree || '';
                          const institution = edu.institution || '';
                          const fieldOfStudy = edu.fieldOfStudy || '';
                          
                          let result = '';
                          if (degree && institution) {
                            if (fieldOfStudy && fieldOfStudy !== institution) {
                              result = `${degree} - ${fieldOfStudy} - ${institution}`;
                            } else {
                              result = `${degree} - ${institution}`;
                            }
                          } else if (degree) {
                            result = degree;
                          } else if (institution) {
                            result = institution;
                          } else if (fieldOfStudy) {
                            result = fieldOfStudy;
                          } else {
                            result = 'Not specified';
                          }
                          
                          console.log('✅ Using educationDetails:', result);
                          return result;
                        }
                        
                        // Fallback to education string field
                        if (candidate.education && candidate.education !== 'Not specified' && candidate.education !== 'null' && candidate.education.trim() !== '') {
                          console.log('✅ Using education string:', candidate.education);
                          return candidate.education;
                        }
                        
                        console.log('⚠️ No education data found');
                        return 'Not specified';
                      })()}
                    </p>
                  </div>
                  
                  {/* Professional Summary */}
                  <div className="text-center w-full text-xs bg-slate-100 rounded-lg p-2 mb-3">
                    <p className="text-slate-700 line-clamp-3">{candidate.additionalInfo || 'No summary'}</p>
                  </div>
                  
                  {/* Viewed Indicator */}
                  {candidate.isViewed && (
                    <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Viewed
                    </div>
                  )}
                </div>

                {/* RIGHT SIDE - Information & Actions */}
                <div className="flex-1 p-6 flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900 text-xl">{candidate.name}</h3>
                        {(candidate as any)?.verification_level === 'premium' || (candidate as any)?.verificationLevel === 'premium' || (candidate as any)?.preferences?.premium ? (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">Premium</Badge>
                        ) : null}
                        {candidate.isViewed && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <p className="text-slate-600 text-sm mb-2 font-medium">
                        {(candidate as any).headline || candidate.designation || 'Job Seeker'}
                      </p>
                      
                      {/* Current Designation */}
                      {candidate.currentDesignation && (
                        <p className="text-sm text-slate-800 mb-2 font-semibold">
                          Designation: {candidate.currentDesignation}
                        </p>
                      )}
                      
                      {/* Company Info */}
                      <div className="mb-3 space-y-1">
                        {candidate.currentCompany && (
                          <p className="text-sm text-slate-700">
                            Current Company: <span className="font-semibold">{candidate.currentCompany}</span>
                            {candidate.currentDesignation && ` (${candidate.currentDesignation})`}
                          </p>
                        )}
                        
                        {candidate.previousCompany && (
                          <p className="text-sm text-slate-600">
                            Previous Company: <span className="font-medium">{candidate.previousCompany}</span>
                          </p>
                        )}
                      </div>
                      
                      {/* Location & Experience */}
                      <div className="mb-3 space-y-1">
                        {candidate.location && candidate.location !== 'Not specified' && (
                          <p className="text-sm text-slate-600">
                            Current Location: {candidate.location}
                          </p>
                        )}
                        
                        {candidate.preferredLocations && candidate.preferredLocations.length > 0 && (
                          <p className="text-sm text-slate-600">
                            Preferred: {candidate.preferredLocations.slice(0, 2).join(', ')}
                            {candidate.preferredLocations.length > 2 && ` +${candidate.preferredLocations.length - 2}`}
                          </p>
                        )}
                        
                        {candidate.experience && candidate.experience !== 'Not specified' && (
                          <p className="text-sm text-slate-600">
                            Experience: {candidate.experience}
                          </p>
                        )}
                        
                        {(() => {
                          const salary = candidate.currentSalary;
                          console.log('🔍 Salary Debug for', candidate.name, ':', salary);
                          if (salary && salary !== 'Not specified' && salary !== 'null' && salary.trim() !== '') {
                            return (
                              <p className="text-sm text-slate-600 font-medium">
                                Current Salary: <span className="text-slate-800">{salary}</span>
                              </p>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      
                      {/* Technical Skills - Show all skills from database */}
                      {(() => {
                        // Get skills from multiple possible sources
                        const candidateAny = candidate as any;
                        const skills = candidate.keySkills || 
                                      (candidateAny?.skills && Array.isArray(candidateAny.skills) ? candidateAny.skills : []) ||
                                      (candidateAny?.skills && typeof candidateAny.skills === 'string' ? candidateAny.skills.split(',').map((s: string) => s.trim()) : []) ||
                                      [];
                        
                        return skills.length > 0 ? (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Technical Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                              {skills.slice(0, 10).map((skill: string, idx: number) => (
                                <Badge key={`${candidate.id}_skill_${idx}_${String(skill)}`} variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200 font-medium">
                                  {String(skill).trim()}
                                </Badge>
                              ))}
                              {skills.length > 10 && (
                                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                                  +{skills.length - 10} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                      <div className="flex flex-wrap items-center gap-2 justify-end">
                        {candidate.phoneVerified && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            Phone Verified
                          </Badge>
                        )}
                        {candidate.emailVerified && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                            Email Verified
                          </Badge>
                        )}
                      </div>
                          {/* ATS Score Badge */}
                          {(() => {
                            const atsScore = Number(candidate.atsScore);
                            const hasValidScore = !isNaN(atsScore) && atsScore > 0;
                            
                            console.log(`🔍 Candidate ${candidate.name} ATS data:`, {
                              originalAtsScore: candidate.atsScore,
                              convertedAtsScore: atsScore,
                              hasValidScore: hasValidScore,
                              atsCalculatedAt: candidate.atsCalculatedAt
                            });
                            
                            return hasValidScore ? (
                              <Badge 
                                variant="secondary" 
                                className={`text-xs font-semibold px-3 py-1 ${
                                  atsScore >= 80 ? 'bg-emerald-100 text-emerald-800 border-emerald-200 shadow-sm' :
                                  atsScore >= 60 ? 'bg-blue-100 text-blue-800 border-blue-200 shadow-sm' :
                                  atsScore >= 40 ? 'bg-yellow-100 text-yellow-800 border-yellow-200 shadow-sm' :
                                  'bg-red-100 text-red-800 border-red-200 shadow-sm'
                                }`}
                                title={`ATS Score: ${atsScore}/100 - ${
                                  atsScore >= 80 ? 'Excellent Match' :
                                  atsScore >= 60 ? 'Good Match' :
                                  atsScore >= 40 ? 'Average Match' :
                                  'Poor Match'
                                }`}
                              >
                                <Brain className="w-3 h-3 mr-1" />
                                ATS: {atsScore}
                              </Badge>
                            ) : (
                              <Badge 
                                variant="outline" 
                                className="text-xs text-gray-500 border-gray-300 px-3 py-1"
                                title="Click 'Calculate ATS Scores' to generate ATS score for this candidate"
                              >
                                <Brain className="w-3 h-3 mr-1" />
                                No ATS Score
                              </Badge>
                            );
                          })()}
                          <button
                            aria-label={candidate.likedByCurrent ? 'Remove upvote' : 'Upvote candidate'}
                            onClick={async (e) => {
                              e.preventDefault();
                              const btn = e.currentTarget as HTMLButtonElement | null;
                              try {
                                if (btn) btn.disabled = true;
                                if (candidate.likedByCurrent) {
                                  const res = await apiService.unlikeCandidate(candidate.id);
                                  if (res.success) {
                                    setCandidates(prev => prev.map(c => c.id === candidate.id ? {
                                      ...c,
                                      likedByCurrent: false,
                                      likeCount: Math.max(0, (c.likeCount || 1) - 1)
                                    } : c));
                                  }
                                } else {
                                  const res = await apiService.likeCandidate(candidate.id);
                                  if (res.success) {
                                    setCandidates(prev => prev.map(c => c.id === candidate.id ? {
                                      ...c,
                                      likedByCurrent: true,
                                      likeCount: (c.likeCount || 0) + 1
                                    } : c));
                                  }
                                }
                              } catch (err) {
                                toast.error('Failed to update upvote');
                              } finally {
                                if (btn) btn.disabled = false;
                              }
                            }}
                            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border ${candidate.likedByCurrent ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                          >
                            <svg className={`w-3.5 h-3.5 ${candidate.likedByCurrent ? 'fill-green-600 text-green-600' : 'text-slate-500'}`} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 5l7 12H5l7-12z"/></svg>
                            {(candidate.likeCount ?? 0) > 0 && <span>{candidate.likeCount}</span>}
                          </button>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      {/* Phone Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (revealedPhones.has(candidate.id)) {
                            setRevealedPhones(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(candidate.id);
                              return newSet;
                            });
                          } else {
                            setRevealedPhones(prev => new Set(prev).add(candidate.id));
                          }
                        }}
                        className="text-xs"
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        {revealedPhones.has(candidate.id) && candidate.phone ? (
                          <span className="flex items-center gap-1">
                            {candidate.phone}
                            {candidate.phoneVerified && <span className="text-green-600 text-xs">(Verified)</span>}
                          </span>
                        ) : (
                          'Phone Number'
                        )}
                      </Button>
                      
                      {/* Email/Time Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (revealedEmails.has(candidate.id)) {
                            setRevealedEmails(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(candidate.id);
                              return newSet;
                            });
                          } else {
                            setRevealedEmails(prev => new Set(prev).add(candidate.id));
                          }
                        }}
                        className="text-xs"
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        {revealedEmails.has(candidate.id) ? (
                          <span className="flex flex-col items-start">
                            <span className="flex items-center gap-1">
                              {candidate.email}
                              {candidate.emailVerified && <span className="text-emerald-600 text-xs">(Verified)</span>}
                            </span>
                            {candidate.lastActive && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Last active: {(() => {
                                  try {
                                    const date = new Date(candidate.lastActive);
                                    const now = new Date();
                                    const diffMs = now.getTime() - date.getTime();
                                    const diffMins = Math.floor(diffMs / 60000);
                                    const diffHours = Math.floor(diffMs / 3600000);
                                    const diffDays = Math.floor(diffMs / 86400000);
                                    
                                    if (diffMins < 60) return `${diffMins}m ago`;
                                    if (diffHours < 24) return `${diffHours}h ago`;
                                    if (diffDays < 7) return `${diffDays}d ago`;
                                    return date.toLocaleDateString();
                                  } catch {
                                    return candidate.activeStatus;
                                  }
                                })()}
                              </span>
                            )}
                          </span>
                        ) : (
                          'Email Address'
                        )}
                      </Button>
                      
                      {/* Contact Candidate Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCandidate(candidate)
                          setContactDialogOpen(true)
                        }}
                        className="text-xs"
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        Contact Candidate
                      </Button>
                      
                      {/* Save for Later Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            setSavingCandidate(candidate.id);
                            if (candidate.isSaved) {
                              // Unsave - remove like
                              const res = await apiService.unlikeCandidate(candidate.id);
                              if (res.success) {
                                setCandidates(prev => prev.map(c => 
                                  c.id === candidate.id ? { ...c, isSaved: false } : c
                                ));
                                toast.success('Removed from saved candidates');
                              }
                            } else {
                              // Save - add like
                              const res = await apiService.likeCandidate(candidate.id);
                              if (res.success) {
                                setCandidates(prev => prev.map(c => 
                                  c.id === candidate.id ? { ...c, isSaved: true } : c
                                ));
                                toast.success('Saved candidate for later');
                              }
                            }
                          } catch (err) {
                            toast.error('Failed to update saved status');
                          } finally {
                            setSavingCandidate(null);
                          }
                        }}
                        disabled={savingCandidate === candidate.id}
                        className={`text-xs ${candidate.isSaved ? 'bg-green-50 text-green-700 border-green-200' : ''}`}
                      >
                        <Save className={`w-3 h-3 mr-1 ${candidate.isSaved ? 'fill-current' : ''}`} />
                        {savingCandidate === candidate.id ? 'Saving...' : (candidate.isSaved ? 'Saved' : 'Save')}
                      </Button>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        try {
                          // Mark candidate as viewed immediately for better UX
                          if (!candidate.isViewed) {
                            setCandidates(prev => prev.map(c => 
                              c.id === candidate.id ? { ...c, isViewed: true } : c
                            ));
                          }
                          
                          // Navigate to profile page - view tracking happens on backend
                          window.location.href = `/gulf-dashboard/manage-requirements/${params.id}/candidates/${candidate.id}`;
                        } catch (error) {
                          console.error('Error navigating to profile:', error);
                        }
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View Profile
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No candidates found</h3>
                <p className="text-slate-600 mb-4">
                  {filters.saved
                    ? "No saved candidates found. Save candidates to view them here."
                    : "Try adjusting your filters or search criteria."
                  }
                </p>
              </div>
            )}
        </div>
        )}

        {/* Pagination */}
        {!loading && !error && pagination.pages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button 
                variant="outline" 
                size="sm"
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <EmployerFooter />

      {/* Contact Candidate Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Candidate</DialogTitle>
            <DialogDescription>
              {selectedCandidate?.name ? `Get in touch with ${selectedCandidate.name}` : 'Contact information'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Email Section */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              {selectedCandidate?.email ? (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                  <span className="text-sm font-medium">{selectedCandidate.email}</span>
                  {selectedCandidate.emailVerified && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      Verified
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No email available</p>
              )}
              {selectedCandidate?.email && (
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => {
                    window.location.href = `mailto:${selectedCandidate.email}`
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
              )}
            </div>

            {/* Phone Section */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              {selectedCandidate?.phone ? (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                  <span className="text-sm font-medium">{selectedCandidate.phone}</span>
                  {selectedCandidate.phoneVerified && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      Verified
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No phone number available</p>
              )}
              {selectedCandidate?.phone && (
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => {
                    window.location.href = `tel:${selectedCandidate.phone}`
                  }}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </GulfEmployerAuthGuard>
    </EmployerAuthGuard>
  )
}
