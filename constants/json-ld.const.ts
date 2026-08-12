import { Graph } from 'schema-dts';

import { APP_DATA } from './app-data.const';

type JsonLdGraphInput = {
  baseUrl: string;
  description: string;
  /**
   * BCP 47 tag for the page being described, e.g. `en-US`.
   */
  language: string;
};

/**
 * Build the structured-data graph for a public page.
 *
 * Nodes are cross-linked by `@id` fragments rather than repeated inline, so
 * `publisher` resolves to the organization node inside the same document.
 *
 * The organization is the project itself. Once the department's own identity is
 * known, this becomes an `EducationalOrganization` with its address and contact
 * details - inventing them now would put false data in front of crawlers.
 *
 * @param input - Absolute origin, page description and language tag.
 *
 * @returns A schema.org graph, typed against the vocabulary.
 */
export function buildJsonLdGraph({ baseUrl, description, language }: JsonLdGraphInput): Graph {
  const organizationId = `${baseUrl}/#organization`;
  const homeUrl = `${baseUrl}/`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: APP_DATA.NAME,
        alternateName: APP_DATA.SHORT_NAME,
        url: homeUrl,
        description,
      },
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        name: APP_DATA.NAME,
        url: homeUrl,
        description,
        inLanguage: language,
        publisher: { '@id': organizationId },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${baseUrl}/#application`,
        name: APP_DATA.SHORT_NAME,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        url: homeUrl,
        description,
        inLanguage: language,
        publisher: { '@id': organizationId },
      },
    ],
  };
}
