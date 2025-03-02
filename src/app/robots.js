export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://betvex.xyz";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/settings/"], // Restrict crawler access to API routes and user settings
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
