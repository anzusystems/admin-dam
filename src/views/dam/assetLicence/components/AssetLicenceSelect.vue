<script lang="ts" setup>
import { useVModels } from '@vueuse/core'
import type { IntegerId } from '@anzusystems/common-admin'
import { AFormRemoteAutocomplete } from '@anzusystems/common-admin'
import { useAssetLicenceSelectActions } from '@/views/dam/assetLicence/composables/assetLicenceActions'
import { useAssetLicenceFilter } from '@/model/dam/filter/AssetLicenceFilter'
import { computed, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: number | null | number[] | any
    label?: string | null
    required?: boolean | null
    multiple?: boolean
    clearable?: boolean
    dataCy?: string
    extSystemId?: IntegerId | null
    hideDetails?: boolean
    disableInitFetch?: boolean
  }>(),
  {
    label: null,
    required: null,
    multiple: false,
    clearable: false,
    dataCy: '',
    extSystemId: null,
    hideDetails: undefined,
    disableInitFetch: false,
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: number | null | number[]): void
}>()
const { modelValue } = useVModels(props, emit)

const { fetchItems, fetchItemsByIds } = useAssetLicenceSelectActions()

const innerFilter = useAssetLicenceFilter()

const selectedExtSystemId = computed(() => {
  return props.extSystemId
})

watch(
  selectedExtSystemId,
  (newValue, oldValue) => {
    if (newValue === oldValue) return
    modelValue.value = null
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
    v-model="modelValue"
    :required="required"
    :label="label"
    :fetch-items="fetchItems"
    :fetch-items-by-ids="fetchItemsByIds"
    :inner-filter="innerFilter"
    :multiple="multiple"
    :clearable="clearable"
    filter-by-field="name"
    :data-cy="dataCy"
    :hide-details="hideDetails"
    :disable-init-fetch="disableInitFetch"
  />
</template>
