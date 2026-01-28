import JobManagementPage from "@/components/admin/JobManagementPage"
import { MapPin } from "lucide-react"

export default function IndiaJobsPage() {
  return (
    <JobManagementPage
      portal="normal"
      title="India Jobs"
      description="Manage jobs posted in India region"
      icon={<MapPin className="w-8 h-8 mr-3" />}
    />
  )
}