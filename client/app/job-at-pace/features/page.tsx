"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Crown, 
  Zap, 
  Award, 
  Eye, 
  MessageCircle, 
  Target, 
  TrendingUp, 
  Bell, 
  Users, 
  FileText, 
  Star, 
  Shield,
  ArrowRight,
  CheckCircle,
  Clock,
  BarChart3,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  Search,
  Filter,
  Rocket,
  Heart,
  Gift,
  Headphones,
  BookOpen,
  Video,
  PieChart,
  Building2,
  MapPin,
  DollarSign,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import JobAtPaceNavbar from "@/components/job-at-pace/JobAtPaceNavbar"

const featureCategories = [
  {
    id: "visibility",
    name: "Profile Visibility",
    icon: Eye,
    description: "Get noticed by top recruiters",
    color: "blue"
  },
  {
    id: "alerts",
    name: "Smart Job Alerts",
    icon: Bell,
    description: "Never miss the perfect opportunity",
    color: "purple"
  },
  {
    id: "networking",
    name: "Recruiter Network",
    icon: Users,
    description: "Connect directly with hiring managers",
    color: "green"
  },
  {
    id: "tools",
    name: "Career Tools",
    icon: Rocket,
    description: "Professional resume and interview prep",
    color: "orange"
  },
  {
    id: "support",
    name: "Premium Support",
    icon: Headphones,
    description: "Dedicated career guidance",
    color: "red"
  }
]

const detailedFeatures = {
  visibility: [
    {
      title: "Profile Boost",
      description: "Get 5-10x more profile views with our advanced visibility algorithm",
      icon: TrendingUp,
      benefits: [
        "Appear in top 10% of search results",
        "Premium badge on your profile",
        "Featured in recruiter recommendations",
        "Priority placement in job matches"
      ],
      plans: ["Basic", "Premium", "Pro"]
    },
    {
      title: "Enhanced Profile Highlighting",
      description: "Stand out with premium profile features and badges",
      icon: Star,
      benefits: [
        "Verified profile badge",
        "Skills endorsement highlights",
        "Achievement showcase section",
        "Professional summary optimization"
      ],
      plans: ["Premium", "Pro"]
    },
    {
      title: "Recruiter Spotlight",
      description: "Get featured in weekly recruiter newsletters and updates",
      icon: Eye,
      benefits: [
        "Weekly feature in recruiter digest",
        "Targeted industry exposure",
        "Skills-based recommendations",
        "Geographic preference matching"
      ],
      plans: ["Pro"]
    }
  ],
  alerts: [
    {
      title: "Smart Job Matching",
      description: "AI-powered job recommendations based on your profile and career goals",
      icon: Target,
      benefits: [
        "Machine learning-based matching",
        "Career progression analysis",
        "Salary expectation alignment",
        "Company culture fit assessment"
      ],
      plans: ["Basic", "Premium", "Pro"]
    },
    {
      title: "Multi-Channel Notifications",
      description: "Get alerts via Email, SMS, WhatsApp, and push notifications",
      icon: Bell,
      benefits: [
        "Instant email notifications",
        "SMS alerts for urgent matches",
        "WhatsApp integration",
        "Mobile push notifications"
      ],
      plans: ["Premium", "Pro"]
    },
    {
      title: "Advanced Filter Options",
      description: "Create highly specific job alerts with detailed filtering",
      icon: Filter,
      benefits: [
        "Salary range filtering",
        "Company size preferences",
        "Work culture matching",
        "Remote/hybrid options"
      ],
      plans: ["Basic", "Premium", "Pro"]
    }
  ],
  networking: [
    {
      title: "Recruiter Contact Access",
      description: "Get direct contact information for hiring managers and recruiters",
      icon: MessageCircle,
      benefits: [
        "Direct email addresses",
        "LinkedIn profile access",
        "Phone numbers (when available)",
        "Best time to contact insights"
      ],
      plans: ["Premium", "Pro"]
    },
    {
      title: "Priority Recruiter Messaging",
      description: "Your messages get priority attention from recruiters",
      icon: Rocket,
      benefits: [
        "Highlighted message status",
        "Faster response guarantees",
        "Read receipt notifications",
        "Follow-up reminders"
      ],
      plans: ["Pro"]
    },
    {
      title: "Exclusive Recruiter Events",
      description: "Access to private networking events and webinars",
      icon: Users,
      benefits: [
        "Monthly virtual networking events",
        "Industry-specific meetups",
        "One-on-one recruiter sessions",
        "Career fair early access"
      ],
      plans: ["Pro"]
    }
  ],
  tools: [
    {
      title: "Professional Resume Builder",
      description: "ATS-optimized resume templates with expert guidance",
      icon: FileText,
      benefits: [
        "20+ professional templates",
        "ATS compatibility check",
        "Keyword optimization",
        "Industry-specific formats"
      ],
      plans: ["Premium", "Pro"]
    },
    {
      title: "Interview Preparation Suite",
      description: "Mock interviews, question banks, and performance analytics",
      icon: Video,
      benefits: [
        "AI-powered mock interviews",
        "Industry-specific question banks",
        "Performance scoring and feedback",
        "Video interview practice"
      ],
      plans: ["Pro"]
    },
    {
      title: "Salary Negotiation Tools",
      description: "Data-driven salary insights and negotiation strategies",
      icon: DollarSign,
      benefits: [
        "Real-time salary benchmarking",
        "Negotiation script templates",
        "Market rate analysis",
        "Offer evaluation tools"
      ],
      plans: ["Premium", "Pro"]
    }
  ],
  support: [
    {
      title: "Dedicated Career Advisor",
      description: "One-on-one guidance from certified career counselors",
      icon: Users,
      benefits: [
        "Monthly 1-on-1 sessions",
        "Personalized career roadmap",
        "Industry transition guidance",
        "Goal setting and tracking"
      ],
      plans: ["Pro"]
    },
    {
      title: "Priority Customer Support",
      description: "24/7 premium support with guaranteed response times",
      icon: Headphones,
      benefits: [
        "24/7 chat and email support",
        "Phone support availability",
        "< 2 hour response guarantee",
        "Dedicated support manager"
      ],
      plans: ["Premium", "Pro"]
    },
    {
      title: "Career Resources Library",
      description: "Exclusive access to premium career development content",
      icon: BookOpen,
      benefits: [
        "Industry trend reports",
        "Skill development courses",
        "Career transition guides",
        "Expert webinar recordings"
      ],
      plans: ["Basic", "Premium", "Pro"]
    }
  ]
}

