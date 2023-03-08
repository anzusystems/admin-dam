<script lang="ts" setup>
import { computed, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { DocId, ICON, IntegerId, isNull, isUndefined, objectGetValueByPath } from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    id: null | undefined | IntegerId | DocId
    containerClass?: undefined | string
    getCachedFn: (id: DocId | IntegerId) => any
    displayTextPath: string
    route: string
    disableClick?: boolean
    openInNew?: boolean
    size?: string
    closeIcon?: string
    prependIcon?: string | undefined
    appendIcon?: string | undefined
    closable?: boolean
    forceRounded?: boolean
    textOnly?: boolean
    fallbackIdText?: boolean
    hideLoader?: boolean
  }>(),
  {
    id: null,
    containerClass: 'd-inline-flex',
    disableClick: false,
    openInNew: false,
    size: 'small',
    closeIcon: 'close-circle',
    prependIcon: undefined,
    appendIcon: undefined,
    closable: false,
    forceRounded: false,
    textOnly: false,
    fallbackIdText: false,
    hideLoader: false,
  }
)
const emit = defineEmits<{
  (e: 'closeChip', id: null | undefined | IntegerId | DocId): void
}>()

const router = useRouter()
const cached = shallowRef<undefined | any>(undefined)
const loaded = shallowRef<boolean>(false)

const item = computed(() => {
  return props.getCachedFn(props.id as any)
})

const displayTitle = computed(() => {
  if (cached.value) {
    return objectGetValueByPath(cached.value, props.displayTextPath)
  }
  return props.fallbackIdText ? props.id : ''
})

const onClick = () => {
  router.push({ name: props.route, params: { id: props.id } })
}

const onClose = (id: null | undefined | IntegerId | DocId) => {
  emit('closeChip', id)
}

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
  <div :class="containerClass">
    <template v-if="isNull(id) || isUndefined(id)"><slot name="empty">-</slot></template>
    <div v-else-if="textOnly">
      {{ displayTitle }}
      <VProgressCircular v-if="!hideLoader && !loaded" :size="12" :width="2" indeterminate class="mx-1" />
    </div>
    <VChip
      v-else-if="disableClick"
      :size="size"
      :prepend-icon="prependIcon"
      :append-icon="appendIcon"
      :label="forceRounded ? undefined : true"
      @click:close="onClose(id)"
    >
      {{ displayTitle }}
      <VProgressCircular v-if="!hideLoader && !loaded" :size="12" :width="2" indeterminate class="mx-1" />
    </VChip>
    <VChip
      v-else
      :size="size"
      :closable="closable"
      :close-icon="closeIcon"
      :prepend-icon="prependIcon"
      :append-icon="appendIcon ? appendIcon : openInNew ? ICON.CHIP_LINK_EXTERNAL : ICON.CHIP_LINK"
      :label="forceRounded ? undefined : true"
      @click.stop="onClick"
      @click:close="onClose(id)"
    >
      {{ displayTitle }}
      <VProgressCircular v-if="!hideLoader && !loaded" :size="12" :width="2" indeterminate class="mx-1" />
    </VChip>
  </div>
</template>
