<script lang="ts" setup>
import { useActionbar } from '@/composables/system/actionbar'

const { canTeleport } = useActionbar()
</script>

<template>
  <Teleport v-if="canTeleport" to="#anzu-actionbar-buttons">
    <slot />
  </Teleport>
</template>