const comparisonPlans = [
  {
    name: "Free",
    price: "₹0",
    period: "Forever",
    icon: Shield,
    color: "gray",
    features: {
      "Job Applications": "5 per day",
      "Profile Views": "Standard",
      "Job Alerts": "Email only",
      "Recruiter Access": "❌",
      "Resume Templates": "Basic (3)",
      "Support": "Community"
    }
  },
  {
    name: "Basic",
    price: "₹999",
    period: "3 months",
    icon: Zap,
    color: "blue",
    popular: false,
    features: {
      "Job Applications": "Unlimited",
      "Profile Views": "2x Boost",
      "Job Alerts": "Email + SMS",
      "Recruiter Access": "Limited",
      "Resume Templates": "Premium (10)",
      "Support": "Email Support"
    }
  },
  {
    name: "Premium",
    price: "₹2,499",
    period: "6 months", 
    icon: Crown,
    color: "purple",
    popular: true,
    features: {
      "Job Applications": "Unlimited",
      "Profile Views": "5x Boost",
      "Job Alerts": "All Channels",
      "Recruiter Access": "Full Access",
      "Resume Templates": "Premium (20+)",
      "Support": "Priority Support"
    }
  },
  {
    name: "Pro",
    price: "₹4,999",
    period: "12 months",
    icon: Award,
    color: "gold",
    popular: false,
    features: {
      "Job Applications": "Unlimited",
      "Profile Views": "10x Boost",
      "Job Alerts": "All Channels + AI",
      "Recruiter Access": "VIP Access",
      "Resume Templates": "All + Custom",
      "Support": "Dedicated Advisor"
    }
  }
]

