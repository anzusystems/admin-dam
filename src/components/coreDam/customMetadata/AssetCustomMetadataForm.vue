<script lang="ts" setup>
import { damConfigAssetCustomFormElements } from '@/services/DamConfigAssetCustomFormService'
import type { DamAssetType } from '@/model/coreDam/valueObject/DamAssetType'
import { computed } from 'vue'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import { ACustomDataForm } from '@anzusystems/common-admin'

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

const elements = computed(() => {
  return damConfigAssetCustomFormElements[props.assetType]
})

const pinnedCount = computed(() => {
  return damConfigExtSystem[props.assetType].customMetadataPinnedAmount
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
