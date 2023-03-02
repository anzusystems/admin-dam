<script lang="ts" setup>
import { computed } from 'vue'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { isNull } from '@anzusystems/common-admin'
import { useLazyExtSystem } from '@/views/coreDam/extSystem/composables/lazyExtSystem'

const props = withDefaults(
  defineProps<{
    id?: null | number
    variant?: 'text' | 'tonal'
  }>(),
  {
    id: null,
    variant: 'tonal',
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
    <VProgressCircular v-else-if="showLoader" :size="16" :width="2" indeterminate />
    <VBtn v-else rounded="lg" size="small" :variant="variant" @click.stop="onClick">
      {{ item?.name }}
    </VBtn>
  </div>
</template>
