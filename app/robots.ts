import type { MetadataRoute } from "next";

const siteUrl = "https://payeasy.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/connect", "/history"],
        disallow: "/escrow/",
      },
    ],
    host: siteUrl,
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
