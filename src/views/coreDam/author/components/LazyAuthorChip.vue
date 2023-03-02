<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { isNull } from '@anzusystems/common-admin'
import { useLazyAuthor } from '@/views/coreDam/author/composables/lazyAuthor'

const props = withDefaults(
  defineProps<{
    id?: null | string
    allowClick?: boolean
    closeIcon?: string
  }>(),
  {
    id: null,
    allowClick: true,
    closeIcon: 'close-circle',
  }
)

const router = useRouter()

const { has, get, loadedAll } = useLazyAuthor()

const showLoader = computed(() => {
  return props.id != null && props.id !== '' && (!has(props.id) || !loadedAll)
})

const item = ref(get(props.id))

watch(loadedAll, (newValue) => {
  if (newValue) item.value = get(props.id)
})

const emit = defineEmits<{
  (e: 'closeChip', id: string): void
}>()

const onClick = () => {
  if (props.allowClick) router.push({ name: ROUTE.DAM.AUTHOR.DETAIL, params: { id: props.id } })
}

const showed = ref(true)

const onClose = (id: string) => {
  showed.value = false
  emit('closeChip', id)
}
</script>

<template>
  <div v-if="showed" class="d-inline-flex">
    <span v-if="isNull(id)">-</span>
    <VProgressCircular v-else-if="showLoader" :size="16" :width="2" indeterminate />
    <VChip
      v-else
      rounded="lg"
      size="small"
      variant="tonal"
      closable
      :close-icon="closeIcon"
      @click:close="onClose(id)"
      @click.stop="onClick"
    >
      {{ item?.title }}
    </VChip>
  </div>
</template>
