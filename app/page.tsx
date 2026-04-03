import { Wrapper } from "@/components/layout/wrapper"
import DynamicCanvas from "@/components/webgl/canvas/dynamic"

export default function Home() {
  return (
    <Wrapper theme="dark">
      <DynamicCanvas />
    </Wrapper>
  )
}
