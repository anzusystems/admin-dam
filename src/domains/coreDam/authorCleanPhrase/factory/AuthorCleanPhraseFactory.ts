import { SYSTEM_CORE_DAM } from '@/shared/systems'
import type {
  AuthorCleanPhrase,
  AuthorCleanResultDto,
  AuthorNameDto,
} from '@/domains/coreDam/authorCleanPhrase/types/AuthorCleanPhrase'
import { ENTITY } from '@/domains/coreDam/authorCleanPhrase/api/AuthorCleanPhraseApi'
import { AuthorCleanPhraseModeDefault } from '@/domains/coreDam/authorCleanPhrase/valueObject/AuthorCleanPhraseMode'
import { AuthorCleanPhraseTypeDefault } from '@/domains/coreDam/authorCleanPhrase/valueObject/AuthorCleanPhraseType'
import { envConfig } from '@/shared/EnvConfigService'

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
