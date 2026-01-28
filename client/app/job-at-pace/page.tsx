"use client"

import { useState, useEffect } from "react"
import { 
  Check, 
  Star, 
  Zap, 
  Crown, 
  Shield, 
  TrendingUp, 
  Bell, 
  Mail, 
  Phone, 
  Eye, 
  Target, 
  Award, 
  Rocket,
  Users,
  Clock,
  MessageCircle,
  FileText,
  Search,
  Filter,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Sparkles,
  BarChart3,
  Settings,
  HelpCircle,
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Building2,
  DollarSign,
  Briefcase,
  User,
  Heart,
  Share2,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { motion } from "framer-motion"
import { apiService } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import JobAtPaceNavbar from "@/components/job-at-pace/JobAtPaceNavbar"

interface PricingPlan {
  id: string
  name: string
  tagline: string
  price: number
  originalPrice?: number
  duration: string
  period?: string
  popular: boolean
  features: string[]
  premiumFeatures: string[]
  limitations: string[]
  color: string
  icon: any
  savings?: string
}

const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Basic",
    tagline: "Perfect for getting started",
    price: 0,
    duration: "Forever",
    period: "Forever",
    popular: false,
    features: [
      "Basic job search",
      "Apply to jobs",
      "Create profile",
      "Basic job alerts",
      "Standard support"
    ],
    premiumFeatures: [],
    limitations: [
      "Limited to 5 applications per day",
      "No priority in applications",
      "Basic job alert frequency",
      "No recruiter contact info",
      "No application tracking",
    ],
    color: "gray",
    icon: Shield,
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Best for serious job seekers",
    price: 999,
    originalPrice: 1499,
    duration: "per month",
    period: "month",
    popular: true,
    features: [
      "Everything in Basic",
      "Priority job alerts",
      "Premium profile badge", 
      "Advanced analytics",
      "Direct recruiter connect",
      "Resume review service",
      "Priority support",
      "Profile privacy controls"
    ],
    premiumFeatures: [
      "5x more profile views",
      "Priority recruiter attention",
      "Featured in top search results",
      "Direct recruiter messaging",
    ],
    limitations: [],
    color: "orange",
    icon: Crown,
    savings: "33% OFF",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For professionals and teams",
    price: 2999,
    originalPrice: 3999,
    duration: "per month",
    period: "month",
    popular: false,
    features: [
      "Everything in Premium",
      "Personal career coach",
      "Interview preparation",
      "Salary negotiation support",
      "LinkedIn profile optimization",
      "Career roadmap planning",
      "Dedicated account manager",
      "Custom job matching"
    ],
    premiumFeatures: [
      "10x more profile views",
      "Exclusive recruiter network access",
      "Professional career guidance",
      "Guaranteed job interview opportunities",
    ],
    limitations: [],
    color: "gold",
    icon: Award,
    savings: "25% OFF",
  }
]

const jobAlertFeatures = [
  {
    title: "Smart Job Matching",
    description: "AI-powered job recommendations based on your profile and preferences",
    icon: Target,
  },
  {
    title: "Multi-Channel Alerts",
    description: "Get notified via email, SMS, WhatsApp, and push notifications",
    icon: Bell,
  },
  {
    title: "Advanced Filters",
    description: "Filter by salary, location, experience, company size, and more",
    icon: Filter,
  },
  {
    title: "Real-time Updates",
    description: "Instant notifications when new matching jobs are posted",
    icon: Zap,
  },
  {
    title: "Priority Access",
    description: "Premium users get first access to new job postings",
    icon: Crown,
  },
  {
    title: "Analytics Dashboard",
    description: "Track your job search performance and optimize your strategy",
    icon: BarChart3,
  },
]

const premiumFeatures = [
  {
    category: "Visibility",
    features: [
      {
        title: "Profile Boost",
        description: "5x more profile views from recruiters",
        icon: TrendingUp,
        premium: true
      },
      {
        title: "Premium Badge",
        description: "Stand out with verified premium status",
        icon: Crown,
        premium: true
      },
      {
        title: "Featured Placement",
        description: "Appear in top search results",
        icon: Star,
        premium: true
      }
    ]
  },
  {
    category: "Alerts",
    features: [
      {
        title: "Smart Job Alerts",
        description: "AI-powered job matching and notifications",
        icon: Bell,
        premium: true
      },
      {
        title: "Multi-Channel Delivery",
        description: "Email, SMS, WhatsApp, and push notifications",
        icon: MessageCircle,
        premium: true
      },
      {
        title: "Priority Access",
        description: "First access to new job postings",
        icon: Zap,
        premium: true
      }
    ]
  },
  {
    category: "Networking",
    features: [
      {
        title: "Recruiter Connect",
        description: "Direct access to hiring managers",
        icon: Users,
        premium: true
      },
      {
        title: "Industry Insights",
        description: "Market trends and salary data",
        icon: BarChart3,
        premium: true
      },
      {
        title: "Career Guidance",
        description: "Personalized career advice",
        icon: Target,
        premium: true
      }
    ]
  }
]

