import type { DocId } from '@anzusystems/common-admin'

export interface ImagePreview {
  imageFile: DocId
  position: number
}

export type ImagePreviewNullable = ImagePreview | null
