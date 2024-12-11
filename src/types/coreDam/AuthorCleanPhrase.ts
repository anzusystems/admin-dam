import type {
  AnzuUserAndTimeTrackingAware,
  DocIdNullable, IntegerId, IntegerIdNullable,
  JobBase,
  JobUserDataDelete,
  ResourceNameSystemAware
} from '@anzusystems/common-admin'
import type { JobResource } from '@/model/coreDam/valueObject/JobResource'
import type { AuthorCleanPhraseTypeType } from '@/model/coreDam/valueObject/AuthorCleanPhraseType'
import type { AuthorCleanPhraseModeType } from '@/model/coreDam/valueObject/AuthorCleanPhraseMode'

export interface AuthorCleanPhrase extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: IntegerId
  extSystem: IntegerIdNullable
  authorReplacement: IntegerIdNullable
  phrase: string
  type: AuthorCleanPhraseTypeType
  mode: AuthorCleanPhraseModeType
}
