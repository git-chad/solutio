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
      <section
        id="how-we-work"
        className="relative mt-section flex tablet:h-120 min-h-80 w-full items-end overflow-clip"
      >
        <Image
          src="/images/banner-blur.webp"
          alt=""
          fill
          mobileSize="100vw"
          desktopSize="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-solutio-bg/70" />

        <Container className="flex flex-col gap-4 py-12 tablet:pb-14">
          <SectionLabel>How We Work</SectionLabel>
          <Typography variant="heading-2" className="max-w-[43.75rem]">
            We do not operate in volume. We think. We design. We advise.
          </Typography>
        </Container>
      </section>

      {/* Approach */}
      <Container
        as="section"
        className="flex tablet-lg:flex-row flex-col items-stretch justify-between gap-10 tablet-lg:gap-18 py-12 tablet-lg:py-18"
      >
        <div className="flex flex-1 flex-col justify-between">
          <Typography variant="body" className="mb-4 max-w-[32.5rem]">
            We work directly and confidentially with our clients &mdash;both
            corporate teams and individuals/families&mdash; tailoring each
            solution to the specific nature of the situation.
          </Typography>

          <ul>
            {approaches.map((item, i) => (
              <li
                key={item}
                className="flex items-baseline gap-5 tablet:gap-7 border-solutio-card-border border-t py-5 tablet:py-[1.375rem]"
              >
                <Typography
                  variant="heading-3"
                  as="span"
                  className="text-solutio-text-ghost tabular-nums"
                >
                  {String(i + 1).padStart(2, "0")}
                </Typography>
                <Typography variant="body-strong">{item}</Typography>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative aspect-3/4 tablet-lg:aspect-auto tablet-lg:h-130 tablet-lg:w-[23.25rem] w-full shrink-0 overflow-hidden rounded-panel">
          <Image
            src="/images/approach.webp"
            alt="An advisor reviewing documents at a desk"
            fill
            aspectRatio={3 / 4}
            mobileSize="100vw"
            desktopSize="25vw"
            className="object-cover"
          />
        </div>
      </Container>
    </>
  )
}
