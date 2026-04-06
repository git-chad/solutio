import { Button } from "@/components/ui/button"
// import { Image } from "@/components/ui/image"
import { Typography } from "@/components/ui/typography"
import { HeroComposition } from "@/components/webgpu/hero-composition"

export function Hero() {
  return (
    <section className="relative flex h-screen max-h-[900px] w-full items-center justify-center overflow-clip">
      {/* Background image */}
      {/* <Image
        src="/images/hero-bg.webp"
        alt="Hero background"
        fill
        preload
        className="object-cover"
      /> */}

      <div className="absolute inset-0">
        <HeroComposition />
      </div>

      {/* Gradient overlay */}
      {/* <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A4D] to-[#0A0A0AD9]" /> */}

      {/* Content */}
      <div className="relative z-1 flex flex-col items-center gap-7">
        <Typography variant="label">
          Tax Advisory & Strategic Counsel
        </Typography>

        <Typography variant="heading-1" className="max-w-[464px] text-center">
          The value lies in how.{"\n"}We know how.
        </Typography>

        <Typography variant="body" className="max-w-[480px] text-center">
          We advise companies, individuals and families on complex tax and
          financial decisions, combining experience, judgment and strategic
          insight.
        </Typography>

        <Button variant="primary" href="#contact" className="mt-2">
          Talk to us
        </Button>
      </div>
    </section>
  )
}
