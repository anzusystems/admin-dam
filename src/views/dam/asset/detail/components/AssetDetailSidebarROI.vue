<script lang="ts" setup>
import { useImageRoiStore } from '@/stores/dam/imageRoiStore'
import AssetDetailSidebarActionsWrapper from '@/views/dam/asset/detail/components/AssetDetailSidebarActionsWrapper.vue'
import { useI18n } from 'vue-i18n'

withDefaults(
  defineProps<{
    isActive: boolean
  }>(),
  {}
)

const { t } = useI18n({ useScope: 'global' })

const imageRoiStore = useImageRoiStore()
</script>

<template>
  <AssetDetailSidebarActionsWrapper v-if="isActive">
    <VBtn v-if="!imageRoiStore.loader" color="secondary" @click.stop="imageRoiStore.forceReload()" variant="flat">
      {{ t('coreDam.asset.detail.roi.refresh') }}
    </VBtn>
  </AssetDetailSidebarActionsWrapper>
  <div class="px-3">
    <div class="v-expansion-panel-title px-0">{{ t('coreDam.asset.detail.roi.title') }}</div>
    <div class="text-caption">{{ t('coreDam.asset.detail.roi.description') }}</div>
  </div>
  <div v-if="imageRoiStore.loader" class="w-100 h-100 d-flex align-center justify-center">
    <VProgressCircular indeterminate color="primary"></VProgressCircular>
  </div>
  <div v-else-if="imageRoiStore.roi" class="crop-preview pa-2">
    <div v-for="item in imageRoiStore.roi?.links" :key="item.url" class="pb-2">
      <div class="text-subtitle-2">{{ item.title }}</div>
      <img :src="item.url + '?timestamp=' + imageRoiStore.timestamp" :width="item.width" :height="item.height" alt="" />
    </div>
  </div>
</template>

<style lang="scss">
.crop-preview {
  width: 100%;

  img {
    max-width: 100%;
    height: auto;
  }
}
</style>
