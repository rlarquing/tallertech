'use client'

import React from 'react'
import { useAppStore, viewLabels, type ViewType } from '@/lib/store'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User, Settings, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { ProductsView } from '@/components/app/products-view'
import { CategoriesView } from '@/components/app/categories-view'
import { SuppliersView } from '@/components/app/suppliers-view'
import { DashboardView } from '@/components/app/dashboard-view'
import { CustomersView } from '@/components/app/customers-view'
import { ExpensesView } from '@/components/app/expenses-view'
import { ReportsView } from '@/components/app/reports-view'
import { SettingsView } from '@/components/app/settings-view'
import { PosView } from '@/components/app/pos-view'
import { SalesView } from '@/components/app/sales-view'
import { RepairsView } from '@/components/app/repairs-view'

// Placeholder view component - will be replaced by other agents
function PlaceholderView({ view }: { view: ViewType }) {
  const labels: Record<ViewType, string> = viewLabels
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <span className="text-2xl">
            {view === 'dashboard' ? '📊' :
             view === 'products' ? '📦' :
             view === 'categories' ? '🏷️' :
             view === 'suppliers' ? '🚚' :
             view === 'sales' ? '💰' :
             view === 'pos' ? '🛒' :
             view === 'repairs' ? '🔧' :
             view === 'customers' ? '👥' :
             view === 'reports' ? '📈' :
             view === 'expenses' ? '💵' :
             view === 'settings' ? '⚙️' :
             view === 'inventory' ? '📦' : '📋'}
          </span>
        </div>
        <h2 className="text-xl font-semibold text-foreground">{labels[view]}</h2>
        <p className="text-sm text-muted-foreground">
          Esta sección estará disponible próximamente.
        </p>
      </div>
    </div>
  )
}

export function AppShell() {
  const { currentView, user } = useAppStore()
  const { setTheme, theme } = useTheme()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="flex-1 text-sm font-semibold text-foreground">
            {viewLabels[currentView]}
          </h1>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Cambiar tema</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative size-8 rounded-full">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center gap-2 p-2">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => useAppStore.getState().setCurrentView('settings')}>
                <User className="mr-2 size-4" />
                <span>Mi Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => useAppStore.getState().setCurrentView('settings')}>
                <Settings className="mr-2 size-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 size-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col overflow-auto">
          {currentView === 'dashboard' ? (
            <DashboardView />
          ) : currentView === 'products' ? (
            <ProductsView />
          ) : currentView === 'categories' ? (
            <CategoriesView />
          ) : currentView === 'suppliers' ? (
            <SuppliersView />
          ) : currentView === 'customers' ? (
            <CustomersView />
          ) : currentView === 'expenses' ? (
            <ExpensesView />
          ) : currentView === 'reports' ? (
            <ReportsView />
          ) : currentView === 'settings' ? (
            <SettingsView />
          ) : currentView === 'pos' ? (
            <PosView />
          ) : currentView === 'sales' ? (
            <SalesView />
          ) : currentView === 'repairs' ? (
            <RepairsView />
          ) : (
            <PlaceholderView view={currentView} />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
