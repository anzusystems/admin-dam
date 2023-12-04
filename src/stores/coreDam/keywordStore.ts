import { acceptHMRUpdate, defineStore } from 'pinia'
import { useKeywordFactory } from '@/model/coreDam/factory/KeywordFactory'
import type { DamKeyword } from '@/types/coreDam/DamKeyword'

const { createDefault } = useKeywordFactory()

interface State {
  keyword: DamKeyword
}

export const useKeywordOneStore = defineStore('keywordOneStore', {
  state: (): State => ({
    keyword: createDefault(0),
  }),
  actions: {
    setKeyword(keyword: DamKeyword) {
      this.keyword = keyword
    },
    reset() {
      this.keyword = createDefault(0)
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useKeywordOneStore, import.meta.hot))
}
