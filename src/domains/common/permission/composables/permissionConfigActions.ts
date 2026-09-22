import type { PermissionTranslationGroup } from '@anzusystems/common-admin'
import { objectGetValueByPath, useLanguageSettings } from '@anzusystems/common-admin'
import type { AxiosInstance } from 'axios'
import { usePermissionConfigApi } from '@/domains/common/permissionConfig/api/permissionConfigApi'
import { usePermissionConfigStore } from '@/domains/common/permissionConfig/store/permissionConfigStore'

const { showErrorsDefault } = useAlerts()

export const usePermissionConfigActions = (client: () => AxiosInstance) => {
  const { useFetchPermissionConfig } = usePermissionConfigApi(client)

  const permissionConfigStore = usePermissionConfigStore()
  const { permissionConfig, loadingPermissionConfig, isPermissionConfigInitialized } =
    storeToRefs(permissionConfigStore)
  const fetchPermissionConfig = async () => {
    if (isPermissionConfigInitialized.value) {
      return
    }
    permissionConfigStore.setLoadingPermissionConfig(true)
    try {
      const { executeRequest: apiFetchPermissionConfig } = useFetchPermissionConfig()
      const permissionConfigRes = await apiFetchPermissionConfig({})
      permissionConfigStore.setPermissionConfig(permissionConfigRes)
      permissionConfigStore.setPermissionConfigInitialized(true)
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      permissionConfigStore.setLoadingPermissionConfig(false)
    }
  }
  fetchPermissionConfig()

  const { currentLanguageCode } = useLanguageSettings()

  const translatePermission = (group: PermissionTranslationGroup, key: string): string => {
    const translated = objectGetValueByPath(
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
