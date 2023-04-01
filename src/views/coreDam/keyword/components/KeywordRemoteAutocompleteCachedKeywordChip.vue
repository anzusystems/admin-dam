<script lang="ts" setup>
import type { DocId } from '@anzusystems/common-admin'
import { isUndefined } from '@anzusystems/common-admin'
import { computed, shallowRef, watch } from 'vue'
import type { CachedItem } from '@/composables/system/defineCached'
import type { KeywordMinimal } from '@/types/coreDam/Keyword'
import { useCachedKeywords } from '@/views/coreDam/keyword/composables/cachedKeywords'
import { useUploadQueuesStore } from '@/stores/coreDam/uploadQueuesStore'

const props = withDefaults(
  defineProps<{
    id: null | DocId | undefined
    queueId?: string | undefined
  }>(),
  {
    queueId: undefined,
  }
)

const { getCachedKeyword } = useCachedKeywords()
const uploadQueuesStore = useUploadQueuesStore()

const cached = shallowRef<undefined | CachedItem<KeywordMinimal>>(undefined)
const loaded = shallowRef<boolean>(false)

const item = computed(() => {
  return getCachedKeyword(props.id)
})

const displayNewIcon = computed(() => {
  if (!props.queueId) return undefined
  const queue = uploadQueuesStore.getQueue(props.queueId)
  if (!queue || !cached.value) return undefined
  if (queue.suggestions.newKeywordNames.has(cached.value.name)) return 'mdi-new-box'
  return undefined
})

const displayTitle = computed(() => {
  if (cached.value) {
    return cached.value.name
  }
  return ''
})

watch(
  item,
  async (newValue) => {
    if (loaded.value) return
    if (isUndefined(newValue) || newValue._loaded === false) return
    cached.value = newValue
    loaded.value = true
  },
  { immediate: true }
)
</script>

<template>
  <VChip
    size="small"
    :append-icon="displayNewIcon"
  >
    {{ displayTitle }}
    <VProgressCircular
      v-if="!loaded"
      :size="12"
      :width="2"
      indeterminate
      class="mx-1"
    />
  </VChip>
</template>
