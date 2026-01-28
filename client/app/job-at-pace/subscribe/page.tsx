"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  CreditCard, 
  Shield, 
  Check, 
  Crown, 
  Zap, 
  Award,
  ArrowLeft,
  Lock,
  Star,
  Gift,
  AlertCircle,
  CheckCircle,
  Loader2,
  Sparkles,
  TrendingUp,
  Target,
  Rocket
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import JobAtPaceNavbar from "@/components/job-at-pace/JobAtPaceNavbar"
import { useAuth } from "@/hooks/useAuth"
import { usePayment } from "@/hooks/usePayment"
import { toast } from "sonner"

// Define all plan types
type Plan = {
  id: string
  name: string
  tagline: string
  price: number
  originalPrice: number
  duration: string
  type: string
  color: string
  icon: any
  popular?: boolean
  features: string[]
}

const allPlans: Record<string, Plan> = {
  // Regular Premium Plans
  basic: {
    id: "basic",
    name: "Job at Pace Basic",
    tagline: "Perfect for getting started",
    price: 999,
    originalPrice: 1499,
    duration: "3 months",
    type: "premium",
    color: "blue",
    icon: Zap,
    features: [
      "Unlimited job applications",
      "Priority job alerts (Email + SMS)",
      "Enhanced profile visibility",
      "Application status tracking",
      "Resume headline boost",
      "Basic recruiter insights",
      "Job recommendation engine",
      "Interview preparation tips",
      "2x more profile views",
      "Priority application status"
    ]
  },
  premium: {
    id: "premium",
    name: "Job at Pace Premium",
    tagline: "Most popular choice",
    price: 2499,
    originalPrice: 3499,
    duration: "6 months",
    type: "premium",
    color: "purple",
    icon: Crown,
    popular: true,
    features: [
      "Everything in Basic",
      "Premium profile badge",
      "Recruiter contact information",
      "Advanced job alerts (Email + SMS + WhatsApp)",
      "Profile featured in searches",
      "Premium resume templates",
      "Career consultation call",
      "Interview scheduling assistance",
      "Salary negotiation tips",
      "Industry insights & reports",
      "5x more profile views",
      "Priority recruiter attention",
      "Featured in top search results",
      "Direct recruiter messaging"
    ]
  },
  pro: {
    id: "pro",
    name: "Job at Pace Pro",
    tagline: "Complete career acceleration",
    price: 4999,
    originalPrice: 6999,
    duration: "12 months",
    type: "premium",
    color: "gold",
    icon: Award,
    features: [
      "Everything in Premium",
      "Dedicated career advisor",
      "Professional resume writing service",
      "LinkedIn profile optimization",
      "Mock interview sessions (3)",
      "Exclusive job opportunities",
      "Priority customer support",
      "Career coaching sessions (2)",
      "Personal branding consultation",
      "Network expansion opportunities",
      "Guaranteed interview calls*",
      "10x more profile views",
      "Exclusive recruiter network access",
      "Professional career guidance",
      "Guaranteed job interview opportunities"
    ]
  },

  // Combo Plans
  combo_starter: {
    id: "combo_starter",
    name: "Combo Starter",
    tagline: "Best for early career professionals",
    price: 1999,
    originalPrice: 2999,
    duration: "6 months",
    type: "combo",
    color: "emerald",
    icon: Sparkles,
    features: [
      "Premium Profile Badge",
      "Resume Writing Service",
      "5x Profile Views",
      "Interview Preparation Course",
      "Career Path Consultation",
      "Direct Recruiter Messaging",
      "Advanced Job Alerts",
      "Application Tracking",
      "Personalized Job Recommendations",
      "Industry Insights & Reports"
    ]
  },
  combo_professional: {
    id: "combo_professional",
    name: "Combo Professional",
    tagline: "Maximum value for serious job seekers",
    price: 3499,
    originalPrice: 4999,
    duration: "9 months",
    type: "combo",
    color: "cyan",
    icon: TrendingUp,
    popular: true,
    features: [
      "Everything in Combo Starter",
      "LinkedIn Profile Optimization",
      "3 Mock Interview Sessions",
      "Salary Negotiation Workshop",
      "Personal Branding Consultation",
      "10x Profile Views",
      "Exclusive Job Opportunities",
      "Resume + Cover Letter Writing",
      "Career Coaching (2 sessions)",
      "Dedicated Career Advisor",
      "Priority Support 24/7",
      "Featured Profile Placement"
    ]
  },
  combo_ultimate: {
    id: "combo_ultimate",
    name: "Combo Ultimate",
    tagline: "Everything you need for career success",
    price: 5999,
    originalPrice: 8999,
    duration: "12 months",
    type: "combo",
    color: "violet",
    icon: Rocket,
    features: [
      "Everything in Combo Professional",
      "Guaranteed Interview Calls (5)*",
      "5 Mock Interview Sessions",
      "Complete Profile Makeover",
      "15x Profile Views",
      "Exclusive Network Access",
      "Career Coaching (5 sessions)",
      "Job Search Strategy Planning",
      "Personal Brand Development",
      "Professional Networking Support",
      "Direct Company References",
      "Premium Resume Templates (Lifetime)",
      "VIP Customer Support"
    ]
  },

  // Value Plans
  value_starter: {
    id: "value_starter",
    name: "Value Starter",
    tagline: "Affordable premium essentials",
    price: 599,
    originalPrice: 999,
    duration: "2 months",
    type: "value",
    color: "teal",
    icon: Target,
    features: [
      "Premium Profile Badge",
      "3x Profile Views",
      "Priority Job Alerts",
      "Basic Resume Review",
      "Application Tracking",
      "Interview Tips & Guides",
      "Email Support",
      "Job Recommendation Engine"
    ]
  },
  value_professional: {
    id: "value_professional",
    name: "Value Professional",
    tagline: "Best bang for your buck",
    price: 1299,
    originalPrice: 1999,
    duration: "4 months",
    type: "value",
    color: "amber",
    icon: Star,
    popular: true,
    features: [
      "Everything in Value Starter",
      "Resume Writing Assistance",
      "5x Profile Views",
      "Advanced Job Alerts",
      "Career Consultation Call",
      "Interview Preparation Materials",
      "Direct Recruiter Messaging",
      "Industry Insights Access",
      "Priority Support",
      "Featured Profile (Weekly)"
    ]
  },
  value_premium: {
    id: "value_premium",
    name: "Value Premium",
    tagline: "Complete package at unbeatable price",
    price: 2199,
    originalPrice: 3499,
    duration: "6 months",
    type: "value",
    color: "rose",
    icon: Gift,
    features: [
      "Everything in Value Professional",
      "Professional Resume Writing",
      "LinkedIn Profile Review",
      "8x Profile Views",
      "2 Mock Interview Sessions",
      "Exclusive Job Opportunities",
      "Career Coaching Session",
      "Salary Negotiation Tips",
      "Personal Branding Guidance",
      "Dedicated Support Agent",
      "Featured Profile (Daily)",
      "Network Expansion Tools"
    ]
  }
}

