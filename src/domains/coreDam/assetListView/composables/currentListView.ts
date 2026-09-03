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
  const { currentExtSystemId } = useCurrentExtSystem()
  const { currentAssetLicenceId } = useCurrentAssetLicence()

  const availableListViews = computed<AssetListViewResolved[]>(
    () => currentUser.value?.listViews?.filter((view) => view.extSystem === currentExtSystemId.value) ?? []
  )

  const currentListView = computed<AssetListViewResolved | null>(() => {
    const view = currentUser.value?.listViews?.find((view) => view.id === currentUser.value?.selectedListView)
    if (!view) return null
    return view.extSystem === currentExtSystemId.value && (view.uploadLicence ?? 0) === currentAssetLicenceId.value
      ? view
      : null
  })

  const listLicenceIds = computed<IntegerId[]>(() =>
    currentListView.value ? currentListView.value.licences : [currentAssetLicenceId.value]
  )

  const uploadAllowed = computed<boolean>(() => currentAssetLicenceId.value > 0)

  return {
    availableListViews,
    currentListView,
    listLicenceIds,
    uploadAllowed,
  }
}
