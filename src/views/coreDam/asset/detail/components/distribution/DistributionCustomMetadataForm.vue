<script lang="ts" setup>
import { computed } from 'vue'
import { AssetMetadataValidationScopeSymbol } from '@/components/validationScopes'
import type { DamDistributionServiceName } from '@anzusystems/common-admin'
import { ACustomDataFormElement, useDamConfigState } from '@anzusystems/common-admin'

// damConfigDistributionCustomFormElements must be loaded before using this component

const props = withDefaults(
  defineProps<{
    distributionServiceName: DamDistributionServiceName
    modelValue: { [key: string]: any }
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: any): void
  (e: 'anyChange'): void
}>()

const updateModelValue = (data: { property: string; value: any }) => {
  const updated = {} as { [key: string]: any }
  updated[data.property] = data.value
  emit('update:modelValue', { ...props.modelValue, ...updated })
  emit('anyChange')
}
const { damConfigDistributionCustomFormElements } = useDamConfigState()

const elements = computed(() => {
  return damConfigDistributionCustomFormElements.value[props.distributionServiceName]
})
</script>

<template>
  <div class="w-100">
    <VRow
      v-for="element in elements"
      :key="element.id"
      dense
      class="mt-1"
    >
      <VCol>
        <ACustomDataFormElement
          :config="element"
          :model-value="modelValue[element.property]"
          :validation-scope="AssetMetadataValidationScopeSymbol"
          @update:model-value="updateModelValue"
        />
      </VCol>
    </VRow>
  </div>
</template>
