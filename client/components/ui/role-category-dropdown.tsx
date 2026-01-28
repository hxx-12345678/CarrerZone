"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"

interface RoleCategoryDropdownProps {
  selectedRoles: string[]
  onRoleChange: (roles: string[]) => void
  onClose: () => void
  hideSelectAllButtons?: boolean // New prop to hide Select All/Clear All buttons
}

// All role categories extracted from the images + department data merged
const roleCategories = [
  // Department categories (merged from department dropdown)
  "Engineering - Software & QA",
  "Sales & Business Development",
  "Customer Success, Service & Operations",
  "Finance & Accounting",
  "Production, Manufacturing & Maintenance",
  "BFSI, Investments & Trading",
  "Human Resources",
  "IT & Information Security",
  "Marketing & Communication",
  "Consulting",
  "Data Science & Analytics",
  "Healthcare & Life Sciences",
  "Procurement & Supply Chain",
  "Engineering - Hardware & Networks",
  "Other",
  "Project & Program Management",
  "Construction & Site Engineering",
  "UX, Design & Architecture",
  "Teaching & Training",
  "Administration & Facilities",
  "Quality Assurance",
  "Food, Beverage & Hospitality",
  "Research & Development",
  "Content, Editorial & Journalism",
  "Product Management",
  "Legal & Regulatory",
  "Merchandising, Retail & eCommerce",
  "Risk Management & Compliance",
  "Strategic & Top Management",
  "Media Production & Entertainment",
  "Environment Health & Safety",
  "Security Services",
  "Sports, Fitness & Personal Care",
  "Aviation & Aerospace",
  "CSR & Social Service",
  "Energy & Mining",
  "Shipping & Maritime",
  // Original role categories (numbers removed)
  "Software Development",
  "Retail & B2C Sales",
  "BD / Pre Sales",
  "Enterprise & B2B Sales",
  "Voice / Blended",
  "Quality Assurance and Testing",
  "Accounting & Taxation",
  "IT Consulting",
  "Engineering",
  "DBA / Data warehousing",
  "Recruitment & Talent Acquisition",
  "Finance",
  "Customer Success, Service",
  "Construction Engineering",
  "Business Intelligence & Analytics",
  "Operations, Maintenance",
  "IT Network",
  "Operations",
  "Customer Success",
  "HR Operations",
  "DevOps",
  "Marketing",
  "Doctor",
  "Administration",
  "Sales Support & Operations",
  "Digital Marketing",
  "Data Science & Machine Learning",
  "Banking Operations",
  "Non Voice",
  "IT Support",
  "IT Infrastructure Services",
  "IT Security",
  "Procurement & Purchase",
  "Life Insurance",
  "Other Program / Project Management",
  "Finance & Accounting - Other",
  "Other Design",
  "SCM & Logistics",
  "Production & Manufacturing",
  "Lending",
  "Content Management (Print)",
  "Engineering & Manufacturing",
  "Architecture & Interior Design",
  "Technology / IT",
  "Health Informatics",
  "Trading, Asset & Wealth Management",
  "Human Resources - Other",
  "General Insurance",
  "Operations Support",
  "Management Consulting",
  "Business Process Quality",
  "Other Consulting",
  "Quality Assurance - Other",
  "Back Office",
  "Management",
  "Facility Management",
  "Product Management - Technology",
  "Kitchen / F&B Production",
  "Advertising & Creative",
  "Corporate Training",
  "Treasury",
  "Pharmaceutical & Biotechnology",
  "Audit & Control",
  "Hardware",
  "Stores & Material Management",
  "Front Office & Guest Services",
  "Teaching & Training - Other",
  "After Sales Service & Repair",
  "Other Hospital Staff",
  "Nursing",
  "Corporate Communication",
  "F&B Service",
  "Subject / Specialization Teaching",
  "UI / UX",
  "Investment Banking, Private Equity",
  "Employee Relations",
  "Retail Store Operations",
  "Construction / Manufacturing",
  "University Level Educator",
  "Administration & Staff",
  "Marketing and Communications",
  "Legal Operations",
  "Legal & Regulatory - Other",
  "Top Management",
  "Product Management - Other",
  "Security Officer",
  "Corporate Affairs",
  "Strategic Management",
  "Preschool & Primary Education",
  "Editing",
  "Environment Health and Safety",
  "Service Delivery",
  "Compensation & Benefits",
  "Merchandising & Planning",
  "Tourism Services",
  "Editing (Print / Online / Electronic)",
  "Imaging & Diagnostics",
  "Import & Export",
  "Language Teacher",
  "Housekeeping & Laundry",
  "Telecom",
  "Payroll & Transactions",
  "Occupational Health & Safety",
  "eCommerce Operations",
  "HR Business Advisory",
  "Hardware and Networks - Other",
  "Surveying",
  "Fashion & Accessories",
  "Market Research & Insights",
  "Security / Fraud",
  "Health & Fitness",
  "Life Skills / ECA Teacher",
  "Community Health & Safety",
  "Assessment / Advisory",
  "Artists",
  "Category Management & Operations",
  "Beauty & Personal Care",
  "CSR & Sustainability",
  "Operations / Strategy",
  "Events & Banquet",
  "Flight & Airport Operations",
  "Security Services - Other",
  "Business",
  "Animation / Effects",
  "Recruitment Marketing & Branding",
  "Production",
  "Direction",
  "Treasury & Forex",
  "Aviation & Aerospace - Other",
  "Social & Public Service",
  "Mining",
  "Power Generation",
  "Port & Maritime Operations",
  "Journalism",
  "Energy & Mining - Other",
  "Airline Services",
  "Shipping & Maritime - Other",
  "Aviation Engineering",
  "Power Supply and Distribution",
  "Sound / Light / Technical Support",
  "Sports Staff and Management",
  "Upstream",
  "Shipping Engineering & Technology",
  "Pilot",
  "Downstream"
]

