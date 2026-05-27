<script lang="ts" setup>
import type { AssetFileImage } from '@anzusystems/common-admin'
import { fetchImageFile } from '@/services/api/coreDam/imageApi'

const props = withDefaults(
  defineProps<{
    imageId: DocId
  }>(),
  {}
)
const image = ref<AssetFileImage | null>(null)
const loading = ref(false)

const router = useRouter()

const loadAsset = async (id: DocId) => {
  loading.value = true
  try {
    image.value = await fetchImageFile(id)
  } catch (error) {
    //
  } finally {
    loading.value = false
  }
}

const imageIdComputed = computed(() => {
  return props.imageId
})

watch(
  imageIdComputed,
  (newValue, oldValue) => {
    if (newValue === oldValue) return
    loadAsset(newValue)
  },
  { immediate: true }
)

const href = computed(() => {
  if (!image.value) return undefined
  return router.resolve({ name: '/(coreDam)/asset/[id]', params: { id: image.value.asset } }).href
})
</script>

<template>
  <VBtn v-if="href" :href="href" target="_blank" rel="noopener noreferrer" :loading="loading">
    <slot />
  </VBtn>
</template>
