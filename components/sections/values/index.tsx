import { Container } from "@/components/ui/container"
import { SectionLabel } from "@/components/ui/section-label"
import { Typography } from "@/components/ui/typography"

const values = [
  "Senior-level involvement in every interaction",
  "Independent judgment",
  "A practical, results-oriented approach",
  "A comprehensive understanding of business and wealth",
]

export function Values() {
  return (
    <Container as="section" className="flex flex-col gap-12 pt-[7.5rem]">
      <div className="flex flex-col gap-4">
        <SectionLabel>Our Value</SectionLabel>
        <Typography variant="heading-2" className="max-w-[42.5rem]">
          In an increasingly complex tax environment, the real difference lies
          in the quality of judgment.
        </Typography>
      </div>

      <div className="flex gap-4">
        {values.map((value, i) => (
          <div
            key={value}
            className="flex flex-1 flex-col gap-4 rounded-[1rem] border border-solutio-card-border bg-solutio-card p-7"
          >
            <Typography
              variant="caption"
              className="text-solutio-text-ghost"
            >
              {String(i + 1).padStart(2, "0")}
            </Typography>
            <Typography variant="body-strong">{value}</Typography>
          </div>
        ))}
      </div>
    </Container>
  )
}
