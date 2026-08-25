<script setup lang="ts">
import { ANotFoundView } from '@anzusystems/common-admin'

definePage({
  meta: {
    requiresAuth: false,
    requiredPermissions: [],
    layout: 'AppLayoutFullscreen',
  },
})
</script>

<template>
  <ANotFoundView return-route-name="/" />
</template>
