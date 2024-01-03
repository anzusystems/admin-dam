<script lang="ts" setup>
import { type DamAssetType, isUndefined } from '@anzusystems/common-admin'
import { computed } from 'vue'
import { ACustomDataForm, useDamConfigState } from '@anzusystems/common-admin'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { damClient } from '@/services/api/clients/damClient'

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

const { getDamConfigAssetCustomFormElements, getDamConfigExtSystem } = useDamConfigState(damClient)
const { currentExtSystemId } = useCurrentExtSystem()

const configAssetCustomFormElements = getDamConfigAssetCustomFormElements(currentExtSystemId.value)
if (isUndefined(configAssetCustomFormElements)) {
  throw new Error('Custom form elements must be initialised.')
}

const elements = computed(() => {
  return configAssetCustomFormElements[props.assetType]
})

const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
if (isUndefined(configExtSystem)) {
  throw new Error('Ext system must be initialised.')
}

const pinnedCount = computed(() => {
  return configExtSystem[props.assetType].customMetadataPinnedAmount
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
