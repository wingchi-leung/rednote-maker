import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://rednote-maker-two.vercel.app";

const routes = ["", "/editor"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => {
    const url = `${SITE_URL}${route}`;

    return {
      url,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: route === "" ? 1 : 0.8,
    };
  });
}

