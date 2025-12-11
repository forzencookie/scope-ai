"use client"

import * as React from "react"
import { ChevronRight, type LucideIcon, Folder, Forward, MoreHorizontal, Trash2, BadgeCheck, Palette, ChevronsUpDown, CreditCard, LogOut, Settings, Sparkles, User, Sun, Moon, Monitor, Check } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu"
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar } from "@/components/ui/sidebar"
import { SettingsDialog } from "@/components/settings-dialog"

// ============================================================================
// NavMain - Main sidebar navigation with collapsible submenus
// ============================================================================

export function NavMain({
  items,
  label = "Platform",
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: { title: string; url: string }[]
  }[]
  label?: string
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          item.items && item.items.length > 0 ? (
            <Collapsible key={item.title} asChild defaultOpen={item.isActive} className="group/collapsible">
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span className="transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                <CollapsibleTrigger asChild>
                  <SidebarMenuAction className="data-[state=open]:rotate-90">
                    <ChevronRight />
                    <span className="sr-only">Toggle</span>
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <Link href={subItem.url}><span>{subItem.title}</span></Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span className="transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

// ============================================================================
// NavProjects - Projects list with dropdown actions
// ============================================================================

export function NavProjects({
  projects,
}: {
  projects: { name: string; url: string; icon: LucideIcon }[]
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <a href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 rounded-lg" side={isMobile ? "bottom" : "right"} align={isMobile ? "end" : "start"}>
                <DropdownMenuItem><Folder className="text-muted-foreground" /><span>View Project</span></DropdownMenuItem>
                <DropdownMenuItem><Forward className="text-muted-foreground" /><span>Share Project</span></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem><Trash2 className="text-muted-foreground" /><span>Delete Project</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <MoreHorizontal className="text-sidebar-foreground/70" />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}

// ============================================================================
// NavSettings - Simple settings navigation
// ============================================================================

export function NavSettings({
  items,
  onSettingsClick,
}: {
  items: { title: string; url: string; icon?: LucideIcon }[]
  onSettingsClick?: () => void
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Mer</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            {item.title === "Inställningar" && onSettingsClick ? (
              <SidebarMenuButton onClick={onSettingsClick} tooltip={item.title}>
                {item.icon && <item.icon />}
                <span className="transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">{item.title}</span>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span className="transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

// ============================================================================
// NavUser - User profile dropdown in sidebar
// ============================================================================

export function NavUser({
  user,
}: {
  user: { name: string; email: string; avatar: string }
}) {
  const { isMobile } = useSidebar()
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const { theme, setTheme } = useTheme()

  return (
    <>
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-muted"><User className="h-4 w-4" /></AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight transition-[opacity,width] duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 transition-[opacity,width] duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg bg-muted"><User className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem><Sparkles />Uppgradera till Pro</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem><BadgeCheck />Konto</DropdownMenuItem>
              <DropdownMenuItem><CreditCard />Fakturering</DropdownMenuItem>
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
              <DropdownMenuItem onSelect={() => setSettingsOpen(true)}><Settings />Inställningar</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem><LogOut />Logga ut</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
    <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
