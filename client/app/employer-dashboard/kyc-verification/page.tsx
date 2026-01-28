"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload, FileText, CheckCircle, Clock, AlertCircle, Building2, Shield, FileCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { apiService } from '@/lib/api'
import { EmployerAuthGuard } from '@/components/employer-auth-guard'
import { EmployerDashboardNavbar } from '@/components/employer-dashboard-navbar'
import { EmployerDashboardFooter } from '@/components/employer-dashboard-footer'

export default function KYCVerificationPage() {
  return (
    <EmployerAuthGuard>
      <KYCVerificationContent />
    </EmployerAuthGuard>
  )
}

function KYCVerificationContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [kycStatus, setKycStatus] = useState<any>(null)
  const [files, setFiles] = useState<{[key: string]: File | null}>({
    gstCertificate: null,
    panCard: null,
    addressProof: null,
    authSignatoryId: null,
    incorporationCertificate: null,
    businessLicense: null
  })

  // Load KYC status
  useEffect(() => {
    loadKYCStatus()
  }, [])

  const loadKYCStatus = async () => {
    try {
      const response = await apiService.getAgencyKycStatus()
      if (response.success) {
        setKycStatus(response.data)
      }
    } catch (error: any) {
      console.error('Error loading KYC status:', error)
    }
  }

  const handleFileChange = (field: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF and image files (JPG, PNG) are allowed')
        return
      }

      setFiles(prev => ({ ...prev, [field]: file }))
      toast.success(`${field} selected: ${file.name}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate at least GST certificate or Incorporation certificate is uploaded
    if (!files.gstCertificate && !files.incorporationCertificate) {
      toast.error('Please upload either GST Certificate or Incorporation Certificate (Required for instant verification)')
      return
    }

    if (!files.panCard) {
      toast.error('PAN Card is required')
      return
    }

    if (!files.authSignatoryId) {
      toast.error('Authorized Signatory ID is required')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file)
        }
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agency/kyc/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        toast.success('🎉 KYC documents uploaded successfully!')
        toast.info('Your documents are under review. You will be notified within 1-3 business days.')
        await loadKYCStatus()
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/employer-dashboard')
        }, 2000)
      } else {
        toast.error(data.message || 'Failed to upload documents')
      }
    } catch (error: any) {
      console.error('KYC upload error:', error)
      toast.error('Failed to upload documents. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  // Get verification status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Verified</Badge>
      case 'pending':
        return <Badge className="bg-yellow-600"><Clock className="w-3 h-3 mr-1" /> Under Review</Badge>
      case 'unverified':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Not Verified</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Calculate progress
  const getProgress = () => {
    if (!kycStatus) return 0
    if (kycStatus.verificationStatus === 'verified') return 100
    if (kycStatus.verificationStatus === 'pending') return 60
    
    const uploadedDocs = kycStatus.agencyDocuments
    if (!uploadedDocs) return 0
    
    const totalDocs = 6
    const uploaded = Object.keys(uploadedDocs).length
    return (uploaded / totalDocs) * 50 // 50% for uploading, 50% for verification
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900">
      <EmployerDashboardNavbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            KYC Verification
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Complete your agency verification to start posting jobs for clients
          </p>
        </div>

        {/* Status Card */}
        {kycStatus && (
          <Card className="mb-6 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Verification Status
                </CardTitle>
                {getStatusBadge(kycStatus.verificationStatus)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Completion Progress</span>
                    <span className="text-sm text-gray-600">{Math.round(getProgress())}%</span>
                  </div>
                  <Progress value={getProgress()} className="h-2" />
                </div>
                
                {kycStatus.verificationStatus === 'verified' && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-green-800 dark:text-green-200 font-medium flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Your agency is verified! You can now add clients and start posting jobs.
                    </p>
                    <Button 
                      onClick={() => router.push('/employer-dashboard/manage-clients')}
                      className="mt-3 bg-green-600 hover:bg-green-700"
                    >
                      Manage Clients →
                    </Button>
                  </div>
                )}
                
                {kycStatus.verificationStatus === 'pending' && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-yellow-800 dark:text-yellow-200 font-medium flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Your documents are under review
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-2">
                      We're verifying your documents. This usually takes 1-3 business days. We'll notify you once approved.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Form */}
        {(!kycStatus || kycStatus.verificationStatus !== 'verified') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Upload KYC Documents
              </CardTitle>
              <CardDescription>
                Upload your agency verification documents. Ensure all documents are clear and readable.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* GST Certificate */}
                <div className="space-y-2">
                  <Label className="font-semibold text-base flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-green-600" />
                    GST Certificate (RECOMMENDED for Instant Verification) *
                  </Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('gstCertificate', e)}
                    disabled={uploading}
                  />
                  {files.gstCertificate && (
                    <p className="text-sm text-green-600">✓ {files.gstCertificate.name}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Upload your GST certificate for instant automated verification
                  </p>
                </div>

                {/* Incorporation Certificate */}
                <div className="space-y-2">
                  <Label className="font-semibold text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Certificate of Incorporation (Alternative to GST)
                  </Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('incorporationCertificate', e)}
                    disabled={uploading}
                  />
                  {files.incorporationCertificate && (
                    <p className="text-sm text-green-600">✓ {files.incorporationCertificate.name}</p>
                  )}
                </div>

                {/* PAN Card */}
                <div className="space-y-2">
                  <Label className="font-semibold text-base">Company PAN Card *</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('panCard', e)}
                    disabled={uploading}
                    required
                  />
                  {files.panCard && (
                    <p className="text-sm text-green-600">✓ {files.panCard.name}</p>
                  )}
                </div>

                {/* Address Proof */}
                <div className="space-y-2">
                  <Label className="font-semibold text-base">Address Proof (Office)</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('addressProof', e)}
                    disabled={uploading}
                  />
                  {files.addressProof && (
                    <p className="text-sm text-green-600">✓ {files.addressProof.name}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Utility bill, rental agreement, or property document
                  </p>
                </div>

                {/* Authorized Signatory ID */}
                <div className="space-y-2">
                  <Label className="font-semibold text-base">Authorized Signatory ID *</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('authSignatoryId', e)}
                    disabled={uploading}
                    required
                  />
                  {files.authSignatoryId && (
                    <p className="text-sm text-green-600">✓ {files.authSignatoryId.name}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    PAN Card, Aadhaar, or Passport of Director/Authorized Person
                  </p>
                </div>

                {/* Business License */}
                <div className="space-y-2">
                  <Label className="font-semibold text-base">Business License (Optional)</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('businessLicense', e)}
                    disabled={uploading}
                  />
                  {files.businessLicense && (
                    <p className="text-sm text-green-600">✓ {files.businessLicense.name}</p>
                  )}
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">📌 Important Notes:</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                    <li>• All files must be in PDF or image format (JPG, PNG)</li>
                    <li>• Maximum file size: 10MB per document</li>
                    <li>• Ensure documents are clear and readable</li>
                    <li>• GST certificate enables instant automated verification</li>
                    <li>• You'll be notified once your documents are verified</li>
                  </ul>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {uploading ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Submit for Verification
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/employer-dashboard')}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
      
      <EmployerDashboardFooter />
    </div>
  )
}

