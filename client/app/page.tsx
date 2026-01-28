"use client"

import { useState, useEffect } from "react"
import {
  Search,
  MapPin,
  Briefcase,
  Users,
  Star,
  Clock,
  IndianRupee,
  Sparkles,
  ArrowRight,
  Play,
  Building2,
  Zap,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Crown,
  CheckCircle,
  TrendingUp,
  Award,
  Globe,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { apiService } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { RegistrationChatbot } from "@/components/registration-chatbot"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [location, setLocation] = useState("")
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [isStickyVisible, setIsStickyVisible] = useState(false)
  const [showAllJobRoles, setShowAllJobRoles] = useState(false)
  
  // Animation states for sections
  const [animatedSections, setAnimatedSections] = useState({
    hero: false,
    stats: false,
    companies: false,
    featuredJobs: false,
    testimonials: false,
    features: false,
    cta: false
  })

  // Smart search functionality with typo handling
  const handleSearch = () => {
    if (searchQuery.trim() || location.trim()) {
      const params = new URLSearchParams()
      
      // Process search query with smart matching
      if (searchQuery.trim()) {
        const processedQuery = processSearchQuery(searchQuery.trim())
        
        // Handle exact matches differently
        if (typeof processedQuery === 'object' && processedQuery.isExactMatch) {
          // For exact matches, pass structured data
          params.append("search", processedQuery.originalQuery)
          params.append("exactMatch", "true")
          if (processedQuery.jobTitle) params.append("jobTitle", processedQuery.jobTitle)
          if (processedQuery.company) params.append("company", processedQuery.company)
          if (processedQuery.location) params.append("location", processedQuery.location)
        } else {
          // For regular processed queries
          params.append("search", typeof processedQuery === 'string' ? processedQuery : processedQuery.toString())
        }
      }
      
      // Process location
      if (location.trim()) {
        params.append("location", location.trim())
      }
      
      window.location.href = `/jobs?${params.toString()}`
    }
  }

  // Enhanced smart search query processing to handle all job roles and edge cases
  const processSearchQuery = (query: string) => {
    const lowerQuery = query.toLowerCase().trim()
    
    // First, check for exact matches in specific patterns (highest priority)
    const exactMatchPatterns = [
      // Job title at Company in Location patterns
      /(.+?)\s+(?:at|in|@)\s+(.+?)\s+(?:in|at|@)\s+(.+)/i,
      // Company in Location patterns  
      /(.+?)\s+(?:in|at|@)\s+(.+)/i,
      // Job title at Company patterns
      /(.+?)\s+(?:at|@)\s+(.+)/i,
    ]
    
    for (const pattern of exactMatchPatterns) {
      const match = query.match(pattern)
      if (match) {
        // Return the structured query for exact matching
        return {
          isExactMatch: true,
          jobTitle: match[1]?.trim(),
          company: match[2]?.trim(),
          location: match[3]?.trim() || match[2]?.trim(),
          originalQuery: query.trim()
        }
      }
    }
    
    // Check if query contains common exact search indicators
    const exactSearchIndicators = ['at ', ' in ', '@', 'position:', 'company:', 'location:']
    const hasExactIndicators = exactSearchIndicators.some(indicator => 
      lowerQuery.includes(indicator.toLowerCase())
    )
    
    if (hasExactIndicators) {
      return {
        isExactMatch: true,
        originalQuery: query.trim(),
        jobTitle: query.trim(),
        company: query.trim(),
        location: query.trim()
      }
    }
    
    // Comprehensive keyword mappings for all job roles and variations
    const keywordMappings: { [key: string]: string[] } = {
      // Programming Languages & Technologies
      'python developer': ['python developer', 'python dev', 'python programmer', 'python engineer', 'python coder', 'py developer', 'pythonista'],
      'javascript developer': ['javascript developer', 'js developer', 'javascript dev', 'js dev', 'javascript engineer', 'js engineer', 'nodejs developer'],
      'java developer': ['java developer', 'java dev', 'java programmer', 'java engineer', 'java coder', 'javase developer'],
      'react developer': ['react developer', 'reactjs developer', 'react dev', 'react engineer', 'react programmer', 'react frontend'],
      'angular developer': ['angular developer', 'angularjs developer', 'angular dev', 'angular engineer', 'angular programmer'],
      'vue developer': ['vue developer', 'vuejs developer', 'vue dev', 'vue engineer', 'vue programmer'],
      'nodejs developer': ['nodejs developer', 'node developer', 'nodejs dev', 'node dev', 'node engineer', 'node programmer'],
      'php developer': ['php developer', 'php dev', 'php programmer', 'php engineer', 'php coder', 'laravel developer'],
      'c++ developer': ['c++ developer', 'cpp developer', 'c plus plus developer', 'c++ dev', 'cpp dev', 'c++ engineer'],
      'c# developer': ['c# developer', 'csharp developer', 'c# dev', 'csharp dev', 'c# engineer', 'csharp engineer'],
      'swift developer': ['swift developer', 'swift dev', 'swift engineer', 'ios developer', 'swift programmer'],
      'kotlin developer': ['kotlin developer', 'kotlin dev', 'kotlin engineer', 'android developer', 'kotlin programmer'],
      'flutter developer': ['flutter developer', 'flutter dev', 'flutter engineer', 'flutter programmer', 'dart developer'],
      'react native developer': ['react native developer', 'reactnative developer', 'react native dev', 'rn developer'],
      
      // Specific Developer Roles
      'frontend developer': ['frontend developer', 'front end developer', 'front-end developer', 'frontend dev', 'ui developer', 'frontend engineer'],
      'backend developer': ['backend developer', 'back end developer', 'back-end developer', 'backend dev', 'server developer', 'backend engineer'],
      'full stack developer': ['full stack developer', 'fullstack developer', 'full stack dev', 'fullstack dev', 'full stack engineer'],
      'mobile developer': ['mobile developer', 'mobile dev', 'mobile engineer', 'mobile programmer', 'app developer'],
      'web developer': ['web developer', 'web dev', 'web engineer', 'web programmer', 'website developer'],
      'game developer': ['game developer', 'game dev', 'game engineer', 'game programmer', 'gamedev', 'game development'],
      'blockchain developer': ['blockchain developer', 'blockchain dev', 'blockchain engineer', 'crypto developer', 'web3 developer'],
      'devops engineer': ['devops engineer', 'devops developer', 'dev ops engineer', 'devops', 'site reliability engineer', 'sre'],
      'cloud engineer': ['cloud engineer', 'cloud developer', 'aws engineer', 'azure engineer', 'gcp engineer', 'cloud architect'],
      'security engineer': ['security engineer', 'cyber security engineer', 'cybersecurity engineer', 'security developer', 'infosec engineer'],
      
      // Data & Analytics
      'data scientist': ['data scientist', 'data science', 'datascientist', 'data science engineer', 'ml engineer', 'machine learning engineer'],
      'data analyst': ['data analyst', 'data analysis', 'data analytics', 'data analyst engineer'],
      'data engineer': ['data engineer', 'data engineering', 'data pipeline engineer', 'etl developer', 'data infrastructure'],
      'business analyst': ['business analyst', 'business analysis', 'ba', 'business intelligence analyst', 'bi analyst'],
      'product analyst': ['product analyst', 'product analysis', 'product data analyst', 'product metrics analyst'],
      'research analyst': ['research analyst', 'market research analyst', 'research associate', 'analyst researcher'],
      
      // Design & UX/UI
      'ui designer': ['ui designer', 'user interface designer', 'interface designer', 'ui/ux designer', 'ui design'],
      'ux designer': ['ux designer', 'user experience designer', 'experience designer', 'ui/ux designer', 'ux design'],
      'graphic designer': ['graphic designer', 'graphics designer', 'visual designer', 'creative designer', 'graphic design'],
      'product designer': ['product designer', 'product design', 'product ux designer', 'product ui designer'],
      'web designer': ['web designer', 'website designer', 'web design', 'digital designer', 'online designer'],
      'game designer': ['game designer', 'game design', 'game artist', 'level designer', 'game developer designer'],
      'interior designer': ['interior designer', 'interior design', 'interior architect', 'space designer'],
      'fashion designer': ['fashion designer', 'fashion design', 'clothing designer', 'apparel designer'],
      
      // Marketing & Digital
      'digital marketing': ['digital marketing', 'digital marketer', 'online marketing', 'internet marketing', 'web marketing'],
      'social media marketing': ['social media marketing', 'smm', 'social media manager', 'social media specialist'],
      'content marketing': ['content marketing', 'content marketer', 'content strategy', 'content creator marketing'],
      'email marketing': ['email marketing', 'email marketer', 'email campaign manager', 'email specialist'],
      'seo specialist': ['seo specialist', 'seo expert', 'seo analyst', 'search engine optimization', 'seo consultant'],
      'sem specialist': ['sem specialist', 'sem expert', 'paid search specialist', 'google ads specialist', 'ppc specialist'],
      'affiliate marketing': ['affiliate marketing', 'affiliate manager', 'affiliate specialist', 'partner marketing'],
      'brand manager': ['brand manager', 'brand marketing manager', 'brand specialist', 'brand strategist'],
      'product manager': ['product manager', 'product owner', 'product specialist', 'product lead', 'pm'],
      'project manager': ['project manager', 'project lead', 'project coordinator', 'project specialist', 'pm'],
      'program manager': ['program manager', 'program lead', 'program coordinator', 'program specialist'],
      
      // Sales & Business Development
      'sales manager': ['sales manager', 'sales lead', 'sales head', 'sales director', 'sales supervisor'],
      'sales executive': ['sales executive', 'sales rep', 'sales representative', 'sales associate', 'sales officer'],
      'business development': ['business development', 'bd manager', 'business dev', 'biz dev', 'bd executive'],
      'account manager': ['account manager', 'account executive', 'client manager', 'customer manager', 'key account manager'],
      'sales engineer': ['sales engineer', 'technical sales', 'pre sales engineer', 'sales technical specialist'],
      'inside sales': ['inside sales', 'inside sales rep', 'inside sales executive', 'tele sales', 'phone sales'],
      'field sales': ['field sales', 'outside sales', 'field sales rep', 'territory sales', 'regional sales'],
      
      // Finance & Accounting
      'accountant': ['accountant', 'accounting', 'accounts executive', 'accounts officer', 'bookkeeper', 'financial accountant'],
      'financial analyst': ['financial analyst', 'finance analyst', 'fin analyst', 'financial planning analyst', 'fp&a analyst'],
      'tax consultant': ['tax consultant', 'tax advisor', 'tax specialist', 'tax expert', 'tax accountant'],
      'auditor': ['auditor', 'internal auditor', 'external auditor', 'audit associate', 'audit specialist'],
      'investment banker': ['investment banker', 'investment banking', 'ib analyst', 'corporate finance', 'mergers acquisitions'],
      'financial advisor': ['financial advisor', 'financial consultant', 'wealth manager', 'investment advisor', 'financial planner'],
      'treasury analyst': ['treasury analyst', 'treasury specialist', 'cash management analyst', 'liquidity analyst'],
      'credit analyst': ['credit analyst', 'credit specialist', 'credit risk analyst', 'loan analyst', 'underwriter'],
      
      // Operations & Supply Chain
      'operations manager': ['operations manager', 'ops manager', 'operations lead', 'operational manager', 'ops lead'],
      'supply chain manager': ['supply chain manager', 'scm', 'logistics manager', 'procurement manager', 'sourcing manager'],
      'quality assurance': ['quality assurance', 'qa engineer', 'qa analyst', 'quality control', 'qc engineer', 'test engineer'],
      'production manager': ['production manager', 'manufacturing manager', 'plant manager', 'production supervisor'],
      'inventory manager': ['inventory manager', 'inventory specialist', 'stock manager', 'warehouse manager'],
      'logistics coordinator': ['logistics coordinator', 'logistics specialist', 'shipping coordinator', 'transport coordinator'],
      'facilities manager': ['facilities manager', 'facility manager', 'facilities coordinator', 'building manager'],
      
      // Human Resources
      'hr manager': ['hr manager', 'human resources manager', 'hr head', 'hr director', 'people manager'],
      'hr executive': ['hr executive', 'hr specialist', 'hr coordinator', 'hr officer', 'people operations'],
      'recruiter': ['recruiter', 'talent acquisition', 'recruitment specialist', 'hiring manager', 'talent recruiter'],
      'hr business partner': ['hr business partner', 'hrbp', 'hr partner', 'people business partner'],
      'compensation analyst': ['compensation analyst', 'compensation specialist', 'payroll analyst', 'benefits analyst'],
      'training manager': ['training manager', 'learning development manager', 'ld manager', 'training specialist'],
      'employee relations': ['employee relations', 'er specialist', 'employee relations manager', 'workplace relations'],
      
      // Customer Service & Support
      'customer service': ['customer service', 'customer care', 'customer support', 'client service', 'customer success'],
      'customer support': ['customer support', 'technical support', 'support engineer', 'helpdesk', 'support specialist'],
      'call center': ['call center', 'call centre', 'contact center', 'customer service rep', 'telephone operator'],
      'customer success': ['customer success', 'customer success manager', 'cs manager', 'account success manager'],
      
      // Healthcare & Medical
      'doctor': ['doctor', 'physician', 'medical doctor', 'md', 'medical practitioner', 'doctorate'],
      'nurse': ['nurse', 'registered nurse', 'rn', 'nursing', 'staff nurse', 'nurse practitioner'],
      'pharmacist': ['pharmacist', 'pharmacy', 'pharmaceutical', 'drug specialist', 'dispensing pharmacist'],
      'medical technician': ['medical technician', 'lab technician', 'medical lab tech', 'clinical technician'],
      'physical therapist': ['physical therapist', 'physiotherapist', 'pt', 'physical therapy', 'rehabilitation therapist'],
      'dental hygienist': ['dental hygienist', 'dental assistant', 'oral hygienist', 'dental care specialist'],
      
      // Education & Training
      'teacher': ['teacher', 'instructor', 'educator', 'faculty', 'professor', 'tutor', 'trainer'],
      'principal': ['principal', 'headmaster', 'headmistress', 'school principal', 'head teacher'],
      'curriculum developer': ['curriculum developer', 'curriculum designer', 'educational content developer', 'instructional designer'],
      'training coordinator': ['training coordinator', 'training specialist', 'learning coordinator', 'development coordinator'],
      'academic advisor': ['academic advisor', 'student advisor', 'academic counselor', 'educational advisor'],
      
      // Legal & Compliance
      'lawyer': ['lawyer', 'attorney', 'advocate', 'legal counsel', 'solicitor', 'barrister', 'legal advisor'],
      'paralegal': ['paralegal', 'legal assistant', 'law clerk', 'legal secretary', 'legal support'],
      'compliance officer': ['compliance officer', 'compliance manager', 'regulatory compliance', 'compliance specialist'],
      'contract manager': ['contract manager', 'contract specialist', 'legal contract manager', 'agreement manager'],
      
      // Engineering (Various Disciplines)
      'mechanical engineer': ['mechanical engineer', 'mech engineer', 'mechanical eng', 'mechanical design engineer'],
      'civil engineer': ['civil engineer', 'civil eng', 'structural engineer', 'civil construction engineer'],
      'electrical engineer': ['electrical engineer', 'electrical eng', 'power engineer', 'electrical design engineer'],
      'chemical engineer': ['chemical engineer', 'chem engineer', 'process engineer', 'chemical process engineer'],
      'aerospace engineer': ['aerospace engineer', 'aviation engineer', 'aircraft engineer', 'aerospace design engineer'],
      'automotive engineer': ['automotive engineer', 'auto engineer', 'vehicle engineer', 'automotive design engineer'],
      'biomedical engineer': ['biomedical engineer', 'bio engineer', 'medical engineer', 'biomedical device engineer'],
      'environmental engineer': ['environmental engineer', 'env engineer', 'environmental consultant', 'sustainability engineer'],
      
      // Architecture & Construction
      'architect': ['architect', 'architecture', 'building architect', 'design architect', 'project architect'],
      'interior architect': ['interior architect', 'interior design architect', 'space architect', 'interior planner'],
      'landscape architect': ['landscape architect', 'landscape designer', 'garden architect', 'outdoor designer'],
      'construction manager': ['construction manager', 'site manager', 'construction supervisor', 'building manager'],
      'civil contractor': ['civil contractor', 'construction contractor', 'building contractor', 'general contractor'],
      
      // Media & Entertainment
      'journalist': ['journalist', 'reporter', 'news reporter', 'correspondent', 'media journalist'],
      'editor': ['editor', 'content editor', 'text editor', 'managing editor', 'copy editor'],
      'photographer': ['photographer', 'photo artist', 'camera operator', 'visual artist', 'photojournalist'],
      'videographer': ['videographer', 'video producer', 'video editor', 'motion graphics artist', 'video creator'],
      'content writer': ['content writer', 'content creator', 'copywriter', 'blog writer', 'article writer'],
      'social media manager': ['social media manager', 'social media specialist', 'smm', 'social media coordinator'],
      
      // Retail & E-commerce
      'store manager': ['store manager', 'retail manager', 'shop manager', 'store supervisor', 'retail supervisor'],
      'sales associate': ['sales associate', 'retail associate', 'store associate', 'sales clerk', 'retail clerk'],
      'merchandiser': ['merchandiser', 'merchandising specialist', 'visual merchandiser', 'product merchandiser'],
      'e-commerce manager': ['e-commerce manager', 'ecommerce manager', 'online store manager', 'digital commerce manager'],
      'category manager': ['category manager', 'product category manager', 'merchandise category manager'],
      
      // Hospitality & Tourism
      'hotel manager': ['hotel manager', 'hotel general manager', 'hotel operations manager', 'lodging manager'],
      'chef': ['chef', 'head chef', 'executive chef', 'kitchen chef', 'culinary chef', 'cook'],
      'restaurant manager': ['restaurant manager', 'food service manager', 'dining manager', 'restaurant supervisor'],
      'travel agent': ['travel agent', 'travel consultant', 'travel specialist', 'tourism agent', 'vacation planner'],
      'event manager': ['event manager', 'event coordinator', 'event planner', 'conference manager', 'meeting planner'],
      
      // General Terms (fallbacks) - Enhanced with more variations
      'developer': ['developer', 'devloper', 'developr', 'dev', 'programmer', 'coder', 'software developer', 'software dev', 'sw dev', 'prog', 'coding'],
      'engineer': ['engineer', 'engneer', 'enginer', 'engr', 'engineering', 'technical engineer', 'tech eng', 'technical', 'eng', 'tech'],
      'manager': ['manager', 'mangr', 'mgr', 'management', 'supervisor', 'lead', 'head', 'mgmt', 'superv', 'leadship', 'head of'],
      'analyst': ['analyst', 'analysit', 'analysis', 'research analyst', 'analyze', 'analytics', 'data analysis'],
      'consultant': ['consultant', 'consulting', 'advisor', 'specialist', 'expert', 'professional', 'cons', 'advice', 'consult'],
      'coordinator': ['coordinator', 'coordination', 'organizer', 'facilitator', 'liaison', 'coord', 'organize', 'facilitate'],
      'specialist': ['specialist', 'specialization', 'expert', 'professional', 'technician', 'spec', 'expertise', 'pro'],
      'assistant': ['assistant', 'associate', 'support', 'helper', 'aide', 'junior', 'asst', 'support staff', 'helper staff'],
      'director': ['director', 'head', 'chief', 'vp', 'vice president', 'executive', 'dir', 'head of', 'chief of', 'vice pres'],
      'executive': ['executive', 'senior', 'lead', 'principal', 'chief', 'head', 'exec', 'senior level', 'principal level'],
      
      // Additional Basic Terms and Shortforms
      'sales': ['sales', 'sale', 'selling', 'sell', 'salesperson', 'salesman', 'saleswoman', 'sales rep', 'revenue'],
      'marketing': ['marketing', 'market', 'promotion', 'promote', 'advertising', 'advertise', 'brand', 'campaign'],
      'hr': ['hr', 'human resources', 'human resource', 'people', 'personnel', 'staff', 'employee', 'workforce'],
      'finance': ['finance', 'financial', 'money', 'accounting', 'accounts', 'budget', 'revenue', 'profit', 'cost'],
      'admin': ['admin', 'administrative', 'administration', 'office', 'secretary', 'receptionist', 'clerk'],
      'support': ['support', 'help', 'assistance', 'service', 'customer service', 'technical support', 'helpdesk'],
      'design': ['design', 'designer', 'creative', 'art', 'graphics', 'visual', 'ui', 'ux', 'branding'],
      'content': ['content', 'writing', 'writer', 'copy', 'copywriter', 'blog', 'article', 'editorial', 'journalism'],
      'teaching': ['teaching', 'teacher', 'education', 'trainer', 'training', 'instructor', 'professor', 'tutor'],
      'healthcare': ['healthcare', 'health', 'medical', 'doctor', 'nurse', 'hospital', 'clinic', 'pharmacy'],
      'legal': ['legal', 'law', 'lawyer', 'attorney', 'court', 'justice', 'law firm', 'legal advice'],
      'retail': ['retail', 'store', 'shop', 'shopping', 'sales associate', 'cashier', 'merchandise'],
      'hospitality': ['hospitality', 'hotel', 'restaurant', 'food', 'catering', 'tourism', 'travel'],
      'construction': ['construction', 'building', 'contractor', 'architect', 'civil', 'site', 'project'],
      'manufacturing': ['manufacturing', 'production', 'factory', 'assembly', 'quality control', 'plant'],
      'transportation': ['transportation', 'logistics', 'shipping', 'delivery', 'driver', 'transport', 'freight'],
      'security': ['security', 'safety', 'guard', 'protection', 'surveillance', 'cyber security'],
      'cleaning': ['cleaning', 'janitor', 'maintenance', 'housekeeping', 'sanitation', 'custodial'],
      'food': ['food', 'cooking', 'chef', 'kitchen', 'culinary', 'beverage', 'restaurant'],
      'fitness': ['fitness', 'gym', 'trainer', 'exercise', 'wellness', 'health coach', 'personal trainer'],
      'beauty': ['beauty', 'salon', 'spa', 'cosmetics', 'hair', 'makeup', 'aesthetic'],
      'automotive': ['automotive', 'car', 'vehicle', 'mechanic', 'auto', 'garage', 'repair'],
      'technology': ['technology', 'tech', 'it', 'software', 'hardware', 'computer', 'digital', 'tech'],
      'communication': ['communication', 'telecom', 'phone', 'telephone', 'internet', 'network', 'wireless'],
      'real estate': ['real estate', 'property', 'realtor', 'broker', 'housing', 'land', 'commercial'],
      'banking': ['banking', 'bank', 'financial services', 'investment', 'loan', 'credit', 'mortgage'],
      'insurance': ['insurance', 'insurer', 'claims', 'policy', 'coverage', 'risk', 'actuary'],
      'government': ['government', 'public sector', 'civil service', 'public service', 'municipal', 'federal'],
      'nonprofit': ['nonprofit', 'ngo', 'charity', 'volunteer', 'social work', 'community service'],
      'media': ['media', 'journalism', 'news', 'broadcasting', 'television', 'radio', 'publishing'],
      'entertainment': ['entertainment', 'gaming', 'music', 'film', 'theater', 'arts', 'creative'],
      'sports': ['sports', 'athletic', 'fitness', 'coach', 'trainer', 'recreation', 'athlete'],
      'agriculture': ['agriculture', 'farming', 'crop', 'livestock', 'agricultural', 'farm', 'rural'],
      'energy': ['energy', 'power', 'electricity', 'oil', 'gas', 'renewable', 'solar', 'wind'],
      'environment': ['environment', 'environmental', 'sustainability', 'green', 'conservation', 'ecology'],
      
      // Common Shortforms and Abbreviations
      'ceo': ['ceo', 'chief executive officer', 'chief exec', 'president'],
      'cto': ['cto', 'chief technology officer', 'chief tech officer'],
      'cfo': ['cfo', 'chief financial officer', 'chief finance officer'],
      'coo': ['coo', 'chief operating officer', 'chief operations officer'],
      'vp': ['vp', 'vice president', 'vice pres', 'v.p.'],
      'svp': ['svp', 'senior vice president', 'senior vp'],
      'avp': ['avp', 'assistant vice president', 'assistant vp'],
      'senior': ['senior', 'sr', 'senior level', 'experienced'],
      'junior': ['junior', 'jr', 'entry level', 'fresher', 'beginner'],
      'intern': ['intern', 'internship', 'trainee', 'apprentice', 'inter', 'intirn', 'intrn', 'intership', 'internsip', 'internshp', 'trainee', 'apprentice'],
      'freelance': ['freelance', 'freelancer', 'contract', 'contractor', 'consultant'],
      'remote': ['remote', 'work from home', 'wfh', 'virtual', 'online'],
      'part time': ['part time', 'part-time', 'pt', 'half time', 'flexible hours'],
      'full time': ['full time', 'full-time', 'ft', 'permanent', 'regular'],
      'contract': ['contract', 'contractual', 'temp', 'temporary', 'project based'],
      
      // Technology Shortforms
      'ai': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning'],
      'ml': ['ml', 'machine learning', 'ai', 'artificial intelligence', 'deep learning'],
      'data': ['data', 'database', 'db', 'data management', 'data processing'],
      'cloud': ['cloud', 'aws', 'azure', 'gcp', 'cloud computing', 'saas'],
      'mobile': ['mobile', 'app', 'ios', 'android', 'smartphone', 'tablet'],
      'web': ['web', 'website', 'internet', 'online', 'digital', 'ecommerce'],
      'api': ['api', 'rest api', 'web service', 'integration', 'microservice'],
      'ui': ['ui', 'user interface', 'interface design', 'frontend', 'user experience'],
      'ux': ['ux', 'user experience', 'usability', 'user research', 'interaction design'],
      'qa': ['qa', 'quality assurance', 'testing', 'test engineer', 'quality control'],
      'devops': ['devops', 'dev ops', 'deployment', 'ci cd', 'automation'],
      'blockchain': ['blockchain', 'crypto', 'cryptocurrency', 'web3', 'defi'],
      'iot': ['iot', 'internet of things', 'connected devices', 'smart devices'],
      'ar': ['ar', 'augmented reality', 'mixed reality', 'virtual reality'],
      'vr': ['vr', 'virtual reality', 'immersive', '3d', 'simulation'],
      
      // Industry Shortforms
      'b2b': ['b2b', 'business to business', 'enterprise', 'corporate'],
      'b2c': ['b2c', 'business to consumer', 'retail', 'consumer'],
      'saas': ['saas', 'software as a service', 'cloud software', 'subscription'],
      'paas': ['paas', 'platform as a service', 'cloud platform'],
      'iaas': ['iaas', 'infrastructure as a service', 'cloud infrastructure'],
      'fintech': ['fintech', 'financial technology', 'digital finance', 'payments'],
      'edtech': ['edtech', 'education technology', 'e-learning', 'online education'],
      'healthtech': ['healthtech', 'health technology', 'digital health', 'medtech'],
      'proptech': ['proptech', 'property technology', 'real estate tech'],
      'agritech': ['agritech', 'agriculture technology', 'farm tech', 'agtech'],
      'cleantech': ['cleantech', 'clean technology', 'green tech', 'sustainability tech'],
      
      // Common Job Search Terms
      'job': ['job', 'position', 'role', 'opportunity', 'career', 'employment', 'work'],
      'career': ['career', 'profession', 'occupation', 'vocation', 'job', 'work'],
      'work': ['work', 'job', 'employment', 'labor', 'service', 'duty'],
      'employment': ['employment', 'job', 'work', 'career', 'occupation'],
      'hiring': ['hiring', 'recruitment', 'recruiting', 'talent acquisition', 'staffing'],
      'vacancy': ['vacancy', 'opening', 'position', 'opportunity', 'job opening'],
      'fresher': ['fresher', 'freshers', 'entry level', 'junior', 'beginner', 'new graduate', 'entry', 'fresh', 'newbie', 'novice', 'trainee', 'graduate', '0-1', '0 to 1', 'zero experience', 'no experience', 'starting', 'entry-level'],
      'experienced': ['experienced', 'senior', 'expert', 'professional', 'skilled'],
      'urgent': ['urgent', 'immediate', 'asap', 'priority', 'rush'],
      'walk in': ['walk in', 'walk-in', 'walkin', 'immediate joining'],
      'work from home': ['work from home', 'wfh', 'remote work', 'home office', 'virtual'],
      
      // Location Related Terms
      'bangalore': ['bangalore', 'bengaluru', 'blr', 'bangalore city'],
      'mumbai': ['mumbai', 'bombay', 'mum', 'mumbai city'],
      'delhi': ['delhi', 'ncr', 'new delhi', 'delhi ncr', 'gurgaon', 'noida'],
      'hyderabad': ['hyderabad', 'hyd', 'cyberabad', 'hyderabad city'],
      'chennai': ['chennai', 'madras', 'chn', 'chennai city'],
      'pune': ['pune', 'pun', 'pune city'],
      'kolkata': ['kolkata', 'calcutta', 'kol', 'kolkata city'],
      'ahmedabad': ['ahmedabad', 'amd', 'ahmedabad city'],
      'indore': ['indore', 'ind', 'indore city'],
      'chandigarh': ['chandigarh', 'chd', 'chandigarh city'],
      
      // Company Size Terms
      'startup': ['startup', 'start-up', 'early stage', 'seed stage', 'venture'],
      'midsize': ['midsize', 'mid-size', 'medium', 'mid level', 'growing company'],
      'enterprise': ['enterprise', 'large company', 'fortune 500', 'corporate', 'multinational'],
      'mnc': ['mnc', 'multinational', 'global company', 'international', 'global'],
      'unicorn': ['unicorn', 'billion dollar', 'high valuation', 'tech giant'],
      
      // Experience Level Terms - Enhanced
      'entry level': ['entry level', 'fresher', '0-1 years', 'beginner', 'new graduate', 'entry', 'fresh', 'junior', 'newbie', 'novice', 'trainee', 'graduate', '0-1', '0 to 1', 'zero experience', 'no experience', 'starting', 'entry-level', 'first job', 'career starter'],
      'mid level': ['mid level', 'mid-level', '2-5 years', 'intermediate', 'experienced', 'mid', 'middle', '2-5', '2 to 5', 'some experience', 'few years', 'developing', 'growing'],
      'senior level': ['senior level', 'senior-level', '5+ years', 'expert', 'leadership', 'senior', 'sr', '5+', '5 plus', 'experienced', 'expert', 'lead', 'principal', 'staff', 'tech lead', 'team lead'],
      'executive level': ['executive level', 'c-level', 'director level', 'vice president', 'executive', 'director', 'vp', 'head', 'chief', 'c-level', 'management', 'leadership', 'top level'],
      
      // Salary Related Terms
      'high salary': ['high salary', 'good pay', 'competitive salary', 'attractive package'],
      'low salary': ['low salary', 'budget friendly', 'affordable', 'cost effective'],
      'negotiable': ['negotiable', 'negotiable salary', 'salary negotiable', 'discuss salary'],
      
      // Work Arrangement Terms
      'flexible': ['flexible', 'flexible hours', 'flexible timing', 'work life balance'],
      'night shift': ['night shift', 'night work', 'evening shift', 'graveyard shift'],
      'day shift': ['day shift', 'day work', 'morning shift', 'regular hours'],
      'weekend': ['weekend', 'weekend work', 'saturday sunday', 'weekend shift'],
      
      // Skill Related Terms
      'leadership': ['leadership', 'leadership skills', 'team lead', 'management skills'],
      'problem solving': ['problem solving', 'analytical', 'critical thinking', 'troubleshooting'],
      'teamwork': ['teamwork', 'collaboration', 'team player', 'cooperative'],
      'time management': ['time management', 'organizational', 'planning', 'efficiency'],
      'sales skills': ['sales skills', 'selling', 'persuasion', 'negotiation', 'closing'],
      'technical skills': ['technical skills', 'technical', 'programming', 'software', 'hardware'],
      'creative': ['creative', 'creativity', 'innovative', 'design thinking', 'artistic'],
      'analytical': ['analytical', 'analysis', 'data analysis', 'research', 'statistical'],
      
      // Education Related Terms
      'graduate': ['graduate', 'bachelor', 'bachelors', 'degree', 'undergraduate'],
      'postgraduate': ['postgraduate', 'masters', 'master degree', 'mba', 'ms', 'ma'],
      'phd': ['phd', 'doctorate', 'doctoral', 'ph.d', 'research degree'],
      'diploma': ['diploma', 'certificate', 'certification', 'course completion'],
      'engineering': ['engineering', 'b.tech', 'be', 'b.e', 'engineering degree'],
      'mba': ['mba', 'master of business administration', 'business degree', 'management degree'],
      'computer science': ['computer science', 'cs', 'cse', 'computer engineering', 'it'],
      'commerce': ['commerce', 'b.com', 'bcom', 'business studies', 'accounting'],
      'arts': ['arts', 'ba', 'b.a', 'humanities', 'liberal arts'],
      'science': ['science', 'bsc', 'b.sc', 'natural sciences', 'pure sciences'],
    }
    
    // Check for exact matches first (highest priority)
    for (const [correctTerm, variations] of Object.entries(keywordMappings)) {
      if (variations.some(variation => 
        lowerQuery.includes(variation) || 
        variation.includes(lowerQuery) ||
        calculateSimilarity(lowerQuery, variation) > 0.8
      )) {
        return correctTerm
      }
    }
    
    // Check for partial matches and similar words (medium priority)
    for (const [correctTerm, variations] of Object.entries(keywordMappings)) {
      for (const variation of variations) {
        if (calculateSimilarity(lowerQuery, variation) > 0.7) {
          return correctTerm
        }
      }
    }
    
    // Check for word-by-word matching (lower priority)
    const queryWords = lowerQuery.split(/\s+/)
    for (const [correctTerm, variations] of Object.entries(keywordMappings)) {
      for (const variation of variations) {
        const variationWords = variation.split(/\s+/)
        if (queryWords.some(qWord => 
          variationWords.some(vWord => 
            calculateSimilarity(qWord, vWord) > 0.8
          )
        )) {
          return correctTerm
        }
      }
    }
    
    // Enhanced fallback: Check for partial matches in any direction
    for (const [correctTerm, variations] of Object.entries(keywordMappings)) {
      for (const variation of variations) {
        // Check if any word from query matches any word from variation
        if (queryWords.some(qWord => 
          variation.toLowerCase().split(/\s+/).some(vWord => 
            qWord.includes(vWord) || vWord.includes(qWord) || calculateSimilarity(qWord, vWord) > 0.6
          )
        )) {
          return correctTerm
        }
      }
    }
    
    // Ultra fallback: Check for single character differences and common typos
    for (const [correctTerm, variations] of Object.entries(keywordMappings)) {
      for (const variation of variations) {
        if (calculateSimilarity(lowerQuery, variation) > 0.5) {
          return correctTerm
        }
      }
    }
    
    // Final fallback: If no match found, return original query but with basic processing
    // This ensures even completely unknown terms get basic search functionality
    return query.trim()
  }
  
  // Simple similarity calculation (Levenshtein distance based)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const distance = levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }
  
  // Levenshtein distance calculation
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const heroTexts = [
    "Build Your Career",
    "Find Your Dream Job",
    "Shape Your Future"
  ]

  const heroSubtitles = [
    "Connect with industry leaders and grow professionally",
    "Discover opportunities from top companies worldwide",
    "Join millions of professionals achieving their goals"
  ]

  const heroGradients = [
    "from-blue-600 via-purple-600 to-indigo-800",
    "from-emerald-600 via-teal-600 to-cyan-800",
    "from-orange-600 via-red-600 to-pink-800"
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % heroTexts.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  // Enhanced scroll event listener for animations
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      
      // Sticky search bar
      setIsStickyVisible(scrollY > 300)
      
      // Section animations
      const sections = {
        hero: 0,
        stats: windowHeight * 0.3,
        companies: windowHeight * 1.2,
        featuredJobs: windowHeight * 2.0,
        testimonials: windowHeight * 2.8,
        features: windowHeight * 3.6,
        cta: windowHeight * 4.4
      }
      
      setAnimatedSections(prev => ({
        hero: true, // Always animated
        stats: scrollY > sections.stats,
        companies: scrollY > sections.companies,
        featuredJobs: scrollY > sections.featuredJobs,
        testimonials: scrollY > sections.testimonials,
        features: scrollY > sections.features,
        cta: scrollY > sections.cta
      }))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    // Trigger initial check
    handleScroll()
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const [stats, setStats] = useState([
    { value: "—", label: "Active Jobs", icon: Briefcase },
    { value: "—", label: "Companies", icon: Building2 },
    { value: "—", label: "Professionals", icon: Users },
    { value: "—", label: "Success Rate", icon: Star },
  ])

  const [topCompanies, setTopCompanies] = useState<any[]>([])

  const [featuredJobs, setFeaturedJobs] = useState<any[]>([])

  const [featuredCompanies, setFeaturedCompanies] = useState<any[]>([])

  const [trendingJobRoles, setTrendingJobRoles] = useState<any[]>([])

  const getSectorColor = (sector: string) => {
    switch (sector) {
      case "technology":
        return "from-blue-300 to-cyan-300"
      case "finance":
        return "from-emerald-300 to-teal-300"
      case "healthcare":
        return "from-pink-300 to-rose-300"
      case "ecommerce":
        return "from-orange-300 to-amber-300"
      case "automotive":
        return "from-slate-300 to-gray-300"
      case "oil-gas":
        return "from-purple-300 to-violet-300"
      case "education":
        return "from-green-300 to-emerald-300"
      case "manufacturing":
        return "from-amber-300 to-orange-300"
      case "retail":
        return "from-pink-300 to-rose-300"
      case "consulting":
        return "from-indigo-300 to-blue-300"
      case "media":
        return "from-purple-300 to-pink-300"
      case "real-estate":
        return "from-yellow-300 to-amber-300"
      case "hospitality":
        return "from-rose-300 to-pink-300"
      case "government":
        return "from-slate-300 to-blue-300"
      default:
        return "from-slate-300 to-gray-300"
    }
  }

  // Helper function to get the correct company route based on region
  const getCompanyRoute = (company: any) => {
    if (!company) return '/companies'
    // Check if company is a Gulf company
    const isGulfCompany = company.region === 'gulf' || 
                         company.region === 'Gulf' ||
                         (company.country && ['UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'].includes(company.country))
    return isGulfCompany ? `/gulf-companies/${company.id}` : `/companies/${company.id}`
  }

  const getIndustryBackgroundGradient = (industry: string) => {
    switch (industry?.toLowerCase()) {
      case "technology":
      case "software":
      case "it":
        return "from-blue-100/60 via-cyan-100/50 to-indigo-100/60"
      case "finance":
      case "banking":
      case "fintech":
        return "from-emerald-100/60 via-teal-100/50 to-green-100/60"
      case "healthcare":
      case "medical":
      case "pharmaceutical":
        return "from-pink-100/60 via-rose-100/50 to-red-100/60"
      case "ecommerce":
      case "retail":
      case "shopping":
        return "from-orange-100/60 via-amber-100/50 to-yellow-100/60"
      case "automotive":
      case "transportation":
        return "from-slate-100/60 via-gray-100/50 to-zinc-100/60"
      case "oil-gas":
      case "energy":
      case "utilities":
        return "from-purple-100/60 via-violet-100/50 to-pink-100/60"
      case "education":
      case "training":
        return "from-green-100/60 via-emerald-100/50 to-teal-100/60"
      case "manufacturing":
      case "production":
        return "from-amber-100/60 via-orange-100/50 to-red-100/60"
      case "consulting":
      case "professional services":
        return "from-indigo-100/60 via-blue-100/50 to-cyan-100/60"
      case "media":
      case "entertainment":
        return "from-purple-100/60 via-pink-100/50 to-rose-100/60"
      case "real estate":
      case "construction":
        return "from-yellow-100/60 via-amber-100/50 to-orange-100/60"
      case "hospitality":
      case "tourism":
        return "from-rose-100/60 via-pink-100/50 to-purple-100/60"
      case "government":
      case "public sector":
        return "from-slate-100/60 via-blue-100/50 to-indigo-100/60"
      default:
        return "from-slate-100/60 via-blue-100/50 to-indigo-100/60"
    }
  }

  const scrollCompanies = (direction: 'left' | 'right') => {
    const container = document.getElementById('companies-container')
    if (container) {
      const scrollAmount = direction === 'left' ? -400 : 400
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Fetch real data for landing
  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      let companiesCountLocal = 0
      try {
        console.log('🔄 Fetching companies from API...')
        const companiesResp = await apiService.listCompanies({ limit: 20, offset: 0 })
        console.log('📊 Companies API response:', companiesResp)
        if (companiesResp.success && Array.isArray(companiesResp.data)) {
          // Filter for verified and active companies
          const verifiedActiveCompanies = companiesResp.data.filter((c: any) => 
            (c.isActive === true || c.isActive === 'true') && 
            (c.isVerified === true || c.isVerified === 'true' || c.verificationStatus === 'verified')
          )
          companiesCountLocal = verifiedActiveCompanies.length
          console.log(`✅ Found ${companiesCountLocal} verified and active companies`)
          const baseMapped = verifiedActiveCompanies.map((c: any) => ({
            id: c.id,
            name: c.name,
            industry: c.industries && Array.isArray(c.industries) && c.industries.length > 0 ? c.industries[0] : (c.industry || 'General'),
            industries: c.industries && Array.isArray(c.industries) ? c.industries : [],
            openings: 0,
            rating: 0,
            icon: '🏢',
            color: getSectorColor(((c.industries && Array.isArray(c.industries) && c.industries.length > 0 ? c.industries[0] : c.industry||'').toLowerCase().includes('tech')?'technology':((c.industries && Array.isArray(c.industries) && c.industries.length > 0 ? c.industries[0] : c.industry)||'').toLowerCase().includes('fin')?'finance':((c.industries && Array.isArray(c.industries) && c.industries.length > 0 ? c.industries[0] : c.industry)||'').toLowerCase().includes('health')?'healthcare':((c.industries && Array.isArray(c.industries) && c.industries.length > 0 ? c.industries[0] : c.industry)||'').toLowerCase().includes('auto')?'automotive':((c.industries && Array.isArray(c.industries) && c.industries.length > 0 ? c.industries[0] : c.industry)||'').toLowerCase().includes('e-com')?'ecommerce':'technology')),
            location: [c.city, c.state, c.country].filter(Boolean).join(', '),
            employees: c.companySize || '',
            logo: c.logo || '/placeholder.svg?height=40&width=40',
            sector: (((c.industries && Array.isArray(c.industries) && c.industries.length > 0 ? c.industries[0] : c.industry)||'').toLowerCase().includes('tech')?'technology':((c.industries && Array.isArray(c.industries) && c.industries.length > 0 ? c.industries[0] : c.industry)||'').toLowerCase().includes('fin')?'finance':((c.industries && Array.isArray(c.industries) && c.industries.length > 0 ? c.industries[0] : c.industry)||'').toLowerCase().includes('health')?'healthcare':((c.industries && Array.isArray(c.industries) && c.industries.length > 0 ? c.industries[0] : c.industry)||'').toLowerCase().includes('auto')?'automotive':((c.industries && Array.isArray(c.industries) && c.industries.length > 0 ? c.industries[0] : c.industry)||'').toLowerCase().includes('e-com')?'ecommerce':'technology'),
            natureOfBusiness: c.natureOfBusiness || [],
            companyTypes: c.companyTypes || [],
            region: c.region || null, // Include region field
            country: c.country || null // Include country field for Gulf detection
          }))
          // Fetch openings count per company using public jobs-by-company endpoint
          const withCounts = await Promise.all(baseMapped.map(async (co: any) => {
            try {
              const jobsResp = await apiService.getCompanyJobs(String(co.id))
              const list = Array.isArray((jobsResp as any)?.data) ? (jobsResp as any).data : (Array.isArray((jobsResp as any)?.data?.rows) ? (jobsResp as any).data.rows : [])
              return { ...co, openings: Array.isArray(list) ? list.length : 0 }
            } catch {
              return { ...co, openings: 0 }
            }
          }))
          
          // Add industry-based colors for top companies
          const withColors = withCounts.map((co: any) => ({
            ...co,
            color: getSectorColor(co.sector || 'other')
          }))
          
          console.log('🏢 Setting companies data:', withColors)
          setTopCompanies(withColors)
          setFeaturedCompanies(withCounts)
        } else {
          console.log('❌ No companies data found in response')
          setTopCompanies([])
          setFeaturedCompanies([])
        }
      } catch (error) {
        console.error('❌ Error fetching companies:', error)
        setTopCompanies([])
        setFeaturedCompanies([])
      }

      try {
        console.log('🔄 Fetching jobs from API...')
        const jobsResp = await apiService.getJobs({ limit: 12, status: 'active' })
        console.log('💼 Jobs API response:', jobsResp)
        const list = Array.isArray((jobsResp as any)?.data?.rows) ? (jobsResp as any).data.rows : (Array.isArray((jobsResp as any)?.data) ? (jobsResp as any).data : [])
        console.log(`✅ Found ${list.length} jobs`)
        const now = new Date()
        const mappedJobs = list
          .map((j: any) => ({
            id: j.id,
            title: j.title,
            company: j.companyName || j.company?.name || '',
            location: j.location || j.city || j.state || j.country || '—',
            experience: j.experienceLevel || [j.experienceMin, j.experienceMax].filter(Boolean).join('-'),
            salary: j.salary || (j.salaryMin && j.salaryMax ? `${j.salaryMin}-${j.salaryMax}` : ''),
            type: j.jobType || j.type || 'Full-time',
            skills: Array.isArray(j.skills) ? j.skills : [],
            logo: j.company?.logo || j.companyLogo || '/placeholder.svg?height=40&width=40',
            posted: j.createdAt || '',
            applicationDeadline: j.applicationDeadline || j.validTill || j.createdAt || '',
            applicants: j.applications || 0,
            urgent: j.isUrgent || j.is_urgent || false,
            sector: 'technology',
            // Hot Vacancy Premium Features
            isHotVacancy: j.isHotVacancy || j.ishotvacancy || false,
            urgentHiring: j.urgentHiring || j.urgenthiring || false,
            superFeatured: j.superFeatured || j.superfeatured || false,
          }))
          .filter((j: any) => {
            // Filter out expired jobs (where deadline is in the past)
            if (j.applicationDeadline) {
              const deadline = new Date(j.applicationDeadline)
              if (deadline < now) {
                console.log(`⏰ Filtering out expired job: ${j.title} (deadline: ${j.applicationDeadline})`)
                return false
              }
            }
            return true
          })
        setFeaturedJobs(mappedJobs)
        setTrendingJobRoles([])
        setStats((prev) => [
          { ...prev[0], value: String(mappedJobs.length) },
          { ...prev[1], value: String(companiesCountLocal) },
          prev[2],
          prev[3],
        ])
      } catch {
        setFeaturedJobs([])
      }
    }
    load()
    return () => controller.abort()
  }, [])

  // Auth check - redirect employers to employer dashboard
  useEffect(() => {
    if (loading) return; // Wait for auth to load
    
    if (user) {
      // If user is employer or admin, redirect to employer dashboard
      if (user.userType === 'employer' || user.userType === 'admin') {
        console.log('🔄 Employer/Admin detected on homepage, redirecting to employer dashboard')
        setIsRedirecting(true)
        router.replace(user.region === 'gulf' ? '/gulf-dashboard' : '/employer-dashboard')
        return
      }
      // If user is jobseeker, they can stay on homepage (no redirect needed)
    }
    // If no user (unauthenticated), they can stay on homepage
  }, [user, loading, router])

  // Show loading while redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-animated dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-20 pb-8 lg:pb-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Enhanced Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-indigo-800/5 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-indigo-800/20"></div>
        
        {/* Enhanced Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Layer A: far glow */}
          <div className="absolute -top-40 -right-40 w-[28rem] h-[28rem] rounded-full parallax-far" style={{ background: 'radial-gradient(50% 50% at 50% 50%, rgba(90,0,242,0.35) 0%, rgba(90,0,242,0) 100%)' }}></div>
          {/* Layer B: gradient strip */}
          <div className="absolute top-1/3 left-0 right-0 h-24 opacity-20 gradient-strip"></div>
          {/* Layer C: small particles placeholder (non-interactive) */}
          <div className="pointer-events-none absolute inset-0 opacity-20"></div>
        </div>

        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center py-8 lg:py-12">
          {/* Enhanced Animated Hero Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6 order-2 lg:order-1 text-center lg:text-left px-2 sm:px-4 lg:px-0 lg:pr-8 overflow-visible"
          >
            <AnimatePresence mode="wait">
              <motion.h1
                key={currentTextIndex}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 1.05 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className={`serif-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl mb-4 heading-gradient drop-shadow-lg leading-[1.35] pb-2 tracking-tight text-[#1E1E2F] dark:text-white inline-block`}
              >
                {heroTexts[currentTextIndex]}
              </motion.h1>
            </AnimatePresence>
            
            <AnimatePresence mode="wait">
              <motion.p
                key={currentTextIndex}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 1.05 }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeInOut" }}
                className="text-base sm:text-lg lg:text-xl text-[#5B5B6A] dark:text-slate-300 mb-4 sm:mb-6 max-w-[860px] mx-auto lg:mx-0 leading-relaxed font-medium px-4 sm:px-0"
              >
                {heroSubtitles[currentTextIndex]}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          {/* Enhanced Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
            className="mb-8 order-3 lg:order-2"
          >
            <div className="glass-20 soft-glow rounded-3xl p-4 sm:p-6 lg:p-7 max-w-[920px] mx-auto transform hover:-translate-y-1 hover:scale-[1.02] transition-transform duration-200 border-white/30"
                 style={{ background: "rgba(255,255,255,0.22)" }}>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-hover:text-blue-500 transition-colors duration-300" />
                  <Input
                    placeholder="Job title"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-12 h-12 sm:h-14 border-white/40 dark:border-slate-600 focus:border-blue-500 bg-white/40 dark:bg-slate-700/80 rounded-2xl text-base sm:text-lg font-medium focus:ring-2 focus:ring-blue-500/20 transition-colors duration-200 hover:border-white/60 dark:hover:border-slate-500 shadow-[inset_0_2px_8px_rgba(15,23,36,0.04)] focus:-translate-y-[3px] focus:shadow-[0_10px_24px_rgba(90,0,242,0.06)]"
                  />
                </div>
                <div className="relative flex-1 group">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-hover:text-blue-500 transition-colors duration-300" />
                  <Input
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-12 h-12 sm:h-14 border-white/40 dark:border-slate-600 focus:border-blue-500 bg-white/40 dark:bg-slate-700/80 rounded-2xl text-base sm:text-lg font-medium focus:ring-2 focus:ring-blue-500/20 transition-colors duration-200 hover:border-white/60 dark:hover:border-slate-500 shadow-[inset_0_2px_8px_rgba(15,23,36,0.04)] focus:-translate-y-[3px] focus:shadow-[0_10px_24px_rgba(90,0,242,0.06)]"
                  />
                </div>
                <Button 
                  onClick={handleSearch}
                  className="h-12 sm:h-14 px-6 sm:px-8 rounded-xl font-semibold text-white shadow-[0_12px_30px_rgba(90,0,242,0.18)] transition-transform duration-200 btn-shimmer btn-ripple text-sm sm:text-base"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search Jobs
                </Button>
              </div>

              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <span className="text-sm smallcaps text-[12px] text-slate-500 dark:text-slate-400 font-medium">Popular:</span>
                {["Software Engineer", "Sales Manager", "Marketing Specialist", "Business Analyst", "Content Writer", "Operations Manager"].map((skill, index) => (
                  <motion.button
                    key={skill}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                    onClick={() => setSearchQuery(skill)}
                    className="px-4 py-2 text-sm rounded-full bg-[rgba(10,12,20,0.03)] dark:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all duration-200 font-medium transform hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_6px_18px_rgba(20,16,48,0.08)] hover:outline hover:outline-1 hover:outline-[rgba(90,0,242,0.08)]"
                  >
                    {skill}
                  </motion.button>
                ))}
                <div className="basis-full text-[11px] tracking-wider text-slate-500/80 mt-1 smallcaps">Popular searches — updated daily</div>
              </div>
            </div>
          </motion.div>

          {/* Image Column */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="hidden"
          >
            {/* Image column intentionally hidden to remove empty white box */}
          </motion.div>
        </div>
      </section>

      {/* JobAtPace Premium Banner */}
      <div className="backdrop-blur-xl bg-white/55 dark:bg-slate-900/55 border-t border-white/30 dark:border-slate-700/40 shadow-[0_-10px_40px_rgba(20,16,48,0.08)] py-8 relative overflow-hidden -mt-10 md:-mt-16">
        {/* Subtle animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-40 gradient-strip"></div>
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/30 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/30 rounded-full blur-2xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <Link href="/job-at-pace">
            <div className="flex flex-col sm:flex-row items-center justify-between text-slate-900 dark:text-white cursor-pointer group">
              <div className="flex items-center mb-4 sm:mb-0">
                <div className="w-12 h-12 bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mr-4 group-hover:scale-105 transition-transform duration-300 shadow-[0_10px_24px_rgba(20,16,48,0.12)]">
                  <Zap className="w-6 h-6 text-[#5A00F2]" />
                      </div>
                <div>
                  <div className="font-bold text-lg sm:text-xl mb-1">JobAtPace Premium</div>
                  <div className="text-sm sm:text-base opacity-80">Get priority applications & exclusive jobs</div>
                </div>
                    </div>
                    <Button
                      size="lg"
                className="rounded-full px-8 py-3 font-semibold text-white bg-gradient-to-r from-[#5A00F2] to-[#4F9BFF] shadow-[0_0_18px_rgba(79,155,255,0.35)] hover:scale-[1.04] transition-transform"
                    >
                      Upgrade Now
                <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
            </Link>
        </div>
      </div>

      {/* Top Companies Hiring Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Dynamic gradient background based on companies */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-cyan-100/40 to-indigo-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-800"></div>
        {/* Industry-specific animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute top-20 left-20 w-40 h-40 bg-gradient-to-br ${topCompanies.length > 0 ? getSectorColor(topCompanies[0]?.sector || 'technology') + '/8' : 'from-emerald-300/8 to-cyan-300/8'} rounded-full blur-3xl animate-pulse`}></div>
          <div className={`absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br ${topCompanies.length > 1 ? getSectorColor(topCompanies[1]?.sector || 'technology') + '/8' : 'from-violet-300/8 to-purple-300/8'} rounded-full blur-3xl animate-pulse delay-500`}></div>
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br ${topCompanies.length > 2 ? getSectorColor(topCompanies[2]?.sector || 'technology') + '/6' : 'from-blue-300/6 to-indigo-300/6'} rounded-full blur-3xl animate-pulse delay-1000`}></div>
        </div>
        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="serif-heading text-4xl font-bold text-slate-900 dark:text-white mb-4">Top Companies Hiring</h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Explore opportunities with industry leaders and discover your next career move
            </p>
          </motion.div>

          {/* Companies Grid (3 per row) - Show only 6 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(topCompanies && topCompanies.length > 0 ? topCompanies.slice(0, 6) : Array(6).fill(null)).map((company, index) => (
                <motion.div
                key={company ? company.id : `top-skel-${index}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
              >
                {company ? (
                  <Link href={getCompanyRoute(company)}>
                    <Card className="w-full cursor-pointer border border-white/40 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden h-full">
                      <CardContent className="p-6 relative h-full">
                        <div className={`absolute inset-0 bg-gradient-to-br ${getSectorColor(company.sector)} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <Avatar className="w-12 h-12 bg-white/95 p-1.5 rounded-xl shadow-lg border border-slate-200/50">
                            <AvatarImage 
                              src={company.logo ? (company.logo.startsWith('http') ? company.logo : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}${company.logo}`) : "/placeholder.svg"} 
                              alt={company.name} 
                              className="object-contain w-full h-full"
                              onLoad={() => {
                                console.log('✅ Company logo loaded in top companies:', company.logo);
                              }}
                              onError={(e) => {
                                console.error('❌ Company logo failed in top companies:', company.logo);
                                const img = e.target as HTMLImageElement;
                                if (company.logo && !company.logo.startsWith('http')) {
                                  img.src = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${company.logo}`;
                                }
                              }}
                            />
                            <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 border border-slate-300">
                              {company.name ? company.name.substring(0, 2).toUpperCase() : '??'}
                            </AvatarFallback>
                          </Avatar>
                            <div className="flex items-center space-x-1">
                              {company.industries && company.industries.length > 0 ? (
                                company.industries.length > 3 ? (
                                  <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-white border-0 font-medium">
                                    Multi Industry
                                  </Badge>
                                ) : company.industries.length === 3 ? (
                                  <>
                                    <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-white border-0">
                                      {company.industries[0]}
                                    </Badge>
                                    <Badge className="bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300 border-0 text-xs">
                                      +2 more
                                    </Badge>
                                  </>
                                ) : company.industries.length === 2 ? (
                                  <>
                                    <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-white border-0">
                                      {company.industries[0]}
                                    </Badge>
                                    <Badge className="bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300 border-0 text-xs">
                                      +1 more
                                    </Badge>
                                  </>
                                ) : (
                                  <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-white border-0">
                                    {company.industries[0]}
                                  </Badge>
                                )
                              ) : (
                                <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-white border-0">
                                  {company.industry}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{company.name}</h3>
                          <div className="flex items-center justify-center mb-4">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < Math.floor(company.rating || 0)
                                      ? "text-yellow-400 fill-current"
                                      : "text-slate-300 dark:text-slate-600"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">
                              {company.rating || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <Button className="rounded-full bg-slate-900/80 dark:bg-white/10 text-white hover:bg-slate-900 transition-colors px-5">View Jobs</Button>
                            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                              <ArrowRight className="w-4 h-4 text-slate-700 dark:text-white" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ) : (
                  <div className="w-full h-full">
                    <div className="h-full rounded-2xl border border-white/40 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-sm p-6 animate-pulse">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 rounded-xl bg-slate-200/70 dark:bg-slate-700/70" />
                        <div className="w-20 h-6 rounded-full bg-slate-200/70 dark:bg-slate-700/70" />
                      </div>
                      <div className="h-5 w-2/3 rounded bg-slate-200/70 dark:bg-slate-700/70 mb-3" />
                      <div className="h-4 w-1/2 rounded bg-slate-200/70 dark:bg-slate-700/70 mb-8" />
                      <div className="h-9 w-full rounded-full bg-slate-200/70 dark:bg-slate-700/70" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
                        </div>
                        
          <div className="text-center mt-8">
            <Link href="/companies">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-2xl">
                View More Companies
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Dynamic gradient background based on jobs */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 via-teal-100/40 to-green-100/50 dark:from-slate-900 dark:via-slate-800/70 dark:to-slate-800"></div>
        {/* Industry-specific animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute top-12 left-12 w-36 h-36 bg-gradient-to-br ${featuredJobs.length > 0 ? getSectorColor(featuredJobs[0]?.sector || 'technology') + '/6' : 'from-indigo-300/6 to-purple-300/6'} rounded-full blur-3xl animate-pulse`}></div>
          <div className={`absolute bottom-12 right-12 w-40 h-40 bg-gradient-to-br ${featuredJobs.length > 1 ? getSectorColor(featuredJobs[1]?.sector || 'technology') + '/6' : 'from-blue-300/6 to-cyan-300/6'} rounded-full blur-3xl animate-pulse delay-500`}></div>
          <div className={`absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br ${featuredJobs.length > 2 ? getSectorColor(featuredJobs[2]?.sector || 'technology') + '/4' : 'from-violet-300/4 to-pink-300/4'} rounded-full blur-2xl animate-pulse delay-1000`}></div>
          <div className={`absolute bottom-1/3 right-1/4 w-28 h-28 bg-gradient-to-br ${featuredJobs.length > 3 ? getSectorColor(featuredJobs[3]?.sector || 'technology') + '/4' : 'from-emerald-300/4 to-teal-300/4'} rounded-full blur-2xl animate-pulse delay-300`}></div>
        </div>
        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="serif-heading text-4xl font-bold text-slate-900 dark:text-white mb-4">Featured Jobs</h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Hand-picked opportunities from top companies worldwide
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(featuredJobs && featuredJobs.length > 0 ? featuredJobs.slice(0, 6) : Array(6).fill(null)).map((job, index) => (
              <motion.div
                key={job ? job.id : `job-skel-${index}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="transform transition-transform duration-300 ease-out hover:-translate-y-2"
              >
                {job ? (
                  <Link href={`/jobs/${job.id}`}>
                    <Card className="group cursor-pointer border border-white/40 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden h-full">
                      <CardContent className="p-4 relative h-full flex flex-col justify-between">
                        <div className={`absolute inset-0 bg-gradient-to-br ${getSectorColor(job.sector)} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                        
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <Avatar className="w-10 h-10 ring-2 ring-white/50 group-hover:ring-[3px] transition-all duration-300">
                              <AvatarImage src={job.logo} alt={job.company} />
                              <AvatarFallback className="text-xs font-bold">{job.company && job.company[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-1">
                              {(job as any).isHotVacancy && (
                                <Badge className="bg-red-100 text-red-800 border-red-200 text-xs animate-pulse">
                                  🔥 Hot
                                </Badge>
                              )}
                              {((job as any).urgentHiring || job.urgent) && (
                                <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                                  URGENT
                                </Badge>
                              )}
                              {(job as any).superFeatured && (
                                <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                                  ⭐ Super
                                </Badge>
                              )}
                            </div>
                          </div>

                          <h3 className="font-bold text-slate-900 dark:text-white mb-1 text-base group-hover:text-blue-600 transition-colors line-clamp-2">
                            {job.title}
                        </h3>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-400 mb-2">{job.company}</p>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-400">
                              <div className="flex items-center">
                                <MapPin className="w-3 h-3 mr-2" />
                                <span className="truncate">{job.location}</span>
                          </div>
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                <span className="truncate">
                                  {job.applicationDeadline 
                                    ? new Date(job.applicationDeadline).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric' 
                                      })
                                    : new Date(job.posted).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric' 
                                      })
                                  }
                                </span>
                        </div>
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-400">
                              <div className="flex items-center">
                                <Briefcase className="w-3 h-3 mr-2" />
                                <span className="truncate">{job.experience || 'Experience not specified'}</span>
                              </div>
                              <div className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                <span className="truncate">{job.applicants}</span>
                              </div>
                            </div>
                            <div className="flex items-center text-xs font-bold text-slate-700 dark:text-slate-400">
                              <span className="truncate capitalize">{job.type ? job.type.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Full-time'}</span>
                            </div>
                            <div className="flex items-center text-xs font-bold text-slate-700 dark:text-slate-400">
                              <IndianRupee className="w-3 h-3 mr-2" />
                              <span className="truncate">{job.salary ? (job.salary.includes('LPA') ? job.salary : `${job.salary} LPA`) : 'Salary not specified'}</span>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {job.skills.slice(0, 2).map((skill: string, skillIndex: number) => (
                            <Badge
                              key={skillIndex}
                              variant="secondary"
                                className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {job.skills.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{job.skills.length - 2} more
                            </Badge>
                          )}
                          </div>
                        </div>
                        
                      <div>
                          <Button
                          className={`w-full bg-gradient-to-r ${getSectorColor(job.sector)} hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-md transition-colors duration-300 text-sm py-2`}
                          >
                          View Job
                          </Button>
                      </div>
                    </CardContent>
                  </Card>
                    </Link>
                ) : (
                  <div className="w-full h-full">
                    <div className="h-full rounded-2xl border border-white/40 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-sm p-6 animate-pulse">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 rounded-xl bg-slate-200/70 dark:bg-slate-700/70" />
                        <div className="w-20 h-6 rounded-full bg-slate-200/70 dark:bg-slate-700/70" />
                      </div>
                      <div className="h-5 w-2/3 rounded bg-slate-200/70 dark:bg-slate-700/70 mb-3" />
                      <div className="h-4 w-1/2 rounded bg-slate-200/70 dark:bg-slate-700/70 mb-8" />
                      <div className="h-9 w-full rounded-full bg-slate-200/70 dark:bg-slate-700/70" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/jobs">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-2xl">
                View More Jobs
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Companies */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Dynamic gradient background based on featured companies */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 via-pink-100/40 to-rose-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-800"></div>
        {/* Industry-specific animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute top-20 left-20 w-40 h-40 bg-gradient-to-br ${featuredCompanies.length > 0 ? getSectorColor(featuredCompanies[0]?.sector || 'technology') + '/6' : 'from-emerald-300/6 to-teal-300/6'} rounded-full blur-3xl animate-pulse`}></div>
          <div className={`absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br ${featuredCompanies.length > 1 ? getSectorColor(featuredCompanies[1]?.sector || 'technology') + '/6' : 'from-green-300/6 to-emerald-300/6'} rounded-full blur-3xl animate-pulse delay-500`}></div>
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br ${featuredCompanies.length > 2 ? getSectorColor(featuredCompanies[2]?.sector || 'technology') + '/4' : 'from-teal-300/4 to-cyan-300/4'} rounded-full blur-3xl animate-pulse delay-1000`}></div>
        </div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="serif-heading text-4xl font-bold text-slate-900 dark:text-white mb-4">Featured Companies</h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Discover opportunities with the most innovative and respected companies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
            {(featuredCompanies && featuredCompanies.length > 0 ? featuredCompanies.slice(0, 4) : Array(4).fill(null)).map((company, index) => (
              <div
                key={company ? company.id : `feat-skel-${index}`}
                className="group transform transition-transform duration-300 hover:-translate-y-2"
              >
                {company ? (
                <Link href={getCompanyRoute(company)}>
                    <Card className="cursor-pointer border border-white/40 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden h-full">
                    <CardContent className="p-6 text-center relative h-full flex flex-col justify-between">
                        <div className={`absolute inset-0 bg-gradient-to-br ${getSectorColor(company.sector)} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                      <div>
                          <Avatar className="w-16 h-16 mx-auto mb-4 ring-2 ring-white/50 group-hover:ring-[3px] group-hover:scale-110 transition-all duration-300 shadow">
                          <AvatarImage src={company.logo} alt={company.name} />
                          <AvatarFallback className="text-lg font-bold">{company.name[0]}</AvatarFallback>
                        </Avatar>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-lg group-hover:text-blue-600 transition-colors duration-300">
                          {company.name}
                        </h3>
                        <div className="flex items-center flex-wrap gap-1 mb-2">
                          {company.industries && company.industries.length > 0 ? (
                            company.industries.length > 3 ? (
                              <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full font-medium">
                                Multi Industry
                              </span>
                            ) : company.industries.length === 3 ? (
                              <>
                                <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                                  {company.industries[0]}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-500 bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded-full">
                                  +2 more
                                </span>
                              </>
                            ) : company.industries.length === 2 ? (
                              <>
                                <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                                  {company.industries[0]}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-500 bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded-full">
                                  +1 more
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                                {company.industries[0]}
                              </span>
                            )
                          ) : (
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {company.industry}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 mb-4">
                          <div className="flex items-center flex-wrap gap-1">
                            {Array.isArray(company.natureOfBusiness) && company.natureOfBusiness.length > 0 ? (
                              company.natureOfBusiness.map((nature: string, index: number) => (
                                <span key={index} className="text-xs text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                                  {nature.replace(/\([^)]*\)/g, '').trim()}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-500 dark:text-slate-500">Not specified</span>
                            )}
                        </div>
                          <div className="flex items-center flex-wrap gap-1">
                            {Array.isArray(company.companyTypes) && company.companyTypes.length > 0 ? (
                              company.companyTypes.map((type: string, index: number) => (
                                <span key={index} className="text-xs text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                                  {type.replace('Software as a Service', 'SaaS').replace('Software as Service', 'SaaS')}
                          </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-500 dark:text-slate-500">Not specified</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-center text-sm mb-4">
                          <span className="font-semibold text-slate-900 dark:text-white">{company.activeJobsCount || company.openings || 0} openings</span>
                          </div>
                          <div className={`w-0 group-hover:w-full h-[2px] bg-gradient-to-r ${getSectorColor(company.sector)} transition-all duration-300 mx-auto rounded-full`} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                ) : (
                  <div className="w-full h-full">
                    <div className="h-full rounded-2xl border border-white/40 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-sm p-6 animate-pulse">
                      <div className="w-16 h-16 rounded-full bg-slate-200/70 dark:bg-slate-700/70 mx-auto mb-6" />
                      <div className="h-5 w-1/2 rounded bg-slate-200/70 dark:bg-slate-700/70 mx-auto mb-3" />
                      <div className="h-4 w-1/3 rounded bg-slate-200/70 dark:bg-slate-700/70 mx-auto mb-8" />
                      <div className="h-2 w-3/4 rounded bg-slate-200/70 dark:bg-slate-700/70 mx-auto" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/companies?featured=true">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-2xl">
                View More Companies
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Job Roles */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Enhanced gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-200/90 to-blue-200/85 dark:from-slate-900 dark:via-slate-800/60 dark:to-slate-800"></div>
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-16 right-16 w-28 h-28 bg-gradient-to-br from-orange-400/8 to-red-400/8 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-16 left-16 w-32 h-32 bg-gradient-to-br from-yellow-400/8 to-orange-400/8 rounded-full blur-2xl animate-pulse delay-700"></div>
          <div className="absolute top-1/3 right-1/3 w-20 h-20 bg-gradient-to-br from-green-400/6 to-emerald-400/6 rounded-full blur-2xl animate-pulse delay-300"></div>
        </div>
        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="serif-heading text-4xl font-bold text-slate-900 dark:text-white mb-4">Trending Job Roles</h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Explore the most in-demand positions across various industries
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-6">
            {trendingJobRoles.slice(0, showAllJobRoles ? trendingJobRoles.length : 12).map((role, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="transform transition-transform duration-300 ease-out hover:-translate-y-2 will-change-transform group"
              >
                <Link href={`/jobs?category=${role.category}`}>
                  <Card className="group cursor-pointer border border-white/40 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl hover:shadow-lg transition-shadow duration-300 overflow-hidden h-full">
                    <CardContent className="p-6 text-center relative h-full flex flex-col justify-between">
                      <div className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                      <div className="relative z-10">
                        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 ease-out">
                          {role.icon}
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-lg group-hover:text-blue-600 transition-colors duration-200 ease-out">
                          {role.name}
                        </h3>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 font-medium">
                          {role.openings}
                        </p>
                      </div>

                      <div>
                        <div className={`w-0 group-hover:w-full h-[2px] bg-gradient-to-r ${role.color} transition-all duration-300 ease-out mx-auto rounded-full relative z-10`} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Show More/Less Button */}
          {trendingJobRoles.length > 12 && (
            <div className="text-center mt-8">
              <Button
                onClick={() => setShowAllJobRoles(!showAllJobRoles)}
                variant="outline"
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 px-6 py-3 rounded-2xl"
              >
                <span className="mr-2">
                  {showAllJobRoles ? "Show Less" : "Show More"}
                </span>
                <motion.div
                  animate={{ rotate: showAllJobRoles ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </Button>
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/jobs">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-2xl">
                View All Job Categories
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-4 sm:py-6 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-indigo-600/5"></div>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-br from-indigo-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
                        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-6 h-6 text-white" />
                      </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">JobPortal</span>
                      </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                India's leading job portal connecting talent with opportunities. Find your dream job or hire the perfect
                candidate.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center hover:bg-blue-600/20 transition-colors cursor-pointer">
                  <span className="text-sm font-bold">f</span>
                          </div>
                <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center hover:bg-blue-600/20 transition-colors cursor-pointer">
                  <span className="text-sm font-bold">t</span>
                      </div>
                <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center hover:bg-blue-600/20 transition-colors cursor-pointer">
                  <span className="text-sm font-bold">in</span>
                      </div>
                    </div>
          </div>

            <div>
              <h3 className="font-semibold mb-6 text-white">For Job Seekers</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/jobs" className="text-slate-300 hover:text-white transition-colors duration-200 flex items-center group">
                    <span className="w-1 h-1 bg-blue-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Browse Jobs
                  </Link>
                </li>
                <li>
                  <Link href="/companies" className="text-slate-300 hover:text-white transition-colors duration-200 flex items-center group">
                    <span className="w-1 h-1 bg-blue-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Browse Companies
                  </Link>
                </li>
                <li>
                  <Link href="/gulf-opportunities" className="text-slate-300 hover:text-white transition-colors duration-200 flex items-center group">
                    <span className="w-1 h-1 bg-blue-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Gulf Opportunities
                  </Link>
                </li>
                <li>
                  <Link href="/job-at-pace" className="text-slate-300 hover:text-white transition-colors duration-200 flex items-center group">
                    <span className="w-1 h-1 bg-blue-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent font-medium">Job at Pace Premium</span>
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-slate-300 hover:text-white transition-colors duration-200 flex items-center group">
                    <span className="w-1 h-1 bg-blue-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-slate-300 hover:text-white transition-colors duration-200 flex items-center group">
                    <span className="w-1 h-1 bg-blue-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Login
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-6 text-white">For Employers</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/employer-dashboard/post-job" className="text-slate-300 hover:text-white transition-colors duration-200 flex items-center group">
                    <span className="w-1 h-1 bg-blue-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Post a Job
                      </Link>
                    </li>
                <li>
                  <Link href="/employer-dashboard/requirements" className="text-slate-300 hover:text-white transition-colors duration-200 flex items-center group">
                    <span className="w-1 h-1 bg-blue-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Search Resume Database
                  </Link>
                </li>
                <li>
                  <Link href="/employer-dashboard/manage-jobs" className="text-slate-300 hover:text-white transition-colors duration-200 flex items-center group">
                    <span className="w-1 h-1 bg-blue-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Manage Jobs
                  </Link>
                </li>
                <li>
                  <Link href="/employer-register" className="text-slate-300 hover:text-white transition-colors duration-200 flex items-center group">
                    <span className="w-1 h-1 bg-blue-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Employer Registration
                  </Link>
                </li>
                </ul>
              </div>

            <div>
              <h3 className="font-semibold mb-6 text-white">Contact Us</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-center text-slate-300">
                  <div className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-xs">📧</span>
              </div>
                  <span>support@jobportal.com</span>
                </div>
                <div className="flex items-center text-slate-300">
                  <div className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-xs">📞</span>
                  </div>
                  <span>+91 80-4040-0000</span>
                </div>
                <div className="flex items-center text-slate-300">
                  <div className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-xs">📍</span>
                  </div>
                  <span>Bangalore, India</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700/50 pt-8 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-slate-400">
            <p>© 2025 JobPortal. All rights reserved. Made with ❤️ in India</p>
              <div className="flex items-center space-x-6 mt-4 sm:mt-0">
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Registration Chatbot */}
      <RegistrationChatbot />
    </div>
  )
}
