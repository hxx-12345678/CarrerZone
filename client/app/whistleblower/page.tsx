"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Eye, Lock, AlertTriangle, Send, Loader2, FileText, CheckCircle, Phone, Mail, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { apiService } from "@/lib/api"

export default function WhistleblowerPage() {
  const [formData, setFormData] = useState({
    misconductType: "",
    department: "",
    description: "",
    incidentDate: "",
    additionalInfo: ""
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
      misconductType: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.misconductType || !formData.description) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    
    try {
      // Map misconduct type to appropriate category
      const categoryMap: { [key: string]: string } = {
        'fraud': 'fraud',
        'corruption': 'fraud',
        'harassment': 'misconduct',
        'discrimination': 'misconduct',
        'safety': 'misconduct',
        'financial': 'fraud',
        'data-breach': 'fraud',
        'conflict-of-interest': 'misconduct',
        'other': 'whistleblower'
      }

      const response = await apiService.sendSupportMessage({
        firstName: "Anonymous",
        lastName: "Reporter",
        email: "anonymous@whistleblower.com",
        subject: `Whistleblower Report: ${formData.misconductType}`,
        message: `Type of Misconduct: ${formData.misconductType}\n\nDepartment/Area: ${formData.department}\n\nIncident Date: ${formData.incidentDate}\n\nDescription: ${formData.description}\n\nAdditional Information: ${formData.additionalInfo}`,
        category: categoryMap[formData.misconductType] || 'whistleblower'
      })

      if (response.success) {
        toast.success("Anonymous report submitted successfully! Your report has been received and will be investigated.")
        setFormData({
          misconductType: "",
          department: "",
          description: "",
          incidentDate: "",
          additionalInfo: ""
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-100">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            <span>Whistleblower Protection</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Whistleblower
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> Protection</span>
          </h1>
          
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Report misconduct safely and anonymously. Your identity is protected, and we take all reports seriously.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Anonymous</h3>
            <p className="text-slate-600 text-sm">Your identity remains completely confidential</p>
          </div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Secure</h3>
            <p className="text-slate-600 text-sm">All reports are encrypted and securely stored</p>
          </div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Protected</h3>
            <p className="text-slate-600 text-sm">Legal protection against retaliation</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Protection Info */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm mb-8">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5 text-purple-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">Anonymous Reporting</CardTitle>
              </div>
              <p className="text-slate-600">Your safety and confidentiality are our top priorities</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Eye className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Anonymous</h3>
                    <p className="text-slate-600 text-sm">Your identity remains completely confidential</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Secure</h3>
                    <p className="text-slate-600 text-sm">All reports are encrypted and securely stored</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Protected</h3>
                    <p className="text-slate-600 text-sm">Legal protection against retaliation</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Form */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">Report Misconduct</CardTitle>
              </div>
              <p className="text-slate-600">Provide detailed information about the incident</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Type of Misconduct *
                  </label>
                  <Select value={formData.misconductType} onValueChange={handleSelectChange}>
                    <SelectTrigger className="border-slate-200 focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue placeholder="Select type of misconduct" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fraud">Fraud</SelectItem>
                      <SelectItem value="corruption">Corruption</SelectItem>
                      <SelectItem value="harassment">Harassment</SelectItem>
                      <SelectItem value="discrimination">Discrimination</SelectItem>
                      <SelectItem value="safety">Safety Violation</SelectItem>
                      <SelectItem value="financial">Financial Misconduct</SelectItem>
                      <SelectItem value="data-breach">Data Breach</SelectItem>
                      <SelectItem value="conflict-of-interest">Conflict of Interest</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Department/Area
                  </label>
                  <Input 
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="Which department or area is involved?" 
                    className="border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Incident Description *
                  </label>
                  <Textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Please provide a detailed description of the incident..." 
                    rows={6}
                    required
                    className="border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    When did this occur?
                  </label>
                  <Input 
                    name="incidentDate"
                    type="date"
                    value={formData.incidentDate}
                    onChange={handleInputChange}
                    className="border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Additional Information
                  </label>
                  <Textarea 
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    placeholder="Any additional information that might be helpful..." 
                    rows={4}
                    className="border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-yellow-800 mb-1">Important Notice</h3>
                      <p className="text-sm text-yellow-700">
                        This report will be handled confidentially by our ethics team. False reports may result in legal action. 
                        All reports are taken seriously and investigated thoroughly.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
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
                      Submit Anonymous Report
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact CTA */}
          <div className="mt-12">
            <Card className="shadow-xl border-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Need Help or Have Questions?</h3>
                <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
                  If you need immediate assistance or have questions about the reporting process, 
                  contact our ethics team through secure channels.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => window.location.href = 'mailto:ethics@jobportal.com?subject=Whistleblower Inquiry'}
                    className="bg-white text-purple-600 px-6 py-3 rounded-lg font-medium hover:bg-purple-50 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Ethics Team</span>
                  </button>
                  <button 
                    onClick={() => window.location.href = 'tel:+918040400000'}
                    className="border border-white/30 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Secure Hotline</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Legal Protection Info */}
          <div className="mt-12">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900">Legal Protection</CardTitle>
                </div>
                <p className="text-slate-600">Your rights and protections as a whistleblower</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Your Rights</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-600">Protection against retaliation</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-600">Confidentiality of your identity</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-600">Legal immunity for good faith reports</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-600">Right to follow up on your report</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Our Commitment</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-600">Thorough investigation of all reports</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-600">Regular updates on investigation progress</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-600">Appropriate action against misconduct</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-600">Continuous improvement of our processes</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}