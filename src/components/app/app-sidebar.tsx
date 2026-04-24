'use client'

import React, { useState } from 'react'
import { useAppStore, type ViewType } from '@/lib/store'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wrench,
  Users,
  BarChart3,
  Receipt,
  Settings,
  ChevronRight,
  LogOut,
  Wrench as WrenchIcon,
} from 'lucide-react'

interface NavItem {
  id: ViewType
  label: string
  icon: React.ElementType
  subItems?: { id: ViewType; label: string }[]
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Panel Principal',
    icon: LayoutDashboard,
  },
  {
    id: 'inventory',
    label: 'Inventario',
    icon: Package,
    subItems: [
      { id: 'products', label: 'Productos' },
      { id: 'categories', label: 'Categorías' },
      { id: 'suppliers', label: 'Proveedores' },
    ],
  },
  {
    id: 'sales',
    label: 'Ventas',
    icon: ShoppingCart,
    subItems: [
      { id: 'pos', label: 'Nueva Venta' },
      { id: 'sales', label: 'Historial' },
    ],
  },
  {
    id: 'repairs',
    label: 'Reparaciones',
    icon: Wrench,
  },
  {
    id: 'customers',
    label: 'Clientes',
    icon: Users,
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: BarChart3,
  },
  {
    id: 'expenses',
    label: 'Gastos',
    icon: Receipt,
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: Settings,
  },
]

export function AppSidebar() {
  const { currentView, setCurrentView, user } = useAppStore()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore logout errors
    }
    useAppStore.getState().setUser(null)
  }

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Header / Brand */}
      <SidebarHeader className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-sidebar-accent"
              onClick={() => setCurrentView('dashboard')}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <WrenchIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-bold">TallerTech</span>
                <span className="truncate text-xs text-muted-foreground">
                  Sistema de Gestión
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Menú
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  currentView === item.id ||
                  item.subItems?.some((sub) => sub.id === currentView)

                if (item.subItems) {
                  return (
                    <Collapsible
                      key={item.id}
                      defaultOpen={isActive}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            isActive={isActive}
                            tooltip={item.label}
                          >
                            <item.icon className="size-4" />
                            <span>{item.label}</span>
                            <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItems.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.id}>
                                <SidebarMenuSubButton
                                  isActive={currentView === subItem.id}
                                  onClick={() => setCurrentView(subItem.id)}
                                >
                                  <span>{subItem.label}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                }

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      onClick={() => setCurrentView(item.id)}
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer / User Info */}
      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-sidebar-accent"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">{user?.name || 'Usuario'}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email || ''}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Cerrar Sesión"
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
