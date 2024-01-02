<script lang="ts" setup>
import { ROUTE } from '@/router/routes'
import { useDamCurrentUser } from '@anzusystems/common-admin'
import { ACurrentUserDropdown } from '@anzusystems/common-admin'

const { damCurrentUser } = useDamCurrentUser()
</script>

<template>
  <ACurrentUserDropdown
    :current-user="damCurrentUser"
    :settings-route-name="ROUTE.SYSTEM.SETTINGS"
    :logout-route-name="ROUTE.SYSTEM.LOGOUT"
  />
</template>
