import { Geist_Mono, Instrument_Serif } from "next/font/google"

const mono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--geist-mono",
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Consolas",
    "Liberation Mono",
    "Menlo",
    "monospace",
  ],
})

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--instrument-serif",
  fallback: ["Georgia", "Times New Roman", "serif"],
})

const fonts = [mono, serif]
const fontsVariable = fonts.map((font) => font.variable).join(" ")

export { fontsVariable }
