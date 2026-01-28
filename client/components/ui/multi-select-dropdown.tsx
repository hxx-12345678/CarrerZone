"use client"

import { useState, useEffect } from "react"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MultiSelectDropdownProps {
  title: string
  options: string[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  onClose: () => void
  maxHeight?: string
}

export function MultiSelectDropdown({
  title,
  options,
  selectedValues,
  onChange,
  onClose,
  maxHeight = "400px"
}: MultiSelectDropdownProps) {
  const [localSelected, setLocalSelected] = useState<string[]>(selectedValues)
  const resolvedMaxHeight = maxHeight || "60vh"

  // Prevent body scrolling when dropdown is open and focus the dropdown
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    // Focus the overlay to trap focus
    const overlay = document.querySelector('[data-multiselect-overlay]') as HTMLElement;
    if (overlay) {
      overlay.focus();
    }
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleToggle = (value: string) => {
    if (localSelected.includes(value)) {
      setLocalSelected(localSelected.filter(v => v !== value))
    } else {
      setLocalSelected([...localSelected, value])
    }
  }

  const handleSelectAll = () => {
    setLocalSelected(options)
  }

  const handleClearAll = () => {
    setLocalSelected([])
  }

  const handleApply = () => {
    console.log('✅ MultiSelectDropdown Apply clicked:', { title, localSelected });
    onChange(localSelected)
    onClose()
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking on the overlay itself, not on the card
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent clicks on the card from bubbling up to the overlay
    e.stopPropagation();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent keyboard events from reaching the background
    e.stopPropagation();
    
    // Close on Escape key
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
      onClick={handleOverlayClick}
      onMouseDown={(e) => e.preventDefault()}
      onTouchStart={(e) => e.preventDefault()}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      data-multiselect-overlay
      style={{ pointerEvents: "auto" }}
    >
      <Card 
        className="w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={handleCardClick}
      >
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All ({options.length})
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              Clear All
            </Button>
            <div className="flex-1 text-right text-sm text-slate-600">
              {localSelected.length} selected
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full overflow-y-auto" style={{ maxHeight: resolvedMaxHeight }}>
            <div className="p-6 pb-4 space-y-3">
              {options.map((option) => (
                <div
                  key={option}
                  className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => handleToggle(option)}
                >
                  <Checkbox
                    id={`option-${option}`}
                    checked={localSelected.includes(option)}
                    onCheckedChange={() => handleToggle(option)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Label
                    htmlFor={`option-${option}`}
                    className="flex-1 cursor-pointer font-medium"
                  >
                    {option}
                  </Label>
                  {localSelected.includes(option) && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>

        <div className="border-t p-4 flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {localSelected.slice(0, 3).map((value) => (
              <Badge key={value} variant="secondary" className="text-xs">
                {value}
              </Badge>
            ))}
            {localSelected.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{localSelected.length - 3} more
              </Badge>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleApply}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Apply ({localSelected.length})
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

