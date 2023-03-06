<script lang="ts" setup>
import { computed } from 'vue'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { IntegerId, isNull, isUndefined } from '@anzusystems/common-admin'
import { useCachedUsers } from '@/views/coreDam/user/composables/cachedUsers'

const props = withDefaults(
  defineProps<{
    id?: null | undefined | IntegerId
  }>(),
  {
    id: null,
  }
)

const router = useRouter()

const { getCachedUser } = useCachedUsers()

const item = computed(() => {
  return getCachedUser(props.id)
})

const showLoader = computed(() => {
  if (item.value && item.value._loaded === true) return true
  return false
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
    <span v-if="isNull(id) || isUndefined(id)">-</span>
    <VProgressCircular v-else-if="showLoader" :size="16" :width="2" indeterminate />
    <VChip v-else rounded="lg" size="small" variant="tonal" @click.stop="onClick">
      {{ text }}
    </VChip>
  </div>
</template>
