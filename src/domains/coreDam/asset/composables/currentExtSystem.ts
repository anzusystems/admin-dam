import {
  HTTP_STATUS_NOT_FOUND,
  isAnzuApiForbiddenError,
  isDocId,
  isString,
  isUndefined,
  useDamConfigStore,
  useExtSystemIdForCached,
} from '@anzusystems/common-admin'
import type { DamCurrentUserDto, DamPrvConfig, DocId, IntegerId, IntegerIdNullable } from '@anzusystems/common-admin'
import { isAxiosError } from 'axios'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

import { fetchAsset, fetchAssetByFileId } from '@/domains/coreDam/asset/api/assetApi'
import { fetchAssetLicence } from '@/domains/coreDam/assetLicence/api/assetLicenceApi'
import { useAuth } from '@/domains/system/auth/auth'
import { SYSTEM_DAM } from '@/shared/systems'

interface AssetScope {
  extSystem: IntegerId
  licences: IntegerId[]
  uploadLicence: IntegerIdNullable
  listView: IntegerIdNullable
}

const scope = ref<AssetScope>({ extSystem: 0, licences: [], uploadLicence: null, listView: null })

// The library name caches read their own ext system id, so it is written along with the current one.
const { cachedExtSystemId } = useExtSystemIdForCached()

const setScope = (value: AssetScope) => {
  scope.value = value
  cachedExtSystemId.value = value.extSystem
}

const licenceScope = (id: IntegerId, extSystem: IntegerId): AssetScope => ({
  extSystem,
  licences: [id],
  uploadLicence: id,
  listView: null,
})

export const licenceSelectionAllowed = (settings: DamPrvConfig['settings']) =>
  settings.allowSelectExtSystem && settings.allowSelectLicenceId

const resolveSelectedScope = (user: DamCurrentUserDto, settings: DamPrvConfig['settings']): AssetScope => {
  const view = user.listViews.find((v) => v.id === user.selectedListView)
  if (view) {
    return { extSystem: view.extSystem, licences: view.licences, uploadLicence: view.uploadLicence, listView: view.id }
  }
  const allowed = licenceSelectionAllowed(settings)
  const licence = allowed ? (user.selectedLicenceDto ?? user.resolvedAssetLicences[0]) : undefined
  return licence
    ? licenceScope(licence.id, licence.extSystem)
    : licenceScope(settings.defaultAssetLicenceId, settings.defaultExtSystemId)
}

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

  const selected = resolveSelectedScope(currentUser.value, damPrvConfig.value.settings)

  if (isUndefined(loadConfig)) {
    setScope(selected)
    return true
  }
  if (!isString(loadConfig.id) || !isDocId(loadConfig.id)) return false

  let asset
  try {
    asset = loadConfig.type === 'assetId' ? await fetchAsset(loadConfig.id) : await fetchAssetByFileId(loadConfig.id)
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
  if (selected.licences.includes(asset.licence)) {
    setScope(selected)
    return true
  }
  // Same classification: a licence this user may not read is a dead link, not an outage.
  let licence
  try {
    licence = await fetchAssetLicence(asset.licence)
  } catch (e) {
    if (isAnzuApiForbiddenError(e)) return false
    const licenceCause = (e as { cause?: unknown })?.cause
    if (isAxiosError(licenceCause) && licenceCause.response?.status === HTTP_STATUS_NOT_FOUND) return false
    throw e
  }
  if (!licence.id || !licence.extSystem) return false
  setScope(licenceScope(licence.id, licence.extSystem))
  return true
}

export function useCurrentExtSystem() {
  return {
    currentExtSystemId: computed(() => scope.value.extSystem),
    currentListViewId: computed(() => scope.value.listView),
  }
}

export function useCurrentAssetLicence() {
  const currentAssetLicenceId = computed(() => scope.value.uploadLicence ?? 0)
  return {
    currentAssetLicenceId,
    uploadAllowed: computed(() => currentAssetLicenceId.value > 0),
    listLicenceIds: computed(() => scope.value.licences),
  }
}
