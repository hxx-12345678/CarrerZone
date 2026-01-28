"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Target, Award, Heart } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">About Job Portal</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're revolutionizing the way people find jobs and companies find talent. 
            Our platform connects millions of job seekers with opportunities across the globe.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <Target className="h-6 w-6 text-blue-600 mr-2" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed">
                To empower job seekers and employers by providing a seamless, efficient, 
                and transparent platform that connects the right talent with the right opportunities. 
                We believe everyone deserves access to meaningful work that aligns with their skills and aspirations.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <Award className="h-6 w-6 text-blue-600 mr-2" />
                Our Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed">
                To become the world's leading job portal, transforming how people discover 
                career opportunities and how companies build their teams. We envision a future 
                where finding the perfect job match is effortless and rewarding for everyone.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <Card className="text-center shadow-lg">
            <CardContent className="pt-6">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-gray-900 mb-2">1M+</h3>
              <p className="text-gray-600">Active Job Seekers</p>
            </CardContent>
          </Card>

          <Card className="text-center shadow-lg">
            <CardContent className="pt-6">
              <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-gray-900 mb-2">50K+</h3>
              <p className="text-gray-600">Companies</p>
            </CardContent>
          </Card>

          <Card className="text-center shadow-lg">
            <CardContent className="pt-6">
              <Award className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-gray-900 mb-2">100K+</h3>
              <p className="text-gray-600">Jobs Posted</p>
            </CardContent>
          </Card>

          <Card className="text-center shadow-lg">
            <CardContent className="pt-6">
              <Heart className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-gray-900 mb-2">95%</h3>
              <p className="text-gray-600">Success Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Our Story */}
        <Card className="shadow-lg mb-16">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Our Story</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="text-gray-600 leading-relaxed mb-6">
                Founded in 2020, Job Portal started as a simple idea: to make job searching 
                more efficient and less stressful. Our founders, having experienced the 
                challenges of traditional job hunting, set out to create a platform that 
                would revolutionize the recruitment industry.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                Today, we've grown from a small startup to a global platform serving 
                millions of users across multiple countries. Our commitment to innovation, 
                user experience, and connecting people with opportunities has remained 
                unchanged throughout our journey.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We continue to invest in cutting-edge technology, including AI-powered 
                job matching, advanced search algorithms, and mobile-first design to 
                ensure our platform remains at the forefront of the industry.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Values */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="shadow-lg">
              <CardContent className="pt-6 text-center">
                <Heart className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Empathy</h3>
                <p className="text-gray-600">
                  We understand the challenges of job searching and are committed to making it easier.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="pt-6 text-center">
                <Award className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Excellence</h3>
                <p className="text-gray-600">
                  We strive for excellence in everything we do, from our platform to our customer service.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="pt-6 text-center">
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Community</h3>
                <p className="text-gray-600">
                  We believe in building a strong community of job seekers and employers.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="shadow-lg bg-blue-600 text-white">
            <CardContent className="pt-8 pb-8">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-xl mb-6 opacity-90">
                Join millions of job seekers and thousands of companies on our platform.
              </p>
              <div className="space-x-4">
                <Button variant="secondary" size="lg">
                  Find Jobs
                </Button>
                <Button variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-blue-600">
                  Post Jobs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