export default function SubscribePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan') || 'premium'
  const { user } = useAuth()
  
  const [selectedPlan, setSelectedPlan] = useState(planId)
  const [activeTab, setActiveTab] = useState<string>(
    Object.values(allPlans).find(p => p.id === planId)?.type || 'premium'
  )

  const { initiatePayment, isProcessing } = usePayment({
    onSuccess: (paymentId) => {
      toast.success('Payment successful! Activating your premium features...')
      // Activate premium features here
      setTimeout(() => {
        router.push('/job-at-pace/success?plan=' + selectedPlan)
      }, 2000)
    },
    onError: (error) => {
      console.error('Payment error:', error)
    }
  })

  const currentPlan = allPlans[selectedPlan as keyof typeof allPlans]
  const savings = (currentPlan?.originalPrice || 0) - (currentPlan?.price || 0)
  const savingsPercentage = currentPlan?.originalPrice 
    ? Math.round((savings / currentPlan.originalPrice) * 100) 
    : 0

  useEffect(() => {
    if (!user) {
      toast.error('Please login to subscribe')
      router.push('/login?redirect=/job-at-pace/subscribe?plan=' + selectedPlan)
    }
  }, [user, router, selectedPlan])

  const handleSubscribe = async (plan: typeof currentPlan) => {
    if (!user) {
      toast.error('Please login to subscribe')
      router.push('/login?redirect=/job-at-pace/subscribe?plan=' + plan.id)
      return
    }

    // Initiate payment
    await initiatePayment(
      plan.name, // Plan type
      1, // Quantity (always 1 for subscriptions)
      plan.price, // Amount
      {
        name: `${(user as any).first_name || (user as any).firstName || 'User'} ${(user as any).last_name || (user as any).lastName || ''}`,
        email: user.email,
        phone: (user as any).phone || ''
      },
      {
        planId: plan.id,
        planType: plan.type,
        duration: plan.duration,
        originalPrice: plan.originalPrice
      }
    )
  }

  const renderPlanCard = (plan: typeof currentPlan, featured: boolean = false) => (
    <Card 
      key={plan.id}
      className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
        featured ? 'border-2 border-purple-500 shadow-lg scale-105' : 'border border-slate-200'
      } ${selectedPlan === plan.id ? 'ring-2 ring-blue-500' : ''}`}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1">
            MOST POPULAR
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-6 pt-8">
        <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-${plan.color}-400 to-${plan.color}-600 flex items-center justify-center mx-auto mb-4`}>
          <plan.icon className="w-8 h-8 text-white" />
        </div>
        
        <CardTitle className="text-2xl font-bold text-slate-900">{plan.name}</CardTitle>
        <CardDescription className="text-slate-600 mt-2">{plan.tagline}</CardDescription>
        
        <div className="mt-6">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-4xl font-bold text-slate-900">₹{plan.price.toLocaleString()}</span>
          </div>
          {plan.originalPrice && (
            <div className="flex items-center justify-center space-x-2 mt-2">
              <span className="text-lg text-slate-400 line-through">₹{plan.originalPrice.toLocaleString()}</span>
              <Badge className="bg-green-100 text-green-700 border-green-300">
                Save {savingsPercentage}%
              </Badge>
            </div>
          )}
          <p className="text-sm text-slate-600 mt-2">{plan.duration} subscription</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Separator />
        
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-900 text-sm">What's Included:</h4>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start text-sm">
                <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        <Button
          onClick={() => handleSubscribe(plan)}
          disabled={isProcessing}
          className={`w-full ${
            featured 
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white py-3 text-base font-semibold`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Book Now - ₹{plan.price.toLocaleString()}
            </>
          )}
        </Button>

        <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
          <div className="flex items-center">
            <Shield className="w-3 h-3 mr-1" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" />
            <span>Money Back Guarantee</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <JobAtPaceNavbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => router.push('/job-at-pace')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Plans
          </Button>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Choose Your Perfect Plan
            </h1>
            <p className="text-xl text-slate-600">
              Accelerate your job search with our premium features
            </p>
          </div>

          {/* Special Offer Banner */}
          <Alert className="bg-gradient-to-r from-yellow-50 to-orange-50 border-orange-200 mb-8">
            <Gift className="h-5 w-5 text-orange-600" />
            <AlertDescription className="text-slate-900">
              <strong>Limited Time Offer!</strong> Get up to 40% OFF on all plans. 
              Offer expires in 24 hours. Secure payment via Razorpay.
            </AlertDescription>
          </Alert>
        </div>

        {/* Plan Type Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-12">
            <TabsTrigger value="premium" className="text-base">
              <Crown className="w-4 h-4 mr-2" />
              Premium
            </TabsTrigger>
            <TabsTrigger value="combo" className="text-base">
              <Sparkles className="w-4 h-4 mr-2" />
              Combo
            </TabsTrigger>
            <TabsTrigger value="value" className="text-base">
              <Target className="w-4 h-4 mr-2" />
              Value
            </TabsTrigger>
          </TabsList>

          {/* Premium Plans */}
          <TabsContent value="premium" className="mt-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Premium Plans</h2>
              <p className="text-slate-600">Choose the plan that fits your career goals</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.values(allPlans)
                .filter(plan => plan.type === 'premium')
                .map(plan => renderPlanCard(plan, plan.popular))}
            </div>
          </TabsContent>

          {/* Combo Plans */}
          <TabsContent value="combo" className="mt-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Combo Plans - Maximum Value</h2>
              <p className="text-slate-600">Get the best of everything with our combined packages</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.values(allPlans)
                .filter(plan => plan.type === 'combo')
                .map(plan => renderPlanCard(plan, plan.popular))}
            </div>
          </TabsContent>

          {/* Value Plans */}
          <TabsContent value="value" className="mt-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Value Plans - Best Bang for Your Buck</h2>
              <p className="text-slate-600">Affordable premium features that deliver maximum value</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.values(allPlans)
                .filter(plan => plan.type === 'value')
                .map(plan => renderPlanCard(plan, plan.popular))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Features Comparison */}
        <div className="mt-16 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Why Choose Job at Pace?</h2>
            <p className="text-slate-600">Premium features that make a difference</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Secure Payments",
                description: "256-bit SSL encryption via Razorpay. Your payment information is always safe."
              },
              {
                icon: CheckCircle,
                title: "Money Back Guarantee",
                description: "Not satisfied? Get a full refund within 7 days, no questions asked."
              },
              {
                icon: Lock,
                title: "Instant Activation",
                description: "Your premium features are activated immediately after successful payment."
              }
            ].map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  q: "How does the payment work?",
                  a: "We use Razorpay, India's leading payment gateway. You can pay via credit/debit card, UPI, net banking, or digital wallets. All payments are 100% secure."
                },
                {
                  q: "When will my plan be activated?",
                  a: "Your plan is activated instantly after successful payment. You'll receive a confirmation email and can start using premium features immediately."
                },
                {
                  q: "Can I upgrade my plan later?",
                  a: "Yes! You can upgrade to a higher plan anytime. The remaining balance from your current plan will be adjusted in the new plan."
                },
                {
                  q: "What if I'm not satisfied?",
                  a: "We offer a 7-day money-back guarantee. If you're not satisfied with our service, contact us within 7 days for a full refund."
                }
              ].map((faq, index) => (
                <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                  <h4 className="font-semibold text-slate-900 mb-2">{faq.q}</h4>
                  <p className="text-sm text-slate-600">{faq.a}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
