import UserManagementPage from "@/components/admin/UserManagementPage"
import { Globe } from "lucide-react"

export default function GulfPortalUsersPage() {
  return (
    <UserManagementPage
      portal="gulf"
      title="Gulf Portal Users"
      description="Manage users who access the Gulf job portal (Gulf region)"
      icon={<Globe className="w-8 h-8 mr-3" />}
    />
  )
}
