'use client'

import React, { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AnimatePresence, motion } from 'framer-motion'

// BeforeInstallPromptEvent type
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'tallertech-pwa-dismissed'

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsStandalone(standalone)

    if (standalone) return

    // Check if user previously dismissed
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (dismissed) return

    // Listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setCanInstall(true)
      // Show prompt after a short delay
      setTimeout(() => setShowPrompt(true), 2000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice

      if (result.outcome === 'accepted') {
        // User accepted - no need to show again
        setShowPrompt(false)
      }
    } catch {
      // Prompt failed
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem(DISMISS_KEY, 'true')
  }

  // Don't show if already installed or no prompt available
  if (isStandalone || !canInstall) return null

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-20 left-4 right-4 z-[90] mx-auto max-w-sm md:bottom-4 sm:left-auto sm:right-4 sm:mx-0"
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background shadow-xl dark:from-primary/10 dark:to-background dark:border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">
                    Instalar TallerTech
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    Instala la app en tu dispositivo para usarla sin conexión y acceso rápido.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleInstall}
                      className="h-8 text-xs"
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Instalar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDismiss}
                      className="h-8 text-xs text-muted-foreground"
                    >
                      Después
                    </Button>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
