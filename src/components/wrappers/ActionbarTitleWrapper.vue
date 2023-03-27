<script lang="ts" setup>
import { useActionbar } from '@/composables/system/actionbar'

const { canTeleport } = useActionbar()

withDefaults(
  defineProps<{
    heading?: string
    icon?: string
  }>(),
  {
    heading: '',
    icon: '',
  }
)
</script>

<template>
  <Teleport
    v-if="canTeleport"
    to="#anzu-actionbar-title"
  >
    <slot>
      <!--      <APageTitle :heading="heading" :icon="icon" />-->
    </slot>
  </Teleport>
</template>
