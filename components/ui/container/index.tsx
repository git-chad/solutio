import { cn } from "@/lib/styles/cn"

type ContainerProps = {
  as?: React.ElementType
  className?: string
  children?: React.ReactNode
}

export function Container({
  as: Component = "div",
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn("relative mx-auto w-full max-w-[90rem] px-safe", className)}
      {...props}
    >
      {children}
    </Component>
  )
}
