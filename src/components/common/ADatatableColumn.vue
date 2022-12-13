<script lang="ts" setup>
import { useFriendlyDateTime } from '@/composables/system/formatDatetime'
import { getValueByPath } from '@/utils/object'
import { computed } from 'vue'
import type { ColumnConfig } from '@/composables/system/tableColumns'
import { DATETIME_AUTO_FORMAT_COLUMN_NAMES } from '@/composables/system/tableColumns'
import ABooleanValue from '@/components/common/ABooleanValue.vue'
import { normalizeForSlotName } from '@/utils/string'

const props = withDefaults(
  defineProps<{
    rowData: any
    column: ColumnConfig
  }>(),
  {}
)

const value = computed(() => {
  return getValueByPath(props.rowData, props.column.name)
})

const formatDatetime = useFriendlyDateTime()

const formattedValue = computed(() => {
  if (props.column.type === 'datetime' || DATETIME_AUTO_FORMAT_COLUMN_NAMES.includes(props.column.name))
    return formatDatetime(value.value)
  return value.value
})

const isBoolean = computed(() => typeof value.value === 'boolean')
</script>

<template>
  <td>
    <slot :name="normalizeForSlotName(column.name)" :data="value">
      <ABooleanValue v-if="isBoolean" chip :value="value"></ABooleanValue>
      <span v-else>{{ formattedValue }}</span>
    </slot>
  </td>
</template>
