import { acceptHMRUpdate, defineStore } from 'pinia'
import type { AuthorCleanPhrase } from '@/types/coreDam/AuthorCleanPhrase'
import { useAuthorCleanPhraseFactory } from '@/model/coreDam/factory/AuthorCleanPhraseFactory'

const { createDefault } = useAuthorCleanPhraseFactory()

interface State {
  authorCleanPhrase: AuthorCleanPhrase
}

export const useAuthorCleanPhraseOneStore = defineStore('authorCleanPhraseOneStore', {
  state: (): State => ({
    authorCleanPhrase: createDefault(0),
  }),
  actions: {
    setAuthorCleanPhrase(authorCleanPhrase: AuthorCleanPhrase) {
      this.authorCleanPhrase = authorCleanPhrase
    },
    reset() {
      this.authorCleanPhrase = createDefault(0)
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthorCleanPhraseOneStore, import.meta.hot))
}
