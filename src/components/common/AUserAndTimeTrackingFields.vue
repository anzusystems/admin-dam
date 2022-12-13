<script lang="ts" setup>
import type { UserAndTimeTrackingFields } from '@/types/UserAndTimeTrackingFields'
import { computed } from 'vue'
import ARow from '@/components/common/ARow.vue'
import { useI18n } from 'vue-i18n'
import { useFriendlyDateTime } from '@/composables/system/formatDatetime'

const props = withDefaults(
  defineProps<{
    data: UserAndTimeTrackingFields | any
    hideCreatedAt?: boolean
    hideModifiedAt?: boolean
    hideCreatedBy?: boolean
    hideModifiedBy?: boolean
  }>(),
  {
    hideCreatedAt: false,
    hideModifiedAt: false,
    hideCreatedBy: false,
    hideModifiedBy: false,
  }
)

const formatDatetime = useFriendlyDateTime()

const createdAt = computed(() => {
  return formatDatetime(props.data.createdAt)
})
const modifiedAt = computed(() => {
  return formatDatetime(props.data.modifiedAt)
})

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ARow :title="t('common.tracking.created')">
    {{ createdAt }}
  </ARow>
  <ARow :title="t('common.tracking.modified')">
    {{ modifiedAt }}
  </ARow>
</template>
