import { CheckmarkCircleIcon, EnvelopeIcon } from '@sanity/icons';
import { defineField, defineType } from 'sanity';

export function createNewsletterSchema(
  documentType: string,
  blocksTypeName: string
) {
  return defineType({
    name: documentType,
    title: 'Newsletter',
    icon: EnvelopeIcon,
    type: 'document',
    groups: [
      { name: 'content', title: 'Content', default: true },
      { name: 'delivery', title: 'Delivery' },
    ],
    fields: [
      defineField({
        name: 'title',
        title: 'Title',
        type: 'string',
        description: 'Internal title for the newsletter',
        validation: (rule) => rule.required(),
        group: 'content',
      }),
      defineField({
        name: 'subject',
        title: 'Email subject',
        type: 'string',
        description: 'Subject line recipients will see',
        validation: (rule) => rule.required(),
        group: 'content',
      }),
      defineField({
        name: 'previewText',
        title: 'Preview text',
        type: 'string',
        description: 'Optional preview text shown in inbox (before opening)',
        group: 'content',
      }),
      defineField({
        name: 'blocks',
        title: 'Content blocks',
        type: blocksTypeName,
        description: 'Blocks that make up the newsletter content',
        group: 'content',
      }),
      defineField({
        name: 'sentAt',
        title: 'Sent at',
        type: 'datetime',
        description: 'When the newsletter was sent (set automatically)',
        readOnly: true,
        hidden: ({ document }) => !document?.sentAt,
        group: 'delivery',
      }),
      defineField({
        name: 'sentByUserId',
        title: 'Sent by (user ID)',
        type: 'string',
        description: 'Sanity user ID of who sent the newsletter',
        readOnly: true,
        hidden: ({ document }) => !document?.sentAt,
        group: 'delivery',
      }),
      defineField({
        name: 'sentByName',
        title: 'Sent by',
        type: 'string',
        description: 'Display name of who sent the newsletter',
        readOnly: true,
        hidden: ({ document }) => !document?.sentAt,
        group: 'delivery',
      }),
      defineField({
        name: 'resendBroadcastId',
        title: 'Resend broadcast ID',
        type: 'string',
        description: 'Resend broadcast ID for tracking',
        readOnly: true,
        hidden: ({ document }) => !document?.resendBroadcastId,
        group: 'delivery',
      }),
    ],
    preview: {
      select: {
        title: 'title',
        subject: 'subject',
        sentAt: 'sentAt',
      },
      prepare({ title, subject, sentAt }) {
        return {
          title: title || 'Untitled Newsletter',
          subtitle: [
            subject && `Subject: ${subject}`,
            sentAt && `Sent ${new Date(sentAt).toLocaleDateString()}`,
          ]
            .filter(Boolean)
            .join(' · '),
          media: sentAt ? CheckmarkCircleIcon : EnvelopeIcon,
        };
      },
    },
  });
}
