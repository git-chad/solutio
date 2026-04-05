import { Container } from "@/components/ui/container"
import { Image } from "@/components/ui/image"
import { Typography } from "@/components/ui/typography"

export function Statement() {
  return (
    <section className="relative mt-[6.25rem] flex h-[35rem] w-full items-end overflow-clip">
      <Image
        src="/images/banner-desk.webp"
        alt=""
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[#0A0A0A]/60" />

      <Container className="pb-16">
        <Typography variant="heading-2" className="max-w-[45rem]">
          We solve complex problems because we know how. And beyond that, we
          help preserve value, bring clarity to the present and shape the
          future.
        </Typography>
      </Container>
    </section>
  )
}
