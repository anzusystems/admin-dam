import { acceptHMRUpdate, defineStore } from 'pinia'
import { useDamKeywordFactory } from '@anzusystems/common-admin'
import type { DamKeyword } from '@anzusystems/common-admin'

const { createDefault } = useDamKeywordFactory()

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
