import type { FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin/labs'
import {
  useDeletePublicExport,
  useFetchPublicExport,
  useFetchPublicExportList,
  useUpdatePublicExport,
} from '@/domains/coreDam/publicExport/api/publicExportApi'
import type { PublicExport } from '@/domains/coreDam/publicExport/types/PublicExport'
import { usePublicExportOneStore } from '@/domains/coreDam/publicExport/store/publicExportStore'
import { useCachedAssetLicences } from '@/domains/coreDam/assetLicence/composables/cachedAssetLicences'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const usePublicExportListActions = () => {
  const listItems = ref<PublicExport[]>([])
  const { addToCachedAssetLicences, fetchCachedAssetLicences } = useCachedAssetLicences()
  const { executeFetch } = useFetchPublicExportList()

  const fetchList = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    listLoading.value = true
    try {
      const res = await executeFetch(pagination, filterData, filterConfig)
      res.forEach((item) => item.licences.forEach((licenceId) => addToCachedAssetLicences(licenceId)))
      fetchCachedAssetLicences()
      listItems.value = res
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

export const usePublicExportRemoveActions = () => {
  const router = useRouter()
  const removePublicExport = async (id: IntegerId) => {
    detailLoading.value = true
    try {
      const { executeRequest: deletePublicExport } = useDeletePublicExport()
      await deletePublicExport({ urlParams: { id } })
      showRecordWas('updated')
      router.push({ name: '/(coreDam)/public-exports' })
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  return {
    removePublicExport,
  }
}

export const usePublicExportDetailActions = () => {
  const publicExportOneStore = usePublicExportOneStore()
  const { publicExport } = storeToRefs(publicExportOneStore)
  const { addToCachedAssetLicences, fetchCachedAssetLicences } = useCachedAssetLicences()

  const fetchData = async (id: IntegerId) => {
    detailLoading.value = true
    try {
      const { executeRequest: fetchPublicExport } = useFetchPublicExport()
      const res = await fetchPublicExport({ urlParams: { id } })
      res.licences.forEach((licenceId) => addToCachedAssetLicences(licenceId))
      fetchCachedAssetLicences()
      publicExport.value = res
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  return {
    publicExport,
    detailLoading,
    fetchData,
    resetStore: publicExportOneStore.reset,
  }
}

export const usePublicExportEditActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const publicExportOneStore = usePublicExportOneStore()
  const { publicExport } = storeToRefs(publicExportOneStore)
  const { addToCachedAssetLicences, fetchCachedAssetLicences } = useCachedAssetLicences()

  const fetchData = async (id: IntegerId) => {
    detailLoading.value = true
    try {
      const { executeRequest: fetchPublicExport } = useFetchPublicExport()
      const res = await fetchPublicExport({ urlParams: { id } })
      res.licences.forEach((licenceId) => addToCachedAssetLicences(licenceId))
      fetchCachedAssetLicences()
      publicExport.value = res
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
      const { executeRequest: updatePublicExport } = useUpdatePublicExport()
      await updatePublicExport({
        urlParams: { id: publicExportOneStore.publicExport.id },
        object: publicExport.value,
      })
      showRecordWas('updated')

      router.push({
        name: '/(coreDam)/public-exports/[id]',
        params: { id: publicExportOneStore.publicExport.id },
      })
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
    publicExport,
    fetchData,
    onUpdate,
    resetStore: publicExportOneStore.reset,
  }
}
