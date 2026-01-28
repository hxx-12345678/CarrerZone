import UserManagementPage from "@/components/admin/UserManagementPage"
import { Building2 } from "lucide-react"

export default function NormalPortalUsersPage() {
  return (
    <UserManagementPage
      portal="normal"
      title="Normal Portal Users"
      description="Manage users who access the normal job portal (India & Other regions)"
      icon={<Building2 className="w-8 h-8 mr-3" />}
    />
  )
}
