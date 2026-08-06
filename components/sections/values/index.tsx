import { NumberedCard } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { Reveal } from "@/components/ui/reveal"
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
    <Container
      as="section"
      id="values"
      className="flex flex-col gap-8 tablet:gap-12 pt-section"
    >
      <div className="flex flex-col gap-4">
        <Reveal>
          <SectionLabel>Our Value</SectionLabel>
        </Reveal>
        <Reveal delay={90}>
          <Typography variant="heading-2" className="max-w-[42.5rem]">
            In an increasingly complex tax environment, the real difference lies
            in the quality of judgment.
          </Typography>
        </Reveal>
      </div>

      <ul className="grid desktop:grid-cols-4 grid-cols-1 tablet:grid-cols-2 gap-4">
        {values.map((value, i) => (
          <Reveal as="li" key={value} delay={i * 70}>
            <NumberedCard index={i}>{value}</NumberedCard>
          </Reveal>
        ))}
      </ul>
    </Container>
  )
}
