import type {
  DefaultDocumentNodeResolver,
  StructureBuilder,
} from 'sanity/structure';
import { NewsletterPreviewSendView } from './newsletter-preview-send-view';

export function createNewsletterDefaultDocumentNode(
  documentType: string
): DefaultDocumentNodeResolver {
  return (S: StructureBuilder, { schemaType }) => {
    if (schemaType === documentType) {
      return S.document().views([
        S.view.form().id('editor').title('Edit'),
        S.view.component(NewsletterPreviewSendView).id('preview').title('Preview'),
      ]);
    }
    return S.document();
  };
}
