import type { FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin/labs'
import type { AssetListView } from '@/domains/coreDam/assetListView/types/AssetListView'
import { useAssetListViewOneStore } from '@/domains/coreDam/assetListView/store/assetListViewStore'
import {
  useDeleteAssetListView,
  useFetchAssetListView,
  useFetchAssetListViewList,
  useUpdateAssetListView,
} from '@/domains/coreDam/assetListView/api/assetListViewApi'
import { useCachedAssetLicences } from '@/domains/coreDam/assetLicence/composables/cachedAssetLicences'
import { useCachedExtSystems } from '@/domains/coreDam/extSystem/composables/cachedExtSystems'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useAssetListViewListActions = () => {
  const listItems = ref<AssetListView[]>([])
  const { addToCachedAssetLicences, fetchCachedAssetLicences } = useCachedAssetLicences()
  const { addToCachedExtSystems, fetchCachedExtSystems } = useCachedExtSystems()
  const { executeFetch } = useFetchAssetListViewList()

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

export const useAssetListViewRemoveActions = () => {
  const router = useRouter()
  const { executeRequest: deleteAssetListView } = useDeleteAssetListView()

  const removeAssetListView = async (id: IntegerId) => {
    detailLoading.value = true
    try {
      await deleteAssetListView({ urlParams: { id } })
      showRecordWas('deleted')
      router.push({ name: '/(coreDam)/asset-list-views' })
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  return {
    removeAssetListView,
  }
}

export const useAssetListViewDetailActions = () => {
  const assetListViewOneStore = useAssetListViewOneStore()
  const { assetListView } = storeToRefs(assetListViewOneStore)
  const { addToCachedAssetLicences, fetchCachedAssetLicences } = useCachedAssetLicences()
  const { addToCachedExtSystems, fetchCachedExtSystems } = useCachedExtSystems()
  const { executeRequest: fetchAssetListView } = useFetchAssetListView()

  const fetchData = async (id: IntegerId) => {
    detailLoading.value = true
    try {
      const res = await fetchAssetListView({ urlParams: { id } })
      addToCachedAssetLicences(res.licences)
      addToCachedExtSystems(res.extSystem)
      assetListView.value = res
      fetchCachedAssetLicences()
      fetchCachedExtSystems()
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  return {
    assetListView,
    detailLoading,
    fetchData,
    resetStore: assetListViewOneStore.reset,
  }
}

export const useAssetListViewEditActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const assetListViewOneStore = useAssetListViewOneStore()
  const { assetListView } = storeToRefs(assetListViewOneStore)
  const { executeRequest: fetchAssetListView } = useFetchAssetListView()
  const { executeRequest: updateAssetListView } = useUpdateAssetListView()

  const fetchData = async (id: IntegerId) => {
    detailLoading.value = true
    try {
      assetListView.value = await fetchAssetListView({ urlParams: { id } })
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
      await updateAssetListView({
        urlParams: { id: assetListViewOneStore.assetListView.id },
        object: assetListView.value,
      })
      showRecordWas('updated')
      if (!close) return
      router.push({ name: '/(coreDam)/asset-list-views' })
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
    assetListView,
    fetchData,
    onUpdate,
    resetStore: assetListViewOneStore.reset,
  }
}
