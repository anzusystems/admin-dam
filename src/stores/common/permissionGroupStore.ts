import { acceptHMRUpdate, defineStore } from 'pinia'
import type { PermissionGroup } from '@anzusystems/common-admin'
import { usePermissionGroupFactory } from '@anzusystems/common-admin'
import { ref } from 'vue'

export const usePermissionGroupOneStore = defineStore('commonPermissionGroupOneStore', () => {
  const { createPermissionGroup } = usePermissionGroupFactory()

  const permissionGroup = ref<PermissionGroup>(createPermissionGroup())

  function setPermissionGroup(newPermissionGroup: PermissionGroup) {
    permissionGroup.value = newPermissionGroup
  }

  function reset() {
    permissionGroup.value = createPermissionGroup()
  }

  return {
    permissionGroup,
    setPermissionGroup,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePermissionGroupOneStore, import.meta.hot))
}
