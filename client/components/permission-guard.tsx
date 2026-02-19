"use client"

import { useEffect, ReactNode, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { ShieldAlert, ArrowLeft, Home, Lock } from "lucide-react"

/**
 * Human-readable labels for each permission key.
 * Used in the access-denied UI so the user sees "Job Posting" instead of "jobPosting".
 */
const PERMISSION_LABELS: Record<string, string> = {
    jobPosting: "Job Posting",
    resumeDatabase: "Resume Database / Requirements",
    analytics: "Analytics",
    featuredJobs: "Featured Jobs",
    hotVacancies: "Hot Vacancies",
    applications: "Applications & Interviews",
    settings: "Settings",
    agencyClients: "Agency Clients",
}

interface PermissionGuardProps {
    children: ReactNode
    permission: string
    redirectTo?: string
    /** If true, silently hide instead of showing Access Denied UI */
    silent?: boolean
}

export function PermissionGuard({
    children,
    permission,
    redirectTo = "/employer-dashboard",
    silent = false,
}: PermissionGuardProps) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [denied, setDenied] = useState(false)

    const label = PERMISSION_LABELS[permission] || permission

    useEffect(() => {
        if (!loading && user) {
            // Admins and Superadmins bypass all
            if (user.userType === 'admin' || user.userType === 'superadmin') {
                return
            }

            const hasPermission = user.permissions?.[permission] === true

            if (!hasPermission) {
                setDenied(true)
                console.log(`🚫 PermissionGuard: Access denied for ${permission}`)
                if (!silent) {
                    toast.error(`Access Denied`, {
                        description: `You do not have the "${label}" permission. Contact your admin to request access.`,
                        icon: <ShieldAlert className="w-5 h-5 text-red-500" />,
                        duration: 5000,
                    })
                }
            }
        }
    }, [user, loading, permission, silent, label, router, redirectTo])

    if (loading) {
        return null
    }

    const hasAccess = !!user && (
        user.userType === 'superadmin' ||
        user.userType === 'admin' ||
        user.permissions?.[permission] === true
    )

    if (!hasAccess) {
        if (silent) {
            return null
        }

        // Show Access Denied UI
        return (
            <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-lg">
                    {/* Access Denied Card */}
                    <div className="rounded-2xl border border-red-100 bg-white shadow-lg overflow-hidden">
                        {/* Header banner */}
                        <div className="bg-gradient-to-r from-red-500 to-rose-500 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                                    <Lock className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Access Restricted</h2>
                                    <p className="text-sm text-red-100">Permission required</p>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-6 space-y-4">
                            <div className="rounded-lg bg-red-50 border border-red-100 p-4">
                                <div className="flex items-start gap-3">
                                    <ShieldAlert className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-red-800">
                                            You don&apos;t have the <span className="font-bold">&quot;{label}&quot;</span> permission
                                        </p>
                                        <p className="mt-1 text-sm text-red-600">
                                            Your admin has not granted you access to this feature. Please contact your team administrator to request this permission.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-xs text-slate-400 text-center">
                                Permission key: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{permission}</code>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    onClick={() => router.back()}
                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Go Back
                                </button>
                                <button
                                    onClick={() => router.push(redirectTo)}
                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
                                >
                                    <Home className="h-4 w-4" />
                                    Go to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
