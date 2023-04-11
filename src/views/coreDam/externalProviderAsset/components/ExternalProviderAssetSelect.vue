<script lang="ts" setup>
import { useExternalProviderAssetType } from '@/model/coreDam/valueObject/ExternalProviderAssetType'
import { computed } from 'vue'
import { cloneDeep } from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    multiple?: boolean
    label?: string
    dataCy?: string
  }>(),
  {
    multiple: false,
    label: undefined,
    dataCy: '',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', data: string[]): void
  (e: 'blur', data: string[]): void
}>()

const modelValueComputed = computed({
  get() {
    return props.modelValue
  },
  set(newValue: string[]) {
    emit('update:modelValue', cloneDeep<string[]>(newValue))
  },
})

const onBlur = () => {
  emit('blur', modelValueComputed.value)
}

const { allExternalProviderAssetTypeOptions } = useExternalProviderAssetType()
</script>

<template>
  <VSelect
    v-model="modelValueComputed"
    :items="allExternalProviderAssetTypeOptions"
    item-title="title"
    item-value="value"
    :label="label"
    :multiple="multiple"
    clearable
    chips
    no-filter
    :data-cy="dataCy"
    @blur="onBlur"
  />
</template>
