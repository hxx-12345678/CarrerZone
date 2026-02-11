"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmployerDashboardNavbar } from "@/components/employer-dashboard-navbar"
import { EmployerDashboardFooter } from "@/components/employer-dashboard-footer"

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex flex-col">
      <EmployerDashboardNavbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card className="shadow-lg border border-slate-200 bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-slate-900">Cookie Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700 leading-relaxed">
            <p>
              We use cookies and similar technologies to improve your experience, understand how our
              platform is used, and provide personalized content and features.
            </p>
            <p>
              Cookies help us keep you signed in, remember your preferences, and measure the
              performance of our product. You can control cookies through your browser settings, but
              disabling some cookies may affect certain features (like staying signed in).
            </p>
            <p>
              By continuing to use this site, you agree to our use of cookies as described in this
              policy and in our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
            </p>
          </CardContent>
        </Card>
      </main>
      <EmployerDashboardFooter />
    </div>
  )
}
