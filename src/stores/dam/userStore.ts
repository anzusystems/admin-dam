import type { UpdateUser, User } from '@/types/coreDam/User'
import { useUserFactory } from '@/model/coreDam/factory/UserFactory'
import { acceptHMRUpdate, defineStore } from 'pinia'

const { createDefault, createDefaultForUpdate } = useUserFactory()

interface State {
  user: User
  userUpdate: UpdateUser
}

export const useUserOneStore = defineStore('damUserOneStore', {
  state: (): State => ({
    user: createDefault(),
    userUpdate: createDefaultForUpdate(createDefault()),
  }),
  actions: {
    setUser(user: User) {
      this.user = user
      this.userUpdate = createDefaultForUpdate(user)
    },
    reset() {
      this.user = createDefault()
      this.userUpdate = createDefaultForUpdate(this.user)
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserOneStore, import.meta.hot))
}
