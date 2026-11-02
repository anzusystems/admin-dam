<script lang="ts" setup>
import { useMainWrapper } from '@/domains/system/composables/useMainWrapper'
import { useExternalProviderAssetDetailActions } from '@/domains/coreDam/externalProvider/composables/externalProviderAssetDetailActions'
import ExternalProviderAssetMetadata from '@/domains/coreDam/externalProvider/components/ExternalProviderAssetMetadata.vue'
import { useExternalProviderAssetDetailStore } from '@/domains/coreDam/externalProvider/store/externalProviderAssetDetailStore'
import { useExternalProviderAssetImport } from '@/domains/coreDam/externalProvider/composables/externalProviderAssetImport'
import { useCurrentListView } from '@/domains/coreDam/assetListView/composables/currentListView'

const { t } = useI18n()

const { sidebarRight } = useMainWrapper()

const { asset, loader } = useExternalProviderAssetDetailActions()
const { uploadAllowed } = useCurrentListView()

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
  <VNavigationDrawer
    v-model="sidebarRight"
    permanent
    location="right"
    :width="300"
  >
    <div
      v-if="loader"
      class="d-flex w-100 h-100 align-center justify-center"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </div>
    <div
      v-else-if="!asset"
      class="d-flex w-100 h-100 align-center justify-center"
    >
      {{ t('coreDam.asset.detail.noAssetSelected') }}
    </div>
    <div v-else>
      <ExternalProviderAssetMetadata />
    </div>
    <template
      v-if="!loader && asset"
      #append
    >
      <div class="pa-2 d-flex align-center justify-center">
        <ABtnPrimary
          v-if="uploadAllowed"
          class="mr-2"
          size="small"
          @click.stop="onImport"
        >
          {{ t('coreDam.asset.externalProvider.importToDam') }}
        </ABtnPrimary>
        <ABtnTertiary
          class="mr-2"
          size="small"
          @click.stop="onEditMore"
        >
          {{ t('coreDam.asset.externalProvider.viewDetail') }}
        </ABtnTertiary>
      </div>
    </template>
  </VNavigationDrawer>
</template>
