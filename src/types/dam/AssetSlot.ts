import type { DocId } from '@anzusystems/common-admin'
import type { UserAndTimeTrackingFields } from '@/types/UserAndTimeTrackingFields'
import type { System } from '@/types/System'
import type { AssetFileNullable } from '@/types/dam/File'

export interface AssetSlot extends UserAndTimeTrackingFields, System {
  id: DocId
  assetFile: AssetFileNullable
  slotName: string
  default: boolean
  main: boolean
}
