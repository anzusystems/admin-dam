import type { AuthorCleanPhrase } from '@/domains/coreDam/authorCleanPhrase/types/AuthorCleanPhrase'
import { useAuthorCleanPhraseFactory } from '@/domains/coreDam/authorCleanPhrase/factory/AuthorCleanPhraseFactory'

export const useAuthorCleanPhraseOneStore = defineStore('authorCleanPhraseOneStore', () => {
  const { createDefault } = useAuthorCleanPhraseFactory()

  const authorCleanPhrase = ref<AuthorCleanPhrase>(createDefault(0))

  function setAuthorCleanPhrase(newAuthorCleanPhrase: AuthorCleanPhrase) {
    authorCleanPhrase.value = newAuthorCleanPhrase
  }

  function reset() {
    authorCleanPhrase.value = createDefault(0)
  }

  return {
    authorCleanPhrase,
    setAuthorCleanPhrase,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthorCleanPhraseOneStore, import.meta.hot))
}
