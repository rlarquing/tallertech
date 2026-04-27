'use client'

import React, { useState, useEffect, useRef } from 'react'
import { WifiOff, Wifi, Loader2, CheckCircle2, CloudOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { useSync } from '@/hooks/use-sync'
import { AnimatePresence, motion } from 'framer-motion'

export function OfflineBanner() {
  const { isOnline } = useOnlineStatus()
  const { pendingCount, isSyncing, syncNow } = useSync()
  const [showSynced, setShowSynced] = useState(false)
  const prevOnlineRef = useRef(isOnline)

  // Show "synced" message briefly when coming back online
  useEffect(() => {
    if (isOnline && !prevOnlineRef.current) {
      // We just came back online - sync will trigger automatically
      const timer = setTimeout(() => setShowSynced(false), 3000)
      prevOnlineRef.current = isOnline
      return () => clearTimeout(timer)
    }
    prevOnlineRef.current = isOnline
  }, [isOnline])

  const handleSync = async () => {
    await syncNow()
    if (pendingCount > 0) {
      // If there were items, show confirmation
      setShowSynced(true)
      setTimeout(() => setShowSynced(false), 3000)
    }
  }

  // Don't render anything on the server
  if (typeof window === 'undefined') return null

  return (
    <AnimatePresence>
      {!isOnline || pendingCount > 0 || showSynced ? (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center"
        >
          <div
            className={`w-full px-3 py-2 text-sm font-medium flex items-center justify-center gap-2 shadow-md ${
              showSynced
                ? 'bg-primary text-primary-foreground'
                : !isOnline
                  ? 'bg-amber-500 text-white'
                  : 'bg-primary text-primary-foreground'
            }`}
          >
            {!isOnline ? (
              // Offline state
              <>
                <WifiOff className="h-4 w-4 shrink-0" />
                <span>Sin conexión — Trabajando offline</span>
                {pendingCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    <CloudOff className="h-3 w-3" />
                    {pendingCount} cambio{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
                  </span>
                )}
              </>
            ) : isSyncing ? (
              // Syncing state
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                <span>Sincronizando datos...</span>
              </>
            ) : showSynced ? (
              // Sync complete state
              <>
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>¡Datos sincronizados!</span>
              </>
            ) : (
              // Online with pending items
              <>
                <Wifi className="h-4 w-4 shrink-0" />
                <span>
                  {pendingCount} cambio{pendingCount !== 1 ? 's' : ''} por sincronizar
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="ml-2 h-7 bg-white/20 text-white hover:bg-white/30 hover:text-white border-0 text-xs"
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Sincronizar
                </Button>
              </>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
