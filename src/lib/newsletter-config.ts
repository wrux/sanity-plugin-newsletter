let config: {
  documentType: string;
  apiUrl: string;
  apiKey: string;
} = {
  documentType: 'newsletter',
  apiUrl: process.env.SANITY_STUDIO_NEWSLETTER_API_URL || 'http://localhost:3000',
  apiKey: process.env.SANITY_STUDIO_NEWSLETTER_API_KEY || '',
};

export function setNewsletterConfig(cfg: {
  documentType?: string;
  apiUrl?: string;
  apiKey?: string;
}) {
  config = {
    documentType: cfg.documentType ?? config.documentType,
    apiUrl: cfg.apiUrl ?? config.apiUrl,
    apiKey: cfg.apiKey ?? config.apiKey,
  };
}

export function getNewsletterConfig() {
  return config;
}
