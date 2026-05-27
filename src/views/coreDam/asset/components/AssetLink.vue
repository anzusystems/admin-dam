<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    assetId: DocId
  }>(),
  {}
)

const router = useRouter()

const href = computed(() => {
  return router.resolve({ name: '/(coreDam)/assets/[id]', params: { id: props.assetId } }).href
})
</script>

<template>
  <VBtn :href="href" target="_blank" rel="noopener noreferrer">
    <slot />
  </VBtn>
</template>
