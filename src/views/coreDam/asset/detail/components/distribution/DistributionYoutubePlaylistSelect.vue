<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { fetchYoutubePlaylists } from '@/services/api/coreDam/distributionYoutubeApi'
import type { DamDistributionServiceName } from '@anzusystems/common-admin'
import { useAlerts } from '@anzusystems/common-admin'
import type { YoutubePlaylist } from '@/types/coreDam/Distribution'

const props = withDefaults(
  defineProps<{
    modelValue: string
    distributionServiceName: DamDistributionServiceName
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

const { showErrorsDefault } = useAlerts()

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
    showErrorsDefault(error)
  }
  loading.value = false
}

onMounted(() => {
  fetchItems()
})
</script>

<template>
  <VSelect
    v-model="modelValueComputed"
    :label="label"
    :loading="loading"
    :items="itemsComputed"
  >
    <template #append>
      <VBtn
        class="ml-2"
        icon="mdi-refresh"
        size="small"
        variant="text"
        @click.stop="fetchItems(true)"
      />
    </template>
  </VSelect>
</template>
