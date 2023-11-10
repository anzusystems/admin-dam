import type { UploadQueueItem } from '@anzusystems/common-admin'

export interface UploadQueue {
  items: UploadQueueItem[]
  totalCount: number
  processedCount: number
  fileInputKey: number // used to reset html input file element

  suggestions: {
    newKeywordNames: Set<string>
    newAuthorNames: Set<string>
  }
}
