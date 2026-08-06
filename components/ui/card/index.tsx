import { cva, type VariantProps } from "class-variance-authority"
import { resolveAs } from "@/components/ui/polymorphic"
import { Typography } from "@/components/ui/typography"
import { cn } from "@/lib/styles/cn"

/**
 * The single translucent surface used across the page.
 *
 * `card` is the small, repeated tile (services, values); `panel` is the large
 * standalone block (the about copy). They differ only in radius and padding —
 * the fill and border are shared so every surface reads as one material.
 */
const cardVariants = cva("border border-solutio-card-border bg-solutio-card", {
  variants: {
    variant: {
      card: "rounded-card p-6 tablet:p-7",
      panel: "rounded-panel p-7 tablet:p-10",
    },
  },
  defaultVariants: {
    variant: "card",
  },
})

type CardProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof cardVariants> & {
    /** Element to render as. Defaults to `div`. */
    as?: React.ElementType
  }

export function Card({ as, variant, className, ...props }: CardProps) {
  const Component = resolveAs(as, "div")

  return (
    <Component
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
}

/**
 * Card with a zero-padded index above its label. Shared by the services and
 * values grids so both tiles keep the same internal rhythm.
 */
export function NumberedCard({
  index,
  className,
  children,
  ...props
}: Omit<CardProps, "variant"> & {
  /** Zero-based; rendered one-based and zero-padded. */
  index: number
}) {
  return (
    <Card
      className={cn(
        "flex min-h-40 tablet:min-h-50 flex-col justify-between gap-8",
        className
      )}
      {...props}
    >
      <Typography
        variant="caption"
        className="font-mono text-solutio-text-ghost tabular-nums"
      >
        {String(index + 1).padStart(2, "0")}
      </Typography>
      <Typography variant="body-strong">{children}</Typography>
    </Card>
  )
}
