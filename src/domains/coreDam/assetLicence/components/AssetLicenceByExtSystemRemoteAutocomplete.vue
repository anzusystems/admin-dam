<script lang="ts" setup>
import { AFormRemoteAutocomplete, FilterInnerConfigKey, FilterInnerDataKey } from '@anzusystems/common-admin/labs'
import { useDamAssetLicenceInnerFilter } from '@anzusystems/common-admin'
import { useAssetLicenceSelectActions } from '@/domains/coreDam/assetLicence/composables/assetLicenceActions'
import type { BaseValidation } from '@vuelidate/core'

const props = withDefaults(
  defineProps<{
    modelValue: IntegerIdNullable | IntegerId[]
    label?: string | undefined
    required?: boolean | undefined
    multiple?: boolean
    dataCy?: string
    extSystemId?: IntegerId | null
    hideDetails?: boolean
    v?: BaseValidation
  }>(),
  {
    label: undefined,
    required: undefined,
    multiple: false,
    dataCy: '',
    extSystemId: null,
    hideDetails: undefined,
    v: undefined,
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: IntegerIdNullable | IntegerId[]): void
}>()

const modelValueComputed = computed({
  get() {
    return props.modelValue
  },
  set(newValue: IntegerIdNullable | IntegerId[]) {
    emit('update:modelValue', cloneDeep<IntegerIdNullable | IntegerId[]>(newValue))
  },
})

const { fetchItems, fetchItemsByIds } = useAssetLicenceSelectActions()

const { filterData, filterConfig } = useDamAssetLicenceInnerFilter()
provide(FilterInnerConfigKey, filterConfig)
provide(FilterInnerDataKey, filterData)

// Unlike the shared DamAssetLicenceRemoteAutocomplete this keeps a prefilled model;
// the owner clears it on ext system change.
watch(
  () => props.extSystemId,
  (extSystemId) => {
    filterData.extSystem = extSystemId
  },
  { immediate: true }
)
</script>

<template>
  <AFormRemoteAutocomplete
    :key="extSystemId + ''"
    v-model="modelValueComputed"
    :v="v"
    :required="required"
    :label="label"
    :fetch-items="fetchItems"
    :fetch-items-by-ids="fetchItemsByIds"
    :multiple="multiple"
    filter-by-field="name"
    prefetch="hover"
    :data-cy="dataCy"
    :hide-details="hideDetails"
  />
</template>
