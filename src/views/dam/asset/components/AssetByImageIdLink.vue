<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { DocId } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { fetchAsset } from '@/services/api/dam/assetApi'
import { AssetDetailItemDto } from '@/types/dam/Asset'

const props = withDefaults(
  defineProps<{
    imageId: DocId
  }>(),
  {}
)
const asset = ref<AssetDetailItemDto | null>(null)
const loading = ref(false)

const router = useRouter()

const loadAsset = async (id: DocId) => {
  loading.value = true
  try {
    asset.value = await fetchAsset(id)
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
  if (!asset.value) return undefined
  return router.resolve({ name: ROUTE.DAM.ASSET.DETAIL, params: { id: asset.value.id } }).href
})
</script>

<template>
  <VBtn :href="href" target="_blank" :loading="loading">
    <slot></slot>
  </VBtn>
</template>
