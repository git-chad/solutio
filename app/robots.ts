import type { MetadataRoute } from "next"
import { getBaseUrl } from "@/lib/utils/base-url"

const APP_BASE_URL = getBaseUrl()

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [],
    },
    sitemap: `${APP_BASE_URL}/sitemap.xml`,
  }
}
