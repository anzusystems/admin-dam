import { useAlerts } from '@anzusystems/common-admin'
import { useErrorHandler } from '@anzusystems/common-admin'
import { ref } from 'vue'
import type { Pagination } from '@/types/Pagination'
import type { FilterBag } from '@/types/Filter'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import {
  fetchDistributionCategorySelect,
  fetchDistributionCategorySelectList,
  updateDistributionCategorySelect,
} from '@/services/api/dam/distributionCategorySelectApi'
import type { DistributionCategorySelect } from '@/types/dam/DistributionCategorySelect'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ROUTE } from '@/router/routes'
import { useDistributionCategorySelectOneStore } from '@/stores/dam/distributionCategorySelectStore'

const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const { currentExtSystemId } = useCurrentExtSystem()

const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useDistributionCategorySelectListActions = () => {
  const listItems = ref<DistributionCategorySelect[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchDistributionCategorySelectList(currentExtSystemId.value, pagination, filterBag)
    } catch (error) {
      handleError(error)
    } finally {
      listLoading.value = false
    }
  }

  return {
    listLoading,
    listItems,
    fetchList,
  }
}

export const useDistributionCategorySelectDetailActions = () => {
  const distributionCategorySelectOneStore = useDistributionCategorySelectOneStore()
  const { distributionCategorySelect } = storeToRefs(distributionCategorySelectOneStore)

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const distributionCategorySelect = await fetchDistributionCategorySelect(id)
      distributionCategorySelectOneStore.setDistributionCategorySelect(distributionCategorySelect)
    } catch (error) {
      handleError(error)
    } finally {
      detailLoading.value = false
    }
  }

  return {
    distributionCategorySelect,
    detailLoading,
    fetchData,
    resetStore: distributionCategorySelectOneStore.reset,
  }
}

export const useDistributionCategorySelectEditActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const distributionCategorySelectOneStore = useDistributionCategorySelectOneStore()
  const { distributionCategorySelect } = storeToRefs(distributionCategorySelectOneStore)

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const distributionCategorySelect = await fetchDistributionCategorySelect(id)
      distributionCategorySelectOneStore.setDistributionCategorySelect(distributionCategorySelect)
    } catch (error) {
      handleError(error)
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
      await updateDistributionCategorySelect(
        distributionCategorySelectOneStore.distributionCategorySelect.id,
        distributionCategorySelect.value
      )
      showRecordWas('updated')
      if (!close) return
      router.push({ name: ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.LIST })
    } catch (error) {
      handleError(error)
    } finally {
      saveButtonLoading.value = false
      saveAndCloseButtonLoading.value = false
    }
  }

  return {
    detailLoading,
    saveButtonLoading,
    saveAndCloseButtonLoading,
    distributionCategorySelect,
    fetchData,
    onUpdate,
    resetStore: distributionCategorySelectOneStore.reset,
  }
}
