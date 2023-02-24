import { useErrorHandler } from '@anzusystems/common-admin'
import type { AxiosInstance } from 'axios'
import { storeToRefs } from 'pinia'
import { usePermissionConfigApi } from '@/services/api/common/permissionConfigApi'
import { usePermissionConfigStore } from '@/stores/common/permissionConfigStore'
import { getValueByPath } from '@/utils/object'
import type { PermissionTranslationGroup } from '@anzusystems/common-admin'
import { useLanguageSettings } from '@anzusystems/common-admin'

const { handleError } = useErrorHandler()

export const usePermissionConfigActions = (client: () => AxiosInstance) => {
  const { apiFetchPermissionConfig } = usePermissionConfigApi(client)

  const permissionConfigStore = usePermissionConfigStore()
  const { permissionConfig, loadingPermissionConfig, isPermissionConfigInitialized } =
    storeToRefs(permissionConfigStore)
  const fetchPermissionConfig = async () => {
    if (isPermissionConfigInitialized.value) {
      return
    }
    permissionConfigStore.setLoadingPermissionConfig(true)
    try {
      const permissionConfigRes = await apiFetchPermissionConfig()
      permissionConfigStore.setPermissionConfig(permissionConfigRes)
      permissionConfigStore.setPermissionConfigInitialized(true)
    } catch (error) {
      handleError(error)
    } finally {
      permissionConfigStore.setLoadingPermissionConfig(false)
    }
  }
  fetchPermissionConfig()

  const { currentLanguageCode } = useLanguageSettings()

  const translatePermission = (group: PermissionTranslationGroup, key: string): string => {
    const translated = getValueByPath(
      permissionConfig.value.translation,
      group + '.' + key + '.' + currentLanguageCode.value
    )

    if (translated) {
      return translated
    }

    return key
  }

  return {
    fetchPermissionConfig,
    permissionConfig,
    loadingPermissionConfig,
    isPermissionConfigInitialized,
    translatePermission,
    resetPermissionConfigStore: permissionConfigStore.reset,
  }
}
