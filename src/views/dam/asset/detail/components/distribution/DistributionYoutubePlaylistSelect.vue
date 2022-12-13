<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { fetchYoutubePlaylists } from '@/services/api/dam/distributionYoutubeApi'
import type { DistributionServiceName } from '@/types/dam/DamConfig'
import type { YoutubePlaylist } from '@/types/dam/Distribution'
import { useErrorHandler } from '@/composables/system/error'

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
  <VSelect :label="label" v-model="modelValueComputed" :loading="loading" :items="itemsComputed">
    <template v-slot:append>
      <VBtn @click.stop="fetchItems(true)" class="ml-2" icon="mdi-refresh" size="small" variant="text"></VBtn>
    </template>
  </VSelect>
</template>
