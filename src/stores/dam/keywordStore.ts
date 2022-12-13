import { acceptHMRUpdate, defineStore } from 'pinia'
import { useKeywordFactory } from '@/model/dam/factory/KeywordFactory'
import type { Keyword } from '@/types/dam/Keyword'

const { createDefault } = useKeywordFactory()

interface State {
  keyword: Keyword
  loaded: boolean
}

export const useKeywordOneStore = defineStore('keywordOneStore', {
  state: (): State => ({
    keyword: createDefault(0),
    loaded: false,
  }),
  actions: {
    setKeyword(keyword: Keyword) {
      this.keyword = keyword
    },
    setLoaded(loaded: boolean) {
      this.loaded = loaded
    },
    reset() {
      this.keyword = createDefault(0)
      this.loaded = false
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useKeywordOneStore, import.meta.hot))
}
