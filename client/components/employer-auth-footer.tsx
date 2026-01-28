"use client"

import Link from "next/link"
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  ExternalLink,
  Shield,
  Award,
  Users,
  TrendingUp
} from "lucide-react"
import { Separator } from "@/components/ui/separator"

export default function EmployerAuthFooter() {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-6 sm:py-8 px-4 sm:px-6 lg:px-8 border-t border-slate-700">
      <div className="max-w-7xl mx-auto">
        {/* Top Section - Trust Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 pb-6 border-b border-slate-700">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">50K+</div>
            <div className="text-sm text-slate-400">Companies Hiring</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">50M+</div>
            <div className="text-sm text-slate-400">Active Job Seekers</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">#1</div>
            <div className="text-sm text-slate-400">Job Portal in India</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-amber-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">100%</div>
            <div className="text-sm text-slate-400">Secure Platform</div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-6">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">JobPortal</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              India's most trusted job portal connecting employers with top talent. 
              Post jobs, access our database, and leverage AI-powered tools to find the perfect candidates.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-slate-300">
                <Phone className="w-4 h-4 text-blue-400" />
                <span>1800-102-2558 (Toll-free)</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-300">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>employers@jobportal.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-300">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>Bangalore, Karnataka, India</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-3 mt-6">
              <a href="#" className="w-8 h-8 bg-slate-800 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-slate-800 hover:bg-blue-400 rounded-full flex items-center justify-center transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-slate-800 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-slate-800 hover:bg-pink-600 rounded-full flex items-center justify-center transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-slate-800 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* For Employers */}
          <div>
            <h3 className="font-semibold mb-4 text-white">For Employers</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link href="/employer-dashboard/post-job" className="hover:text-blue-400 transition-colors flex items-center">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link href="/employer-dashboard/pricing" className="hover:text-blue-400 transition-colors flex items-center">
                  Job Posting Plans
                </Link>
              </li>
              <li>
                <Link href="/employer-dashboard/database-pricing" className="hover:text-blue-400 transition-colors flex items-center">
                  Resume Database
                </Link>
              </li>
              <li>
                <Link href="/employer-dashboard/manage-jobs" className="hover:text-blue-400 transition-colors flex items-center">
                  Manage Jobs
                </Link>
              </li>
              <li>
                <Link href="/employer-dashboard/requirements" className="hover:text-blue-400 transition-colors flex items-center">
                  Search Candidates
                </Link>
              </li>
              <li>
                <Link href="/employer-register" className="hover:text-blue-400 transition-colors flex items-center">
                  Employer Registration
                </Link>
              </li>
            </ul>
          </div>

          {/* Integrations & Tools */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Integrations</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <div className="hover:text-blue-400 transition-colors flex items-center cursor-pointer">
                  TalentPulse
                  <ExternalLink className="w-3 h-3 ml-1" />
                </div>
                <span className="text-xs text-slate-500">Candidate Screening</span>
              </li>
              <li>
                <div className="hover:text-purple-400 transition-colors flex items-center cursor-pointer mt-2">
                  RecruitBridge
                  <ExternalLink className="w-3 h-3 ml-1" />
                </div>
                <span className="text-xs text-slate-500">ATS Platform</span>
              </li>
              <li className="pt-2">
                <Link href="/employer-resources" className="hover:text-blue-400 transition-colors">
                  Employer Resources
                </Link>
              </li>
              <li>
                <Link href="/recruitment-solutions" className="hover:text-blue-400 transition-colors">
                  Recruitment Solutions
                </Link>
              </li>
              <li>
                <Link href="/naukri-talent-cloud" className="hover:text-blue-400 transition-colors">
                  Talent Cloud
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Support & Legal</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link href="/help" className="hover:text-blue-400 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="hover:text-blue-400 transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-400 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-blue-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/trust-safety" className="hover:text-blue-400 transition-colors">
                  Trust & Safety
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <Separator className="bg-slate-700 mb-4" />
        
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-slate-400 text-center md:text-left">
            <p>© 2025 JobPortal. All rights reserved. Made with ❤️ in India</p>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-slate-400">
            <div className="flex items-center space-x-1">
              <Shield className="w-3 h-3 text-green-400" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center space-x-1">
              <Award className="w-3 h-3 text-blue-400" />
              <span>ISO Certified</span>
            </div>
            <div className="flex items-center space-x-1">
              <Building2 className="w-3 h-3 text-purple-400" />
              <span>Trusted Platform</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

