import type { FilterBag, Pagination } from '@anzusystems/common-admin'
import {
  deletePublicExport,
  fetchPublicExport,
  fetchPublicExportList,
  updatePublicExport,
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

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      const res = await fetchPublicExportList(pagination, filterBag)
      res.forEach((item) => {
        addToCachedAssetLicences(item.assetLicence)
        fetchCachedAssetLicences()
      })
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
      await deletePublicExport(id)
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
      const res = await fetchPublicExport(id)
      addToCachedAssetLicences(res.assetLicence)
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
      const res = await fetchPublicExport(id)
      addToCachedAssetLicences(res.assetLicence)
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
      await updatePublicExport(publicExportOneStore.publicExport.id, publicExport.value)
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
