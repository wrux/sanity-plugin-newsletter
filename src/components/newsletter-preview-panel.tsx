'use client';

import { Flex } from '@sanity/ui';

export interface NewsletterPreviewPanelProps {
  documentId: string;
  apiUrl: string;
  revision?: string;
}

/**
 * Preview panel for the structure tool – just the iframe, no header.
 * Used when viewing a newsletter document in the Preview tab.
 * Pass revision (e.g. _updatedAt) to reload when the document changes.
 */
export function NewsletterPreviewPanel({
  documentId,
  apiUrl,
  revision,
}: NewsletterPreviewPanelProps) {
  const params = new URLSearchParams({ documentId });
  if (revision) params.set('revision', revision);
  const previewUrl = `${apiUrl}/api/newsletters/preview?${params.toString()}`;

  return (
    <Flex
      direction="column"
      height="fill"
      overflow="hidden"
      style={{
        minHeight: 0,
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
