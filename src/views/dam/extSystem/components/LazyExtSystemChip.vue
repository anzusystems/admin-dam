<script lang="ts" setup>
import { computed } from 'vue'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { isNull } from '@/utils/common'
import { useLazyExtSystem } from '@/views/dam/extSystem/composables/lazyExtSystem'

const props = withDefaults(
  defineProps<{
    id?: null | number
  }>(),
  {
    id: null,
  }
)

const router = useRouter()

const { has, get } = useLazyExtSystem()

const showLoader = computed(() => {
  return props.id != null && props.id > 0 && !has(props.id)
})

const item = computed(() => {
  return get(props.id)
})

const onClick = () => {
  router.push({ name: ROUTE.DAM.EXT_SYSTEM.DETAIL, params: { id: props.id } })
}
</script>

<template>
  <div class="d-inline-flex">
    <span v-if="isNull(id)">-</span>
    <VProgressCircular v-else-if="showLoader" :size="16" :width="2" indeterminate></VProgressCircular>
    <VChip v-else rounded="lg" size="small" variant="tonal" @click.stop="onClick">
      {{ item?.name }}
    </VChip>
  </div>
</template>
