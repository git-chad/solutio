import { Typography } from "@/components/ui/typography"
import { cn } from "@/lib/styles/cn"

/**
 * The eyebrow label above a section heading, and the hero's tagline.
 *
 * `w-fit` matters: these sit inside `flex flex-col` blocks whose children
 * stretch by default, so without it the pill would run the full column width
 * and stop reading as a pill at all.
 *
 * The backdrop blur is what lets one treatment work in both places — over the
 * flat sections it does nothing visible, and over the hero photograph it
 * separates the pill from the image behind it without needing a heavier fill.
 */
export function SectionLabel({
  children,
  className,
  dot = true,
}: {
  children: React.ReactNode
  className?: string
  /** The pulsing marker. Off for the hero, where the pill stands alone. */
  dot?: boolean
}) {
  return (
    <div
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-full border border-solutio-card-border bg-solutio-card px-3.5 py-1.5 backdrop-blur-sm",
        className
      )}
    >
      {dot && (
        <span className="pulse-dot size-1.5 shrink-0 rounded-full bg-solutio-text-label" />
      )}
      <Typography variant="label">{children}</Typography>
    </div>
  )
}
