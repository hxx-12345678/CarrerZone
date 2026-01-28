"use client"

import { useState, useEffect } from "react"
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  BarChart3,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { GulfEmployerNavbar } from "@/components/gulf-employer-navbar"
import { EmployerFooter } from "@/components/employer-footer"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"
import { GulfEmployerAuthGuard } from "@/components/gulf-employer-auth-guard"
import { apiService } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

interface BulkImport {
  id: string
  importName: string
  importType: string
  status: string
  totalRecords: number
  successfulImports: number
  failedImports: number
  progress: number
  startedAt: string
  completedAt?: string
  errorMessage?: string
}

export default function GulfBulkImportPage() {
  const { user } = useAuth()
  const [imports, setImports] = useState<BulkImport[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)

  const isGulfImport = (importJob: any) => {
    const defaults = importJob?.defaultValues || importJob?.default_values || {}
    const metadata = defaults?.metadata || {}
    const regionCandidates = [
      defaults?.region,
      defaults?.jobRegion,
      defaults?.targetRegion,
      metadata?.region,
      metadata?.jobRegion,
    ]
      .filter(Boolean)
      .map((value: any) => String(value).toLowerCase())

    if (regionCandidates.length === 0) {
      return true
    }

    return regionCandidates.includes("gulf")
  }

  useEffect(() => {
    fetchBulkImports()
  }, [])

  const fetchBulkImports = async () => {
    try {
      setLoading(true)
      const response = await apiService.getBulkImports()
      if (response.success && response.data) {
        const rawImports = Array.isArray(response.data.imports)
          ? response.data.imports
          : Array.isArray(response.data)
          ? response.data
          : []
        const gulfImports = rawImports.filter(isGulfImport)
        setImports(gulfImports)
      }
    } catch (error) {
      console.error("Error fetching bulk imports:", error)
      toast.error("Failed to fetch bulk imports")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "processing":
        return <Clock className="w-5 h-5 text-blue-600" />
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />
      case "pending":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case "csv":
        return <FileText className="w-4 h-4" />
      case "excel":
        return <FileText className="w-4 h-4" />
      case "json":
        return <FileText className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const handleDownloadTemplate = async (format: "csv" | "excel" | "json" = "csv") => {
    try {
      const blob = await apiService.downloadBulkImportTemplate(format)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `gulf-job-import-template.${format === "excel" ? "xlsx" : format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Template downloaded successfully")
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download template")
    }
  }

  const renderLoadingState = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-teal-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-hidden">
      <GulfEmployerNavbar />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/45 via-teal-200/35 to-amber-200/45"></div>
        <div className="absolute top-20 left-16 w-44 h-44 bg-gradient-to-br from-emerald-300/15 to-teal-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-24 right-12 w-40 h-40 bg-gradient-to-br from-amber-300/15 to-emerald-200/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 bg-gradient-to-br from-teal-300/10 to-emerald-200/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading imports...</p>
        </div>
      </div>
      <EmployerFooter />
    </div>
  )

  return (
    <EmployerAuthGuard>
      <GulfEmployerAuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-teal-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-hidden">
          <GulfEmployerNavbar />

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/45 via-teal-200/35 to-amber-200/45"></div>
            <div className="absolute top-20 left-16 w-44 h-44 bg-gradient-to-br from-emerald-300/15 to-teal-300/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-24 right-12 w-40 h-40 bg-gradient-to-br from-amber-300/15 to-emerald-200/10 rounded-full blur-3xl animate-pulse delay-500"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 bg-gradient-to-br from-teal-300/10 to-emerald-200/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/4 left-0 right-0 h-24 bg-gradient-to-r from-emerald-400/20 via-teal-400/15 to-amber-400/15"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Gulf Bulk Job Import</h1>
            <p className="text-slate-600">Import multiple Gulf-region job postings from CSV, Excel, or JSON files</p>
          </div>
              <div className="flex flex-col sm:flex-row gap-3">
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 w-full sm:w-auto">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
              </DialogTrigger>
                  <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
                <DialogHeader>
                      <DialogTitle className="text-lg sm:text-xl">Upload Gulf Job Import File</DialogTitle>
                      <DialogDescription className="text-xs sm:text-sm">
                    Upload a CSV, Excel, or JSON file with Gulf job data
                  </DialogDescription>
                </DialogHeader>
                    <UploadForm
                      onClose={() => setIsUploadDialogOpen(false)}
                      onSuccess={fetchBulkImports}
                    />
              </DialogContent>
            </Dialog>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => handleDownloadTemplate("csv")}
                >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>
        </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
                <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                      <p className="text-xs sm:text-sm font-medium text-slate-600">Total Imports</p>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900">{imports.length}</p>
                </div>
                    <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
                <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                      <p className="text-xs sm:text-sm font-medium text-slate-600">Successful</p>
                      <p className="text-lg sm:text-2xl font-bold text-green-600">
                        {imports.reduce((sum, imp) => sum + (imp.successfulImports || 0), 0)}
                  </p>
                </div>
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
                <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                      <p className="text-xs sm:text-sm font-medium text-slate-600">Failed</p>
                      <p className="text-lg sm:text-2xl font-bold text-red-600">
                        {imports.reduce((sum, imp) => sum + (imp.failedImports || 0), 0)}
                  </p>
                </div>
                    <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
                <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                      <p className="text-xs sm:text-sm font-medium text-slate-600">Processing</p>
                      <p className="text-lg sm:text-2xl font-bold text-blue-600">
                        {imports.filter((imp) => imp.status === "processing").length}
                  </p>
                </div>
                    <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

            <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-xl border-white/30 shadow-[0_8px_30px_rgba(16,185,129,0.08)]">
          <CardHeader>
            <CardTitle>Import History</CardTitle>
            <CardDescription>Track your Gulf bulk import jobs and their status</CardDescription>
          </CardHeader>
          <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  </div>
                ) : imports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No imports yet</h3>
                    <p className="text-slate-600 mb-4">Upload your first job import file to get started</p>
                    <Button
                      onClick={() => setIsUploadDialogOpen(true)}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </Button>
                  </div>
                ) : (
            <div className="space-y-4">
              {imports.map((importJob) => (
                      <div key={importJob.id} className="border border-slate-200 rounded-lg p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                          <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                      {getStatusIcon(importJob.status)}
                      <div>
                              <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{importJob.importName}</h3>
                              <p className="text-xs sm:text-sm text-slate-600">
                                {importJob.totalRecords || 0} records • {(importJob.importType || "unknown").toUpperCase()} file
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                            <Badge className={`${getStatusColor(importJob.status)} text-xs`}>
                        {importJob.status}
                      </Badge>
                            <Button size="sm" variant="outline" className="hidden sm:flex">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span>Progress</span>
                            <span>{importJob.progress || 0}%</span>
                    </div>
                          <Progress value={importJob.progress || 0} className="w-full" />

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                            <div className="flex justify-between sm:block">
                              <span className="text-slate-600 sm:block">Total Records:</span>
                              <span className="font-medium sm:ml-1">{importJob.totalRecords || 0}</span>
                      </div>
                            <div className="flex justify-between sm:block">
                              <span className="text-slate-600 sm:block">Successful:</span>
                              <span className="font-medium text-green-600 sm:ml-1">{importJob.successfulImports || 0}</span>
                      </div>
                            <div className="flex justify-between sm:block">
                              <span className="text-slate-600 sm:block">Failed:</span>
                              <span className="font-medium text-red-600 sm:ml-1">{importJob.failedImports || 0}</span>
                      </div>
                            <div className="flex justify-between sm:block">
                              <span className="text-slate-600 sm:block">Started:</span>
                              <span className="font-medium sm:ml-1">
                                {importJob.startedAt ? new Date(importJob.startedAt).toLocaleDateString() : "N/A"}
                              </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
                )}
          </CardContent>
        </Card>
      </div>

          <EmployerFooter />
        </div>
      </GulfEmployerAuthGuard>
    </EmployerAuthGuard>
  )
}

function UploadForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importName, setImportName] = useState("")
  const [importType, setImportType] = useState("csv")
  const [templateId, setTemplateId] = useState("")
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportName(file.name.replace(/\.[^/.]+$/, ""))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !importName) {
      toast.error("Please select a file and enter an import name")
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("importName", importName)
      formData.append("importType", importType)
      if (templateId) formData.append("templateId", templateId)

      const defaultValuesPayload = {
        region: "gulf",
        jobRegion: "gulf",
        metadata: {
          region: "gulf",
          jobRegion: "gulf",
        },
      }
      formData.append("defaultValues", JSON.stringify(defaultValuesPayload))

      const response = await apiService.createBulkImport(formData)
      if (response.success) {
        toast.success("Bulk import started successfully")
        onSuccess()
        onClose()
      } else {
        toast.error(response.message || "Failed to start bulk import")
      }
    } catch (error) {
      console.error("Error creating bulk import:", error)
      toast.error("Failed to create bulk import")
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div>
        <Label htmlFor="importName" className="text-sm font-medium">
          Import Name
        </Label>
        <Input
          id="importName"
          value={importName}
          onChange={(e) => setImportName(e.target.value)}
          placeholder="Enter a name for this import"
          className="mt-1"
          required
        />
      </div>

      <div>
        <Label htmlFor="file" className="text-sm font-medium">
          Select File
        </Label>
        <div className="mt-2 border-2 border-dashed border-slate-300 rounded-lg p-4 sm:p-6 text-center hover:border-slate-400 transition-colors">
          <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs sm:text-sm text-slate-600 mb-3">
            Drag and drop your file here, or click to browse
          </p>
          <p className="text-xs text-slate-500 mb-3">Supported formats: CSV, Excel (.xlsx, .xls), JSON</p>
          <Input
            id="file"
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            onChange={handleFileSelect}
            className="hidden"
            required
          />
          <Button type="button" variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => document.getElementById("file")?.click()}>
            Choose File
          </Button>
          {selectedFile && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
              <p className="text-xs sm:text-sm text-green-700 font-medium">Selected: {selectedFile.name}</p>
              <p className="text-xs text-green-600">Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="importType" className="text-sm font-medium">
            File Type
          </Label>
          <Select value={importType} onValueChange={setImportType}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="template" className="text-sm font-medium">
            Use Template (Optional)
          </Label>
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="template1">Senior Software Engineer</SelectItem>
              <SelectItem value="template2">Marketing Manager</SelectItem>
              <SelectItem value="template3">Frontend Developer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="notes" className="text-sm font-medium">
          Notes (Optional)
        </Label>
        <Textarea id="notes" placeholder="Add any notes about this import..." rows={3} className="mt-1" />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="schedule" />
        <Label htmlFor="schedule" className="text-sm">
          Schedule for later
        </Label>
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button type="submit" disabled={!selectedFile || uploading} className="w-full sm:w-auto">
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Starting Import...
            </>
          ) : (
            "Start Import"
          )}
        </Button>
      </div>
    </form>
  )
}


