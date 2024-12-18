import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@anzusystems/common-admin'

export const AuthorCleanPhraseType = {
  Word: 'word',
  Regex: 'regex',
} as const

export type AuthorCleanPhraseTypeType = (typeof AuthorCleanPhraseType)[keyof typeof AuthorCleanPhraseType]
export const AuthorCleanPhraseTypeDefault = AuthorCleanPhraseType.Word

export function useAuthorCleanPhraseTypeTypes() {
  const { t } = useI18n()

  const authorCleanPhraseTypeOptions = ref<ValueObjectOption<AuthorCleanPhraseTypeType>[]>([
    {
      value: AuthorCleanPhraseType.Word,
      title: t('coreDam.authorCleanPhrase.type.word'),
    },
    {
      value: AuthorCleanPhraseType.Regex,
      title: t('coreDam.authorCleanPhrase.type.regex'),
    },
  ])

  const getAuthorCleanPhraseTypeOption = (value: AuthorCleanPhraseTypeType) => {
    return authorCleanPhraseTypeOptions.value.find((item) => item.value === value)
  }

  return {
    authorCleanPhraseTypeOptions,
    getAuthorCleanPhraseTypeOption,
  }
}
