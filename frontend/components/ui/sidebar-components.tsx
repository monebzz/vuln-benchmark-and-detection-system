"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Menu } from "lucide-react"
import { useSidebar } from "./sidebar"

// Base components
interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}
interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {}
interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

// Group components
interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {}
interface SidebarGroupLabelProps extends React.HTMLAttributes<HTMLDivElement> {}
interface SidebarGroupContentProps extends React.HTMLAttributes<HTMLDivElement> {}

// Menu components
interface SidebarMenuProps extends React.HTMLAttributes<HTMLUListElement> {}
interface SidebarMenuItemProps extends React.HTMLAttributes<HTMLLIElement> {}
interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  isActive?: boolean
}

// Base components
const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("flex h-screen w-64 flex-col border-r bg-background", className)} {...props}>
      {children}
    </div>
  )
})
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarHeaderProps>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("flex h-14 items-center border-b px-4", className)} {...props}>
      {children}
    </div>
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex-1 overflow-auto py-2", className)} {...props}>
        {children}
      </div>
    )
  },
)
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = React.forwardRef<HTMLDivElement, SidebarFooterProps>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("border-t p-4", className)} {...props}>
      {children}
    </div>
  )
})
SidebarFooter.displayName = "SidebarFooter"

// Group components
const SidebarGroup = React.forwardRef<HTMLDivElement, SidebarGroupProps>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("pb-4", className)} {...props}>
      {children}
    </div>
  )
})
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, SidebarGroupLabelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground", className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupContent = React.forwardRef<HTMLDivElement, SidebarGroupContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-1", className)} {...props}>
        {children}
      </div>
    )
  },
)
SidebarGroupContent.displayName = "SidebarGroupContent"

// Menu components
const SidebarMenu = React.forwardRef<HTMLUListElement, SidebarMenuProps>(({ className, children, ...props }, ref) => {
  return (
    <ul ref={ref} className={cn("space-y-1 px-2", className)} {...props}>
      {children}
    </ul>
  )
})
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<HTMLLIElement, SidebarMenuItemProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <li ref={ref} className={cn("", className)} {...props}>
        {children}
      </li>
    )
  },
)
SidebarMenuItem.displayName = "SidebarMenuItem"

const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, asChild, isActive, children, ...props }, ref) => {
    const Comp = asChild ? React.Children.only(children as React.ReactElement) : "button"
    return React.createElement(
      Comp.type,
      {
        ref,
        className: cn(
          "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-accent text-accent-foreground",
          className,
        ),
        ...props,
        ...Comp.props,
      },
      Comp.props.children,
    )
  },
)
SidebarMenuButton.displayName = "SidebarMenuButton"

// Sidebar trigger component
interface SidebarTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const SidebarTrigger = React.forwardRef<HTMLButtonElement, SidebarTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { toggleSidebar } = useSidebar()

    return (
      <button
        ref={ref}
        onClick={toggleSidebar}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className,
        )}
        {...props}
      >
        {children || <Menu className="h-5 w-5" />}
      </button>
    )
  },
)
SidebarTrigger.displayName = "SidebarTrigger"

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
}

