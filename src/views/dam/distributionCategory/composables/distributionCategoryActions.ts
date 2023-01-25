import { useUiHelper } from '@/composables/system/uiHelper'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
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
import { usePagination } from '@/composables/system/pagination'
import { useDistributionCategorySelectListFilter } from '@/model/dam/filter/DistributionCategorySelectFilter'
import { simpleCloneObject } from '@/utils/object'
import { useDistributionCategoryFactory } from '@/model/dam/factory/DistributionCategoryFactory'
import type { ValueObjectOption } from '@/types/ValueObject'
import type { DocId } from '@anzusystems/common-admin'

const { loaderOn, loaderOff, btnDisable, btnEnable, btnLoadingOn, btnReset } = useUiHelper()
const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const { currentExtSystemId } = useCurrentExtSystem()

export const useDistributionCategoryListActions = () => {
  const listItems = ref<DistributionCategory[]>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    loaderOn('list')
    try {
      listItems.value = await fetchDistributionCategoryList(currentExtSystemId.value, pagination, filterBag)
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

export const useDistributionCategoryDetailActions = () => {
  const distributionCategoryOneStore = useDistributionCategoryOneStore()
  const { distributionCategory, distributionCategorySelects, distributionCategorySelectedOptions, loaded } =
    storeToRefs(distributionCategoryOneStore)
  const { fetchDistributionCategorySelectsData } = useDistributionCategoryManageActions()

  const fetchData = async (id: string) => {
    loaderOn('detail')
    try {
      const distributionCategory = await fetchDistributionCategory(id)
      const distributionCategorySelects = await fetchDistributionCategorySelectsData(distributionCategory.type)
      distributionCategoryOneStore.setDistributionCategory(distributionCategory, distributionCategorySelects)
      distributionCategoryOneStore.setLoaded(true)
    } catch (error) {
      handleError(error)
    } finally {
      loaderOff('detail')
    }
  }

  return {
    distributionCategory,
    distributionCategorySelects,
    distributionCategorySelectedOptions,
    loaded,
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
  const { distributionCategory, distributionCategorySelects, distributionCategorySelectedOptions, loaded } =
    storeToRefs(distributionCategoryOneStore)
  const { fetchDistributionCategorySelectsData } = useDistributionCategoryManageActions()

  const prepareData = async (assetType: AssetType) => {
    try {
      distributionCategoryOneStore.setLoaded(false)
      const { createDefault } = useDistributionCategoryFactory()
      const distributionCategory = createDefault(currentExtSystemId.value, assetType)
      const distributionCategorySelects = await fetchDistributionCategorySelectsData(distributionCategory.type)
      distributionCategoryOneStore.setDistributionCategory(distributionCategory, distributionCategorySelects)
      distributionCategoryOneStore.setLoaded(true)
    } catch (error) {
      handleError(error)
    }
  }

  const onCreate = async (successCallbackAction?: () => void) => {
    try {
      btnDisable('create')
      v$.value.$touch()
      if (v$.value.$invalid) {
        showValidationError()
        btnEnable('create')
        return
      }
      btnLoadingOn('create')
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
      btnReset('create')
    }
  }

  return {
    loaded,
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
  const { distributionCategory, distributionCategorySelects, distributionCategorySelectedOptions, loaded } =
    storeToRefs(distributionCategoryOneStore)
  const { fetchDistributionCategorySelectsData } = useDistributionCategoryManageActions()

  const fetchData = async (id: string) => {
    loaderOn('edit')
    try {
      const distributionCategory = await fetchDistributionCategory(id)
      const distributionCategorySelects = await fetchDistributionCategorySelectsData(distributionCategory.type)
      distributionCategoryOneStore.setDistributionCategory(distributionCategory, distributionCategorySelects)
      distributionCategoryOneStore.setLoaded(true)
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
      btnReset('save', 'saveAndClose', 'delete')
    }
  }

  return {
    loaded,
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
