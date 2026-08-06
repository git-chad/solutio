import { resolveAs } from "@/components/ui/polymorphic"
import { cn } from "@/lib/styles/cn"

type ContainerProps = React.ComponentPropsWithoutRef<"div"> & {
  /** Element to render as. Defaults to `div`. */
  as?: React.ElementType
}

/**
 * Caps content at the layout width and applies the shared horizontal inset.
 * Everything that needs to sit on the page grid — including the header — goes
 * through this so the left edge is identical everywhere.
 */
export function Container({
  as,
  className,
  children,
  ...props
}: ContainerProps) {
  const Component = resolveAs(as, "div")

  return (
    <Component
      className={cn("relative mx-auto w-full max-w-[90rem] px-safe", className)}
      {...props}
    >
      {children}
    </Component>
  )
}
