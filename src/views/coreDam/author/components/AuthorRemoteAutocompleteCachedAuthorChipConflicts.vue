<script lang="ts" setup>
import type { CachedItem, DocId } from '@anzusystems/common-admin'
import { isUndefined } from '@anzusystems/common-admin'
import { useCachedAuthors } from '@/views/coreDam/author/composables/cachedAuthors'
import { computed, shallowRef, watch } from 'vue'
import type { AuthorMinimal } from '@/types/coreDam/Author'

const props = withDefaults(
  defineProps<{
    id: null | DocId | undefined
    queueId?: string | undefined
  }>(),
  {
    queueId: undefined,
  }
)
const emit = defineEmits<{
  (e: 'addAuthor', data: DocId | null | undefined): void
}>()

const clickClose = () => {
  emit('addAuthor', props.id)
}

const { getCachedAuthor } = useCachedAuthors()

const cached = shallowRef<undefined | CachedItem<AuthorMinimal>>(undefined)
const loaded = shallowRef<boolean>(false)

const item = computed(() => {
  return getCachedAuthor(props.id)
})

const displayTitle = computed(() => {
  if (cached.value) {
    return cached.value.name + (cached.value.identifier?.length > 0 ? ` (${cached.value.identifier})` : '')
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
    closable
    close-icon="mdi-plus"
    @click:close="clickClose"
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
