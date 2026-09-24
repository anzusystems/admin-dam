import { isAnzuApiValidationError, isUndefined, renumberPositions, useAlerts } from '@anzusystems/common-admin'
import type { FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import {
  useFetchDistributionCategorySelect,
  useFetchDistributionCategorySelectList,
  useUpdateDistributionCategorySelect,
} from '@/domains/coreDam/distributionCategorySelect/api/distributionCategorySelectApi'
import { useDistributionCategorySelectOneStore } from '@/domains/coreDam/distributionCategorySelect/store/distributionCategorySelectStore'
import type { DistributionCategorySelect } from '@/domains/coreDam/distributionCategorySelect/types/DistributionCategorySelect'

const { showValidationError, showRecordWas, showErrorsDefault, showApiValidationError } = useAlerts()

const { currentExtSystemId } = useCurrentExtSystem()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

export const useDistributionCategorySelectListActions = () => {
  const listItems = ref<DistributionCategorySelect[]>([])
  const { execute } = useFetchDistributionCategorySelectList()

  const fetchList = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    listLoading.value = true
    try {
      listItems.value = await execute(pagination, filterData, filterConfig, {
        urlParams: { extSystemId: currentExtSystemId.value },
      })
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
      const { execute: fetchDistributionCategorySelect } = useFetchDistributionCategorySelect()
      const distributionCategorySelect = await fetchDistributionCategorySelect({ urlParams: { id } })
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
      const { execute: fetchDistributionCategorySelect } = useFetchDistributionCategorySelect()
      const distributionCategorySelect = await fetchDistributionCategorySelect({ urlParams: { id } })
      distributionCategorySelectOneStore.setDistributionCategorySelect(distributionCategorySelect)
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  const onUpdate = async (
    close = false,
    validateLists: () => boolean = () => true,
    onSuccess: ((distributionCategorySelect: DistributionCategorySelect) => void) | undefined = undefined
  ) => {
    try {
      close ? (saveAndCloseButtonLoading.value = true) : (saveButtonLoading.value = true)
      v$.value.$touch()
      // Evaluate before the `||` — validateLists() reveals invalid option rows as a side effect.
      const listsValid = validateLists()
      if (v$.value.$invalid || !listsValid) {
        showValidationError()
        saveButtonLoading.value = false
        saveAndCloseButtonLoading.value = false
        return
      }
      const { execute: updateDistributionCategorySelect } = useUpdateDistributionCategorySelect()
      // New rows carry a negative temp id for the editor key; the API expects '' for new options.
      const object: DistributionCategorySelect = {
        ...distributionCategorySelect.value,
        options: renumberPositions(distributionCategorySelect.value.options).map((option) =>
          Number(option.id) < 0 ? { ...option, id: '' } : option
        ),
      }
      const updated = await updateDistributionCategorySelect({
        urlParams: { id: distributionCategorySelectOneStore.distributionCategorySelect.id },
        body: object,
      })
      // Adopt the response (real ids for new rows, sorted by `setDistributionCategorySelect`) so the
      // editor can re-baseline via commit() and saved rows lose their unsaved markers.
      distributionCategorySelectOneStore.setDistributionCategorySelect(updated)
      showRecordWas('updated')
      if (!isUndefined(onSuccess)) onSuccess(updated)
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
