'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Video, MessageSquare, Download, ExternalLink, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function EmployerResourcesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Employer Resources</h1>
          <p className="text-xl text-gray-600">
            Tools, guides, and resources to help you hire better
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Hiring Guides */}
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Hiring Guides</CardTitle>
              <CardDescription>
                Comprehensive guides to improve your recruitment process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4">
                <li>
                  <a href="#" className="text-blue-600 hover:underline flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    How to Write Effective Job Descriptions
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-600 hover:underline flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Interview Best Practices
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-600 hover:underline flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Screening Candidates Effectively
                  </a>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Video Tutorials */}
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Video Tutorials</CardTitle>
              <CardDescription>
                Step-by-step video guides for using our platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4">
                <li>
                  <a href="#" className="text-blue-600 hover:underline flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Getting Started with Your Account
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-600 hover:underline flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Creating and Managing Job Posts
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-600 hover:underline flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Using ATS AI Score Feature
                  </a>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Templates */}
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Templates & Tools</CardTitle>
              <CardDescription>
                Ready-to-use templates for your hiring needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4">
                <li>
                  <Link href="/employer-dashboard/job-templates" className="text-blue-600 hover:underline flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Job Description Templates
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-blue-600 hover:underline flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Interview Question Bank
                  </a>
                </li>
                <li>
                  <Link href="/salary-calculator" className="text-blue-600 hover:underline flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Salary Calculator
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>Support & Help</CardTitle>
              <CardDescription>
                Get help when you need it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4">
                <li>
                  <Link href="/faqs" className="text-blue-600 hover:underline flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Frequently Asked Questions
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-blue-600 hover:underline flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Contact Support
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="text-blue-600 hover:underline flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Help Center
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Industry Insights */}
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <ExternalLink className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle>Industry Insights</CardTitle>
              <CardDescription>
                Stay updated with recruitment trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4">
                <li>
                  <a href="#" className="text-blue-600 hover:underline flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    2025 Hiring Trends Report
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-600 hover:underline flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Salary Benchmarking Data
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-600 hover:underline flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Recruitment Best Practices
                  </a>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common employer actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/employer-dashboard/post-job">
                  <Button className="w-full" variant="outline">Post a Job</Button>
                </Link>
                <Link href="/employer-dashboard/requirements">
                  <Button className="w-full" variant="outline">Manage Requirements</Button>
                </Link>
                <Link href="/employer-dashboard/analytics">
                  <Button className="w-full" variant="outline">View Analytics</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Need Personalized Help?</h2>
          <p className="mb-6">
            Our team is here to help you succeed with your recruitment efforts
          </p>
          <Link href="/contact">
            <Button size="lg" variant="secondary">
              Contact Our Team
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