const mockJobAlerts = [
  {
    id: 1,
    name: "Software Engineer - React",
    keywords: ["React", "JavaScript", "Frontend"],
    location: "Bangalore",
    salary: "8-15 LPA",
    experience: "2-5 years",
    isActive: true,
    matches: 12,
    lastMatch: "2 hours ago"
  },
  {
    id: 2,
    name: "Product Manager",
    keywords: ["Product", "Management", "Strategy"],
    location: "Mumbai",
    salary: "12-20 LPA",
    experience: "3-7 years",
    isActive: true,
    matches: 8,
    lastMatch: "5 hours ago"
  },
  {
    id: 3,
    name: "Data Scientist",
    keywords: ["Python", "Machine Learning", "AI"],
    location: "Hyderabad",
    salary: "10-18 LPA",
    experience: "2-6 years",
    isActive: false,
    matches: 15,
    lastMatch: "1 day ago"
  }
]

const mockApplications = [
  {
    id: 1,
    company: "Google",
    position: "Software Engineer",
    status: "Applied",
    appliedDate: "2024-01-20",
    lastUpdate: "2024-01-20",
    progress: 25
  },
  {
    id: 2,
    company: "Microsoft",
    position: "Product Manager",
    status: "Interview Scheduled",
    appliedDate: "2024-01-18",
    lastUpdate: "2024-01-22",
    progress: 60
  },
  {
    id: 3,
    company: "Amazon",
    position: "Data Scientist",
    status: "Under Review",
    appliedDate: "2024-01-15",
    lastUpdate: "2024-01-21",
    progress: 40
  }
]

