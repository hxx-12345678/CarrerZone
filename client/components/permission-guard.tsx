"use client"

import { useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { ShieldAlert } from "lucide-react"

interface PermissionGuardProps {
    children: ReactNode
    permission: string
    redirectTo?: string
}

export function PermissionGuard({
    children,
    permission,
    redirectTo = "/employer-dashboard"
}: PermissionGuardProps) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && user) {
            // Admins and Superadmins have all permissions
            if (user.userType === 'admin' || user.userType === 'superadmin') {
                return
            }

            // Check granular permission
            const hasPermission = user.permissions?.[permission] === true

            if (!hasPermission) {
                console.log(`🚫 PermissionGuard: Access denied for ${permission}`)
                toast.error(`Access Denied`, {
                    description: `You do not have the required permission: ${permission}. Redirecting you...`,
                    icon: <ShieldAlert className="w-5 h-5 text-red-500" />,
                    duration: 5000,
                })
                router.push(redirectTo)
            }
        }
    }, [user, loading, permission, router, redirectTo])

    if (loading) {
        return null // Or a loading spinner
    }

    // Determine if user has access to render children immediately (to avoid flickers)
    const hasAccess = user && (
        user.userType === 'admin' ||
        user.userType === 'superadmin' ||
        user.permissions?.[permission] === true
    )

    if (!hasAccess && !loading) {
        return null // Will redirect in useEffect
    }

    return <>{children}</>
}
