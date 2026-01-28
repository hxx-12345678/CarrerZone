"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HelpCircle, Search, MessageSquare, Clock, Users, Shield, CheckCircle, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export default function FAQsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const faqs = [
    {
      question: "How do I create an account?",
      answer: "Click on the 'Sign Up' button on our homepage and fill in your details. You can choose to sign up as a job seeker or an employer. The process is quick and takes less than 2 minutes to complete."
    },
    {
      question: "Is it free to use Job Portal?",
      answer: "Yes, basic features are free for both job seekers and employers. We also offer premium features for enhanced visibility and advanced tools. Premium plans start at $29/month for employers and are completely free for job seekers."
    },
    {
      question: "How do I apply for a job?",
      answer: "Browse jobs on our platform, click on a job that interests you, and click the 'Apply Now' button. You'll need to upload your resume and cover letter. You can also apply with one click using your saved profile."
    },
    {
      question: "How do I post a job?",
      answer: "Create an employer account, go to your dashboard, and click 'Post a Job'. Fill in the job details and requirements, then publish your listing. Premium job postings get 3x more visibility and applications."
    },
    {
      question: "Can I edit my profile after creating it?",
      answer: "Yes, you can edit your profile at any time by going to your dashboard and clicking on 'Edit Profile'. All changes are saved automatically and your profile is updated in real-time."
    },
    {
      question: "How do I reset my password?",
      answer: "Click on 'Forgot Password' on the login page, enter your email address, and follow the instructions sent to your email. The reset link is valid for 24 hours for security purposes."
    },
    {
      question: "What file formats are accepted for resumes?",
      answer: "We accept PDF, DOC, and DOCX file formats for resumes. The maximum file size is 5MB. We recommend using PDF format for the best compatibility across all devices."
    },
    {
      question: "How do I delete my account?",
      answer: "Go to your account settings and click on 'Delete Account'. Please note that this action cannot be undone and all your data will be permanently removed from our system."
    },
    {
      question: "How long does it take to get verified?",
      answer: "Account verification typically takes 1-2 business days. We verify email addresses immediately, but document verification for employers may take up to 48 hours during peak times."
    },
    {
      question: "Can I apply for multiple jobs at once?",
      answer: "Yes, you can apply for as many jobs as you want. We recommend applying to jobs that match your skills and experience for better success rates. You can track all your applications in your dashboard."
    },
    {
      question: "How do I contact support?",
      answer: "You can contact our support team through the contact form, email us at support@jobportal.com, or call us at +1 (555) 123-4567. We respond to all inquiries within 24 hours."
    },
    {
      question: "Is my personal information secure?",
      answer: "Yes, we take data security very seriously. All personal information is encrypted and stored securely. We never share your data with third parties without your explicit consent."
    }
  ]

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4" />
            <span>Support Center</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Frequently Asked
            <span className="bg-gradient-to-r from-blue-600 to-slate-600 bg-clip-text text-transparent"> Questions</span>
          </h1>
          
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Find answers to common questions about our platform. Can't find what you're looking for? Contact our support team.
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Quick Answers</h3>
            <p className="text-slate-600 text-sm">Find instant solutions to common questions</p>
          </div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">24/7 Available</h3>
            <p className="text-slate-600 text-sm">Access help whenever you need it</p>
          </div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Expert Support</h3>
            <p className="text-slate-600 text-sm">Get help from our knowledgeable team</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  {searchQuery ? `Search Results (${filteredFaqs.length})` : 'Common Questions'}
                </CardTitle>
              </div>
              <p className="text-slate-600">
                {searchQuery 
                  ? `Found ${filteredFaqs.length} questions matching "${searchQuery}"`
                  : 'Browse through our most frequently asked questions'
                }
              </p>
            </CardHeader>
            <CardContent>
              {filteredFaqs.length > 0 ? (
                <Accordion type="single" collapsible className="space-y-4">
                  {filteredFaqs.map((faq, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`item-${index}`}
                      className="border border-slate-200 rounded-xl px-6 py-2 hover:border-blue-300 transition-colors duration-200"
                    >
                      <AccordionTrigger className="text-left font-medium text-slate-900 hover:text-blue-600 py-4">
                      {faq.question}
                    </AccordionTrigger>
                      <AccordionContent className="text-slate-600 leading-relaxed pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No results found</h3>
                  <p className="text-slate-600 mb-6">Try searching with different keywords or browse all questions</p>
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2 mx-auto"
                  >
                    <span>View all questions</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contact CTA */}
        <div className="max-w-4xl mx-auto mt-16">
          <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Can't find the answer you're looking for? Our support team is here to help you with any questions or concerns.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors duration-200">
                  Contact Support
                </button>
                <button className="border border-white/30 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors duration-200">
                  Browse Help Center
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}