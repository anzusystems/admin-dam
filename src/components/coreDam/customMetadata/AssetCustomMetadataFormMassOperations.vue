<script lang="ts" setup>
import { damConfigAssetCustomFormElements } from '@/services/DamConfigAssetCustomFormService'
import type { AssetType } from '@/model/coreDam/valueObject/AssetType'
import { computed } from 'vue'
import AssetCustomMetadataElement from '@/components/coreDam/customMetadata/AssetCustomMetadataElement.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    assetType: AssetType
    modelValue: { [key: string]: any }
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: any): void
  (e: 'fillEmptyField', data: { assetType: AssetType; elementProperty: string; value: any }): void
  (e: 'replaceField', data: { assetType: AssetType; elementProperty: string; value: any }): void
}>()

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

const elements = computed(() => {
  return damConfigAssetCustomFormElements[props.assetType]
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
        <div class="d-flex">
          <AssetCustomMetadataElement
            :config="element"
            :element-property="element.property"
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
