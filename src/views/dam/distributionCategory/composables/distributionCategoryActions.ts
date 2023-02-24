import type { DocId } from '@anzusystems/common-admin'
import { useAlerts } from '@anzusystems/common-admin'
import { useErrorHandler } from '@anzusystems/common-admin'
import { ref } from 'vue'
import type { Pagination } from '@/types/Pagination'
import type { FilterBag } from '@/types/Filter'
import {
  createDistributionCategory,
  fetchDistributionCategory,
  fetchDistributionCategoryList,
  fetchDistributionCategoryListByIds,
  updateDistributionCategory,
} from '@/services/api/dam/distributionCategoryApi'
import type { DistributionCategory } from '@/types/dam/DistributionCategory'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import useVuelidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { fetchDistributionCategorySelectList } from '@/services/api/dam/distributionCategorySelectApi'
import { ROUTE } from '@/router/routes'
import { useDistributionCategoryOneStore } from '@/stores/dam/distributionCategoryStore'
import { usePagination } from '@anzusystems/common-admin'
import { useDistributionCategorySelectListFilter } from '@/model/dam/filter/DistributionCategorySelectFilter'
import { simpleCloneObject } from '@/utils/object'
import { useDistributionCategoryFactory } from '@/model/dam/factory/DistributionCategoryFactory'
import type { ValueObjectOption } from '@/types/ValueObject'

const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)
const createButtonLoading = ref(false)
const createFormDataLoaded = ref(false)

const { currentExtSystemId } = useCurrentExtSystem()

export const useDistributionCategoryListActions = () => {
  const listItems = ref<DistributionCategory[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchDistributionCategoryList(currentExtSystemId.value, pagination, filterBag)
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

export const useDistributionCategoryDetailActions = () => {
  const distributionCategoryOneStore = useDistributionCategoryOneStore()
  const { distributionCategory, distributionCategorySelects, distributionCategorySelectedOptions } =
    storeToRefs(distributionCategoryOneStore)
  const { fetchDistributionCategorySelectsData } = useDistributionCategoryManageActions()

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const distributionCategory = await fetchDistributionCategory(id)
      const distributionCategorySelects = await fetchDistributionCategorySelectsData(distributionCategory.type)
      distributionCategoryOneStore.setDistributionCategory(distributionCategory, distributionCategorySelects)
    } catch (error) {
      handleError(error)
    } finally {
      detailLoading.value = false
    }
  }

  return {
    detailLoading,
    distributionCategory,
    distributionCategorySelects,
    distributionCategorySelectedOptions,
    fetchData,
    resetStore: distributionCategoryOneStore.reset,
  }
}

export const useDistributionCategoryManageActions = () => {
  const getAvailableDistributionServiceSlugs = (assetType: AssetType) => {
    const serviceSlugs: string[] = []
    Object.entries(damConfigExtSystem[assetType].distribution.distributionRequirements).forEach(([service, config]) => {
      if (config.categorySelect.enabled) {
        serviceSlugs.push(service)
      }
    })
    return serviceSlugs
  }

  const fetchDistributionCategorySelectsData = async (assetType: AssetType) => {
    const pagination = usePagination()
    const filter = simpleCloneObject(useDistributionCategorySelectListFilter())
    filter.serviceSlug.model = getAvailableDistributionServiceSlugs(assetType)
    filter.type.model = assetType
    return await fetchDistributionCategorySelectList(currentExtSystemId.value, pagination, filter)
  }

  return {
    getAvailableDistributionServiceSlugs,
    fetchDistributionCategorySelectsData,
  }
}

export const useDistributionCategoryCreateActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const distributionCategoryOneStore = useDistributionCategoryOneStore()
  const { distributionCategory, distributionCategorySelects, distributionCategorySelectedOptions } =
    storeToRefs(distributionCategoryOneStore)
  const { fetchDistributionCategorySelectsData } = useDistributionCategoryManageActions()

  const prepareData = async (assetType: AssetType) => {
    try {
      createFormDataLoaded.value = false
      const { createDefault } = useDistributionCategoryFactory()
      const distributionCategory = createDefault(currentExtSystemId.value, assetType)
      const distributionCategorySelects = await fetchDistributionCategorySelectsData(distributionCategory.type)
      distributionCategoryOneStore.setDistributionCategory(distributionCategory, distributionCategorySelects)
      createFormDataLoaded.value = true
    } catch (error) {
      handleError(error)
    }
  }

  const onCreate = async (successCallbackAction?: () => void) => {
    try {
      createButtonLoading.value = true
      v$.value.$touch()
      if (v$.value.$invalid) {
        showValidationError()
        createButtonLoading.value = false
        return
      }
      distributionCategory.value.selectedOptions = Object.values(distributionCategorySelectedOptions.value)
        .map((option) => option?.id)
        .filter((id) => !!id) as string[]
      const res = await createDistributionCategory(distributionCategory.value)
      showRecordWas('created')
      if (successCallbackAction) successCallbackAction() // dialog.value = false
      router.push({ name: ROUTE.DAM.DISTRIBUTION_CATEGORY.LIST, params: { id: res.id } })
    } catch (error) {
      handleError(error)
    } finally {
      createButtonLoading.value = false
    }
  }

  return {
    createFormDataLoaded,
    createButtonLoading,
    distributionCategory,
    distributionCategorySelects,
    distributionCategorySelectedOptions,
    prepareData,
    onCreate,
    resetStore: distributionCategoryOneStore.reset,
  }
}

export const useDistributionCategoryEditActions = () => {
  const v$ = useVuelidate()
  const router = useRouter()
  const distributionCategoryOneStore = useDistributionCategoryOneStore()
  const { distributionCategory, distributionCategorySelects, distributionCategorySelectedOptions } =
    storeToRefs(distributionCategoryOneStore)
  const { fetchDistributionCategorySelectsData } = useDistributionCategoryManageActions()

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const distributionCategory = await fetchDistributionCategory(id)
      const distributionCategorySelects = await fetchDistributionCategorySelectsData(distributionCategory.type)
      distributionCategoryOneStore.setDistributionCategory(distributionCategory, distributionCategorySelects)
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
      distributionCategory.value.selectedOptions = Object.values(distributionCategorySelectedOptions.value)
        .map((option) => option?.id)
        .filter((id) => !!id) as string[]
      await updateDistributionCategory(distributionCategoryOneStore.distributionCategory.id, distributionCategory.value)
      showRecordWas('updated')
      if (!close) return
      router.push({ name: ROUTE.DAM.DISTRIBUTION_CATEGORY.LIST })
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
    distributionCategory,
    distributionCategorySelects,
    distributionCategorySelectedOptions,
    fetchData,
    onUpdate,
    resetStore: distributionCategoryOneStore.reset,
  }
}

export const useDistributionCategorySelectActions = () => {
  const mapToValueObjectOption = (categories: DistributionCategory[]): ValueObjectOption<DocId>[] => {
    return categories.map((category: DistributionCategory) => ({
      title: category.name,
      value: category.id,
    }))
  }

  const fetchItems = async (pagination: Pagination, filterBag: FilterBag) => {
    return mapToValueObjectOption(await fetchDistributionCategoryList(currentExtSystemId.value, pagination, filterBag))
  }

  const fetchItemsByIds = async (ids: DocId[]) => {
    return mapToValueObjectOption(await fetchDistributionCategoryListByIds(currentExtSystemId.value, ids))
  }

  return {
    fetchItems,
    fetchItemsByIds,
  }
}
