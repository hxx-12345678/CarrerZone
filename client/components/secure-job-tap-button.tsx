"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiService } from '@/lib/api'
import { toast } from 'sonner'
import { Shield, Star } from 'lucide-react'

interface SecureJobTapButtonProps {
  jobId: string
  isSecure: boolean
  onTapSuccess?: (tapCount: number, premiumAwarded: boolean) => void
}

export function SecureJobTapButton({ jobId, isSecure, onTapSuccess }: SecureJobTapButtonProps) {
  const [isTapping, setIsTapping] = useState(false)
  const [hasTapped, setHasTapped] = useState(false)

  const handleTap = async () => {
    if (!isSecure) {
      toast.error('This job is not a secure job')
      return
    }

    if (hasTapped) {
      toast.info('You have already tapped this secure job')
      return
    }

    try {
      setIsTapping(true)
      const response = await apiService.tapSecureJob(jobId)
      
      if (response.success) {
        setHasTapped(true)
        toast.success(`Secure job tapped! ${response.data?.premiumAwarded ? 'Premium badge awarded!' : ''}`)
        
        if (onTapSuccess) {
          onTapSuccess(response.data?.tapCount || 0, response.data?.premiumAwarded || false)
        }
      } else {
        toast.error(response.message || 'Failed to tap secure job')
      }
    } catch (error) {
      console.error('Error tapping secure job:', error)
      toast.error('Failed to tap secure job')
    } finally {
      setIsTapping(false)
    }
  }

  if (!isSecure) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <Shield className="w-3 h-3 mr-1" />
        Secure Job
      </Badge>
      <Button
        onClick={handleTap}
        disabled={isTapping || hasTapped}
        size="sm"
        variant={hasTapped ? "secondary" : "default"}
        className={hasTapped ? "bg-green-100 text-green-800" : ""}
      >
        {isTapping ? (
          "Tapping..."
        ) : hasTapped ? (
          <>
            <Star className="w-3 h-3 mr-1" />
            Tapped
          </>
        ) : (
          <>
            <Shield className="w-3 h-3 mr-1" />
            Tap for Premium
          </>
        )}
      </Button>
    </div>
  )
}
