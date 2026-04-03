"use client"

import { usePathname } from "next/navigation"
import { createContext, useContext, useEffect, useState } from "react"

export type ThemeName = "light" | "dark"

export const ThemeContext = createContext<{
  name: ThemeName
  setThemeName: (theme: ThemeName) => void
}>({
  name: "light",
  setThemeName: () => {
    void 0
  },
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function Theme({
  children,
  theme,
  global,
}: {
  children: React.ReactNode
  theme: ThemeName
  global?: boolean
}) {
  const pathname = usePathname()

  const [currentTheme, setCurrentTheme] = useState(theme)

  useEffect(() => {
    setCurrentTheme(theme)
  }, [theme])

  // biome-ignore lint/correctness/useExhaustiveDependencies: we need to trigger on path change
  useEffect(() => {
    if (global) {
      document.documentElement.setAttribute("data-theme", currentTheme)
    }
  }, [pathname, currentTheme, global])

  return (
    <>
      {global && /^[a-z]+$/.test(currentTheme) && (
        <script>
          {`document.documentElement.setAttribute('data-theme', '${currentTheme}');`}
        </script>
      )}
      <ThemeContext.Provider
        value={{
          name: currentTheme,
          setThemeName: setCurrentTheme,
        }}
      >
        {children}
      </ThemeContext.Provider>
    </>
  )
}
