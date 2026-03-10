export interface NewsletterApiConfig {
  projectId: string;
  dataset: string;
  apiVersion: string;
  apiKey: string;
  documentType?: string;
  blocksProjection?: string;
  renderToHtml: (newsletter: {
    _id: string;
    title?: string;
    subject: string;
    previewText?: string;
    blocks: unknown[];
    [key: string]: unknown;
  }) => Promise<string>;
}

export function createNewsletterPreviewHandler(
  config: NewsletterApiConfig
): (request: Request) => Promise<Response>;

export function createNewsletterSendHandler(
  config: NewsletterApiConfig
): (request: Request) => Promise<Response>;

export function createNewsletterAudiencesHandler(
  config: NewsletterApiConfig
): (request: Request) => Promise<Response>;
