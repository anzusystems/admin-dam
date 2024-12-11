import type { Podcast } from '@/types/coreDam/Podcast'
import type { IntegerId, IntegerIdNullable } from '@anzusystems/common-admin'
import { dateTimeNow } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { AuthorCleanPhrase } from '@/types/coreDam/AuthorCleanPhrase'
import { ENTITY } from '@/services/api/coreDam/AuthorCleanPhraseApi'
import { AuthorCleanPhraseModeDefault } from '@/model/coreDam/valueObject/AuthorCleanPhraseMode'
import { AuthorCleanPhraseTypeDefault } from '@/model/coreDam/valueObject/AuthorCleanPhraseType'

export function useAuthorCleanPhraseFactory() {
  const createDefault = (extSystemId: IntegerId): AuthorCleanPhrase => {
    return {
      id: 0,
      authorReplacement: null,
      extSystem: extSystemId,
      phrase: '',
      mode: AuthorCleanPhraseModeDefault,
      type: AuthorCleanPhraseTypeDefault,
      modifiedAt: dateTimeNow(),
      createdAt: dateTimeNow(),
      createdBy: 0,
      modifiedBy: 0,
      _resourceName: ENTITY,
      _system: SYSTEM_CORE_DAM,
    }
  }

  return {
    createDefault,
  }
}
