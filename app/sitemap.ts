import type { MetadataRoute } from "next"
import { getBaseUrl } from "@/lib/utils/base-url"

const APP_BASE_URL = getBaseUrl()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseRoutes: MetadataRoute.Sitemap = [
    {
      url: APP_BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ]
  return baseRoutes
}
