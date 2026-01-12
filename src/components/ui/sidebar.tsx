
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

/* ================= PROVIDER ================= */

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, style, children, ...props }, ref) => {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(true)
  const [openMobile, setOpenMobile] = React.useState(false)

  const toggleSidebar = () => {
    isMobile ? setOpenMobile(!openMobile) : setOpen(!open)
  }

  return (
    <SidebarContext.Provider
      value={{
        state: open ? "expanded" : "collapsed",
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }}
    >
      <TooltipProvider delayDuration={0}>
        <div
          ref={ref}
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "flex min-h-svh w-full overflow-x-hidden",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
})
SidebarProvider.displayName = "SidebarProvider"

/* ================= SIDEBAR ================= */

const Sidebar = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ children }, ref) => {
    const { isMobile, openMobile, setOpenMobile } = useSidebar()

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetContent className="w-[--sidebar-width] p-0">
            {children}
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <aside
        ref={ref}
        className="fixed inset-y-0 left-0 z-10 h-svh w-[--sidebar-width] bg-sidebar"
      >
        {children}
      </aside>
    )
  }
)
Sidebar.displayName = "Sidebar"

/* ================= MAIN CONTENT ================= */

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => (
  <main
    ref={ref}
    className={cn(
      "flex min-h-svh flex-1 flex-col bg-background",
      className
    )}
    {...props}
  />
))
SidebarInset.displayName = "SidebarInset"

/* ================= HEADER ================= */

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"header">
>(({ className, ...props }, ref) => {
  const { open, isMobile } = useSidebar()

  return (
    <header
      ref={ref}
      className={cn(
        "flex h-16 items-center border-b border-sidebar-border px-4",
        (isMobile || !open) && "justify-center",
        className
      )}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

/* ================= CONTENT ================= */

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { isMobile, open } = useSidebar()
  if (isMobile || open) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-[calc(100svh-8rem)] flex-col gap-4 overflow-y-auto overflow-x-hidden p-4",
          className
        )}
        {...props}
      />
    )
  }
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-4 overflow-y-auto overflow-x-hidden p-2")}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

/* ================= FOOTER ================= */

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"footer">
>(({ className, ...props }, ref) => {
  return (
    <footer
      ref={ref}
      className={cn("sticky bottom-0 border-t border-sidebar-border", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

/* ================= TRIGGER ================= */

const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, children, ...props }, ref) => {
  const { isMobile, toggleSidebar } = useSidebar()
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn(isMobile && "absolute left-4 top-2 z-50", className)}
      onClick={toggleSidebar}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

/* ================= SEARCH ================= */

const SidebarSearch = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input> & {
    onSearch?: (value: string) => void
  }
>(({ className, onSearch, ...props }, ref) => {
  const { open } = useSidebar()
  return (
    <div className="relative">
      <Input
        ref={ref}
        className={cn(
          "h-9 pl-8 placeholder:text-sidebar-foreground",
          !open && "w-0 p-0",
          className
        )}
        placeholder="Search..."
        {...props}
      />
    </div>
  )
})
SidebarSearch.displayName = "SidebarSearch"

/* ================= MENU ================= */

type MenuContext = {
  depth: number
}

const MenuContext = React.createContext<MenuContext>({ depth: 0 })

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>((props, ref) => {
  return (
    <MenuContext.Provider value={{ depth: 0 }}>
      <ul ref={ref} className="flex flex-col" {...props} />
    </MenuContext.Provider>
  )
})
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>((props, ref) => {
  const { depth } = React.useContext(MenuContext)
  return (
    <li
      ref={ref}
      style={{
        paddingLeft: `calc(${depth}rem * 0.5)`,
      }}
      {...props}
    />
  )
})
SidebarMenuItem.displayName = "SidebarMenuItem"

const SidebarSubmenu = React.forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<{
    label: string
    defaultOpen?: boolean
    icon?: React.ReactElement
  }>
>(({ label, children, defaultOpen = false, icon }, ref) => {
  const { depth } = React.useContext(MenuContext)
  const { open } = useSidebar()
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  if (open) {
    return (
      <div ref={ref}>
        <SidebarMenuButton onClick={handleToggle} isActive={isOpen}>
          {icon}
          <span>{label}</span>
          <div className="ml-auto transition-transform group-data-[state=open]:rotate-180">
          </div>
        </SidebarMenuButton>

        {isOpen && (
          <MenuContext.Provider value={{ depth: depth + 1 }}>
            <ul className="flex flex-col py-2">{children}</ul>
          </MenuContext.Provider>
        )}
      </div>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger className="w-full">
        <SidebarMenuButton isActive={isOpen}>{icon}</SidebarMenuButton>
      </TooltipTrigger>
      <TooltipContent side="right">
        <MenuContext.Provider value={{ depth: 0 }}>
          <ul className="flex flex-col gap-2 p-2">{children}</ul>
        </MenuContext.Provider>
      </TooltipContent>
    </Tooltip>
  )
})
SidebarSubmenu.displayName = "SidebarSubmenu"

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button> & {
    isActive?: boolean
    asChild?: boolean
    tooltip?: React.ReactNode
  }
>(({ className, asChild = false, isActive, tooltip, ...props }, ref) => {
  const { open } = useSidebar()

  const Comp = asChild ? Slot : "button"

  if (open) {
    return (
      <Button
        ref={ref}
        variant="ghost"
        className={cn(
          "group h-10 w-full justify-start gap-2",
          isActive &&
            "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent",
          className
        )}
        {...props}
      />
    )
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Comp>
          <Button
            ref={ref}
            variant="ghost"
            className={cn(
              "group flex h-10 w-10 shrink-0 items-center justify-center gap-2",
              isActive &&
                "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent",
              className
            )}
            {...props}
          />
        </Comp>
      </TooltipTrigger>
      {tooltip && <TooltipContent side="right">{tooltip}</TooltipContent>}
    </Tooltip>
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

/* ================= HR ================= */

const SidebarSeparator = React.forwardRef<
  HTMLHRElement,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  const { open } = useSidebar()

  return (
    <Separator
      ref={ref}
      className={cn("my-2", !open && "mx-auto w-1/2", className)}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

/* ================= SKELETON ================= */

const SidebarSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { open } = useSidebar()

  return (
    <div ref={ref} className={cn("flex flex-col gap-4 p-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Skeleton className="size-9 rounded-lg" />
        {open && <Skeleton className="h-6 w-32" />}
      </div>
      {/* Search */}
      {open && <Skeleton className="h-9 w-full" />}
      {/* Menu */}
      <div className="flex flex-col gap-2">
        <Skeleton className={cn("h-10 w-full", !open && "size-10")} />
        <Skeleton className={cn("h-10 w-full", !open && "size-10")} />
        <Skeleton className={cn("h-10 w-full", !open && "size-10")} />
      </div>
      {/* Footer */}
      <div className="mt-auto flex flex-col gap-2">
        <Skeleton className={cn("h-10 w-full", !open && "size-10")} />
      </div>
    </div>
  )
})
SidebarSkeleton.displayName = "SidebarSkeleton"

export {
  Sidebar,
  SidebarProvider,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarSearch,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSubmenu,
  SidebarSeparator,
  SidebarSkeleton,
  useSidebar,
}

    