import { acceptHMRUpdate, defineStore } from 'pinia'
import type { Author } from '@/types/dam/Author'
import { useAuthorFactory } from '@/model/dam/factory/AuthorFactory'

const { createDefault } = useAuthorFactory()

interface State {
  author: Author
  loaded: boolean
}

export const useAuthorOneStore = defineStore('authorOneStore', {
  state: (): State => ({
    author: createDefault(0),
    loaded: false,
  }),
  actions: {
    setAuthor(author: Author) {
      this.author = author
    },
    setLoaded(loaded: boolean) {
      this.loaded = loaded
    },
    reset() {
      this.author = createDefault(0)
      this.loaded = false
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthorOneStore, import.meta.hot))
}