export default function JobAtPacePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("resumeai")
  const [selectedPlan, setSelectedPlan] = useState("premium")
  const [alerts, setAlerts] = useState(mockJobAlerts)
  const [applications, setApplications] = useState(mockApplications)
  const [newAlert, setNewAlert] = useState({
    name: "",
    keywords: "",
    location: "",
    salary: "",
    experience: ""
  })

  const handleSubscribe = async (planId: string) => {
    setSelectedPlan(planId)
    if (!user) {
      toast.error('Please login to activate premium')
      return
    }
    try {
      const data = await apiService.activateJobAtPace(planId)
      if (data?.success) {
        toast.success('Premium activated. Visibility features enabled and premium tag added.')
      } else {
        toast.error(data?.message || 'Failed to activate premium')
      }
    } catch (e) {
      toast.error('Failed to activate premium')
    }
  }

  const handleCreateAlert = () => {
    if (newAlert.name && newAlert.keywords) {
      const alert = {
        id: Date.now(),
        ...newAlert,
        keywords: newAlert.keywords.split(',').map(k => k.trim()),
        isActive: true,
        matches: 0,
        lastMatch: "Never"
      }
      setAlerts([...alerts, alert])
      setNewAlert({ name: "", keywords: "", location: "", salary: "", experience: "" })
    }
  }

  const toggleAlert = (id: number) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
    ))
  }

  const deleteAlert = (id: number) => {
    setAlerts(alerts.filter(alert => alert.id !== id))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <JobAtPaceNavbar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ResumeAI Tab */}
        {activeTab === "resumeai" && (
          <div className="space-y-8">
            {/* Hero Section */}
            <section className="text-center">
              <div className="mb-8">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-white text-sm font-medium mb-8">
                  <FileText className="w-4 h-4 mr-2" />
                  AI-Powered Resume Builder
                </div>
                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
                  Build Your Perfect Resume with{" "}
                  <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                    ResumeAI
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto">
                  Create ATS-optimized resumes that get you noticed by recruiters. Our AI analyzes job descriptions and tailors your resume for maximum impact.
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">95%</div>
                  <div className="text-slate-600">ATS Pass Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">3x</div>
                  <div className="text-slate-600">More Interviews</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">50+</div>
                  <div className="text-slate-600">Templates</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">24/7</div>
                  <div className="text-slate-600">AI Support</div>
                </div>
              </div>
            </section>

            {/* ResumeAI Features */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/30 backdrop-blur-sm rounded-2xl">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-bold text-slate-900 mb-4">
                    AI-Powered Resume Features
                  </h2>
                  <p className="text-xl text-slate-600">
                    Advanced tools to create resumes that stand out
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    {
                      title: "ATS Optimization",
                      description: "AI ensures your resume passes through Applicant Tracking Systems",
                      icon: Target,
                    },
                    {
                      title: "Job Matching",
                      description: "Tailor your resume to specific job descriptions automatically",
                      icon: Search,
                    },
                    {
                      title: "Content Enhancement",
                      description: "AI suggests powerful action words and quantifiable achievements",
                      icon: Zap,
                    },
                    {
                      title: "Format Optimization",
                      description: "Professional templates designed for maximum readability",
                      icon: FileText,
                    },
                    {
                      title: "Keyword Analysis",
                      description: "Identify and include relevant keywords for your industry",
                      icon: TrendingUp,
                    },
                    {
                      title: "Real-time Feedback",
                      description: "Get instant suggestions to improve your resume",
                      icon: MessageCircle,
                    },
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.6 }}
                      whileHover={{ y: -10 }}
                    >
                      <Card className="border-0 bg-white/70 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 group">
                        <CardContent className="p-8 text-center">
                          <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                            <feature.icon className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                          <p className="text-slate-600 mb-4">{feature.description}</p>
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">AI Feature</Badge>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Combo Plans Tab */}
        {activeTab === "combo" && (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Combo Plans - Maximum Value
              </h2>
              <p className="text-xl text-slate-600">
                Get the best of everything with our combined premium packages
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  name: "ResumeAI + Job Alerts",
                  price: "₹999",
                  originalPrice: "₹1,498",
                  savings: "33% OFF",
                  description: "Perfect combination for job seekers",
                  features: [
                    "AI Resume Builder",
                    "Smart Job Alerts",
                    "ATS Optimization",
                    "Email Notifications",
                    "5 Resume Templates",
                    "Priority Support"
                  ],
                  popular: false,
                  icon: Star
                },
                {
                  name: "Complete Career Package",
                  price: "₹1,999",
                  originalPrice: "₹2,997",
                  savings: "33% OFF",
                  description: "Everything you need for career success",
                  features: [
                    "AI Resume Builder",
                    "Smart Job Alerts",
                    "Interview Prep",
                    "Career Coaching",
                    "LinkedIn Optimization",
                    "Unlimited Applications",
                    "Premium Support"
                  ],
                  popular: true,
                  icon: Crown
                },
                {
                  name: "Executive Suite",
                  price: "₹2,999",
                  originalPrice: "₹4,495",
                  savings: "33% OFF",
                  description: "For senior professionals and executives",
                  features: [
                    "AI Resume Builder",
                    "Smart Job Alerts",
                    "Executive Coaching",
                    "Personal Branding",
                    "Network Building",
                    "Salary Negotiation",
                    "White-glove Support"
                  ],
                  popular: false,
                  icon: Award
                }
              ].map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  whileHover={{ y: -10 }}
                >
                  <Card className={`border-0 bg-white/70 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 group relative ${
                    plan.popular ? 'ring-2 ring-orange-500 scale-105' : ''
                  }`}>
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                        <plan.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                      <p className="text-slate-600 mb-6">{plan.description}</p>
                      
                      <div className="mb-6">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <span className="text-4xl font-bold text-orange-500">{plan.price}</span>
                          <span className="text-lg text-slate-500 line-through">{plan.originalPrice}</span>
                        </div>
                        <Badge className="bg-green-100 text-green-800">{plan.savings}</Badge>
                      </div>

                      <ul className="space-y-3 mb-8 text-left">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-slate-600">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button type="button" onClick={() => handleSubscribe(plan.name.includes('Complete') ? 'premium' : 'premium')} className={`w-full ${
                        plan.popular
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}>
                        Choose Plan
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Value Plans Tab */}
        {activeTab === "value" && (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Value Plans - Best Bang for Your Buck
              </h2>
              <p className="text-xl text-slate-600">
                Affordable premium features that deliver maximum value
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  name: "Starter Value",
                  price: "₹299",
                  period: "month",
                  description: "Perfect for job search beginners",
                  features: [
                    "Basic Resume Builder",
                    "5 Job Alerts",
                    "Email Support",
                    "2 Resume Templates",
                    "Basic ATS Check"
                  ],
                  popular: false,
                  icon: Zap
                },
                {
                  name: "Professional Value",
                  price: "₹599",
                  period: "month",
                  description: "For serious job seekers",
                  features: [
                    "AI Resume Builder",
                    "Unlimited Job Alerts",
                    "Priority Support",
                    "10 Resume Templates",
                    "Advanced ATS Optimization",
                    "Interview Tips"
                  ],
                  popular: true,
                  icon: Star
                },
                {
                  name: "Premium Value",
                  price: "₹999",
                  period: "month",
                  description: "Complete career acceleration",
                  features: [
                    "AI Resume Builder",
                    "Smart Job Alerts",
                    "Career Coaching",
                    "Unlimited Templates",
                    "Full ATS Optimization",
                    "LinkedIn Optimization",
                    "24/7 Support"
                  ],
                  popular: false,
                  icon: Crown
                }
              ].map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  whileHover={{ y: -10 }}
                >
                  <Card className={`border-0 bg-white/70 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 group relative ${
                    plan.popular ? 'ring-2 ring-orange-500 scale-105' : ''
                  }`}>
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1">
                          Best Value
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                        <plan.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                      <p className="text-slate-600 mb-6">{plan.description}</p>
                      
                      <div className="mb-6">
                        <div className="flex items-center justify-center space-x-1 mb-2">
                          <span className="text-4xl font-bold text-orange-500">{plan.price}</span>
                          <span className="text-lg text-slate-500">/{plan.period}</span>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">Monthly Billing</Badge>
                      </div>

                      <ul className="space-y-3 mb-8 text-left">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-slate-600">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button type="button" onClick={() => handleSubscribe(plan.name.includes('Professional') ? 'premium' : 'premium')} className={`w-full ${
                        plan.popular
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}>
                        Start Free Trial
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === "features" && (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Premium Features Showcase
              </h2>
              <p className="text-xl text-slate-600">
                Discover all the powerful tools available with Job at Pace Premium
              </p>
            </div>

            {premiumFeatures.map((category, categoryIndex) => (
              <div key={categoryIndex} className="space-y-6">
                <h3 className="text-2xl font-bold text-slate-900 text-center">{category.category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {category.features.map((feature, featureIndex) => (
                    <Card key={featureIndex} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <feature.icon className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                        <p className="text-slate-600 mb-4">{feature.description}</p>
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                          Premium Feature
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === "pricing" && (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Choose Your Plan</h2>
              <p className="text-xl text-slate-600">
                Start free and upgrade when you're ready to accelerate
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingPlans.map((plan) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  whileHover={{ y: -10 }}
                >
                  <Card
                    className={`border-0 backdrop-blur-xl transition-all duration-500 relative overflow-hidden ${
                      plan.popular
                        ? "bg-gradient-to-br from-yellow-50 to-orange-50 ring-2 ring-orange-200 shadow-2xl"
                        : "bg-white/70 hover:shadow-xl"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    
                    {plan.savings && (
                      <div className="absolute -top-2 -right-2">
                        <Badge className="bg-red-500 text-white">
                          {plan.savings}
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-8">
                      <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
                        {plan.name}
                      </CardTitle>
                      <div className="mb-4">
                        <span className="text-4xl font-bold text-slate-900">{plan.price === 0 ? 'Free' : `₹${plan.price}`}</span>
                        {plan.period !== "Forever" && (
                          <span className="text-slate-600 ml-2">{plan.period}</span>
                        )}
                      </div>
                      <p className="text-slate-600">{plan.tagline}</p>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <ul className="space-y-3">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                            <span className="text-slate-700">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => handleSubscribe(plan.id)}
                        className={`w-full h-12 ${
                          plan.popular
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-lg'
                            : plan.price === 0
                            ? 'bg-gray-600 hover:bg-gray-700 text-white'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                        }`}
                        disabled={plan.price === 0}
                      >
                        {plan.price === 0 ? 'Get Started' : plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Premium'}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === "applications" && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-slate-900">Application Tracker</h2>
              <Button className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Application
              </Button>
            </div>

            <div className="space-y-6">
              {applications.map((application) => (
                <Card key={application.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{application.position}</h3>
                          <p className="text-slate-600">{application.company}</p>
                        </div>
                      </div>
                      <Badge 
                        className={
                          application.status === 'Applied' ? 'bg-blue-100 text-blue-800' :
                          application.status === 'Interview Scheduled' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {application.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm text-slate-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Applied: {application.appliedDate}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Updated: {application.lastUpdate}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4" />
                        <span>Progress: {application.progress}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </div>
                    </div>

                    <Progress value={application.progress} className="h-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}