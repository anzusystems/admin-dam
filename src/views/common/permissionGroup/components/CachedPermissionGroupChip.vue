<script lang="ts" setup>
import { ACachedChip } from '@anzusystems/common-admin'
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
    :route="'/(common)/permission-group/[id]'"
    display-text-path="title"
  />
</template>
