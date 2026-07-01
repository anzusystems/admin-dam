<script lang="ts" setup>
import { useExternalProviderAssetDetailSidebarActionbar } from '@/domains/coreDam/externalProvider/composables/externalProviderAssetDetailSidebarActionbar'

const { canTeleport } = useExternalProviderAssetDetailSidebarActionbar()
</script>

<template>
  <Teleport
    v-if="canTeleport"
    defer
    to="#anzu-external-provider-asset-detail-sidebar-actions"
  >
    <div class="w-100 text-right">
      <slot />
    </div>
  </Teleport>
</template>
