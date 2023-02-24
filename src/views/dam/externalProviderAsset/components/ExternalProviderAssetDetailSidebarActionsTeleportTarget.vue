<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted } from 'vue'
import {
  useExternalProviderAssetDetailSidebarActionbar
} from '@/views/dam/externalProviderAsset/composables/externalProviderAssetDetailSidebarActionbar'

const { mounted, unMounted } = useExternalProviderAssetDetailSidebarActionbar()

onMounted(async () => {
  await nextTick()
  mounted()
})

onBeforeUnmount(() => {
  unMounted()
})
</script>

<template>
  <div id="anzu-external-provider-asset-detail-sidebar-actions" />
</template>
