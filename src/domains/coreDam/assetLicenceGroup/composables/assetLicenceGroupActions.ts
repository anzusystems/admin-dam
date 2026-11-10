import type { DamAssetLicenceGroup } from '@anzusystems/common-admin'
import type { FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin/labs'
import { useAssetLicenceGroupOneStore } from '@/domains/coreDam/assetLicenceGroup/store/assetLicenceGroupStore'
import {
  useFetchAssetLicenceGroup,
  useFetchAssetLicenceGroupList,
  useUpdateAssetLicenceGroup,
} from '@/domains/coreDam/assetLicenceGroup/api/assetLicenceGroupApi'
import { useCachedAssetLicences } from '@/domains/coreDam/assetLicence/composables/cachedAssetLicences'
import { useCachedExtSystems } from '@/domains/coreDam/extSystem/composables/cachedExtSystems'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useAssetLicenceGroupListActions = () => {
  const listItems = ref<DamAssetLicenceGroup[]>([])
  const { addToCachedAssetLicences, fetchCachedAssetLicences } = useCachedAssetLicences()
  const { addToCachedExtSystems, fetchCachedExtSystems } = useCachedExtSystems()
  const { executeFetch } = useFetchAssetLicenceGroupList()

  const fetchList = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    listLoading.value = true
    try {
      const res = await executeFetch(pagination, filterData, filterConfig)
      res.forEach((item) => {
        addToCachedAssetLicences(item.licences)
        addToCachedExtSystems(item.extSystem)
      })
      listItems.value = res
      fetchCachedAssetLicences()
      fetchCachedExtSystems()
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      listLoading.value = false
    }
  }

  return {
    datatableHiddenColumns,
    listLoading,
    listItems,
    fetchList,
  }
}

export const useAssetLicenceGroupDetailActions = () => {
  const assetLicenceGroupOneStore = useAssetLicenceGroupOneStore()
  const { assetLicenceGroup } = storeToRefs(assetLicenceGroupOneStore)
  const { addToCachedAssetLicences, fetchCachedAssetLicences } = useCachedAssetLicences()
  const { addToCachedExtSystems, fetchCachedExtSystems } = useCachedExtSystems()
  const { executeRequest: fetchAssetLicenceGroup } = useFetchAssetLicenceGroup()

  const fetchData = async (id: number) => {
    detailLoading.value = true
    try {
      const res = await fetchAssetLicenceGroup({ urlParams: { id } })
      addToCachedAssetLicences(res.licences)
      addToCachedExtSystems(res.extSystem)
      assetLicenceGroup.value = res
      fetchCachedAssetLicences()
      fetchCachedExtSystems()
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  return {
    assetLicenceGroup,
    detailLoading,
    fetchData,
    resetStore: assetLicenceGroupOneStore.reset,
  }
}

export const useAssetLicenceGroupEditActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const assetLicenceGroupOneStore = useAssetLicenceGroupOneStore()
  const { assetLicenceGroup } = storeToRefs(assetLicenceGroupOneStore)
  const { executeRequest: fetchAssetLicenceGroup } = useFetchAssetLicenceGroup()
  const { executeRequest: updateAssetLicenceGroup } = useUpdateAssetLicenceGroup()

  const fetchData = async (id: number) => {
    detailLoading.value = true
    try {
      assetLicenceGroup.value = await fetchAssetLicenceGroup({ urlParams: { id } })
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  const onUpdate = async (close = false) => {
    try {
      close ? (saveAndCloseButtonLoading.value = true) : (saveButtonLoading.value = true)
      v$.value.$touch()
      if (v$.value.$invalid) {
        showValidationError()
        saveButtonLoading.value = false
        saveAndCloseButtonLoading.value = false
        return
      }
      await updateAssetLicenceGroup({
        urlParams: { id: assetLicenceGroupOneStore.assetLicenceGroup.id },
        object: assetLicenceGroup.value,
      })
      showRecordWas('updated')
      if (!close) return
      router.push({ name: '/(coreDam)/asset-licence-groups' })
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      saveButtonLoading.value = false
      saveAndCloseButtonLoading.value = false
    }
  }

  return {
    detailLoading,
    saveButtonLoading,
    saveAndCloseButtonLoading,
    assetLicenceGroup,
    fetchData,
    onUpdate,
    resetStore: assetLicenceGroupOneStore.reset,
  }
}
