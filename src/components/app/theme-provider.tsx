'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'
import {
  themes,
  defaultTheme,
  COLOR_THEME_STORAGE_KEY,
  COLOR_THEME_SETTINGS_KEY,
  type ThemeName,
  type ThemeDefinition,
  type ThemeVariables,
} from '@/lib/themes'

// ============================================================
// Color Theme Context
// ============================================================

interface ColorThemeContextValue {
  /** Currently active color theme name */
  theme: ThemeName
  /** Set the active color theme */
  setTheme: (theme: ThemeName) => void
  /** All available theme definitions */
  themes: Record<ThemeName, ThemeDefinition>
}

const ColorThemeContext = React.createContext<ColorThemeContextValue>({
  theme: defaultTheme,
  setTheme: () => {},
  themes,
})

// ============================================================
// Helper: Apply CSS variables to document root
// ============================================================

function applyThemeVariables(variables: ThemeVariables) {
  const root = document.documentElement
  for (const [key, value] of Object.entries(variables)) {
    root.style.setProperty(`--${key}`, value)
  }
}

// ============================================================
// Color Theme Provider (inner component, must be inside NextThemesProvider)
// ============================================================

function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<ThemeName>(defaultTheme)
  const [mounted, setMounted] = React.useState(false)
  const { resolvedTheme } = useTheme()

  // Initialize theme from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(COLOR_THEME_STORAGE_KEY)
      if (saved && saved in themes) {
        setThemeState(saved as ThemeName)
      } else {
        // Try to fetch from settings API
        fetch('/api/settings')
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.data?.[COLOR_THEME_SETTINGS_KEY]) {
              const serverTheme = data.data[COLOR_THEME_SETTINGS_KEY]
              if (serverTheme in themes) {
                setThemeState(serverTheme as ThemeName)
                localStorage.setItem(COLOR_THEME_STORAGE_KEY, serverTheme)
              }
            }
          })
          .catch(() => {
            // Silently ignore API errors during initialization
          })
      }
    } catch {
      // localStorage not available
    }
    setMounted(true)
  }, [])

  // Apply CSS variables whenever theme or mode changes
  React.useEffect(() => {
    if (!mounted) return

    const themeDef = themes[theme]
    if (!themeDef) return

    const isDark = resolvedTheme === 'dark'
    const variables = isDark ? themeDef.dark : themeDef.light

    applyThemeVariables(variables)

    // Update meta theme-color to match the current primary
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeDef.primaryColor)
    }
  }, [theme, resolvedTheme, mounted])

  const setTheme = React.useCallback((newTheme: ThemeName) => {
    if (newTheme in themes) {
      setThemeState(newTheme)

      // Persist to localStorage for instant loading next time
      try {
        localStorage.setItem(COLOR_THEME_STORAGE_KEY, newTheme)
      } catch {
        // localStorage not available
      }

      // Persist to settings API (fire and forget)
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: COLOR_THEME_SETTINGS_KEY,
          value: newTheme,
        }),
      }).catch(() => {
        // Silently ignore API errors
      })
    }
  }, [])

  const contextValue = React.useMemo(
    () => ({
      theme,
      setTheme,
      themes,
    }),
    [theme, setTheme],
  )

  return (
    <ColorThemeContext.Provider value={contextValue}>
      {children}
    </ColorThemeContext.Provider>
  )
}

// ============================================================
// Main ThemeProvider (wraps both next-themes and color theme)
// ============================================================

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ColorThemeProvider>{children}</ColorThemeProvider>
    </NextThemesProvider>
  )
}

// ============================================================
// Hook: useColorTheme
// ============================================================

export function useColorTheme(): ColorThemeContextValue {
  const context = React.useContext(ColorThemeContext)
  if (!context) {
    throw new Error('useColorTheme must be used within a ThemeProvider')
  }
  return context
}
