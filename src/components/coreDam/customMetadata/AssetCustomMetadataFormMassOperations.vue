<script lang="ts" setup>
import { type DamAssetType, isUndefined } from '@anzusystems/common-admin'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ACustomDataFormElement, useDamConfigState } from '@anzusystems/common-admin'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'

const props = withDefaults(
  defineProps<{
    assetType: DamAssetType
    modelValue: { [key: string]: any }
  }>(),
  {}
)

const emit = defineEmits<{
  (e: 'update:modelValue', data: any): void
  (e: 'fillEmptyField', data: { assetType: DamAssetType; elementProperty: string; value: any }): void
  (e: 'replaceField', data: { assetType: DamAssetType; elementProperty: string; value: any }): void
}>()

const { t } = useI18n()

const updateModelValue = (data: { property: string; value: any }) => {
  const updated = {} as { [key: string]: any }
  updated[data.property] = data.value
  emit('update:modelValue', { ...props.modelValue, ...updated })
}

const fillEmptyField = (elementProperty: string, value: any) => {
  emit('fillEmptyField', { assetType: props.assetType, elementProperty, value })
}
const replaceField = (elementProperty: string, value: any) => {
  emit('replaceField', { assetType: props.assetType, elementProperty, value })
}

const { getDamConfigAssetCustomFormElements } = useDamConfigState()
const { currentExtSystemId } = useCurrentExtSystem()

const configAssetCustomFormElements = getDamConfigAssetCustomFormElements(currentExtSystemId.value)
if (isUndefined(configAssetCustomFormElements)) {
  throw new Error('Custom form elements must be initialised.')
}

const elements = computed(() => {
  return configAssetCustomFormElements[props.assetType]
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
        <div v-if="element.attributes.readonly" />
        <div
          v-else
          class="d-flex"
        >
          <ACustomDataFormElement
            :config="element"
            :model-value="modelValue[element.property]"
            @update:model-value="updateModelValue"
          />
          <VBtn
            icon
            size="small"
            variant="text"
            class="mr-1"
            @click.stop="fillEmptyField(element.property, modelValue[element.property])"
          >
            <VIcon icon="mdi-file-arrow-left-right-outline" />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              {{ t('coreDam.asset.massOperations.fillOneEmpty') }}
            </VTooltip>
          </VBtn>
          <VBtn
            icon
            size="small"
            variant="text"
            @click.stop="replaceField(element.property, modelValue[element.property])"
          >
            <VIcon icon="mdi-file-replace-outline" />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              {{ t('coreDam.asset.massOperations.replaceOne') }}
            </VTooltip>
          </VBtn>
        </div>
      </VCol>
    </VRow>
  </div>
</template>