const successStories = [
  {
    name: "Rahul Sharma",
    role: "Software Engineer",
    company: "Google",
    image: "👨‍💻",
    story: "Got 3x more interview calls within 2 weeks of upgrading to Premium",
    plan: "Premium"
  },
  {
    name: "Priya Patel",
    role: "Product Manager",
    company: "Flipkart",
    image: "👩‍💼",
    story: "Direct recruiter access helped me land my dream job with 40% salary hike",
    plan: "Pro"
  },
  {
    name: "Amit Kumar",
    role: "Data Scientist",
    company: "Microsoft",
    image: "👨‍🔬",
    story: "Premium resume templates and interview prep made all the difference",
    plan: "Premium"
  }
]

export default function FeaturesPage() {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState("visibility")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <JobAtPaceNavbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Premium Features That
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Accelerate</span> Your Career
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Discover how our premium features can transform your job search experience and help you land your dream job faster
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => router.push('/job-at-pace')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3"
            >
              View Pricing Plans
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => router.push('/job-at-pace/subscribe?plan=premium')}
            >
              Start Free Trial
            </Button>
          </div>
        </div>

        {/* Feature Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-16">
          {featureCategories.map((category) => (
            <Card 
              key={category.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                activeCategory === category.id 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => setActiveCategory(category.id)}
            >
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full w-fit">
                  <category.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Features */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {featureCategories.find(cat => cat.id === activeCategory)?.name} Features
            </h2>
            <p className="text-gray-600">
              {featureCategories.find(cat => cat.id === activeCategory)?.description}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {detailedFeatures[activeCategory as keyof typeof detailedFeatures]?.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex space-x-1">
                      {feature.plans.map((plan) => (
                        <Badge 
                          key={plan} 
                          variant="outline" 
                          className="text-xs"
                        >
                          {plan}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Plan Comparison */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
            <p className="text-xl text-gray-600">Compare features across all our plans</p>
          </div>

          <div className="overflow-x-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-w-max lg:min-w-0">
              {comparisonPlans.map((plan, index) => (
                <Card 
                  key={index}
                  className={`relative ${
                    plan.popular 
                      ? 'ring-2 ring-purple-500 shadow-lg scale-105' 
                      : 'hover:shadow-md'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2">
                        ⭐ Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full w-fit">
                      <plan.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {plan.price}
                    </div>
                    <div className="text-gray-600">{plan.period}</div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {Object.entries(plan.features).map(([feature, value]) => (
                      <div key={feature} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{feature}:</span>
                        <span className={`font-medium ${
                          value === "❌" ? "text-red-500" : "text-gray-900"
                        }`}>
                          {value}
                        </span>
                      </div>
                    ))}
                    
                    <Button 
                      className={`w-full mt-6 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                          : plan.name === 'Free'
                          ? 'bg-gray-600 hover:bg-gray-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white`}
                      onClick={() => router.push(`/job-at-pace/subscribe?plan=${plan.name.toLowerCase()}`)}
                      disabled={plan.name === 'Free'}
                    >
                      {plan.name === 'Free' ? 'Current Plan' : `Choose ${plan.name}`}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Success Stories */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Success Stories</h2>
            <p className="text-xl text-gray-600">See how our premium features helped professionals like you</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="text-4xl">{story.image}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{story.name}</h3>
                      <p className="text-sm text-gray-600">{story.role}</p>
                      <p className="text-sm font-medium text-blue-600">{story.company}</p>
                    </div>
                  </div>
                  <blockquote className="text-gray-700 italic mb-4">
                    "{story.story}"
                  </blockquote>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                    {story.plan} Plan User
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Accelerate Your Career?</h2>
            <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
              Join thousands of professionals who have transformed their job search with our premium features
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg"
                onClick={() => router.push('/job-at-pace/subscribe?plan=premium')}
                className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-3"
              >
                Start Premium Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => router.push('/job-at-pace')}
                className="border-white text-white hover:bg-white/10 px-8 py-3"
              >
                View All Plans
              </Button>
            </div>

            <Alert className="max-w-md mx-auto bg-white/10 border-white/20">
              <Gift className="h-4 w-4" />
              <AlertDescription className="text-white">
                <strong>Limited Time:</strong> Get 30% off your first subscription + free career consultation call
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
