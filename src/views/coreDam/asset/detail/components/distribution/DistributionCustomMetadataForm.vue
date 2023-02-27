<script lang="ts" setup>
import { computed } from 'vue'
import AssetCustomMetadataElement from '@/components/dam/customMetadata/AssetCustomMetadataElement.vue'
import { AssetMetadataValidationScopeSymbol } from '@/components/validationScopes'
import type { DistributionServiceName } from '@/types/coreDam/DamConfig'
import { damConfigDistributionCustomFormElements } from '@/services/DamConfigDistributionCustomFormService'

// damConfigDistributionCustomFormElements must be loaded before using this component

const props = withDefaults(
  defineProps<{
    distributionServiceName: DistributionServiceName
    modelValue: { [key: string]: any }
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: any): void
  (e: 'anyChange'): void
}>()

const updateModelValue = (data: { key: string; value: any }) => {
  const updated = {} as { [key: string]: any }
  updated[data.key] = data.value
  emit('update:modelValue', { ...props.modelValue, ...updated })
  emit('anyChange')
}

const elements = computed(() => {
  return damConfigDistributionCustomFormElements.value[props.distributionServiceName]
})
</script>

<template>
  <div class="w-100">
    <VRow v-for="element in elements" :key="element.id" dense class="mt-1">
      <VCol>
        <AssetCustomMetadataElement
          :config="element"
          :element-key="element.key"
          :model-value="modelValue[element.key]"
          :validation-scope="AssetMetadataValidationScopeSymbol"
          @update:model-value="updateModelValue"
        />
      </VCol>
    </VRow>
  </div>
</template>
