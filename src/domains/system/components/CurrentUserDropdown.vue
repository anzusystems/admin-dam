<script lang="ts" setup>
import type { AnzuUserMinimal } from '@anzusystems/common-admin'
import { ACurrentUserDropdown } from '@anzusystems/common-admin'
import { computed } from 'vue'

import { useAuth } from '@/domains/system/auth/auth'
import { SYSTEM_DAM } from '@/shared/systems'

const { useCurrentUser } = useAuth()
const { currentUser } = useCurrentUser(SYSTEM_DAM)

// `AnzuUser.id` is nullable, but the dropdown needs `AnzuUserMinimal` with a required id.
// The signed-in user always has an id, so it is narrowed here instead of using `any`.
const currentUserMinimal = computed(() => currentUser.value as AnzuUserMinimal | undefined)
</script>

<template>
  <ACurrentUserDropdown
    :current-user="currentUserMinimal"
    settings-route-name="/settings"
    logout-route-name="/logout"
  />
</template>
