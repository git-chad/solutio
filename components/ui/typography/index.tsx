import { cva, type VariantProps } from "class-variance-authority"
import { resolveAs } from "@/components/ui/polymorphic"
import { cn } from "@/lib/styles/cn"

/**
 * Display sizes step up at `tablet` and again at `desktop`. Tracking tightens
 * as the type grows — the negative tracking a 4.5rem serif needs would close
 * up the same face at mobile sizes.
 */
const typographyVariants = cva("", {
  variants: {
    variant: {
      "heading-1":
        "font-serif desktop:text-[5.25rem]/[5.375rem] tablet:text-[4rem]/[4.25rem] text-[3rem]/[3.125rem] text-white desktop:tracking-[-0.18rem] tablet:tracking-[-0.125rem] tracking-[-0.082rem]",
      "heading-2":
        "font-serif desktop:text-[3.5rem]/[3.75rem] tablet:text-[2.875rem]/[3.125rem] text-[2.25rem]/[2.5rem] text-white desktop:tracking-[-0.125rem] tablet:tracking-[-0.09rem] tracking-[-0.06rem]",
      "heading-3":
        "font-serif desktop:text-[2.5rem]/[2.75rem] tablet:text-[2.125rem]/[2.375rem] text-[1.75rem]/[2rem] text-white desktop:tracking-[-0.094rem] tablet:tracking-[-0.07rem] tracking-[-0.05rem]",
      body: "tablet:text-base/[1.625rem] text-[0.9375rem]/[1.5rem] text-solutio-text-muted",
      "body-strong":
        "tablet:text-base/[1.625rem] text-[0.9375rem]/[1.5rem] text-solutio-text-body",
      label: "font-medium text-[0.8125rem]/[1.125rem] text-solutio-text-label",
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

type TypographyProps = React.ComponentPropsWithoutRef<"p"> & {
  variant?: TypographyVariant
  /** Override the element the variant maps to, without changing its styles. */
  as?: React.ElementType
}

export function Typography({
  variant = "body",
  as,
  className,
  children,
  ...props
}: TypographyProps) {
  const Component = resolveAs(as, defaultElements[variant])

  return (
    <Component
      className={cn(typographyVariants({ variant }), className)}
      {...props}
    >
      {children}
    </Component>
  )
}
