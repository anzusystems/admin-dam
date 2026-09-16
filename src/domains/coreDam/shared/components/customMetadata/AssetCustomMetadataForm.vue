<script lang="ts" setup>
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { damClient } from '@/shared/apiClients/damClient'
import {
  ACustomDataForm,
  type CustomDataValue,
  type DamAssetTypeType,
  useDamConfigState,
} from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    assetType: DamAssetTypeType
    dataCy?: string
  }>(),
  {
    dataCy: undefined,
  }
)
const emit = defineEmits<{
  (e: 'anyChange'): void
}>()

const modelValue = defineModel<{ [key: string]: CustomDataValue }>({ required: true })

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
  return configExtSystem[props.assetType]?.customMetadataPinnedAmount ?? 0
})
</script>

<template>
  <ACustomDataForm
    :model-value="modelValue"
    :pinned-count="pinnedCount"
    :elements="elements"
    @any-change="emit('anyChange')"
    @update:model-value="modelValue = $event"
  >
    <template #before-pinned>
      <slot name="before-pinned" />
    </template>
    <template #after-pinned>
      <slot name="after-pinned" />
    </template>
  </ACustomDataForm>
</template>
