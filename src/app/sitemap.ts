import type { MetadataRoute } from "next";
import { getAllOnlineAdIdsForSitemap } from "@/lib/supabase/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://www.ci-kiaba.com";

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/a-propos`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/conditions`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const ads = await getAllOnlineAdIdsForSitemap();
  const adPages: MetadataRoute.Sitemap = ads.map((ad) => ({
    url: `${base}/annonces/${ad.id}`,
    lastModified: ad.updated_at,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...staticPages, ...adPages];
}
