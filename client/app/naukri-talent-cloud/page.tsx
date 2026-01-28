"use client"

import { motion } from "framer-motion"
import { Building2, Users, Zap, Star, ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function TalentPulsePage() {
  const features = [
    {
      icon: Users,
      title: "Smart Candidate Matching",
      description: "AI-powered algorithms match you with the most suitable candidates based on skills, experience, and cultural fit.",
    },
    {
      icon: Zap,
      title: "Instant Access",
      description: "Get immediate access to millions of verified profiles with real-time updates and availability status.",
    },
    {
      icon: Building2,
      title: "Enterprise Solutions",
      description: "Scalable solutions for companies of all sizes with advanced analytics and reporting capabilities.",
    },
    {
      icon: Star,
      title: "Quality Assurance",
      description: "Rigorous verification process ensures you connect with genuine, qualified professionals.",
    },
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "HR Director",
      company: "TechCorp Solutions",
      content: "TalentPulse has transformed our hiring process. We've reduced time-to-hire by 40% and improved candidate quality significantly.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Talent Acquisition Manager",
      company: "InnovateTech",
      content: "The AI-powered matching is incredible. We're finding candidates we never would have discovered through traditional methods.",
      rating: 5,
    },
    {
      name: "Priya Sharma",
      role: "Recruitment Lead",
      company: "Global Systems",
      content: "TalentPulse has become our go-to platform for finding top talent. The quality and speed are unmatched.",
      rating: 5,
    },
  ]

  const pricingPlans = [
    {
      name: "Starter",
      price: "₹9,999",
      period: "/month",
      description: "Perfect for small teams and startups",
      features: [
        "Access to 1M+ profiles",
        "Basic search filters",
        "Email support",
        "Standard analytics",
        "5 active searches",
      ],
      popular: false,
    },
    {
      name: "Professional",
      price: "₹19,999",
      period: "/month",
      description: "Ideal for growing companies",
      features: [
        "Access to 5M+ profiles",
        "Advanced search filters",
        "Priority support",
        "Advanced analytics",
        "Unlimited searches",
        "Custom integrations",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations",
      features: [
        "Access to all profiles",
        "Custom AI models",
        "Dedicated support",
        "Custom analytics",
        "API access",
        "White-label solutions",
        "On-premise deployment",
      ],
      popular: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
        <motion.div
            initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
            <Badge className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Talent Platform
          </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 mb-6">
              Discover the Power of{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                TalentPulse
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-slate-600 mb-8 max-w-4xl mx-auto">
              Revolutionize your hiring process with AI-powered candidate matching, instant access to millions of verified
              profiles, and enterprise-grade solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
              <Button variant="outline" size="lg">
                Schedule Demo
            </Button>
          </div>
        </motion.div>
      </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Why Choose TalentPulse?
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Our platform combines cutting-edge AI technology with human expertise to deliver exceptional hiring
              results.
          </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
            >
                <Card className="h-full bg-white/80 backdrop-blur-xl border-slate-200/50 hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
                  </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Trusted by Leading Companies
            </h2>
            <p className="text-xl text-slate-600">
              See what our clients say about TalentPulse
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
              >
                <Card className="h-full bg-white/80 backdrop-blur-xl border-slate-200/50">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-slate-600 mb-6 italic">"{testimonial.content}"</p>
                    <div>
                      <p className="font-semibold text-slate-900">{testimonial.name}</p>
                      <p className="text-sm text-slate-500">{testimonial.role}</p>
                      <p className="text-sm text-slate-500">{testimonial.company}</p>
                    </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-slate-600">
              Flexible pricing options to suit your hiring needs
            </p>
          </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
            <motion.div
              key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card className={`h-full bg-white/80 backdrop-blur-xl border-slate-200/50 relative ${
                  plan.popular ? "ring-2 ring-blue-500" : ""
                }`}>
              {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                      Most Popular
                    </Badge>
              )}
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl font-bold text-slate-900">{plan.name}</CardTitle>
                    <div className="flex items-baseline justify-center space-x-1">
                      <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                      <span className="text-slate-500">{plan.period}</span>
                  </div>
                    <p className="text-slate-600">{plan.description}</p>
                </CardHeader>
                  <CardContent className="pt-0">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          : "bg-slate-900 hover:bg-slate-800"
                    }`}
                  >
                    {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
              Ready to Transform Your Hiring?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Join thousands of companies already using TalentPulse to find their perfect candidates.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
              <Button variant="outline" size="lg">
              Schedule Demo
            </Button>
          </div>
        </motion.div>
      </div>
      </section>
    </div>
  )
}
