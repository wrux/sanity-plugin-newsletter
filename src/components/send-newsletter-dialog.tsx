'use client';

import {
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Select,
  Spinner,
  Stack,
  Text,
} from '@sanity/ui';
import { useCallback, useEffect, useState } from 'react';
import { useCurrentUser } from 'sanity';
import type { Segment } from '../lib/types';

export interface SendNewsletterDialogProps {
  documentId: string;
  documentTitle: string;
  sentAt: string | null;
  apiUrl: string;
  apiKey: string;
  onClose: () => void;
  onSent: () => void;
}

export function SendNewsletterDialog({
  documentId,
  documentTitle,
  sentAt,
  apiUrl,
  apiKey,
  onClose,
  onSent,
}: SendNewsletterDialogProps) {
  const currentUser = useCurrentUser();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alreadySent = !!sentAt;

  useEffect(() => {
    if (alreadySent) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    fetch(`${apiUrl}/api/newsletters/audiences`, {
      headers: {
        'x-newsletter-api-key': apiKey,
      },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch audiences: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const list = data?.data || [];
        setSegments(list);
        if (list.length > 0 && !selectedSegmentId) {
          setSelectedSegmentId(list[0].id);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to load audiences');
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [alreadySent, selectedSegmentId, apiUrl, apiKey]);

  const handleSend = useCallback(() => {
    if (!selectedSegmentId || alreadySent) return;
    setSending(true);
    setError(null);
    fetch(`${apiUrl}/api/newsletters/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-newsletter-api-key': apiKey,
      },
      body: JSON.stringify({
        documentId,
        segmentId: selectedSegmentId,
        sentByUserId: currentUser?.id,
        sentByName:
          (currentUser as { displayName?: string })?.displayName ??
          currentUser?.name,
      }),
    })
      .then((res) => {
        const contentType = res.headers.get('content-type');
        const isJson = contentType?.includes('application/json');
        if (!res.ok) {
          return isJson
            ? res.json().then((d) => {
                throw new Error(d?.error || `Send failed: ${res.status}`);
              })
            : Promise.reject(new Error(`Send failed: ${res.status}`));
        }
        return isJson ? res.json() : {};
      })
      .then(() => {
        onSent();
        onClose();
      })
      .catch((err) => {
        setError(err.message || 'Failed to send newsletter');
      })
      .finally(() => setSending(false));
  }, [
    documentId,
    selectedSegmentId,
    alreadySent,
    currentUser,
    apiUrl,
    apiKey,
    onClose,
    onSent,
  ]);

  return (
    <Dialog
      header="Send newsletter"
      id="send-newsletter"
      onClose={onClose}
      width={1}
      zOffset={1000}
    >
      <Box padding={4}>
        <Stack space={4}>
          {alreadySent ? (
            <Card padding={3} radius={2} tone="caution">
              <Text>
                This newsletter has already been sent and cannot be sent again.
              </Text>
            </Card>
          ) : (
            <>
              <Text>
                Send &quot;{documentTitle}&quot; to your audience. This action
                cannot be undone.
              </Text>
              {loading ? (
                <Flex align="center" justify="center" padding={4}>
                  <Spinner />
                </Flex>
              ) : (
                <>
                  <Stack space={2}>
                    <Text weight="medium">Audience / Segment</Text>
                    <Select
                      value={selectedSegmentId}
                      onChange={(e) => setSelectedSegmentId(e.target.value)}
                      style={{ minWidth: 200 }}
                    >
                      {segments.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </Select>
                  </Stack>
                  {error && (
                    <Card padding={3} radius={2} tone="critical">
                      <Text>{error}</Text>
                    </Card>
                  )}
                  <Flex gap={2} justify="flex-end">
                    <Button text="Cancel" mode="ghost" onClick={onClose} />
                    <Button
                      text={sending ? 'Sending...' : 'Send newsletter'}
                      tone="primary"
                      disabled={sending || segments.length === 0}
                      onClick={handleSend}
                    />
                  </Flex>
                </>
              )}
            </>
          )}
        </Stack>
      </Box>
    </Dialog>
  );
}
