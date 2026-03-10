import { Resend } from 'resend';
import type { NewsletterApiConfig } from '../lib/types';

const corsHeaders = (origin?: string) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'x-newsletter-api-key, Content-Type',
});

interface SegmentListResponse {
  data?: Array<{ id: string; name: string }> | { data?: Array<{ id: string; name: string }> };
}

interface ResendWithSegments {
  segments?: { list: () => Promise<SegmentListResponse> };
  audiences?: { list: () => Promise<SegmentListResponse> };
}

export function createNewsletterAudiencesHandler(
  config: NewsletterApiConfig
): (request: Request) => Promise<Response> {
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
    if (!resendApiKey) {
      return Response.json(
        { error: 'Resend is not configured' },
        {
          status: 500,
          headers: corsHeaders(
            process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || undefined
          ),
        }
      );
    }

    const resend = new Resend(resendApiKey);

    try {
      // Try segments first (new API), fall back to audiences (deprecated)
      const segmentsApi = (resend as unknown as ResendWithSegments).segments;
      if (segmentsApi) {
        const segmentsResponse = await segmentsApi.list();
        const segmentsData = segmentsResponse.data;
        const segmentsList = Array.isArray(segmentsData)
          ? segmentsData
          : (segmentsData as { data?: Array<{ id: string; name: string }> })?.data;
        if (segmentsList && segmentsList.length > 0) {
          return Response.json(
            {
              data: segmentsList.map((s) => ({ id: s.id, name: s.name })),
            },
            {
              headers: corsHeaders(
                process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || undefined
              ),
            }
          );
        }
      }
      // Fallback to audiences
      const audiencesApi = (resend as unknown as ResendWithSegments).audiences;
      if (audiencesApi) {
        const audiencesResponse = await audiencesApi.list();
        const responseData = audiencesResponse?.data;
        const list = (Array.isArray(responseData) ? responseData : (responseData as { data?: unknown[] })?.data) || [];
        return Response.json(
          {
            data: Array.isArray(list)
              ? (list as { id?: string; name?: string }[]).map((a) => ({ id: a.id, name: a.name }))
              : [],
          },
          {
            headers: corsHeaders(
              process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || undefined
            ),
          }
        );
      }
      return Response.json(
        { data: [] },
        {
          headers: corsHeaders(
            process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || undefined
          ),
        }
      );
    } catch (err) {
      console.error('Newsletter audiences error:', err);
      return Response.json(
        { error: 'Failed to fetch audiences' },
        {
          status: 500,
          headers: corsHeaders(
            process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || undefined
          ),
        }
      );
    }
  };
}
