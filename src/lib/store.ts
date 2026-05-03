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
  | 'employees'
  | 'daily-closing'
  | 'customers'
  | 'reports'
  | 'expenses'
  | 'settings'
  | 'audit'
  | 'workshops'
  | 'workshop-bi'
  | 'backup'

export interface UserInfo {
  id: string
  email: string
  name: string
  role: string
  image?: string | null
}

export interface WorkshopInfo {
  id: string
  name: string
  slug: string
  role: string
  active: boolean
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

  // Mobile nav badges
  cartItemCount: number
  setCartItemCount: (count: number) => void
  pendingRepairsCount: number
  setPendingRepairsCount: (count: number) => void

  // Workshop multi-tenancy
  currentWorkshopId: string | null
  setCurrentWorkshopId: (id: string | null) => void
  workshops: WorkshopInfo[]
  setWorkshops: (workshops: WorkshopInfo[]) => void
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

  // Mobile nav badges
  cartItemCount: 0,
  setCartItemCount: (count) => set({ cartItemCount: count }),
  pendingRepairsCount: 0,
  setPendingRepairsCount: (count) => set({ pendingRepairsCount: count }),

  // Workshop multi-tenancy
  currentWorkshopId: null,
  setCurrentWorkshopId: (id) => set({ currentWorkshopId: id }),
  workshops: [],
  setWorkshops: (workshops) => set({ workshops }),
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
  employees: 'Empleados',
  'daily-closing': 'Cierre Diario',
  customers: 'Clientes',
  reports: 'Reportes',
  expenses: 'Gastos',
  settings: 'Configuración',
  audit: 'Auditoría',
  workshops: 'Talleres',
  'workshop-bi': 'BI Taller',
  backup: 'Backup',
}
