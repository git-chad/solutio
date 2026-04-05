import { Typography } from "@/components/ui/typography"

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="pulse-dot size-1.5 rounded-full bg-solutio-text-label" />
      <Typography variant="label">{children}</Typography>
    </div>
  )
}
