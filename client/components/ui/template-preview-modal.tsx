"use client"

import { useState } from "react"
import { X, Eye, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TemplatePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  template: {
    subject: string
    content: string
    type: 'jobseeker' | 'company'
  }
}

export function TemplatePreviewModal({ isOpen, onClose, template }: TemplatePreviewModalProps) {
  if (!isOpen) return null

  const processContent = (content: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'
    return content
      .replace(/\{\{signupUrl\}\}/g, `${baseUrl}/signup`)
      .replace(/\{\{loginUrl\}\}/g, `${baseUrl}/login`)
      .replace(/\{\{jobsUrl\}\}/g, `${baseUrl}/jobs`)
      .replace(/\{\{postJobUrl\}\}/g, `${baseUrl}/company/post-job`)
  }

  const processedContent = processContent(template.content)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Eye className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Email Template Preview</h2>
            <Badge variant={template.type === 'jobseeker' ? 'default' : 'secondary'}>
              {template.type === 'jobseeker' ? 'Jobseeker' : 'Company'}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Email Header */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Subject
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium text-gray-900">{template.subject}</p>
              </CardContent>
            </Card>

            {/* Email Content */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Email Content</CardTitle>
                <CardDescription>
                  This is how the email will appear to recipients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 border rounded-lg p-4">
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {processedContent}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Template Variables */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Available Variables</CardTitle>
                <CardDescription>
                  These placeholders will be automatically replaced with actual URLs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">{'{{signupUrl}}'}</code>
                    <span className="text-sm text-gray-600">→ Sign up page</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">{'{{loginUrl}}'}</code>
                    <span className="text-sm text-gray-600">→ Login page</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">{'{{jobsUrl}}'}</code>
                    <span className="text-sm text-gray-600">→ Jobs listing page</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">{'{{postJobUrl}}'}</code>
                    <span className="text-sm text-gray-600">→ Post job page (companies only)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  )
}

