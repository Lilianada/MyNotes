import { cva } from "class-variance-authority"

export const sidebarVariants = cva(
  "sidebar group/sidebar peer flex h-full min-h-svh w-[--sidebar-width] flex-col overflow-hidden border-r transition-all ease-linear data-[state=collapsed]:w-[--sidebar-width-icon] data-[collapsible=offcanvas]:absolute data-[collapsible=offcanvas]:z-40 data-[collapsible=offcanvas]:w-[--sidebar-width-mobile] data-[collapsible=offcanvas]:data-[state=collapsed]:translate-x-[-100%] data-[collapsible=offcanvas]:focus-within:translate-x-0 data-[collapsible=offcanvas]:focus-within:shadow-lg",
  {
    variants: {
      variant: {
        default:
          "bg-background border-r-border data-[state=collapsed]:border-r-border",
        inset:
          "border-r-transparent data-[state=collapsed]:border-r-transparent",
      },
      side: {
        left: "",
        right: "right-0 border-r-0 border-l data-[collapsible=offcanvas]:data-[state=collapsed]:translate-x-[100%]",
      },
      collapsible: {
        true: "",
        offcanvas: "",
      },
    },
    defaultVariants: {
      variant: "default",
      side: "left",
      collapsible: true,
    },
  }
)
