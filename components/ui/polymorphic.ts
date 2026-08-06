import type { ComponentType, ElementType } from "react"

/**
 * Resolves the `as` prop of a polymorphic component into something JSX will
 * accept.
 *
 * `React.ElementType` is not usable directly as a JSX tag: React 19 types give
 * `JSX.IntrinsicElements` an `Uncapitalize<string>` index signature so custom
 * elements typecheck, which means `keyof JSX.IntrinsicElements` is a string
 * *pattern* rather than a union of literals. TypeScript cannot resolve a call
 * signature for it and reports TS2604.
 *
 * Casting to a component type is the escape hatch — React accepts both a tag
 * string and a component at runtime, so this is safe. It is narrower than the
 * `@ts-expect-error` it replaces, which suppressed every error on the line.
 */
export function resolveAs(
  as: ElementType | undefined,
  fallback: ElementType
): // biome-ignore lint/suspicious/noExplicitAny: props vary per rendered element
ComponentType<any> {
  // biome-ignore lint/suspicious/noExplicitAny: see above
  return (as ?? fallback) as ComponentType<any>
}
