const getBaseUrl = () => {
  // If explicitly set in environment, use that
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;

  // Try to detect production environment in browser
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.endsWith('.vercel.app') || hostname.includes('carrerzone')) {
      return 'https://carrerzone-j03z.onrender.com';
    }
  }

  // Default to localhost for development
  return 'http://localhost:8000';
};

export const BASE_URL = getBaseUrl();
export const API_BASE_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

// Utility function to construct avatar URLs correctly
export const constructAvatarUrl = (avatarPath: string | null | undefined): string | undefined => {
  if (!avatarPath) return undefined;

  // If it's already a full URL, return as is
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }

  // If it's a relative path, prepend the base URL
  const base = BASE_URL.endsWith('/api') ? BASE_URL.replace('/api', '') : BASE_URL;
  return `${base}${avatarPath}`;
};

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'jobseeker' | 'employer' | 'admin' | 'superadmin';
  region?: 'india' | 'gulf' | 'other';
  regions?: string[]; // Array of regions for multi-portal access
  isEmailVerified: boolean;
  isPhoneVerified?: boolean;
  accountStatus: string;
  avatar?: string;
  phone?: string;
  currentLocation?: string;
  headline?: string;
  summary?: string;
  profileCompletion?: number;
  lastLoginAt?: string;
  companyId?: string;
  designation?: string;
  skills?: string[];
  languages?: string[];
  expectedSalary?: number;
  currentSalary?: number;
  experienceYears?: number;
  noticePeriod?: number;
  willingToRelocate?: boolean;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  profileVisibility?: 'public' | 'private' | 'connections_only';
  contactVisibility?: 'public' | 'private' | 'connections_only';
  certifications?: any[];
  socialLinks?: any;
  preferences?: any;
  oauthProvider?: string;
  oauthId?: string;
  createdAt?: string;
  updatedAt?: string;
  // Professional Details
  currentCompany?: string;
  currentRole?: string;
  highestEducation?: string;
  fieldOfStudy?: string;
  // Preferred Professional Details
  preferredJobTitles?: string[];
  preferredIndustries?: string[];
  preferredLocations?: string[];
  preferredCompanySize?: string;
  preferredWorkMode?: string | string[];
  preferredEmploymentType?: string;
  workExperiences?: WorkExperience[];
}

export interface WorkExperience {
  id?: string;
  userId?: string;
  companyName?: string;
  jobTitle: string;
  currentDesignation?: string;
  location?: string;
  startDate: string;
  endDate?: string | null;
  isCurrent?: boolean;
  description?: string;
  achievements?: string[];
  skills?: string[];
  salary?: number;
  salaryCurrency?: string;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance';
  createdAt?: string;
  updatedAt?: string;
}

export interface Company {
  id: string;
  name: string;
  industries: string[]; // Primary field for multiple industries
  companySize: string;
  website?: string;
  email: string;
  phone?: string;
  region?: string;
  logo?: string;
  placeholderImage?: string;
  isActive?: boolean;
  isVerified?: boolean;
  verificationStatus?: string;
  industry?: string;
  size?: string;
  rating?: number;
  reviews?: number;
  about?: string;
  founded?: string;
  description?: string;
}

export interface AuthResponse {
  user: User;
  company?: Company;
  token: string;
  redirectTo?: string;
}

export interface SignupData {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  experience?: string;
  region?: 'india' | 'gulf' | 'other';
  regions?: string[];
  preferences?: any;
  portalSource?: string;
  agreeToTerms: boolean;
  subscribeNewsletter?: boolean;
}

export interface EmployerSignupData {
  fullName: string;
  email: string;
  password: string;
  companyName?: string; // Optional when joining existing company
  companyId?: string; // Optional when creating new company
  phone: string;
  companySize?: string;
  industries: string[]; // Always use array for industries
  website?: string;
  region?: string;
  role?: string;
  companyAccountType?: string; // For agency registration
  agreeToTerms: boolean;
  subscribeUpdates?: boolean;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
  loginType?: 'jobseeker' | 'employer' | 'admin';
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  currentLocation?: string;
  headline?: string;
  summary?: string;
  designation?: string;
  expectedSalary?: number;
  experienceYears?: number;
  noticePeriod?: number;
  willingToRelocate?: boolean;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  profileVisibility?: 'public' | 'private' | 'connections_only';
  contactVisibility?: 'public' | 'private' | 'connections_only';
  skills?: string[];
  languages?: any[];
  certifications?: any[];
  socialLinks?: any;
  preferences?: any;
  preferredLocations?: string[];
  // Professional Details
  currentCompany?: string;
  currentRole?: string;
  highestEducation?: string;
  fieldOfStudy?: string;
  // Preferred Professional Details
  preferredJobTitles?: string[];
  preferredIndustries?: string[];
  preferredCompanySize?: string;
  preferredWorkMode?: string;
  preferredEmploymentType?: string;
  currentSalary?: number;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  company?: Company;
  // New fields from step 2
  role?: string;
  industryType?: string;
  roleCategory?: string;
  employmentType?: string;
  department?: string;
  education?: string;
  applicationDeadline?: string;
  // Hot Vacancy Premium Features
  isHotVacancy?: boolean;
  urgentHiring?: boolean;
  multipleEmailIds?: string[];
  boostedSearch?: boolean;
  searchBoostLevel?: 'standard' | 'premium' | 'super' | 'city-specific';
  citySpecificBoost?: string[];
  videoBanner?: string;
  whyWorkWithUs?: string;
  companyReviews?: string[];
  autoRefresh?: boolean;
  refreshDiscount?: number;
  attachmentFiles?: string[];
  officeImages?: string[];
  companyProfile?: string;
  proactiveAlerts?: boolean;
  alertRadius?: number;
  alertFrequency?: 'immediate' | 'daily' | 'weekly';
  featuredKeywords?: string[];
  customBranding?: any;
  superFeatured?: boolean;
  tierLevel?: 'basic' | 'premium' | 'enterprise' | 'super-premium';
  externalApplyUrl?: string;
  hotVacancyPrice?: number;
  hotVacancyCurrency?: string;
  hotVacancyPaymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  // Agency posting fields
  isAgencyPosted?: boolean;
  hiringCompanyId?: string;
  postedByAgencyId?: string;
  agencyDescription?: string;
  authorizationId?: string;
  HiringCompany?: Company;
  PostedByAgency?: Company;
  // Additional fields
  status?: string;
  experience?: string;
  skills?: string[];
  views?: number;
  applications?: number;
  similarityScore?: number;
  createdAt?: string;
  updatedAt?: string;
  // Gulf and common fields
  employer?: any;
  employerId?: string;
  employer_id?: string;
  createdBy?: string;
  created_by?: string;
  applicationsCount?: number;
  validTill?: string;
  valid_till?: string;
  application_deadline?: string;
  jobType?: string;
  type?: string;
  remoteWork?: string;
  photos?: any[];
  duration?: string;
  startDate?: string;
  workMode?: string;
  learningObjectives?: string[];
  mentorship?: string;
  requirements?: string | string[];
  benefits?: string | string[];
  salary?: string;
  metadata?: any;
  companyId?: string;
  experienceLevel?: string;
  industry?: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  status: 'applied' | 'reviewing' | 'shortlisted' | 'interviewed' | 'offered' | 'hired' | 'rejected' | 'withdrawn';
  coverLetter?: string;
  expectedSalary?: number;
  appliedAt: string;
  job?: Job;
}

export interface JobAlert {
  id: string;
  userId: string;
  name: string;
  keywords?: string[];
  locations?: string[];
  categories?: string[];
  experienceLevel?: string;
  jobType?: string[];
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  remoteWork?: 'on_site' | 'hybrid' | 'remote' | 'any';
  maxResults?: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  lastSentAt?: string;
  nextSendAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobBookmark {
  id: string;
  userId: string;
  jobId: string;
  folder?: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  isApplied: boolean;
  job?: Job;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  isPublic: boolean;
  tags: string[];
  templateData: JobTemplateData;
  createdBy: string;
  companyId: string;
  usageCount: number;
  lastUsedAt?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  company?: {
    id: string;
    name: string;
  };
}

export interface JobTemplateData {
  // Basic Info (Step 1)
  title: string;
  companyName: string;
  department: string;
  location: string;
  type: string;
  experience: string;
  salary: string;
  description: string;
  requirements: string;
  benefits: string;
  skills: string[];
  role: string;
  industryType: string;
  roleCategory: string;
  education: string[];
  employmentType: string;

  // Consultancy fields
  postingType: 'company' | 'consultancy';
  consultancyName: string;
  hiringCompanyName: string;
  hiringCompanyIndustry: string;
  hiringCompanyDescription: string;
  showHiringCompanyDetails: boolean;

  // Hot Vacancy Premium Features
  isHotVacancy: boolean;
  urgentHiring: boolean;
  multipleEmailIds: string[];
  boostedSearch: boolean;
  searchBoostLevel: string;
  citySpecificBoost: string[];
  videoBanner: string;
  whyWorkWithUs: string;
  companyReviews: string[];
  autoRefresh: boolean;
  refreshDiscount: number;
  attachmentFiles: string[];
  officeImages: string[];
  companyProfile: string;
  proactiveAlerts: boolean;
  alertRadius: number;
  alertFrequency: string;
  featuredKeywords: string[];
  customBranding: any;
  superFeatured: boolean;
  tierLevel: string;
  externalApplyUrl: string;
  hotVacancyPrice: number;
  hotVacancyCurrency: string;
  hotVacancyPaymentStatus: string;

  // Critical Premium Hot Vacancy Features
  urgencyLevel: string;
  hiringTimeline: string;
  maxApplications: number;
  applicationDeadline: string;
  pricingTier: string;
  price: number;
  currency: string;
  paymentId: string;
  paymentDate: string;
  priorityListing: boolean;
  featuredBadge: boolean;
  unlimitedApplications: boolean;
  advancedAnalytics: boolean;
  candidateMatching: boolean;
  directContact: boolean;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  impressions: number;
  clicks: number;
}

export interface CreateJobTemplateRequest {
  name: string;
  description?: string;
  category: string;
  isPublic?: boolean;
  tags?: string[];
  templateData: JobTemplateData;
}

export interface UpdateJobTemplateRequest {
  name?: string;
  description?: string;
  category?: string;
  isPublic?: boolean;
  tags?: string[];
  templateData?: Partial<JobTemplateData>;
}

export interface DashboardStats {
  applicationCount: number;
  profileViews: number;
  recentApplications: JobApplication[];
  // Employer-specific stats
  activeJobs?: number;
  totalApplications?: number;
  hiredCandidates?: number;
}

export interface SearchHistory {
  id: string;
  searchQuery: any;
  filters: any;
  createdAt: string;
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  summary?: string;
  objective?: string;
  skills: string[];
  languages: any[];
  certifications: any[];
  projects: any[];
  achievements: any[];
  isDefault: boolean;
  isPublic: boolean;
  views: number;
  downloads: number;
  lastUpdated: string;
  metadata?: any;
}

export interface CoverLetter {
  id: string;
  userId: string;
  title: string;
  content?: string;
  summary?: string;
  isDefault: boolean;
  isPublic: boolean;
  views: number;
  downloads: number;
  lastUpdated: string;
  metadata?: any;
}

export interface Requirement {
  id: string;
  title: string;
  description: string;
  location: string;
  companyId: string;
  createdBy: string;
  experience?: string;
  experienceMin?: number;
  experienceMax?: number;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance';
  skills?: string[];
  keySkills?: string[];
  education?: string;
  industry?: string;
  department?: string;
  validTill?: string;
  noticePeriod?: string;
  remoteWork?: 'on-site' | 'remote' | 'hybrid';
  travelRequired?: boolean;
  shiftTiming?: 'day' | 'night' | 'rotational' | 'flexible';
  benefits?: string[];
  candidateDesignations?: string[];
  candidateLocations?: string[];
  excludeLocations?: string[];
  includeWillingToRelocate?: boolean;
  currentSalaryMin?: number;
  currentSalaryMax?: number;
  includeNotMentioned?: boolean;
  status: 'draft' | 'active' | 'paused' | 'closed';
  isUrgent?: boolean;
  isFeatured?: boolean;
  views?: number;
  matches?: number;
  applications?: number;
  publishedAt?: string;
  closedAt?: string;
  tags?: string[];
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

class ApiService {
  private baseURL: string
  private authToken: string | null = null
  private requestQueue: Map<string, Promise<any>> = new Map()
  private lastRequestTime: Map<string, number> = new Map()
  private readonly MIN_REQUEST_INTERVAL = 2000 // 2 seconds between requests to same endpoint (balanced for rate limiting)

