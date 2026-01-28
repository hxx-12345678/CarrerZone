"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Bug, User, Mail, Send, Loader2, Shield, Clock, CheckCircle, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { apiService } from "@/lib/api"

export default function ReportProblemPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    problemType: "",
    pageFeature: "",
    description: "",
    stepsToReproduce: "",
    browserDevice: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      problemType: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.problemType || !formData.description) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await apiService.sendSupportMessage({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        subject: `Problem Report: ${formData.problemType}`,
        message: `Problem Type: ${formData.problemType}\n\nPage/Feature: ${formData.pageFeature}\n\nDescription: ${formData.description}\n\nSteps to Reproduce: ${formData.stepsToReproduce}\n\nBrowser/Device: ${formData.browserDevice}`,
        category: "bug"
      })

      if (response.success) {
        toast.success("Problem report submitted successfully! We'll investigate and get back to you soon.")
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          problemType: "",
          pageFeature: "",
          description: "",
          stepsToReproduce: "",
          browserDevice: ""
        })
      } else {
        toast.error(response.message || "Failed to submit report")
      }
    } catch (error) {
      console.error("Error submitting report:", error)
      toast.error("Failed to submit report. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-100">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <AlertTriangle className="w-4 h-4" />
            <span>Problem Reporting</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Report a
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent"> Problem</span>
          </h1>
          
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Help us improve by reporting any issues you encounter on our platform. Your feedback is valuable to us.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Secure Reporting</h3>
            <p className="text-slate-600 text-sm">Your reports are handled confidentially and securely</p>
          </div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Quick Response</h3>
            <p className="text-slate-600 text-sm">We respond to all reports within 24 hours</p>
          </div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Follow-up Updates</h3>
            <p className="text-slate-600 text-sm">We keep you informed about the resolution</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Bug className="w-5 h-5 text-orange-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">Problem Details</CardTitle>
              </div>
              <p className="text-slate-600">Please provide as much detail as possible to help us resolve the issue quickly</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <User className="h-4 w-4 inline mr-1" />
                      First Name *
                    </label>
                    <Input 
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter your first name" 
                      required
                      className="border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Last Name *
                    </label>
                    <Input 
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter your last name" 
                      required
                      className="border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email *
                  </label>
                  <Input 
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email" 
                    required
                    className="border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Bug className="h-4 w-4 inline mr-1" />
                    Problem Type *
                  </label>
                  <Select value={formData.problemType} onValueChange={handleSelectChange}>
                    <SelectTrigger className="border-slate-200 focus:border-orange-500 focus:ring-orange-500">
                      <SelectValue placeholder="Select problem type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="ui">User Interface Problem</SelectItem>
                      <SelectItem value="performance">Performance Issue</SelectItem>
                      <SelectItem value="security">Security Concern</SelectItem>
                      <SelectItem value="content">Content Issue</SelectItem>
                      <SelectItem value="accessibility">Accessibility Issue</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Page/Feature
                  </label>
                  <Input 
                    name="pageFeature"
                    value={formData.pageFeature}
                    onChange={handleInputChange}
                    placeholder="Which page or feature is affected?" 
                    className="border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Problem Description *
                  </label>
                  <Textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Please describe the problem in detail..." 
                    rows={6}
                    required
                    className="border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Steps to Reproduce
                  </label>
                  <Textarea 
                    name="stepsToReproduce"
                    value={formData.stepsToReproduce}
                    onChange={handleInputChange}
                    placeholder="What steps led to this problem?" 
                    rows={4}
                    className="border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Browser/Device
                  </label>
                  <Input 
                    name="browserDevice"
                    value={formData.browserDevice}
                    onChange={handleInputChange}
                    placeholder="e.g., Chrome 120, Windows 11, iPhone 15" 
                    className="border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                
                <Button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting Report...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Submit Report
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact CTA */}
          <div className="mt-12">
            <Card className="shadow-xl border-0 bg-gradient-to-r from-orange-600 to-red-600 text-white">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Urgent Issue?</h3>
                <p className="text-orange-100 mb-6 max-w-2xl mx-auto">
                  For urgent security issues or critical problems, please contact our support team directly for immediate assistance.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => window.location.href = 'mailto:support@jobportal.com?subject=URGENT: Security Issue'}
                    className="bg-white text-orange-600 px-6 py-3 rounded-lg font-medium hover:bg-orange-50 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email Support</span>
                  </button>
                  <button 
                    onClick={() => window.location.href = 'tel:+918040400000'}
                    className="border border-white/30 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Emergency Contact</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}