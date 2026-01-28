"use client"

import { useState } from "react"
import { Search, MessageCircle, Mail, Phone, FileText, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Link from "next/link"

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "How do I create an account?",
        answer: "Click on the 'Register' button in the top navigation bar. Fill in your details, verify your email, and you're all set to start your job search or post jobs."
      },
      {
        question: "What types of accounts are available?",
        answer: "We offer two types of accounts: Job Seeker accounts for those looking for employment, and Employer accounts for companies posting job opportunities."
      },
      {
        question: "Is registration free?",
        answer: "Yes! Creating an account and searching for jobs is completely free for job seekers. Employers have various pricing plans available."
      }
    ]
  },
  {
    category: "For Job Seekers",
    questions: [
      {
        question: "How do I search for jobs?",
        answer: "Use the search bar on the homepage to enter job titles, keywords, or locations. You can also filter results by salary, experience level, job type, and more."
      },
      {
        question: "How do I apply for a job?",
        answer: "Click on any job listing to view details. Then click the 'Apply Now' button. You can use your uploaded resume or submit a custom application."
      },
      {
        question: "Can I save jobs for later?",
        answer: "Yes! Click the bookmark icon on any job listing to save it to your 'Bookmarks' section for easy access later."
      },
      {
        question: "How do I set up job alerts?",
        answer: "Go to 'Job Alerts' in your dashboard. Create custom alerts based on your preferences, and we'll notify you when matching jobs are posted."
      }
    ]
  },
  {
    category: "For Employers",
    questions: [
      {
        question: "How do I post a job?",
        answer: "Log in to your employer dashboard and click 'Post Job'. Fill in the job details, requirements, and benefits. You can preview before publishing."
      },
      {
        question: "What is bulk job import?",
        answer: "Bulk import allows you to upload multiple job postings at once using a CSV, Excel, or JSON file. Download our template from the bulk import page."
      },
      {
        question: "How do I manage applications?",
        answer: "Go to 'Applications' in your employer dashboard to view all applications. You can filter, sort, and respond to candidates directly."
      },
      {
        question: "What are featured jobs?",
        answer: "Featured jobs appear at the top of search results and get more visibility. Contact our sales team for featured job packages."
      }
    ]
  },
  {
    category: "Account & Settings",
    questions: [
      {
        question: "How do I reset my password?",
        answer: "Click 'Forgot Password' on the login page. Enter your email address, and we'll send you a password reset link."
      },
      {
        question: "How do I update my profile?",
        answer: "Go to 'Profile' or 'Settings' in your dashboard. You can update your personal information, resume, preferences, and notification settings."
      },
      {
        question: "How do I delete my account?",
        answer: "Go to Settings > Account Settings and click 'Delete Account'. Note that this action is permanent and cannot be undone."
      }
    ]
  },
  {
    category: "Technical Support",
    questions: [
      {
        question: "The website is not loading properly",
        answer: "Try clearing your browser cache and cookies. Make sure you're using an updated browser (Chrome, Firefox, Safari, or Edge)."
      },
      {
        question: "I'm not receiving emails",
        answer: "Check your spam/junk folder. Add noreply@jobportal.com to your contacts. If the issue persists, contact support."
      },
      {
        question: "How do I report a problem?",
        answer: "Use the 'Report Problem' link in the footer or email us at support@jobportal.com with details of the issue."
      }
    ]
  }
]

const contactOptions = [
  {
    icon: Mail,
    title: "Email Support",
    description: "Get help via email",
    contact: "support@jobportal.com",
    action: "mailto:support@jobportal.com"
  },
  {
    icon: Phone,
    title: "Phone Support",
    description: "Talk to our team",
    contact: "+91 1800-123-4567",
    action: "tel:+911800123456"
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Chat with us now",
    contact: "Available 9 AM - 6 PM IST",
    action: "#"
  },
  {
    icon: FileText,
    title: "Documentation",
    description: "Browse our guides",
    contact: "View all guides",
    action: "/faqs"
  }
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredFaqs, setFilteredFaqs] = useState(faqs)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      setFilteredFaqs(faqs)
      return
    }

    const filtered = faqs.map(category => ({
      ...category,
      questions: category.questions.filter(q => 
        q.question.toLowerCase().includes(query.toLowerCase()) ||
        q.answer.toLowerCase().includes(query.toLowerCase())
      )
    })).filter(category => category.questions.length > 0)

    setFilteredFaqs(filtered)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">How Can We Help You?</h1>
          <p className="text-lg text-blue-100 mb-8">Search our knowledge base or contact support</p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg text-slate-900 bg-white"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {contactOptions.map((option, index) => (
            <Link key={index} href={option.action}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <option.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{option.title}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium text-blue-600">{option.contact}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* FAQs Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
          
          {filteredFaqs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-600">No results found for "{searchQuery}"</p>
                <Button 
                  variant="link" 
                  onClick={() => handleSearch("")}
                  className="mt-2"
                >
                  Clear search
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {filteredFaqs.map((category, categoryIndex) => (
                <Card key={categoryIndex}>
                  <CardHeader>
                    <CardTitle className="text-xl text-blue-600">{category.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((faq, faqIndex) => (
                        <AccordionItem key={faqIndex} value={`item-${categoryIndex}-${faqIndex}`}>
                          <AccordionTrigger className="text-left">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-slate-600">{faq.answer}</p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Still Need Help Section */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
            <p className="text-blue-100 mb-6">Our support team is here to assist you</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                asChild
              >
                <Link href="/contact">Contact Support</Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                asChild
              >
                <Link href="/report-problem">Report a Problem</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

