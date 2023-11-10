<script lang="ts" setup>
import { damConfigAssetCustomFormElements } from '@/services/DamConfigAssetCustomFormService'
import type { DamAssetType } from '@/model/coreDam/valueObject/DamAssetType'
import { computed } from 'vue'
import AssetCustomMetadataElement from '@/components/coreDam/customMetadata/AssetCustomMetadataElement.vue'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import { useAssetCustomMetadataForm } from '@/components/coreDam/customMetadata/useAssetCustomMetadataForm'
import { AssetMetadataValidationScopeSymbol } from '@/components/validationScopes'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    assetType: DamAssetType
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

const updateModelValue = (data: { property: string; value: any }) => {
  const updated = {} as { [key: string]: any }
  updated[data.property] = data.value
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
          :element-property="element.property"
          :model-value="modelValue[element.property]"
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
          :element-property="element.property"
          :model-value="modelValue[element.property]"
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
