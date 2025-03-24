import type { IntegerId } from '@anzusystems/common-admin'
import { dateTimeNow } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { AuthorCleanPhrase, AuthorCleanResultDto, AuthorNameDto } from '@/types/coreDam/AuthorCleanPhrase'
import { ENTITY } from '@/services/api/coreDam/AuthorCleanPhraseApi'
import { AuthorCleanPhraseModeDefault } from '@/model/coreDam/valueObject/AuthorCleanPhraseMode'
import { AuthorCleanPhraseTypeDefault } from '@/model/coreDam/valueObject/AuthorCleanPhraseType'
import { envConfig } from '@/services/EnvConfigService'

const DEFAULT_POSITION = 100

export function useAuthorCleanPhraseFactory() {
  const createDefault = (extSystemId: IntegerId): AuthorCleanPhrase => {
    return {
      id: 0,
      authorReplacement: null,
      extSystem: extSystemId,
      phrase: '',
      position: DEFAULT_POSITION,
      flags: {
        wordBoundary: false,
      },
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

  const createAuthorNameDto = (): AuthorNameDto => {
    return {
      name: envConfig.dam.authorCleanPhraseTestSample,
    }
  }

  const createAuthorCleanResultDto = (): AuthorCleanResultDto => {
    return {
      name: '',
      authors: [],
      authorNames: [],
    }
  }

  return {
    createAuthorNameDto,
    createAuthorCleanResultDto,
    createDefault,
  }
}
