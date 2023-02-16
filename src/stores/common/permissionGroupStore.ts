import { acceptHMRUpdate, defineStore } from 'pinia'
import type { PermissionGroup } from '@anzusystems/common-admin'
import { usePermissionGroupFactory } from '@anzusystems/common-admin'

interface State {
  permissionGroup: PermissionGroup
  loadingPermissionGroup: boolean
}

const { createPermissionGroup } = usePermissionGroupFactory()

export const usePermissionGroupOneStore = defineStore('commonPermissionGroupOneStore', {
  state: (): State => ({
    permissionGroup: createPermissionGroup(),
    loadingPermissionGroup: false,
  }),
  actions: {
    setPermissionGroup(permissionGroup: PermissionGroup) {
      this.permissionGroup = permissionGroup
    },
    setLoadingPermissionGroup(loadingPermissionGroup: boolean) {
      this.loadingPermissionGroup = loadingPermissionGroup
    },
    reset() {
      this.permissionGroup = createPermissionGroup()
      this.loadingPermissionGroup = false
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePermissionGroupOneStore, import.meta.hot))
}
