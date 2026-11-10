import { useAuth } from '@/domains/system/auth/auth'
import { SYSTEM_DAM } from '@/shared/systems'
import { fetchAsset, fetchAssetByFileId } from '@/domains/coreDam/asset/api/assetApi'
import { fetchAssetLicence } from '@/domains/coreDam/assetLicence/api/assetLicenceApi'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import type { DamCurrentUserWithListViewsDto } from '@/domains/coreDam/assetListView/types/AssetListView'
import { type DamPrvConfig, isDocId, useDamConfigStore } from '@anzusystems/common-admin'

interface AssetScope {
  extSystem: IntegerId
  licences: IntegerId[]
  uploadLicence: IntegerIdNullable
  listView: IntegerIdNullable
}

const scope = ref<AssetScope>({ extSystem: 0, licences: [], uploadLicence: null, listView: null })

const licenceScope = (id: IntegerId, extSystem: IntegerId): AssetScope => ({
  extSystem,
  licences: [id],
  uploadLicence: id,
  listView: null,
})

const resolveSelectedScope = (user: DamCurrentUserWithListViewsDto, settings: DamPrvConfig['settings']): AssetScope => {
  const view = user.listViews.find((v) => v.id === user.selectedListView)
  if (view) {
    return { extSystem: view.extSystem, licences: view.licences, uploadLicence: view.uploadLicence, listView: view.id }
  }
  const selectable = settings.allowSelectExtSystem && settings.allowSelectLicenceId
  const licence = selectable ? (user.selectedLicenceDto ?? user.resolvedAssetLicences[0]) : undefined
  return licence
    ? licenceScope(licence.id, licence.extSystem)
    : licenceScope(settings.defaultAssetLicenceId, settings.defaultExtSystemId)
}

export const initCurrentExtSystemAndLicence = async (
  loadConfig: { type: 'assetId' | 'assetFileId'; id: DocId | undefined } | undefined = undefined
) => {
  const { useCurrentUser } = useAuth()
  const { currentUser } = useCurrentUser<DamCurrentUserWithListViewsDto>(SYSTEM_DAM)

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
    scope.value = selected
    return true
  }
  if (!isString(loadConfig.id) || !isDocId(loadConfig.id)) return false

  let asset
  try {
    asset = loadConfig.type === 'assetId' ? await fetchAsset(loadConfig.id) : await fetchAssetByFileId(loadConfig.id)
  } catch (e) {
    return false
  }
  if (selected.licences.includes(asset.licence)) {
    scope.value = selected
  } else {
    const licence = await fetchAssetLicence(asset.licence)
    if (!licence.id || !licence.extSystem) return false
    scope.value = licenceScope(licence.id, licence.extSystem)
  }
  const assetDetailStore = useAssetDetailStore()
  assetDetailStore.directDetailLoad = true
  assetDetailStore.setAsset(asset)
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
