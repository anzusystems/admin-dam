<script lang="ts" setup>
import { AssetMetadataValidationScopeSymbol } from '@/components/validationScopes'
import {
  ACustomDataFormElement, type CustomDataValue,
  type DamDistributionServiceName,
  isUndefined,
  useDamConfigStore,
} from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    distributionServiceName: DamDistributionServiceName
    modelValue: { [key: string]: CustomDataValue }
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: { [key: string]: CustomDataValue }): void
  (e: 'anyChange'): void
}>()

const updateModelValue = (data: { property: string; value: CustomDataValue }) => {
  const updated = {} as { [key: string]: CustomDataValue }
  updated[data.property] = data.value
  emit('update:modelValue', { ...props.modelValue, ...updated })
  emit('anyChange')
}
const damConfigStore = useDamConfigStore()
const { damConfigDistributionCustomFormElements } = storeToRefs(damConfigStore)

const elements = computed(() => {
  const configDistributionCustomFormElements = damConfigDistributionCustomFormElements.value.get(
    props.distributionServiceName
  )
  if (isUndefined(configDistributionCustomFormElements)) {
    return []
  }
  return configDistributionCustomFormElements
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
