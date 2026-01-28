"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MapPin, Home, Users, Building2, Star, Search, ArrowRight, ExternalLink, Globe, Navigation } from "lucide-react"

export default function SitemapPage() {
  const sections = [
    {
      title: "Main Pages",
      icon: Home,
      color: "blue",
      links: [
        { name: "Home", href: "/", description: "Landing page and overview" },
        { name: "About", href: "/about", description: "Learn about our platform" },
        { name: "Contact", href: "/contact", description: "Get in touch with us" },
        { name: "Careers", href: "/careers", description: "Join our team" },
        { name: "Terms of Service", href: "/terms", description: "Legal terms and conditions" },
        { name: "Privacy Policy", href: "/privacy", description: "How we protect your data" },
        { name: "FAQs", href: "/faqs", description: "Frequently asked questions" }
      ]
    },
    {
      title: "Job Seeker",
      icon: Users,
      color: "green",
      links: [
        { name: "Find Jobs", href: "/jobs", description: "Browse available positions" },
        { name: "Companies", href: "/companies", description: "Explore company profiles" },
        { name: "Featured Companies", href: "/featured-companies", description: "Top employers" },
        { name: "Salary Calculator", href: "/salary-calculator", description: "Calculate your worth" },
        { name: "Job Alerts", href: "/job-alerts", description: "Get notified of new jobs" },
        { name: "Login", href: "/login", description: "Access your account" },
        { name: "Register", href: "/register", description: "Create your profile" }
      ]
    },
    {
      title: "Employer",
      icon: Building2,
      color: "purple",
      links: [
        { name: "Post Jobs", href: "/employer-dashboard/post-job", description: "Create job listings" },
        { name: "Manage Jobs", href: "/employer-dashboard/manage-jobs", description: "Track your postings" },
        { name: "Bulk Import", href: "/employer-dashboard/bulk-import", description: "Import multiple jobs" },
        { name: "Analytics", href: "/employer-dashboard/analytics", description: "View performance metrics" },
        { name: "Employer Login", href: "/employer-login", description: "Access employer portal" },
        { name: "Employer Register", href: "/employer-register", description: "Create employer account" }
      ]
    },
    {
      title: "Premium Features",
      icon: Star,
      color: "orange",
      links: [
        { name: "Job at Pace", href: "/job-at-pace", description: "Accelerated job posting" },
        { name: "ResumeAI", href: "/job-at-pace", description: "AI-powered resume tools" },
        { name: "Combo Plans", href: "/job-at-pace", description: "Bundle offers" },
        { name: "Value Plans", href: "/job-at-pace", description: "Cost-effective solutions" },
        { name: "Premium Features", href: "/job-at-pace", description: "Advanced tools" }
      ]
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-100 text-blue-600 border-blue-200 hover:bg-blue-50",
      green: "bg-green-100 text-green-600 border-green-200 hover:bg-green-50",
      purple: "bg-purple-100 text-purple-600 border-purple-200 hover:bg-purple-50",
      orange: "bg-orange-100 text-orange-600 border-orange-200 hover:bg-orange-50"
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <MapPin className="w-4 h-4" />
            <span>Site Navigation</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Site
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> Map</span>
          </h1>
          
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Navigate through all pages and features of our platform. Find exactly what you're looking for with our comprehensive site map.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Navigation className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Easy Navigation</h3>
            <p className="text-slate-600 text-sm">Find any page or feature quickly</p>
          </div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Quick Search</h3>
            <p className="text-slate-600 text-sm">Use Ctrl+F to search for specific pages</p>
          </div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Complete Overview</h3>
            <p className="text-slate-600 text-sm">All pages and features in one place</p>
          </div>
        </div>

        {/* Sitemap Grid */}
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {sections.map((section, index) => {
              const IconComponent = section.icon
              return (
                <Card key={index} className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="pb-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getColorClasses(section.color)}`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900">{section.title}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                    {section.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <Link 
                          href={link.href}
                            className="group block p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200"
                        >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-slate-900 group-hover:text-indigo-700 transition-colors duration-200">
                          {link.name}
                                </div>
                                <div className="text-sm text-slate-600 mt-1">
                                  {link.description}
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors duration-200 flex-shrink-0 ml-2" />
                            </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              )
            })}
          </div>
        </div>

        {/* Quick Access Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <Card className="shadow-xl border-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Can't find what you're looking for?</h3>
              <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
                Use our search functionality or contact our support team for assistance in finding the right page or feature.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors duration-200">
                    Contact Support
                  </Button>
                </Link>
                <Link href="/faqs">
                  <Button variant="outline" className="border-white/30 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors duration-200">
                    Browse FAQs
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Links */}
        <div className="max-w-4xl mx-auto mt-12">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-slate-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">Additional Resources</CardTitle>
              </div>
              <p className="text-slate-600">Quick access to important pages and resources</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Support & Help</h4>
                  <ul className="space-y-2">
                    <li><Link href="/contact" className="text-indigo-600 hover:text-indigo-700 hover:underline">Contact Us</Link></li>
                    <li><Link href="/faqs" className="text-indigo-600 hover:text-indigo-700 hover:underline">FAQs</Link></li>
                    <li><Link href="/report-problem" className="text-indigo-600 hover:text-indigo-700 hover:underline">Report Problem</Link></li>
                    <li><Link href="/trust-safety" className="text-indigo-600 hover:text-indigo-700 hover:underline">Trust & Safety</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Legal & Policies</h4>
                  <ul className="space-y-2">
                    <li><Link href="/terms" className="text-indigo-600 hover:text-indigo-700 hover:underline">Terms of Service</Link></li>
                    <li><Link href="/privacy" className="text-indigo-600 hover:text-indigo-700 hover:underline">Privacy Policy</Link></li>
                    <li><Link href="/whistleblower" className="text-indigo-600 hover:text-indigo-700 hover:underline">Whistleblower Protection</Link></li>
                    <li><Link href="/sitemap" className="text-indigo-600 hover:text-indigo-700 hover:underline">Sitemap</Link></li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}