import type {
  AnzuUserAndTimeTrackingAware,
  DocId,
  IntegerIdNullable,
  ResourceNameSystemAware,
} from '@anzusystems/common-admin'

interface Texts {
  title: string
}

export interface VideoShow extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  licence: IntegerIdNullable
  texts: Texts
}

export interface VideoShowMinimal {
  id: DocId
  title: string
}
