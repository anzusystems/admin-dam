import { useAuth } from '@/composables/auth/auth'
import { SYSTEM_DAM } from '@/model/systems'
import { fetchAsset, fetchAssetByFileId } from '@/services/api/coreDam/assetApi'
import { fetchAssetLicence } from '@/services/api/coreDam/assetLicenceApi'
import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'
import {
  type DamAssetLicence,
  type DamCurrentUserDto,
  type DamExtSystem,
  type DocId,
  isDocId,
  isNull,
  isString,
  isUndefined,
  useDamConfigStore,
} from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { readonly, ref } from 'vue'

const currentExtSystemId = ref(0)
const currentExtSystem = ref<DamExtSystem>()

const currentAssetLicence = ref<DamAssetLicence>()
const currentAssetLicenceId = ref(0)

export const initCurrentExtSystemAndLicence = async (
  loadConfig: { type: 'assetId' | 'assetFileId'; id: DocId | undefined } | undefined = undefined
) => {
  const { useCurrentUser } = useAuth()
  const { currentUser } = useCurrentUser<DamCurrentUserDto>(SYSTEM_DAM)

  const damConfigStore = useDamConfigStore()
  const { damPrvConfig, initialized } = storeToRefs(damConfigStore)

  if (!initialized.value.damPrvConfig) {
    console.error('Config must be loaded first.')
    return false
  }
  if (!currentUser.value) {
    console.error('Current user must be loaded first.')
    return false
  }
  if (isUndefined(loadConfig)) {
    if (damPrvConfig.value.settings.allowSelectExtSystem && damPrvConfig.value.settings.allowSelectLicenceId) {
      if (currentUser.value.selectedLicenceDto) {
        currentExtSystemId.value = currentUser.value.selectedLicenceDto.extSystem
        currentAssetLicenceId.value = currentUser.value.selectedLicenceDto.id
        return true
      } else if (currentUser.value.assetLicencesDto[0]) {
        currentExtSystemId.value = currentUser.value.assetLicencesDto[0].extSystem
        currentAssetLicenceId.value = currentUser.value.assetLicencesDto[0].id
        return true
      }
    }
    currentExtSystemId.value = damPrvConfig.value.settings.defaultExtSystemId
    currentAssetLicenceId.value = damPrvConfig.value.settings.defaultAssetLicenceId
    return true
  } else if (isString(loadConfig.id) && isDocId(loadConfig.id)) {
    let assetRes = null
    try {
      if (loadConfig.type === 'assetId') {
        assetRes = await fetchAsset(loadConfig.id)
      } else if (loadConfig.type === 'assetFileId') {
        assetRes = await fetchAssetByFileId(loadConfig.id)
      }
    } catch (e) {
      return false
    }
    if (isNull(assetRes)) {
      return false
    }
    const licenceRes = await fetchAssetLicence(assetRes.licence)
    if (licenceRes.id && licenceRes.extSystem) {
      const assetDetailStore = useAssetDetailStore()
      assetDetailStore.directDetailLoad = true
      assetDetailStore.setAsset(assetRes)
      currentAssetLicenceId.value = licenceRes.id
      currentExtSystemId.value = licenceRes.extSystem
      return true
    }
  }
  return false
}

export function useCurrentExtSystem() {
  return {
    currentExtSystemId: readonly(currentExtSystemId),
    currentExtSystem: readonly(currentExtSystem),
  }
}

export function useCurrentAssetLicence() {
  return {
    currentAssetLicenceId: readonly(currentAssetLicenceId),
    currentAssetLicence: readonly(currentAssetLicence),
  }
}
