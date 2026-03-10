export function getSelectedIdFromState(state: unknown): string | null {
  if (!state || typeof state !== 'object') return null;
  const s = state as Record<string, unknown>;
  if (typeof s.id === 'string') return s.id;
  const newsletters = s.newsletters;
  if (
    newsletters &&
    typeof newsletters === 'object' &&
    typeof (newsletters as Record<string, unknown>).id === 'string'
  ) {
    return (newsletters as Record<string, unknown>).id as string;
  }
  return null;
}

export function matchesDocumentId(docId: string, selectedId: string): boolean {
  const pub = selectedId.replace(/^drafts\./, '');
  const draft = selectedId.startsWith('drafts.')
    ? selectedId
    : `drafts.${selectedId}`;
  return docId === selectedId || docId === pub || docId === draft;
}
