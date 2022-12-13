<script lang="ts" setup>
import type { AclValue } from '@/types/Permission'
import { useAcl } from '@/composables/system/ability'
import { ref, watch } from 'vue'
import { useCurrentUser } from '@/composables/system/currentUser'

const props = withDefaults(
  defineProps<{
    permission: AclValue
    subject?: object
  }>(),
  {}
)

const { can } = useAcl()
const { currentUser } = useCurrentUser()
const allowed = ref<boolean>(can(props.permission, props.subject))

watch(currentUser, () => {
  allowed.value = can(props.permission, props.subject)
})
</script>

<template>
  <slot v-if="allowed"></slot>
</template>
