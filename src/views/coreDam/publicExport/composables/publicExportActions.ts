import type { FilterBag, IntegerId, Pagination } from '@anzusystems/common-admin'
import { useAlerts } from '@anzusystems/common-admin'
import { ref } from 'vue'
import {
  deletePublicExport,
  fetchPublicExport, fetchPublicExportList,
  updatePublicExport,
} from '@/services/api/coreDam/publicExportApi'
import type { PublicExport } from '@/types/coreDam/PublicExport'
import { storeToRefs } from 'pinia'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { usePublicExportOneStore } from '@/stores/coreDam/publicExportStore'
import { ROUTE } from '@/router/routes'
import { useCachedAuthors } from '@/views/coreDam/author/composables/cachedAuthors'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const usePublicExportListActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()
  const listItems = ref<PublicExport[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchPublicExportList(currentExtSystemId.value, pagination, filterBag)
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
      router.push({ name: ROUTE.DAM.PUBLIC_EXPORT.LIST })
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
  const { fetchCachedAuthors, addToCachedAuthors } = useCachedAuthors()

  const fetchData = async (id: IntegerId) => {
    detailLoading.value = true
    try {
      const publicExport = await fetchPublicExport(id)
      publicExportOneStore.setPublicExport(publicExport)
      if (publicExport.authorReplacement) {
        addToCachedAuthors(publicExport.authorReplacement)
      }
      fetchCachedAuthors()

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

  const fetchData = async (id: IntegerId) => {
    detailLoading.value = true
    try {
      const publicExport = await fetchPublicExport(id)
      publicExportOneStore.setPublicExport(publicExport)
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
        name: ROUTE.DAM.PUBLIC_EXPORT.DETAIL,
        params: { id: publicExportOneStore.publicExport.id }
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
