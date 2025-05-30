import { type VariantProps } from "class-variance-authority"
import { sidebarVariants } from "./sidebar-variants"

export const SIDEBAR_COOKIE_NAME = "sidebar:state"
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
export const SIDEBAR_WIDTH = "16rem"
export const SIDEBAR_WIDTH_MOBILE = "18rem"
export const SIDEBAR_WIDTH_ICON = "3rem"
export const SIDEBAR_KEYBOARD_SHORTCUT = "b"

export type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

export type SidebarElement = React.ElementRef<"div">
export type SidebarProps = React.ComponentPropsWithoutRef<"div"> & 
  VariantProps<typeof sidebarVariants> & {
    defaultOpen?: boolean
  }

export type SidebarHeaderProps = React.ComponentPropsWithoutRef<"div">
export type SidebarContentProps = React.ComponentPropsWithoutRef<"div">
export type SidebarFooterProps = React.ComponentPropsWithoutRef<"div">
export type SidebarNavProps = React.ComponentPropsWithoutRef<"nav">
export type SidebarInsetProps = React.ComponentPropsWithoutRef<"main">
export type SidebarRailProps = React.ComponentPropsWithoutRef<"div">
