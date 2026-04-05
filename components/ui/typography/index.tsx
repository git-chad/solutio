import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/styles/cn"

const typographyVariants = cva("", {
  variants: {
    variant: {
      "heading-1":
        "font-serif text-[4.5rem]/[4.75rem] text-white tracking-[-0.156rem]",
      "heading-2":
        "font-serif text-[3.5rem]/[3.75rem] text-white tracking-[-0.125rem]",
      "heading-3":
        "font-serif text-[2.5rem]/[2.75rem] text-white tracking-[-0.094rem]",
      body: "text-base/[1.625rem] text-solutio-text-muted",
      "body-strong": "text-base/[1.625rem] text-solutio-text-body",
      label: "font-medium text-[0.75rem]/[1rem] text-solutio-text-label",
      caption: "text-[0.875rem]/[1.25rem] text-solutio-text-subtle",
    },
  },
  defaultVariants: {
    variant: "body",
  },
})

type TypographyVariant = NonNullable<
  VariantProps<typeof typographyVariants>["variant"]
>

const defaultElements: Record<TypographyVariant, React.ElementType> = {
  "heading-1": "h1",
  "heading-2": "h2",
  "heading-3": "h3",
  body: "p",
  "body-strong": "p",
  label: "span",
  caption: "span",
}

type TypographyProps = VariantProps<typeof typographyVariants> & {
  as?: React.ElementType
  className?: string
  children?: React.ReactNode
}

export function Typography({
  variant = "body",
  as,
  className,
  children,
  ...props
}: TypographyProps) {
  // biome-ignore lint/suspicious/noExplicitAny: polymorphic component
  const Component: any = as ?? defaultElements[variant!]

  return (
    <Component
      className={cn(typographyVariants({ variant }), className)}
      {...props}
    >
      {children}
    </Component>
  )
}
