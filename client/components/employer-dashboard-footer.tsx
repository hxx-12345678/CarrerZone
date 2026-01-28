"use client"

import Link from "next/link"
import { Building2, Mail, Phone, MapPin, Globe, Linkedin, Facebook, Instagram, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export function EmployerDashboardFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="relative bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 border-t border-slate-600/40">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-blue-300/10 to-cyan-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-28 h-28 bg-gradient-to-br from-indigo-300/10 to-violet-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Employer Portal</h3>
                <p className="text-sm text-slate-300">Find the best talent for your company</p>
              </div>
            </div>
            <p className="text-slate-300 mb-3 max-w-md leading-relaxed">
              Connect with top talent and streamline your hiring process with our comprehensive employer dashboard. 
              Post jobs, manage applications, and grow your team with confidence.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-blue-400">
                <Linkedin className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-blue-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-blue-400">
                <Facebook className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-blue-400">
                <Instagram className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Quick Links</h4>
            <div className="space-y-3">
              <Link href="/employer-dashboard" className="block text-slate-300 hover:text-blue-400 transition-colors">
                Dashboard
              </Link>
              <Link href="/employer-dashboard/post-job" className="block text-slate-300 hover:text-blue-400 transition-colors">
                Post Job
              </Link>
              <Link href="/employer-dashboard/manage-jobs" className="block text-slate-300 hover:text-blue-400 transition-colors">
                Manage Jobs
              </Link>
              <Link href="/employer-dashboard/applications" className="block text-slate-300 hover:text-blue-400 transition-colors">
                Applications
              </Link>
              <Link href="/employer-dashboard/analytics" className="block text-slate-300 hover:text-blue-400 transition-colors">
                Analytics
              </Link>
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Support</h4>
            <div className="space-y-3">
              <Link href="/help" className="block text-slate-300 hover:text-blue-400 transition-colors">
                Help Center
              </Link>
              <Link href="/contact" className="block text-slate-300 hover:text-blue-400 transition-colors">
                Contact Us
              </Link>
              <Link href="/faqs" className="block text-slate-300 hover:text-blue-400 transition-colors">
                FAQs
              </Link>
              <Link href="/pricing" className="block text-slate-300 hover:text-blue-400 transition-colors">
                Pricing
              </Link>
              <Link href="/terms" className="block text-slate-300 hover:text-blue-400 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-6 pt-4 border-t border-slate-600/40">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-600/50 backdrop-blur-md border border-slate-500/30 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Email Support</p>
                <p className="text-sm text-slate-300">support@employerportal.com</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-600/50 backdrop-blur-md border border-slate-500/30 rounded-xl flex items-center justify-center">
                <Phone className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Phone Support</p>
                <p className="text-sm text-slate-300">+1 (555) 123-4567</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-600/50 backdrop-blur-md border border-slate-500/30 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Office</p>
                <p className="text-sm text-slate-300">New York, NY</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-4 pt-3 border-t border-slate-600/40 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-slate-300">
            <p>&copy; 2025 Employer Portal. All rights reserved.</p>
          </div>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-sm text-slate-300 hover:text-blue-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-slate-300 hover:text-blue-400 transition-colors">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-sm text-slate-300 hover:text-blue-400 transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-8 right-8 z-40"
      >
        <Button
          onClick={scrollToTop}
          size="sm"
          className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      </motion.div>
    </footer>
  )
}
