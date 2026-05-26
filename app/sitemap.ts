import type { MetadataRoute } from "next";

const siteUrl = "https://payeasy.dev";
const routes = [
  "/",
  "/connect",
  "/history",
  "/escrow/create",
  "/privacy",
  "/terms",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
  }));
}
