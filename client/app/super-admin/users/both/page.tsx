import UserManagementPage from "@/components/admin/UserManagementPage"
import { Users } from "lucide-react"

export default function BothPortalsUsersPage() {
  return (
    <UserManagementPage
      portal="both"
      title="Both Portals Users"
      description="Manage users who can access both normal and Gulf job portals"
      icon={<Users className="w-8 h-8 mr-3" />}
    />
  )
}
