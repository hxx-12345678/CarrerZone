"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"

export default function GulfRequirementsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to Gulf Manage Requirements page
    router.replace('/gulf-dashboard/manage-requirements')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Navbar />
      <div className="pt-24 text-center px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">Redirecting…</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Taking you to Gulf Manage Requirements. If you are not redirected,{' '}
            <a href="/gulf-dashboard/manage-requirements" className="text-blue-600 hover:underline">click here</a>.
          </p>
        </div>
      </div>
    </div>
  )
}


