<script lang="ts" setup>
import { computed, shallowRef } from 'vue'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { IntegerId, isNull, isUndefined } from '@anzusystems/common-admin'
import { useCachedUsers } from '@/views/coreDam/user/composables/cachedUsers'
import { watchPausable } from '@vueuse/core'
import type { UserMinimal } from '@/types/coreDam/User'

const props = withDefaults(
  defineProps<{
    id?: null | undefined | IntegerId
  }>(),
  {
    id: null,
  }
)

const router = useRouter()
const cached = shallowRef<undefined | UserMinimal>(undefined)

const { getCachedUser } = useCachedUsers()

const item = computed(() => {
  return getCachedUser(props.id)
})

const text = computed(() => {
  if (cached.value) {
    return cached.value.firstName.length || cached.value?.lastName.length
      ? cached.value.firstName + ' ' + cached.value.lastName
      : cached.value.email.split('@')[0]
  }
  return props.id
})

const onClick = () => {
  router.push({ name: ROUTE.DAM.USER.DETAIL, params: { id: props.id } })
}

const { stop } = watchPausable(item, (newValue) => {
  if (isUndefined(newValue) || newValue._loaded === false) return
  cached.value = newValue
  stop()
})
</script>

<template>
  <div class="d-inline-flex">
    <span v-if="isNull(id) || isUndefined(id)">-</span>
    <VChip v-else rounded="lg" size="small" variant="tonal" @click.stop="onClick">
      {{ text }} <VProgressCircular v-if="!cached" :size="12" :width="2" indeterminate class="ml-1" />
    </VChip>
  </div>
</template>
