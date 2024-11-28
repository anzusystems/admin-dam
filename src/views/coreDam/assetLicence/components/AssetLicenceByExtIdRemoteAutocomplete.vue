<script lang="ts" setup>
import {
  AFormRemoteAutocomplete,
  cloneDeep,
  type FilterBag,
  type IntegerId,
  type IntegerIdNullable,
  isString,
  type Pagination,
  useDamAssetLicenceFilter,
} from '@anzusystems/common-admin'
import { useAssetLicenceByExtIdSelectActions } from '@/views/coreDam/assetLicence/composables/assetLicenceActions'
import { computed, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: number | null | number[] | any
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
const emit = defineEmits<{
  (e: 'update:modelValue', data: IntegerIdNullable | IntegerId[]): void
}>()

const modelValueComputed = computed({
  get() {
    return props.modelValue
  },
  set(newValue: number | null | number[] | any) {
    emit('update:modelValue', cloneDeep<number | null | number[] | any>(newValue))
  },
})

const { fetchItems, fetchItemsByIds } = useAssetLicenceByExtIdSelectActions()

/**
 * Limit to fetch only when extId is set.
 */
const fetchItemsCustomized = async (pagination: Pagination, filterBag: FilterBag) => {
  if (isString(filterBag.extId.model) && filterBag.extId.model.length > 0) {
    return await fetchItems(pagination, filterBag)
  }
  return []
}

const innerFilter = useDamAssetLicenceFilter()

const selectedExtSystemId = computed(() => {
  return props.extSystemId
})

watch(
  selectedExtSystemId,
  (newValue, oldValue) => {
    if (newValue === oldValue) return
    modelValueComputed.value = null
    if (newValue) {
      innerFilter.extSystem.model = newValue
      return
    }
    innerFilter.extSystem.model = null
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
    :inner-filter="innerFilter"
    :multiple="multiple"
    :clearable="clearable"
    filter-by-field="extId"
    :data-cy="dataCy"
    :hide-details="hideDetails"
    :disable-init-fetch="disableInitFetch"
  />
</template>
