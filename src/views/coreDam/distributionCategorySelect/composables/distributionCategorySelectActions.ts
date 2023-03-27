import type { FilterBag, Pagination } from '@anzusystems/common-admin'
import { useAlerts } from '@anzusystems/common-admin'
import { ref } from 'vue'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import {
  fetchDistributionCategorySelect,
  fetchDistributionCategorySelectList,
  updateDistributionCategorySelect,
} from '@/services/api/coreDam/distributionCategorySelectApi'
import type { DistributionCategorySelect } from '@/types/coreDam/DistributionCategorySelect'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ROUTE } from '@/router/routes'
import { useDistributionCategorySelectOneStore } from '@/stores/coreDam/distributionCategorySelectStore'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

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
      showErrorsDefault(error)
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
      showErrorsDefault(error)
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
      await updateDistributionCategorySelect(
        distributionCategorySelectOneStore.distributionCategorySelect.id,
        distributionCategorySelect.value
      )
      showRecordWas('updated')
      if (!close) return
      router.push({ name: ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.LIST })
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
    distributionCategorySelect,
    fetchData,
    onUpdate,
    resetStore: distributionCategorySelectOneStore.reset,
  }
}
