<script lang="ts" setup>
import { ROUTE } from '@/router/routes'
import { ACurrentUserDropdown } from '@anzusystems/common-admin'
import { useAuth } from '@/composables/auth/auth'
import { SYSTEM_DAM } from '@/model/systems'

const { useCurrentUser } = useAuth()
const { currentUser } = useCurrentUser(SYSTEM_DAM)
</script>

<template>
  <ACurrentUserDropdown
    :current-user="currentUser as any"
    :settings-route-name="ROUTE.SYSTEM.SETTINGS"
    :logout-route-name="ROUTE.SYSTEM.LOGOUT"
  />
</template>
