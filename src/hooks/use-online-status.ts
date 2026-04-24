'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { SyncManagerService } from '@/lib/sync-manager'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true)
  const [wasOffline, setWasOffline] = useState(false)
  const initialRef = useRef(true)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Set initial state on mount (not via effect setState)
    if (initialRef.current) {
      initialRef.current = false
    }

    const handleOnline = () => {
      setIsOnline(true)
      // Trigger sync when coming back online
      SyncManagerService.getInstance().syncAll()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const triggerSync = useCallback(async () => {
    if (isOnline) {
      await SyncManagerService.getInstance().syncAll()
    }
  }, [isOnline])

  return { isOnline, wasOffline, triggerSync }
}
