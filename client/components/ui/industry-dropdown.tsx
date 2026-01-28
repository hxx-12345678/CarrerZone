"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"

interface IndustryDropdownProps {
  selectedIndustries: string[]
  onIndustryChange: (industries: string[]) => void
  onClose: () => void
  hideSelectAllButtons?: boolean // New prop to hide Select All/Clear All buttons
}

// Function to remove numbers from industry names
const cleanIndustryName = (name: string) => {
  return name.replace(/\s*\(\d+\)\s*$/, '').trim()
}

// All industry categories extracted from ALL the images
const industryCategories = [
  // Page 1 - IT Services & Technology
  { category: "IT Services", industries: [
    "IT Services & Consulting (2378)"
  ]},
  { category: "Technology", industries: [
    "Software Product (532)",
    "Internet (246)",
    "Electronics Manufacturing (74)",
    "Electronic Components (61)",
    "Hardware & Networking (54)",
    "Emerging Technology (44)"
  ]},
  
  // Page 1 - Education
  { category: "Education", industries: [
    "Education / Training (297)",
    "E-Learning / EdTech (165)"
  ]},
  
  // Page 1 - Manufacturing & Production
  { category: "Manufacturing & Production", industries: [
    "Industrial Equipment (270)",
    "Auto Components (155)",
    "Chemicals (112)",
    "Building Material (74)",
    "Automobile (72)",
    "Electrical Equipment (70)",
    "Industrial Automation (52)",
    "Iron & Steel (38)",
    "Packaging & Containers (37)",
    "Metals & Mining (32)",
    "Petrochemical / Plastics (25)"
  ]},
  
  // Page 2 - Healthcare & Life Sciences
  { category: "Healthcare & Life Sciences", industries: [
    "Defence & Aerospace (22)",
    "Fertilizers / Pesticides (18)",
    "Pulp & Paper (7)",
    "Medical Services (264)",
    "Pharmaceutical & Life Sciences (252)",
    "Medical Devices (58)",
    "Biotechnology (40)",
    "Clinical Research (33)"
  ]},
  
  // Page 2 - Infrastructure, Transport & Real Estate
  { category: "Infrastructure, Transport & Real Estate", industries: [
    "Construction / Infrastructure (258)",
    "Real Estate (182)",
    "Logistics & Supply Chain (145)",
    "Shipping & Maritime (31)",
    "Aviation & Aerospace (22)",
    "Railways (17)"
  ]},
  
  // Page 2 - Financial Services
  { category: "Financial Services", industries: [
    "Banking / Lending (219)",
    "Insurance (156)",
    "Investment Banking / VC / PE (89)",
    "FinTech (76)",
    "Stock Broking / Trading (45)",
    "Mutual Funds / Asset Management (42)",
    "NBFC (35)",
    "Accounting / Audit (32)",
    "Wealth Management (28)"
  ]},
  
  // Page 3 - Consumer & Retail
  { category: "Consumer & Retail", industries: [
    "FMCG / Foods / Beverage (204)",
    "Retail (142)",
    "Textiles / Garments / Accessories (89)",
    "Consumer Electronics (67)",
    "Jewellery / Gems / Watches (45)",
    "Fashion & Lifestyle (38)",
    "Beauty & Personal Care (32)",
    "Sports & Fitness (28)",
    "Home & Garden (25)"
  ]},
  
  // Page 3 - Media & Entertainment
  { category: "Media & Entertainment", industries: [
    "Media / Entertainment / Broadcasting (156)",
    "Gaming (89)",
    "Advertising / Marketing / PR (78)",
    "Publishing (45)",
    "Events / Exhibitions (32)",
    "Animation / VFX (28)"
  ]},
  
  // Page 3 - Professional Services
  { category: "Professional Services", industries: [
    "Consulting (142)",
    "Legal Services (45)",
    "Recruitment / Staffing (38)",
    "Market Research (32)",
    "Market Research / Business Intelligence (28)"
  ]},
  
  // Page 4 - Energy & Utilities
  { category: "Energy & Utilities", industries: [
    "Power / Energy (89)",
    "Oil & Gas (67)",
    "Renewable Energy (45)",
    "Water Treatment / Waste Management (32)",
    "Telecom / ISP (28)"
  ]},
  
  // Page 4 - Government & Public Sector
  { category: "Government & Public Sector", industries: [
    "Government / PSU (78)",
    "NGO / Social Services (45)",
    "Defence / Security (32)",
    "Agriculture / Dairy (28)"
  ]},
  
  // Page 4 - Travel & Hospitality
  { category: "Travel & Hospitality", industries: [
    "Travel / Tourism (67)",
    "Hotels / Restaurants (45)",
    "Airlines (32)",
    "Food & Beverages (28)"
  ]},
  
  // Page 5 - E-commerce & Internet
  { category: "E-commerce & Internet", industries: [
    "E-commerce / Internet (156)",
    "Online Services (89)",
    "Marketplace (67)",
    "Food Tech (45)",
    "EdTech (38)",
    "HealthTech (32)",
    "PropTech (28)",
    "FinTech (25)",
    "Gaming (22)"
  ]},
  
  // Page 5 - BPO & KPO
  { category: "BPO & KPO", industries: [
    "BPO / KPO / LPO (142)",
    "Customer Service (89)",
    "Data Processing (67)",
    "Content Moderation (45)",
    "Back Office Operations (38)"
  ]},
  
  // Page 6 - Agriculture & Food
  { category: "Agriculture & Food", industries: [
    "Agriculture / Dairy (78)",
    "Food Processing (67)",
    "Fertilizers / Pesticides (45)",
    "Seeds (32)",
    "Farm Equipment (28)"
  ]},
  
  // Page 6 - Textiles & Fashion
  { category: "Textiles & Fashion", industries: [
    "Textiles / Garments / Accessories (89)",
    "Fashion & Lifestyle (67)",
    "Jewellery / Gems / Watches (45)",
    "Beauty & Personal Care (38)",
    "Footwear (32)"
  ]},
  
  // Page 7 - Chemicals & Pharmaceuticals
  { category: "Chemicals & Pharmaceuticals", industries: [
    "Chemicals (112)",
    "Pharmaceutical & Life Sciences (89)",
    "Petrochemical / Plastics (67)",
    "Fertilizers / Pesticides (45)",
    "Biotechnology (38)",
    "Medical Devices (32)"
  ]},
  
  // Page 7 - Automotive & Transportation
  { category: "Automotive & Transportation", industries: [
    "Automobile (72)",
    "Auto Components (67)",
    "Logistics & Supply Chain (45)",
    "Shipping & Maritime (38)",
    "Aviation & Aerospace (32)",
    "Railways (28)"
  ]},
  
  // Page 8 - Electronics & Hardware
  { category: "Electronics & Hardware", industries: [
    "Electronics Manufacturing (74)",
    "Electronic Components (61)",
    "Hardware & Networking (54)",
    "Consumer Electronics (45)",
    "Industrial Equipment (38)",
    "Electrical Equipment (32)"
  ]},
  
  // Page 8 - Construction & Real Estate
  { category: "Construction & Real Estate", industries: [
    "Construction / Infrastructure (89)",
    "Real Estate (67)",
    "Building Material (45)",
    "Architecture / Interior Design (38)",
    "Property Management (32)",
    "Infrastructure Development (28)"
  ]}
]

