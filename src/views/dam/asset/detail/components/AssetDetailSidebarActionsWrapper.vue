<script lang="ts" setup>
import { useAssetDetailSidebarActionbar } from '@/views/dam/asset/detail/composables/assetDetailSidebarActionbar'

const { canTeleport } = useAssetDetailSidebarActionbar()
</script>

<template>
  <Teleport v-if="canTeleport" to="#anzu-asset-detail-sidebar-actions">
    <div class="w-100 text-right">
      <slot></slot>
    </div>
  </Teleport>
</template>
