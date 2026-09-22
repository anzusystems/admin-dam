<script lang="ts" setup>
import { useAssetDetailSidebarActionbar } from '@/domains/coreDam/asset/components/detail/composables/assetDetailSidebarActionbar'

const { canTeleport } = useAssetDetailSidebarActionbar()
</script>

<template>
  <Teleport
    v-if="canTeleport"
    defer
    to="#anzu-asset-detail-sidebar-actions"
  >
    <div class="w-100 text-right">
      <slot />
    </div>
  </Teleport>
</template>
