import {
  HTTP_STATUS_NOT_FOUND,
  isAnzuApiForbiddenError,
  isDocId,
  isNull,
  isString,
  isUndefined,
  useDamConfigStore,
  useExtSystemIdForCached,
} from '@anzusystems/common-admin'
import type { DamCurrentUserDto, DocId } from '@anzusystems/common-admin'
import { isAxiosError } from 'axios'
import { storeToRefs } from 'pinia'
import { readonly, ref } from 'vue'

import { fetchAsset, fetchAssetByFileId } from '@/domains/coreDam/asset/api/assetApi'
import { fetchAssetLicence } from '@/domains/coreDam/assetLicence/api/assetLicenceApi'
import { useAuth } from '@/domains/system/auth/auth'
import { SYSTEM_DAM } from '@/shared/systems'

const currentExtSystemId = ref(0)

const currentAssetLicenceId = ref(0)

// The library name caches read their own ext system id, so it is written along with the current one.
const { cachedExtSystemId } = useExtSystemIdForCached()

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
        cachedExtSystemId.value = currentExtSystemId.value
        currentAssetLicenceId.value = currentUser.value.selectedLicenceDto.id
        return true
      } else if (currentUser.value.assetLicencesDto[0]) {
        currentExtSystemId.value = currentUser.value.assetLicencesDto[0].extSystem
        cachedExtSystemId.value = currentExtSystemId.value
        currentAssetLicenceId.value = currentUser.value.assetLicencesDto[0].id
        return true
      }
    }
    currentExtSystemId.value = damPrvConfig.value.settings.defaultExtSystemId
    cachedExtSystemId.value = currentExtSystemId.value
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
      /*
       * Only "not found" returns `false`, which shows the not-found page. An outage
       * must reach the caller, or the user would be told the asset was deleted.
       * The status is on `cause` because `useApiRequest` wraps every failure, and the wrapper is not an axios error.
       */
      if (isAnzuApiForbiddenError(e)) return false
      const cause = (e as { cause?: unknown })?.cause
      if (isAxiosError(cause) && cause.response?.status === HTTP_STATUS_NOT_FOUND) return false
      throw e
    }
    if (isNull(assetRes)) {
      return false
    }
    // Same classification: a licence this user may not read is a dead link, not an outage.
    let licenceRes
    try {
      licenceRes = await fetchAssetLicence(assetRes.licence)
    } catch (e) {
      if (isAnzuApiForbiddenError(e)) return false
      const licenceCause = (e as { cause?: unknown })?.cause
      if (isAxiosError(licenceCause) && licenceCause.response?.status === HTTP_STATUS_NOT_FOUND) return false
      throw e
    }
    if (licenceRes.id && licenceRes.extSystem) {
      currentAssetLicenceId.value = licenceRes.id
      currentExtSystemId.value = licenceRes.extSystem
      cachedExtSystemId.value = currentExtSystemId.value
      return true
    }
  }
  return false
}

export function useCurrentExtSystem() {
  return {
    currentExtSystemId: readonly(currentExtSystemId),
  }
}

export function useCurrentAssetLicence() {
  return {
    currentAssetLicenceId: readonly(currentAssetLicenceId),
  }
}
