'use client';

import { Flex } from '@sanity/ui';

export interface NewsletterPreviewProps {
  documentId: string;
  apiUrl: string;
  revision?: string;
}

export function NewsletterPreview({
  documentId,
  apiUrl,
  revision,
}: NewsletterPreviewProps) {
  const params = new URLSearchParams({ documentId });
  if (revision) params.set('revision', revision);
  const previewUrl = `${apiUrl}/api/newsletters/preview?${params.toString()}`;

  return (
    <Flex
      direction="column"
      flex={1}
      style={{
        minHeight: 400,
        backgroundColor: 'var(--card-bg-color)',
      }}
    >
      <iframe
        src={previewUrl}
        title="Newsletter preview"
        style={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          border: 'none',
        }}
      />
    </Flex>
  );
}
