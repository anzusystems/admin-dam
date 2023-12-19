import { acceptHMRUpdate, defineStore } from 'pinia'
import type { DamAuthor } from '@anzusystems/common-admin'
import { useDamAuthorFactory } from '@anzusystems/common-admin'

const { createDefault } = useDamAuthorFactory()

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
