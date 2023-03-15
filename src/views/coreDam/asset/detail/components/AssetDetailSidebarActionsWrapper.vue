<script lang="ts" setup>
import { useAssetDetailSidebarActionbar } from '@/views/coreDam/asset/detail/composables/assetDetailSidebarActionbar'

const { canTeleport } = useAssetDetailSidebarActionbar()
</script>

<template>
  <Teleport v-if="canTeleport" to="#anzu-asset-detail-sidebar-actions">
    <div class="w-100 text-right">
      <slot />
    </div>
  </Teleport>
</template>
