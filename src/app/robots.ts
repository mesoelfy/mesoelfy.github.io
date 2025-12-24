import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://mesoelfy.github.io';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/private/', '/api/'], // Future proofing
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
