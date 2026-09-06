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
  <!-- `/login` rather than the homepage: the homepage is behind the guard, and `useLoginStatus`
       keeps its verdict in a module ref that nothing clears, so the guard answers `/unauthorized`
       again and the button leads back here. `/login` at least offers signing in as somebody else.
       Pointing this at the homepage needs that ref cleared first. -->
  <AUnauthorizedView return-route-name="/login" />
</template>
