"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Scale, FileText, Mail, Phone } from "lucide-react"

export default function SummonsNoticePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Scale className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Legal Notices & Summons</h1>
            <p className="text-xl text-gray-600">
              Official legal notices, summons, and court-related communications.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                  <FileText className="h-6 w-6 mr-2" />
                  Legal Notices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold">Terms of Service Update</h3>
                    <p className="text-sm text-gray-600">Updated: January 15, 2025</p>
                    <p className="text-sm text-gray-500">Changes to our terms of service effective immediately.</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-semibold">Privacy Policy Amendment</h3>
                    <p className="text-sm text-gray-600">Updated: January 10, 2025</p>
                    <p className="text-sm text-gray-500">Enhanced privacy protections and data handling procedures.</p>
                  </div>
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h3 className="font-semibold">Service Maintenance Notice</h3>
                    <p className="text-sm text-gray-600">Scheduled: January 30, 2025</p>
                    <p className="text-sm text-gray-500">Planned maintenance window for system updates.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                  <Scale className="h-6 w-6 mr-2" />
                  Court Summons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Active Summons</h3>
                  <p className="text-gray-500">
                    There are currently no active court summons or legal proceedings.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Legal Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Legal Department</h3>
                  <p className="text-sm text-gray-600">legal@jobportal.com</p>
                </div>
                <div className="text-center">
                  <Phone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Legal Hotline</h3>
                  <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
                </div>
                <div className="text-center">
                  <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Document Service</h3>
                  <p className="text-sm text-gray-600">documents@jobportal.com</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Card className="shadow-lg bg-gray-50">
              <CardContent className="pt-6 pb-6">
                <h2 className="text-xl font-semibold mb-4">Important Legal Information</h2>
                <p className="text-gray-600 mb-4">
                  All legal notices and summons are served in accordance with applicable laws and regulations.
                  Please ensure you receive and respond to any legal communications promptly.
                </p>
                <Button variant="outline">
                  Download Legal Documents
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
