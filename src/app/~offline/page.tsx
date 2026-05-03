'use client'

import { WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <WifiOff className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Sin Conexión</h1>
          <p className="text-muted-foreground leading-relaxed">
            No hay conexión a internet en este momento. Los datos que ya tienes
            en caché siguen disponibles, pero no podrás realizar operaciones que
            requieran el servidor.
          </p>
        </div>
        <div className="space-y-3">
          <Button
            onClick={() => window.location.reload()}
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar Conexión
          </Button>
          <p className="text-xs text-muted-foreground">
            Los cambios que hiciste sin conexión se sincronizarán automáticamente
            cuando vuelva la conexión.
          </p>
        </div>
      </div>
    </div>
  )
}
