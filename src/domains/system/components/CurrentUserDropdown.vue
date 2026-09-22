<script lang="ts" setup>
import { ACurrentUserDropdown } from '@anzusystems/common-admin'
import { useAuth } from '@/domains/system/auth/auth'
import { SYSTEM_DAM } from '@/shared/systems'

const { useCurrentUser } = useAuth()
const { currentUser } = useCurrentUser(SYSTEM_DAM)
</script>

<template>
  <ACurrentUserDropdown
    :current-user="currentUser as any"
    settings-route-name="/settings"
    logout-route-name="/logout"
  />
</template>
