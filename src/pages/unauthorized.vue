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
  <!--
    `/login` instead of the homepage. The homepage is behind the guard, and
    `useLoginStatus` keeps its result in a module ref that nothing clears.
    The guard would answer `/unauthorized` again and the button would
    lead back here. `/login` lets the user sign in as somebody else.
    Pointing this at the homepage needs that ref cleared first.
  -->
  <AUnauthorizedView return-route-name="/login" />
</template>
