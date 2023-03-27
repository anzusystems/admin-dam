<script lang="ts" setup>
import { computed, shallowRef, watch } from 'vue'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { COMMON_CONFIG, type IntegerId, isNull, isUndefined } from '@anzusystems/common-admin'
import { useCachedUsers } from '@/views/coreDam/user/composables/cachedUsers'
import type { UserMinimal } from '@/types/coreDam/User'
import AAnzuUserAvatar from '@/components/AAnzuUserAvatar.vue'

const props = withDefaults(
  defineProps<{
    id: null | undefined | IntegerId
  }>(),
  {}
)

const router = useRouter()
const cached = shallowRef<undefined | UserMinimal>(undefined)
const loaded = shallowRef<boolean>(false)

const { getCachedUser } = useCachedUsers()

const item = computed(() => {
  return getCachedUser(props.id)
})

const text = computed(() => {
  if (cached.value) {
    return cached.value.person.fullName.length ? cached.value.person.fullName : cached.value.email.split('@')[0]
  }
  return ''
})

const onClick = () => {
  router.push({ name: ROUTE.DAM.USER.DETAIL, params: { id: props.id } })
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
  <div class="d-inline-flex">
    <span v-if="isNull(id) || isUndefined(id)">-</span>
    <VChip
      v-else
      label
      size="small"
      :append-icon="COMMON_CONFIG.CHIP.ICON.LINK"
      @click.stop="onClick"
    >
      <AAnzuUserAvatar
        :user="cached ?? undefined"
        container-class="mr-1"
      />
      {{ text }}
      <VProgressCircular
        v-if="!loaded"
        :size="12"
        :width="2"
        indeterminate
        class="ml-1"
      />
    </VChip>
  </div>
</template>
