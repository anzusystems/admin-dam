<script lang="ts" setup>
import { damConfigAssetCustomFormElements } from '@/services/DamConfigAssetCustomFormService'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import { computed } from 'vue'
import AssetCustomMetadataElement from '@/components/dam/customMetadata/AssetCustomMetadataElement.vue'

const props = withDefaults(
  defineProps<{
    assetType: AssetType
    modelValue: { [key: string]: any }
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: any): void
  (e: 'fillEmptyField', data: { assetType: AssetType; elementKey: string; value: any }): void
  (e: 'replaceField', data: { assetType: AssetType; elementKey: string; value: any }): void
}>()

const updateModelValue = (data: { key: string; value: any }) => {
  const updated = {} as { [key: string]: any }
  updated[data.key] = data.value
  emit('update:modelValue', { ...props.modelValue, ...updated })
}

const fillEmptyField = (elementKey: string, value: any) => {
  emit('fillEmptyField', { assetType: props.assetType, elementKey, value })
}
const replaceField = (elementKey: string, value: any) => {
  emit('replaceField', { assetType: props.assetType, elementKey, value })
}

const elements = computed(() => {
  return damConfigAssetCustomFormElements[props.assetType]
})
</script>

<template>
  <div class="w-100">
    <VRow dense class="mt-1" v-for="element in elements" :key="element.id">
      <VCol>
        <div class="d-flex">
          <AssetCustomMetadataElement
            :config="element"
            :element-key="element.key"
            :model-value="modelValue[element.key]"
            @update:model-value="updateModelValue"
          />
          <VBtn
            icon="mdi-file-arrow-left-right-outline"
            size="small"
            variant="text"
            class="mr-1"
            @click.stop="fillEmptyField(element.key, modelValue[element.key])"
          ></VBtn>
          <VBtn
            icon="mdi-file-replace-outline"
            size="small"
            variant="text"
            @click.stop="replaceField(element.key, modelValue[element.key])"
          ></VBtn>
        </div>
      </VCol>
    </VRow>
  </div>
</template>
