"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  CheckCircle, 
  Crown, 
  Zap, 
  Award, 
  ArrowRight, 
  Download, 
  Mail, 
  Calendar,
  Gift,
  Star,
  Target,
  TrendingUp,
  Bell,
  Users,
  MessageCircle,
  FileText,
  Briefcase
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import JobAtPaceNavbar from "@/components/job-at-pace/JobAtPaceNavbar"

const planDetails = {
  basic: {
    name: "Job at Pace Basic",
    icon: Zap,
    color: "blue",
    duration: "3 months",
    features: [
      "Unlimited job applications",
      "Priority job alerts",
      "2x profile visibility boost",
      "Application tracking"
    ]
  },
  premium: {
    name: "Job at Pace Premium", 
    icon: Crown,
    color: "purple",
    duration: "6 months",
    features: [
      "Everything in Basic",
      "Recruiter contact access",
      "5x profile visibility boost",
      "Premium resume templates",
      "Career consultation call"
    ]
  },
  pro: {
    name: "Job at Pace Pro",
    icon: Award, 
    color: "gold",
    duration: "12 months",
    features: [
      "Everything in Premium",
      "Dedicated career advisor",
      "Professional resume writing",
      "Mock interview sessions",
      "10x profile visibility boost"
    ]
  }
}

const nextSteps = [
  {
    title: "Complete Your Profile",
    description: "Optimize your profile to get maximum visibility",
    icon: Users,
    action: "Complete Profile",
    href: "/profile"
  },
  {
    title: "Set Up Job Alerts",
    description: "Create smart alerts for your dream job opportunities",
    icon: Bell,
    action: "Create Alerts",
    href: "/job-at-pace/alerts"
  },
  {
    title: "Connect with Recruiters",
    description: "Start networking with top recruiters in your industry",
    icon: MessageCircle,
    action: "Browse Recruiters",
    href: "/job-at-pace/recruiters"
  },
  {
    title: "Track Applications",
    description: "Monitor your application status and response rates",
    icon: Target,
    action: "View Tracker",
    href: "/job-at-pace/applications"
  }
]

const premiumBenefits = [
  {
    title: "Profile Boost Activated",
    description: "Your profile is now featured in recruiter searches",
    icon: TrendingUp,
    status: "active"
  },
  {
    title: "Priority Job Alerts",
    description: "Get instant notifications for matching opportunities",
    icon: Bell,
    status: "active"
  },
  {
    title: "Recruiter Access Unlocked",
    description: "Direct contact information for hiring managers",
    icon: MessageCircle,
    status: "active"
  },
  {
    title: "Premium Resume Templates",
    description: "Access to professional ATS-friendly templates",
    icon: FileText,
    status: "active"
  }
]

export default function SuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan') || 'premium'
  
  const [showConfetti, setShowConfetti] = useState(true)
  
  const currentPlan = planDetails[planId as keyof typeof planDetails] || planDetails.premium

  useEffect(() => {
    // Hide confetti after 3 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false)
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [])

  const downloadInvoice = () => {
    // In a real app, this would download the actual invoice
    console.log("Downloading invoice...")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <JobAtPaceNavbar />
      
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse" />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="mx-auto w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              🎉 Congratulations!
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Your subscription to <span className="font-semibold text-purple-600">{currentPlan.name}</span> is now active
            </p>
            
            <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 px-6 py-2 text-lg">
              <currentPlan.icon className="h-5 w-5 mr-2" />
              {currentPlan.duration} subscription activated
            </Badge>
          </div>

          <Alert className="max-w-2xl mx-auto">
            <Gift className="h-4 w-4" />
            <AlertDescription className="text-left">
              <strong>Welcome Bonus!</strong> As a new subscriber, you get:
              <ul className="mt-2 space-y-1">
                <li>• 1 free professional resume review</li>
                <li>• Priority customer support for 30 days</li>
                <li>• Access to exclusive webinars and career resources</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Subscription Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <currentPlan.icon className="h-6 w-6" />
                  <span>Your Subscription Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Plan Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Plan:</span>
                        <span className="font-medium">{currentPlan.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{currentPlan.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start Date:</span>
                        <span className="font-medium">{new Date().toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Next Billing:</span>
                        <span className="font-medium">
                          {new Date(Date.now() + (planId === 'basic' ? 90 : planId === 'premium' ? 180 : 365) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Payment Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment ID:</span>
                        <span className="font-medium font-mono">PAY_{Date.now()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Method:</span>
                        <span className="font-medium">Credit Card</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Confirmed
                        </Badge>
                      </div>
                      <div className="pt-2">
                        <Button variant="outline" size="sm" onClick={downloadInvoice}>
                          <Download className="h-4 w-4 mr-2" />
                          Download Invoice
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Features Included</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {currentPlan.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Premium Benefits Activated */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span>Benefits Activated</span>
                </CardTitle>
                <CardDescription>
                  Your premium features are now live
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {premiumBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <benefit.icon className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{benefit.title}</h4>
                      <p className="text-xs text-gray-600">{benefit.description}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                      Active
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Next Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Get Started with Your Premium Features</CardTitle>
            <CardDescription>
              Complete these steps to maximize your job search success
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {nextSteps.map((step, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                    <step.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{step.description}</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => router.push(step.href)}
                    >
                      {step.action}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Support and Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Need Help?</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-sm">
                Our premium support team is here to help you succeed
              </p>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Support (24/7)
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Live Chat Support
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Career Call
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-sm">
                Jump straight into your premium job search experience
              </p>
              <div className="space-y-2">
                <Button 
                  size="sm" 
                  className="w-full justify-start bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  onClick={() => router.push('/job-at-pace')}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => router.push('/jobs')}
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Browse Premium Jobs
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => router.push('/job-at-pace/settings')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Manage Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
