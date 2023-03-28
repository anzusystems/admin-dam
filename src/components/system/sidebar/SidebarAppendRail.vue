<script lang="ts" setup>
import { useCurrentUser } from '@/composables/system/currentUser'
import { ACurrentUserDropdown } from '@anzusystems/common-admin'

const { currentUser } = useCurrentUser()
</script>

<template>
  <div class="align-center flex-column justify-space-between px-1">
    <ACurrentUserDropdown
      :current-user="currentUser"
      class="my-2"
    />
  </div>
</template>
