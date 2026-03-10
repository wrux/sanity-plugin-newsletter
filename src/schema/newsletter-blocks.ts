import { defineType } from 'sanity';
import type { SchemaTypeDefinition } from 'sanity';

const BLOCKS_TYPE_NAME = 'newsletterBlocks';

export function createNewsletterBlocksSchema(
  contentBlocks: Array<{ type: string; schema: SchemaTypeDefinition }>
) {
  return defineType({
    name: BLOCKS_TYPE_NAME,
    title: 'Newsletter Blocks',
    type: 'array',
    of: contentBlocks.map((b) => ({ type: b.type })),
    options: {
      insertMenu: {
        views: [{ name: 'list' }],
      },
    },
  });
}

export { BLOCKS_TYPE_NAME };
