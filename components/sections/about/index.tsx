import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { Reveal } from "@/components/ui/reveal"
import { Image } from "@/components/ui/image"
import { SectionLabel } from "@/components/ui/section-label"
import { Typography } from "@/components/ui/typography"

export function About() {
  return (
    <Container
      as="section"
      id="about"
      className="flex flex-col gap-8 tablet:gap-10 pt-section"
    >
      <div className="flex flex-col gap-4">
        <Reveal>
          <SectionLabel>Who We Are</SectionLabel>
        </Reveal>

        <Reveal delay={90}>
          <Typography variant="heading-2" className="max-w-[43.75rem]">
            More than four decades of judgment, vision, and the ability to
            anticipate.
          </Typography>
        </Reveal>
      </div>

      <div className="flex tablet-lg:flex-row flex-col gap-4 tablet-lg:gap-5">
        <Reveal className="flex flex-1">
          <Card
            variant="panel"
            className="flex flex-1 flex-col justify-center gap-6"
          >
            <Typography variant="body">
              We were founded on a clear conviction: today&apos;s tax challenges
              &mdash; for companies and individuals alike &mdash; require more
              than technical expertise. They demand judgment, vision and the
              ability to anticipate.
            </Typography>
            <Typography variant="body">
              Our team combines backgrounds in top-tier advisory firms and
              senior leadership roles within multinational organizations,
              allowing us to understand both corporate dynamics and the needs of
              individuals and families with complex wealth structures.
            </Typography>
          </Card>
        </Reveal>

        <Reveal
          delay={120}
          className="relative aspect-4/3 desktop:w-[33.75rem] tablet-lg:w-[28rem] w-full shrink-0 overflow-hidden rounded-panel"
        >
          <Image
            src="/images/about.webp"
            alt="Reading room with a wall of bound volumes"
            fill
            aspectRatio={4 / 3}
            mobileSize="100vw"
            desktopSize="34vw"
            className="object-cover"
          />
        </Reveal>
      </div>
    </Container>
  )
}
