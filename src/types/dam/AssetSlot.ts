import type { AnzuUserAndTimeTrackingAware, DocId, ResourceNameSystemAware } from '@anzusystems/common-admin'
import type { AssetFileNullable } from '@/types/dam/File'

export interface AssetSlot extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  assetFile: AssetFileNullable
  slotName: string
  default: boolean
  main: boolean
}
