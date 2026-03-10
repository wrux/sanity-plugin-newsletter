const DEFAULT_BLOCKS_PROJECTION = `blocks[]`;

export function createNewsletterPreviewQuery(
  documentType: string,
  blocksProjection?: string
): string {
  const blocks = blocksProjection ?? DEFAULT_BLOCKS_PROJECTION;
  return `*[_type == $documentType && (_id == $id || _id == $publishedId)][0] {
    _id,
    title,
    subject,
    previewText,
    ${blocks}
  }`;
}

export function createNewsletterSendQuery(
  documentType: string,
  blocksProjection?: string
): string {
  const blocks = blocksProjection ?? DEFAULT_BLOCKS_PROJECTION;
  return `*[_type == $documentType && (_id == $id || _id == $publishedId)][0] {
    _id,
    title,
    subject,
    previewText,
    ${blocks},
    sentAt,
    sentByUserId
  }`;
}
