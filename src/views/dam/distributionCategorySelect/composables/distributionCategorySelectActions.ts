import { useUiHelper } from '@/composables/system/uiHelper'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
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

const { loaderOn, loaderOff, btnDisable, btnEnable, btnLoadingOn, btnReset } = useUiHelper()
const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const { currentExtSystemId } = useCurrentExtSystem()

export const useDistributionCategorySelectListActions = () => {
  const listItems = ref<DistributionCategorySelect[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    loaderOn('list')
    try {
      listItems.value = await fetchDistributionCategorySelectList(currentExtSystemId.value, pagination, filterBag)
    } catch (error) {
      handleError(error)
    } finally {
      loaderOff('list')
    }
  }

  return {
    listItems,
    fetchList,
  }
}

export const useDistributionCategorySelectDetailActions = () => {
  const distributionCategorySelectOneStore = useDistributionCategorySelectOneStore()
  const { distributionCategorySelect, loaded } = storeToRefs(distributionCategorySelectOneStore)

  const fetchData = async (id: string) => {
    loaderOn('detail')
    try {
      const distributionCategorySelect = await fetchDistributionCategorySelect(id)
      distributionCategorySelectOneStore.setDistributionCategorySelect(distributionCategorySelect)
      distributionCategorySelectOneStore.setLoaded(true)
    } catch (error) {
      handleError(error)
    } finally {
      loaderOff('detail')
    }
  }

  return {
    distributionCategorySelect,
    loaded,
    fetchData,
    resetStore: distributionCategorySelectOneStore.reset,
  }
}

export const useDistributionCategorySelectEditActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const distributionCategorySelectOneStore = useDistributionCategorySelectOneStore()
  const { distributionCategorySelect, loaded } = storeToRefs(distributionCategorySelectOneStore)

  const fetchData = async (id: string) => {
    loaderOn('edit')
    try {
      const distributionCategorySelect = await fetchDistributionCategorySelect(id)
      distributionCategorySelectOneStore.setDistributionCategorySelect(distributionCategorySelect)
      distributionCategorySelectOneStore.setLoaded(true)
    } catch (error) {
      handleError(error)
    } finally {
      loaderOff('edit')
    }
  }

  const onUpdate = async (close = false) => {
    try {
      btnDisable('save', 'saveAndClose', 'delete')
      v$.value.$touch()
      if (v$.value.$invalid) {
        showValidationError()
        btnEnable('save', 'saveAndClose', 'delete')
        return
      }
      btnDisable(close ? 'save' : 'saveAndClose', 'delete')
      btnLoadingOn(close ? 'saveAndClose' : 'save')
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
      btnReset('save', 'saveAndClose', 'delete')
    }
  }

  return {
    loaded,
    distributionCategorySelect,
    fetchData,
    onUpdate,
    resetStore: distributionCategorySelectOneStore.reset,
  }
}
