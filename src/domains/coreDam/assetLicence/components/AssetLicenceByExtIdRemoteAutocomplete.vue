<script lang="ts" setup>
import type { FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin/labs'
import { AFormRemoteAutocomplete, FilterInnerConfigKey, FilterInnerDataKey } from '@anzusystems/common-admin/labs'
import { useDamAssetLicenceInnerFilter } from '@anzusystems/common-admin'
import type { Ref } from 'vue'
import { useAssetLicenceByExtIdSelectActions } from '@/domains/coreDam/assetLicence/composables/assetLicenceActions'

const props = withDefaults(
  defineProps<{
    label?: string | undefined
    required?: boolean | undefined
    multiple?: boolean
    clearable?: boolean
    dataCy?: string
    extSystemId?: IntegerId | null
    hideDetails?: boolean
    disableInitFetch?: boolean
  }>(),
  {
    label: undefined,
    required: undefined,
    multiple: false,
    clearable: false,
    dataCy: '',
    extSystemId: null,
    hideDetails: undefined,
    disableInitFetch: false,
  }
)
const modelValue = defineModel<IntegerIdNullable | IntegerId[]>({ required: true })
const modelValueComputed = computed({
  get() {
    return modelValue.value
  },
  set(newValue: number | null | number[]) {
    modelValue.value = cloneDeep<number | null | number[]>(newValue)
  },
})

const { fetchItems, fetchItemsByIds } = useAssetLicenceByExtIdSelectActions()

const { filterData, filterConfig } = useDamAssetLicenceInnerFilter()
provide(FilterInnerConfigKey, filterConfig)
provide(FilterInnerDataKey, filterData)

/**
 * Limit to fetch only when extId is set.
 */
const fetchItemsCustomized = async (
  pagination: Ref<Pagination>,
  filterData: FilterData,
  filterConfig: FilterConfig
) => {
  if (isString(filterData.extId) && filterData.extId.length > 0) {
    return await fetchItems(pagination, filterData, filterConfig)
  }
  return []
}

const selectedExtSystemId = computed(() => {
  return props.extSystemId
})

watch(
  selectedExtSystemId,
  (newValue, oldValue) => {
    if (newValue === oldValue) return
    modelValueComputed.value = null
    if (newValue) {
      filterData.extSystem = newValue
      return
    }
    filterData.extSystem = null
  },
  { immediate: true }
)
</script>

<template>
  <AFormRemoteAutocomplete
    :key="selectedExtSystemId + ''"
    v-model="modelValueComputed"
    :required="required"
    :label="label"
    :fetch-items="fetchItemsCustomized"
    :fetch-items-by-ids="fetchItemsByIds"
    :multiple="multiple"
    :clearable="clearable"
    filter-by-field="extId"
    :data-cy="dataCy"
    :hide-details="hideDetails"
    :prefetch="disableInitFetch ? false : 'hover'"
  />
</template>
