"use client"

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { apiService } from '@/lib/api'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Send, CheckCircle, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { HRCharacter, JobseekerCharacter, ChatbotButtonCharacter } from './animated-characters'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

interface Message {
  id: string
  type: 'bot' | 'user'
  text: string
  timestamp: Date
}

interface RegistrationData {
  fullName: string
  email: string
  password: string
  phone: string
  experience: string
  region: string
}

// Engaging questions pool (non-repetitive)
const engagingQuestions = [
  "What's the most important factor you consider when looking at a job opportunity?",
  "Have you found any job listings that caught your attention today?",
  "What industry or field are you most interested in exploring?",
  "How do you usually discover new job opportunities?",
  "What's your biggest challenge when searching for jobs online?",
  "What makes a company profile stand out to you?",
  "Are you open to relocating for the right opportunity?",
  "What's your ideal work environment - remote, hybrid, or on-site?",
  "What skills are you most excited to bring to your next role?",
  "How important is company culture in your job search?",
]

interface ChatbotConfig {
  hrCharacterSrc?: string
  jobseekerCharacterSrc?: string
  buttonCharacterSrc?: string
}

export function RegistrationChatbot({ 
  hrCharacterSrc, 
  jobseekerCharacterSrc, 
  buttonCharacterSrc 
}: ChatbotConfig = {}) {
  const { user, loading, login, signup: authSignup, refreshUser } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentStep, setCurrentStep] = useState<'greeting' | 'purpose' | 'email' | 'checkAccount' | 'login' | 'name' | 'engaging' | 'registration' | 'complete' | 'goodbye'>('greeting')
  const [userPurpose, setUserPurpose] = useState<'jobseeker' | 'employer' | null>(null)
  const [lastUserResponse, setLastUserResponse] = useState<string>('')
  const [repeatedResponseCount, setRepeatedResponseCount] = useState(0)
  const [isGoodbye, setIsGoodbye] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')
  const [accountExists, setAccountExists] = useState<boolean | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [askedQuestions, setAskedQuestions] = useState<number[]>([])
  const [registrationData, setRegistrationData] = useState<Partial<RegistrationData>>({})
  const [currentField, setCurrentField] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isHomePortal = pathname === '/'
  const isGulfOpportunitiesPortal = pathname === '/gulf-opportunities'
  const shouldEmphasizeDualAccess = isHomePortal || isGulfOpportunitiesPortal
  const defaultPortalRegion = isGulfOpportunitiesPortal ? 'gulf' : 'india'
  const dualAccessMessage = 'By registering from here you are eligible for Gulf jobs and Indian jobs.'

  // Don't show chatbot if user is authenticated
  useEffect(() => {
    if (!loading && user) {
      setIsOpen(false)
    }
  }, [user, loading])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when chatbot opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen, currentStep])

  // Initialize conversation
  useEffect(() => {
    if (isOpen && messages.length === 0 && currentStep === 'greeting' && !isGoodbye) {
      setTimeout(() => {
        addBotMessage("Hello! 👋 I'm Sarah, your friendly assistant. I'm here to help you!")
      }, 500)
      setTimeout(() => {
        addBotMessage("I'm here to help you with job opportunities in India and Gulf regions! 🌍")
      }, 2000)
      if (shouldEmphasizeDualAccess) {
        setTimeout(() => {
          addBotMessage(dualAccessMessage)
        }, 3200)
      }
      setTimeout(() => {
        addBotMessage("Are you looking for a job, or are you here to get an employee?")
        setCurrentStep('purpose')
      }, shouldEmphasizeDualAccess ? 4800 : 3500)
    }
  }, [isOpen, isGoodbye])

  // Reset conversation when chatbot closes after goodbye
  useEffect(() => {
    if (!isOpen && isGoodbye) {
      // Reset after a delay to allow cleanup
      const timer = setTimeout(() => {
        setMessages([])
        setCurrentStep('greeting')
        setIsGoodbye(false)
        setRepeatedResponseCount(0)
        setLastUserResponse('')
        setRegistrationData({})
        setCurrentField(null)
        setAskedQuestions([])
        setUserPurpose(null)
        setUserEmail('')
        setAccountExists(null)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isOpen, isGoodbye])

  // Reset conversation when chatbot is closed manually (not via goodbye)
  useEffect(() => {
    if (!isOpen && !isGoodbye && messages.length > 0) {
      const timer = setTimeout(() => {
        setMessages([])
        setCurrentStep('greeting')
        setRepeatedResponseCount(0)
        setLastUserResponse('')
        setRegistrationData({})
        setCurrentField(null)
        setAskedQuestions([])
        setUserPurpose(null)
        setUserEmail('')
        setAccountExists(null)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, isGoodbye])

  const addBotMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      text,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const addUserMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const renderTextWithLinks = (text: string) => {
    const linkDefinitions = [
      { token: '/employer-register', href: '/employer-register', label: 'Employer Register' },
      { token: '/employer-login', href: '/employer-login', label: 'Employer Login' }
    ]

    const parts: ReactNode[] = []
    let remaining = text
    let linkKey = 0

    while (remaining.length > 0) {
      const nextToken = linkDefinitions
        .map(def => ({ ...def, index: remaining.indexOf(def.token) }))
        .filter(def => def.index >= 0)
        .sort((a, b) => a.index - b.index)[0]

      if (!nextToken) {
        parts.push(remaining)
        break
      }

      if (nextToken.index > 0) {
        parts.push(remaining.slice(0, nextToken.index))
      }

      parts.push(
        <Link
          key={`link-${linkKey}`}
          href={nextToken.href}
          className="text-blue-600 hover:text-blue-700 underline font-semibold mx-1 inline-block"
          onClick={() => setIsOpen(false)}
        >
          {nextToken.label}
        </Link>
      )

      linkKey += 1
      remaining = remaining.slice(nextToken.index + nextToken.token.length)
    }

    return parts
  }

  const getRandomQuestion = (): string => {
    const availableIndices = engagingQuestions
      .map((_, index) => index)
      .filter(index => !askedQuestions.includes(index))
    
    if (availableIndices.length === 0) {
      // Reset if all questions asked
      setAskedQuestions([])
      return engagingQuestions[0]
    }
    
    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
    setAskedQuestions(prev => [...prev, randomIndex])
    return engagingQuestions[randomIndex]
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: "Password must be at least 8 characters long" }
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return { valid: false, message: "Password must contain at least one lowercase letter" }
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return { valid: false, message: "Password must contain at least one uppercase letter" }
    }
    if (!/(?=.*\d)/.test(password)) {
      return { valid: false, message: "Password must contain at least one number" }
    }
    return { valid: true, message: "" }
  }

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)\.]{8,20}$/
    return phoneRegex.test(phone)
  }

  // Check if email exists in the system
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      // Try to signup with minimal data to check if email exists
      // If user exists, signup will return 409 conflict
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: 'Check',
          email: email.toLowerCase().trim(),
          password: 'Check123!',
          agreeToTerms: true
        }),
      })
      
      const result = await response.json()
      
      // If user already exists, signup returns 409
      if (response.status === 409) {
        return true
      }
      
      // If validation error for email (but not "user exists"), user doesn't exist
      return false
    } catch (error) {
      console.error('Error checking email:', error)
      return false
    }
  }

  // Handle login
  const ensureDualRegionAccess = async (profileUser: User | undefined | null) => {
    if (!profileUser) return

    const collectedRegions: string[] = []
    if (Array.isArray(profileUser.regions)) {
      collectedRegions.push(...profileUser.regions)
    }

    let preferencePayload = profileUser.preferences
    if (typeof preferencePayload === 'string') {
      try {
        preferencePayload = JSON.parse(preferencePayload)
      } catch {
        preferencePayload = {}
      }
    }

    if (preferencePayload && Array.isArray(preferencePayload.regions)) {
      collectedRegions.push(...preferencePayload.regions)
    }

    if (profileUser.region) {
      collectedRegions.push(profileUser.region)
    }

    const normalizedExisting = new Set(
      collectedRegions
        .map(region => (typeof region === 'string' ? region.toLowerCase() : String(region || '').toLowerCase()))
        .filter(Boolean)
    )

    const requiredRegions = ['india', 'gulf']
    const alreadyComplete = requiredRegions.every(region => normalizedExisting.has(region))

    if (!alreadyComplete) {
      const mergedRegions = Array.from(new Set([...Array.from(normalizedExisting), ...requiredRegions]))
      const mergedPreferences = {
        ...(preferencePayload && typeof preferencePayload === 'object' ? preferencePayload : {}),
        regions: mergedRegions
      }

      try {
        await apiService.updateProfile({ preferences: mergedPreferences })
        if (refreshUser) {
          await refreshUser()
        }
        toast.success('Enabled access to both Gulf and Indian job portals on your profile.')
      } catch (error) {
        console.error('❌ Unable to ensure dual region access:', error)
        toast.error('Logged in, but updating Gulf access failed. You may enable it later from your profile settings.')
      }
    }
  }

  const handleLogin = async (email: string, password: string) => {
    try {
      setIsSubmitting(true)
      const result = await login({ email, password, loginType: 'jobseeker', rememberMe: false })
      
      if (result && result.user) {
        addBotMessage("🎉 Great! You're successfully logged in!")
        setTimeout(() => {
          if (shouldEmphasizeDualAccess) {
            addBotMessage("Welcome back! You're all set to explore both Gulf and Indian job opportunities.")
          } else {
            addBotMessage("Welcome back! Let me take you to your dashboard.")
          }
        }, 1500)
        const nextRoute = isGulfOpportunitiesPortal ? '/jobseeker-gulf-dashboard' : '/dashboard'
        setTimeout(async () => {
          setCurrentStep('complete')
          setIsSubmitting(false)
          await ensureDualRegionAccess(result.user)
          toast.success("Login successful! You're ready to explore opportunities across Gulf and India.")
          router.push(nextRoute)
          router.refresh()
          setIsOpen(false)
        }, 2800)
      } else {
        throw new Error('Login failed')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setIsSubmitting(false)
      const errorMessage = error.message || 'Invalid email or password. Please try again.'
      addBotMessage(`I couldn't log you in: ${errorMessage}`)
      setTimeout(() => {
        addBotMessage("Would you like to try again with a different password? Or type 'register' to create a new account.")
        setCurrentStep('login')
      }, 1500)
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping || isSubmitting) return

    const userText = inputValue.trim()
    const normalizedResponse = userText.toLowerCase().trim()
    
    // Check for goodbye phrases - handle at any point in conversation
    const goodbyePhrases = [
      'bye', 'goodbye', 'see you', 'see you later', 'see ya', 'later', 
      'thank you', 'thanks', 'thankyou', 'ty', 'appreciate it',
      'have a good day', 'have a nice day', 'take care', 'farewell',
      'i\'m done', 'i\'m finished', 'that\'s all', 'that\'s it', 'no thanks',
      'not interested', 'maybe later', 'some other time', 'exit', 'close',
      'i have to go', 'gotta go', 'need to go', 'leaving', 'done'
    ]
    
    const isGoodbyeMessage = goodbyePhrases.some(phrase => normalizedResponse.includes(phrase))
    
    if (isGoodbyeMessage) {
      addUserMessage(userText)
      setInputValue('')
      setIsTyping(true)
      setIsGoodbye(true)
      setCurrentStep('goodbye')
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Friendly goodbye message
      addBotMessage("Thank you for chatting with me! 😊")
      setTimeout(() => {
        addBotMessage("Feel free to come back anytime when you're ready to create your account. I'll be here to help you whenever you need assistance!")
      }, 1500)
      setTimeout(() => {
        addBotMessage("Have a great day and best of luck with your job search! 👋")
        setIsTyping(false)
        // Close chatbot after a moment
        setTimeout(() => {
          setIsOpen(false)
          // Reset for next time
          setTimeout(() => {
            setMessages([])
            setCurrentStep('greeting')
            setIsGoodbye(false)
            setRepeatedResponseCount(0)
            setLastUserResponse('')
            setRegistrationData({})
            setCurrentField(null)
            setAskedQuestions([])
            setUserPurpose(null)
            setUserEmail('')
            setAccountExists(null)
          }, 1000)
        }, 2500)
      }, 3000)
      return
    }
    
    // Handle "register" command during login
    if (currentStep === 'login' && normalizedResponse.includes('register')) {
      addBotMessage("Sure! Let's create a new account for you instead.")
      setTimeout(() => {
        addBotMessage("What's your name?")
        setCurrentStep('name')
        setIsTyping(false)
      }, 1500)
      return
    }
    
    // Check for repeated or anonymous responses
    if (normalizedResponse === lastUserResponse.toLowerCase().trim() && lastUserResponse !== '') {
      setRepeatedResponseCount(prev => prev + 1)
      if (repeatedResponseCount >= 1) {
        addUserMessage(userText)
        setInputValue('')
        setIsTyping(true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        addBotMessage("I notice you're repeating your response. Let me help you with a different approach. Could you please provide more details or try answering in a different way?")
        setIsTyping(false)
        return
      }
    } else {
      setRepeatedResponseCount(0)
    }
    
    // Check for anonymous or vague responses (except for purpose step which can have simple yes/no)
    const vagueResponses = ['yes', 'no', 'ok', 'okay', 'sure', 'maybe', 'i don\'t know', 'idk', 'not sure', 'hmm', '...']
    if (vagueResponses.includes(normalizedResponse) && currentStep !== 'name' && currentStep !== 'purpose') {
      addUserMessage(userText)
      setInputValue('')
      setIsTyping(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      addBotMessage("I'd appreciate a bit more detail! Could you please elaborate on that?")
      setIsTyping(false)
      return
    }
    
    setLastUserResponse(userText)
    addUserMessage(userText)
    setInputValue('')
    setIsTyping(true)

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (currentStep === 'purpose') {
      const purposeText = normalizedResponse
      
      // Better detection logic - prioritize employer keywords first
      const isEmployer = purposeText.includes('employ') || 
                         purposeText.includes('hire') || 
                         purposeText.includes('recruit') || 
                         purposeText.includes('get employee') || 
                         purposeText.includes('get employees') ||
                         purposeText.includes('post job') || 
                         purposeText.includes('post jobs') ||
                         purposeText.includes('hiring') ||
                         purposeText.includes('looking for employee') ||
                         purposeText.includes('looking for employees') ||
                         purposeText.includes('want to hire') ||
                         purposeText.includes('need employee') ||
                         purposeText.includes('need employees') ||
                         (purposeText.includes('company') && (purposeText.includes('register') || purposeText.includes('account')))
      
      const isJobseeker = !isEmployer && (
        purposeText.includes('job') || 
        purposeText.includes('looking for') || 
        purposeText.includes('seeker') || 
        purposeText.includes('find job') ||
        purposeText === 'yes' ||
        purposeText.includes('apply') ||
        purposeText.includes('opportunity') ||
        purposeText.includes('career')
      )
      
      if (isJobseeker) {
        setUserPurpose('jobseeker')
        addBotMessage("Great! I'm here to help job seekers like you find amazing opportunities. Let's create your account so you can start applying!")
      } else if (isEmployer) {
        setUserPurpose('employer')
        addBotMessage("Perfect! I see you're looking to hire employees. For employer registration, please click the link below to create your employer account:")
        setTimeout(() => {
          addBotMessage("🔗 Click here to register as an employer: /employer-register")
        }, 1500)
        setTimeout(() => {
          addBotMessage("Already registered as an employer? Head over to /employer-login to sign in.")
          setIsTyping(false)
        }, 2800)
        return
      } else {
        // Check if response contains keywords that suggest employer intent
        const employerKeywords = ['employee', 'employees', 'hiring', 'hire', 'recruit', 'recruitment', 'post job', 'post jobs', 'company', 'employer']
        const hasEmployerKeywords = employerKeywords.some(keyword => purposeText.includes(keyword))
        
        if (hasEmployerKeywords) {
          setUserPurpose('employer')
          addBotMessage("I understand you want to hire employees. For employer registration, please click the link below:")
          setTimeout(() => {
            addBotMessage("🔗 Click here to register as an employer: /employer-register")
            setIsTyping(false)
          }, 1500)
          return
        }
        
        setIsTyping(false)
        addBotMessage("I want to make sure I understand correctly. Are you looking for a job (job seeker) or are you looking to hire someone (employer)? Please let me know which one applies to you.")
        return
      }
      
      setTimeout(() => {
        addBotMessage("Great! Let me help you get started. First, what's your email address?")
        setCurrentStep('email')
        setIsTyping(false)
      }, 1500)
    } else if (currentStep === 'email') {
      if (!validateEmail(userText)) {
        setIsTyping(false)
        addBotMessage("Hmm, that doesn't look like a valid email address. Could you please provide a valid email? (e.g., yourname@example.com)")
        return
      }
      
      setUserEmail(userText)
      setRegistrationData(prev => ({ ...prev, email: userText.toLowerCase().trim() }))
      setIsTyping(true)
      addBotMessage("Let me check if you already have an account with us...")
      
      // Check if account exists
      const emailExists = await checkEmailExists(userText)
      setAccountExists(emailExists)
      
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      if (emailExists) {
        addBotMessage("Great! I found an account with this email. Let's log you in!")
        const passwordPromptDelay = shouldEmphasizeDualAccess ? 2800 : 1500
        if (shouldEmphasizeDualAccess) {
          setTimeout(() => {
            addBotMessage("Sign in here and you'll instantly continue with both Gulf and Indian job portals.")
          }, 1500)
        }
        setTimeout(() => {
          addBotMessage("What's your password?")
          setCurrentStep('login')
          setIsTyping(false)
        }, passwordPromptDelay)
      } else {
        addBotMessage("I don't see an account with this email. No worries! Let's create a new account for you.")
        if (shouldEmphasizeDualAccess) {
          setTimeout(() => {
            addBotMessage("Registering through this assistant unlocks both Gulf and Indian job opportunities for you automatically.")
          }, 1500)
        }
        setTimeout(() => {
          addBotMessage("What's your name?")
          setCurrentStep('name')
          setIsTyping(false)
        }, shouldEmphasizeDualAccess ? 3000 : 1500)
      }
    } else if (currentStep === 'login') {
      // Handle login
      if (userText.length < 6) {
        setIsTyping(false)
        addBotMessage("Password should be at least 6 characters. Could you please enter your password again?")
        return
      }
      
      setIsTyping(true)
      await handleLogin(userEmail, userText)
      return
    } else if (currentStep === 'name') {
      if (userText.length < 2) {
        setIsTyping(false)
        addBotMessage("I'd love to know your name! Could you please provide a name with at least 2 characters?")
        return
      }
      const fullName = userText
      setRegistrationData(prev => ({ ...prev, fullName }))
      addBotMessage(`Nice to meet you, ${fullName}! 👋`)
      setTimeout(() => {
        addBotMessage("Before we set up your account, I'd love to learn a bit more about you. This will help us find the perfect opportunities for you!")
      }, 1500)
      setTimeout(() => {
        const question = getRandomQuestion()
        addBotMessage(question)
        setCurrentStep('engaging')
        setIsTyping(false)
      }, 3000)
    } else if (currentStep === 'engaging') {
      // Check if user wants to skip or continue
      if (normalizedResponse.includes('skip') || normalizedResponse.includes('next') || normalizedResponse.includes('continue') || normalizedResponse.includes('let\'s go') || normalizedResponse.includes('ready')) {
        addBotMessage("No problem! Let's move forward with setting up your account.")
        setTimeout(() => {
          addBotMessage("Now, let's create a secure password. Make sure it's at least 8 characters long with uppercase, lowercase, and a number.")
          setCurrentStep('registration')
          setCurrentField('password')
          setIsTyping(false)
        }, 1500)
        return
      }
      
      // Acknowledge answer and ask another question or move to registration
      addBotMessage("That's great insight! Thank you for sharing that with me.")
      setTimeout(() => {
        if (askedQuestions.length < 2) {
          const question = getRandomQuestion()
          addBotMessage(question)
          setIsTyping(false)
        } else {
          addBotMessage("Perfect! Now let's set up your account so you can start applying to jobs. I'll need just a few details from you.")
          setTimeout(() => {
            addBotMessage("Now, let's create a secure password. Make sure it's at least 8 characters long with uppercase, lowercase, and a number.")
            setCurrentStep('registration')
            setCurrentField('password')
            setIsTyping(false)
          }, 2000)
        }
      }, 1500)
    } else if (currentStep === 'registration') {
      // Registration step - collect password and other details after email check confirms no account exists
      if (currentField === 'password') {
        const validation = validatePassword(userText)
        if (!validation.valid) {
          setIsTyping(false)
          addBotMessage(validation.message + " Please try again with a stronger password.")
          return
        }
        setRegistrationData(prev => ({ ...prev, password: userText }))
        addBotMessage("Great! Your password is secure and strong. ✅")
        setTimeout(() => {
          addBotMessage("What's your phone number? (This is optional, but it helps employers reach you. You can type 'skip' to continue without it)")
          setCurrentField('phone')
          setIsTyping(false)
        }, 1500)
      } else if (currentField === 'phone') {
        if (userText.trim() === '' || normalizedResponse === 'skip' || normalizedResponse === 'no' || normalizedResponse === 'none' || normalizedResponse === 'not now') {
          // Phone is optional
          setRegistrationData(prev => ({ ...prev, phone: '' }))
          addBotMessage("No problem! We'll skip the phone number for now.")
        } else if (!validatePhone(userText)) {
          setIsTyping(false)
          addBotMessage("Please enter a valid phone number (8-20 digits, with optional country code), or type 'skip' to continue")
          return
        } else {
          setRegistrationData(prev => ({ ...prev, phone: userText }))
          addBotMessage(`Perfect! I've saved your phone number: ${userText}.`)
        }
        setTimeout(() => {
          addBotMessage("What's your experience level? (fresher, junior, mid, senior, or lead)")
          setCurrentField('experience')
          setIsTyping(false)
        }, 1500)
      } else if (currentField === 'experience') {
        const validLevels = ['fresher', 'junior', 'mid', 'senior', 'lead']
        const normalizedInput = userText.toLowerCase().trim()
        if (!validLevels.includes(normalizedInput)) {
          setIsTyping(false)
          addBotMessage("Please choose from: fresher, junior, mid, senior, or lead. If you're unsure, you can say 'fresher' for now.")
          return
        }
        setRegistrationData(prev => ({ ...prev, experience: normalizedInput }))
        addBotMessage(`Excellent! I've noted your experience level as ${normalizedInput}.`)
        setTimeout(() => {
          addBotMessage("Which region are you interested in? (india, gulf, or other)")
          setCurrentField('region')
          setIsTyping(false)
        }, 1500)
      } else if (currentField === 'region') {
        const validRegions = ['india', 'gulf', 'other']
        const normalizedInput = userText.toLowerCase().trim()
        if (!validRegions.includes(normalizedInput)) {
          setIsTyping(false)
          addBotMessage("Please choose from: india, gulf, or other. If you're not sure, you can choose 'india' for now.")
          return
        }
        setRegistrationData(prev => ({ ...prev, region: normalizedInput }))
        addBotMessage(`Perfect! I've set your preferred region to ${normalizedInput}.`)
        setTimeout(() => {
          setIsSubmitting(true)
          addBotMessage("Great! I have all the information I need. Let me create your account now...")
          handleRegistration()
        }, 1500)
      }
    }
  }

  const handleRegistration = async () => {
    try {
      if (!userEmail) {
        throw new Error('Email missing. Please restart the registration flow.')
      }

      const basePreferences =
        typeof registrationData.preferences === 'object'
          ? (registrationData.preferences as Record<string, unknown>)
          : {}

      const signupPayload = {
        fullName: registrationData.fullName!,
        email: userEmail.toLowerCase().trim(),
        password: registrationData.password!,
        phone: registrationData.phone || undefined,
        experience: registrationData.experience || 'fresher',
        region: defaultPortalRegion,
        regions: ['india', 'gulf'],
        preferences: {
          ...basePreferences,
          experience: registrationData.experience || 'fresher',
          preferredRegion: registrationData.region || defaultPortalRegion,
          regions: ['india', 'gulf'],
          portalSource: isGulfOpportunitiesPortal ? 'gulf-opportunities-chatbot' : (isHomePortal ? 'home-chatbot' : 'jobseeker-chatbot')
        },
        portalSource: isGulfOpportunitiesPortal ? 'gulf-opportunities-chatbot' : (isHomePortal ? 'home-chatbot' : 'jobseeker-chatbot'),
        agreeToTerms: true
      }

      const response = await authSignup(signupPayload)

      if (response?.user) {
        addBotMessage("🎉 Congratulations! Your account has been created successfully!")
        setTimeout(() => {
          addBotMessage("You're all set! Let me take you to your dashboard where you can start exploring job opportunities.")
        }, 1500)
        const nextRoute = isGulfOpportunitiesPortal ? '/jobseeker-gulf-dashboard' : '/dashboard'
        setTimeout(async () => {
          setCurrentStep('complete')
          setIsSubmitting(false)
          await ensureDualRegionAccess(response.user)
          toast.success("Account created successfully! You now have access to Gulf and Indian jobs.")
          // Redirect after a moment
          setTimeout(() => {
            router.push(nextRoute)
            router.refresh()
          }, 2000)
        }, 3000)
      } else {
        throw new Error('Registration failed')
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      setIsSubmitting(false)
      const errorMessage = error.message || 'Something went wrong. Please try again.'
      addBotMessage(`I apologize, but there was an issue creating your account: ${errorMessage}`)
      addBotMessage("Would you like to try again? Please check your information and we can retry.")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading || user) {
    return null
  }

  return (
    <>
      {/* Chatbot Toggle Button with Animated Character - Always at bottom */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full shadow-2xl flex items-center justify-center hover:shadow-blue-500/50 transition-all duration-300 border-4 border-blue-500/20"
          aria-label="Open registration chatbot"
        >
          <ChatbotButtonCharacter size={56} src={buttonCharacterSrc} alt="Chatbot" />
        </motion.button>
      )}

      {/* Chatbot Window - Responsive with proper positioning */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed top-[72px] sm:top-[80px] bottom-4 right-2 sm:right-4 z-40 w-[calc(100vw-1rem)] sm:w-[400px] max-w-[calc(100vw-1rem)] sm:max-w-[400px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
            style={{
              maxHeight: 'calc(100vh - 88px)',
              height: 'auto'
            }}
          >
            {/* Header with Animated Characters - WhatsApp/Instagram Style */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 sm:p-4 flex items-center justify-between relative overflow-hidden flex-shrink-0">
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-300 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3 relative z-10 flex-1 min-w-0">
                {/* Animated HR Character Avatar - Human Avatar */}
                <div className="relative flex-shrink-0">
                  <HRCharacter size={48} className="drop-shadow-lg" src={hrCharacterSrc} alt="Assistant" />
                  {/* Online status indicator */}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white shadow-sm"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 truncate">
                    Sarah - Assistant
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-green-300 flex-shrink-0"
                    >
                      ●
                    </motion.span>
                  </h3>
                  <p className="text-xs text-blue-100 truncate">Online • Here to help</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 h-8 w-8 sm:h-9 sm:w-9 p-0 relative z-10 flex-shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>

            {/* Messages Area - WhatsApp/Instagram Style */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gradient-to-b from-gray-50 via-blue-50/30 to-white min-h-0">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} items-start gap-2`}
                >
                  {message.type === 'bot' && (
                    <div className="flex-shrink-0">
                      <HRCharacter size={36} src={hrCharacterSrc} alt="Assistant" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] sm:max-w-[80%] rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-sm ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none'
                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                    }`}
                  >
                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                      {message.text.includes('/employer-register') ? (
                        <span>
                          {message.text.split('/employer-register')[0]}
                          <Link 
                            href="/employer-register" 
                            className="text-blue-600 hover:text-blue-700 underline font-semibold ml-1 inline-block"
                            onClick={() => setIsOpen(false)}
                          >
                            Click here to register as an employer
                          </Link>
                          {message.text.split('/employer-register')[1]}
                        </span>
                      ) : (
                        message.text
                      )}
                    </p>
                  </div>
                  {message.type === 'user' && (
                    <div className="flex-shrink-0">
                      <JobseekerCharacter size={36} src={jobseekerCharacterSrc} alt="You" />
                    </div>
                  )}
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start items-center gap-2">
                  <div className="flex-shrink-0">
                    <HRCharacter size={36} src={hrCharacterSrc} alt="Assistant" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - WhatsApp/Instagram Style - Fixed at bottom */}
            {currentStep !== 'complete' && currentStep !== 'goodbye' && (
              <div className="border-t border-gray-200 p-3 sm:p-4 bg-white flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isTyping || isSubmitting}
                    className="flex-1 text-sm sm:text-base rounded-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isTyping || isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 flex-shrink-0 shadow-lg hover:shadow-xl transition-all"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-white" />
                    ) : (
                      <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

