"use client"

import * as React from "react"
import { useState, useEffect, ReactNode } from "react"
import { createPortal } from "react-dom"

// Default sidebar slot ID used across pages
export const PAGE_SIDEBAR_SLOT_ID = "page-right-sidebar"

interface PageSidebarProps {
    children: ReactNode
    /** Custom slot ID if not using the default */
    slotId?: string
    /** If true, render inline when sidebar slot not available (default: true) */
    fallbackInline?: boolean
    /** Class name for the inline fallback wrapper */
    fallbackClassName?: string
}

/**
 * PageSidebar - Portals content to a sidebar slot on large screens
 * 
 * Usage:
 * 1. Parent page creates a slot: <div id="page-right-sidebar" className="hidden xl:block w-80 shrink-0" />
 * 2. Child component wraps sidebar content: <PageSidebar>...</PageSidebar>
 * 3. On xl+ screens, content portals to the slot
 * 4. On smaller screens, content renders inline (or not at all if fallbackInline=false)
 */
export function PageSidebar({
    children,
    slotId = PAGE_SIDEBAR_SLOT_ID,
    fallbackInline = true,
    fallbackClassName = ""
}: PageSidebarProps) {
    const [sidebarElement, setSidebarElement] = useState<HTMLElement | null>(null)

    useEffect(() => {
        const checkSidebar = () => {
            const el = document.getElementById(slotId)
            // Check if element exists AND is visible (display != none)
            if (el && window.getComputedStyle(el).display !== "none") {
                setSidebarElement(el)
            } else {
                setSidebarElement(null)
            }
        }

        // Initial check
        checkSidebar()

        // Re-check on resize
        window.addEventListener("resize", checkSidebar)

        // Also observe for DOM changes (tab switches, etc.)
        const observer = new MutationObserver(checkSidebar)
        observer.observe(document.body, { childList: true, subtree: true })

        return () => {
            window.removeEventListener("resize", checkSidebar)
            observer.disconnect()
        }
    }, [slotId])

    // Portal to sidebar slot if visible
    if (sidebarElement) {
        return createPortal(children, sidebarElement)
    }

    // Fallback: render inline or nothing
    if (fallbackInline) {
        return <div className={fallbackClassName}>{children}</div>
    }

    return null
}

/**
 * Sidebar slot component - place this in page layouts where you want the sidebar to appear
 */
export function PageSidebarSlot({ className = "" }: { className?: string }) {
    return (
        <div
            id={PAGE_SIDEBAR_SLOT_ID}
            className={`hidden lg:block w-64 xl:w-80 shrink-0 ${className}`}
        />
    )
}

// Re-export widgets and charts for convenient imports
export * from "./widgets"
export * from "./mini-charts"
