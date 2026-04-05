import { Container } from "@/components/ui/container"
import { SectionLabel } from "@/components/ui/section-label"
import { Typography } from "@/components/ui/typography"

const services = [
  "Strategic tax planning",
  "Corporate and wealth structuring",
  "Personal and family investment advisory",
  "Tax risk assessment",
  "Succession planning and wealth organization",
  "Support in audits and tax controversy",
]

export function Services() {
  return (
    <Container as="section" className="flex flex-col gap-10 pt-[6.25rem]">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-4">
          <SectionLabel>What We Do</SectionLabel>
          <Typography variant="heading-2" className="max-w-[31.25rem]">
            Built to handle complexity.
          </Typography>
        </div>

        <Typography variant="body" className="max-w-[23.75rem] text-right">
          We advise companies, individuals and families on high-impact tax and
          financial decisions, both locally and internationally.
        </Typography>
      </div>

      <div className="flex flex-wrap gap-4">
        {services.map((service, i) => (
          <div
            key={service}
            className="flex min-h-[12.5rem] flex-[1_1_30%] flex-col justify-between rounded-[1rem] border border-solutio-card-border bg-solutio-card p-7"
          >
            <Typography
              variant="caption"
              className="text-solutio-text-ghost"
            >
              {String(i + 1).padStart(2, "0")}
            </Typography>
            <Typography variant="body-strong">{service}</Typography>
          </div>
        ))}
      </div>
    </Container>
  )
}
