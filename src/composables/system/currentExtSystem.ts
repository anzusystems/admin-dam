import { useAuth } from '@/composables/auth/auth'
import { SYSTEM_DAM } from '@/model/systems'
import { fetchAsset } from '@/services/api/coreDam/assetApi'
import { fetchAssetLicence } from '@/services/api/coreDam/assetLicenceApi'
import { fetchExtSystem } from '@/services/api/coreDam/extSystemApi'
import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'
import type { DamAssetLicence, DamCurrentUserDto, DamExtSystem } from '@anzusystems/common-admin'
import { isDocId, isString, useDamConfigStore } from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { readonly, ref, watch } from 'vue'

const currentExtSystemId = ref(0)
const currentExtSystem = ref<DamExtSystem>()

const currentAssetLicence = ref<DamAssetLicence>()
const currentAssetLicenceId = ref(0)

export const initCurrentExtSystemAndLicence = (loadFromAsset = false, assetId: string | undefined = undefined) => {
  const { useCurrentUser } = useAuth()
  const { currentUser } = useCurrentUser<DamCurrentUserDto>(SYSTEM_DAM)

const damConfigStore = useDamConfigStore()
const { damPrvConfig, initialized } = storeToRefs(damConfigStore)

  watch(currentExtSystemId, async (newValue, oldValue) => {
    if (newValue !== oldValue && newValue > 0) {
      currentExtSystem.value = undefined
      currentExtSystem.value = await fetchExtSystem(currentExtSystemId.value)
    }
  })

  watch(currentAssetLicenceId, async (newValue, oldValue) => {
    if (newValue !== oldValue && newValue > 0) {
      currentAssetLicence.value = undefined
      currentAssetLicence.value = await fetchAssetLicence(currentAssetLicenceId.value)
    }
  })

  return new Promise((resolve, reject) => {
    if (!initialized.value.damPrvConfig) {
      console.error('Config must be loaded first.')
      reject(false)
      return
    }
    if (!currentUser.value) {
      console.error('Current user must be loaded first.')
      reject(false)
      return
    }
    if (loadFromAsset && isString(assetId) && isDocId(assetId)) {
      fetchAsset(assetId)
        .then((assetRes) => {
          fetchAssetLicence(assetRes.licence)
            .then((licenceRes) => {
              if (licenceRes.id && licenceRes.extSystem) {
                const assetDetailStore = useAssetDetailStore()
                assetDetailStore.directDetailLoad = true
                assetDetailStore.setAsset(assetRes)
                currentAssetLicenceId.value = licenceRes.id
                currentExtSystemId.value = licenceRes.extSystem
                resolve(true)
                return
              }
              reject(false)
              return
            })
            .catch(() => {
              reject(false)
              return
            })
          reject(false)
          return
        })
        .catch(() => {
          reject(false)
          return
        })
    }
    if (damPrvConfig.value.settings.allowSelectExtSystem && damPrvConfig.value.settings.allowSelectLicenceId) {
      if (currentUser.value.selectedLicenceDto) {
        currentExtSystemId.value = currentUser.value.selectedLicenceDto.extSystem
        currentAssetLicenceId.value = currentUser.value.selectedLicenceDto.id
        resolve(true)
        return
      } else if (currentUser.value.assetLicencesDto[0]) {
        currentExtSystemId.value = currentUser.value.assetLicencesDto[0].extSystem
        currentAssetLicenceId.value = currentUser.value.assetLicencesDto[0].id
        resolve(true)
        return
      }
    }
    currentExtSystemId.value = damPrvConfig.value.settings.defaultExtSystemId
    currentAssetLicenceId.value = damPrvConfig.value.settings.defaultAssetLicenceId
    resolve(true)
  })
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
