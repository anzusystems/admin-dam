<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { DocId } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'

const props = withDefaults(
  defineProps<{
    assetId: DocId
  }>(),
  {}
)

const router = useRouter()

const href = computed(() => {
  return router.resolve({ name: ROUTE.DAM.ASSET.DETAIL, params: { id: props.assetId } }).href
})
</script>

<template>
  <VBtn
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
  >
    <slot />
  </VBtn>
</template>
