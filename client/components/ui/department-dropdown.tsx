"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"

interface DepartmentDropdownProps {
  selectedDepartments: string[]
  onDepartmentChange: (departments: string[]) => void
  onClose: () => void
  hideSelectAllButtons?: boolean // New prop to hide Select All/Clear All buttons
}

// All department categories from both images (names only, no numbers)
const departmentCategories = [
  // From first image
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
  
  // From second image
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
  "Shipping & Maritime"
]

export default function DepartmentDropdown({ selectedDepartments, onDepartmentChange, onClose, hideSelectAllButtons = false }: DepartmentDropdownProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [tempSelectedDepartments, setTempSelectedDepartments] = useState(selectedDepartments)

  // Filter departments based on search term
  const filteredDepartments = departmentCategories.filter(dept =>
    dept.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCheckboxChange = (department: string, checked: boolean) => {
    if (checked) {
      setTempSelectedDepartments([...tempSelectedDepartments, department])
    } else {
      setTempSelectedDepartments(tempSelectedDepartments.filter(d => d !== department))
    }
  }

  const handleSelectAll = () => {
    setTempSelectedDepartments([...departmentCategories])
  }

  const handleClearAll = () => {
    setTempSelectedDepartments([])
  }

  const handleApply = () => {
    onDepartmentChange(tempSelectedDepartments)
    onClose()
  }

  const handleCancel = () => {
    setTempSelectedDepartments(selectedDepartments)
    onClose()
  }

  const handleClose = () => {
    // When dialog is closed (by clicking X or outside), apply the current selections
    console.log('🏢 Department - Applying selections on close:', tempSelectedDepartments)
    onDepartmentChange(tempSelectedDepartments)
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={(open) => {
      if (!open) {
        handleClose()
      }
    }}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Select Departments</span>
            {tempSelectedDepartments.length > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {tempSelectedDepartments.length} selected
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Department List */}
        <div 
          className="flex-1 overflow-y-auto px-6 custom-scrollbar"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 #f1f5f9',
            minHeight: '300px',
            maxHeight: '500px'
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pb-6">
            {filteredDepartments.map((department) => (
              <div key={department} className="flex items-start space-x-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors min-h-[48px]">
                <Checkbox
                  id={`department-${department}`}
                  checked={tempSelectedDepartments.includes(department)}
                  onCheckedChange={(checked) => handleCheckboxChange(department, checked as boolean)}
                  className="mt-0.5"
                />
                <label
                  htmlFor={`department-${department}`}
                  className="text-sm font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700 dark:text-slate-300 cursor-pointer flex-1 break-words"
                >
                  {department}
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
              Apply {tempSelectedDepartments.length > 0 && `(${tempSelectedDepartments.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}