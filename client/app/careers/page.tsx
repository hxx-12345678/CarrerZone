"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Users, Briefcase } from "lucide-react"

export default function CareersPage() {
  const jobOpenings = [
    {
      id: 1,
      title: "Senior Frontend Developer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      experience: "3-5 years",
      posted: "2 days ago",
      description: "We're looking for a talented frontend developer to join our engineering team."
    },
    {
      id: 2,
      title: "Product Manager",
      department: "Product",
      location: "New York, NY",
      type: "Full-time",
      experience: "5-7 years",
      posted: "1 week ago",
      description: "Lead product strategy and work with cross-functional teams to deliver amazing user experiences."
    },
    {
      id: 3,
      title: "UX Designer",
      department: "Design",
      location: "San Francisco, CA",
      type: "Full-time",
      experience: "2-4 years",
      posted: "3 days ago",
      description: "Create beautiful and intuitive user experiences for our job portal platform."
    },
    {
      id: 4,
      title: "Data Scientist",
      department: "Analytics",
      location: "Remote",
      type: "Full-time",
      experience: "4-6 years",
      posted: "5 days ago",
      description: "Help us build intelligent features using machine learning and data analysis."
    },
    {
      id: 5,
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Chicago, IL",
      type: "Full-time",
      experience: "2-3 years",
      posted: "1 week ago",
      description: "Ensure our customers have the best experience using our platform."
    },
    {
      id: 6,
      title: "DevOps Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      experience: "3-5 years",
      posted: "4 days ago",
      description: "Build and maintain our cloud infrastructure and deployment pipelines."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Join Our Team</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Be part of a mission-driven company that's transforming how people find jobs 
            and companies find talent. We're looking for passionate individuals to join our growing team.
          </p>
        </div>

        {/* Why Work With Us */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="shadow-lg text-center">
            <CardContent className="pt-6">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Great Team</h3>
              <p className="text-gray-600">
                Work with talented, passionate people who are committed to making a difference.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg text-center">
            <CardContent className="pt-6">
              <Briefcase className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Growth Opportunities</h3>
              <p className="text-gray-600">
                Advance your career with learning opportunities and challenging projects.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg text-center">
            <CardContent className="pt-6">
              <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Work-Life Balance</h3>
              <p className="text-gray-600">
                Flexible work arrangements and comprehensive benefits package.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Benefits */}
        <Card className="shadow-lg mb-16">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Benefits & Perks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Health & Wellness</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Comprehensive health insurance</li>
                  <li>• Dental and vision coverage</li>
                  <li>• Mental health support</li>
                  <li>• Gym membership reimbursement</li>
                  <li>• Wellness programs</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">Professional Development</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Learning and development budget</li>
                  <li>• Conference attendance</li>
                  <li>• Mentorship programs</li>
                  <li>• Skill development workshops</li>
                  <li>• Career advancement opportunities</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">Work Environment</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Flexible work arrangements</li>
                  <li>• Remote work options</li>
                  <li>• Modern office spaces</li>
                  <li>• Collaborative culture</li>
                  <li>• Team building activities</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">Financial Benefits</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Competitive salary</li>
                  <li>• Stock options</li>
                  <li>• 401(k) matching</li>
                  <li>• Performance bonuses</li>
                  <li>• Referral bonuses</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Openings */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Current Openings</h2>
          <div className="grid gap-6">
            {jobOpenings.map((job) => (
              <Card key={job.id} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {job.location}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {job.type}
                        </span>
                        <span>{job.experience}</span>
                      </div>
                    </div>
                    <Badge variant="secondary">{job.department}</Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{job.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Posted {job.posted}</span>
                    <Button>Apply Now</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="shadow-lg bg-blue-600 text-white">
            <CardContent className="pt-8 pb-8">
              <h2 className="text-3xl font-bold mb-4">Don't See Your Role?</h2>
              <p className="text-xl mb-6 opacity-90">
                We're always looking for talented individuals. Send us your resume and we'll keep you in mind for future opportunities.
              </p>
              <Button variant="secondary" size="lg">
                Submit Your Resume
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
