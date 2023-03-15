<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { fetchYoutubeLanguages } from '@/services/api/coreDam/distributionYoutubeApi'
import type { DistributionServiceName } from '@/types/coreDam/DamConfig'
import type { YoutubeLanguage } from '@/types/coreDam/Distribution'
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

const items = ref<YoutubeLanguage[]>([])
const loading = ref(false)

const itemsComputed = computed(() => {
  return items.value.map((item) => {
    return { title: item.title, value: item.id }
  })
})

const fetchItems = async () => {
  loading.value = true
  try {
    items.value = await fetchYoutubeLanguages(props.distributionServiceName)
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
  <VSelect v-model="modelValueComputed" :label="label" :loading="loading" :items="itemsComputed" />
</template>