export default function RoleCategoryDropdown({ selectedRoles, onRoleChange, onClose, hideSelectAllButtons = false }: RoleCategoryDropdownProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [tempSelectedRoles, setTempSelectedRoles] = useState(selectedRoles)

  // Filter roles based on search term
  const filteredRoles = roleCategories.filter(role =>
    role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCheckboxChange = (role: string, checked: boolean) => {
    if (checked) {
      setTempSelectedRoles([...tempSelectedRoles, role])
    } else {
      setTempSelectedRoles(tempSelectedRoles.filter(r => r !== role))
    }
  }

  const handleSelectAll = () => {
    setTempSelectedRoles([...roleCategories])
  }

  const handleClearAll = () => {
    setTempSelectedRoles([])
  }

  const handleApply = () => {
    onRoleChange(tempSelectedRoles)
    onClose()
  }

  const handleCancel = () => {
    setTempSelectedRoles(selectedRoles)
    onClose()
  }

  const handleClose = () => {
    // When dialog is closed (by clicking X or outside), apply the current selections
    console.log('🎯 Role Category - Applying selections on close:', tempSelectedRoles)
    onRoleChange(tempSelectedRoles)
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={(open) => {
      if (!open) {
        handleClose()
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Select Role Categories</span>
            {tempSelectedRoles.length > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {tempSelectedRoles.length} selected
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search role categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Role Categories */}
        <div 
          className="flex-1 overflow-y-auto px-6 custom-scrollbar"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 #f1f5f9',
            minHeight: '300px',
            maxHeight: '500px'
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pb-6">
            {filteredRoles.map((role) => (
              <div key={role} className="flex items-start space-x-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors min-h-[48px]">
                <Checkbox
                  id={`role-${role}`}
                  checked={tempSelectedRoles.includes(role)}
                  onCheckedChange={(checked) => handleCheckboxChange(role, checked as boolean)}
                  className="mt-0.5"
                />
                <label
                  htmlFor={`role-${role}`}
                  className="text-sm font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700 dark:text-slate-300 cursor-pointer flex-1 break-words"
                >
                  {role}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700">
          {!hideSelectAllButtons && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                Clear All
              </Button>
            </div>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleApply} className="bg-blue-600 hover:bg-blue-700">
              Apply {tempSelectedRoles.length > 0 && `(${tempSelectedRoles.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}