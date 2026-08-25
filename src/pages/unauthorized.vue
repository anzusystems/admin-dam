<script setup lang="ts">
import { AUnauthorizedView } from '@anzusystems/common-admin'

definePage({
  meta: {
    requiresAuth: false,
    requiredPermissions: [],
    layout: 'AppLayoutFullscreen',
  },
})
</script>

<template>
  <AUnauthorizedView return-route-name="/login" />
</template>
