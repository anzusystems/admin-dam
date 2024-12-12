import type {
  AnzuUserAndTimeTrackingAware, DocId,
  DocIdNullable, IntegerId, IntegerIdNullable,
  JobBase,
  JobUserDataDelete,
  ResourceNameSystemAware
} from '@anzusystems/common-admin'
import type { JobResource } from '@/model/coreDam/valueObject/JobResource'
import type { AuthorCleanPhraseTypeType } from '@/model/coreDam/valueObject/AuthorCleanPhraseType'
import type { AuthorCleanPhraseModeType } from '@/model/coreDam/valueObject/AuthorCleanPhraseMode'
import { integer } from '@vue/language-server'

export interface AuthorCleanPhrase extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: IntegerId
  extSystem: IntegerIdNullable
  authorReplacement: IntegerIdNullable
  phrase: string
  position: integer
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

