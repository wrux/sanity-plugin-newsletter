import { createClient } from '@sanity/client';
import {
  createNewsletterPreviewQuery,
} from '../lib/groq';
import type { NewsletterApiConfig } from '../lib/types';

export function createNewsletterPreviewHandler(
  config: NewsletterApiConfig
): (request: Request) => Promise<Response> {
  const documentType = config.documentType ?? 'newsletter';
  const query = createNewsletterPreviewQuery(
    documentType,
    config.blocksProjection
  );

  const client = createClient({
    projectId: config.projectId,
    dataset: config.dataset,
    apiVersion: config.apiVersion,
    useCdn: false,
    perspective: 'previewDrafts',
    token: process.env.SANITY_API_READ_TOKEN,
  });

  return async (request: Request) => {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return new Response(
        '<html><body style="font-family:system-ui;padding:40px;color:#71717a">No document ID provided.</body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    const id = documentId.startsWith('drafts.')
      ? documentId
      : `drafts.${documentId}`;
    const publishedId = documentId.replace(/^drafts\./, '');

    const newsletter = await client.fetch(query, {
      documentType,
      id,
      publishedId,
    });

    if (!newsletter) {
      return new Response(
        '<html><body style="font-family:system-ui;padding:40px;color:#71717a">Newsletter not found.</body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    const html = await config.renderToHtml(newsletter);

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  };
}
