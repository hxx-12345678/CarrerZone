"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Lock, Eye, CheckCircle, AlertTriangle, Users, Phone, Mail, Clock, FileText, ArrowRight, Zap, Globe } from "lucide-react"
import Link from "next/link"

export default function TrustSafetyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-slate-100">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            <span>Trust & Safety</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Trust &
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"> Safety</span>
          </h1>
          
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Your safety and security are our top priorities. We're committed to creating a safe, trustworthy environment for job seekers and employers.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Secure Platform</h3>
            <p className="text-slate-600 text-sm">Advanced encryption and security measures</p>
          </div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Verified Users</h3>
            <p className="text-slate-600 text-sm">Identity verification and background checks</p>
          </div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">24/7 Monitoring</h3>
            <p className="text-slate-600 text-sm">AI-powered detection of suspicious activities</p>
          </div>
        </div>

        {/* Safety Guidelines */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">For Job Seekers</CardTitle>
              </div>
              <p className="text-slate-600">Essential safety tips to protect yourself</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-slate-900">Never share personal financial information</div>
                    <div className="text-sm text-slate-600">Legitimate employers will never ask for bank details upfront</div>
                  </div>
                </li>
                <li className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-slate-900">Verify company information before applying</div>
                    <div className="text-sm text-slate-600">Check company websites and social media profiles</div>
                  </div>
                </li>
                <li className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-slate-900">Report suspicious job postings immediately</div>
                    <div className="text-sm text-slate-600">Help us maintain a safe platform for everyone</div>
                  </div>
                </li>
                <li className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-slate-900">Use our secure messaging system</div>
                    <div className="text-sm text-slate-600">Keep all communications within our platform</div>
                  </div>
                </li>
                <li className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-slate-900">Trust your instincts</div>
                    <div className="text-sm text-slate-600">If something seems off, it probably is</div>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">For Employers</CardTitle>
              </div>
              <p className="text-slate-600">Best practices for maintaining trust</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-slate-900">Complete company verification process</div>
                    <div className="text-sm text-slate-600">Build trust with verified company status</div>
                  </div>
                </li>
                <li className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-slate-900">Provide accurate job descriptions</div>
                    <div className="text-sm text-slate-600">Be transparent about roles and requirements</div>
                  </div>
                </li>
                <li className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-slate-900">Respect candidate privacy and data</div>
                    <div className="text-sm text-slate-600">Follow data protection regulations</div>
                  </div>
                </li>
                <li className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-slate-900">Follow fair hiring practices</div>
                    <div className="text-sm text-slate-600">Ensure equal opportunity for all candidates</div>
                  </div>
                </li>
                <li className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-slate-900">Report suspicious candidate behavior</div>
                    <div className="text-sm text-slate-600">Help maintain platform integrity</div>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Reporting Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">Report Safety Concerns</CardTitle>
              </div>
              <p className="text-slate-600">Help us maintain a safe platform by reporting any issues</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-slate-50 rounded-xl">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900">Suspicious Activity</h3>
                  <p className="text-slate-600 mb-4 text-sm">Report fake profiles, scams, or suspicious behavior</p>
                  <Link href="/report-problem">
                    <Button variant="outline" className="w-full border-orange-200 hover:bg-orange-50">
                      Report Now
                    </Button>
                  </Link>
                </div>
                <div className="text-center p-6 bg-slate-50 rounded-xl">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900">Harassment</h3>
                  <p className="text-slate-600 mb-4 text-sm">Report inappropriate messages or harassment</p>
                  <Link href="/report-problem">
                    <Button variant="outline" className="w-full border-red-200 hover:bg-red-50">
                      Report Now
                    </Button>
                  </Link>
                </div>
                <div className="text-center p-6 bg-slate-50 rounded-xl">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-900">Security Issues</h3>
                  <p className="text-slate-600 mb-4 text-sm">Report security vulnerabilities or data breaches</p>
                  <Link href="/report-problem">
                    <Button variant="outline" className="w-full border-purple-200 hover:bg-purple-50">
                      Report Now
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Features */}
        <div className="max-w-6xl mx-auto mb-16">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">Our Security Measures</CardTitle>
              </div>
              <p className="text-slate-600">How we protect your data and ensure platform safety</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-2">SSL Encryption</h4>
                  <p className="text-sm text-slate-600">All data is encrypted in transit and at rest</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-2">Identity Verification</h4>
                  <p className="text-sm text-slate-600">Multi-step verification for all users</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-2">AI Monitoring</h4>
                  <p className="text-sm text-slate-600">Automated detection of suspicious activities</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Globe className="w-6 h-6 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-2">Global Standards</h4>
                  <p className="text-sm text-slate-600">Compliance with international security standards</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-gradient-to-r from-green-600 to-blue-600 text-white">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Need Immediate Help?</h3>
              <p className="text-green-100 mb-6 max-w-2xl mx-auto">
                Our Trust & Safety team is available 24/7 to assist you with any security concerns or safety issues.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => window.location.href = 'mailto:safety@jobportal.com?subject=Trust & Safety Concern'}
                  className="bg-white text-green-600 px-6 py-3 rounded-lg font-medium hover:bg-green-50 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Contact Safety Team</span>
                </button>
                <button 
                  onClick={() => window.location.href = 'tel:+918040400000'}
                  className="border border-white/30 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>Emergency Hotline</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}