/**
 * Cross-platform Next.js dev launcher.
 */

import { bunExecutable, colorEnv } from "./utils"

const isHttps = process.argv.includes("--https")
const isInspect = process.argv.includes("--inspect")

// Build next dev command args
const nextDevArgs = [bunExecutable, "next", "dev"]
if (isHttps) nextDevArgs.push("--experimental-https")
if (isInspect) nextDevArgs.push("--inspect")

const devEnv = colorEnv()

const nextDevProcess = Bun.spawn(nextDevArgs, {
  stdout: "inherit",
  stderr: "inherit",
  env: devEnv,
})

const cleanup = () => {
  nextDevProcess.kill()
  process.exit(0)
}

process.on("SIGINT", cleanup)
process.on("SIGTERM", cleanup)

await nextDevProcess.exited
cleanup()
