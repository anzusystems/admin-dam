import { fetchDamAssetLicenceListByIds } from '@anzusystems/common-admin'
import { damClient } from '@/shared/apiClients/damClient'
import { useFetchAssetLicenceGroup } from '@/domains/coreDam/assetLicenceGroup/api/assetLicenceGroupApi'
import type { AssetListView } from '@/domains/coreDam/assetListView/types/AssetListView'

/**
 * Licences offered by the form are the ones the targeted groups already grant, so an admin cannot build
 * a view his audience is not entitled to. Without targeting the whole external system is offered.
 */
export function useAssetListViewFormOptions(assetListView: Ref<AssetListView>) {
  const { showErrorsDefault } = useAlerts()
  const { executeRequest: fetchAssetLicenceGroup } = useFetchAssetLicenceGroup()

  const groupLicenceOptions = ref<ValueObjectOption<IntegerId>[]>([])
  const uploadLicenceOptions = ref<ValueObjectOption<IntegerId>[]>([])

  const targetedByGroups = computed(() => assetListView.value.groups.length > 0)

  let requestSequence = 0

  const loadGroupLicenceOptions = async (): Promise<boolean> => {
    const sequence = ++requestSequence
    try {
      const groups = await Promise.all(
        assetListView.value.groups.map((id) => fetchAssetLicenceGroup({ urlParams: { id } }))
      )
      const licenceIds = [...new Set(groups.flatMap((group) => group.licences))]
      const licences = await fetchDamAssetLicenceListByIds(damClient, licenceIds)
      if (sequence !== requestSequence) return false
      groupLicenceOptions.value = licences.map((licence) => ({ value: licence.id, title: licence.name }))

      return true
    } catch (error) {
      if (sequence === requestSequence) showErrorsDefault(error)

      return false
    }
  }

  watch(
    () => assetListView.value.groups,
    async () => {
      if (!targetedByGroups.value) {
        requestSequence++
        groupLicenceOptions.value = []
        return
      }
      if (await loadGroupLicenceOptions()) {
        const offeredIds = groupLicenceOptions.value.map((option) => option.value)
        assetListView.value.licences = assetListView.value.licences.filter((id) => offeredIds.includes(id))
      }
    },
    { immediate: true, deep: true }
  )

  let uploadLicenceRequestSequence = 0

  const loadUploadLicenceOptions = async (): Promise<void> => {
    const sequence = ++uploadLicenceRequestSequence
    if (assetListView.value.licences.length === 0) {
      uploadLicenceOptions.value = []
      return
    }
    try {
      const licences = await fetchDamAssetLicenceListByIds(damClient, assetListView.value.licences)
      if (sequence !== uploadLicenceRequestSequence) return
      uploadLicenceOptions.value = licences.map((licence) => ({ value: licence.id, title: licence.name }))
    } catch (error) {
      if (sequence === uploadLicenceRequestSequence) showErrorsDefault(error)
    }
  }

  watch(
    () => assetListView.value.licences,
    async () => {
      await loadUploadLicenceOptions()
      if (
        !isNull(assetListView.value.uploadLicence) &&
        !assetListView.value.licences.includes(assetListView.value.uploadLicence)
      ) {
        assetListView.value.uploadLicence = null
      }
    },
    { immediate: true, deep: true }
  )

  return {
    groupLicenceOptions,
    uploadLicenceOptions,
    targetedByGroups,
  }
}
