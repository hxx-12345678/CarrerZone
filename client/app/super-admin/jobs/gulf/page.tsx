import JobManagementPage from "@/components/admin/JobManagementPage"
import { Globe } from "lucide-react"

export default function GulfJobsPage() {
  return (
    <JobManagementPage
      portal="gulf"
      title="Gulf Jobs"
      description="Manage jobs posted in Gulf region"
      icon={<Globe className="w-8 h-8 mr-3" />}
    />
  )
}