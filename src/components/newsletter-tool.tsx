'use client';

import { Box, Button, Card, Flex, Stack, Text } from '@sanity/ui';
import { CloseIcon, EnvelopeIcon, PublishIcon } from '@sanity/icons';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useRouterState } from 'sanity/router';
import { NewsletterList } from './newsletter-list';
import { NewsletterPreview } from './newsletter-preview';
import { SendNewsletterDialog } from './send-newsletter-dialog';
import type { NewsletterListItem } from '../lib/types';
import { getSelectedIdFromState, matchesDocumentId } from '../lib/utils';

export interface NewsletterToolProps {
  documentType: string;
  apiUrl: string;
  apiKey: string;
}

export function NewsletterTool({
  documentType,
  apiUrl,
  apiKey,
}: NewsletterToolProps) {
  const router = useRouter();
  const routerState = useRouterState();
  const selectedIdFromState = getSelectedIdFromState(routerState);

  const pathMatch =
    typeof window !== 'undefined'
      ? window.location.pathname.match(/\/newsletters\/([^/?#]+)/)
      : null;
  const selectedIdFromUrl = pathMatch?.[1] ?? null;

  const selectedId = selectedIdFromState ?? selectedIdFromUrl;

  const [newsletters, setNewsletters] = useState<NewsletterListItem[]>([]);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  const selected =
    newsletters.find((n) => selectedId && matchesDocumentId(n._id, selectedId)) ??
    null;

  const handleSelect = useCallback(
    (doc: NewsletterListItem | null) => {
      if (doc) {
        router.navigate({ id: doc._id } as Record<string, string>);
      } else {
        router.navigate({} as Record<string, string>);
      }
    },
    [router]
  );

  const handleListLoaded = useCallback((list: NewsletterListItem[]) => {
    setNewsletters(list);
  }, []);

  const handleClose = useCallback(() => {
    router.navigate({} as Record<string, string>);
  }, [router]);

  useEffect(() => {
    if (!selectedId || typeof selectedId !== 'string' || newsletters.length === 0)
      return;
    const found = newsletters.find((n) => matchesDocumentId(n._id, selectedId));
    if (!found) handleSelect(null);
  }, [selectedId, newsletters, handleSelect]);

  const handleSent = useCallback(() => {
    setNewsletters((prev) =>
      prev.map((n) =>
        selected && n._id === selected._id
          ? { ...n, sentAt: new Date().toISOString() }
          : n
      )
    );
  }, [selected]);

  const title = selected?.title || selected?.subject || 'Untitled';
  const documentId = selected?._id ?? selectedId;

  return (
    <Box
      style={{
        height: '100%',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Flex
        direction={['column', 'row']}
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <Card
          radius={0}
          flex={[1, 2]}
          style={{
            overflow: 'hidden',
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--card-border-color)',
          }}
        >
          <Flex
            align="center"
            paddingY={4}
            paddingX={3}
            style={{
              flexShrink: 0,
              borderBottom: '1px solid var(--card-border-color)',
            }}
          >
            <Text size={2}>Newsletters</Text>
          </Flex>
          <Box
            style={{ flex: 1, minHeight: 0, overflow: 'auto' }}
            paddingY={3}
            paddingX={3}
          >
            <NewsletterList
              documentType={documentType}
              onSelect={handleSelect}
              onListLoaded={handleListLoaded}
              selectedId={selectedId}
            />
          </Box>
        </Card>

        <Card
          radius={0}
          flex={[1, 7]}
          style={{
            overflow: 'hidden',
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {selected || selectedId ? (
            <>
              <Flex
                align="center"
                justify="space-between"
                gap={2}
                style={{
                  flexShrink: 0,
                  borderBottom: '1px solid var(--card-border-color)',
                }}
              >
                <Box paddingY={4} paddingX={3}>
                  <Text size={2}>{title}</Text>
                </Box>
                <Flex align="center" gap={1} paddingX={3}>
                  {selected?.sentAt ? (
                    <Text size={1} muted>
                      Already sent
                    </Text>
                  ) : (
                    <Button
                      icon={PublishIcon}
                      text="Send"
                      mode="bleed"
                      tone="primary"
                      aria-label="Send newsletter"
                      onClick={() => setSendDialogOpen(true)}
                    />
                  )}
                  <Button
                    icon={CloseIcon}
                    mode="bleed"
                    tone="default"
                    aria-label="Close"
                    onClick={handleClose}
                  />
                </Flex>
              </Flex>

              {sendDialogOpen && (
                <SendNewsletterDialog
                  documentId={documentId!}
                  documentTitle={title}
                  sentAt={selected?.sentAt ?? null}
                  apiUrl={apiUrl}
                  apiKey={apiKey}
                  onClose={() => setSendDialogOpen(false)}
                  onSent={handleSent}
                />
              )}

              <NewsletterPreview
                documentId={documentId!}
                apiUrl={apiUrl}
                revision={selected?._updatedAt}
              />
            </>
          ) : (
            <Flex
              align="center"
              justify="center"
              padding={6}
              style={{
                flex: 1,
                minHeight: 300,
                flexDirection: 'column',
              }}
            >
              <Stack space={2} style={{ textAlign: 'center' }}>
                <EnvelopeIcon
                  style={{
                    fontSize: 48,
                    opacity: 0.3,
                    margin: '0 auto',
                  }}
                />
                <Text muted>Select a newsletter to preview and send</Text>
                <Text muted size={1}>
                  Manage newsletters in Content → Newsletters
                </Text>
              </Stack>
            </Flex>
          )}
        </Card>
      </Flex>
    </Box>
  );
}
