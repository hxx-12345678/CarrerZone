import CompanyManagementPage from "@/components/admin/CompanyManagementPage"
import { MapPin } from "lucide-react"

export default function IndiaCompaniesPage() {
  return (
    <CompanyManagementPage
      portal="normal"
      title="India Companies"
      description="Manage companies operating in India"
      icon={<MapPin className="w-8 h-8 mr-3" />}
    />
  )
}