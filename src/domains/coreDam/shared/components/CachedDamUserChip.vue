<script lang="ts" setup>
import {
  AAnzuUserAvatar,
  COMMON_CONFIG,
  isNull,
  isUndefined,
  useCachedItem,
  useDamCachedUsers,
} from '@anzusystems/common-admin'
import type { IntegerId } from '@anzusystems/common-admin'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{
    id: null | undefined | IntegerId
  }>(),
  {}
)

const { t } = useI18n()
const router = useRouter()

const { getCachedUser } = useDamCachedUsers()

// `useCachedItem` settles on an item the fetch could not resolve too; waiting for `_loaded` alone left
// the chip spinning for good on a user who is not there or may not be read.
const { cached, loaded, unresolved } = useCachedItem(() => getCachedUser(props.id))

const text = computed(() => {
  if (cached.value) {
    return cached.value.person.fullName.length ? cached.value.person.fullName : cached.value.email.split('@')[0]
  }
  return ''
})

const onClick = () => {
  if (!props.id) return
  router.push({ name: '/(coreDam)/users/[id]', params: { id: String(props.id) } })
}
</script>

<template>
  <div class="d-inline-flex">
    <span v-if="isNull(id) || isUndefined(id)">-</span>
    <!-- No avatar, link or click: there is no user to show or open, only the id the record names. -->
    <VChip
      v-else-if="unresolved"
      size="small"
    >
      #{{ id }}
      <VTooltip
        activator="parent"
        location="bottom"
      >
        {{ t('common.model.tracking.userUnavailable') }}
      </VTooltip>
    </VChip>
    <VChip
      v-else
      class="pl-1"
      size="small"
      :append-icon="COMMON_CONFIG.CHIP.ICON.LINK"
      @click.stop="onClick"
    >
      <AAnzuUserAvatar
        v-if="loaded"
        :user="cached ?? undefined"
        container-class="mr-1"
        :size="20"
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
