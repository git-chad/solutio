import { Container } from "@/components/ui/container"
import { Image } from "@/components/ui/image"
import { Typography } from "@/components/ui/typography"

export function Statement() {
  return (
    <section className="relative mt-section flex tablet:h-140 min-h-96 w-full items-end overflow-clip">
      <Image
        src="/images/banner-desk.webp"
        alt=""
        fill
        mobileSize="100vw"
        desktopSize="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-solutio-bg/60" />

      <Container className="py-12 tablet:pb-16">
        <Typography variant="heading-2" className="max-w-[45rem] text-pretty">
          We solve complex problems because we know how. And beyond that, we
          help preserve value, bring clarity to the present and shape the
          future.
        </Typography>
      </Container>
    </section>
  )
}
