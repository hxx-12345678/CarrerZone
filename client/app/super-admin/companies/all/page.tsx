import CompanyManagementPage from "@/components/admin/CompanyManagementPage"
import { Building2 } from "lucide-react"

export default function AllCompaniesPage() {
  return (
    <CompanyManagementPage
      portal="all"
      title="All Companies"
      description="Manage all companies across the platform"
      icon={<Building2 className="w-8 h-8 mr-3" />}
    />
  )
}
