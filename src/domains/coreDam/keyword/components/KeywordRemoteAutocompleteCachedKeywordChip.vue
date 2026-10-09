<script lang="ts" setup>
import type { CachedItem, DamKeywordMinimal, DocId } from '@anzusystems/common-admin'
import { isNull, isUndefined } from '@anzusystems/common-admin'
import { computed, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useUploadQueuesStore } from '@/domains/coreDam/asset/store/uploadQueuesStore'
import { useCachedKeywords } from '@/domains/coreDam/keyword/composables/cachedKeywords'

const props = withDefaults(
  defineProps<{
    id: null | DocId | undefined
    title?: string
    queueId?: string | undefined
    forceRounded?: boolean
    textOnly?: boolean
    size?: string
    containerClass?: undefined | string
  }>(),
  {
    queueId: undefined,
    title: '',
    forceRounded: false,
    textOnly: false,
    size: 'small',
    containerClass: 'd-inline-flex',
  }
)

const { getCachedKeyword } = useCachedKeywords()
const uploadQueuesStore = useUploadQueuesStore()

const cached = shallowRef<undefined | CachedItem<DamKeywordMinimal>>(undefined)
const loaded = shallowRef<boolean>(false)

const item = computed(() => {
  return getCachedKeyword(props.id)
})

// The server did not return it: its id is all there is to show.
const unresolved = computed(() => !loaded.value && props.title.length === 0 && item.value?._unresolved === true)

const displayNewIcon = computed(() => {
  if (!props.queueId) return undefined
  const queue = uploadQueuesStore.getQueue(props.queueId)
  if (!queue || !cached.value) return undefined
  if (queue.suggestions.newKeywordNames.has(cached.value.name)) return 'mdi-new-box'
  return undefined
})

const displayTitle = computed(() => {
  if (props.title.length > 0) return props.title
  if (cached.value) {
    return cached.value.name
  }
  if (unresolved.value) return '#' + props.id
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

const { t } = useI18n()
</script>

<template>
  <div :class="containerClass">
    <template v-if="isNull(id) || isUndefined(id)">
      <slot name="empty"> - </slot>
    </template>
    <div
      v-else-if="textOnly"
      :title="unresolved ? t('common.model.cachedUnavailable') : undefined"
    >
      {{ displayTitle }}
      <VProgressCircular
        v-if="!loaded && !unresolved && title.length === 0"
        :size="12"
        :width="2"
        indeterminate
        class="mx-1"
      />
    </div>
    <VChip
      v-else
      :size="size"
      :append-icon="displayNewIcon"
      :label="forceRounded ? undefined : true"
      :title="unresolved ? t('common.model.cachedUnavailable') : undefined"
    >
      {{ displayTitle }}
      <VProgressCircular
        v-if="!loaded && !unresolved && title.length === 0"
        :size="12"
        :width="2"
        indeterminate
        class="mx-1"
      />
    </VChip>
  </div>
</template>
