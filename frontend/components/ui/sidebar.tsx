"use client"

import * as React from "react"

// Context for sidebar state
interface SidebarContextProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | undefined>(undefined)

// Hook to use sidebar context
export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

interface SidebarProviderProps {
  children: React.ReactNode
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SidebarProvider({ children, defaultOpen = true, onOpenChange }: SidebarProviderProps) {
  const [open, setOpen] = React.useState(defaultOpen)

  // Keep internal state in sync if parent changes defaultOpen (e.g., on resize)
  React.useEffect(() => {
    setOpen(defaultOpen)
  }, [defaultOpen])

  const handleSetOpen = React.useCallback(
    (value: boolean) => {
      setOpen(value)
      if (onOpenChange) {
        onOpenChange(value)
      }
    },
    [onOpenChange],
  )

  const toggleSidebar = React.useCallback(() => {
    handleSetOpen(!open)
  }, [open, handleSetOpen])

  const value = React.useMemo(
    () => ({
      open,
      setOpen: handleSetOpen,
      toggleSidebar,
    }),
    [open, handleSetOpen, toggleSidebar],
  )

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

