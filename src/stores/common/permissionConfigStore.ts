import type { PermissionConfig } from '@anzusystems/common-admin'
import { usePermissionConfigFactory } from '@anzusystems/common-admin'

export const usePermissionConfigStore = defineStore('usePermissionConfigStore', () => {
  const { createPermissionConfig } = usePermissionConfigFactory()

  const permissionConfig = ref<PermissionConfig>(createPermissionConfig())
  const loadingPermissionConfig = ref(false)
  const isPermissionConfigInitialized = ref(false)

  function setPermissionConfig(newPermissionConfig: PermissionConfig) {
    permissionConfig.value = newPermissionConfig
  }

  function setLoadingPermissionConfig(newLoadingPermissionConfig: boolean) {
    loadingPermissionConfig.value = newLoadingPermissionConfig
  }

  function setPermissionConfigInitialized(initialized: boolean) {
    isPermissionConfigInitialized.value = initialized
  }

  function reset() {
    permissionConfig.value = createPermissionConfig()
    loadingPermissionConfig.value = false
    isPermissionConfigInitialized.value = false
  }

  return {
    permissionConfig,
    loadingPermissionConfig,
    isPermissionConfigInitialized,
    setPermissionConfig,
    setLoadingPermissionConfig,
    setPermissionConfigInitialized,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePermissionConfigStore, import.meta.hot))
}
