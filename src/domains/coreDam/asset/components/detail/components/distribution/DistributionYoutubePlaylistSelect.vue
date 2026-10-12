<script lang="ts" setup>
import type { DamDistributionServiceName } from '@anzusystems/common-admin'
import { useAlerts } from '@anzusystems/common-admin'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { fetchYoutubePlaylists } from '@/domains/coreDam/asset/api/distributionYoutubeApi'
import type { YoutubePlaylist } from '@/domains/coreDam/asset/types/Distribution'

const props = withDefaults(
  defineProps<{
    distributionServiceName: DamDistributionServiceName
    label?: string
  }>(),
  {
    label: undefined,
  }
)
const modelValue = defineModel<string>({ required: true })
const modelValueComputed = computed({
  get() {
    return modelValue.value
  },
  set(newValue: string) {
    modelValue.value = newValue
  },
})

const { t } = useI18n()
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
        icon
        size="small"
        variant="text"
        @click.stop="fetchItems(true)"
      >
        <VIcon icon="mdi-refresh" />
        <VTooltip
          activator="parent"
          location="bottom"
        >
          {{ t('common.button.refresh') }}
        </VTooltip>
      </VBtn>
    </template>
  </VSelect>
</template>
