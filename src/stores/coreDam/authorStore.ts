import { acceptHMRUpdate, defineStore } from 'pinia'
import type { DamAuthor } from '@anzusystems/common-admin'
import { useDamAuthorFactory } from '@anzusystems/common-admin'
import { ref } from 'vue'

export const useAuthorOneStore = defineStore('authorOneStore', () => {
  const { createDefault } = useDamAuthorFactory()

  const author = ref<DamAuthor>(createDefault(0))

  function setAuthor(newAuthor: DamAuthor) {
    author.value = newAuthor
  }

  function reset() {
    author.value = createDefault(0)
  }

  return {
    author,
    setAuthor,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthorOneStore, import.meta.hot))
}
