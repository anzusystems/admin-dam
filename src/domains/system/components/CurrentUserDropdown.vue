<script lang="ts" setup>
import type { AnzuUserMinimal } from '@anzusystems/common-admin'
import { ACurrentUserDropdown } from '@anzusystems/common-admin'
import { useAuth } from '@/domains/system/auth/auth'
import { SYSTEM_DAM } from '@/shared/systems'

const { useCurrentUser } = useAuth()
const { currentUser } = useCurrentUser(SYSTEM_DAM)

// `AnzuUser` carries `id?: IntegerIdNullable` from `BaseUser`, while the dropdown asks for
// `AnzuUserMinimal`, whose `id` is required and non-null. The signed-in user always has one -- the
// app does not get this far otherwise -- so the difference is narrowed here rather than widened to
// `any` at the call site.
const currentUserMinimal = computed(() => currentUser.value as AnzuUserMinimal | undefined)
</script>

<template>
  <ACurrentUserDropdown
    :current-user="currentUserMinimal"
    settings-route-name="/settings"
    logout-route-name="/logout"
  />
</template>
