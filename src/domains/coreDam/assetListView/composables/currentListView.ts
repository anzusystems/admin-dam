import { useAuth } from '@/domains/system/auth/auth'
import { SYSTEM_DAM } from '@/shared/systems'
import { useCurrentAssetLicence, useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import type {
  AssetListViewResolved,
  DamCurrentUserWithListViewsDto,
} from '@/domains/coreDam/assetListView/types/AssetListView'
import type { DamAssetTypeType } from '@anzusystems/common-admin'

const selectedListViewId = ref<IntegerId | null>(null)

/**
 * Scope of the asset list. Without an applicable view it stays on the upload licence, which is the behaviour
 * of the single licence listing.
 */
export const useCurrentListView = () => {
  const { useCurrentUser } = useAuth()
  const { currentUser } = useCurrentUser<DamCurrentUserWithListViewsDto>(SYSTEM_DAM)
  const { currentExtSystemId } = useCurrentExtSystem()
  const { currentAssetLicenceId } = useCurrentAssetLicence()

  const availableListViews = computed<AssetListViewResolved[]>(
    () => currentUser.value?.listViews?.filter((view) => view.extSystem === currentExtSystemId.value) ?? []
  )

  const currentListView = computed<AssetListViewResolved | null>(
    () =>
      availableListViews.value.find((view) => view.id === selectedListViewId.value) ??
      availableListViews.value[0] ??
      null
  )

  const listLicenceIds = computed<IntegerId[]>(() =>
    currentListView.value ? currentListView.value.licences : [currentAssetLicenceId.value]
  )

  const listAssetTypes = computed<DamAssetTypeType[]>(() => currentListView.value?.types ?? [])

  const setCurrentListView = (id: IntegerId | null) => {
    selectedListViewId.value = id
  }

  return {
    availableListViews,
    currentListView,
    listLicenceIds,
    listAssetTypes,
    setCurrentListView,
  }
}
