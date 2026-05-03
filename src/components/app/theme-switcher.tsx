'use client'

import { useColorTheme } from '@/components/app/theme-provider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Palette, Check } from 'lucide-react'
import { type ThemeName } from '@/lib/themes'

/** Ordered list of theme names for display */
const themeOrder: ThemeName[] = [
  'taller-clasico',
  'tech-moderno',
  'vino-taller',
  'taller-salvia',
  'forja-oscura',
]

export function ThemeSwitcher() {
  const { theme, setTheme, themes } = useColorTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label="Cambiar tema de colores"
        >
          <Palette className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Temas de Color</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themeOrder.map((themeName) => {
          const themeDef = themes[themeName]
          const isActive = theme === themeName

          return (
            <DropdownMenuItem
              key={themeName}
              onClick={() => setTheme(themeName)}
              className="flex items-center gap-2 cursor-pointer"
            >
              {/* Colored dot preview */}
              <span
                className="size-3 rounded-full shrink-0 ring-1 ring-black/10 dark:ring-white/10"
                style={{ backgroundColor: themeDef.primaryColor }}
              />
              {/* Theme info */}
              <span className="flex-1 flex flex-col gap-0">
                <span className="text-sm font-medium leading-tight">
                  {themeDef.label}
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight line-clamp-1">
                  {themeDef.description}
                </span>
              </span>
              {/* Active checkmark */}
              {isActive && (
                <Check className="size-4 text-primary shrink-0 ml-1" />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
