import type { DamKeyword } from '@anzusystems/common-admin'
import { useDamKeywordFactory } from '@anzusystems/common-admin'

export const useKeywordOneStore = defineStore('keywordOneStore', () => {
  const { createDefault } = useDamKeywordFactory()

  const keyword = ref<DamKeyword>(createDefault(0))

  function setKeyword(newKeyword: DamKeyword) {
    keyword.value = newKeyword
  }

  function reset() {
    keyword.value = createDefault(0)
  }

  return {
    keyword,
    setKeyword,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useKeywordOneStore, import.meta.hot))
}
