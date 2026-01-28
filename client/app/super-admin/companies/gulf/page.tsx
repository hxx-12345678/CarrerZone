import CompanyManagementPage from "@/components/admin/CompanyManagementPage"
import { Globe } from "lucide-react"

export default function GulfCompaniesPage() {
  return (
    <CompanyManagementPage
      portal="gulf"
      title="Gulf Companies"
      description="Manage companies operating in Gulf region"
      icon={<Globe className="w-8 h-8 mr-3" />}
    />
  )
}