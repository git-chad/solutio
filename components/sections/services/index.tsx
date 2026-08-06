import { NumberedCard } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { Reveal } from "@/components/ui/reveal"
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
    <Container
      as="section"
      id="services"
      className="flex flex-col gap-8 tablet:gap-10 pt-section"
    >
      <div className="flex tablet-lg:flex-row flex-col items-start justify-between gap-6">
        <div className="flex flex-col gap-4">
          <Reveal>
            <SectionLabel>What We Do</SectionLabel>
          </Reveal>
          <Reveal delay={90}>
            <Typography variant="heading-2" className="max-w-[31.25rem]">
              Built to handle complexity.
            </Typography>
          </Reveal>
        </div>

        <Reveal delay={150} className="max-w-[23.75rem] tablet-lg:self-end">
          <Typography
            variant="body"
            className="text-pretty tablet-lg:text-right"
          >
            We advise companies, individuals and families on high-impact tax and
            financial decisions, both locally and internationally.
          </Typography>
        </Reveal>
      </div>

      <ul className="grid grid-cols-1 tablet-lg:grid-cols-3 tablet:grid-cols-2 gap-4">
        {services.map((service, i) => (
          <Reveal as="li" key={service} delay={i * 70}>
            <NumberedCard index={i}>{service}</NumberedCard>
          </Reveal>
        ))}
      </ul>
    </Container>
  )
}
