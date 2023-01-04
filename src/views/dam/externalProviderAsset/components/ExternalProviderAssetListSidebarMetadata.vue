<script lang="ts" setup>
import { useMainWrapper } from '@/composables/wrappers/useMainWrapper'
import { useExternalProviderAssetDetailActions } from '@/views/dam/externalProviderAsset/composables/externalProviderAssetDetailActions'
import ExternalProviderAssetMetadata from '@/views/dam/externalProviderAsset/components/ExternalProviderAssetMetadata.vue'
import { useExternalProviderAssetDetailStore } from '@/stores/dam/externalProviderAssetDetailStore'
import { useExternalProviderAssetImport } from '@/views/dam/externalProviderAsset/composables/externalProviderAssetImport'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

const { sidebarRight } = useMainWrapper()

const { asset, loader } = useExternalProviderAssetDetailActions()

const assetDetailStore = useExternalProviderAssetDetailStore()

const onEditMore = async () => {
  assetDetailStore.showDetail()
}
const { importFromDetail } = useExternalProviderAssetImport()

const onImport = () => {
  importFromDetail()
}
</script>

<template>
  <VNavigationDrawer v-model="sidebarRight" permanent location="right" :width="300">
    <div class="d-flex w-100 h-100 align-center justify-center" v-if="loader">
      <VProgressCircular indeterminate color="primary"></VProgressCircular>
    </div>
    <div class="d-flex w-100 h-100 align-center justify-center" v-else-if="!asset">
      {{ t('coreDam.asset.detial.noAssetSelected') }}
    </div>
    <div v-else>
      <ExternalProviderAssetMetadata />
    </div>
    <template v-slot:append v-if="!loader && asset">
      <div class="pa-2 d-flex align-center justify-center">
        <VBtn color="secondary" variant="flat" @click.stop="onImport" class="mr-2" size="small">Import to DAM</VBtn>
        <VBtn color="secondary" variant="flat" @click.stop="onEditMore" class="mr-2" size="small"> View detail </VBtn>
      </div>
    </template>
  </VNavigationDrawer>
</template>
