"use client"

import { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { apiService, User, SignupData, EmployerSignupData, LoginData, AuthResponse } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { sampleJobManager } from '@/lib/sampleJobManager';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signup: (data: SignupData) => Promise<AuthResponse | undefined>;
  employerSignup: (data: EmployerSignupData) => Promise<AuthResponse | undefined>;
  login: (data: LoginData) => Promise<AuthResponse | undefined>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUser: (userData: User) => void;
  refreshUser: () => Promise<void>;
  debouncedRefreshUser: () => void;
  manualRefreshUser: () => Promise<void>;
  refreshing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Rate limiting: minimum 10 seconds between refresh calls
  const MIN_REFRESH_INTERVAL = 10000; // 10 seconds

  // Normalize backend /auth/me response (snake_case) to frontend User (camelCase)
  const mapUserFromApi = (u: any): User => ({
    id: u.id,
    email: u.email,
    firstName: u.first_name ?? u.firstName,
    lastName: u.last_name ?? u.lastName,
    userType: (u.user_type ?? u.userType) as User['userType'],
    region: u.region ?? u.user_region ?? (u.preferences?.region),
    regions: u.regions ?? u.preferences?.regions ?? [u.region ?? u.user_region ?? (u.preferences?.region)].filter(Boolean),
    isEmailVerified: u.is_email_verified ?? u.isEmailVerified,
    accountStatus: u.account_status ?? u.accountStatus,
    avatar: u.avatar,
    phone: u.phone,
    currentLocation: u.current_location ?? u.currentLocation,
    headline: u.headline,
    summary: u.summary,
    profileCompletion: u.profile_completion ?? u.profileCompletion,
    lastLoginAt: u.last_login_at ?? u.lastLoginAt,
    companyId: u.company_id ?? u.companyId,
    designation: u.designation,
    skills: u.skills,
    languages: u.languages,
    expectedSalary: u.expected_salary ?? u.expectedSalary,
    currentSalary: u.current_salary ?? u.currentSalary,
    noticePeriod: u.notice_period ?? u.noticePeriod,
    willingToRelocate: u.willing_to_relocate ?? u.willingToRelocate,
    gender: u.gender,
    profileVisibility: u.profile_visibility ?? u.profileVisibility,
    contactVisibility: u.contact_visibility ?? u.contactVisibility,
    certifications: u.certifications,
    socialLinks: u.social_links ?? u.socialLinks,
    preferences: u.preferences,
    oauthProvider: u.oauth_provider ?? u.oauthProvider,
    oauthId: u.oauth_id ?? u.oauthId,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    // Personal Details
    dateOfBirth: u.date_of_birth ?? u.dateOfBirth,
    // Professional Details
    experienceYears: u.experience_years ?? u.experienceYears,
    currentCompany: u.current_company ?? u.currentCompany,
    currentRole: u.current_role ?? u.currentRole,
    highestEducation: u.highest_education ?? u.highestEducation,
    fieldOfStudy: u.field_of_study ?? u.fieldOfStudy,
    // Preferred Professional Details
    preferredJobTitles: u.preferred_job_titles ?? u.preferredJobTitles,
    preferredIndustries: u.preferred_industries ?? u.preferredIndustries,
    preferredLocations: u.preferred_locations ?? u.preferredLocations,
    preferredCompanySize: u.preferred_company_size ?? u.preferredCompanySize,
    preferredWorkMode: u.preferred_work_mode ?? u.preferredWorkMode,
    preferredEmploymentType: u.preferred_employment_type ?? u.preferredEmploymentType,
    // passthrough helpers if provided by API
    ...(u.requiresPasswordSetup !== undefined && { requiresPasswordSetup: u.requiresPasswordSetup }),
    ...(u.hasPassword !== undefined && { hasPassword: u.hasPassword }),
  });

  useEffect(() => {
    // Initialize sample job manager from storage first
    sampleJobManager.initializeFromStorage();
    
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        
        console.log('🔍 AuthProvider - Initializing auth:', {
          hasToken: !!token,
          hasStoredUser: !!storedUser,
          tokenPreview: token ? `${token.substring(0, 20)}...` : 'null'
        });
        
        // If we have both token and stored user, set user immediately to avoid race conditions
        if (token && storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            console.log('🔍 AuthProvider - Setting user from localStorage immediately:', {
              id: userData.id,
              userType: userData.userType,
              email: userData.email
            });
            setUser(userData);
            sampleJobManager.setCurrentUser(userData.id);
            
            // Verify token in background without blocking UI
            setTimeout(async () => {
              try {
                const response = await apiService.getCurrentUser();
                if (response.success && response.data?.user) {
                  const normalized = mapUserFromApi(response.data.user as any);
                  console.log('🔍 AuthProvider - Token verified, updating user:', {
                    id: normalized.id,
                    userType: normalized.userType
                  });
                  setUser(normalized);
                  sampleJobManager.setCurrentUser(normalized.id);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('user', JSON.stringify(normalized));
                  }
                } else {
                  console.log('❌ AuthProvider - Token invalid, clearing auth');
                  apiService.clearAuth();
                  setUser(null);
                  sampleJobManager.setCurrentUser(null);
                }
              } catch (error) {
                console.error('❌ AuthProvider - Token verification failed:', error);
                // Don't clear auth on network errors, just log
              }
            }, 100);
            
          } catch (error) {
            console.error('Error parsing stored user data:', error);
            apiService.clearAuth();
            setUser(null);
            sampleJobManager.setCurrentUser(null);
          }
        } else if (token && !storedUser) {
          // We have a token but no stored user, fetch user data
          console.log('🔍 AuthProvider - Token found but no stored user, fetching...');
          const response = await apiService.getCurrentUser();
          if (response.success && response.data?.user) {
            const normalized = mapUserFromApi(response.data.user as any);
            console.log('🔍 AuthProvider - User fetched from API:', {
              id: normalized.id,
              userType: normalized.userType
            });
            setUser(normalized);
            sampleJobManager.setCurrentUser(normalized.id);
            if (typeof window !== 'undefined') {
              localStorage.setItem('user', JSON.stringify(normalized));
            }
          } else {
            console.log('❌ AuthProvider - Token invalid, clearing auth');
            apiService.clearAuth();
            setUser(null);
            sampleJobManager.setCurrentUser(null);
          }
        } else {
          console.log('🔍 AuthProvider - No token found, user not authenticated');
          setUser(null);
          sampleJobManager.setCurrentUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        apiService.clearAuth();
        setUser(null);
        sampleJobManager.setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const signup = async (data: SignupData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await apiService.signup(data);
      
      if (response.success && response.data?.user) {
        const normalized = mapUserFromApi(response.data.user as any);
        setUser(normalized);
        // Sync with sample job manager
        sampleJobManager.setCurrentUser(normalized.id);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(normalized));
        }
        // Return the response data so the calling component can handle redirection
        return { ...response.data, user: normalized } as any;
      } else {
        setError(response.message || 'Signup failed');
        throw new Error(response.message || 'Signup failed');
      }
    } catch (error: any) {
      setError(error.message || 'Signup failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const employerSignup = async (data: EmployerSignupData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await apiService.employerSignup(data);
      
      if (response.success && response.data?.user) {
        const normalized = mapUserFromApi(response.data.user as any);
        setUser(normalized);
        // Sync with sample job manager
        sampleJobManager.setCurrentUser(normalized.id);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(normalized));
        }
        // Return the response data so the calling component can handle redirection
        return { ...response.data, user: normalized } as any;
      } else {
        setError(response.message || 'Employer signup failed');
        throw new Error(response.message || 'Employer signup failed');
      }
    } catch (error: any) {
      setError(error.message || 'Employer signup failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: LoginData) => {
    try {
      setError(null);
      setLoading(true);
      // Clear any stale auth before performing login to avoid misrouting due to old data
      apiService.clearAuth();

      const response = await apiService.login(data);
      
      if (response.success && response.data?.user) {
        const normalized = mapUserFromApi(response.data.user as any);
        setUser(normalized);
        // Sync with sample job manager
        sampleJobManager.setCurrentUser(normalized.id);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(normalized));
        }
        
        // Dashboard stats update removed temporarily to fix login issues
        // TODO: Re-enable dashboard stats update once the endpoint is working properly
        
        // Return the response data so the calling component can handle redirection
        return { ...response.data, user: normalized } as any;
      } else {
        // Don't set user in context if login failed
        setUser(null);
        sampleJobManager.setCurrentUser(null);
        setError(response.message || 'Login failed');
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      // Ensure user is not set in context on error
      setUser(null);
      sampleJobManager.setCurrentUser(null);
      setError(error.message || 'Login failed');
      throw error; // Re-throw the error so the login page can handle it
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      // Clear sample job manager data
      sampleJobManager.setCurrentUser(null);
      apiService.clearAuth();
      router.push('/');
    }
  };

  const updateUser = (userData: User) => {
    const normalized = mapUserFromApi(userData as any);
    setUser(normalized);
    // Sync with sample job manager
    sampleJobManager.setCurrentUser(normalized.id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(normalized));
    }
  };

  const refreshUser = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Check if enough time has passed since last refresh (unless forced)
    if (!force && now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
      console.log('🔄 Rate limiting refreshUser - too soon since last refresh');
      toast.info('Please wait a moment before refreshing user data.');
      return;
    }

    // Clear any pending refresh timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    try {
      setRefreshing(true);
      setLastRefreshTime(now);
      
      if (apiService.isAuthenticated()) {
        // Use getUserProfile for more complete data including all profile fields
        let response = await apiService.getUserProfile();
        if (!response.success || !response.data?.user) {
          // Fallback to getCurrentUser if getUserProfile fails
          response = await apiService.getCurrentUser();
        }
        if (response.success && response.data?.user) {
          const normalized = mapUserFromApi(response.data.user as any);
          setUser(normalized);
          // Sync with sample job manager
          sampleJobManager.setCurrentUser(normalized.id);
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(normalized));
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      
      // If it's a rate limit error, schedule a retry with exponential backoff
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('Too many requests')) {
        console.log('🔄 Rate limited - scheduling retry with backoff');
        toast.warning('Too many requests. Retrying automatically in a moment...');
        const retryDelay = Math.min(30000, MIN_REFRESH_INTERVAL * 2); // Max 30 seconds
        
        refreshTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Retrying refresh after rate limit');
          refreshUser();
        }, retryDelay);
      }
      
      // Don't update lastRefreshTime on error to allow retry
      setLastRefreshTime(now - MIN_REFRESH_INTERVAL);
    } finally {
      setRefreshing(false);
    }
  }, [lastRefreshTime]);

  // Debounced refresh function for use in intervals
  const debouncedRefreshUser = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      refreshUser();
    }, 1000); // 1 second debounce
  }, [refreshUser]);

  // Manual refresh function that bypasses rate limiting for user-initiated refreshes
  const manualRefreshUser = useCallback(async () => {
    try {
      setRefreshing(true);
      
      if (apiService.isAuthenticated()) {
        // Use getUserProfile for more complete data including all profile fields
        let response = await apiService.getUserProfile();
        if (!response.success || !response.data?.user) {
          // Fallback to getCurrentUser if getUserProfile fails
          response = await apiService.getCurrentUser();
        }
        if (response.success && response.data?.user) {
          const normalized = mapUserFromApi(response.data.user as any);
          setUser(normalized);
          // Sync with sample job manager
          sampleJobManager.setCurrentUser(normalized.id);
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(normalized));
          }
          toast.success('User data refreshed successfully');
        }
      }
    } catch (error: any) {
      console.error('Error manually refreshing user data:', error);
      toast.error(error.message || 'Failed to refresh user data');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    signup,
    employerSignup,
    login,
    logout,
    clearError,
    updateUser,
    refreshUser,
    debouncedRefreshUser,
    manualRefreshUser,
    refreshing,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
