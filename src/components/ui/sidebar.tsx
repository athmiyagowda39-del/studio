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

/* ================= CONSTANTS ================= */

const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_ICON = "3rem"

/* ================= CONTEXT ================= */

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
            // 🔴 prevents full-page horizontal scroll
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

const Sidebar = React.forwardRef<HTMLDivElement, React.ComponentProps<"aside">>(
  ({ children, className, ...props }, ref) => {
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
        className={cn(
          "fixed inset-y-0 left-0 z-10 h-svh w-[--sidebar-width] bg-sidebar",
          className
        )}
        {...props}
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
      // ✅ space for fixed sidebar + no page scroll
      "flex min-h-svh flex-1 flex-col bg-background overflow-x-hidden md:ml-[16rem]",
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
>(({ className, ...props }, ref) => (
  <header
    ref={ref}
    className={cn(
      "flex h-16 items-center border-b border-sidebar-border px-4",
      className
    )}
    {...props}
  />
))
SidebarHeader.displayName = "SidebarHeader"

/* ================= CONTENT ================= */

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden p-4",
      className
    )}
    {...props}
  />
))
SidebarContent.displayName = "SidebarContent"

/* ================= FOOTER ================= */

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"footer">
>(({ className, ...props }, ref) => (
  <footer
    ref={ref}
    className={cn("border-t border-sidebar-border p-4", className)}
    {...props}
  />
))
SidebarFooter.displayName = "SidebarFooter"

/* ================= TRIGGER ================= */

const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className={className}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

/* ================= MENU ================= */

const SidebarMenu = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { state } = useSidebar()
  return (
    <div
      ref={ref}
      data-state={state}
      className={cn(
        "flex flex-1 flex-col gap-1",
        "data-[state=collapsed]:px-1",
        className
      )}
      {...props}
    />
  )
})
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>((props, ref) => <div ref={ref} {...props} />)
SidebarMenuItem.displayName = "SidebarMenuItem"

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string
  }
>(({ asChild, isActive, tooltip, className, ...props }, ref) => {
  const { state } = useSidebar()

  if (state === "collapsed") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={ref}
            variant={isActive ? "primary" : "ghost"}
            size="icon"
            className={cn("size-10", className)}
            {...props}
          />
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={8}
          className="bg-sidebar-primary text-sidebar-primary-foreground"
        >
          {tooltip}
        </TooltipContent>
      </Tooltip>
    )
  }

  const Comp = asChild ? Slot : Button
  return (
    <Comp
      ref={ref}
      variant={isActive ? "primary" : "ghost"}
      className={cn("h-10 w-full justify-start", className)}
      {...props}
    />
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

/* ================= SEPARATOR ================= */

const SidebarSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  const { state } = useSidebar()
  return (
    <Separator
      ref={ref}
      className={cn(
        "my-2",
        state === "collapsed" &&
          "mx-auto h-6 w-px bg-sidebar-border/50",
        className
      )}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

/* ================= SKELETON ================= */

function SidebarSkeleton({
  className,
  ...props
}: React.ComponentProps<typeof Skeleton>) {
  const { state } = useSidebar()
  if (state === "collapsed") {
    return (
      <div className="flex flex-col gap-2 p-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="size-10 rounded-md" />
        ))}
      </div>
    )
  }
  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
    </div>
  )
}

/* ================= EXPORTS ================= */

export {
  Sidebar,
  SidebarProvider,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarSkeleton,
}
