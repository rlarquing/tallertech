'use client'

import React, { useEffect } from 'react'
import { useAppStore, viewLabels, type ViewType } from '@/lib/store'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app/app-sidebar'
import { MobileNav } from '@/components/app/mobile-nav'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User, Settings, Moon, Sun, Menu, Building2 } from 'lucide-react'
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
import { AuditView } from '@/components/app/audit-view'
import { WorkshopsView } from '@/components/app/workshops-view'
import { WorkshopBIView } from '@/components/app/workshop-bi-view'
import { BackupView } from '@/components/app/backup-view'
import { OfflineBanner } from '@/components/app/offline-banner'
import { PwaInstallPrompt } from '@/components/app/pwa-install-prompt'
import { initializeOfflineCache } from '@/lib/init-cache'
import { offlineFetch } from '@/lib/offline-fetch'

// ============================================================
// View Renderer
// ============================================================

function ViewRenderer({ currentView }: { currentView: ViewType }) {
  switch (currentView) {
    case 'dashboard':
      return <DashboardView />
    case 'products':
      return <ProductsView />
    case 'categories':
      return <CategoriesView />
    case 'suppliers':
      return <SuppliersView />
    case 'customers':
      return <CustomersView />
    case 'expenses':
      return <ExpensesView />
    case 'reports':
      return <ReportsView />
    case 'settings':
      return <SettingsView />
    case 'pos':
      return <PosView />
    case 'sales':
      return <SalesView />
    case 'repairs':
      return <RepairsView />
    case 'audit':
      return <AuditView />
    case 'workshops':
      return <WorkshopsView />
    case 'workshop-bi':
      return <WorkshopBIView />
    case 'backup':
      return <BackupView />
    default:
      return <PlaceholderView view={currentView} />
  }
}

function PlaceholderView({ view }: { view: ViewType }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <span className="text-2xl">📋</span>
        </div>
        <h2 className="text-xl font-semibold text-foreground">{viewLabels[view]}</h2>
        <p className="text-sm text-muted-foreground">
          Esta sección estará disponible próximamente.
        </p>
      </div>
    </div>
  )
}

// ============================================================
// App Shell - Single responsive layout
// ============================================================

export function AppShell() {
  const { currentView, user, setIsMobile, workshops, currentWorkshopId, setCurrentWorkshopId } = useAppStore()
  const { setTheme, theme } = useTheme()

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [setIsMobile])

  // Initialize offline cache on first load
  useEffect(() => {
    initializeOfflineCache()
  }, [])

  const handleLogout = async () => {
    try {
      await offlineFetch('/api/auth/logout', { method: 'POST' })
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
    <>
      {/* Global overlays */}
      <OfflineBanner />
      <PwaInstallPrompt />

      <SidebarProvider>
        {/* Desktop sidebar - hidden on mobile via CSS */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <SidebarInset>
          {/* Header - adapts for mobile/desktop */}
          <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
            {/* Desktop: sidebar trigger */}
            <div className="hidden md:flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-4" />
            </div>

            {/* Mobile: hamburger menu for secondary navigation */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8 -ml-1">
                    <Menu className="size-4" />
                    <span className="sr-only">Menú</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => useAppStore.getState().setCurrentView('dashboard')}>
                    📊 Panel Principal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => useAppStore.getState().setCurrentView('workshops')}>
                    🏢 Mis Talleres
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => useAppStore.getState().setCurrentView('workshop-bi')}>
                    📈 BI Taller
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => useAppStore.getState().setCurrentView('reports')}>
                    📈 Reportes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => useAppStore.getState().setCurrentView('expenses')}>
                    💵 Gastos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => useAppStore.getState().setCurrentView('audit')}>
                    🔍 Auditoría
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => useAppStore.getState().setCurrentView('backup')}>
                    💾 Backup
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => useAppStore.getState().setCurrentView('settings')}>
                    ⚙️ Configuración
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => useAppStore.getState().setCurrentView('categories')}>
                    🏷️ Categorías
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => useAppStore.getState().setCurrentView('suppliers')}>
                    🚚 Proveedores
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => useAppStore.getState().setCurrentView('sales')}>
                    💰 Historial Ventas
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 size-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <h1 className="flex-1 text-sm font-semibold text-foreground truncate">
              {viewLabels[currentView]}
            </h1>

            {/* Workshop Switcher */}
            {workshops.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden sm:flex gap-2 max-w-[180px] h-8 text-xs">
                    <Building2 className="size-3.5 shrink-0 text-primary" />
                    <span className="truncate">
                      {currentWorkshopId
                        ? workshops.find((w) => w.id === currentWorkshopId)?.name || 'Taller'
                        : 'Todos los Talleres'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={() => setCurrentWorkshopId(null)}
                    className={!currentWorkshopId ? 'bg-accent' : ''}
                  >
                    <Building2 className="mr-2 size-4" />
                    Todos los Talleres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {workshops.map((w) => (
                    <DropdownMenuItem
                      key={w.id}
                      onClick={() => setCurrentWorkshopId(w.id)}
                      className={currentWorkshopId === w.id ? 'bg-accent' : ''}
                    >
                      <Building2 className="mr-2 size-4 text-primary" />
                      {w.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

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
                    {user?.image ? (
                      <AvatarImage src={user.image} alt={user.name} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="size-8">
                    {user?.image ? (
                      <AvatarImage src={user.image} alt={user.name} />
                    ) : null}
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

          {/* Main Content - bottom padding on mobile for bottom nav */}
          <main className="flex flex-1 flex-col overflow-auto pb-16 md:pb-0">
            <ViewRenderer currentView={currentView} />
          </main>
        </SidebarInset>
      </SidebarProvider>

      {/* Mobile Bottom Navigation - hidden on desktop */}
      <MobileNav />
    </>
  )
}
