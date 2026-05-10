"use client"

import React, { useState, useEffect } from "react"
import { Filter, Calendar, Shield, Building, Package, RotateCcw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { SearchFilters as SearchFiltersType } from "@/types/search"
import { cn } from "@/lib/utils"

interface SearchFiltersProps {
  filters: SearchFiltersType
  onFiltersChange: (filters: SearchFiltersType) => void
  onApplyFilters: () => void
  className?: string
  isLoading?: boolean
}

const severityOptions = [
  { value: "critical", label: "Critical", color: "bg-red-500" },
  { value: "high", label: "High", color: "bg-orange-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "low", label: "Low", color: "bg-green-500" },
]

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: currentYear - 1998 }, (_, i) => currentYear - i)

export function SearchFilters({ 
  filters, 
  onFiltersChange, 
  onApplyFilters,
  className,
  isLoading = false
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localFilters, setLocalFilters] = useState<SearchFiltersType>(filters)

  // Sync local filters with prop changes
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const updateFilter = (key: keyof SearchFiltersType, value: string | number | undefined) => {
    const newFilters = { 
      ...localFilters, 
      [key]: value === "" ? undefined : value 
    }
    setLocalFilters(newFilters)
  }

  const applyFilters = () => {
    onFiltersChange(localFilters)
    onApplyFilters()
  }

  const resetFilters = () => {
    const emptyFilters: SearchFiltersType = {}
    setLocalFilters(emptyFilters)
    onFiltersChange(emptyFilters)
    onApplyFilters()
  }

  const hasActiveFilters = Object.values(localFilters).some(value => 
    value !== undefined && value !== ""
  )

  const getActiveFilterCount = () => {
    return Object.values(localFilters).filter(value => 
      value !== undefined && value !== ""
    ).length
  }

  return (
    <Card className={cn("w-full", className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <CardTitle className="text-lg">Search Filters</CardTitle>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    {getActiveFilterCount()} active
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {isExpanded ? "Hide" : "Show"} filters
              </div>
            </div>
            <CardDescription>
              Refine your search with advanced filters
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Severity Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Severity Level
                </Label>
                <Select 
                  value={localFilters.severity || ""} 
                  onValueChange={(value) => updateFilter('severity', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All severities</SelectItem>
                    {severityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", option.color)} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Publication Year
                </Label>
                <Select 
                  value={localFilters.year?.toString() || ""} 
                  onValueChange={(value) => updateFilter('year', value ? parseInt(value) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All years</SelectItem>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year Range */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Year Range
                </Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="From"
                      min="1999"
                      max={currentYear}
                      value={localFilters.year_from || ""}
                      onChange={(e) => updateFilter('year_from', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="text-muted-foreground">to</span>
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="To"
                      min="1999"
                      max={currentYear}
                      value={localFilters.year_to || ""}
                      onChange={(e) => updateFilter('year_to', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              </div>

              {/* Vendor Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Vendor
                </Label>
                <Input
                  placeholder="e.g., Microsoft, Apple, Google"
                  value={localFilters.vendor || ""}
                  onChange={(e) => updateFilter('vendor', e.target.value)}
                />
              </div>

              {/* Product Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Product
                </Label>
                <Input
                  placeholder="e.g., Windows, Chrome, Linux"
                  value={localFilters.product || ""}
                  onChange={(e) => updateFilter('product', e.target.value)}
                />
              </div>
            </div>

            <Separator className="my-6" />

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    disabled={isLoading}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Filters
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={applyFilters}
                  disabled={isLoading}
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Searching...
                    </div>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Apply Filters
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Active Filters:</Label>
                  <div className="flex flex-wrap gap-2">
                    {localFilters.severity && (
                      <Badge variant="secondary" className="text-xs">
                        Severity: {localFilters.severity}
                      </Badge>
                    )}
                    {localFilters.year && (
                      <Badge variant="secondary" className="text-xs">
                        Year: {localFilters.year}
                      </Badge>
                    )}
                    {(localFilters.year_from || localFilters.year_to) && (
                      <Badge variant="secondary" className="text-xs">
                        Years: {localFilters.year_from || "start"} - {localFilters.year_to || "end"}
                      </Badge>
                    )}
                    {localFilters.vendor && (
                      <Badge variant="secondary" className="text-xs">
                        Vendor: {localFilters.vendor}
                      </Badge>
                    )}
                    {localFilters.product && (
                      <Badge variant="secondary" className="text-xs">
                        Product: {localFilters.product}
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}