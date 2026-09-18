<script lang="ts" setup>
import { AAlerts } from '@anzusystems/common-admin'

const { theme } = useTheme()
</script>

<template>
  <!-- The alerts host belongs in every layout that can be on screen on its own, this one included:
       it is what the app shows until a route resolves, and a notification raised with no host
       mounted is dropped rather than queued. Exactly one layout is mounted at a time, so the hosts
       in the other layouts never double an alert with this one. -->
  <AAlerts />
  <VApp :theme="theme">
    <VMain class="d-flex w-100 h-100 align-center justify-center">
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </VMain>
  </VApp>
</template>
