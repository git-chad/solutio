import { useMedia } from "react-use"

const BREAKPOINTS = {
  "desktop-large": 1920,
  desktop: 1440,
  "tablet-lg": 1024,
  tablet: 768,
  mobile: 640,
} as const

/**
 * Hook for detecting if the viewport is at a specific breakpoint.
 *
 * @param breakpoint - The breakpoint to detect
 * @returns True if the viewport is at the breakpoint
 */
export function useMediaBreakpoint(
  breakpoint: keyof typeof BREAKPOINTS,
  defaultState = false
) {
  return useMedia(`(min-width: ${BREAKPOINTS[breakpoint]}px)`, defaultState)
}
