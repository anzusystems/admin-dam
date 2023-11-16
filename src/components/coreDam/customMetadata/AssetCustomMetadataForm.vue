<script lang="ts" setup>
import type { DamAssetType } from '@/model/coreDam/valueObject/DamAssetType'
import { computed } from 'vue'
import { ACustomDataForm, useDamConfigState } from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    assetType: DamAssetType
    modelValue: { [key: string]: any }
    dataCy?: string
  }>(),
  {
    dataCy: undefined,
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: any): void
  (e: 'anyChange'): void
}>()

const { damConfigAssetCustomFormElements } = useDamConfigState()

const elements = computed(() => {
  return damConfigAssetCustomFormElements.value[props.assetType]
})

const { damConfigExtSystem } = useDamConfigState()

const pinnedCount = computed(() => {
  return damConfigExtSystem.value[props.assetType].customMetadataPinnedAmount
})
</script>

<template>
  <ACustomDataForm
    :model-value="modelValue"
    :pinned-count="pinnedCount"
    :elements="elements"
    @any-change="emit('anyChange')"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
