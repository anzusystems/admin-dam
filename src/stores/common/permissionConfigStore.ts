import { acceptHMRUpdate, defineStore } from 'pinia'
import type { PermissionConfig } from '@anzusystems/common-admin'
import { usePermissionConfigFactory } from '@anzusystems/common-admin'

interface State {
  permissionConfig: PermissionConfig
  loadingPermissionConfig: boolean
  isPermissionConfigInitialized: boolean
}

const { createPermissionConfig } = usePermissionConfigFactory()

export const usePermissionConfigStore = defineStore('usePermissionConfigStore', {
  state: (): State => ({
    permissionConfig: createPermissionConfig(),
    loadingPermissionConfig: false,
    isPermissionConfigInitialized: false,
  }),
  actions: {
    setPermissionConfig(permissionConfig: PermissionConfig) {
      this.permissionConfig = permissionConfig
    },
    setLoadingPermissionConfig(loadingPermissionConfig: boolean) {
      this.loadingPermissionConfig = loadingPermissionConfig
    },
    setPermissionConfigInitialized(initialized: boolean) {
      this.isPermissionConfigInitialized = initialized
    },
    reset() {
      this.permissionConfig = createPermissionConfig()
      this.loadingPermissionConfig = false
      this.isPermissionConfigInitialized = false
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePermissionConfigStore, import.meta.hot))
}
