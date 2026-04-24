'use client'

import { SyncManagerService } from './sync-manager'

const CACHE_INITIALIZED_KEY = 'tallertech-cache-initialized'

/**
 * Initialize the offline cache on first successful login.
 * Fetches all data from the server and stores it in IndexedDB
 * so it's available when the user goes offline.
 */
export async function initializeOfflineCache(): Promise<void> {
  if (typeof window === 'undefined') return
  if (!navigator.onLine) return

  // Check if we already initialized the cache in this session
  const sessionKey = `${CACHE_INITIALIZED_KEY}-${Date.now().toString().slice(0, -5)}`
  const alreadyInitialized = sessionStorage.getItem(CACHE_INITIALIZED_KEY)

  if (alreadyInitialized) return

  try {
    await SyncManagerService.getInstance().refreshAllData()
    sessionStorage.setItem(CACHE_INITIALIZED_KEY, 'true')
    console.log('[TallerTech] Offline cache initialized successfully')
  } catch (error) {
    console.error('[TallerTech] Failed to initialize offline cache:', error)
  }

  // Avoid unused variable warning
  void sessionKey
}