  constructor() {
    this.baseURL = API_BASE_URL
    // Initialize token from localStorage if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        this.authToken = token
      }
    }
  }

  // Rate limiting helper
  private async throttleRequest(endpoint: string): Promise<void> {
    const now = Date.now()
    const lastRequest = this.lastRequestTime.get(endpoint) || 0
    const timeSinceLastRequest = now - lastRequest

    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.lastRequestTime.set(endpoint, Date.now())
  }

  // Deduplicate requests to same endpoint
  private async makeRequest<T>(endpoint: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if there's already a request in progress for this endpoint
    if (this.requestQueue.has(endpoint)) {
      console.log(`🔄 Request to ${endpoint} already in progress, waiting...`)
      return this.requestQueue.get(endpoint)!
    }

    // Throttle requests to prevent rate limiting
    await this.throttleRequest(endpoint)

    // Create the request promise
    const requestPromise = requestFn()

    // Store it in the queue
    this.requestQueue.set(endpoint, requestPromise)

    try {
      const result = await requestPromise
      return result
    } finally {
      // Remove from queue when done
      this.requestQueue.delete(endpoint)
    }
  }
  private getAuthHeaders(): HeadersInit {
    // Use internal authToken first, fallback to localStorage
    const token = this.authToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    return headers;
  }

  private getHeaders(): HeadersInit {
    // Use internal authToken first, fallback to localStorage
    const token = this.authToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    return headers;
  }

