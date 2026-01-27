"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, BadgeCheck, Palette, CreditCard, LogOut, Settings, User, Sun, Moon, Monitor, Check, Zap } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useSubscription } from "@/hooks/use-subscription"
import { TierBadge } from "@/components/shared/tier-badge"

interface UserTeamSwitcherProps {
    user: { name: string; email: string; avatar: string }
    teams: {
        name: string
        logo: LucideIcon
        plan: string
    }[]
    compact?: boolean
}

export function UserTeamSwitcher({ user, teams, compact = false }: UserTeamSwitcherProps) {
    const { isMobile } = useSidebar()
    const { theme, setTheme } = useTheme()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { signOut } = useAuth()
    const { isDemo, tierName: _tierName } = useSubscription()
    const [activeTeam, setActiveTeam] = React.useState(teams[0])
    const [isLoggingOut, setIsLoggingOut] = React.useState(false)

    // Handle opening settings (pushes to history for back button support)
    const handleOpenSettings = React.useCallback(() => {
        const params = new URLSearchParams(searchParams?.toString())
        params.set("settings", "Konto") // Default tab
        router.push(`${pathname}?${params.toString()}`)
    }, [router, pathname, searchParams])

    // Handle logout
    const handleLogout = React.useCallback(async () => {
        if (isLoggingOut) return
        setIsLoggingOut(true)

        try {
            // Call both client-side signOut and server-side logout
            await signOut()
            await fetch('/api/auth/logout', { method: 'POST' })

            // Redirect to login page
            router.push('/login')
        } catch (error) {
            console.error('Logout error:', error)
            // Still try to redirect even if there's an error
            router.push('/login')
        } finally {
            setIsLoggingOut(false)
        }
    }, [signOut, router, isLoggingOut])

    if (!activeTeam) {
        return null
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            {/* User Avatar */}
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback className="rounded-lg bg-muted text-foreground"><User className="h-4 w-4" /></AvatarFallback>
                            </Avatar>
                            {!compact && (
                                <>
                                    <div className="grid flex-1 text-left text-sm leading-tight transition-[opacity,width] duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0">
                                        <span className="truncate font-medium text-foreground">{user.name}</span>
                                        <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto transition-[opacity,width] duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0" />
                                </>
                            )}
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="start"
                        side={isMobile ? "bottom" : "right"}
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                    <activeTeam.logo className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">{activeTeam.name}</span>
                                    <span className="truncate text-xs text-muted-foreground">556999-1234</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {/* Subscription tier and upgrade */}
                        <DropdownMenuGroup>
                            <div className="flex items-center justify-between px-2 py-1.5">
                                <span className="text-xs text-muted-foreground">Abonnemang</span>
                                <TierBadge size="sm" showTooltip={false} />
                            </div>
                            {isDemo && (
                                <DropdownMenuItem onClick={() => router.push('/priser')}>
                                    <Zap className="mr-2 h-4 w-4 text-amber-500" />
                                    Uppgradera till Pro
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            {/* Team switcher as submenu */}
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    <activeTeam.logo className="mr-2 h-4 w-4" />
                                    Företag
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent>
                                        {teams.map((team) => (
                                            <DropdownMenuItem
                                                key={team.name}
                                                onClick={() => setActiveTeam(team)}
                                            >
                                                <div className="flex size-5 items-center justify-center rounded-md border mr-2">
                                                    <team.logo className="size-3 shrink-0" />
                                                </div>
                                                {team.name}
                                                {team.name === activeTeam.name && <Check className="ml-auto h-4 w-4" />}
                                            </DropdownMenuItem>
                                        ))}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Lägg till företag
                                        </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuItem><BadgeCheck className="mr-2 h-4 w-4" />Konto</DropdownMenuItem>
                            <DropdownMenuItem><CreditCard className="mr-2 h-4 w-4" />Fakturering</DropdownMenuItem>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger><Palette className="mr-2 h-4 w-4" />Utseende</DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuItem onClick={() => setTheme("light")}>
                                            <Sun className="mr-2 h-4 w-4" />
                                            Ljus
                                            {theme === "light" && <Check className="ml-auto h-4 w-4" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                                            <Moon className="mr-2 h-4 w-4" />
                                            Mörk
                                            {theme === "dark" && <Check className="ml-auto h-4 w-4" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setTheme("system")}>
                                            <Monitor className="mr-2 h-4 w-4" />
                                            System
                                            {theme === "system" && <Check className="ml-auto h-4 w-4" />}
                                        </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuItem onSelect={handleOpenSettings}><Settings className="mr-2 h-4 w-4" />Inställningar</DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={handleLogout} disabled={isLoggingOut}>
                            <LogOut className="mr-2 h-4 w-4" />
                            {isLoggingOut ? 'Loggar ut...' : 'Logga ut'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu >
    )
}
