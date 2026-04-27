'use client'

import React from 'react'
import { useAppStore, type ViewType } from '@/lib/store'
import {
  Home,
  Package,
  ShoppingCart,
  Wrench,
  Users,
  Building2,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface NavItem {
  view: ViewType
  label: string
  icon: React.ElementType
  badge?: number
}

export function MobileNav() {
  const { currentView, setCurrentView, cartItemCount, pendingRepairsCount } = useAppStore()

  const navItems: NavItem[] = [
    { view: 'dashboard', label: 'Inicio', icon: Home },
    { view: 'products', label: 'Inventario', icon: Package },
    { view: 'pos', label: 'Venta', icon: ShoppingCart, badge: cartItemCount },
    { view: 'repairs', label: 'Reparar', icon: Wrench, badge: pendingRepairsCount },
    { view: 'workshops', label: 'Talleres', icon: Building2 },
  ]

  const isActive = (view: ViewType) => {
    if (view === 'dashboard') return currentView === 'dashboard'
    if (view === 'products') return ['products', 'categories', 'suppliers', 'inventory'].includes(currentView)
    if (view === 'pos') return currentView === 'pos' || currentView === 'sales'
    if (view === 'repairs') return currentView === 'repairs'
    if (view === 'workshops') return ['workshops', 'workshop-bi'].includes(currentView)
    return false
  }

  return (
    <nav
      className="flex md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex w-full items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item.view)
          const Icon = item.icon

          return (
            <button
              key={item.view}
              onClick={() => setCurrentView(item.view)}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-[44px] min-h-[44px] transition-colors duration-200 active:scale-95"
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <div className="relative">
                {active ? (
                  <motion.div
                    layoutId="mobileNavIcon"
                    className="flex items-center justify-center"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <Icon className="size-5 text-primary dark:text-primary" strokeWidth={2.5} />
                  </motion.div>
                ) : (
                  <Icon className="size-5 text-muted-foreground" strokeWidth={1.5} />
                )}

                {/* Badge */}
                {item.badge !== undefined && item.badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-2.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-primary text-[10px] font-bold text-white leading-none"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </motion.span>
                )}
              </div>

              <span
                className={`text-[10px] font-medium leading-tight transition-colors duration-200 ${
                  active
                    ? 'text-primary dark:text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>

              {/* Active indicator dot */}
              {active && (
                <motion.div
                  layoutId="mobileNavDot"
                  className="absolute -bottom-0 w-1 h-1 rounded-full bg-primary dark:bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
