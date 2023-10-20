<script lang="ts" setup>
import { damConfigAssetCustomFormElements } from '@/services/DamConfigAssetCustomFormService'
import type { AssetType } from '@/model/coreDam/valueObject/AssetType'
import { computed } from 'vue'
import AssetCustomMetadataElement from '@/components/coreDam/customMetadata/AssetCustomMetadataElement.vue'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import { useAssetCustomMetadataForm } from '@/components/coreDam/customMetadata/useAssetCustomMetadataForm'
import { AssetMetadataValidationScopeSymbol } from '@/components/validationScopes'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    assetType: AssetType
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

const { showAllMetadata, toggleShowAllMetadata } = useAssetCustomMetadataForm()

const updateModelValue = (data: { key: string; value: any }) => {
  const updated = {} as { [key: string]: any }
  updated[data.key] = data.value
  emit('update:modelValue', { ...props.modelValue, ...updated })
  emit('anyChange')
}

const elements = computed(() => {
  return damConfigAssetCustomFormElements[props.assetType]
})

const elementsPinned = computed(() => {
  return elements.value.slice(0, pinnedCount.value)
})

const elementsOther = computed(() => {
  return elements.value.slice(pinnedCount.value)
})

const pinnedCount = computed(() => {
  return damConfigExtSystem[props.assetType].customMetadataPinnedAmount
})

const showHideButtonText = computed(() => {
  return showAllMetadata.value
    ? t('coreDam.asset.detail.metadataToggle.show')
    : t('coreDam.asset.detail.metadataToggle.hide')
})
const showHideButtonIcon = computed(() => {
  return showAllMetadata.value ? 'mdi-minus' : 'mdi-plus'
})

const enableShowHide = computed(() => {
  return elements.value.length > pinnedCount.value
})
</script>

<template>
  <div class="w-100">
    <slot name="before-pinned" />
    <VRow
      v-for="element in elementsPinned"
      :key="element.id"
      dense
      class="mt-1"
    >
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
    <slot name="after-pinned" />
  </div>
  <div
    v-show="showAllMetadata"
    class="w-100"
  >
    <VRow
      v-for="element in elementsOther"
      :key="element.id"
      dense
      class="mt-1"
    >
      <VCol>
        <AssetCustomMetadataElement
          :config="element"
          :element-key="element.key"
          :model-value="modelValue[element.key]"
          @update:model-value="updateModelValue"
        />
      </VCol>
    </VRow>
  </div>
  <VBtn
    v-if="enableShowHide"
    variant="text"
    size="small"
    class="my-2"
    data-cy="button-more-metadata"
    @click="toggleShowAllMetadata"
  >
    <VIcon :icon="showHideButtonIcon" />
    {{ showHideButtonText }}
  </VBtn>
</template>
