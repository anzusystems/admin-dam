<script lang="ts" setup>
import { computed, inject } from 'vue'
import type { UseTableColumns } from '@/composables/system/tableColumns'
import ADatatableColumn from '@/components/common/ADatatableColumn.vue'
import { SubjectScopeSymbol, SystemScopeSymbol } from '@/components/injectionKeys'
import { useI18n } from 'vue-i18n'
import { isNotEmpty as isArrayNotEmpty } from '@/utils/array'
import { normalizeForSlotName } from '@/utils/string'

const props = withDefaults(
  defineProps<{
    data: any
    columns: UseTableColumns
    actions?: boolean
  }>(),
  {
    actions: true,
  }
)

const availableColumns = computed(() => {
  return props.columns.availableColumns.value
})

const emit = defineEmits<{
  (e: 'rowClick', data: any): void
}>()

const onRowClick = (data: any) => {
  emit('rowClick', data)
}

const system = inject<string>(SystemScopeSymbol)
const subject = inject<string>(SubjectScopeSymbol)

const isNotEmpty = computed(() => {
  return isArrayNotEmpty(props.data)
})

const totalColumnsCount = computed(() => {
  let count = props.columns.availableColumns.value.length
  if (props.actions) ++count
  return count
})

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <VTable class="anzu-data-table">
    <thead>
      <tr>
        <th class="text-left" v-for="column in availableColumns" :key="column.name">
          {{ column.getLabel(system, subject) }}
        </th>
        <th v-if="actions"></th>
      </tr>
    </thead>
    <tbody>
      <template v-if="isNotEmpty">
        <tr v-for="(rowData, index) in props.data" :key="index" @click="onRowClick(rowData)">
          <ADatatableColumn v-for="column in availableColumns" :key="column.name" :row-data="rowData" :column="column">
            <template v-slot:[normalizeForSlotName(column.name)]="{ data }">
              <slot :name="normalizeForSlotName(column.name)" :data="data" :row-data="rowData"></slot>
            </template>
          </ADatatableColumn>
          <td v-if="actions">
            <div class="d-flex justify-end">
              <slot name="actions" :data="rowData"></slot>
            </div>
          </td>
        </tr>
      </template>
      <template v-else>
        <tr>
          <td :colspan="totalColumnsCount" class="text-center text-disabled">{{ t('common.datatable.noDataText') }}</td>
        </tr>
      </template>
    </tbody>
  </VTable>
</template>
