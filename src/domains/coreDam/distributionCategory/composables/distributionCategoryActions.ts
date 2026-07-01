import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useDistributionCategoryFactory } from '@/domains/coreDam/distributionCategory/factory/DistributionCategoryFactory'
import { useDistributionCategorySelectListFilter } from '@/domains/coreDam/distributionCategorySelect/filter/DistributionCategorySelectFilter'
import { damClient } from '@/shared/apiClients/damClient'
import {
  useCreateDistributionCategory,
  useFetchDistributionCategory,
  useFetchDistributionCategoryList,
  useFetchDistributionCategoryListByIds,
  useUpdateDistributionCategory,
} from '@/domains/coreDam/distributionCategory/api/distributionCategoryApi'
import { useFetchDistributionCategorySelectList } from '@/domains/coreDam/distributionCategorySelect/api/distributionCategorySelectApi'
import { useDistributionCategoryOneStore } from '@/domains/coreDam/distributionCategory/store/distributionCategoryStore'
import type { DistributionCategory } from '@/domains/coreDam/distributionCategory/types/DistributionCategory'
import type { DamAssetTypeType } from '@anzusystems/common-admin'
import { useDamConfigState } from '@anzusystems/common-admin'
import type { FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin/labs'
import { usePagination } from '@anzusystems/common-admin/labs'
import type { Ref } from 'vue'

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const datatableHiddenColumns = ref<Array<string>>(['id'])
const listLoading = ref(false)
const detailLoading = ref(false)
const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)
const createButtonLoading = ref(false)
const createFormDataLoaded = ref(false)

const { currentExtSystemId } = useCurrentExtSystem()

export const useDistributionCategoryListActions = () => {
  const listItems = ref<DistributionCategory[]>([])
  const { executeFetch } = useFetchDistributionCategoryList()

  const fetchList = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    listLoading.value = true
    try {
      listItems.value = await executeFetch(pagination, filterData, filterConfig, {
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

export const useDistributionCategoryDetailActions = () => {
  const distributionCategoryOneStore = useDistributionCategoryOneStore()
  const { distributionCategory, distributionCategorySelects, distributionCategorySelectedOptions } =
    storeToRefs(distributionCategoryOneStore)
  const { fetchDistributionCategorySelectsData } = useDistributionCategoryManageActions()

  const fetchData = async (id: string) => {
    detailLoading.value = true
    try {
      const { executeRequest: fetchDistributionCategory } = useFetchDistributionCategory()
      const distributionCategory = await fetchDistributionCategory({ urlParams: { id } })
      const distributionCategorySelects = await fetchDistributionCategorySelectsData(distributionCategory.type)
      distributionCategoryOneStore.setDistributionCategory(distributionCategory, distributionCategorySelects)
    } catch (error) {
      showErrorsDefault(error)
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
  const { getDamConfigExtSystem } = useDamConfigState(damClient)
  const { currentExtSystemId } = useCurrentExtSystem()
  const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
  if (isUndefined(configExtSystem)) {
    throw new Error('Ext system must be initialised.')
  }

  const getAvailableDistributionServiceSlugs = (assetType: DamAssetTypeType) => {
    const serviceSlugs: string[] = []
    const requirements = configExtSystem[assetType]?.distribution?.distributionRequirements ?? {}
    Object.entries(requirements).forEach(([service, config]) => {
      if (config.categorySelect.enabled) {
        serviceSlugs.push(service)
      }
    })
    return serviceSlugs
  }

  const fetchDistributionCategorySelectsData = async (assetType: DamAssetTypeType) => {
    const { pagination } = usePagination(SORT_BY_ID)
    const { filterData, filterConfig } = useDistributionCategorySelectListFilter()
    filterData.serviceSlug = getAvailableDistributionServiceSlugs(assetType)
    filterData.type = assetType
    const { executeFetch } = useFetchDistributionCategorySelectList()
    return await executeFetch(pagination, filterData, filterConfig, {
      urlParams: { extSystemId: currentExtSystemId.value },
    })
  }

  return {
    getAvailableDistributionServiceSlugs,
    fetchDistributionCategorySelectsData,
  }
}

export const useDistributionCategoryCreateActions = () => {
  const router = useRouter()
  const distributionCategoryOneStore = useDistributionCategoryOneStore()
  const { distributionCategory, distributionCategorySelects, distributionCategorySelectedOptions } =
    storeToRefs(distributionCategoryOneStore)
  const { fetchDistributionCategorySelectsData } = useDistributionCategoryManageActions()

  const prepareData = async (assetType: DamAssetTypeType) => {
    try {
      createFormDataLoaded.value = false
      const { createDefault } = useDistributionCategoryFactory()
      const distributionCategory = createDefault(currentExtSystemId.value, assetType)
      const distributionCategorySelects = await fetchDistributionCategorySelectsData(distributionCategory.type)
      distributionCategoryOneStore.setDistributionCategory(distributionCategory, distributionCategorySelects)
      createFormDataLoaded.value = true
    } catch (error) {
      showErrorsDefault(error)
    }
  }

  const onCreate = async (successCallbackAction?: () => void) => {
    try {
      createButtonLoading.value = true
      distributionCategory.value.selectedOptions = Object.values(distributionCategorySelectedOptions.value)
        .map((option) => option?.id)
        .filter((id) => !!id) as string[]
      const { executeRequest: createDistributionCategory } = useCreateDistributionCategory()
      const res = await createDistributionCategory({ object: distributionCategory.value })
      showRecordWas('created')
      if (successCallbackAction) successCallbackAction() // dialog.value = false
      router.push({ name: '/(coreDam)/distribution-categories/[id]', params: { id: res.id } })
    } catch (error) {
      showErrorsDefault(error)
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
      const { executeRequest: fetchDistributionCategory } = useFetchDistributionCategory()
      const distributionCategory = await fetchDistributionCategory({ urlParams: { id } })
      const distributionCategorySelects = await fetchDistributionCategorySelectsData(distributionCategory.type)
      distributionCategoryOneStore.setDistributionCategory(distributionCategory, distributionCategorySelects)
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
      distributionCategory.value.selectedOptions = Object.values(distributionCategorySelectedOptions.value)
        .map((option) => option?.id)
        .filter((id) => !!id) as string[]
      const { executeRequest: updateDistributionCategory } = useUpdateDistributionCategory()
      await updateDistributionCategory({
        urlParams: { id: distributionCategoryOneStore.distributionCategory.id },
        object: distributionCategory.value,
      })
      showRecordWas('updated')
      if (!close) return
      router.push({ name: '/(coreDam)/distribution-categories' })
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

  const fetchItems = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    const { executeFetch } = useFetchDistributionCategoryList()
    return mapToValueObjectOption(
      await executeFetch(pagination, filterData, filterConfig, {
        urlParams: { extSystemId: currentExtSystemId.value },
      })
    )
  }

  const fetchItemsByIds = async (ids: DocId[]) => {
    const { executeFetch } = useFetchDistributionCategoryListByIds()
    return mapToValueObjectOption(await executeFetch(ids, { urlParams: { extSystemId: currentExtSystemId.value } }))
  }

  return {
    fetchItems,
    fetchItemsByIds,
  }
}
