import { Geist_Mono } from "next/font/google";

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
});

const fonts = [mono];
const fontsVariable = fonts.map((font) => font.variable).join(" ");

export { fontsVariable };
