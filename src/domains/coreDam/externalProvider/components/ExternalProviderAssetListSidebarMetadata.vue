<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

import ExternalProviderAssetMetadata from '@/domains/coreDam/externalProvider/components/ExternalProviderAssetMetadata.vue'
import { useExternalProviderAssetDetailActions } from '@/domains/coreDam/externalProvider/composables/externalProviderAssetDetailActions'
import { useExternalProviderAssetImport } from '@/domains/coreDam/externalProvider/composables/externalProviderAssetImport'
import { useExternalProviderAssetDetailStore } from '@/domains/coreDam/externalProvider/store/externalProviderAssetDetailStore'
import { useMainWrapper } from '@/domains/system/composables/useMainWrapper'

const { t } = useI18n()

const { sidebarRight } = useMainWrapper()

const { asset, loader } = useExternalProviderAssetDetailActions()

const assetDetailStore = useExternalProviderAssetDetailStore()

const onEditMore = async () => {
  assetDetailStore.showDetail()
}
const { canImport, importFromDetail } = useExternalProviderAssetImport()

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
          v-if="canImport([asset.attributes.assetType])"
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
