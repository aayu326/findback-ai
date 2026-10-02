import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://findback-ai-two.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/login',
        '/signup',
        '/dashboard',
        '/notifications',
        '/onboarding',
        '/report/',
        '/handover/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}