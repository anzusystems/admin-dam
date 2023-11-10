<script lang="ts" setup>
import type { IntegerId } from '@anzusystems/common-admin'
import { ACachedChip } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useCachedPermissionGroups } from '@/views/common/permissionGroup/composables/cachedPermissionGroups'

withDefaults(
  defineProps<{
    id: null | IntegerId | undefined
  }>(),
  {}
)

const { getCachedPermissionGroup } = useCachedPermissionGroups()
</script>

<template>
  <ACachedChip
    :id="id"
    :get-cached-fn="getCachedPermissionGroup"
    :route="ROUTE.COMMON.PERMISSION_GROUP.DETAIL"
    display-text-path="title"
  />
</template>
