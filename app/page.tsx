import { Wrapper } from "@/components/layout/wrapper"
import { Hero } from "@/components/sections/hero"
import { About } from "@/components/sections/about"
import { Services } from "@/components/sections/services"
import { HowWeWork } from "@/components/sections/how-we-work"
import { Values } from "@/components/sections/values"
import { Statement } from "@/components/sections/statement"
import { CTA } from "@/components/sections/cta"

export default function Home() {
  return (
    <Wrapper theme="dark">
      <Hero />
      <About />
      <Services />
      <HowWeWork />
      <Values />
      <Statement />
      <CTA />
    </Wrapper>
  )
}
