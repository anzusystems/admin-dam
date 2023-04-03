import { acceptHMRUpdate, defineStore } from 'pinia'
import type { AnzuUser } from '@anzusystems/common-admin'
import { useAnzuUserFactory } from '@anzusystems/common-admin'

interface State {
  anzuUser: AnzuUser
}

const { createAnzuUser } = useAnzuUserFactory()

export const useAnzuUserOneStore = defineStore('commonAnzuUserOneStore', {
  state: (): State => ({
    anzuUser: createAnzuUser(),
  }),
  actions: {
    setAnzuUser(anzuUser: AnzuUser) {
      this.anzuUser = anzuUser
    },
    reset() {
      this.anzuUser = createAnzuUser()
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAnzuUserOneStore, import.meta.hot))
}
