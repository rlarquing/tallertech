'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSyncQueue } from '@/lib/offline-db'
import { SyncManagerService } from '@/lib/sync-manager'

export function useSync() {
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  const refreshCount = useCallback(async () => {
    try {
      const queue = await getSyncQueue()
      setPendingCount(queue.length)
    } catch {
      // IndexedDB may not be available
    }
  }, [])

  useEffect(() => {
    refreshCount()
  }, [refreshCount])

  const syncNow = useCallback(async () => {
    setIsSyncing(true)
    try {
      await SyncManagerService.getInstance().syncAll()
      await refreshCount()
    } finally {
      setIsSyncing(false)
    }
  }, [refreshCount])

  return { pendingCount, isSyncing, syncNow, refreshCount }
}
