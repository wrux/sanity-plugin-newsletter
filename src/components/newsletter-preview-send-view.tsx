'use client';

import { Flex } from '@sanity/ui';
import type { UserViewComponent } from 'sanity/structure';
import { useDocumentPane } from 'sanity/structure';
import { NewsletterPreviewPanel } from './newsletter-preview-panel';
import { getNewsletterConfig } from '../lib/newsletter-config';

export const NewsletterPreviewSendView: UserViewComponent = (props) => {
  const { documentId } = props;
  const { displayed } = useDocumentPane();
  const { apiUrl } = getNewsletterConfig();
  const revision = (displayed as { _updatedAt?: string } | null)?._updatedAt;

  return (
    <Flex
      direction="column"
      height="fill"
      overflow="hidden"
      style={{
        minHeight: 0,
      }}
    >
      <NewsletterPreviewPanel
        documentId={documentId}
        apiUrl={apiUrl}
        revision={revision}
      />
    </Flex>
  );
};