  // HTTP Methods
  private async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest(endpoint, async () => {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<T>(response);
    });
  }

  private async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest(endpoint, async () => {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });
      return this.handleResponse<T>(response);
    });
  }

  private async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest(endpoint, async () => {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });
      return this.handleResponse<T>(response);
    });
  }

  private async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest(endpoint, async () => {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });
      return this.handleResponse<T>(response);
    });
  }

  private async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest(endpoint, async () => {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<T>(response);
    });
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const url = response.url;
    console.log('🔍 handleResponse - Starting with URL:', url, 'Status:', response.status);

    // Basic error check
    if (!response.ok) {
      console.log('❌ Response not OK:', response.status, response.statusText);
    }

    // Simple fallback logging in case the main logging fails
    try {
      console.log('🔍 handleResponse - Processing response:', {
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
    } catch (logError) {
      console.log('🔍 handleResponse - Basic info:', url, response.status, response.statusText);
    }

    try {
      const responseClone = response.clone()
      let data: any

      try {
        // Detect opaque/network errors (often CORS or network failure)
        if ((response as any).type === 'opaque' || response.status === 0) {
          console.error('❌ Network/CORS error:', { url, type: (response as any).type, status: response.status })
          return {
            success: false,
            message: 'Network or CORS error. Please ensure the API server allows this origin and is reachable.',
            errors: ['NETWORK_OR_CORS_ERROR']
          } as ApiResponse<T>
        }

        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const textContent = await responseClone.text().catch(() => '')
          console.warn('⚠️ Non-JSON response received:', textContent)
          if (response.ok) {
            return {
              success: true,
              message: 'Response received',
              data: textContent as any,
            } as ApiResponse<T>
          }
          return {
            success: false,
            message: `Request failed (${response.status}): ${response.statusText}`,
            errors: ['INVALID_RESPONSE'],
          } as ApiResponse<T>
        }

        data = await response.json()
      } catch (error) {
        console.error('❌ Failed to parse response as JSON:', error)
        const textContent = await responseClone.text().catch(() => '')
        if (textContent) console.error('❌ Response content:', textContent)
        return {
          success: false,
          message: `Server error (${response.status}): ${response.statusText}. Please try again later.`,
          errors: ['SERVER_ERROR'],
        } as ApiResponse<T>
      }

      console.log('🔍 handleResponse - Parsed data:', data);

      if (!response.ok) {
        // If parsed body is empty object, try to capture raw text for better diagnostics
        let rawText = '';
        let bodyForLog = data;

        try {
          if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
            rawText = await responseClone.text().catch(() => '');
            bodyForLog = (rawText && rawText.trim().length > 0) ? rawText : 'Empty response body';
          }

          // Safely stringify the body for logging
          let safeBodyForLog = bodyForLog;
          try {
            if (bodyForLog === null || bodyForLog === undefined) {
              safeBodyForLog = 'null/undefined response body';
            } else if (typeof bodyForLog === 'string') {
              safeBodyForLog = bodyForLog;
            } else if (typeof bodyForLog === 'object') {
              if (Object.keys(bodyForLog).length === 0) {
                safeBodyForLog = 'Empty object response body';
              } else {
                safeBodyForLog = JSON.stringify(bodyForLog);
              }
            } else {
              safeBodyForLog = String(bodyForLog);
            }
          } catch (stringifyError) {
            safeBodyForLog = `[Unable to stringify response body: ${stringifyError instanceof Error ? stringifyError.message : String(stringifyError)}]`;
          }

          // Safe error logging with individual try-catch blocks
          try {
            console.error('❌ API error - URL:', url);
          } catch (e) { }

          try {
            console.error('❌ API error - Status:', response.status, response.statusText);
          } catch (e) { }

          try {
            console.error('❌ API error - Body:', safeBodyForLog);
          } catch (e) { }

          try {
            console.error('❌ API error - Headers:', Object.fromEntries(response.headers.entries()));
          } catch (e) { }

          try {
            console.error('❌ API error - Timestamp:', new Date().toISOString());
          } catch (e) { }

        } catch (logError) {
          // Fallback error logging
          try {
            console.error('❌ API error (logging failed) - URL:', url);
          } catch (e) { }

          try {
            console.error('❌ API error (logging failed) - Status:', response.status);
          } catch (e) { }

          try {
            console.error('❌ API error (logging failed) - LogError:', logError instanceof Error ? logError.message : String(logError));
          } catch (e) { }
        }

        // Handle rate limiting specifically
        if (response.status === 429) {
          console.warn('⚠️ Rate limit exceeded - too many requests');

          // Add exponential backoff for rate-limited requests
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;

          console.log(`⏳ Waiting ${waitTime}ms before retrying...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));

          return {
            success: false,
            message: `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`,
            errors: ['RATE_LIMIT']
          } as ApiResponse<T>;
        }

        // Handle validation errors
        if (data && (Array.isArray((data as any).errors))) {
          const errorMessages = data.errors.map((err: any) => err.msg || err.message).join(', ');
          return {
            success: false,
            message: `Validation failed: ${errorMessages}`,
            errors: data.errors
          } as ApiResponse<T>;
        }

        // Provide clearer defaults for common auth/permission/not-found cases
        if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
          const defaultMessages: Record<number, string> = {
            401: 'Authentication required. Please log in again.',
            403: 'Access denied. You do not have permission to perform this action.',
            404: 'Not found. The requested resource does not exist.',
          };
          // Prefer any raw text from server if available
          const raw = bodyForLog && typeof bodyForLog === 'string' ? bodyForLog : '';
          const fallback = raw.trim().length > 0
            ? raw
            : (defaultMessages[response.status] || `Request failed (${response.status}): ${response.statusText}`);
          return {
            success: false,
            message: fallback,
            errors: ['REQUEST_FAILED']
          } as ApiResponse<T>;
        }

        // Handle server errors more gracefully
        if (response.status >= 500) {
          return {
            success: false,
            message: `Server error (${response.status}): ${data?.message || response.statusText}. Please try again later.`,
            errors: ['SERVER_ERROR']
          } as ApiResponse<T>;
        }

        return {
          success: false,
          message: (data && (data.message || data.error || (Array.isArray(data.errors) ? data.errors[0]?.msg : undefined))) || `Request failed (${response.status}): ${response.statusText}`,
          errors: ['REQUEST_FAILED']
        } as ApiResponse<T>;
      }

      console.log('✅ handleResponse - Success:', data)

      // Ensure consistent response structure
      if (data && typeof data === 'object') {
        // If data doesn't have success property, wrap it
        if (!('success' in data)) {
          return {
            success: true,
            message: 'Request successful',
            data: data
          } as ApiResponse<T>
        }
      }

      return data as ApiResponse<T>
    } catch (error) {
      console.log('❌ handleResponse - Unexpected error caught:', error);
      console.error('❌ handleResponse - Unexpected error:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while processing the response',
        errors: ['UNEXPECTED_ERROR']
      } as ApiResponse<T>;
    }
  }

  // Authentication endpoints
  async signup(data: SignupData): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await this.handleResponse<AuthResponse>(response);

    if (result.success && result.data?.token) {
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
    }

    return result;
  }

  async employerSignup(data: EmployerSignupData): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${API_BASE_URL}/auth/employer-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await this.handleResponse<AuthResponse>(response);

    if (result.success && result.data?.token) {
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
      if (result.data.company) {
        localStorage.setItem('company', JSON.stringify(result.data.company));
      }
    }

    return result;
  }

  async login(data: LoginData): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await this.handleResponse<AuthResponse>(response);

    // Only set auth data if login was successful
    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
      if (result.data.company) {
        localStorage.setItem('company', JSON.stringify(result.data.company));
      }
    } else {
      // Clear any existing auth data on failed login
      this.clearAuth();
    }

    return result;
  }

  async logout(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    this.clearAuth();

    return this.handleResponse(response);
  }

  async adminLogin(data: { email: string; password: string }): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${API_BASE_URL}/admin-auth/admin-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await this.handleResponse<AuthResponse>(response);

    // Only set auth data if login was successful
    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
      if (result.data.company) {
        localStorage.setItem('company', JSON.stringify(result.data.company));
      }
    } else {
      // Clear any existing auth data on failed login
      this.clearAuth();
    }

    return result;
  }

  async forgotPassword(data: ForgotPasswordData): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async resetPassword(data: ResetPasswordData): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async verifyResetToken(token: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-reset-token/${token}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return this.handleResponse(response);
  }

  // Cross-portal signup methods
  async checkExistingUser(email: string, password: string, requestingRegion: 'gulf' | 'india'): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/check-existing-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, requestingRegion }),
    });

    return this.handleResponse<any>(response);
  }

  async verifyOTPAndRegister(userId: string, otp: string, requestingRegion: 'gulf' | 'india'): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp-and-register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, otp, requestingRegion }),
    });

    const result = await this.handleResponse<AuthResponse>(response);

    if (result.success && result.data?.token) {
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
    }

    return result;
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    try {
      console.log('🔍 API Service - Getting current user...')
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        headers: this.getAuthHeaders(),
      });

      console.log('🔍 API Service - Response status:', response.status)
      const result = await this.handleResponse<{ user: User }>(response);
      console.log('🔍 API Service - Result:', result)
      return result;
    } catch (error) {
      console.error('❌ API Service - getCurrentUser error:', error)
      throw error;
    }
  }

  // User profile endpoints
  async getUserProfile(): Promise<ApiResponse<{ user: User }>> {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<{ user: User }>(response);
  }

  async updateProfile(data: ProfileUpdateData): Promise<ApiResponse<{ user: User }>> {
    try {
      console.log('🔍 API Service - Updating profile...');
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      console.log('🔍 API Service - Profile update response status:', response.status);
      const result = await this.handleResponse<{ user: User }>(response);
      console.log('🔍 API Service - Profile update result:', result);

      if (result.success && result.data?.user) {
        localStorage.setItem('user', JSON.stringify(result.data.user));
      }

      return result;
    } catch (error) {
      console.error('❌ API Service - updateProfile error:', error);
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/user/change-password`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    return this.handleResponse(response);
  }

  async updateUserEmail(data: { newEmail: string; currentPassword: string }): Promise<ApiResponse> {
    try {
      console.log('🔍 API Service - Updating user email...');
      const response = await fetch(`${API_BASE_URL}/user/change-email`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await this.handleResponse(response);
      console.log('✅ API Service - Email update result:', result);
      return result;
    } catch (error) {
      console.error('❌ API Service - updateUserEmail error:', error);
      throw error;
    }
  }

  async updateUserPhone(data: { newPhone: string; currentPassword: string }): Promise<ApiResponse> {
    try {
      console.log('🔍 API Service - Updating user phone...');
      const response = await fetch(`${API_BASE_URL}/user/change-phone`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await this.handleResponse(response);
      console.log('✅ API Service - Phone update result:', result);
      return result;
    } catch (error) {
      console.error('❌ API Service - updateUserPhone error:', error);
      throw error;
    }
  }

  async updateUserPassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> {
    try {
      console.log('🔍 API Service - Updating user password...');
      const response = await fetch(`${API_BASE_URL}/user/change-password`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await this.handleResponse(response);
      console.log('✅ API Service - Password update result:', result);
      return result;
    } catch (error) {
      console.error('❌ API Service - updateUserPassword error:', error);
      throw error;
    }
  }

  async updateNotificationPreferences(
    emailNotifications?: any,
    pushNotifications?: any
  ): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/user/notifications`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ emailNotifications, pushNotifications }),
    });

    return this.handleResponse(response);
  }

  // NEW: Flexible notification preferences methods
  async getNotificationPreferences(): Promise<ApiResponse<{ notifications: any }>> {
    const response = await fetch(`${API_BASE_URL}/user/preferences/notifications`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<{ notifications: any }>(response);
  }

  async updateNotificationPreferencesFlexible(notifications: Record<string, boolean>): Promise<ApiResponse> {
    console.log('🔄 Updating notification preferences:', notifications);
    const response = await fetch(`${API_BASE_URL}/user/preferences/notifications`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ notifications }),
    });

    return this.handleResponse(response);
  }

  // Job preferences endpoints
  async getJobPreferences(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/job-preferences`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async updateJobPreferences(preferences: any): Promise<ApiResponse<any>> {
    try {
      console.log('🔍 API Service - Updating job preferences...');
      const response = await fetch(`${API_BASE_URL}/job-preferences`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(preferences),
      });

      console.log('🔍 API Service - Job preferences update response status:', response.status);
      const result = await this.handleResponse(response);
      console.log('🔍 API Service - Job preferences update result:', result);

      return result;
    } catch (error) {
      console.error('❌ API Service - updateJobPreferences error:', error);
      throw error;
    }
  }

  async getMatchingJobs(page: number = 1, limit: number = 20): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/job-preferences/matching-jobs?page=${page}&limit=${limit}`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async deleteJobPreferences(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/job-preferences`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async getNotifications(params?: { unread?: boolean }): Promise<ApiResponse<any[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.unread) {
        queryParams.append('unread', 'true');
      }

      const url = `${API_BASE_URL}/user/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse<any[]>(response);
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      return {
        success: false,
        message: 'Failed to fetch notifications',
        errors: ['NETWORK_ERROR']
      };
    }
  }


  // Company endpoints
  async createCompany(data: any): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/companies`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<any>(response);
  }

  async getCompany(companyId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<any>(response);
  }

  // Companies list and join
  async listCompanies(params?: { search?: string; limit?: number; offset?: number; timestamp?: number }): Promise<ApiResponse<any[]>> {
    const sp = new URLSearchParams();
    if (params?.search) sp.append('search', params.search);
    if (params?.limit) sp.append('limit', String(params.limit));
    if (params?.offset) sp.append('offset', String(params.offset));
    if (params?.timestamp) sp.append('timestamp', String(params.timestamp));
    const response = await fetch(`${API_BASE_URL}/companies${sp.toString() ? `?${sp.toString()}` : ''}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any[]>(response);
  }



  async joinCompany(companyId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/companies/join`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ companyId })
    });
    return this.handleResponse<any>(response);
  }

  /**
   * Check if company name is unclaimed (created by agency)
   */
  async checkClaimableCompanies(companyName: string): Promise<ApiResponse<any>> {
    const sp = new URLSearchParams();
    sp.append('companyName', companyName);

    const response = await fetch(`${API_BASE_URL}/companies/check-claimable?${sp.toString()}`);
    return this.handleResponse<any>(response);
  }

  /**
   * Claim an unclaimed company profile
   */
  async claimCompany(data: { companyId: string; userEmail: string; userName: string; userPhone: string; password: string }): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/companies/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return this.handleResponse<any>(response);
  }

  // Follow/Unfollow company methods
  async followCompany(companyId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/follow`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  async unfollowCompany(companyId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/follow`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  async getFollowedCompanies(): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${API_BASE_URL}/companies/followed`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any[]>(response);
  }

  async getCompanyFollowStatus(companyId: string): Promise<ApiResponse<{ isFollowing: boolean; followedAt: string | null }>> {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/follow-status`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ isFollowing: boolean; followedAt: string | null }>(response);
  }

  // Rate company methods
  async rateCompany(companyId: string, rating: number): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/rate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ rating }),
    });
    return this.handleResponse<any>(response);
  }

  async getUserCompanyRating(companyId: string): Promise<ApiResponse<{ rating: number | null; hasRated: boolean }>> {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/user-rating`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ rating: number | null; hasRated: boolean }>(response);
  }

  async updateCompany(companyId: string, data: any): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<any>(response);
  }

  /**
   * Upload company logo
   */
  async uploadCompanyLogo(companyId: string, file: File): Promise<ApiResponse<{ logo: string }>> {
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      console.log('🔍 API Service - Uploading company logo...');
      const response = await fetch(`${API_BASE_URL}/companies/${companyId}/logo`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const result = await this.handleResponse<{ logo: string }>(response);
      console.log('🔍 API Service - Company logo upload result:', result);
      return result;
    } catch (error) {
      console.error('❌ API Service - uploadCompanyLogo error:', error);
      throw error;
    }
  }

  /**
   * Upload company banner/placeholder image
   */
  async uploadCompanyBanner(companyId: string, file: File): Promise<ApiResponse<{ banner: string }>> {
    try {
      const formData = new FormData();
      formData.append('banner', file);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      console.log('🔍 API Service - Uploading company banner...');
      const response = await fetch(`${API_BASE_URL}/companies/${companyId}/banner`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const result = await this.handleResponse<{ banner: string }>(response);
      console.log('🔍 API Service - Company banner upload result:', result);
      return result;
    } catch (error) {
      console.error('❌ API Service - uploadCompanyBanner error:', error);
      throw error;
    }
  }

  /**
   * Upload branding media (for hot vacancy)
   */
  async uploadBrandingMedia(file: File): Promise<ApiResponse<{ filename: string; fileUrl: string; filePath: string; fileSize: number; originalName: string; mimeType: string; type: 'video' | 'photo' }>> {
    try {
      const formData = new FormData();
      formData.append('media', file);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      console.log('🔍 API Service - Uploading branding media...');
      const response = await fetch(`${API_BASE_URL}/user/branding-media/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const result = await this.handleResponse<{ filename: string; fileUrl: string; filePath: string; fileSize: number; originalName: string; mimeType: string; type: 'video' | 'photo' }>(response);
      console.log('🔍 API Service - Branding media upload result:', result);
      return result;
    } catch (error) {
      console.error('❌ API Service - uploadBrandingMedia error:', error);
      throw error;
    }
  }

  // ========== AGENCY METHODS ==========

  /**
   * Get agency KYC verification status
   */
  async getAgencyKycStatus(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/agency/kyc/status`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  /**
   * Upload agency KYC documents
   */
  async uploadAgencyKyc(formData: FormData): Promise<ApiResponse<any>> {
    const headers: any = {
      'Authorization': `Bearer ${this.authToken}`
    };
    // Don't set Content-Type for FormData - browser will set it automatically with boundary

    const response = await fetch(`${API_BASE_URL}/agency/kyc/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return this.handleResponse<any>(response);
  }

  /**
   * Get all clients for an agency
   */
  async getAgencyClients(): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${API_BASE_URL}/agency/clients`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any[]>(response);
  }

  /**
   * Get active clients (can post jobs)
   */
  async getActiveClients(): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${API_BASE_URL}/agency/clients/active/list`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any[]>(response);
  }

  /**
   * Get specific client authorization details
   */
  async getClientAuthorization(authorizationId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/agency/clients/${authorizationId}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  /**
   * Search existing companies to add as clients
   */
  async searchCompanies(searchTerm: string): Promise<ApiResponse<any[]>> {
    const sp = new URLSearchParams();
    sp.append('search', searchTerm);

    const response = await fetch(`${API_BASE_URL}/agency/companies/search?${sp.toString()}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any[]>(response);
  }

  /**
   * Submit verification request with documents
   */
  async submitVerificationRequest(data: any): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/verification/submit`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<any>(response);
  }

  /**
   * Upload verification document
   */
  async uploadFile(formData: FormData): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/upload/verification-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: formData,
    });
    return this.handleResponse<any>(response);
  }

  /**
   * Generate signed URL for document access
   */
  async generateDocumentAccessUrl(filename: string): Promise<ApiResponse<{ signedUrl: string }>> {
    const response = await fetch(`${API_BASE_URL}/verification/documents/access`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filename }),
    });
    return this.handleResponse<{ signedUrl: string }>(response);
  }

  /**
   * Get pending verification requests (Admin only)
   */
  async getPendingVerifications(): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${API_BASE_URL}/verification/pending`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any[]>(response);
  }

  /**
   * Approve company verification (Admin only)
   */
  async approveVerification(companyId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/verification/approve/${companyId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  /**
   * Reject company verification (Admin only)
   */
  async rejectVerification(companyId: string, data: { reason: string; notes?: string }): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/verification/reject/${companyId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<any>(response);
  }

  /**
   * Add a new client (create authorization request)
   */
  async addClient(formData: FormData): Promise<ApiResponse<any>> {
    const headers: any = {
      'Authorization': `Bearer ${this.authToken}`
    };
    // Don't set Content-Type for FormData

    const response = await fetch(`${API_BASE_URL}/agency/clients/add`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return this.handleResponse<any>(response);
  }

  // ========== ADMIN: AGENCY VERIFICATION METHODS ==========

  /**
   * Get all agency verifications (admin only)
   */
  async getAgencyVerifications(params?: { status?: string; type?: string; search?: string; limit?: number; offset?: number }): Promise<ApiResponse<any>> {
    const sp = new URLSearchParams();
    if (params?.status) sp.append('status', params.status);
    if (params?.type) sp.append('type', params.type);
    if (params?.search) sp.append('search', params.search);
    if (params?.limit) sp.append('limit', String(params.limit));
    if (params?.offset) sp.append('offset', String(params.offset));

    const response = await fetch(`${API_BASE_URL}/admin/agency-verifications${sp.toString() ? `?${sp.toString()}` : ''}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  /**
   * Get verification statistics (admin only)
   */
  async getVerificationStats(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/admin/agency-verifications/stats`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  /**
   * Get detailed agency information (admin only)
   */
  async getAgencyDetails(agencyId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/admin/agency-verifications/agency/${agencyId}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  /**
   * Approve agency KYC verification (admin only)
   */
  async approveAgencyVerification(agencyId: string, notes?: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/admin/agency-verifications/agency/${agencyId}/approve`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ notes }),
    });
    return this.handleResponse<any>(response);
  }

  /**
   * Reject agency KYC verification (admin only)
   */
  async rejectAgencyVerification(agencyId: string, reason: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/admin/agency-verifications/agency/${agencyId}/reject`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    return this.handleResponse<any>(response);
  }

  /**
   * Get detailed client authorization information (admin only)
   */
  async getClientAuthorizationDetails(authorizationId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/admin/agency-verifications/client/${authorizationId}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  /**
   * Approve client authorization (admin only)
   */
  async approveClientAuthorization(authorizationId: string, notes?: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/admin/agency-verifications/client/${authorizationId}/approve`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ notes }),
    });
    return this.handleResponse<any>(response);
  }

  /**
   * Reject client authorization (admin only)
   */
  async rejectClientAuthorization(authorizationId: string, reason: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/admin/agency-verifications/client/${authorizationId}/reject`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    return this.handleResponse<any>(response);
  }

  // Job endpoints
  async postJob(data: any): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/jobs/create`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<any>(response);
  }

  async getJobs(params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<any>> {
    try {
      const query = params
        ? '?' + Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join('&')
        : '';

      console.log('🔍 Fetching jobs from:', `${API_BASE_URL}/jobs${query}`);

      const response = await fetch(`${API_BASE_URL}/jobs${query}`, {
        headers: this.getAuthHeaders(),
      });

      console.log('🔍 Jobs API response status:', response.status);

      return this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error in getJobs:', error);
      return {
        success: false,
        message: 'Failed to fetch jobs. Please try again later.'
      };
    }
  }

  async getJobById(id: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  async getJobByIdPublic(id: string): Promise<ApiResponse<any>> {
    try {
      console.log('🔍 Fetching job publicly for ID:', id);
      const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📋 Public job API response status:', response.status, response.statusText);

      if (!response.ok) {
        console.error('❌ Public job API failed:', response.status, response.statusText);
        return {
          success: false,
          message: `Failed to fetch job: ${response.status} ${response.statusText}`,
          errors: ['API_ERROR']
        };
      }

      const data = await response.json();
      console.log('📋 Public job API data:', data);

      return {
        success: true,
        data: data.data || data,
        message: data.message || 'Job fetched successfully'
      };
    } catch (error) {
      console.error('❌ Public job API error:', error);
      return {
        success: false,
        message: 'Failed to fetch job data',
        errors: ['NETWORK_ERROR']
      };
    }
  }

  async getCompanyJobs(companyId?: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<any>> {
    const finalCompanyId = companyId || this.getCompanyFromStorage()?.id || this.getCurrentUserFromStorage()?.companyId || '';
    const query = params
      ? '?' + Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
      : '';
    const endpoint = `/companies/${finalCompanyId}/jobs${query}`;

    return this.makeRequest(endpoint, async () => {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<any>(response);
    });
  }

  async updateJob(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<any>(response);
  }

  async deleteJob(id: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  async createJob(data: any): Promise<ApiResponse<any>> {
    console.log('🔍 createJob - Sending data:', data);
    const response = await fetch(`${API_BASE_URL}/jobs/create`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse<any>(response);
  }

  async updateJobStatus(id: string, status: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return this.handleResponse<any>(response);
  }

  async updateJobExpiry(id: string, validTill: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}/expiry`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ validTill }),
    });
    return this.handleResponse<any>(response);
  }

  async expireJobNow(id: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}/expire`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  async getEmployerJobs(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ApiResponse<any>> {
    // Retain logging for debugging
    console.log('🔍 API: Fetching employer jobs with params:', params);
    const queryParams = new URLSearchParams();

    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const endpoint = `/jobs/employer/manage-jobs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    return this.makeRequest(endpoint, async () => {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<any>(response);
    });
  }

  async getJobForEdit(jobId: string): Promise<ApiResponse<any>> {
    // Retain logging for debugging
    console.log('🔍 API: Fetching job for edit:', jobId);
    const response = await fetch(`${API_BASE_URL}/jobs/edit/${jobId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  // Job application endpoint
  async applyJob(jobId: string, applicationData?: {
    coverLetter?: string;
    expectedSalary?: number;
    noticePeriod?: number;
    availableFrom?: string;
    isWillingToRelocate?: boolean;
    preferredLocations?: string[];
    resumeId?: string;
  }): Promise<ApiResponse<{ applicationId: string; status: string; appliedAt: string }>> {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(applicationData || {}),
    });

    return this.handleResponse<{ applicationId: string; status: string; appliedAt: string }>(response);
  }

  async watchJob(jobId: string): Promise<ApiResponse<{ watching: boolean }>> {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/watch`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ watching: boolean }>(response);
  }

  async unwatchJob(jobId: string): Promise<ApiResponse<{ watching: boolean }>> {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/watch`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ watching: boolean }>(response);
  }

  async getWatchStatus(jobId: string): Promise<ApiResponse<{ watching: boolean }>> {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/watch`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ watching: boolean }>(response);
  }

  // Secure job tap endpoint
  async tapSecureJob(jobId: string): Promise<ApiResponse<{ tapCount: number; premiumAwarded: boolean }>> {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/tap`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });
    return this.handleResponse<{ tapCount: number; premiumAwarded: boolean }>(response);
  }
  // Utility methods
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  }

  getCurrentUserFromStorage(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getCompanyFromStorage(): Company | null {
    if (typeof window === 'undefined') return null;
    const companyStr = localStorage.getItem('company');
    return companyStr ? JSON.parse(companyStr) : null;
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
    this.authToken = token;
  }

  refreshToken(): void {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    this.authToken = token;
  }

  clearAuth(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('company');
    this.authToken = null;
  }

  // OAuth methods
  async getOAuthUrls(userType: 'jobseeker' | 'employer' = 'jobseeker', state?: string): Promise<ApiResponse<{ google: string; facebook: string }>> {
    console.log('🔍 Getting OAuth URLs for userType:', userType, 'state:', state);

    let url = `${API_BASE_URL}/oauth/urls?userType=${userType}`;
    if (state) {
      url += `&state=${state}`;
    }

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await this.handleResponse<{ google: string; facebook: string }>(response);
    console.log('✅ OAuth URLs received:', result.data);

    return result;
  }

  async handleOAuthCallback(token: string): Promise<ApiResponse<{ user: User }>> {
    console.log('🔍 Handling OAuth callback with token:', token ? 'present' : 'missing');

    // Store the token temporarily
    localStorage.setItem('token', token);

    // Get user data
    const response = await this.getCurrentUser();

    if (response.success && response.data?.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
      console.log('✅ OAuth callback - User data stored:', {
        id: response.data.user.id,
        email: response.data.user.email,
        userType: response.data.user.userType
      });

      // If user is an employer, get company information
      if (response.data.user.userType === 'employer' && response.data.user.companyId) {
        const companyResponse = await this.getCompany(response.data.user.companyId);
        if (companyResponse.success && companyResponse.data) {
          localStorage.setItem('company', JSON.stringify(companyResponse.data));
          console.log('✅ OAuth callback - Company data stored:', companyResponse.data);
        }
      }
    }

    return response;
  }

  async completeEmployerProfile(data: {
    firstName: string;
    lastName: string;
    phone: string;
    companyName?: string;
    companyId?: string;
    region: string;
    action?: string;
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/oauth/complete-employer-profile`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse<any>(response);
  }

  async getCompanies(): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${API_BASE_URL}/companies`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any[]>(response);
  }

  async setupOAuthPassword(password: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/oauth/setup-password`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ password }),
    });
    const result = await this.handleResponse<any>(response);
    // Treat PASSWORD_ALREADY_SET as a soft success
    if (!result.success) {
      try {
        const clone = response.clone();
        const json = await clone.json().catch(() => null as any);
        if (json && (json.code === 'PASSWORD_ALREADY_SET' || json.requiresPasswordSetup === false)) {
          return {
            success: true,
            message: 'Password already set',
            data: json,
          } as any;
        }
      } catch (_) { }
    }
    if (result.success && result.data?.token) {
      localStorage.setItem('token', result.data.token);
      if (result.data.user) {
        localStorage.setItem('user', JSON.stringify(result.data.user));
      }
    }
    return result as any;
  }

  // Alias for setupOAuthPassword for consistency
  async setupPassword(password: string): Promise<ApiResponse> {
    return this.setupOAuthPassword(password);
  }

  // Applications endpoints
  async getApplications(): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${API_BASE_URL}/user/applications`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<any[]>(response);
  }

  // Get applied jobs (alias for getApplications)
  async getAppliedJobs(): Promise<ApiResponse<any[]>> {
    return this.getApplications();
  }

  // Debug endpoint to check all applications
  async debugApplications(): Promise<ApiResponse<any[]>> {
    try {
      console.log('🔍 Debug: Fetching all applications...');
      const response = await fetch(`${API_BASE_URL}/user/debug/applications`, {
        headers: this.getAuthHeaders(),
      });

      console.log('📋 Debug applications API response status:', response.status, response.statusText);

      return await this.handleResponse<any[]>(response);
    } catch (error) {
      console.error('❌ Debug applications error:', error);
      return {
        success: false,
        message: 'Failed to debug applications',
        data: []
      };
    }
  }

  async testEmployerApplications(): Promise<ApiResponse<any>> {
    try {
      console.log('🧪 Testing employer applications endpoint...');
      const response = await fetch(`${API_BASE_URL}/user/employer/applications/test`, {
        headers: this.getAuthHeaders(),
      });
      console.log('🧪 Test applications API response status:', response.status, response.statusText);
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Test applications error:', error);
      return { success: false, message: 'Failed to test applications', data: null };
    }
  }

  // Employer applications endpoint
  async getEmployerApplications(): Promise<ApiResponse<any[]>> {
    try {
      console.log('🔍 Fetching employer applications...');
      const response = await fetch(`${API_BASE_URL}/user/employer/applications`, {
        headers: this.getAuthHeaders(),
      });

      console.log('📋 Employer applications API response status:', response.status, response.statusText);

      // Use the standard handleResponse method for consistency
      return await this.handleResponse<any[]>(response);
    } catch (error) {
      console.error('❌ Employer applications API error:', error);
      return {
        success: false,
        message: 'Failed to fetch applications data',
        errors: ['NETWORK_ERROR']
      };
    }
  }

  // Get detailed application information for employer
  async getEmployerApplicationDetails(applicationId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/employer/applications/${applicationId}`, {
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error fetching employer application details:', error);
      return {
        success: false,
        message: 'Failed to fetch application details',
        errors: ['NETWORK_ERROR']
      };
    }
  }

  // Employer: download cover letter for a specific application
  async downloadApplicationCoverLetter(applicationId: string): Promise<Response> {
    const response = await fetch(`${API_BASE_URL}/user/employer/applications/${applicationId}/cover-letter/download`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({} as any));
      const msg = (errorData as any)?.message || `Download failed: ${response.status} ${response.statusText}`;
      throw new Error(msg);
    }
    return response;
  }

  async createApplication(data: any): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/user/applications`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return this.handleResponse<any>(response);
  }

  async updateApplicationStatus(applicationId: string, status: string): Promise<ApiResponse<any>> {
    // Use the jobseeker endpoint for updating application status (withdrawing)
    const response = await fetch(`${API_BASE_URL}/user/applications/${applicationId}/status`, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    return this.handleResponse<any>(response);
  }

  // Employer method for updating application status
  async updateEmployerApplicationStatus(applicationId: string, status: string): Promise<ApiResponse<any>> {
    console.log('🔍 updateEmployerApplicationStatus called:', {
      applicationId,
      status,
      url: `${API_BASE_URL}/user/employer/applications/${applicationId}/status`
    });

    // Use the employer endpoint for updating application status
    const response = await fetch(`${API_BASE_URL}/user/employer/applications/${applicationId}/status`, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    console.log('🔍 updateEmployerApplicationStatus response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    return this.handleResponse<any>(response);
  }

  // Job Photos endpoints
  async uploadJobPhoto(formData: FormData): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/user/job-photos/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: formData,
    });

    return this.handleResponse<any>(response);
  }

  async getJobPhotos(jobId: string): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${API_BASE_URL}/user/jobs/${jobId}/photos`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<any[]>(response);
  }

  async deleteJobPhoto(photoId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/user/job-photos/${photoId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<any>(response);
  }

  // Job Alerts endpoints
  async getJobAlerts(): Promise<ApiResponse<JobAlert[]>> {
    const response = await fetch(`${API_BASE_URL}/job-alerts`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<JobAlert[]>(response);
  }

  async createJobAlert(data: Partial<JobAlert>): Promise<ApiResponse<JobAlert>> {
    console.log('🔍 createJobAlert - Sending data:', data);
    console.log('🔍 createJobAlert - Headers:', this.getAuthHeaders());
    console.log('🔍 createJobAlert - API URL:', `${API_BASE_URL}/job-alerts`);

    try {
      const response = await fetch(`${API_BASE_URL}/job-alerts`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      console.log('🔍 createJobAlert - Response status:', response.status);
      console.log('🔍 createJobAlert - Response statusText:', response.statusText);
      console.log('🔍 createJobAlert - Response headers:', response.headers);
      console.log('🔍 createJobAlert - Response ok:', response.ok);

      // Log the raw response text for debugging
      const responseText = await response.text();
      console.log('🔍 createJobAlert - Raw response text:', responseText);

      // Try to parse as JSON if possible
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('🔍 createJobAlert - Parsed response data:', responseData);
      } catch (parseError) {
        console.error('❌ createJobAlert - Failed to parse response as JSON:', parseError);
        console.log('🔍 createJobAlert - Response was not valid JSON');
      }

      // Create a new response object with the parsed data
      const newResponse = new Response(responseText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });

      return this.handleResponse<JobAlert>(newResponse);
    } catch (fetchError) {
      console.error('❌ createJobAlert - Fetch error:', fetchError);
      throw fetchError;
    }
  }

  async updateJobAlert(id: string, data: Partial<JobAlert>): Promise<ApiResponse<JobAlert>> {
    const response = await fetch(`${API_BASE_URL}/job-alerts/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<JobAlert>(response);
  }

  async deleteJobAlert(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/job-alerts/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async toggleJobAlert(id: string): Promise<ApiResponse<JobAlert>> {
    const response = await fetch(`${API_BASE_URL}/job-alerts/${id}/toggle`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<JobAlert>(response);
  }

  // Job Bookmarks endpoints
  async getBookmarks(): Promise<ApiResponse<JobBookmark[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/bookmarks`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return this.handleResponse<JobBookmark[]>(response);
    } catch (error) {
      // Fallback to localStorage if API is not available
      console.warn('API not available, using localStorage fallback for bookmarks');

      const user = this.getCurrentUserFromStorage();
      if (!user) {
        return {
          success: true,
          data: [],
          message: 'No bookmarks found'
        };
      }

      const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      const userBookmarks = bookmarks.filter((bookmark: JobBookmark) => bookmark.userId === user.id);

      return {
        success: true,
        data: userBookmarks,
        message: 'Bookmarks retrieved successfully'
      };
    }
  }

  async createBookmark(data: Partial<JobBookmark>): Promise<ApiResponse<JobBookmark>> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/bookmarks`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return this.handleResponse<JobBookmark>(response);
    } catch (error) {
      // Fallback to localStorage if API is not available
      console.warn('API not available, using localStorage fallback for bookmarks');

      const user = this.getCurrentUserFromStorage();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const bookmark: JobBookmark = {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        jobId: data.jobId || '',
        folder: data.folder || 'Saved Jobs',
        notes: data.notes || '',
        priority: data.priority || 'medium',
        isApplied: false,
        createdAt: new Date().toISOString(),
      };

      // Store in localStorage
      const existingBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      existingBookmarks.push(bookmark);
      localStorage.setItem('bookmarks', JSON.stringify(existingBookmarks));

      return {
        success: true,
        data: bookmark,
        message: 'Bookmark created successfully'
      };
    }
  }

  async updateBookmark(id: string, data: Partial<JobBookmark>): Promise<ApiResponse<JobBookmark>> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/bookmarks/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return this.handleResponse<JobBookmark>(response);
    } catch (error) {
      // Fallback to localStorage if API is not available
      console.warn('API not available, using localStorage fallback for bookmark update');

      const user = this.getCurrentUserFromStorage();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      const bookmarkIndex = bookmarks.findIndex((bookmark: JobBookmark) =>
        bookmark.id === id && bookmark.userId === user.id
      );

      if (bookmarkIndex === -1) {
        throw new Error('Bookmark not found');
      }

      // Update the bookmark
      const updatedBookmark = {
        ...bookmarks[bookmarkIndex],
        ...data,
        updatedAt: new Date().toISOString(),
      };

      bookmarks[bookmarkIndex] = updatedBookmark;
      localStorage.setItem('bookmarks', JSON.stringify(bookmarks));

      return {
        success: true,
        data: updatedBookmark,
        message: 'Bookmark updated successfully'
      };
    }
  }

  async deleteBookmark(id: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/bookmarks/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return this.handleResponse(response);
    } catch (error) {
      // Fallback to localStorage if API is not available
      console.warn('API not available, using localStorage fallback for bookmark deletion');

      const user = this.getCurrentUserFromStorage();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      const updatedBookmarks = bookmarks.filter((bookmark: JobBookmark) =>
        bookmark.id !== id && bookmark.userId === user.id
      );
      localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));

      return {
        success: true,
        message: 'Bookmark deleted successfully'
      };
    }
  }

  // Search History endpoints
  async getSearchHistory(): Promise<ApiResponse<SearchHistory[]>> {
    const response = await fetch(`${API_BASE_URL}/user/search-history`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<SearchHistory[]>(response);
  }

  // Requirements endpoints
  async getRequirements(): Promise<ApiResponse<Requirement[]>> {
    const response = await fetch(`${API_BASE_URL}/requirements`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<Requirement[]>(response);
  }

  async getRequirement(id: string): Promise<ApiResponse<Requirement>> {
    const response = await fetch(`${API_BASE_URL}/requirements/${id}`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<Requirement>(response);
  }

  async updateRequirement(id: string, data: any): Promise<ApiResponse<Requirement>> {
    const response = await fetch(`${API_BASE_URL}/requirements/${id}`, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return this.handleResponse<Requirement>(response);
  }

  async deleteRequirement(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/requirements/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<void>(response);
  }

  async createRequirement(data: any): Promise<ApiResponse<any>> {
    // Ensure companyId is present for employers
    const company = this.getCompanyFromStorage();
    const user = this.getCurrentUserFromStorage();
    const withCompany = {
      ...data,
      companyId: data.companyId || company?.id || user?.companyId,
    };

    const response = await fetch(`${API_BASE_URL}/requirements`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(withCompany),
    });

    return this.handleResponse<any>(response);
  }

  async getRequirementStats(requirementId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/requirements/${requirementId}/stats`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<any>(response);
  }

  async getRequirementCandidates(requirementId: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    // Filter parameters
    experience?: number[];
    salary?: number[];
    locationInclude?: string;
    locationExclude?: string;
    skillsInclude?: string;
    skillsExclude?: string;
    keyword?: string;
    education?: string[];
    availability?: string[];
    verification?: string[];
    lastActive?: string[];
    saved?: boolean;
    accessed?: boolean;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    
    // Filter parameters
    if (params?.experience && params.experience.length === 2) {
      queryParams.append('experienceMin', params.experience[0].toString());
      queryParams.append('experienceMax', params.experience[1].toString());
    }
    if (params?.salary && params.salary.length === 2) {
      queryParams.append('salaryMin', params.salary[0].toString());
      queryParams.append('salaryMax', params.salary[1].toString());
    }
    if (params?.locationInclude) queryParams.append('locationInclude', params.locationInclude);
    if (params?.locationExclude) queryParams.append('locationExclude', params.locationExclude);
    if (params?.skillsInclude) queryParams.append('skillsInclude', params.skillsInclude);
    if (params?.skillsExclude) queryParams.append('skillsExclude', params.skillsExclude);
    if (params?.keyword) queryParams.append('keyword', params.keyword);
    if (params?.education && params.education.length > 0) {
      params.education.forEach(edu => queryParams.append('education', edu));
    }
    if (params?.availability && params.availability.length > 0) {
      params.availability.forEach(avail => queryParams.append('availability', avail));
    }
    if (params?.verification && params.verification.length > 0) {
      params.verification.forEach(verify => queryParams.append('verification', verify));
    }
    if (params?.lastActive && params.lastActive.length > 0) {
      params.lastActive.forEach(active => queryParams.append('lastActive', active));
    }
    if (params?.saved !== undefined) queryParams.append('saved', params.saved.toString());
    if (params?.accessed !== undefined) queryParams.append('accessed', params.accessed.toString());

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/requirements/${requirementId}/candidates${query}`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<any>(response);
  }

  async getCandidateProfile(requirementId: string, candidateId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/requirements/${requirementId}/candidates/${candidateId}`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<any>(response);
  }

  async shortlistCandidate(requirementId: string, candidateId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/requirements/${requirementId}/candidates/${candidateId}/shortlist`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<any>(response);
  }

  async contactCandidate(requirementId: string, candidateId: string, message?: string, subject?: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/requirements/${requirementId}/candidates/${candidateId}/contact`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ message, subject }),
    });

    return this.handleResponse<any>(response);
  }

  async calculateATSScores(requirementId: string, requestBody: any): Promise<ApiResponse<any>> {
    const response = await fetch(`${this.baseURL}/requirements/${requirementId}/calculate-ats`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(requestBody)
    });

    return this.handleResponse<any>(response);
  }

  async calculateIndividualATS(requirementId: string, candidateId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${this.baseURL}/requirements/${requirementId}/calculate-candidate-ats/${candidateId}`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<any>(response);
  }

  async downloadCandidateResume(requirementId: string, candidateId: string, resumeId: string): Promise<Response> {
    const token = this.authToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    const url = `${API_BASE_URL}/requirements/${requirementId}/candidates/${candidateId}/resume/${resumeId}/download`;
    const urlWithToken = token ? `${url}?token=${encodeURIComponent(token)}` : url;

    const response = await fetch(urlWithToken, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  // View resume from application (increment view count and log activity)
  async viewApplicationResume(applicationId: string): Promise<any> {
    const url = `${API_BASE_URL}/user/employer/applications/${applicationId}/resume/view`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`View failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // View resume from requirements (increment view count and log activity)
  async viewRequirementResume(requirementId: string, candidateId: string, resumeId: string): Promise<any> {
    const url = `${API_BASE_URL}/requirements/${requirementId}/candidates/${candidateId}/resume/${resumeId}/view`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`View failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Download resume from application (for employer applications page)
  async downloadApplicationResume(resumeId: string, applicationId?: string): Promise<Response> {
    let url: string;

    if (applicationId) {
      // Use the new employer endpoint that requires application ID
      url = `${API_BASE_URL}/user/employer/applications/${applicationId}/resume/download`;
    } else {
      // Fallback to the old endpoint (for backward compatibility)
      url = `${API_BASE_URL}/user/resumes/${resumeId}/download`;
    }

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  // Get general candidate profile for employers
  async getGeneralCandidateProfile(candidateId: string): Promise<ApiResponse<any>> {
    try {
      console.log('🔍 Fetching general candidate profile for:', candidateId);
      const response = await fetch(`${API_BASE_URL}/user/candidates/${candidateId}`, {
        headers: this.getAuthHeaders(),
      });
      console.log('📋 General candidate profile API response status:', response.status, response.statusText);
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Get general candidate profile error:', error);
      return { success: false, message: 'Failed to fetch candidate profile', data: null };
    }
  }

  // Messages endpoints
  async getConversations(): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<any[]>(response);
  }

  async getCompanyUsersForMessaging(): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${API_BASE_URL}/messages/company-users`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
    return this.handleResponse(response)
  }

  async startConversation(receiverId: string, title?: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/messages/start`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ receiverId, title })
    })
    return this.handleResponse(response)
  }

  async getMessages(conversationId: string, page: number = 1, limit: number = 50): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/messages/conversations/${conversationId}/messages?page=${page}&limit=${limit}`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<any>(response);
  }

  async sendMessage(conversationId: string, content: string, messageType: string = 'text'): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ content, messageType }),
    });

    return this.handleResponse<any>(response);
  }

  async markConversationRead(conversationId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/messages/conversations/${conversationId}/read`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<any>(response);
  }

  async markConversationAsRead(conversationId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/messages/conversations/${conversationId}/read`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<any>(response);
  }

  async getUnreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    const response = await fetch(`${API_BASE_URL}/messages/unread-count`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<{ unreadCount: number }>(response);
  }

  // Candidate Likes endpoints
  async getCandidateLikes(candidateId: string): Promise<ApiResponse<{ likeCount: number; likedByCurrent: boolean }>> {
    const response = await fetch(`${API_BASE_URL}/candidate-likes/${candidateId}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ likeCount: number; likedByCurrent: boolean }>(response);
  }

  async likeCandidate(candidateId: string): Promise<ApiResponse<{ liked: boolean; created: boolean }>> {
    const response = await fetch(`${API_BASE_URL}/candidate-likes/${candidateId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ liked: boolean; created: boolean }>(response);
  }

  async unlikeCandidate(candidateId: string): Promise<ApiResponse<{ liked: boolean; deleted: boolean }>> {
    const response = await fetch(`${API_BASE_URL}/candidate-likes/${candidateId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ liked: boolean; deleted: boolean }>(response);
  }

  // Per-requirement candidate save/like methods
  async saveCandidateForRequirement(candidateId: string, requirementId: string): Promise<ApiResponse<{ saved: boolean; requirementId: string }>> {
    const response = await fetch(`${API_BASE_URL}/candidate-likes/${candidateId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ requirementId })
    });
    return this.handleResponse<{ saved: boolean; requirementId: string }>(response);
  }

  async removeCandidateFromRequirement(candidateId: string, requirementId: string): Promise<ApiResponse<{ removed: boolean; requirementId: string }>> {
    const response = await fetch(`${API_BASE_URL}/candidate-likes/${candidateId}?requirementId=${requirementId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ removed: boolean; requirementId: string }>(response);
  }

  // Dashboard Stats endpoint
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      console.log('🔍 Fetching dashboard stats...');
      const response = await fetch(`${API_BASE_URL}/user/dashboard-stats`, {
        headers: this.getAuthHeaders(),
      });

      console.log('📊 Dashboard stats API response status:', response.status, response.statusText);

      return await this.handleResponse<DashboardStats>(response);
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      return {
        success: false,
        message: 'Failed to fetch dashboard stats',
        errors: ['NETWORK_ERROR']
      };
    }
  }

  // Employer Dashboard Stats endpoint
  async getEmployerDashboardStats(): Promise<ApiResponse<any>> {
    try {
      console.log('🔍 Fetching employer dashboard stats...');
      const response = await fetch(`${API_BASE_URL}/user/employer/dashboard-stats`, {
        headers: this.getAuthHeaders(),
      });

      console.log('📊 Employer dashboard stats API response status:', response.status, response.statusText);

      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error fetching employer dashboard stats:', error);
      return {
        success: false,
        message: 'Failed to fetch dashboard stats',
        errors: ['NETWORK_ERROR']
      };
    }
  }

  // Employer Analytics endpoint
  async getEmployerAnalytics(range: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/employer/analytics?range=${range}`, {
        headers: this.getAuthHeaders(),
      });
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error fetching employer analytics:', error);
      return { success: false, message: 'Failed to fetch analytics', errors: ['NETWORK_ERROR'] };
    }
  }

  // Usage Pulse endpoints
  async getUsageSummary(): Promise<ApiResponse<any>> {
    const endpoint = `/usage/summary`;
    console.log('🔍 Frontend calling getUsageSummary:', endpoint);
    return this.makeRequest(endpoint, async () => {
      const response = await fetch(`${this.baseURL}${endpoint}`, { headers: this.getAuthHeaders() });
      console.log('🔍 getUsageSummary response status:', response.status);
      const result = await this.handleResponse<any>(response);
      console.log('🔍 getUsageSummary result:', result);
      return result;
    });
  }

  async getUsageActivities(params: { userId?: string; activityType?: string; from?: string; to?: string; limit?: number; offset?: number; }): Promise<ApiResponse<any>> {
    const sp = new URLSearchParams();
    if (params.userId) sp.append('userId', params.userId);
    if (params.activityType) sp.append('activityType', params.activityType);
    if (params.from) sp.append('from', params.from);
    if (params.to) sp.append('to', params.to);
    if (params.limit) sp.append('limit', String(params.limit));
    if (params.offset) sp.append('offset', String(params.offset));
    const endpoint = `/usage/activities${sp.toString() ? `?${sp.toString()}` : ''}`;
    return this.makeRequest(endpoint, async () => {
      const response = await fetch(`${this.baseURL}${endpoint}`, { headers: this.getAuthHeaders() });
      return this.handleResponse<any>(response);
    });
  }

  async getUsageSearchInsights(params: { from?: string; to?: string; limit?: number }): Promise<ApiResponse<any>> {
    const sp = new URLSearchParams();
    if (params.from) sp.append('from', params.from);
    if (params.to) sp.append('to', params.to);
    if (params.limit) sp.append('limit', String(params.limit));
    const endpoint = `/usage/search-insights${sp.toString() ? `?${sp.toString()}` : ''}`;
    return this.makeRequest(endpoint, async () => {
      const response = await fetch(`${this.baseURL}${endpoint}`, { headers: this.getAuthHeaders() });
      return this.handleResponse<any>(response);
    });
  }

  async getUsagePostingInsights(params: { from?: string; to?: string }): Promise<ApiResponse<any>> {
    const sp = new URLSearchParams();
    if (params.from) sp.append('from', params.from);
    if (params.to) sp.append('to', params.to);
    const endpoint = `/usage/posting-insights${sp.toString() ? `?${sp.toString()}` : ''}`;
    return this.makeRequest(endpoint, async () => {
      const response = await fetch(`${this.baseURL}${endpoint}`, { headers: this.getAuthHeaders() });
      return this.handleResponse<any>(response);
    });
  }

  async getRecruiterPerformance(params: { from?: string; to?: string; limit?: number }): Promise<ApiResponse<any>> {
    const sp = new URLSearchParams();
    if (params.from) sp.append('from', params.from);
    if (params.to) sp.append('to', params.to);
    if (params.limit) sp.append('limit', String(params.limit));
    const endpoint = `/usage/recruiter-performance${sp.toString() ? `?${sp.toString()}` : ''}`;
    return this.makeRequest(endpoint, async () => {
      const response = await fetch(`${this.baseURL}${endpoint}`, { headers: this.getAuthHeaders() });
      return this.handleResponse<any>(response);
    });
  }

  // Quotas
  async getQuotas(userId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/usage/quotas?userId=${encodeURIComponent(userId)}`, async () => {
      const response = await fetch(`${this.baseURL}/usage/quotas?userId=${encodeURIComponent(userId)}`, {
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<any>(response);
    });
  }

  async updateQuota(payload: { userId: string; quotaType: string; limit: number; resetUsed?: boolean }): Promise<ApiResponse<any>> {
    return this.makeRequest('/usage/quotas', async () => {
      const response = await fetch(`${this.baseURL}/usage/quotas`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return this.handleResponse<any>(response);
    });
  }

  // Export analytics report
  async exportAnalyticsReport(range: '7d' | '30d' | '90d' | '1y' = '30d', format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/employer/analytics/export?range=${range}&format=${format}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('❌ Error exporting analytics report:', error);
      throw error;
    }
  }

  // Featured Jobs API methods
  async getFeaturedJobPricingPlans(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/featured-jobs/pricing`, {
        headers: this.getAuthHeaders(),
      });
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error fetching featured job pricing plans:', error);
      return { success: false, message: 'Failed to fetch pricing plans', errors: ['NETWORK_ERROR'] };
    }
  }

  async getEmployerJobsForPromotion(): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/featured-jobs/employer/jobs`, {
        headers: this.getAuthHeaders(),
      });
      return await this.handleResponse<any[]>(response);
    } catch (error) {
      console.error('❌ Error fetching employer jobs:', error);
      return { success: false, message: 'Failed to fetch jobs', errors: ['NETWORK_ERROR'] };
    }
  }

  async getEmployerFeaturedJobs(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await fetch(`${API_BASE_URL}/featured-jobs/employer${query}`, {
        headers: this.getAuthHeaders(),
      });
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error fetching featured jobs:', error);
      return { success: false, message: 'Failed to fetch featured jobs', errors: ['NETWORK_ERROR'] };
    }
  }

  async getFeaturedJobDetails(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/featured-jobs/${id}`, {
        headers: this.getAuthHeaders(),
      });
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error fetching featured job details:', error);
      return { success: false, message: 'Failed to fetch featured job details', errors: ['NETWORK_ERROR'] };
    }
  }

  async getFeaturedJobApplications(id: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);

      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await fetch(`${API_BASE_URL}/featured-jobs/${id}/applications${query}`, {
        headers: this.getAuthHeaders(),
      });
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error fetching featured job applications:', error);
      return { success: false, message: 'Failed to fetch applications', errors: ['NETWORK_ERROR'] };
    }
  }

  async createFeaturedJob(data: {
    jobId: string;
    promotionType: 'featured' | 'premium' | 'urgent' | 'sponsored';
    startDate: string;
    endDate: string;
    budget: number;
    priority?: number;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/featured-jobs`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error creating featured job:', error);
      return { success: false, message: 'Failed to create featured job', errors: ['NETWORK_ERROR'] };
    }
  }

  async updateFeaturedJob(id: string, data: {
    startDate?: string;
    endDate?: string;
    budget?: number;
    priority?: number;
    status?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/featured-jobs/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error updating featured job:', error);
      return { success: false, message: 'Failed to update featured job', errors: ['NETWORK_ERROR'] };
    }
  }

  async getTeamMembers(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/team/members`, {
        headers: this.getAuthHeaders(),
      });
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error fetching team members:', error);
      return { success: false, message: 'Failed to fetch team members', errors: ['NETWORK_ERROR'] };
    }
  }

  async inviteTeamMember(data: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    designation?: string;
    permissions?: any;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/team/invite`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error inviting team member:', error);
      return { success: false, message: 'Failed to invite team member', errors: ['NETWORK_ERROR'] };
    }
  }

  async removeTeamMember(userId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/team/members/${userId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error removing team member:', error);
      return { success: false, message: 'Failed to remove team member', errors: ['NETWORK_ERROR'] };
    }
  }

  async cancelInvitation(invitationId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/team/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error cancelling invitation:', error);
      return { success: false, message: 'Failed to cancel invitation', errors: ['NETWORK_ERROR'] };
    }
  }

  async verifyInvitation(token: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/team/verify-invitation?token=${token}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error verifying invitation:', error);
      return { success: false, message: 'Failed to verify invitation', errors: ['NETWORK_ERROR'] };
    }
  }

  async acceptInvitation(data: {
    token: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/team/accept-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error accepting invitation:', error);
      return { success: false, message: 'Failed to accept invitation', errors: ['NETWORK_ERROR'] };
    }
  }

  async updateTeamMemberPermissions(userId: string, data: {
    permissions?: any;
    designation?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/team/members/${userId}/permissions`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error updating team member permissions:', error);
      return { success: false, message: 'Failed to update permissions', errors: ['NETWORK_ERROR'] };
    }
  }

  async updateTeamMemberPhone(userId: string, phone: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/team/members/${userId}/phone`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ phone }),
      });
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error updating team member phone:', error);
      return { success: false, message: 'Failed to update phone', errors: ['NETWORK_ERROR'] };
    }
  }

  async deleteFeaturedJob(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/featured-jobs/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error deleting featured job:', error);
      return { success: false, message: 'Failed to delete featured job', errors: ['NETWORK_ERROR'] };
    }
  }

  async processFeaturedJobPayment(id: string, paymentData: {
    paymentId: string;
    paymentMethod?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/featured-jobs/${id}/payment`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(paymentData),
      });
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      return { success: false, message: 'Failed to process payment', errors: ['NETWORK_ERROR'] };
    }
  }



  // Resume endpoints
  async getResumes(): Promise<ApiResponse<Resume[]>> {
    const response = await fetch(`${API_BASE_URL}/user/resumes`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<Resume[]>(response);
  }

  async getResumeStats(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/user/resumes/stats`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<any>(response);
  }

  async createResume(data: Partial<Resume>): Promise<ApiResponse<Resume>> {
    const response = await fetch(`${API_BASE_URL}/user/resumes`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<Resume>(response);
  }

  async updateResume(id: string, data: Partial<Resume>): Promise<ApiResponse<Resume>> {
    const response = await fetch(`${API_BASE_URL}/user/resumes/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<Resume>(response);
  }

  async deleteResume(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/user/resumes/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async uploadResumeFile(file: File, title?: string, description?: string): Promise<ApiResponse<{ resumeId: string; filename: string }>> {
    const formData = new FormData();
    formData.append('resume', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type header - let the browser set it with boundary for FormData

    const response = await fetch(`${API_BASE_URL}/user/resumes/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse<{ resumeId: string; filename: string }>(response);
  }

  async setDefaultResume(id: string): Promise<ApiResponse<Resume>> {
    const response = await fetch(`${API_BASE_URL}/user/resumes/${id}/set-default`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<Resume>(response);
  }

  async downloadResume(id: string): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/user/resumes/${id}/download`, {
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.code === 'FILE_NOT_FOUND') {
        throw new Error('Resume file not found on server. Please re-upload your resume.');
      }
      throw new Error('Failed to download resume');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const contentDisposition = response.headers.get('content-disposition');
    let filename = 'resume.pdf';
    if (contentDisposition && contentDisposition.includes('filename=')) {
      filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
    }
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async viewResume(id: string): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/user/resumes/${id}/view`, {
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.code === 'FILE_NOT_FOUND') {
        throw new Error('Resume file not found on server. Please re-upload your resume.');
      }
      if (errorData.code === 'NO_FILE_UPLOADED') {
        throw new Error('This resume has no file attached. Please upload a resume file first.');
      }
      throw new Error('Failed to view resume');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');

    if (!newWindow) {
      throw new Error('Please allow popups to view the resume');
    }

    // Clean up the URL after a delay
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
  }

  // Fetch resume file (for viewing in a new tab)
  async fetchResumeFile(id: string): Promise<Response> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/user/resumes/${id}/download`, {
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if ((errorData as any).code === 'FILE_NOT_FOUND') {
        throw new Error('Resume file not found on server. Please re-upload your resume.');
      }
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  // Cover Letter endpoints
  async getCoverLetters(): Promise<ApiResponse<CoverLetter[]>> {
    const response = await fetch(`${API_BASE_URL}/user/cover-letters`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<CoverLetter[]>(response);
  }

  async getCoverLetterStats(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/user/cover-letters/stats`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<any>(response);
  }

  async createCoverLetter(data: Partial<CoverLetter>): Promise<ApiResponse<CoverLetter>> {
    const response = await fetch(`${API_BASE_URL}/user/cover-letters`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<CoverLetter>(response);
  }

  async updateCoverLetter(id: string, data: Partial<CoverLetter>): Promise<ApiResponse<CoverLetter>> {
    const response = await fetch(`${API_BASE_URL}/user/cover-letters/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<CoverLetter>(response);
  }

  async deleteCoverLetter(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/user/cover-letters/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async uploadCoverLetterFile(file: File): Promise<ApiResponse<{ coverLetterId: string; filename: string }>> {
    const formData = new FormData();
    formData.append('coverLetter', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/user/cover-letters/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse<{ coverLetterId: string; filename: string }>(response);
  }

  async setDefaultCoverLetter(id: string): Promise<ApiResponse<CoverLetter>> {
    const response = await fetch(`${API_BASE_URL}/user/cover-letters/${id}/set-default`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<CoverLetter>(response);
  }

  async downloadCoverLetter(id: string): Promise<Response> {
    const response = await fetch(`${API_BASE_URL}/user/cover-letters/${id}/download`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.code === 'FILE_NOT_FOUND') {
        throw new Error('Cover letter file not found on server. Please re-upload your cover letter.');
      }
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  // Fetch cover letter file (for viewing in a new tab)
  async fetchCoverLetterFile(id: string): Promise<Response> {
    const response = await fetch(`${API_BASE_URL}/user/cover-letters/${id}/download`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if ((errorData as any).code === 'FILE_NOT_FOUND') {
        throw new Error('Cover letter file not found on server. Please re-upload your cover letter.');
      }
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }


  // Download candidate cover letter (for employers)
  async downloadCandidateCoverLetter(candidateId: string, coverLetterId: string): Promise<Response> {
    const response = await fetch(`${API_BASE_URL}/user/employer/candidates/${candidateId}/cover-letters/${coverLetterId}/download`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }


  // Avatar upload endpoint
  async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string; user: User }>> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      console.log('🔍 API Service - Uploading avatar...');
      const response = await fetch(`${API_BASE_URL}/user/avatar`, {
        method: 'POST',
        headers,
        body: formData,
      });

      console.log('🔍 API Service - Avatar upload response status:', response.status);
      const result = await this.handleResponse<{ avatarUrl: string; user: User }>(response);
      console.log('🔍 API Service - Avatar upload result:', result);
      return result;
    } catch (error) {
      console.error('❌ API Service - uploadAvatar error:', error);
      throw error;
    }
  }


  // Google OAuth sync endpoint
  async syncGoogleProfile(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/oauth/sync-google-profile`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<any>(response);
  }

  // ==========================================
  // Work Experience Endpoints
  // ==========================================

  // Get all work experiences
  async getWorkExperiences(): Promise<ApiResponse<WorkExperience[]>> {
    const response = await fetch(`${API_BASE_URL}/user/work-experiences`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<WorkExperience[]>(response);
  }

  // Create a new work experience
  async createWorkExperience(data: WorkExperience): Promise<ApiResponse<WorkExperience>> {
    const response = await fetch(`${API_BASE_URL}/user/work-experiences`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return this.handleResponse<WorkExperience>(response);
  }

  // Update a work experience
  async updateWorkExperience(id: string, data: Partial<WorkExperience>): Promise<ApiResponse<WorkExperience>> {
    const response = await fetch(`${API_BASE_URL}/user/work-experiences/${id}`, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return this.handleResponse<WorkExperience>(response);
  }

  // Delete a work experience
  async deleteWorkExperience(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/user/work-experiences/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<void>(response);
  }

  // ==========================================
  // Education Management Methods
  // ==========================================

  // Get all educations for the authenticated user
  async getEducations(): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${API_BASE_URL}/user/educations`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<any[]>(response);
  }

  // Create a new education
  async createEducation(data: {
    degree: string;
    institution: string;
    fieldOfStudy?: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
    gpa?: number;
    percentage?: number;
    grade?: string;
    description?: string;
    location?: string;
    educationType?: string;
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/user/educations`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return this.handleResponse<any>(response);
  }

  // Update an education
  async updateEducation(id: string, data: Partial<{
    degree: string;
    institution: string;
    fieldOfStudy?: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
    gpa?: number;
    percentage?: number;
    grade?: string;
    description?: string;
    location?: string;
    educationType?: string;
  }>): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/user/educations/${id}`, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return this.handleResponse<any>(response);
  }

  // Delete an education
  async deleteEducation(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/user/educations/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<void>(response);
  }

  // Record search endpoint
  async recordSearch(searchData: {
    searchQuery: string;
    filters: any;
    resultsCount: number;
    searchType: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/search-history`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchData),
      });

      return this.handleResponse<any>(response);
    } catch (error) {
      console.error('Error recording search:', error);
      throw error;
    }
  }

  // Update dashboard stats endpoint
  async updateDashboardStats(updates: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/dashboard-stats`, {
        method: 'PUT',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      return this.handleResponse<any>(response);
    } catch (error) {
      console.error('Error updating dashboard stats:', error);
      throw error;
    }
  }


  // Job At Pace: activate premium visibility for jobseeker (no payment)
  async activateJobAtPace(planId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/user/job-at-pace/activate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ planId })
    });
    return this.handleResponse<any>(response);
  }

  // Get employer notifications
  async getEmployerNotifications(page: number = 1, limit: number = 20, params?: { unread?: boolean }): Promise<ApiResponse<any[]>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      if (params?.unread) {
        queryParams.append('unread', 'true');
      }

      const response = await fetch(`${API_BASE_URL}/user/employer/notifications?${queryParams.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse<any[]>(response);
    } catch (error) {
      console.error('❌ Error fetching employer notifications:', error);
      return {
        success: false,
        message: 'Failed to fetch employer notifications',
        errors: ['NETWORK_ERROR']
      };
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      return {
        success: false,
        message: 'Failed to mark notification as read',
        errors: ['NETWORK_ERROR']
      };
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/notifications/read-all`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      return {
        success: false,
        message: 'Failed to mark all notifications as read',
        errors: ['NETWORK_ERROR']
      };
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      return {
        success: false,
        message: 'Failed to delete notification',
        errors: ['NETWORK_ERROR']
      };
    }
  }

  // Get employer's hot vacancies
  async getEmployerHotVacancies(): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/hot-vacancies/employer`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse<any[]>(response);
    } catch (error) {
      console.error('❌ Error fetching employer hot vacancies:', error);
      return {
        success: false,
        message: 'Failed to fetch hot vacancies',
        errors: ['NETWORK_ERROR']
      };
    }
  }

  // Get similar jobs
  async getSimilarJobs(jobId: string, limit: number = 5): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/similar?limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse<any[]>(response);
    } catch (error) {
      console.error('❌ Error fetching similar jobs:', error);
      return {
        success: false,
        message: 'Failed to fetch similar jobs',
        errors: ['NETWORK_ERROR']
      };
    }
  }

  // Profile view tracking
  async trackProfileView(userId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/track-profile-view/${userId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error tracking profile view:', error);
      return {
        success: false,
        message: 'Failed to track profile view',
        errors: ['NETWORK_ERROR']
      };
    }
  }

  // Interview scheduling methods
  async scheduleInterview(data: {
    jobApplicationId: string;
    candidateId: string;
    jobId?: string;
    title?: string;
    description?: string;
    interviewType: 'phone' | 'video' | 'in_person' | 'technical' | 'hr' | 'final';
    scheduledAt: string;
    duration?: number;
    timezone?: string;
    location?: any;
    meetingLink?: string;
    meetingPassword?: string;
    interviewers?: any[];
    agenda?: any[];
    requirements?: any;
    notes?: string;
  }): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/interviews`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<any>(response);
  }

  async getEmployerInterviews(status?: string, page: number = 1, limit: number = 10): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await fetch(`${API_BASE_URL}/interviews/employer?${params}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  async getCandidateInterviews(status?: string, page: number = 1, limit: number = 10): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await fetch(`${API_BASE_URL}/interviews/candidate?${params}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  async getInterviewDetails(interviewId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/interviews/${interviewId}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  async updateInterview(interviewId: string, data: any): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/interviews/${interviewId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<any>(response);
  }

  async cancelInterview(interviewId: string, reason?: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/interviews/${interviewId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    return this.handleResponse<any>(response);
  }

  async getUpcomingInterviews(limit: number = 5): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/interviews/employer?status=scheduled&limit=${limit}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  // Gulf-specific API methods
  async getGulfJobs(params?: {
    page?: number;
    limit?: number;
    search?: string;
    location?: string;
    jobType?: string;
    experienceLevel?: string;
    salaryMin?: number;
    salaryMax?: number;
    companyId?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ApiResponse<{ jobs: Job[]; pagination: any }>> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const response = await fetch(`${API_BASE_URL}/gulf/jobs?${queryParams.toString()}`, {
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<{ jobs: Job[]; pagination: any }>(response);
    } catch (error) {
      console.error('❌ Error fetching Gulf jobs:', error);
      return {
        success: false,
        message: 'Failed to fetch Gulf jobs',
        data: { jobs: [], pagination: {} }
      };
    }
  }

  async getGulfJobById(id: string): Promise<ApiResponse<Job>> {
    const response = await fetch(`${API_BASE_URL}/gulf/jobs/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<Job>(response);
  }

  async getSimilarGulfJobs(id: string, limit?: number): Promise<ApiResponse<Job[]>> {
    const queryParams = limit ? `?limit=${limit}` : '';
    const response = await fetch(`${API_BASE_URL}/gulf/jobs/${id}/similar${queryParams}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<Job[]>(response);
  }

  async getGulfCompanies(params?: {
    page?: number;
    limit?: number;
    search?: string;
    industry?: string;
    companySize?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ApiResponse<{ companies: Company[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const response = await fetch(`${API_BASE_URL}/gulf/companies?${queryParams.toString()}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ companies: Company[]; pagination: any }>(response);
  }

  async getGulfJobApplications(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<{ applications: JobApplication[]; pagination: any }>> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const response = await fetch(`${API_BASE_URL}/gulf/applications?${queryParams.toString()}`, {
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<{ applications: JobApplication[]; pagination: any }>(response);
    } catch (error) {
      console.error('❌ Error fetching Gulf job applications:', error);
      return {
        success: false,
        message: 'Failed to fetch Gulf job applications',
        data: { applications: [], pagination: {} }
      };
    }
  }

  async getGulfEmployerApplications(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<JobApplication[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const response = await fetch(`${API_BASE_URL}/gulf/employer/applications?${queryParams.toString()}`, {
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<JobApplication[]>(response);
    } catch (error) {
      console.error('❌ Error fetching Gulf employer applications:', error);
      return {
        success: false,
        message: 'Failed to fetch Gulf employer applications',
        data: []
      };
    }
  }

  async getGulfJobBookmarks(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ bookmarks: JobBookmark[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const response = await fetch(`${API_BASE_URL}/gulf/bookmarks?${queryParams.toString()}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ bookmarks: JobBookmark[]; pagination: any }>(response);
  }

  async getGulfJobAlerts(params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<ApiResponse<{ alerts: JobAlert[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const response = await fetch(`${API_BASE_URL}/gulf/alerts?${queryParams.toString()}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ alerts: JobAlert[]; pagination: any }>(response);
  }

  async getGulfDashboardStats(): Promise<ApiResponse<{
    gulfApplications: number;
    gulfBookmarks: number;
    gulfAlerts: number;
    totalGulfJobs: number;
    stats: any;
  }>> {
    const response = await fetch(`${API_BASE_URL}/gulf/dashboard/stats`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{
      gulfApplications: number;
      gulfBookmarks: number;
      gulfAlerts: number;
      totalGulfJobs: number;
      stats: any;
    }>(response);
  }

  async bookmarkGulfJob(jobId: string): Promise<ApiResponse<JobBookmark>> {
    const response = await fetch(`${API_BASE_URL}/gulf/jobs/${jobId}/bookmark`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<JobBookmark>(response);
  }

  async removeGulfJobBookmark(jobId: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/gulf/jobs/${jobId}/bookmark`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async createGulfJobAlert(alertData: {
    keywords?: string;
    location?: string;
    jobType?: string;
    experienceLevel?: string;
    salaryMin?: number;
    salaryMax?: number;
    isActive?: boolean;
  }): Promise<ApiResponse<JobAlert>> {
    const response = await fetch(`${API_BASE_URL}/gulf/alerts`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(alertData),
    });
    return this.handleResponse<JobAlert>(response);
  }

  async updateGulfJobAlert(alertId: string, alertData: Partial<JobAlert>): Promise<ApiResponse<JobAlert>> {
    const response = await fetch(`${API_BASE_URL}/gulf/alerts/${alertId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(alertData),
    });
    return this.handleResponse<JobAlert>(response);
  }

  async deleteGulfJobAlert(alertId: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/gulf/alerts/${alertId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Bulk Import Methods
  async getBulkImports(params?: {
    page?: number;
    limit?: number;
    status?: string;
    importType?: string;
  }): Promise<ApiResponse<{
    imports: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.importType) queryParams.append('importType', params.importType);

    const response = await fetch(`${API_BASE_URL}/bulk-import?${queryParams.toString()}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getBulkImport(importId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/bulk-import/${importId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async createBulkImport(formData: FormData): Promise<ApiResponse<any>> {
    // Get auth token without Content-Type header for multipart/form-data
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Don't set Content-Type - let browser set it automatically with boundary

    const response = await fetch(`${API_BASE_URL}/bulk-import`, {
      method: 'POST',
      headers: headers,
      body: formData,
    });
    return this.handleResponse(response);
  }

  async cancelBulkImport(importId: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/bulk-import/${importId}/cancel`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Admin Methods
  async getAdminStats(): Promise<ApiResponse<any>> {
    return this.get('/admin/stats');
  }

  async getAllUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    userType?: string;
    status?: string;
    region?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.userType) queryParams.append('userType', params.userType);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.region) queryParams.append('region', params.region);

    return this.get(`/admin/users?${queryParams.toString()}`);
  }

  async getUsersByRegion(region: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
    userType?: string;
    status?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.userType) queryParams.append('userType', params.userType);
    if (params?.status) queryParams.append('status', params.status);

    return this.get(`/admin/users/region/${region}?${queryParams.toString()}`);
  }

  async getUsersByPortal(portal: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
    userType?: string;
    status?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.userType) queryParams.append('userType', params.userType);
    if (params?.status) queryParams.append('status', params.status);

    return this.get(`/admin/users/portal/${portal}?${queryParams.toString()}`);
  }

  async updateUserStatus(userId: string, status: string): Promise<ApiResponse<any>> {
    return this.patch(`/admin/users/${userId}/status`, { status });
  }

  async deleteUser(userId: string): Promise<ApiResponse<any>> {
    return this.delete(`/admin/users/${userId}`);
  }

  async exportUsers(params?: {
    userType?: string;
    status?: string;
    region?: string;
  }): Promise<ApiResponse<string>> {
    const queryParams = new URLSearchParams();
    if (params?.userType) queryParams.append('userType', params.userType);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.region) queryParams.append('region', params.region);

    const response = await fetch(`${API_BASE_URL}/admin/users/export?${queryParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to export users');
    }

    const csvData = await response.text();
    return { success: true, message: 'Export successful', data: csvData };
  }

  async getAllCompanies(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    region?: string;
    verification?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.region) queryParams.append('region', params.region);
    if (params?.verification) queryParams.append('verification', params.verification);

    return this.get(`/admin/companies?${queryParams.toString()}`);
  }

  async getCompaniesByRegion(region: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    verification?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.verification) queryParams.append('verification', params.verification);

    return this.get(`/admin/companies/region/${region}?${queryParams.toString()}`);
  }

  async updateCompanyStatus(companyId: string, status: string): Promise<ApiResponse<any>> {
    return this.patch(`/admin/companies/${companyId}/status`, { isActive: status === 'active' });
  }

  async updateCompanyVerification(companyId: string, verification: string): Promise<ApiResponse<any>> {
    return this.patch(`/admin/companies/${companyId}/verification`, { verificationStatus: verification });
  }

  async deleteCompany(companyId: string): Promise<ApiResponse<any>> {
    return this.delete(`/admin/companies/${companyId}`);
  }

  async exportCompanies(params?: {
    status?: string;
    region?: string;
    verification?: string;
  }): Promise<ApiResponse<string>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.region) queryParams.append('region', params.region);
    if (params?.verification) queryParams.append('verification', params.verification);

    const response = await fetch(`${API_BASE_URL}/admin/companies/export?${queryParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to export companies');
    }

    const csvData = await response.text();
    return { success: true, message: 'Export successful', data: csvData };
  }

  async getAllJobs(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    region?: string;
    jobType?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.region) queryParams.append('region', params.region);
    if (params?.jobType) queryParams.append('jobType', params.jobType);

    return this.get(`/admin/jobs?${queryParams.toString()}`);
  }

  async getJobsByRegion(region: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    jobType?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.jobType) queryParams.append('jobType', params.jobType);

    return this.get(`/admin/jobs/region/${region}?${queryParams.toString()}`);
  }


  async exportJobs(params?: {
    status?: string;
    region?: string;
    jobType?: string;
  }): Promise<ApiResponse<string>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.region) queryParams.append('region', params.region);
    if (params?.jobType) queryParams.append('jobType', params.jobType);

    const response = await fetch(`${API_BASE_URL}/admin/jobs/export?${queryParams.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to export jobs');
    }

    const csvData = await response.text();
    return { success: true, message: 'Export successful', data: csvData };
  }

  async retryBulkImport(importId: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/bulk-import/${importId}/retry`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async downloadBulkImportTemplate(type: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/bulk-import/template/${type}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to download template');
    }

    return response.blob();
  }

  async deleteBulkImport(importId: string, deleteJobs: boolean = false): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (deleteJobs) queryParams.append('deleteJobs', 'true');

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/bulk-import/${importId}${query}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async deleteAllBulkImports(deleteJobs: boolean = false): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (deleteJobs) queryParams.append('deleteJobs', 'true');

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/bulk-import${query}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // ============================================================================
  // ADMIN METHODS

  async getUserDetails(userId: string): Promise<ApiResponse<any>> {
    return this.get(`/admin/users/${userId}/details`);
  }

  async getCompanyDetails(companyId: string): Promise<ApiResponse<any>> {
    return this.get(`/admin/companies/${companyId}/details`);
  }

  async getJobDetails(jobId: string): Promise<ApiResponse<any>> {
    return this.get(`/admin/jobs/${jobId}/details`);
  }

  // Hot Vacancy endpoints
  async createHotVacancy(data: any): Promise<ApiResponse<any>> {
    console.log('🔥 createHotVacancy - Sending data:', data);
    const response = await fetch(`${API_BASE_URL}/hot-vacancies`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse<any>(response);
  }

  async getHotVacancies(params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<any>> {
    const query = params
      ? '?' + Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
      : '';

    return this.makeRequest(`/hot-vacancies${query}`, async () => {
      const response = await fetch(`${this.baseURL}/hot-vacancies${query}`, {
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse<any>(response);
    });
  }

  async getHotVacancyById(id: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/hot-vacancies/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  async updateHotVacancy(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/hot-vacancies/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<any>(response);
  }

  async deleteHotVacancy(id: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/hot-vacancies/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  async getHotVacancyPricingTiers(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/hot-vacancies/pricing`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  async getPublicHotVacancies(params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<any>> {
    const query = params
      ? '?' + Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
      : '';

    try {
      const response = await fetch(`${API_BASE_URL}/hot-vacancies/public${query}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error in getPublicHotVacancies:', error);
      return {
        success: false,
        message: 'Failed to fetch hot vacancies. Please try again later.'
      };
    }
  }

  async uploadHotVacancyPhoto(hotVacancyId: string, file: File, metadata?: any): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('photo', file);
    if (metadata) {
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });
    }

    const authHeaders = this.getAuthHeaders() as Record<string, string>;
    const response = await fetch(`${API_BASE_URL}/hot-vacancies/${hotVacancyId}/photos/upload`, {
      method: 'POST',
      headers: {
        'Authorization': authHeaders['Authorization'],
      },
      body: formData,
    });
    return this.handleResponse<any>(response);
  }

  async getHotVacancyPhotos(hotVacancyId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/hot-vacancies/${hotVacancyId}/photos`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  async deleteHotVacancyPhoto(photoId: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/hot-vacancies/photos/${photoId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  /**
   * Delete user account permanently
   */

  // Admin Notifications API methods
  async getAdminNotifications(params?: {
    page?: number;
    limit?: number;
    category?: string;
    priority?: string;
    isRead?: boolean;
    type?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.isRead !== undefined) queryParams.append('isRead', params.isRead.toString());
    if (params?.type) queryParams.append('type', params.type);

    return this.get(`/admin/notifications?${queryParams.toString()}`);
  }

  async getAdminNotificationStats(): Promise<ApiResponse<any>> {
    return this.get('/admin/notifications/stats');
  }

  async markAdminNotificationAsRead(id: string): Promise<ApiResponse<any>> {
    return this.put(`/admin/notifications/${id}/read`, {});
  }

  async markAllAdminNotificationsAsRead(): Promise<ApiResponse<any>> {
    return this.put('/admin/notifications/read-all', {});
  }

  async checkAdminMilestones(): Promise<ApiResponse<any>> {
    return this.post('/admin/notifications/check-milestones', {});
  }

  async cleanupAdminNotifications(daysOld: number = 90): Promise<ApiResponse<any>> {
    return this.post('/admin/notifications/cleanup', { daysOld });
  }

  // Payment methods
  async initiatePayment(
    planType: string,
    quantity: number,
    amount: number,
    customerDetails: {
      name: string;
      email: string;
      phone: string;
    },
    metadata: any = {}
  ): Promise<ApiResponse<any>> {
    return this.post('/payments/initiate', {
      planType,
      quantity,
      amount,
      customerDetails,
      metadata
    });
  }

  async verifyPayment(paymentId: string, orderId: string): Promise<ApiResponse<any>> {
    return this.post('/payments/verify', {
      paymentId,
      orderId
    });
  }

  // Send support message
  async sendSupportMessage(data: {
    firstName: string;
    lastName: string;
    email: string;
    subject: string;
    message: string;
    category: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/support/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error sending support message:', error);
      return {
        success: false,
        message: 'Failed to send support message',
        errors: ['NETWORK_ERROR']
      };
    }
  }

  // Get support messages (admin only)
  async getSupportMessages(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    priority?: string;
  }): Promise<ApiResponse<any[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.category) queryParams.append('category', params.category);
      if (params?.priority) queryParams.append('priority', params.priority);

      const url = `${API_BASE_URL}/support/messages${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse<any[]>(response);
    } catch (error) {
      console.error('❌ Error fetching support messages:', error);
      return {
        success: false,
        message: 'Failed to fetch support messages',
        errors: ['NETWORK_ERROR']
      };
    }
  }

  // Update support message (admin only)
  async updateSupportMessage(messageId: string, data: {
    status?: string;
    response?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/support/messages/${messageId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });

      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error updating support message:', error);
      return {
        success: false,
        message: 'Failed to update support message',
        errors: ['NETWORK_ERROR']
      };
    }
  }

  // Mark support message as read (admin only)
  async markSupportMessageAsRead(messageId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/support/messages/${messageId}/read`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error marking support message as read:', error);
      return {
        success: false,
        message: 'Failed to mark support message as read',
        errors: ['NETWORK_ERROR']
      };
    }
  }

  // Get support statistics (admin only)
  async getSupportStats(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/support/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('❌ Error fetching support stats:', error);
      return {
        success: false,
        message: 'Failed to fetch support statistics',
        errors: ['NETWORK_ERROR']
      };
    }
  }

  // Delete account (GDPR compliant)
  async deleteAccount(data: { currentPassword: string; confirmationText: string }) {
    const response = await fetch('/api/user/account', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async sendOTPForRegion(email: string, region: string) {
    const response = await fetch(`${API_BASE_URL}/auth/send-otp-region`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, region })
    });
    return response.json();
  }

  // ========== JOB TEMPLATES API ==========

  async getJobTemplates(params?: { category?: string; search?: string; isPublic?: boolean }): Promise<ApiResponse<JobTemplate[]>> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.isPublic !== undefined) queryParams.append('isPublic', params.isPublic.toString());

    const response = await fetch(`${API_BASE_URL}/job-templates?${queryParams.toString()}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<JobTemplate[]>(response);
  }

  async getJobTemplate(id: string): Promise<ApiResponse<JobTemplate>> {
    const response = await fetch(`${API_BASE_URL}/job-templates/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<JobTemplate>(response);
  }

  async createJobTemplate(templateData: CreateJobTemplateRequest): Promise<ApiResponse<JobTemplate>> {
    const response = await fetch(`${API_BASE_URL}/job-templates`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(templateData),
    });

    return this.handleResponse<JobTemplate>(response);
  }

  async updateJobTemplate(id: string, templateData: UpdateJobTemplateRequest): Promise<ApiResponse<JobTemplate>> {
    const response = await fetch(`${API_BASE_URL}/job-templates/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(templateData),
    });

    return this.handleResponse<JobTemplate>(response);
  }

  async deleteJobTemplate(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/job-templates/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<void>(response);
  }

  async useJobTemplate(id: string): Promise<ApiResponse<JobTemplate>> {
    const response = await fetch(`${API_BASE_URL}/job-templates/${id}/use`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<JobTemplate>(response);
  }

  async getJobTemplateCategories(): Promise<ApiResponse<string[]>> {
    const response = await fetch(`${API_BASE_URL}/job-templates/categories`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<string[]>(response);
  }

  async toggleTemplatePublic(id: string): Promise<ApiResponse<JobTemplate>> {
    const response = await fetch(`${API_BASE_URL}/job-templates/${id}/toggle-public`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<JobTemplate>(response);
  }

  async createJobFromTemplate(id: string): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/job-templates/${id}/apply`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<any>(response);
  }

  async getJobTemplateById(id: string): Promise<ApiResponse<JobTemplate>> {
    return this.getJobTemplate(id);
  }

  // Send invitations (admin only)
  async sendInvitations(data: { emails: string[]; template: string; type: string }): Promise<ApiResponse<any>> {
    return this.post('/admin/send-invitations', data);
  }

}

export const apiService = new ApiService();
