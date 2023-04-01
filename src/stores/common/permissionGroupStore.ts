import { acceptHMRUpdate, defineStore } from 'pinia'
import type { PermissionGroup } from '@anzusystems/common-admin'
import { usePermissionGroupFactory } from '@anzusystems/common-admin'

interface State {
  permissionGroup: PermissionGroup
}

const { createPermissionGroup } = usePermissionGroupFactory()

export const usePermissionGroupOneStore = defineStore('commonPermissionGroupOneStore', {
  state: (): State => ({
    permissionGroup: createPermissionGroup(),
  }),
  actions: {
    setPermissionGroup(permissionGroup: PermissionGroup) {
      this.permissionGroup = permissionGroup
    },
    reset() {
      this.permissionGroup = createPermissionGroup()
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePermissionGroupOneStore, import.meta.hot))
}
