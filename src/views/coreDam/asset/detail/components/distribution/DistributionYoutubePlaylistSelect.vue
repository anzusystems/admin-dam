<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { fetchYoutubePlaylists } from '@/services/api/coreDam/distributionYoutubeApi'
import type { DistributionServiceName } from '@/types/coreDam/DamConfig'
import type { YoutubePlaylist } from '@/types/coreDam/Distribution'
import { useErrorHandler } from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    modelValue: string
    distributionServiceName: DistributionServiceName
    label?: string
  }>(),
  {
    label: undefined,
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: string): void
}>()

const modelValueComputed = computed({
  get() {
    return props.modelValue
  },
  set(newValue: string) {
    emit('update:modelValue', newValue)
  },
})

const { handleError } = useErrorHandler()

const items = ref<YoutubePlaylist[]>([])
const loading = ref(false)

const itemsComputed = computed(() => {
  return items.value.map((item) => {
    return { title: item.title, value: item.id }
  })
})

const fetchItems = async (forceReload = false) => {
  loading.value = true
  try {
    items.value = await fetchYoutubePlaylists(props.distributionServiceName, forceReload)
  } catch (error) {
    handleError(error)
  }
  loading.value = false
}

onMounted(() => {
  fetchItems()
})
</script>

<template>
  <VSelect v-model="modelValueComputed" :label="label" :loading="loading" :items="itemsComputed">
    <template #append>
      <VBtn class="ml-2" icon="mdi-refresh" size="small" variant="text" @click.stop="fetchItems(true)" />
    </template>
  </VSelect>
</template>