export default function IndustryDropdown({ selectedIndustries, onIndustryChange, onClose, hideSelectAllButtons = false }: IndustryDropdownProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [tempSelectedIndustries, setTempSelectedIndustries] = useState(selectedIndustries)

  // Filter categories based on search term
  const filteredCategories = industryCategories.filter(cat => {
    if (!searchTerm) return true
    return cat.industries.some(industry => 
      cleanIndustryName(industry).toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleCheckboxChange = (industryName: string, checked: boolean) => {
    const cleanName = cleanIndustryName(industryName)
    if (checked) {
      // Add clean name only (without numbers)
      const newSelections = [...tempSelectedIndustries]
      if (!newSelections.includes(cleanName) && !newSelections.includes(industryName)) {
        newSelections.push(cleanName) // Store clean name without count
      }
      setTempSelectedIndustries(newSelections)
    } else {
      // Remove both clean name and full name
      setTempSelectedIndustries(tempSelectedIndustries.filter(name => 
        name !== cleanName && name !== industryName
      ))
    }
  }

  const handleSelectAll = () => {
    const allIndustryNames = industryCategories.flatMap(cat => 
      cat.industries.map(industry => cleanIndustryName(industry)) // Store clean names without counts
    )
    setTempSelectedIndustries(allIndustryNames)
  }

  const handleClearAll = () => {
    setTempSelectedIndustries([])
  }

  const handleApply = () => {
    onIndustryChange(tempSelectedIndustries)
    onClose()
  }

  const handleCancel = () => {
    setTempSelectedIndustries(selectedIndustries)
    onClose()
  }

  const handleClose = () => {
    // When dialog is closed (by clicking X or outside), apply the current selections
    console.log('🏭 Industry - Applying selections on close:', tempSelectedIndustries)
    onIndustryChange(tempSelectedIndustries)
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={(open) => {
      if (!open) {
        handleClose()
      }
    }}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Select Industries</span>
            {tempSelectedIndustries.length > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {tempSelectedIndustries.length} selected
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search industries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Industry Categories */}
        <div 
          className="flex-1 overflow-y-auto px-6 custom-scrollbar"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 #f1f5f9',
            minHeight: '300px',
            maxHeight: '500px'
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
            {filteredCategories.map((categoryGroup, groupIndex) => (
              <div key={groupIndex} className="space-y-3">
                {/* Category Header */}
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-md sticky top-0 z-10">
                  {categoryGroup.category}
                </h4>
                <div 
                  className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e1 #f1f5f9'
                  }}
                >
                  {categoryGroup.industries.map((industry) => {
                    const cleanName = cleanIndustryName(industry)
                    return (
                      <div key={cleanName} className="flex items-start space-x-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors min-h-[48px]">
                        <Checkbox
                          id={`industry-${cleanName}`}
                          checked={tempSelectedIndustries.includes(cleanName) || tempSelectedIndustries.includes(industry)}
                          onCheckedChange={(checked) => handleCheckboxChange(industry, checked as boolean)}
                          className="mt-0.5"
                        />
                        <label
                          htmlFor={`industry-${cleanName}`}
                          className="text-sm font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700 dark:text-slate-300 cursor-pointer flex-1 break-words"
                        >
                          {cleanName}
                        </label>
                      </div>
                    )
                  })}
                </div>
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
              Apply {tempSelectedIndustries.length > 0 && `(${tempSelectedIndustries.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}