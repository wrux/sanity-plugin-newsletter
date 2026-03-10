'use client';

import { Box, Flex, Spinner, Stack, Text } from '@sanity/ui';
import { useEffect, useState } from 'react';
import {
  listenQuery,
  Preview,
  PreviewCard,
  useClient,
  useSchema,
} from 'sanity';
import type { NewsletterListItem } from '../lib/types';

export interface NewsletterListProps {
  documentType: string;
  onSelect: (doc: NewsletterListItem) => void;
  onListLoaded?: (list: NewsletterListItem[]) => void;
  selectedId: string | null;
}

export function NewsletterList({
  documentType,
  onSelect,
  onListLoaded,
  selectedId,
}: NewsletterListProps) {
  const client = useClient({ apiVersion: '2025-01-01' });
  const schema = useSchema();
  const [newsletters, setNewsletters] = useState<NewsletterListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const query = `*[_type == $documentType] | order(_updatedAt desc) {
    _id,
    _type,
    title,
    subject,
    "sentAt": sentAt,
    "slug": slug.current,
    _updatedAt
  }`;

  useEffect(() => {
    const sub = listenQuery(
      client,
      query,
      { documentType },
      { perspective: 'previewDrafts' }
    ).subscribe({
      next: (result) => {
        const data = result?.data ?? result;
        const list = Array.isArray(data) ? data : [];
        setNewsletters(list as NewsletterListItem[]);
        onListLoaded?.(list as NewsletterListItem[]);
        setLoading(false);
      },
      error: () => setLoading(false),
    });
    return () => sub.unsubscribe();
  }, [client, documentType, onListLoaded]);

  const list = Array.isArray(newsletters) ? newsletters : [];
  const schemaType = schema.get(documentType);

  if (loading) {
    return (
      <Flex align="center" justify="center" padding={4}>
        <Spinner />
      </Flex>
    );
  }

  if (list.length === 0) {
    return (
      <Box padding={4}>
        <Text muted size={1}>
          No newsletters yet. Create one from Content → Newsletters.
        </Text>
      </Box>
    );
  }

  return (
    <Stack space={1}>
      {list
        .filter((doc): doc is NewsletterListItem => doc != null)
        .map((doc) => {
          const docId = doc._id;
          const normalizedSelected =
            typeof selectedId === 'string' ? selectedId.replace(/^drafts\./, '') : '';
          const normalizedDoc =
            typeof docId === 'string' ? docId.replace(/^drafts\./, '') : '';
          const isSelected =
            selectedId === docId ||
            normalizedSelected === docId ||
            normalizedSelected === normalizedDoc;
          return (
            <PreviewCard
              key={doc._id}
              __unstable_focusRing
              as="button"
              type="button"
              radius={2}
              selected={isSelected}
              tone={isSelected ? 'primary' : 'default'}
              aria-selected={isSelected}
              onClick={() => onSelect(doc)}
            >
              {schemaType ? (
                <Preview schemaType={schemaType} value={doc} layout="compact" />
              ) : (
                <Text size={1}>{doc.title || doc.subject || 'Untitled'}</Text>
              )}
            </PreviewCard>
          );
        })}
    </Stack>
  );
}
