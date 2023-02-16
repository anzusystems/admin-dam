import { acceptHMRUpdate, defineStore } from 'pinia'
import type { AnzuUser } from '@anzusystems/common-admin'
import { useAnzuUserFactory } from '@anzusystems/common-admin'

interface State {
  anzuUser: AnzuUser
  loadingAnzuUser: boolean
}

const { createAnzuUser } = useAnzuUserFactory()

export const useAnzuUserOneStore = defineStore('commonAnzuUserOneStore', {
  state: (): State => ({
    anzuUser: createAnzuUser(),
    loadingAnzuUser: false,
  }),
  actions: {
    setAnzuUser(anzuUser: AnzuUser) {
      this.anzuUser = anzuUser
    },
    setLoadingAnzuUser(loadingAnzuUser: boolean) {
      this.loadingAnzuUser = loadingAnzuUser
    },
    reset() {
      this.anzuUser = createAnzuUser()
      this.loadingAnzuUser = false
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAnzuUserOneStore, import.meta.hot))
}
