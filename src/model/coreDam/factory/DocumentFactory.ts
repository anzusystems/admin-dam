import { isArray, isEmpty, isEmptyObject, isUndefined } from '@anzusystems/common-admin'
import type { JSONContent } from '@tiptap/core'

export function useDocumentFactory() {
  const createEmptyDocument = (): JSONContent => {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
        },
      ],
    }
  }

  return {
    createEmptyDocument,
  }
}

export function checkForEmptyDocument(content: JSONContent | undefined) {
  const { createEmptyDocument } = useDocumentFactory()
  if (
    isUndefined(content) ||
    isEmpty(content) ||
    isUndefined(content.content) ||
    (isArray(content.content) && content.content.length === 0) ||
    isEmptyObject(content.content)
  ) {
    content = createEmptyDocument()
  }
  return content
}
