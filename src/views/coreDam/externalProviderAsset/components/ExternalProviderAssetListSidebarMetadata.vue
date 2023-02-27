<script lang="ts" setup>
import { useMainWrapper } from '@/composables/wrappers/useMainWrapper'
import {
  useExternalProviderAssetDetailActions
} from '@/views/coreDam/externalProviderAsset/composables/externalProviderAssetDetailActions'
import ExternalProviderAssetMetadata
  from '@/views/coreDam/externalProviderAsset/components/ExternalProviderAssetMetadata.vue'
import { useExternalProviderAssetDetailStore } from '@/stores/dam/externalProviderAssetDetailStore'
import {
  useExternalProviderAssetImport
} from '@/views/coreDam/externalProviderAsset/composables/externalProviderAssetImport'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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
    <div v-if="loader" class="d-flex w-100 h-100 align-center justify-center">
      <VProgressCircular indeterminate color="primary" />
    </div>
    <div v-else-if="!asset" class="d-flex w-100 h-100 align-center justify-center">
      {{ t('coreDam.asset.detail.noAssetSelected') }}
    </div>
    <div v-else>
      <ExternalProviderAssetMetadata />
    </div>
    <template v-if="!loader && asset" #append>
      <div class="pa-2 d-flex align-center justify-center">
        <VBtn color="secondary" variant="flat" class="mr-2" size="small" @click.stop="onImport">Import to DAM</VBtn>
        <VBtn color="secondary" variant="flat" class="mr-2" size="small" @click.stop="onEditMore"> View detail </VBtn>
      </div>
    </template>
  </VNavigationDrawer>
</template>
