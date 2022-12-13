import type { UpdateUser, User } from '@/types/dam/User'
import { useUserFactory } from '@/model/dam/factory/UserFactory'
import { acceptHMRUpdate, defineStore } from 'pinia'

const { createDefault, createDefaultForUpdate } = useUserFactory()

interface State {
  user: User
  userUpdate: UpdateUser
  loaded: boolean
}

export const useUserOneStore = defineStore('damUserOneStore', {
  state: (): State => ({
    user: createDefault(),
    userUpdate: createDefaultForUpdate(createDefault()),
    loaded: false,
  }),
  actions: {
    setUser(user: User) {
      this.user = user
      this.userUpdate = createDefaultForUpdate(user)
    },
    setLoaded(loaded: boolean) {
      this.loaded = loaded
    },
    reset() {
      this.user = createDefault()
      this.userUpdate = createDefaultForUpdate(this.user)
      this.loaded = false
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserOneStore, import.meta.hot))
}
