"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, X, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { EmployerDashboardNavbar } from "@/components/employer-dashboard-navbar"
import { EmployerDashboardFooter } from "@/components/employer-dashboard-footer"
import { EmployerAuthGuard } from "@/components/employer-auth-guard"

export default function CreateRequirementPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    jobDesignation: "",
    keySkills: [] as string[],
    candidateDesignations: [] as string[],
    candidateLocations: [] as string[],
    excludeLocations: [] as string[],
    includeWillingToRelocate: false,
    workExperienceMin: "",
    workExperienceMax: "",
    currentSalaryMin: "",
    currentSalaryMax: "",
    currency: "INR",
    includeNotMentioned: false,
  })

  const [currentSkill, setCurrentSkill] = useState("")
  const [currentDesignation, setCurrentDesignation] = useState("")
  const [currentLocation, setCurrentLocation] = useState("")
  const [currentExcludeLocation, setCurrentExcludeLocation] = useState("")

  const normalizeLocations = (values: string[]): string[] => {
    const seen = new Set<string>()
    return values
      .map((value) => value.trim())
      .filter((value) => {
        if (!value) return false
        const key = value.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
  }

  const handleAddSkill = () => {
    if (currentSkill.trim() && !formData.keySkills.includes(currentSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        keySkills: [...prev.keySkills, currentSkill.trim()],
      }))
      setCurrentSkill("")
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      keySkills: prev.keySkills.filter((s) => s !== skill),
    }))
  }

  const handleAddDesignation = () => {
    if (currentDesignation.trim() && !formData.candidateDesignations.includes(currentDesignation.trim())) {
      setFormData((prev) => ({
        ...prev,
        candidateDesignations: [...prev.candidateDesignations, currentDesignation.trim()],
      }))
      setCurrentDesignation("")
    }
  }

  const handleRemoveDesignation = (designation: string) => {
    setFormData((prev) => ({
      ...prev,
      candidateDesignations: prev.candidateDesignations.filter((d) => d !== designation),
    }))
  }

  const handleAddLocation = () => {
    const value = currentLocation.trim()
    if (!value) return
    setFormData((prev) => {
      const updatedIncludes = normalizeLocations([...(prev.candidateLocations || []), value])
      const locationKey = value.toLowerCase()
      const updatedExcludes = (prev.excludeLocations || []).filter((loc) => loc.toLowerCase() !== locationKey)
      return {
        ...prev,
        candidateLocations: updatedIncludes,
        excludeLocations: updatedExcludes,
      }
    })
    setCurrentLocation("")
  }

  const handleRemoveLocation = (location: string) => {
    setFormData((prev) => ({
      ...prev,
      candidateLocations: prev.candidateLocations.filter((l) => l.toLowerCase() !== location.toLowerCase()),
    }))
  }

  const handleAddExcludeLocation = () => {
    const value = currentExcludeLocation.trim()
    if (!value) return
    setFormData((prev) => {
      const updatedExcludes = normalizeLocations([...(prev.excludeLocations || []), value])
      const locationKey = value.toLowerCase()
      const updatedIncludes = (prev.candidateLocations || []).filter((loc) => loc.toLowerCase() !== locationKey)
      return {
        ...prev,
        excludeLocations: updatedExcludes,
        candidateLocations: updatedIncludes,
      }
    })
    setCurrentExcludeLocation("")
  }

  const handleRemoveExcludeLocation = (location: string) => {
    setFormData((prev) => ({
      ...prev,
      excludeLocations: prev.excludeLocations.filter((l) => l.toLowerCase() !== location.toLowerCase()),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Creating requirement:", formData)
    // Here you would typically send the data to your backend
    router.push("/employer-dashboard/requirements")
  }

  return (
    <EmployerAuthGuard>
      return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50/40 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 relative overflow-hidden">
      <EmployerDashboardNavbar />
      
      {/* Background Effects - Blue theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Base blue gradient overlay to ensure visible background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200/45 via-cyan-200/35 to-indigo-200/45"></div>
        <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-300/10 to-cyan-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-indigo-300/10 to-violet-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-cyan-300/10 to-blue-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        {/* Wide translucent blue gradient strip */}
        <div className="absolute top-1/3 left-0 right-0 h-24 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-indigo-400/20"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="mb-6">
          <Link
            href="/employer-dashboard/requirements"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Requirements
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="rounded-3xl bg-white/50 backdrop-blur-2xl border-white/40 shadow-[0_8px_28px_rgba(59,130,246,0.08)] hover:shadow-[0_18px_60px_rgba(59,130,246,0.16)]">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-900">Let's create your requirement</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Hiring Mandate */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Hiring mandate</h3>
                    <p className="text-sm text-slate-600 mb-6">
                      Define your requirement & can't be edited once created
                    </p>

                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="job-designation" className="text-slate-700">
                          Job designation *
                        </Label>
                        <Input
                          id="job-designation"
                          placeholder="Add a short & specific designation for this requirement"
                          value={formData.jobDesignation}
                          onChange={(e) => setFormData((prev) => ({ ...prev, jobDesignation: e.target.value }))}
                          className="mt-2 bg-white border-slate-200"
                          required
                        />
                      </div>

                    </div>
                  </div>

                  {/* Candidate Preferences */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Candidate preferences</h3>
                    <p className="text-sm text-slate-600 mb-6">Results will be based on these inputs</p>

                    <div className="space-y-6">
                      <div>
                        <Label className="text-slate-700">Key skills *</Label>
                        <div className="mt-2 space-y-3">
                          <div className="flex space-x-2">
                            <Input
                              placeholder="Add minimum 3 key skills for better results"
                              value={currentSkill}
                              onChange={(e) => setCurrentSkill(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                              className="bg-white border-slate-200"
                            />
                            <Button type="button" onClick={handleAddSkill} size="sm">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          {formData.keySkills.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {formData.keySkills.map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="secondary"
                                  className="bg-blue-100 text-blue-800 border-blue-200"
                                >
                                  {skill}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSkill(skill)}
                                    className="ml-2 hover:text-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label className="text-slate-700">Candidate designations</Label>
                        <div className="mt-2 space-y-3">
                          <div className="flex space-x-2">
                            <Input
                              placeholder="Add candidate designations that are similar to what you're hiring for"
                              value={currentDesignation}
                              onChange={(e) => setCurrentDesignation(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddDesignation())}
                              className="bg-white border-slate-200"
                            />
                            <Button type="button" onClick={handleAddDesignation} size="sm">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          {formData.candidateDesignations.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {formData.candidateDesignations.map((designation) => (
                                <Badge
                                  key={designation}
                                  variant="secondary"
                                  className="bg-green-100 text-green-800 border-green-200"
                                >
                                  {designation}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDesignation(designation)}
                                    className="ml-2 hover:text-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label className="text-slate-700">Candidate locations *</Label>
                        <div className="mt-2 space-y-4">
                          <div>
                            <div className="flex space-x-2">
                              <Input
                                placeholder="Add preferred candidate locations"
                                value={currentLocation}
                                onChange={(e) => setCurrentLocation(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    handleAddLocation()
                                  }
                                }}
                                className="bg-white border-slate-200"
                              />
                              <Button type="button" onClick={handleAddLocation} size="sm">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            {formData.candidateLocations.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {formData.candidateLocations.map((location) => (
                                  <Badge
                                    key={location}
                                    variant="secondary"
                                    className="bg-purple-100 text-purple-800 border-purple-200"
                                  >
                                    {location}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveLocation(location)}
                                      className="ml-2 hover:text-red-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <Label className="text-sm text-slate-600">Exclude locations (optional)</Label>
                            <div className="flex space-x-2 mt-2">
                              <Input
                                placeholder="Add locations to exclude"
                                value={currentExcludeLocation}
                                onChange={(e) => setCurrentExcludeLocation(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    handleAddExcludeLocation()
                                  }
                                }}
                                className="bg-white border-slate-200"
                              />
                              <Button type="button" onClick={handleAddExcludeLocation} size="sm" variant="outline">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            {formData.excludeLocations.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {formData.excludeLocations.map((location) => (
                                  <Badge
                                    key={location}
                                    variant="secondary"
                                    className="bg-red-100 text-red-800 border-red-200"
                                  >
                                    {location}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveExcludeLocation(location)}
                                      className="ml-2 hover:text-red-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="include-willing"
                              checked={formData.includeWillingToRelocate}
                              onCheckedChange={(checked) =>
                                setFormData((prev) => ({ ...prev, includeWillingToRelocate: checked === true }))
                              }
                            />
                            <div className="space-y-1">
                              <Label htmlFor="include-willing" className="text-sm text-slate-600">
                                Include candidates willing to relocate to the included locations
                              </Label>
                              <p className="text-xs text-slate-500">
                                When enabled, we will also consider candidates who have marked themselves as willing to relocate.
                              </p>
                            </div>
                          </div>

                          <p className="text-xs text-slate-500">
                            Leave the include list empty to allow candidates from any location. Excluded locations are always filtered out.
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-slate-700">Work experience *</Label>
                        <div className="mt-2 flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Input
                              placeholder="Min experience"
                              value={formData.workExperienceMin}
                              onChange={(e) => setFormData((prev) => ({ ...prev, workExperienceMin: e.target.value }))}
                              className="w-32 bg-white border-slate-200"
                            />
                            <span className="text-slate-600">to</span>
                            <Input
                              placeholder="Max experience"
                              value={formData.workExperienceMax}
                              onChange={(e) => setFormData((prev) => ({ ...prev, workExperienceMax: e.target.value }))}
                              className="w-32 bg-white border-slate-200"
                            />
                            <span className="text-slate-600">Years</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-slate-700">Current annual salary</Label>
                        <div className="mt-2 flex items-center space-x-4">
                          <Select
                            value={formData.currency}
                            onValueChange={(value) => setFormData((prev) => ({ ...prev, currency: value }))}
                          >
                            <SelectTrigger className="w-20 bg-white border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="INR">INR</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Min salary"
                            value={formData.currentSalaryMin}
                            onChange={(e) => setFormData((prev) => ({ ...prev, currentSalaryMin: e.target.value }))}
                            className="w-32 bg-white border-slate-200"
                          />
                          <span className="text-slate-600">to</span>
                          <Input
                            placeholder="Max salary"
                            value={formData.currentSalaryMax}
                            onChange={(e) => setFormData((prev) => ({ ...prev, currentSalaryMax: e.target.value }))}
                            className="w-32 bg-white border-slate-200"
                          />
                          <span className="text-slate-600">Lacs</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-3">
                          <Checkbox
                            id="include-not-mentioned"
                            checked={formData.includeNotMentioned}
                            onCheckedChange={(checked) =>
                              setFormData((prev) => ({ ...prev, includeNotMentioned: checked as boolean }))
                            }
                          />
                          <Label htmlFor="include-not-mentioned" className="text-sm text-slate-600">
                            Include candidates that haven't mentioned their current annual salary
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8"
                    >
                      Create requirement
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Tips Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-xl border-slate-200/50 sticky top-24">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-12 h-12 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Tips to find better candidates:</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <p className="text-sm text-slate-600">Add a clear job designation</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <p className="text-sm text-slate-600">Select multiple candidate locations</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <p className="text-sm text-slate-600">Broaden work experience range</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <EmployerDashboardFooter />
    </div>
    </EmployerAuthGuard>
  )
}
