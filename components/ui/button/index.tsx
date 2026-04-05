import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/styles/cn"
import { Link } from "@/components/ui/link"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-full font-medium transition-opacity",
  {
    variants: {
      variant: {
        primary:
          "bg-white px-7 py-3.5 text-sm/[18px] text-solutio-bg",
        ghost:
          "bg-solutio-ghost px-[18px] py-2 text-[13px]/4 text-white",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
)

type ButtonProps = VariantProps<typeof buttonVariants> &
  React.ComponentProps<typeof Link>

export function Button({ variant, className, ...props }: ButtonProps) {
  return (
    <Link className={cn(buttonVariants({ variant }), className)} {...props} />
  )
}
