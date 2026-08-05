import type { MetadataRoute } from 'next';

import { SEO } from '@/constants';
import { env } from '@/env/server';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.APP_BASE_URL;
  const sitemap = `${baseUrl}/sitemap.xml`;

  // Block everything on any deployment that has not explicitly opted into indexing.
  // Getting a staging site out of the index afterwards is far more work than this.
  if (!env.ROBOTS_ENABLED) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
      sitemap,
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...SEO.DISALLOWED_PATHS],
    },
    sitemap,
  };
}
