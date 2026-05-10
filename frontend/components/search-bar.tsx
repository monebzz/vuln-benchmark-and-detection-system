"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Search, Clock, Hash, Building, Package, Shield } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import { autocompleteSearch } from "@/services/search"
import { AutocompleteResult } from "@/types/search"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  placeholder?: string
  className?: string
  onSearch?: (query: string) => void
  autoFocus?: boolean
  showHistory?: boolean
}

// Category icons mapping
const categoryIcons = {
  cve: Hash,
  vendor: Building,
  product: Package,
  severity: Shield,
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function SearchBar({ 
  placeholder = "Search CVEs, vendors, products...", 
  className,
  onSearch,
  autoFocus = false,
  showHistory = true
}: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  const debouncedQuery = useDebounce(query, 300)

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && showHistory) {
      const stored = localStorage.getItem('search-history')
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored).slice(0, 5))
        } catch (e) {
          console.warn('Failed to parse search history')
        }
      }
    }
  }, [showHistory])

  // Save search to history
  const saveToHistory = useCallback((searchQuery: string) => {
    if (!showHistory || !searchQuery.trim()) return
    
    const newHistory = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5)
    setRecentSearches(newHistory)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('search-history', JSON.stringify(newHistory))
    }
  }, [recentSearches, showHistory])

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setIsLoading(true)
      autocompleteSearch(debouncedQuery, undefined, 8)
        .then(response => {
          setSuggestions(response.suggestions)
          setSelectedIndex(-1)
        })
        .catch(error => {
          console.error('Autocomplete error:', error)
          setSuggestions([])
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setSuggestions([])
      setIsLoading(false)
    }
  }, [debouncedQuery])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        const maxIndex = suggestions.length + (showHistory && recentSearches.length > 0 ? recentSearches.length : 0) - 1
        setSelectedIndex(prev => prev < maxIndex ? prev + 1 : prev)
        break
      
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > -1 ? prev - 1 : prev)
        break
      
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          const allItems = [
            ...(showHistory && query.length < 2 ? recentSearches : []),
            ...suggestions.map(s => s.suggestion)
          ]
          if (allItems[selectedIndex]) {
            handleSearch(allItems[selectedIndex])
          }
        } else if (query.trim()) {
          handleSearch(query.trim())
        }
        break
      
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }, [isOpen, selectedIndex, suggestions, query, recentSearches, showHistory])

  // Handle search submission
  const handleSearch = useCallback((searchQuery: string) => {
    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery) return

    setQuery(trimmedQuery)
    setIsOpen(false)
    setSelectedIndex(-1)
    saveToHistory(trimmedQuery)

    if (onSearch) {
      onSearch(trimmedQuery)
    } else {
      // Navigate to search results page
      router.push(`/searchResult?q=${encodeURIComponent(trimmedQuery)}`)
    }
  }, [onSearch, router, saveToHistory])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getCategoryIcon = (category: string) => {
    const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || Hash
    return <IconComponent className="h-3 w-3" />
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cve': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'vendor': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'product': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'severity': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const showRecentSearches = showHistory && query.length < 2 && recentSearches.length > 0
  const showSuggestions = suggestions.length > 0 || isLoading
  const shouldShowDropdown = isOpen && (showRecentSearches || showSuggestions)

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 pr-4"
          autoFocus={autoFocus}
          autoComplete="off"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
            onClick={() => {
              setQuery("")
              setSuggestions([])
              inputRef.current?.focus()
            }}
          >
            ✕
          </Button>
        )}
      </form>

      {shouldShowDropdown && (
        <div className="absolute top-full mt-1 w-full rounded-md border bg-popover p-1 shadow-md z-50">
          {/* Recent Searches */}
          {showRecentSearches && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Recent Searches
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={`recent-${index}`}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left hover:bg-accent",
                    selectedIndex === index && "bg-accent"
                  )}
                  onClick={() => handleSearch(search)}
                >
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{search}</span>
                </button>
              ))}
              {showSuggestions && <Separator className="my-1" />}
            </>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="px-2 py-3 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          )}

          {/* Autocomplete Suggestions */}
          {!isLoading && suggestions.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => {
                const adjustedIndex = showRecentSearches ? index + recentSearches.length : index
                return (
                  <button
                    key={`suggestion-${index}`}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left hover:bg-accent",
                      selectedIndex === adjustedIndex && "bg-accent"
                    )}
                    onClick={() => handleSearch(suggestion.suggestion)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getCategoryIcon(suggestion.category)}
                      <span className="truncate">{suggestion.suggestion}</span>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={cn("text-xs", getCategoryColor(suggestion.category))}
                    >
                      {suggestion.category}
                    </Badge>
                  </button>
                )
              })}
            </>
          )}

          {/* No Results */}
          {!isLoading && !showRecentSearches && suggestions.length === 0 && query.length >= 2 && (
            <div className="px-2 py-3 text-center text-sm text-muted-foreground">
              No suggestions found
            </div>
          )}
        </div>
      )}
    </div>
  )
}