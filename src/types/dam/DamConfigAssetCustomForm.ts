import type { UserAndTimeTrackingFields } from '@/types/UserAndTimeTrackingFields'
import type { System } from '@/types/System'
import type { DocId } from '@anzusystems/common-admin'

export enum CustomFormType {
  String = 'string',
  Number = 'number', // integer
  StringArray = 'string_array',
  Boolean = 'boolean', // integer
  Default = String,
}

export interface DamConfigAssetCustomFormAttributes {
  type: CustomFormType
  minValue: number | null // type string: min chars length, type number: min value, type string_array: min one item chars length
  maxValue: number | null // type string: max chars length, type number: max value, type string_array: max one item chars length
  minCount: number | null // type string_array: min array length
  maxCount: number | null // type string_array: max array length
  required: boolean
  searchable: boolean
}

export interface DamConfigAssetCustomFormElement extends UserAndTimeTrackingFields, System {
  id: DocId
  key: string
  name: string
  position: number
  attributes: DamConfigAssetCustomFormAttributes
}
