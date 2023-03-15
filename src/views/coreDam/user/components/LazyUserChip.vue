<script lang="ts" setup>
import { computed } from 'vue'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { isNull } from '@anzusystems/common-admin'
import { useLazyUser } from '@/views/coreDam/user/composables/lazyUser'
import { useUserDisplayHelper } from '@/composables/system/userDisplayHelper'

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

const { getUsername } = useUserDisplayHelper()

const text = computed(() => getUsername(item.value))

const onClick = () => {
  router.push({ name: ROUTE.DAM.USER.DETAIL, params: { id: props.id } })
}
</script>

<template>
  <div class="d-inline-flex">
    <span v-if="isNull(id)">-</span>
    <VProgressCircular v-else-if="showLoader" :size="16" :width="2" indeterminate />
    <VChip v-else rounded="lg" size="small" variant="tonal" @click.stop="onClick">
      {{ text }}
    </VChip>
  </div>
</template>
