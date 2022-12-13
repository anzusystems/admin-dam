import { acceptHMRUpdate, defineStore } from 'pinia'
import { usePermissionGroupFactory } from '@/model/dam/factory/PermissionGroupFactory'
import type { PermissionGroup } from '@/types/dam/PermissionGroup'

const { createDefault } = usePermissionGroupFactory()

interface State {
  permissionGroup: PermissionGroup
  loaded: boolean
}

export const usePermissionGroupOneStore = defineStore('permissionGroupOneStore', {
  state: (): State => ({
    permissionGroup: createDefault(),
    loaded: false,
  }),
  actions: {
    setPermissionGroup(permissionGroup: PermissionGroup) {
      this.permissionGroup = permissionGroup
    },
    setLoaded(loaded: boolean) {
      this.loaded = loaded
    },
    reset() {
      this.permissionGroup = createDefault()
      this.loaded = false
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePermissionGroupOneStore, import.meta.hot))
}
