<script lang="ts" setup>
import { computed } from 'vue'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { isNull } from '@/utils/common'
import { useLazyUser } from '@/views/dam/user/composables/lazyUser'

const props = withDefaults(
  defineProps<{
    id?: null | number
  }>(),
  {
    id: null,
  }
)

const router = useRouter()

const { has, get } = useLazyUser()

const showLoader = computed(() => {
  return props.id != null && props.id > 0 && !has(props.id)
})

const item = computed(() => {
  return get(props.id)
})

const text = computed(() => {
  if (item.value) {
    return item.value.firstName.length || item.value?.lastName.length
      ? item.value.firstName + ' ' + item.value.lastName
      : item.value.email.split('@')[0]
  }
  return ''
})

const onClick = () => {
  router.push({ name: ROUTE.DAM.USER.DETAIL, params: { id: props.id } })
}
</script>

<template>
  <div class="d-inline-flex">
    <span v-if="isNull(id)">-</span>
    <VProgressCircular v-else-if="showLoader" :size="16" :width="2" indeterminate></VProgressCircular>
    <VChip v-else rounded="lg" size="small" variant="tonal" @click.stop="onClick">
      {{ text }}
    </VChip>
  </div>
</template>
