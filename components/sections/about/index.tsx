import { Container } from "@/components/ui/container"
import { Image } from "@/components/ui/image"
import { SectionLabel } from "@/components/ui/section-label"
import { Typography } from "@/components/ui/typography"

export function About() {
  return (
    <Container as="section" className="flex flex-col gap-10 pt-[6.25rem]">
      <div className="flex flex-col gap-4">
        <SectionLabel>Who We Are</SectionLabel>

        <Typography variant="heading-2" className="max-w-[43.75rem]">
          More than four decades of judgment, vision, and the ability to
          anticipate.
        </Typography>
      </div>

      <div className="flex gap-5">
        <div className="flex flex-1 flex-col gap-6 rounded-[1.25rem] border border-solutio-card-border bg-solutio-card-content p-10">
          <Typography variant="body">
            We were founded on a clear conviction: today&apos;s tax challenges
            &mdash; for companies and individuals alike &mdash; require more
            than technical expertise. They demand judgment, vision and the
            ability to anticipate.
          </Typography>
          <Typography variant="body">
            Our team combines backgrounds in top-tier advisory firms and senior
            leadership roles within multinational organizations, allowing us to
            understand both corporate dynamics and the needs of individuals and
            families with complex wealth structures.
          </Typography>
        </div>

        <div className="relative aspect-[4/3] w-[33.75rem] shrink-0 overflow-hidden rounded-[1.25rem]">
          <Image
            src="/images/about.webp"
            alt="Office bookshelf"
            fill
            className="size-full object-cover"
          />
        </div>
      </div>
    </Container>
  )
}
