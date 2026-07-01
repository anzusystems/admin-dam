import type { AuthorCleanPhrase } from '@/domains/coreDam/authorCleanPhrase/types/AuthorCleanPhrase'

const { required, maxLength, minLength } = useValidate()

export function useAuthorCleanPhraseValidation(authorCleanPhrase: Ref<AuthorCleanPhrase>) {
  const rules = computed(() => ({
    authorCleanPhrase: {
      extSystem: {
        required,
      },
      phrase: {
        required,
        minLength: minLength(2),
        maxLength: maxLength(255),
      },
    },
  }))
  const v$ = useVuelidate(rules, { authorCleanPhrase })

  return {
    v$,
  }
}
