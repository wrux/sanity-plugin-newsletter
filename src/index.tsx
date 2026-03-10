import { definePlugin } from 'sanity';
import { EnvelopeIcon } from '@sanity/icons';
import { route } from 'sanity/router';
import { NewsletterTool } from './components/newsletter-tool';
import { createNewsletterDefaultDocumentNode } from './components/newsletter-structure';
import { createNewsletterSchema } from './schema/newsletter';
import {
  createNewsletterBlocksSchema,
  BLOCKS_TYPE_NAME,
} from './schema/newsletter-blocks';
import {
  setNewsletterConfig,
  getNewsletterConfig,
} from './lib/newsletter-config';
import type { NewsletterPluginConfig, NewsletterApiConfig } from './lib/types';

export type { NewsletterPluginConfig, NewsletterApiConfig };
import type { DefaultDocumentNodeResolver } from 'sanity/structure';

export function getNewsletterDefaultDocumentNode(): DefaultDocumentNodeResolver {
  return (S, context) => {
    const { documentType } = getNewsletterConfig();
    return createNewsletterDefaultDocumentNode(documentType)(S, context);
  };
}

export { createNewsletterDefaultDocumentNode };

export const newsletterPlugin = definePlugin<NewsletterPluginConfig>(
  (config) => {
    const documentType = config.documentType ?? 'newsletter';
    const apiUrl =
      config.apiUrl ??
      process.env.SANITY_STUDIO_NEWSLETTER_API_URL ??
      'http://localhost:3000';
    const apiKey =
      config.apiKey ?? process.env.SANITY_STUDIO_NEWSLETTER_API_KEY ?? '';

    setNewsletterConfig({ documentType, apiUrl, apiKey });

    const newsletterBlocksSchema = createNewsletterBlocksSchema(
      config.contentBlocks,
    );
    const newsletterSchema = createNewsletterSchema(
      documentType,
      BLOCKS_TYPE_NAME,
    );

    const newslettersTool = {
      name: 'newsletters',
      title: 'Newsletters',
      icon: EnvelopeIcon,
      component: () => (
        <NewsletterTool
          documentType={documentType}
          apiUrl={apiUrl}
          apiKey={apiKey}
        />
      ),
      router: route.create({
        path: '/:id',
        transform: {
          id: {
            toState: (id: string) => (id ? { id } : {}),
            toPath: (id: string) => id ?? '',
          },
        },
      }),
    };

    const schemaTypes = [
      newsletterSchema,
      newsletterBlocksSchema,
      ...config.contentBlocks.map((b) => b.schema),
    ];

    return {
      name: 'sanity-plugin-newsletter',
      schema: {
        types: schemaTypes,
      },
      tools: (prev) => [...prev, newslettersTool],
      document: {
        newDocumentOptions: (prev, { creationContext }) => {
          if (creationContext.type === 'structure') {
            return prev.filter(
              (option) => option.templateId !== `document:${documentType}`,
            );
          }
          return prev;
        },
      },
    };
  },
);

export default newsletterPlugin;
