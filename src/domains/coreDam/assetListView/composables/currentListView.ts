import { useAuth } from '@/domains/system/auth/auth'
import { SYSTEM_DAM } from '@/shared/systems'
import { useCurrentAssetLicence, useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import type {
  AssetListViewResolved,
  DamCurrentUserWithListViewsDto,
} from '@/domains/coreDam/assetListView/types/AssetListView'

export const useCurrentListView = () => {
  const { useCurrentUser } = useAuth()
  const { currentUser } = useCurrentUser<DamCurrentUserWithListViewsDto>(SYSTEM_DAM)
  const { currentExtSystemId, currentListViewId } = useCurrentExtSystem()
  const { currentAssetLicenceId } = useCurrentAssetLicence()

  const availableListViews = computed<AssetListViewResolved[]>(
    () => currentUser.value?.listViews?.filter((view) => view.extSystem === currentExtSystemId.value) ?? []
  )

  const currentListView = computed<AssetListViewResolved | null>(
    () => currentUser.value?.listViews?.find((view) => view.id === currentListViewId.value) ?? null
  )

  const listLicenceIds = computed<IntegerId[]>(() =>
    currentListView.value ? currentListView.value.licences : [currentAssetLicenceId.value]
  )

  return {
    availableListViews,
    currentListView,
    listLicenceIds,
  }
}
