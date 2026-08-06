/**
 * Screenshots a page and reports whatever the browser logged doing it.
 *
 * The WebGL/WebGPU work is invisible to `next build` and to typecheck — a
 * shader that fails to compile just renders black. This drives a real browser
 * over CDP so console errors and uncaught exceptions surface in the terminal
 * alongside the screenshot.
 *
 *   bun lib/scripts/preview.ts [url] [--out shot.png] [--width 1512]
 *       [--height 900] [--wait 6000] [--gpu]
 *
 * Defaults to software rendering (SwiftShader) so it works headless. Pass
 * --gpu on a machine with a real display to exercise the hardware path.
 */
import { spawn } from "node:child_process"
import { mkdir } from "node:fs/promises"
import { dirname, resolve } from "node:path"

const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
]

const args = process.argv.slice(2)
const flag = (name: string, fallback: string) => {
  const index = args.indexOf(`--${name}`)
  return index === -1 ? fallback : (args[index + 1] ?? fallback)
}

const url = args.find((a) => !a.startsWith("--")) ?? "http://localhost:3000"
const out = resolve(flag("out", ".context/preview.png"))
const width = Number(flag("width", "1512"))
const height = Number(flag("height", "900"))
const waitMs = Number(flag("wait", "6000"))
const useGpu = args.includes("--gpu")
const port = 9333

const chrome = CHROME_CANDIDATES.find((path) => Bun.file(path).size !== 0)
if (!chrome) {
  console.error(
    `No Chrome found. Looked in:\n  ${CHROME_CANDIDATES.join("\n  ")}`
  )
  process.exit(1)
}

const chromeArgs = [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  `--window-size=${width},${height}`,
  "--hide-scrollbars",
  "--no-first-run",
  "--no-default-browser-check",
  "--user-data-dir=/tmp/solutio-preview-profile",
  "about:blank",
]
if (!useGpu) {
  chromeArgs.splice(
    1,
    0,
    "--enable-unsafe-swiftshader",
    "--use-gl=angle",
    "--use-angle=swiftshader"
  )
}

const proc = spawn(chrome, chromeArgs, { stdio: "ignore", detached: false })
const stop = () => {
  try {
    proc.kill()
  } catch {
    // Already gone.
  }
}

/** Chrome needs a moment before its debugging endpoint answers. */
async function debuggerUrl(): Promise<string> {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`)
      const targets = (await res.json()) as {
        type: string
        webSocketDebuggerUrl?: string
      }[]
      const page = targets.find(
        (t) => t.type === "page" && t.webSocketDebuggerUrl
      )
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl
    } catch {
      // Not listening yet.
    }
    await Bun.sleep(150)
  }
  throw new Error("Chrome debugging endpoint never came up")
}

const socket = new WebSocket(await debuggerUrl())
await new Promise((done) => {
  socket.onopen = done
})

let nextId = 1
const pending = new Map<number, (value: unknown) => void>()
const logs: string[] = []
const errors: string[] = []

socket.onmessage = (event) => {
  const message = JSON.parse(String(event.data))

  if (message.id && pending.has(message.id)) {
    pending.get(message.id)?.(message.result)
    pending.delete(message.id)
    return
  }

  if (message.method === "Runtime.consoleAPICalled") {
    const text = (message.params.args ?? [])
      .map((a: { value?: unknown; description?: string }) =>
        a.value !== undefined ? String(a.value) : (a.description ?? "")
      )
      .join(" ")
    const line = `[${message.params.type}] ${text}`
    if (message.params.type === "error") errors.push(line)
    else logs.push(line)
  }

  if (message.method === "Runtime.exceptionThrown") {
    const detail = message.params.exceptionDetails
    errors.push(
      `[exception] ${detail.exception?.description ?? detail.text ?? "unknown"}`
    )
  }
}

const send = (method: string, params: Record<string, unknown> = {}) => {
  const id = nextId++
  socket.send(JSON.stringify({ id, method, params }))
  return new Promise<Record<string, unknown>>((done) =>
    pending.set(id, done as (v: unknown) => void)
  )
}

await send("Runtime.enable")
await send("Page.enable")
await send("Page.navigate", { url })
await Bun.sleep(waitMs)

/**
 * Drag the pointer along a path before capturing.
 *
 * Hover-driven effects are invisible to a plain screenshot, and effects with
 * easing need several frames of pointer history before they reach full
 * strength — so this walks the cursor in steps rather than teleporting it.
 *
 *   --hover 20,50:80,60   sweeps from (20%, 50%) to (80%, 60%)
 */
const hover = flag("hover", "")
if (hover) {
  const [from, to] = hover.split(":")
  const [x1, y1] = (from ?? "50,50").split(",").map(Number)
  const [x2, y2] = (to ?? from ?? "50,50").split(",").map(Number)
  const steps = 40

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    await send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: (((x1 ?? 50) + ((x2 ?? 50) - (x1 ?? 50)) * t) / 100) * width,
      y: (((y1 ?? 50) + ((y2 ?? 50) - (y1 ?? 50)) * t) / 100) * height,
      button: "none",
      buttons: 0,
    })
    await Bun.sleep(16)
  }
  // Let easing settle at the end of the sweep.
  await Bun.sleep(Number(flag("settle", "500")))
}

/**
 * Scroll to a selector before capturing.
 *
 * The canvas is fixed and its Views are scissored to the viewport, so anything
 * below the fold genuinely is not drawn — a full-page screenshot cannot show
 * these effects and has to be replaced by scrolling to each one.
 */
const scrollTo = flag("scroll", "")
if (scrollTo) {
  await send("Runtime.evaluate", {
    expression: `document.querySelector(${JSON.stringify(scrollTo)})?.scrollIntoView({ block: "center" })`,
  })
  // Let the Views re-measure and a few frames land.
  await Bun.sleep(1200)
}

/** Run an expression in the page and print the result. For probing the DOM. */
const evalExpr = flag("eval", "")
if (evalExpr) {
  const result = await send("Runtime.evaluate", {
    expression: evalExpr,
    returnByValue: true,
    awaitPromise: true,
  })
  const value = (result.result as { value?: unknown } | undefined)?.value
  console.log("--- eval ---")
  console.log(
    typeof value === "string" ? value : JSON.stringify(value, null, 2)
  )
}

const shot = await send("Page.captureScreenshot", { format: "png" })
await mkdir(dirname(out), { recursive: true })
await Bun.write(out, Buffer.from(String(shot.data), "base64"))

socket.close()
stop()

if (logs.length)
  console.log(`--- console (${logs.length}) ---\n${logs.join("\n")}`)
if (errors.length) {
  console.error(`--- errors (${errors.length}) ---\n${errors.join("\n")}`)
} else {
  console.log("--- no errors ---")
}
console.log(`wrote ${out}`)

process.exit(errors.length ? 1 : 0)
