<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { fetchYoutubeLanguages } from '@/services/api/coreDam/distributionYoutubeApi'
import type { DamDistributionServiceName } from '@anzusystems/common-admin'
import { useAlerts } from '@anzusystems/common-admin'
import type { YoutubeLanguage } from '@/types/coreDam/Distribution'

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
  />
</template>
