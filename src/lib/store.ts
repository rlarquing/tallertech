import { create } from 'zustand'

export type ViewType =
  | 'dashboard'
  | 'inventory'
  | 'products'
  | 'categories'
  | 'suppliers'
  | 'sales'
  | 'pos'
  | 'repairs'
  | 'customers'
  | 'reports'
  | 'expenses'
  | 'settings'

export interface UserInfo {
  id: string
  email: string
  name: string
  role: string
}

interface AppState {
  // Navigation
  currentView: ViewType
  setCurrentView: (view: ViewType) => void

  // Auth
  user: UserInfo | null
  setUser: (user: UserInfo | null) => void
  isAuthenticated: boolean

  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Mobile
  isMobile: boolean
  setIsMobile: (mobile: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view }),

  // Auth
  user: null,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  isAuthenticated: false,

  // Sidebar
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Mobile
  isMobile: false,
  setIsMobile: (mobile) => set({ isMobile: mobile }),
}))

// View labels in Spanish
export const viewLabels: Record<ViewType, string> = {
  dashboard: 'Panel Principal',
  inventory: 'Inventario',
  products: 'Productos',
  categories: 'Categorías',
  suppliers: 'Proveedores',
  sales: 'Ventas',
  pos: 'Nueva Venta',
  repairs: 'Reparaciones',
  customers: 'Clientes',
  reports: 'Reportes',
  expenses: 'Gastos',
  settings: 'Configuración',
}
