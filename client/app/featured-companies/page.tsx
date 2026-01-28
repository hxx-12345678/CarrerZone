"use client"

import { useState, useRef, useEffect } from "react"
import {
  Search,
  MapPin,
  Users,
  Star,
  Building2,
  TrendingUp,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  Heart,
  Briefcase,
  ChevronLeft,
  Sparkles,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import Link from "next/link"

export default function FeaturedCompaniesPage() {
  const [showFilters, setShowFilters] = useState(false)
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isStickyVisible, setIsStickyVisible] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const getSectorColor = (sector: string) => {
    const colors = {
      technology: {
        bg: "from-blue-500 to-cyan-500",
        text: "text-blue-600",
        border: "border-blue-200",
        light: "bg-blue-50 dark:bg-blue-900/20",
        ring: "ring-blue-500",
        hover: "hover:from-blue-600 hover:to-cyan-600",
        glow: "shadow-blue-500/25",
      },
      finance: {
        bg: "from-green-500 to-emerald-500",
        text: "text-green-600",
        border: "border-green-200",
        light: "bg-green-50 dark:bg-green-900/20",
        ring: "ring-green-500",
        hover: "hover:from-green-600 hover:to-emerald-600",
        glow: "shadow-green-500/25",
      },
      automotive: {
        bg: "from-orange-500 to-red-500",
        text: "text-orange-600",
        border: "border-orange-200",
        light: "bg-orange-50 dark:bg-orange-900/20",
        ring: "ring-orange-500",
        hover: "hover:from-orange-600 hover:to-red-600",
        glow: "shadow-orange-500/25",
      },
      healthcare: {
        bg: "from-teal-500 to-cyan-500",
        text: "text-teal-600",
        border: "border-teal-200",
        light: "bg-teal-50 dark:bg-teal-900/20",
        ring: "ring-teal-500",
        hover: "hover:from-teal-600 hover:to-cyan-600",
        glow: "shadow-teal-500/25",
      },
      energy: {
        bg: "from-purple-500 to-pink-500",
        text: "text-purple-600",
        border: "border-purple-200",
        light: "bg-purple-50 dark:bg-purple-900/20",
        ring: "ring-purple-500",
        hover: "hover:from-purple-600 hover:to-pink-600",
        glow: "shadow-purple-500/25",
      },
      consulting: {
        bg: "from-indigo-500 to-purple-500",
        text: "text-indigo-600",
        border: "border-indigo-200",
        light: "bg-indigo-50 dark:bg-indigo-900/20",
        ring: "ring-indigo-500",
        hover: "hover:from-indigo-600 hover:to-purple-600",
        glow: "shadow-indigo-500/25",
      },
      ecommerce: {
        bg: "from-yellow-500 to-orange-500",
        text: "text-yellow-600",
        border: "border-yellow-200",
        light: "bg-yellow-50 dark:bg-yellow-900/20",
        ring: "ring-yellow-500",
        hover: "hover:from-yellow-600 hover:to-orange-600",
        glow: "shadow-yellow-500/25",
      },
      fintech: {
        bg: "from-blue-500 to-green-500",
        text: "text-blue-600",
        border: "border-blue-200",
        light: "bg-blue-50 dark:bg-blue-900/20",
        ring: "ring-blue-500",
        hover: "hover:from-blue-600 hover:to-green-600",
        glow: "shadow-blue-500/25",
      },
    }
    return colors[sector as keyof typeof colors] || colors.technology
  }

  const industryTypes = [
    { name: "Technology", count: "45+ Companies", sector: "technology" },
    { name: "Finance", count: "32+ Companies", sector: "finance" },
    { name: "Healthcare", count: "28+ Companies", sector: "healthcare" },
    { name: "E-commerce", count: "25+ Companies", sector: "ecommerce" },
    { name: "Fintech", count: "22+ Companies", sector: "fintech" },
    { name: "Consulting", count: "18+ Companies", sector: "consulting" },
    { name: "Automotive", count: "15+ Companies", sector: "automotive" },
    { name: "Energy", count: "12+ Companies", sector: "energy" },
  ]

  // Scroll event listener for sticky search bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setIsStickyVisible(scrollY > 200)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Generate featured companies
  const generateFeaturedCompanies = () => {
    const companies = []
    const sectors = [
      "technology",
      "finance",
      "healthcare",
      "ecommerce",
      "fintech",
      "consulting",
      "automotive",
      "energy",
    ]
    const locations = ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai", "Gurgaon", "Noida"]
    const companyNames = [
      "Microsoft India",
      "Google India",
      "Amazon",
      "Flipkart",
      "Paytm",
      "Zomato",
      "Swiggy",
      "HDFC Bank",
      "ICICI Bank",
      "TCS",
      "Infosys",
      "Wipro",
      "Accenture",
      "Deloitte",
      "PwC",
      "EY",
      "KPMG",
      "McKinsey",
      "BCG",
      "Bain & Company",
      "Goldman Sachs",
      "JP Morgan",
      "Morgan Stanley",
      "Citibank",
      "Standard Chartered",
      "Apollo Hospitals",
      "Fortis Healthcare",
      "Max Healthcare",
      "Manipal Hospitals",
      "Narayana Health",
      "Tata Motors",
      "Mahindra",
      "Bajaj Auto",
      "Hero MotoCorp",
      "Maruti Suzuki",
      "Hyundai",
      "Honda",
      "Reliance Industries",
      "ONGC",
      "Indian Oil",
      "BPCL",
      "HPCL",
      "Adani Group",
      "JSW Group",
      "Vedanta",
    ]

    for (let i = 0; i < 50; i++) {
      const randomSector = sectors[Math.floor(Math.random() * sectors.length)]
      const randomLocation = locations[Math.floor(Math.random() * locations.length)]
      const randomName = companyNames[Math.floor(Math.random() * companyNames.length)]

      companies.push({
        id: i + 1,
        name: `${randomName}${i > 0 ? ` ${i}` : ""}`,
        logo: "/placeholder.svg?height=80&width=80",
        industry: randomSector.charAt(0).toUpperCase() + randomSector.slice(1),
        sector: randomSector,
        location: randomLocation,
        employees: ["1000-5000", "5000-10000", "10000+"][Math.floor(Math.random() * 3)],
        rating: Number((4.0 + Math.random() * 1.0).toFixed(1)),
        reviews: Math.floor(Math.random() * 3000) + 500,
        openings: Math.floor(Math.random() * 200) + 50,
        description: `Leading ${randomSector} company with premium partnership benefits and exclusive opportunities.`,
        founded: String(1990 + Math.floor(Math.random() * 30)),
        website: `${randomName.toLowerCase().replace(/\s+/g, "")}.com`,
        benefits: [
          "Premium Health Insurance",
          "Stock Options",
          "Flexible Work",
          "Learning Budget",
          "Wellness Programs",
        ],
        featured: true,
        salaryRange: `${Math.floor(Math.random() * 15) + 10}-${Math.floor(Math.random() * 25) + 25} LPA`,
        workCulture: ["Innovation-driven", "Collaborative", "Fast-paced", "Employee-centric"][
          Math.floor(Math.random() * 4)
        ],
        companyType: "Premium Partner",
        urgent: Math.random() > 0.7,
        isPremium: true,
      })
    }

    return companies
  }

  const featuredCompanies = generateFeaturedCompanies()
  const totalCompanies = featuredCompanies.length

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" })
    }
  }

  const industries = [
    "Technology",
    "Fintech",
    "Healthcare",
    "E-commerce",
    "Manufacturing",
    "Automotive",
    "Banking & Finance",
    "Consulting",
    "Energy & Petrochemicals",
    "Pharmaceuticals",
  ]

  const companySizes = ["1000-5000 employees", "5000-10000 employees", "10000+ employees"]

  const locations = [
    "Bangalore",
    "Mumbai",
    "Delhi",
    "Hyderabad",
    "Pune",
    "Chennai",
    "Gurgaon",
    "Noida",
    "Kolkata",
    "Ahmedabad",
    "Kochi",
    "Indore",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-x-hidden">
      <Navbar />

      {/* Header */}
      <div className="pt-20 pb-8 bg-gradient-to-r from-purple-600/90 via-pink-600/90 to-indigo-600/90 backdrop-blur-xl shadow-sm border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6 sm:mb-8"
          >
            <div className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-white/20 rounded-full text-white text-xs sm:text-sm font-medium mb-4">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Premium Partners Only
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-4">Featured Companies</h1>
            <p className="text-lg sm:text-xl text-white/90">
              Discover exclusive opportunities with our premium partner companies
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col lg:flex-row gap-4"
          >
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                <Input
                  placeholder="Company name or industry"
                  className="pl-10 sm:pl-12 h-10 sm:h-12 border-white/20 focus:border-white/40 bg-white/20 backdrop-blur-sm text-white placeholder:text-white/70 text-sm sm:text-base"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                <Input
                  placeholder="Location"
                  className="pl-10 sm:pl-12 h-10 sm:h-12 border-white/20 focus:border-white/40 bg-white/20 backdrop-blur-sm text-white placeholder:text-white/70 text-sm sm:text-base"
                />
              </div>
              <Button className="h-10 sm:h-12 bg-white text-purple-600 hover:bg-white/90 shadow-lg text-sm sm:text-base font-semibold">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Search
              </Button>
            </div>
            <Button
              variant="outline"
              className="lg:hidden bg-white/20 border-white/30 text-white hover:bg-white/30"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Filters
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Sticky Search Bar - Appears on scroll */}
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ 
          opacity: isStickyVisible ? 1 : 0, 
          y: isStickyVisible ? 0 : -100 
        }}
        transition={{ duration: 0.3 }}
        className={`fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 shadow-lg transform transition-all duration-300 ${
          isStickyVisible ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Company name or industry"
                  className="pl-10 h-12 border-slate-200 dark:border-slate-600 focus:border-blue-500 bg-white dark:bg-slate-700 rounded-xl text-sm"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Location"
                  className="pl-10 h-12 border-slate-200 dark:border-slate-600 focus:border-blue-500 bg-white dark:bg-slate-700 rounded-xl text-sm"
                />
              </div>
              <Button className="h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg text-sm font-semibold">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
            <Button
              variant="outline"
              className="lg:hidden bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-600 h-12"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Industry Type Filters */}
      <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Premium Partner Companies</h2>
            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Showing {totalCompanies} featured companies
            </span>
          </div>

          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-xl border-0 hover:scale-110 transition-all duration-300 hidden sm:flex"
              onClick={scrollLeft}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div
              ref={scrollRef}
              className="flex space-x-4 sm:space-x-6 overflow-x-auto scrollbar-hide pb-4 px-0 sm:px-12"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {industryTypes.map((type, index) => {
                const sectorColors = getSectorColor(type.sector)
                const isSelected = selectedIndustry === type.name
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`min-w-[200px] sm:min-w-[240px] cursor-pointer transition-all duration-500 border-0 group ${
                        isSelected
                          ? `${sectorColors.light} ring-2 ${sectorColors.ring} shadow-2xl ${sectorColors.glow}`
                          : "bg-white/80 dark:bg-slate-800/80 hover:shadow-2xl hover:shadow-purple-500/10"
                      } backdrop-blur-xl overflow-hidden relative`}
                      onClick={() => setSelectedIndustry(isSelected ? null : type.name)}
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${sectorColors.bg} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                      />
                      <CardContent className="p-4 sm:p-6 text-center relative z-10">
                        <div className="mb-3 sm:mb-4">
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-2xl bg-gradient-to-br ${sectorColors.bg} flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                          >
                            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                        </div>
                        <h3
                          className={`font-bold text-base sm:text-lg mb-2 ${isSelected ? sectorColors.text : "text-slate-900 dark:text-white group-hover:" + sectorColors.text} transition-colors duration-300`}
                        >
                          {type.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-3 sm:mb-4">
                          {type.count}
                        </p>
                        <div
                          className={`w-full h-1.5 sm:h-2 rounded-full bg-gradient-to-r ${sectorColors.bg} ${isSelected ? "opacity-100" : "opacity-30 group-hover:opacity-70"} transition-all duration-300`}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-xl border-0 hover:scale-110 transition-all duration-300 hidden sm:flex"
              onClick={scrollRight}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex gap-6 sm:gap-8">
          {/* Sticky Filters Sidebar */}
          <div className={`w-full lg:w-80 ${showFilters ? "block" : "hidden lg:block"}`}>
            <div className="sticky top-24">
              <Card className="border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <Filter className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Premium Filters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 sm:space-y-6">
                    {/* Industry */}
                    <div>
                      <h3 className="font-semibold mb-3 text-sm sm:text-base text-slate-900 dark:text-white">
                        Industry
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {industries.map((industry) => (
                          <div key={industry} className="flex items-center space-x-2">
                            <Checkbox id={industry} />
                            <label
                              htmlFor={industry}
                              className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                            >
                              {industry}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-slate-200 dark:bg-slate-700" />

                    {/* Company Size */}
                    <div>
                      <h3 className="font-semibold mb-3 text-sm sm:text-base text-slate-900 dark:text-white">
                        Company Size
                      </h3>
                      <div className="space-y-2">
                        {companySizes.map((size) => (
                          <div key={size} className="flex items-center space-x-2">
                            <Checkbox id={size} />
                            <label
                              htmlFor={size}
                              className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                            >
                              {size}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-slate-200 dark:bg-slate-700" />

                    {/* Location */}
                    <div>
                      <h3 className="font-semibold mb-3 text-sm sm:text-base text-slate-900 dark:text-white">
                        Location
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {locations.map((location) => (
                          <div key={location} className="flex items-center space-x-2">
                            <Checkbox id={location} />
                            <label
                              htmlFor={location}
                              className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                            >
                              {location}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-slate-200 dark:bg-slate-700" />

                    {/* Rating */}
                    <div>
                      <h3 className="font-semibold mb-3 text-sm sm:text-base text-slate-900 dark:text-white">Rating</h3>
                      <Select>
                        <SelectTrigger className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm">
                          <SelectValue placeholder="Minimum rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4.5">4.5+ stars</SelectItem>
                          <SelectItem value="4.0">4.0+ stars</SelectItem>
                          <SelectItem value="3.5">3.5+ stars</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Company Listings */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedIndustry ? `${selectedIndustry} Companies` : "All Featured Companies"}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                  {totalCompanies} premium partner companies
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                <Select defaultValue="rating">
                  <SelectTrigger className="w-full sm:w-48 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="openings">Most Openings</SelectItem>
                    <SelectItem value="reviews">Most Reviews</SelectItem>
                    <SelectItem value="name">Company Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Company Grid */}
            <div className="space-y-4 sm:space-y-6">
              {featuredCompanies.map((company, index) => {
                const sectorColors = getSectorColor(company.sector)

                return (
                  <motion.div
                    key={company.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02, duration: 0.4 }}
                    whileHover={{ y: -5 }}
                  >
                    <Link href={`/companies/${company.id}`}>
                      <Card
                        className={`group cursor-pointer border-0 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative ${
                          company.urgent
                            ? "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 ring-2 ring-purple-200 dark:ring-purple-800"
                            : "bg-white/70 dark:bg-slate-800/70"
                        } ${sectorColors.border}`}
                      >
                        {/* Badges positioned to avoid overlap */}
                        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                          {company.urgent && (
                            <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white animate-bounce text-xs">
                              <Zap className="w-3 h-3 mr-1" />
                              Urgent Hiring
                            </Badge>
                          )}
                        </div>

                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${sectorColors.bg} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                        />

                        <CardContent className="p-4 sm:p-6 lg:p-8">
                          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                            <motion.div whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }}>
                              <Avatar className="w-16 h-16 sm:w-20 sm:h-20 ring-2 ring-white/50 group-hover:ring-4 transition-all duration-300 shadow-lg flex-shrink-0 mx-auto lg:mx-0">
                                <AvatarImage src={company.logo || "/placeholder.svg"} alt={company.name} />
                                <AvatarFallback className={`text-xl sm:text-2xl font-bold ${sectorColors.text}`}>
                                  {company.name[0]}
                                </AvatarFallback>
                              </Avatar>
                            </motion.div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4 gap-4">
                                <div className="flex-1 min-w-0">
                                  <h3
                                    className={`text-xl sm:text-2xl font-bold mb-2 transition-colors duration-300 ${
                                      company.urgent
                                        ? "text-purple-700 dark:text-purple-400"
                                        : "text-slate-900 dark:text-white group-hover:" + sectorColors.text
                                    } line-clamp-2`}
                                  >
                                    {company.name}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3">
                                    <Badge
                                      className={`${sectorColors.text} ${sectorColors.border} bg-gradient-to-r ${sectorColors.bg} bg-opacity-10 text-xs sm:text-sm`}
                                    >
                                      {company.industry}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {company.companyType}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center mb-3">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                                    <span className="font-semibold text-sm sm:text-base">{company.rating}</span>
                                    <span className="text-slate-500 text-xs sm:text-sm ml-1">
                                      ({company.reviews.toLocaleString()} reviews)
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-end space-y-2 sm:space-y-0 sm:space-x-3 lg:space-x-0 lg:space-y-3 flex-shrink-0">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full sm:w-auto bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-600 transition-all duration-300 text-xs sm:text-sm"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                    }}
                                  >
                                    <Heart className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    Follow
                                  </Button>
                                  <Button
                                    className={`w-full sm:w-auto bg-gradient-to-r ${sectorColors.bg} ${sectorColors.hover} hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm`}
                                  >
                                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                    View ({company.openings})
                                  </Button>
                                </div>
                              </div>

                              <p className="text-slate-700 dark:text-slate-300 mb-4 sm:mb-6 line-clamp-2 leading-relaxed text-sm sm:text-base">
                                {company.description}
                              </p>

                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                                <div className="flex items-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">{company.location}</span>
                                </div>
                                <div className="flex items-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                  <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">{company.employees} employees</span>
                                </div>
                                <div className="flex items-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                  <Building2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">Founded {company.founded}</span>
                                </div>
                                <div className="flex items-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">{company.salaryRange}</span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-1 sm:gap-2 mb-4">
                                {company.benefits.slice(0, 4).map((benefit, benefitIndex) => (
                                  <Badge
                                    key={benefitIndex}
                                    variant="secondary"
                                    className="text-xs bg-slate-100 dark:bg-slate-700"
                                  >
                                    {benefit}
                                  </Badge>
                                ))}
                                {company.benefits.length > 4 && (
                                  <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-700">
                                    +{company.benefits.length - 4} more
                                  </Badge>
                                )}
                              </div>

                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700 gap-2">
                                <div className="flex items-center space-x-4">
                                  <span className="text-xs sm:text-sm text-slate-500">
                                    Work Culture: {company.workCulture}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {company.openings} open positions
                                  </span>
                                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-800 mt-12 sm:mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-xl sm:text-2xl font-bold">JobPortal</span>
              </div>
              <p className="text-slate-400 mb-4 sm:mb-6 text-sm sm:text-base">
                India's leading job portal connecting talent with opportunities.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <span className="text-xs sm:text-sm">f</span>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <span className="text-xs sm:text-sm">t</span>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <span className="text-xs sm:text-sm">in</span>
                </div>
              </div>
            </div>

            {[
              {
                title: "For Job Seekers",
                links: ["Browse Jobs", "Career Advice", "Resume Builder", "Salary Guide", "Job at Pace Premium"],
              },
              {
                title: "For Employers",
                links: ["Post Jobs", "Search Resumes", "Recruitment Solutions", "Pricing", "TalentPulse"],
              },
              {
                title: "Company",
                links: ["About Us", "Contact", "Privacy Policy", "Terms of Service"],
              },
            ].map((section, index) => (
              <div key={index}>
                <h3 className="font-semibold mb-4 sm:mb-6 text-base sm:text-lg">{section.title}</h3>
                <ul className="space-y-2 sm:space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link
                        href="#"
                        className="text-slate-400 hover:text-white transition-colors hover:underline text-sm sm:text-base"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-slate-400">
            <p className="text-sm sm:text-base">&copy; 2025 JobPortal. All rights reserved. Made with ❤️ in India</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

