<script lang="ts" setup>
import { useExternalProviderAssetDetailSidebarActionbar } from '@/views/dam/externalProviderAsset/composables/externalProviderAssetDetailSidebarActionbar'

const { canTeleport } = useExternalProviderAssetDetailSidebarActionbar()
</script>

<template>
  <Teleport v-if="canTeleport" to="#anzu-external-provider-asset-detail-sidebar-actions">
    <div class="w-100 text-right">
      <slot></slot>
    </div>
  </Teleport>
</template>
