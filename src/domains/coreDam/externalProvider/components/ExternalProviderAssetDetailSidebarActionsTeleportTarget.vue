<script lang="ts" setup>
import { useExternalProviderAssetDetailSidebarActionbar } from '@/domains/coreDam/externalProvider/composables/externalProviderAssetDetailSidebarActionbar'

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
