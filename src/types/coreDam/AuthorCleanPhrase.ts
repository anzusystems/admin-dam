import type {
  AnzuUserAndTimeTrackingAware,
  DocId,
  DocIdNullable,
  IntegerId,
  IntegerIdNullable,
  ResourceNameSystemAware,
} from '@anzusystems/common-admin'
import type { AuthorCleanPhraseTypeType } from '@/model/coreDam/valueObject/AuthorCleanPhraseType'
import type { AuthorCleanPhraseModeType } from '@/model/coreDam/valueObject/AuthorCleanPhraseMode'

export interface AuthorCleanPhrase extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: IntegerId
  extSystem: IntegerIdNullable
  authorReplacement: DocIdNullable
  phrase: string
  position: number
  type: AuthorCleanPhraseTypeType
  mode: AuthorCleanPhraseModeType
  flags: AuthorCleanPhraseFlags
}

export interface AuthorCleanPhraseFlags {
  wordBoundary: boolean
}

export interface AuthorNameDto {
  name: string
}

export interface AuthorCleanResultDto {
  name: string
  authorNames: string[]
  authors: DocId[]
}
