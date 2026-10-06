<script lang="ts" setup>
import { ACustomDataForm, isUndefined, useDamConfigState } from '@anzusystems/common-admin'
import type { CustomDataValue, DamAssetTypeType, ValidationScope } from '@anzusystems/common-admin'
import { computed } from 'vue'

import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { AssetMetadataValidationScopeSymbol } from '@/domains/coreDam/shared/validationScopes'
import { damClient } from '@/shared/apiClients/damClient'

const props = withDefaults(
  defineProps<{
    assetType: DamAssetTypeType
    dataCy?: string
    validationScope?: ValidationScope
  }>(),
  {
    dataCy: undefined,
    validationScope: AssetMetadataValidationScopeSymbol,
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
  <!-- By default the scope of what saves asset metadata: without it the form keeps its fields, and the keyword and
       author inputs in its slots, to itself, and a sidebar that saves through that scope validates nothing. -->
  <ACustomDataForm
    :model-value="modelValue"
    :pinned-count="pinnedCount"
    :elements="elements"
    :validation-scope="validationScope"
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
