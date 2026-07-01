export const AuthorCleanPhraseMode = {
  Remove: 'remove',
  Replace: 'replace',
  Split: 'split',
} as const

export type AuthorCleanPhraseModeType = (typeof AuthorCleanPhraseMode)[keyof typeof AuthorCleanPhraseMode]
export const AuthorCleanPhraseModeDefault = AuthorCleanPhraseMode.Remove

export function useAuthorCleanPhraseModeTypes() {
  const { t } = useI18n()

  const authorCleanPhraseModeOptions = ref<ValueObjectOption<AuthorCleanPhraseModeType>[]>([
    {
      value: AuthorCleanPhraseMode.Remove,
      title: t('coreDam.authorCleanPhrase.mode.remove'),
    },
    {
      value: AuthorCleanPhraseMode.Replace,
      title: t('coreDam.authorCleanPhrase.mode.replace'),
    },
    {
      value: AuthorCleanPhraseMode.Split,
      title: t('coreDam.authorCleanPhrase.mode.split'),
    },
  ])

  const getAuthorCleanPhraseModeOption = (value: AuthorCleanPhraseModeType) => {
    return authorCleanPhraseModeOptions.value.find((item) => item.value === value)
  }

  return {
    authorCleanPhraseModeOptions,
    getAuthorCleanPhraseModeOption,
  }
}
