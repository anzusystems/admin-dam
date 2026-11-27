import type { FilterConfig, FilterData, IntegerId, Pagination } from '@anzusystems/common-admin'
import {
  SortOrder,
  defineRecordLoader,
  syncUserAndTimeTracking,
  useAlerts,
  usePageNavigation,
  usePagination,
} from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import type { Ref } from 'vue'

import { useCachedAssetLicences } from '@/domains/coreDam/assetLicence/composables/cachedAssetLicences'
import { useCachedAssetLicenceGroups } from '@/domains/coreDam/assetLicenceGroup/composables/cachedAssetLicenceGroups'
import {
  useDeleteAssetListView,
  useFetchAssetListView,
  useFetchAssetListViewList,
  useUpdateAssetListView,
} from '@/domains/coreDam/assetListView/api/assetListViewApi'
import { useCachedAssetListViews } from '@/domains/coreDam/assetListView/composables/cachedAssetListViews'
import { useAssetListViewByGroupFilter } from '@/domains/coreDam/assetListView/filter/AssetListViewFilter'
import { useAssetListViewOneStore } from '@/domains/coreDam/assetListView/store/assetListViewStore'
import type { AssetListView } from '@/domains/coreDam/assetListView/types/AssetListView'
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
  const { execute } = useFetchAssetListViewList()

  const fetchList = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    listLoading.value = true
    try {
      const res = await execute(pagination, filterData, filterConfig)
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

export const useAssetListViewByGroupActions = () => {
  const groupListViewIds = ref<IntegerId[]>([])
  const { addManualToCachedAssetListViews } = useCachedAssetListViews()
  const { execute } = useFetchAssetListViewList()
  const { filterData, filterConfig } = useAssetListViewByGroupFilter()
  const { pagination } = usePagination('position', SortOrder.Asc, { rowsPerPage: 100 })

  const fetchByGroup = async (groupId: IntegerId) => {
    filterData.groups = groupId
    try {
      const res = await execute(pagination, filterData, filterConfig)
      res.forEach((item) => addManualToCachedAssetListViews(item))
      groupListViewIds.value = res.map((item) => item.id)
    } catch (error) {
      showErrorsDefault(error)
    }
  }

  return {
    groupListViewIds,
    fetchByGroup,
  }
}

export const useAssetListViewRemoveActions = () => {
  const { push } = usePageNavigation()
  const { execute: deleteAssetListView } = useDeleteAssetListView()

  const removeAssetListView = async (id: IntegerId) => {
    detailLoading.value = true
    try {
      await deleteAssetListView({ urlParams: { id } })
      showRecordWas('deleted')
      push({ name: '/(coreDam)/asset-list-views' })
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
  const { addToCachedAssetLicenceGroups, fetchCachedAssetLicenceGroups } = useCachedAssetLicenceGroups()
  const { addToCachedExtSystems, fetchCachedExtSystems } = useCachedExtSystems()
  const { execute: fetchAssetListView } = useFetchAssetListView()

  const fetchData = defineRecordLoader(detailLoading, async (id: number, signal) => {
    const res = await fetchAssetListView({ urlParams: { id }, signal })
    addToCachedAssetLicences(res.licences)
    addToCachedAssetLicenceGroups(res.groups)
    addToCachedExtSystems(res.extSystem)
    assetListView.value = res
    fetchCachedAssetLicences()
    fetchCachedAssetLicenceGroups()
    fetchCachedExtSystems()
  })

  return {
    assetListView,
    detailLoading,
    fetchData,
    resetStore: assetListViewOneStore.reset,
  }
}

export const useAssetListViewEditActions = () => {
  const v$ = useVuelidate()
  const { push } = usePageNavigation()
  const assetListViewOneStore = useAssetListViewOneStore()
  const { assetListView } = storeToRefs(assetListViewOneStore)
  const { execute: fetchAssetListView } = useFetchAssetListView()
  const { execute: updateAssetListView } = useUpdateAssetListView()

  const fetchData = defineRecordLoader(detailLoading, async (id: number, signal) => {
    assetListView.value = await fetchAssetListView({ urlParams: { id }, signal })
  })

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
      const res = await updateAssetListView({
        urlParams: { id: assetListViewOneStore.assetListView.id },
        body: assetListView.value,
      })
      syncUserAndTimeTracking(assetListViewOneStore.assetListView, res)
      showRecordWas('updated')
      if (!close) return
      push({ name: '/(coreDam)/asset-list-views' })
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
