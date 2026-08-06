import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import { type PropsWithChildren, Suspense } from "react"
import { JsonLd } from "@/components/seo/json-ld"
import { Link } from "@/components/ui/link"
import { SITE } from "@/lib/content/site"
import { fontsVariable } from "@/lib/styles/fonts"
import "@/lib/styles/index.css"
import { getBaseUrl } from "@/lib/utils/base-url"
import { cn } from "@/lib/styles/cn"

const APP_NAME = SITE.name
const APP_DEFAULT_TITLE = `${SITE.name} — ${SITE.tagline}`
const APP_TITLE_TEMPLATE = `%s — ${SITE.name}`
const APP_DESCRIPTION = SITE.description
const APP_BASE_URL = getBaseUrl()

const geist = Geist({
  subsets: ["latin"],
})

const OG_IMAGE = {
  alt: APP_DEFAULT_TITLE,
  height: 630,
  url: "/opengraph-image.jpg",
  width: 1200,
}

const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  applicationName: APP_NAME,
  authors: [{ name: "basement.studio", url: "https://basement.studio" }],
  description: APP_DESCRIPTION,
  keywords: [...SITE.keywords],
  formatDetection: { telephone: false },
  metadataBase: new URL(APP_BASE_URL),
  openGraph: {
    description: APP_DESCRIPTION,
    images: [OG_IMAGE],
    locale: "en_US",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    type: "website",
    url: APP_BASE_URL,
  },
  // Only emit fb:app_id when it is actually configured — an empty tag is noise.
  ...(FACEBOOK_APP_ID && { other: { "fb:app_id": FACEBOOK_APP_ID } }),
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  twitter: {
    card: "summary_large_image",
    description: APP_DESCRIPTION,
    images: [OG_IMAGE],
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
  },
}

export const viewport: Viewport = {
  // The site is dark-only; declaring it keeps form controls and the scrollbar
  // from rendering light.
  colorScheme: "dark",
  themeColor: "#0A0A0A",
}

export default async function Layout({ children }: PropsWithChildren) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={cn(fontsVariable, geist.className)}
      // NOTE: This is due to the data-theme attribute being set which causes hydration errors
      suppressHydrationWarning
    >
      <body>
        <JsonLd />
        {/*
          Marks that scripting is available. The reveal styles hide their
          elements only under `.js`, so without this the observer would never
          run and every revealed element would stay invisible. Inline and first
          in the body so it lands before anything below it paints.
        */}
        <script>{`document.documentElement.classList.add("js")`}</script>
        {/* Skip link for keyboard navigation accessibility */}
        <Suspense fallback={null}>
          <Link
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-9999 focus:rounded focus:bg-black focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-white"
          >
            Skip to main content
          </Link>
        </Suspense>

        {children}
      </body>
    </html>
  )
}
