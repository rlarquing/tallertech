# Task pwa-5: Mobile Navigation

## Work Completed

### Files Created
- `/home/z/my-project/src/components/app/mobile-nav.tsx` - Fixed bottom navigation bar

### Files Modified
- `/home/z/my-project/src/lib/store.ts` - Added cartItemCount and pendingRepairsCount
- `/home/z/my-project/src/components/app/app-shell.tsx` - Mobile-first responsive layout
- `/home/z/my-project/src/components/app/pos-view.tsx` - Sync cart count with store
- `/home/z/my-project/src/components/app/repairs-view.tsx` - Sync pending repairs count with store
- `/home/z/my-project/src/components/app/pwa-install-prompt.tsx` - Position above bottom nav on mobile
- `/home/z/my-project/src/app/globals.css` - Safe area utilities and scrollbar styles

### Key Design Decisions
1. Single responsive layout (no duplicate view rendering) using CSS show/hide
2. Desktop: Sidebar + header with SidebarTrigger
3. Mobile: Hidden sidebar, hamburger dropdown for secondary nav, bottom nav for primary
4. Bottom nav: 5 tabs (Inicio, Inventario, Venta, Reparar, Clientes) with badges
5. framer-motion for smooth tab transition animations
6. Safe area support for iOS devices
7. Zustand store for cross-component badge state (cartItemCount, pendingRepairsCount)

### Lint Status
All modified files pass ESLint with no errors. Pre-existing lint issues in other agents' files (offline-banner.tsx, pwa-install-prompt.tsx, use-online-status.ts, offline-fetch.ts) are not from this task.
