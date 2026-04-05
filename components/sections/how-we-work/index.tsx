import { Container } from "@/components/ui/container"
import { Image } from "@/components/ui/image"
import { SectionLabel } from "@/components/ui/section-label"
import { Typography } from "@/components/ui/typography"

const approaches = [
  "Deep technical analysis",
  "Strategic perspective",
  "Close and confidential interaction",
  "A fully tailored approach",
]

export function HowWeWork() {
  return (
    <>
      {/* Banner */}
      <section className="relative mt-[6.25rem] flex h-[30rem] w-full items-end overflow-clip">
        <Image
          src="/images/banner-blur.webp"
          alt=""
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#0A0A0A]/70" />

        <Container className="flex flex-col gap-4 pb-14">
          <SectionLabel>How We Work</SectionLabel>
          <Typography variant="heading-2" className="max-w-[43.75rem]">
            We do not operate in volume. We think. We design. We advise.
          </Typography>
        </Container>
      </section>

      {/* Approach */}
      <Container
        as="section"
        className="flex items-stretch justify-between gap-[4.5rem] py-[4.5rem]"
      >
        <div className="flex flex-1 flex-col justify-between">
          <Typography variant="body" className="mb-4 max-w-[32.5rem]">
            We work directly and confidentially with our clients &mdash;both
            corporate teams and individuals/families&mdash; tailoring each
            solution to the specific nature of the situation.
          </Typography>

          {approaches.map((item, i) => (
            <div
              key={item}
              className="flex items-baseline gap-7 border-solutio-text-ghost/10 border-t py-[1.375rem]"
            >
              <Typography
                variant="heading-3"
                as="span"
                className="font-serif text-solutio-text-ghost"
              >
                {String(i + 1).padStart(2, "0")}
              </Typography>
              <Typography variant="body-strong">{item}</Typography>
            </div>
          ))}
        </div>

        <div className="relative h-[32.5rem] w-[23.25rem] shrink-0 overflow-hidden rounded-[1.25rem]">
          <Image
            src="/images/approach.webp"
            alt="Professional consultation"
            fill
            className="object-cover"
          />
        </div>
      </Container>
    </>
  )
}
