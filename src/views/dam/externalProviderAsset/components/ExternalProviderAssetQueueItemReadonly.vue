<script lang="ts" setup>
import { computed } from 'vue'
import AssetImage from '@/views/dam/asset/components/AssetImage.vue'
import { useI18n } from 'vue-i18n'
import type { UploadQueueItem } from '@/types/dam/UploadQueue'
import ExternalProviderAssetMetadataItem from '@/views/dam/externalProviderAsset/components/ExternalProviderAssetMetadataItem.vue'

const IMAGE_ASPECT_RATIO = 16 / 9

const props = withDefaults(
  defineProps<{
    item: UploadQueueItem
    index: number
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'removeItem', index: number): void
}>()

const { t } = useI18n({ useScope: 'global' })

const remove = () => {
  emit('removeItem', props.index)
}

const imageSrc = computed(() => {
  return props.item.links.length > 0 ? props.item.links[0].url : ''
})
</script>

<template>
  <div class="dam-upload-queue__item">
    <div class="dam-upload-queue__item-card">
      <div class="position-relative">
        <AssetImage :src="imageSrc" background-color="#ccc" use-component cover :aspect-ratio="IMAGE_ASPECT_RATIO" />
      </div>
      <VRow dense class="my-2">
        <VCol>
          <div class="w-100 d-flex justify-space-between align-center">
            <div></div>
            <VBtn icon="mdi-trash-can-outline" variant="text" @click.stop="remove" size="small"></VBtn>
          </div>
        </VCol>
      </VRow>
      <VRow class="text-caption">
        <VCol>Id</VCol>
        <VCol cols="9">{{ item.externalProviderAssetId }}</VCol>
      </VRow>
      <VRow class="text-caption">
        <VCol>{{ t('coreDam.asset.detail.info.field.type') }}</VCol>
        <VCol cols="9">{{ item.assetType }}</VCol>
      </VRow>
      <VRow class="text-caption">
        <VCol>Title</VCol>
        <VCol cols="9">{{ item.displayTitle }}</VCol>
      </VRow>
      <VRow v-for="(value, key) in item.externalProviderMetadata" :key="key" class="text-caption">
        <VCol>{{ key }}</VCol>
        <VCol cols="9"><ExternalProviderAssetMetadataItem :value="value" /></VCol>
      </VRow>
    </div>
  </div>
</template>
