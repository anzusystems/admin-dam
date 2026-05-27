import type { AnzuUser } from '@anzusystems/common-admin'
import { useAnzuUserFactory } from '@anzusystems/common-admin'

export const useAnzuUserOneStore = defineStore('commonAnzuUserOneStore', () => {
  const { createAnzuUser } = useAnzuUserFactory()

  const anzuUser = ref<AnzuUser>(createAnzuUser())

  function setAnzuUser(newAnzuUser: AnzuUser) {
    anzuUser.value = newAnzuUser
  }

  function reset() {
    anzuUser.value = createAnzuUser()
  }

  return {
    anzuUser,
    setAnzuUser,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAnzuUserOneStore, import.meta.hot))
}
