# @wrux/sanity-newsletters

A Sanity plugin for newsletter management with Resend integration. Create and send email campaigns from Sanity Studio with live preview, draft support, and minimal Next.js setup.

## Features

- **Studio tool**: Dedicated Newsletters tool (in the Studio nav) with list, live preview, and send
- **Structure integration**: Add newsletters to your Content list; documents get Edit + Preview tabs
- **Document preview**: Preview tab updates in real time as you edit (shows draft content)
- **Draft content**: Preview shows unpublished changes (no Next.js draft mode required)
- **Configurable schema**: Document type name and content blocks are fully user-defined
- **Resend integration**: Send to segments/audiences via Resend Broadcasts API
- **No built-in templates**: You provide your own email templates and block renderers

## Prerequisites

- [Sanity](https://sanity.io) project (v3+)
- [Resend](https://resend.com) account for sending emails
- [Next.js](https://nextjs.org) app (App Router) for API routes

## Installation

```bash
npm install @wrux/sanity-newsletters resend
# Optional: React Email for building templates (recommended)
npm install @react-email/render @react-email/components
```

## Quick Start

1. **Configure Sanity Studio** – add the plugin and your content blocks
2. **Create API routes** in your Next.js app – preview, send, audiences
3. **Implement `renderToHtml`** – your email template that converts newsletter data to HTML
4. **Set environment variables** – API keys, Resend credentials

## Project structure

After setup, you'll have:

```
your-project/
├── studio/
│   └── sanity.config.ts              # newsletterPlugin + contentBlocks
│   └── schemaTypes/blocks/
│       └── newsletter/               # Your block schemas
└── app/
    └── api/newsletters/
        ├── preview/route.ts          # GET – renders newsletter HTML
        ├── send/route.ts              # POST – sends via Resend
        └── audiences/route.ts        # GET – lists Resend segments
```

You pass a `renderToHtml` function to the preview and send handlers—define it inline in the routes or in a separate module.

---

## Sanity Studio Setup

### 1. Create your content block schemas

The plugin does not ship any blocks. Define your own in your Studio schema. These are regular sanity blocks:

```ts
// studio/schemaTypes/blocks/newsletter/newsletter-block-heading.ts
import { defineField, defineType } from 'sanity';

export const newsletterBlockHeading = defineType({
  name: 'newsletterBlockHeading',
  title: 'Heading',
  type: 'object',
  fields: [
    defineField({
      name: 'level',
      title: 'Level',
      type: 'string',
      options: {
        list: [
          { title: 'H1', value: 'h1' },
          { title: 'H2', value: 'h2' },
          { title: 'H3', value: 'h3' },
        ],
        layout: 'radio',
      },
      initialValue: 'h2',
    }),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
});
```

Create as many block types as you need (text, image, button, divider, spacer, etc.). Each block needs a schema with `name` and `type: 'object'`.

### 2. Add the plugin to `sanity.config.ts`

```ts
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import {
  newsletterPlugin,
  getNewsletterDefaultDocumentNode,
} from '@wrux/sanity-newsletters';
import {
  newsletterBlockHeading,
  newsletterBlockText,
  newsletterBlockImage,
  newsletterBlockButton,
  newsletterBlockDivider,
  newsletterBlockSpacer,
} from './schemaTypes/blocks/newsletter';

// Optional: group block config for reuse
const contentBlocks = [
  { type: newsletterBlockHeading.name, schema: newsletterBlockHeading },
  { type: newsletterBlockText.name, schema: newsletterBlockText },
  { type: newsletterBlockImage.name, schema: newsletterBlockImage },
  { type: newsletterBlockButton.name, schema: newsletterBlockButton },
  { type: newsletterBlockDivider.name, schema: newsletterBlockDivider },
  { type: newsletterBlockSpacer.name, schema: newsletterBlockSpacer },
];

export default defineConfig({
  // ...projectId, dataset, etc.
  plugins: [
    newsletterPlugin({
      documentType: 'newsletter',
      contentBlocks,
      apiUrl:
        process.env.SANITY_STUDIO_NEWSLETTER_API_URL || 'http://localhost:3000',
      apiKey: process.env.SANITY_STUDIO_NEWSLETTER_API_KEY,
    }),
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            // ...your structure items (Places, Posts, etc.)
            S.listItem()
              .title('Newsletters')
              .child(S.documentTypeList('newsletter').title('Newsletters')),
          ]),
      defaultDocumentNode: getNewsletterDefaultDocumentNode(),
    }),
  ],
});
```

### 3. Plugin configuration options

| Option          | Type                                                    | Default                                                                   | Description                                                      |
| --------------- | ------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `documentType`  | `string`                                                | `'newsletter'`                                                            | Document type name. Override if you have a conflict.             |
| `contentBlocks` | `Array<{ type: string; schema: SchemaTypeDefinition }>` | **Required**                                                              | Your block schemas. Each needs `type` (block name) and `schema`. |
| `apiUrl`        | `string`                                                | `process.env.SANITY_STUDIO_NEWSLETTER_API_URL` or `http://localhost:3000` | Base URL of your Next.js app (for preview iframe and API calls). |
| `apiKey`        | `string`                                                | `process.env.SANITY_STUDIO_NEWSLETTER_API_KEY`                            | Shared secret for Studio → API authentication.                   |
| `baseUrl`       | `string`                                                | —                                                                         | Base URL for "view in browser" links (optional).                 |

---

## Next.js Setup

### 1. Environment variables

Add to `.env.local`:

```env
# Sanity (you likely have these)
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2025-01-01

# Newsletter plugin – shared secret for Studio ↔ API auth
NEWSLETTER_API_KEY=your-secure-random-string

# Sanity API token – for server-side fetch (preview/send)
# Create at sanity.io/manage → API → Tokens
# Needs "Viewer" for preview, "Editor" for send (to patch sentAt)
SANITY_API_READ_TOKEN=your-read-token
SANITY_API_WRITE_TOKEN=your-write-token

# Resend – for sending newsletters
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=newsletter@yourdomain.com

# Optional: CORS for Studio (if Studio is on different origin)
NEXT_PUBLIC_SANITY_STUDIO_URL=http://localhost:3333
```

### 2. Implement `renderToHtml`

Create a function that takes newsletter data and returns HTML. **React Email is recommended** for building responsive templates with React components, but it's not required—you can use MJML, Handlebars, or any template engine.

```ts
// lib/render-newsletter-to-html.ts
import 'server-only';
import { createElement } from 'react';
import { render } from '@react-email/render';
import imageUrlBuilder from '@sanity/image-url';
import { NewsletterEmail } from '~/emails/newsletter'; // Your template
import { hydrateNewsletterBlocks } from '~/lib/resolve-newsletter-button-href'; // If you have document links
import { projectId, dataset } from '~/sanity/lib/api';

const builder = imageUrlBuilder({ projectId, dataset });

function getImageUrl(ref: string) {
  return builder.image(ref).width(600).url();
}

export async function renderNewsletterToHtml(newsletter: {
  _id: string;
  title?: string;
  subject: string;
  previewText?: string;
  blocks: unknown[];
  [key: string]: unknown;
}): Promise<string> {
  // Hydrate blocks (e.g. resolve document references to URLs)
  const rawBlocks = (newsletter.blocks || []) as YourBlockType[];
  const blocks = await hydrateNewsletterBlocks(rawBlocks, { absolute: true });

  const publishedId = newsletter._id.replace(/^drafts\./, '');
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com';
  const viewInBrowserUrl = `${baseUrl}/newsletters/${publishedId}`;

  const reactEmail = createElement(NewsletterEmail, {
    subject: newsletter.subject,
    previewText: newsletter.previewText,
    blocks,
    imageUrlBuilder: getImageUrl,
    viewInBrowserUrl,
    unsubscribeUrl: '{{{RESEND_UNSUBSCRIBE_URL}}}', // Required for Resend broadcasts
  });

  return render(reactEmail);
}
```

### 3. Define and use `blocksProjection` with your API handlers

If your newsletter blocks contain references or require a custom GROQ projection, define a `blocksProjection` string. You **must** provide this projection to your API handler (e.g., `createNewsletterPreviewHandler`) using the `blocksProjection` option, so the correct data is fetched from Sanity for each block.

Example:

```ts
const BLOCKS_PROJECTION = `blocks[]{
  _type,
  _key,
  level,
  text,
  _type == "newsletterBlockHeading" => { level, text },
  _type == "newsletterBlockText" => { "content": pt::text(content) },
  _type == "newsletterBlockImage" => {
    image { asset { _ref } },
    alt,
    caption
  },
  _type == "newsletterBlockButton" => {
    label,
    linkType,
    href,
    document->{
      _type,
      _id,
      "slug": slug.current,
      "categorySlug": category->slug.current
    }
  },
  _type == "newsletterBlockSpacer" => { height }
}`;
```

When creating your preview (or send) handler, pass `blocksProjection` as shown below:

```ts
const handler = createNewsletterPreviewHandler({
  // ...other options,
  blocksProjection: BLOCKS_PROJECTION,
  // ...
});
```

This ensures your API has all the necessary fields resolved and shaped for your rendering function.

### 4. Create API routes

#### Preview route

```ts
// app/api/newsletters/preview/route.ts
import { createNewsletterPreviewHandler } from '@wrux/sanity-newsletters/next';
import { projectId, dataset, apiVersion } from '~/sanity/lib/api';
import { renderNewsletterToHtml } from '~/lib/render-newsletter-to-html';

const BLOCKS_PROJECTION = `blocks[]{ ... }`; // Your projection

const handler = createNewsletterPreviewHandler({
  projectId,
  dataset,
  apiVersion,
  apiKey: process.env.NEWSLETTER_API_KEY!,
  documentType: 'newsletter',
  blocksProjection: BLOCKS_PROJECTION,
  renderToHtml: renderNewsletterToHtml,
});

export const GET = handler;
```

#### Send route

```ts
// app/api/newsletters/send/route.ts
import { NextResponse } from 'next/server';
import { createNewsletterSendHandler } from '@wrux/sanity-newsletters/next';
import { projectId, dataset, apiVersion } from '~/sanity/lib/api';
import { renderNewsletterToHtml } from '~/lib/render-newsletter-to-html';

const BLOCKS_PROJECTION = `blocks[]{ ... }`;

const handler = createNewsletterSendHandler({
  projectId,
  dataset,
  apiVersion,
  apiKey: process.env.NEWSLETTER_API_KEY!,
  documentType: 'newsletter',
  blocksProjection: BLOCKS_PROJECTION,
  renderToHtml: renderNewsletterToHtml,
});

export const POST = handler;

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin':
        process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'x-newsletter-api-key, Content-Type',
    },
  });
}
```

#### Audiences route (for segment picker in Send dialog)

```ts
// app/api/newsletters/audiences/route.ts
import { NextResponse } from 'next/server';
import { createNewsletterAudiencesHandler } from '@wrux/sanity-newsletters/next';
import { projectId, dataset, apiVersion } from '~/sanity/lib/api';

const handler = createNewsletterAudiencesHandler({
  projectId,
  dataset,
  apiVersion,
  apiKey: process.env.NEWSLETTER_API_KEY!,
  documentType: 'newsletter',
  renderToHtml: async () => '', // Not used for audiences
});

export const GET = handler;

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin':
        process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'x-newsletter-api-key, Content-Type',
    },
  });
}
```

---

## Resend Setup

1. Create a [Resend](https://resend.com) account
2. Add and verify your domain
3. Create an API key at [resend.com/api-keys](https://resend.com/api-keys)
4. Create an Audience (or Segment) and add contacts
5. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in your env

The plugin uses Resend Broadcasts. When sending, it calls `resend.broadcasts.create()` with `send: true`. Include `{{{RESEND_UNSUBSCRIBE_URL}}}` in your email template for unsubscribe links.

---

## Environment Variables Reference

| Variable                           | Where   | Required          | Description                                                                          |
| ---------------------------------- | ------- | ----------------- | ------------------------------------------------------------------------------------ |
| `NEWSLETTER_API_KEY`               | Next.js | Yes               | Shared secret. Studio sends this as `x-newsletter-api-key` header.                   |
| `SANITY_STUDIO_NEWSLETTER_API_URL` | Studio  | Yes (for preview) | Base URL of your Next.js app, e.g. `http://localhost:3000` or `https://yoursite.com` |
| `SANITY_STUDIO_NEWSLETTER_API_KEY` | Studio  | Yes (for send)    | Same value as `NEWSLETTER_API_KEY`                                                   |
| `SANITY_API_READ_TOKEN`            | Next.js | Yes               | Sanity token with Viewer role (for preview fetch)                                    |
| `SANITY_API_WRITE_TOKEN`           | Next.js | Yes (for send)    | Sanity token with Editor role (to patch `sentAt`, `resendBroadcastId`)               |
| `RESEND_API_KEY`                   | Next.js | Yes (for send)    | Resend API key                                                                       |
| `RESEND_FROM_EMAIL`                | Next.js | Yes (for send)    | From address, e.g. `newsletter@yourdomain.com`                                       |
| `NEXT_PUBLIC_SANITY_STUDIO_URL`    | Next.js | Optional          | Studio URL for CORS. Defaults to `*` if unset.                                       |

---

## Document schema

The plugin registers a newsletter document type with:

- **Content**: `title`, `subject`, `previewText`, `blocks` (array of your block types)
- **Delivery** (read-only, shown after send): `sentAt`, `sentByUserId`, `sentByName`, `resendBroadcastId`

Newsletters can only be sent once. After sending, the document is patched with the Resend broadcast ID and timestamp.

---

## Troubleshooting

### Preview shows "Newsletter not found"

- Ensure `SANITY_API_READ_TOKEN` is set and has access to the dataset
- Check that `documentId` is passed correctly (can be `drafts.xxx` or `xxx`)

### Send returns 401 Unauthorized

- Verify `NEWSLETTER_API_KEY` matches `SANITY_STUDIO_NEWSLETTER_API_KEY`
- Studio sends the key in the `x-newsletter-api-key` header

### CORS errors when sending from Studio

- Add `OPTIONS` handler to send and audiences routes (see examples above)
- Set `NEXT_PUBLIC_SANITY_STUDIO_URL` to your Studio origin

### Preview doesn't update when editing

- The plugin uses `_updatedAt` to trigger iframe reloads
- Ensure your list query includes `_updatedAt` if using the Newsletters tool

### Resend "Email is not configured"

- Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL`
- Verify your domain in Resend

---

## License

MIT
