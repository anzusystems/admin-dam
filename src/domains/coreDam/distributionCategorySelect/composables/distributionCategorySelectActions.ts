import type { FilterBag, Pagination } from '@anzusystems/common-admin'
import { isAnzuApiValidationError } from '@anzusystems/common-admin'
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import {
  fetchDistributionCategorySelect,
  fetchDistributionCategorySelectList,
  updateDistributionCategorySelect,
} from '@/domains/coreDam/distributionCategorySelect/api/distributionCategorySelectApi'
import type { DistributionCategorySelect } from '@/domains/coreDam/distributionCategorySelect/types/DistributionCategorySelect'
import { useDistributionCategorySelectOneStore } from '@/domains/coreDam/distributionCategorySelect/store/distributionCategorySelectStore'

const { showValidationError, showRecordWas, showErrorsDefault, showApiValidationError } = useAlerts()

const { currentExtSystemId } = useCurrentExtSystem()

const datatableHiddenColumns = ref<Array<string>>(['id'])
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
    datatableHiddenColumns,
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
      router.push({ name: '/(coreDam)/distribution-category-selects' })
    } catch (error) {
      if (isAnzuApiValidationError(error)) {
        const updatedErrors = new Map<string, string[]>()
        const regex = /^coreDam\.distributionCategorySelect\.model\.options.*/
        error.fields.forEach((item) => {
          const checkArrayField = regex.test(item.field)
          if (checkArrayField) {
            updatedErrors.set('coreDam.distributionCategorySelect.model.options', item.errors)
          } else {
            updatedErrors.set(item.field, item.errors)
          }
        })
        const updatedErrorsArray = Array.from(updatedErrors, ([key, value]) => ({ field: key, errors: value }))
        showApiValidationError(updatedErrorsArray)
      } else {
        showErrorsDefault(error)
      }
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
