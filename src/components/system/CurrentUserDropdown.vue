<script lang="ts" setup>
import { ROUTE } from '@/router/routes'
import { useCurrentUser } from '@/composables/system/currentUser'
import { ACurrentUserDropdown } from '@anzusystems/common-admin'

const { currentUser } = useCurrentUser()
</script>

<template>
  <ACurrentUserDropdown
    :current-user="currentUser"
    :settings-route-name="ROUTE.SYSTEM.SETTINGS"
    :logout-route-name="ROUTE.SYSTEM.LOGOUT"
  />
</template>
