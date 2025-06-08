"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/data-processing/utils"

const UltraTransparentDialog = DialogPrimitive.Root

const UltraTransparentDialogTrigger = DialogPrimitive.Trigger

const UltraTransparentDialogPortal = DialogPrimitive.Portal

const UltraTransparentDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    style={{
      backgroundColor: 'rgba(0, 0, 0, 0.01)',
      opacity: 0.01,
      pointerEvents: 'auto' // Ensure clicks are captured
    }}
    {...props}
  />
))
UltraTransparentDialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const UltraTransparentDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <UltraTransparentDialogPortal>
    <UltraTransparentDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </UltraTransparentDialogPortal>
))
UltraTransparentDialogContent.displayName = DialogPrimitive.Content.displayName

// Title and Description components are defined below

const UltraTransparentDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
UltraTransparentDialogHeader.displayName = "UltraTransparentDialogHeader"

const UltraTransparentDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
UltraTransparentDialogFooter.displayName = "UltraTransparentDialogFooter"

const UltraTransparentDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
UltraTransparentDialogTitle.displayName = DialogPrimitive.Title.displayName

const UltraTransparentDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
UltraTransparentDialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  UltraTransparentDialog,
  UltraTransparentDialogPortal,
  UltraTransparentDialogOverlay,
  UltraTransparentDialogTrigger,
  UltraTransparentDialogContent,
  UltraTransparentDialogHeader,
  UltraTransparentDialogFooter,
  UltraTransparentDialogTitle,
  UltraTransparentDialogDescription,
}
