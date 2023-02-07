import { acceptHMRUpdate, defineStore } from 'pinia'
import type { Author } from '@/types/dam/Author'
import { useAuthorFactory } from '@/model/dam/factory/AuthorFactory'

const { createDefault } = useAuthorFactory()

interface State {
  author: Author
}

export const useAuthorOneStore = defineStore('authorOneStore', {
  state: (): State => ({
    author: createDefault(0),
  }),
  actions: {
    setAuthor(author: Author) {
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
