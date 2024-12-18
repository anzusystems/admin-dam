import type { Ref } from 'vue'
import { computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import { useValidate } from '@anzusystems/common-admin'
import type { AuthorCleanPhrase } from '@/types/coreDam/AuthorCleanPhrase'

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
