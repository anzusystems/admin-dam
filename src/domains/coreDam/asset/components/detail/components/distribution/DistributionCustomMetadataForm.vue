<script lang="ts" setup>
import { AssetMetadataValidationScopeSymbol } from '@/domains/coreDam/shared/validationScopes'
import {
  ACustomDataFormElement,
  type CustomDataValue,
  type DamDistributionServiceName,
  useDamConfigStore,
} from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    distributionServiceName: DamDistributionServiceName
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'anyChange'): void
}>()

const modelValue = defineModel<{ [key: string]: CustomDataValue }>({ required: true })

const updateModelValue = (data: { property: string; value: CustomDataValue }) => {
  const updated = {} as { [key: string]: CustomDataValue }
  updated[data.property] = data.value
  modelValue.value = { ...modelValue.value, ...updated }
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
      density="compact"
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
