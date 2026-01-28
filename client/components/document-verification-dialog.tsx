"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Building2, CheckCircle, AlertCircle, X } from "lucide-react"
import { toast } from "sonner"
import { apiService } from "@/lib/api"

interface DocumentVerificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  companyData?: {
    name: string
    industry: string
    website?: string
    companyAccountType?: string
  }
}

interface DocumentUpload {
  id: string
  type: string
  file: File
  preview: string
  uploaded: boolean
  url?: string
}

export function DocumentVerificationDialog({ 
  open, 
  onOpenChange, 
  onSuccess, 
  companyData 
}: DocumentVerificationDialogProps) {
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState<DocumentUpload[]>([])
  const [formData, setFormData] = useState({
    businessLicense: '',
    taxCertificate: '',
    companyRegistration: '',
    gstNumber: '',
    panNumber: '',
    additionalNotes: ''
  })

  const requiredDocuments = [
    { 
      id: 'business_license', 
      name: 'Business License', 
      description: 'Valid business license certificate',
      required: true 
    },
    { 
      id: 'tax_certificate', 
      name: 'Tax Registration Certificate', 
      description: 'Tax registration or GST certificate',
      required: true 
    },
    { 
      id: 'company_registration', 
      name: 'Company Registration', 
      description: 'Certificate of incorporation or registration',
      required: true 
    },
    { 
      id: 'pan_card', 
      name: 'PAN Card', 
      description: 'PAN card of the company or authorized person',
      required: true 
    },
    { 
      id: 'bank_statement', 
      name: 'Bank Statement', 
      description: 'Recent bank statement (last 3 months)',
      required: false 
    },
    { 
      id: 'address_proof', 
      name: 'Address Proof', 
      description: 'Utility bill or office lease agreement',
      required: false 
    }
  ]

  const handleFileUpload = async (documentType: string, file: File) => {
    try {
      setUploading(true)
      
      // Upload file to server
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'verification_document')
      formData.append('documentType', documentType)
      
      const response = await apiService.uploadFile(formData)
      
      if (response.success) {
        const newDocument: DocumentUpload = {
          id: documentType,
          type: documentType,
          file,
          preview: URL.createObjectURL(file),
          uploaded: true,
          url: response.data.url
        }
        
        setDocuments(prev => {
          const filtered = prev.filter(doc => doc.id !== documentType)
          return [...filtered, newDocument]
        })
        
        toast.success(`${documentType.replace('_', ' ')} uploaded successfully`)
      } else {
        toast.error('Failed to upload document')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setUploading(true)
      
      // Check if at least one document is uploaded
      const uploadedDocs = documents.filter(doc => doc.uploaded)
      if (uploadedDocs.length === 0) {
        toast.error('Please upload at least one document before submitting')
        setUploading(false)
        return
      }
      
      // Check required documents
      const requiredDocTypes = requiredDocuments.filter(doc => doc.required).map(doc => doc.id)
      const uploadedDocTypes = uploadedDocs.map(doc => doc.id)
      
      const missingDocs = requiredDocTypes.filter(type => !uploadedDocTypes.includes(type))
      
      if (missingDocs.length > 0) {
        const missingNames = missingDocs.map(id => 
          requiredDocuments.find(doc => doc.id === id)?.name || id
        ).join(', ')
        toast.error(`Please upload required documents: ${missingNames}`)
        setUploading(false)
        return
      }
      
      // Submit verification request with all form data
      const verificationData = {
        documents: uploadedDocs.map(doc => ({
          type: doc.type,
          url: doc.url,
          filename: doc.url ? doc.url.split('/').pop() : null, // Extract filename from URL
          name: doc.file.name,
          size: doc.file.size,
          uploadedAt: new Date().toISOString()
        })),
        companyInfo: companyData,
        gstNumber: formData.gstNumber,
        panNumber: formData.panNumber,
        additionalNotes: formData.additionalNotes
      }
      
      const response = await apiService.submitVerificationRequest(verificationData)
      
      if (response.success) {
        toast.success('Documents submitted successfully! Please wait for admin verification.')
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(response.message || 'Failed to submit verification request')
        setUploading(false)
      }
    } catch (error) {
      console.error('Verification submission error:', error)
      toast.error('Failed to submit verification request')
      setUploading(false)
    }
  }

  const handleClose = () => {
    setDocuments([])
    setFormData({
      businessLicense: '',
      taxCertificate: '',
      companyRegistration: '',
      gstNumber: '',
      panNumber: '',
      additionalNotes: ''
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Document Verification Required
          </DialogTitle>
          <DialogDescription>
            Please upload the required documents to verify your company registration. 
            Your account will be activated once approved by our admin team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Company Info */}
          {companyData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Company Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Company Name</Label>
                    <p className="text-sm text-slate-600">{companyData.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Industry</Label>
                    <p className="text-sm text-slate-600">{companyData.industry}</p>
                  </div>
                  {companyData.website && (
                    <div>
                      <Label className="text-sm font-medium">Website</Label>
                      <p className="text-sm text-slate-600">{companyData.website}</p>
                    </div>
                  )}
                  {companyData.companyAccountType && (
                    <div>
                      <Label className="text-sm font-medium">Account Type</Label>
                      <Badge variant="outline" className="ml-2">
                        {companyData.companyAccountType === 'agency' ? 'Agency/Consultancy' :
                         companyData.companyAccountType === 'recruiting_agency' ? 'Recruiting Agency' : 
                         companyData.companyAccountType === 'consulting_firm' ? 'Consulting Firm' : 'Direct Company'}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Document Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Required Documents
              </CardTitle>
              <p className="text-sm text-slate-600">
                Upload clear, readable copies of the following documents. All documents will be verified by our admin team.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requiredDocuments.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-slate-900">
                          {doc.name}
                          {doc.required && <span className="text-red-500 ml-1">*</span>}
                        </h4>
                        <p className="text-sm text-slate-600">{doc.description}</p>
                      </div>
                      {documents.find(d => d.id === doc.id && d.uploaded) && (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    
                    {!documents.find(d => d.id === doc.id && d.uploaded) ? (
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleFileUpload(doc.id, file)
                            }
                          }}
                          disabled={uploading}
                          className="text-sm"
                        />
                        <p className="text-xs text-slate-500">
                          Accepted formats: PDF, JPG, PNG (Max 5MB)
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-700">
                            {documents.find(d => d.id === doc.id)?.file.name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDocuments(prev => prev.filter(d => d.id !== doc.id))
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gstNumber">GST Number (if applicable)</Label>
                    <Input
                      id="gstNumber"
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="panNumber">PAN Number</Label>
                    <Input
                      id="panNumber"
                      value={formData.panNumber}
                      onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                      placeholder="AAAAA0000A"
                      maxLength={10}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                    placeholder="Any additional information that might help with verification..."
                    className="min-h-20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Important Notice</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your account access will be restricted until documents are verified by our admin team</li>
                  <li>• Verification typically takes 2-4 business hours during working days</li>
                  <li>• You will receive email and in-app notifications about the verification status</li>
                  <li>• Please do not attempt to access the employer dashboard until verification is complete</li>
                  <li>• All documents are securely stored and encrypted for your protection</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={uploading || documents.filter(d => d.uploaded).length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {uploading ? 'Submitting...' : 'Submit for Verification'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
