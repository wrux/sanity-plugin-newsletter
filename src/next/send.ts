import { createClient } from '@sanity/client';
import { Resend } from 'resend';
import {
  createNewsletterSendQuery,
} from '../lib/groq';
import type { NewsletterApiConfig } from '../lib/types';

const corsHeaders = (origin?: string) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'x-newsletter-api-key, Content-Type',
});

export function createNewsletterSendHandler(
  config: NewsletterApiConfig
): (request: Request) => Promise<Response> {
  const documentType = config.documentType ?? 'newsletter';
  const query = createNewsletterSendQuery(
    documentType,
    config.blocksProjection
  );

  const client = createClient({
    projectId: config.projectId,
    dataset: config.dataset,
    apiVersion: config.apiVersion,
    useCdn: false,
    token:
      process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN,
  });

  return async (request: Request) => {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(
          process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || undefined
        ),
      });
    }

    const apiKey = request.headers.get('x-newsletter-api-key');
    if (!config.apiKey || apiKey !== config.apiKey) {
      return Response.json(
        { error: 'Unauthorized' },
        {
          status: 401,
          headers: corsHeaders(
            process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || undefined
          ),
        }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (!resendApiKey || !fromEmail) {
      return Response.json(
        { error: 'Email is not configured' },
        {
          status: 500,
          headers: corsHeaders(
            process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || undefined
          ),
        }
      );
    }

    let body: {
      documentId: string;
      segmentId: string;
      sentByUserId?: string;
      sentByName?: string;
    };
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: 'Invalid JSON body' },
        {
          status: 400,
          headers: corsHeaders(
            process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || undefined
          ),
        }
      );
    }

    const { documentId, segmentId, sentByUserId, sentByName } = body;
    if (!documentId || !segmentId) {
      return Response.json(
        { error: 'documentId and segmentId are required' },
        {
          status: 400,
          headers: corsHeaders(
            process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || undefined
          ),
        }
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
      return Response.json(
        { error: 'Newsletter not found' },
        {
          status: 404,
          headers: corsHeaders(
            process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || undefined
          ),
        }
      );
    }

    if (newsletter.sentAt) {
      return Response.json(
        { error: 'This newsletter has already been sent' },
        {
          status: 400,
          headers: corsHeaders(
            process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || undefined
          ),
        }
      );
    }

    const html = await config.renderToHtml(newsletter);

    const resend = new Resend(resendApiKey);
    const { data: createData, error: createError } =
      await resend.broadcasts.create({
        audienceId: segmentId,
        from: fromEmail,
        subject: newsletter.subject,
        html,
      });

    if (createError) {
      console.error('Resend broadcast error:', createError);
      return Response.json(
        { error: createError.message || 'Failed to send newsletter' },
        {
          status: 500,
          headers: corsHeaders(
            process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || undefined
          ),
        }
      );
    }

    const broadcastId = createData?.id;
    if (!broadcastId) {
      return Response.json(
        { error: 'Failed to create broadcast' },
        {
          status: 500,
          headers: corsHeaders(
            process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || undefined
          ),
        }
      );
    }

    const { error: sendError } = await resend.broadcasts.send(broadcastId);
    if (sendError) {
      console.error('Resend broadcast send error:', sendError);
      return Response.json(
        { error: sendError.message || 'Failed to send newsletter' },
        {
          status: 500,
          headers: corsHeaders(
            process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || undefined
          ),
        }
      );
    }

    const patch = {
      sentAt: new Date().toISOString(),
      sentByUserId: sentByUserId || null,
      sentByName: sentByName || null,
      resendBroadcastId: broadcastId,
    };

    try {
      await client.patch(publishedId).set(patch).commit();
      if (documentId.startsWith('drafts.')) {
        await client.patch(documentId).set(patch).commit();
      }
    } catch (patchErr) {
      console.error('Failed to patch newsletter:', patchErr);
    }

    return Response.json(
      { success: true, broadcastId },
      {
        headers: corsHeaders(
          process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || undefined
        ),
      }
    );
  };
}
