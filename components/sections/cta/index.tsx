import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { Typography } from "@/components/ui/typography"

export function CTA() {
  return (
    <Container as="section" className="py-12">
      <div className="flex h-158 items-end justify-between rounded-[1.25rem] bg-solutio-cta p-12">
        <div className="flex flex-col gap-2">
          <Typography variant="heading-2" as="h2">
            Schedule a conversation
          </Typography>
          <Typography variant="caption" className="text-solutio-text-muted">
            Confidential. Direct. No intermediaries.
          </Typography>
        </div>

        <Button variant="primary" href="#contact">
          Talk to us
        </Button>
      </div>
    </Container>
  )
}
