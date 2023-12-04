import { acceptHMRUpdate, defineStore } from 'pinia'
import type { DamAuthor } from '@/types/coreDam/DamAuthor'
import { useAuthorFactory } from '@/model/coreDam/factory/AuthorFactory'

const { createDefault } = useAuthorFactory()

interface State {
  author: DamAuthor
}

export const useAuthorOneStore = defineStore('authorOneStore', {
  state: (): State => ({
    author: createDefault(0),
  }),
  actions: {
    setAuthor(author: DamAuthor) {
      this.author = author
    },
    reset() {
      this.author = createDefault(0)
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthorOneStore, import.meta.hot))
}
