"use client"

import { useState, useEffect } from "react"
import { Users, Plus, Mail, Phone, Trash2, X, Shield, User, CheckCircle, Clock, Copy, Edit2, Save, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { apiService } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function TeamMembersSection() {
  const { user } = useAuth()
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [cancelInvitationDialogOpen, setCancelInvitationDialogOpen] = useState(false)
  const [invitationToCancel, setInvitationToCancel] = useState<any>(null)

  // Only show for admin users
  const isAdmin = user?.userType === 'admin' || user?.userType === 'superadmin'

  useEffect(() => {
    if (isAdmin) {
      fetchTeamMembers()
    }
  }, [isAdmin])

  const fetchTeamMembers = async () => {
    try {
      setLoading(true)
      const response = await apiService.getTeamMembers()
      if (response.success) {
        setTeamMembers(response.data.teamMembers || [])
        setPendingInvitations(response.data.pendingInvitations || [])
      } else {
        toast.error(response.message || 'Failed to fetch team members')
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
      toast.error('Failed to fetch team members')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (data: any) => {
    try {
      const response = await apiService.inviteTeamMember(data)
      if (response.success) {
        toast.success(`Invitation sent to ${data.email}`)
        setIsInviteDialogOpen(false)
        fetchTeamMembers()
        // Show invitation link and default password
        if (response.data?.invitation) {
          const inv = response.data.invitation
          toast.success(
            `Invitation sent to ${inv.email}\nDefault Password: ${inv.defaultPassword}\nShare this password with the user.`,
            {
              duration: 15000,
            }
          )
          // Also log for easy copy
          console.log(`📧 Invitation Details:`)
          console.log(`   Email: ${inv.email}`)
          console.log(`   Password: ${inv.defaultPassword}`)
          console.log(`   Link: ${inv.invitationLink}`)
        }
      } else {
        toast.error(response.message || 'Failed to send invitation')
      }
    } catch (error) {
      toast.error('Failed to send invitation')
    }
  }

  const handleRemove = async () => {
    if (!userToDelete) return
    
    try {
      const response = await apiService.removeTeamMember(userToDelete.id)
      if (response.success) {
        toast.success('Team member removed successfully')
        setDeleteDialogOpen(false)
        setUserToDelete(null)
        fetchTeamMembers()
      } else {
        toast.error(response.message || 'Failed to remove team member')
      }
    } catch (error) {
      toast.error('Failed to remove team member')
    }
  }

  const handleCancelInvitation = async () => {
    if (!invitationToCancel) return
    
    try {
      const response = await apiService.cancelInvitation(invitationToCancel.id)
      if (response.success) {
        toast.success('Invitation cancelled successfully')
        setCancelInvitationDialogOpen(false)
        setInvitationToCancel(null)
        fetchTeamMembers()
      } else {
        toast.error(response.message || 'Failed to cancel invitation')
      }
    } catch (error) {
      toast.error('Failed to cancel invitation')
    }
  }

  const copyInvitationLink = (link: string) => {
    navigator.clipboard.writeText(link)
    toast.success('Invitation link copied to clipboard')
  }

  if (!isAdmin) {
    return null // Don't show for non-admin users
  }

  return (
    <Card className="bg-white/50 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgba(59,130,246,0.06)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-900 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Team Members at Campus
          </CardTitle>
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Team Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Invite a new team member to join your company
                </DialogDescription>
              </DialogHeader>
              <InviteTeamMemberForm 
                onInvite={handleInvite}
                onClose={() => setIsInviteDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Team Members */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Active Members ({teamMembers.length})
              </h3>
              <div className="space-y-3">
                {teamMembers.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No team members yet</p>
                ) : (
                  teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>
                            {member.firstName?.[0]}{member.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-slate-900">
                              {member.firstName} {member.lastName}
                            </p>
                            {member.isAdmin && (
                              <Badge variant="outline" className="text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-slate-500 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {member.email}
                            </span>
                            {member.phone && (
                              <>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-xs text-slate-500 flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {member.phone}
                                </span>
                              </>
                            )}
                          </div>
                          {member.designation && (
                            <p className="text-xs text-slate-600 mt-1">{member.designation}</p>
                          )}
                          <div className="flex items-center space-x-1 mt-1">
                            {member.isEmailVerified ? (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Email Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                <Clock className="w-3 h-3 mr-1" />
                                Email Unverified
                              </Badge>
                            )}
                            {member.isPhoneVerified && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                <Phone className="w-3 h-3 mr-1" />
                                Phone Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {!member.isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUserToDelete(member)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pending Invitations */}
            {pendingInvitations.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Pending Invitations ({pendingInvitations.length})
                </h3>
                <div className="space-y-3">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-200"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10 bg-blue-100">
                          <AvatarFallback className="text-blue-600">
                            <User className="w-5 h-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-900">
                            {invitation.firstName} {invitation.lastName || ''}
                          </p>
                          <p className="text-sm text-slate-600">{invitation.email}</p>
                          {invitation.designation && (
                            <p className="text-xs text-slate-500 mt-1">{invitation.designation}</p>
                          )}
                          <div className="flex items-center space-x-1 mt-1">
                            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                            <span className="text-xs text-slate-500">
                              Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setInvitationToCancel(invitation)
                            setCancelInvitationDialogOpen(true)
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {userToDelete?.firstName} {userToDelete?.lastName} ({userToDelete?.email}) from the team? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-red-600 hover:bg-red-700">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Invitation Dialog */}
      <AlertDialog open={cancelInvitationDialogOpen} onOpenChange={setCancelInvitationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation sent to {invitationToCancel?.email}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setInvitationToCancel(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelInvitation} className="bg-red-600 hover:bg-red-700">
              Cancel Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function InviteTeamMemberForm({ onInvite, onClose }: { onInvite: (data: any) => void; onClose: () => void }) {
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [designation, setDesignation] = useState("Recruiter")
  const [permissions, setPermissions] = useState({
    jobPosting: true,
    resumeDatabase: true,
    analytics: true,
    featuredJobs: false,
    hotVacancies: false,
    applications: true,
    requirements: true,
    settings: false
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Email is required')
      return
    }

    setLoading(true)
    try {
      await onInvite({
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone || undefined,
        designation,
        permissions
      })
      // Reset form
      setEmail("")
      setFirstName("")
      setLastName("")
      setPhone("")
      setDesignation("Recruiter")
    } catch (error) {
      console.error('Error inviting team member:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="team.member@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="designation">Designation</Label>
          <Select value={designation} onValueChange={setDesignation}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Recruiter">Recruiter</SelectItem>
              <SelectItem value="Hiring Manager">Hiring Manager</SelectItem>
              <SelectItem value="HR Executive">HR Executive</SelectItem>
              <SelectItem value="Talent Acquisition">Talent Acquisition</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="John"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+91 9876543210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div>
        <Label className="mb-3 block">Permissions</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="jobPosting"
              checked={permissions.jobPosting}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, jobPosting: checked as boolean })
              }
            />
            <Label htmlFor="jobPosting" className="font-normal cursor-pointer">
              Job Posting
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="resumeDatabase"
              checked={permissions.resumeDatabase}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, resumeDatabase: checked as boolean })
              }
            />
            <Label htmlFor="resumeDatabase" className="font-normal cursor-pointer">
              Resume Database Access
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="analytics"
              checked={permissions.analytics}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, analytics: checked as boolean })
              }
            />
            <Label htmlFor="analytics" className="font-normal cursor-pointer">
              Analytics & Reports
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="applications"
              checked={permissions.applications}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, applications: checked as boolean })
              }
            />
            <Label htmlFor="applications" className="font-normal cursor-pointer">
              View Applications
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="requirements"
              checked={permissions.requirements}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, requirements: checked as boolean })
              }
            />
            <Label htmlFor="requirements" className="font-normal cursor-pointer">
              Requirements Management
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="featuredJobs"
              checked={permissions.featuredJobs}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, featuredJobs: checked as boolean })
              }
            />
            <Label htmlFor="featuredJobs" className="font-normal cursor-pointer">
              Featured Jobs
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hotVacancies"
              checked={permissions.hotVacancies}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, hotVacancies: checked as boolean })
              }
            />
            <Label htmlFor="hotVacancies" className="font-normal cursor-pointer">
              Hot Vacancies
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="settings"
              checked={permissions.settings}
              onCheckedChange={(checked) =>
                setPermissions({ ...permissions, settings: checked as boolean })
              }
            />
            <Label htmlFor="settings" className="font-normal cursor-pointer">
              Settings Access
            </Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !email}>
          {loading ? "Sending..." : "Send Invitation"}
        </Button>
      </div>
    </form>
  )
}

