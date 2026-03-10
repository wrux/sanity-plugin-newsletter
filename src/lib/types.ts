import type { SanityDocument } from 'sanity';
import type { SchemaTypeDefinition } from 'sanity';

export type NewsletterListItem = SanityDocument & {
  title?: string;
  subject?: string;
  sentAt?: string;
  slug?: string;
  _updatedAt?: string;
};

export type Segment = { id: string; name: string };

export interface NewsletterPluginConfig {
  /** Document type name. Default: 'newsletter' */
  documentType?: string;

  /** User-defined content blocks. Required. Each block needs schema for Studio. */
  contentBlocks: Array<{
    type: string;
    schema: SchemaTypeDefinition;
  }>;

  /** Base URL for API (preview/send). Passed to Studio for iframe + fetch. */
  apiUrl?: string;

  /** API key for Studio → API auth. Prefer env: SANITY_STUDIO_NEWSLETTER_API_KEY */
  apiKey?: string;

  /** Base URL for "view in browser" link. e.g. 'https://example.com' */
  baseUrl?: string;
}

export interface NewsletterApiConfig {
  projectId: string;
  dataset: string;
  apiVersion: string;
  apiKey: string;
  documentType?: string;

  /** Custom GROQ projection for blocks. Optional; default fetches all block fields. */
  blocksProjection?: string;

  /** Renders newsletter data to HTML. User provides their own templates/layout. */
  renderToHtml: (newsletter: {
    _id: string;
    title?: string;
    subject: string;
    previewText?: string;
    blocks: unknown[];
    [key: string]: unknown;
  }) => Promise<string>;
}
