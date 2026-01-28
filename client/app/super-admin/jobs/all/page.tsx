import JobManagementPage from "@/components/admin/JobManagementPage"
import { Briefcase } from "lucide-react"

export default function AllJobsPage() {
  return (
    <JobManagementPage
      portal="all"
      title="All Jobs"
      description="Manage all jobs across the platform"
      icon={<Briefcase className="w-8 h-8 mr-3" />}
    />
  )
}