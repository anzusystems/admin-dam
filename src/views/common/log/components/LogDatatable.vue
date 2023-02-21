<script lang="ts" setup>
import ACopyText from '@/components/common/ACopyText.vue'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { useFilterHelpers } from '@/composables/filter/filterHelpers'
import { usePagination } from '@/composables/system/pagination'
import { useTableColumns } from '@/composables/system/tableColumns'
import { useLogFilter } from '@/model/common/filter/LogFilter'
import { ROUTE } from '@/router/routes'
import { ENTITY } from '@/services/api/common/logApi'
import type { Log } from '@/types/common/Log'
import { isNull } from '@/utils/common'
import LogLevelChip from '@/views/common/log/components/LogLevelChip.vue'
import { useLogListActions } from '@/views/common/log/composables/logActions'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ADatatablePagination from '@/components/common/ADatatablePagination.vue'
import ADatatable from '@/components/common/ADatatable.vue'
import type { LogSystem } from '@/model/common/valueObject/LogSystem'

const props = withDefaults(
  defineProps<{
    system: LogSystem
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'countChange', data: string): void
}>()

const router = useRouter()

const pagination = usePagination()
pagination.sortBy = 'id'
const filter = useLogFilter()
const { resetFilter: resetFilterHelper, submitFilter: submitFilterHelper } = useFilterHelpers()
const { fetchList, listItems } = useLogListActions()

const resetFilter = () => {
  resetFilterHelper(filter, pagination, getList)
}

const submitFilter = () => {
  submitFilterHelper(filter, pagination, getList)
}

const onRowClick = (row: Log) => {
  if (row.id) {
    router.push({
      name: ROUTE.COMMON.LOG.DETAIL,
      params: { id: row.id, system: row.context.appSystem, type: filter.type.model },
    })
  }
}

const calculateCount = () => {
  if (!isNull(pagination.hasNextPage)) {
    const max = pagination.page * pagination.rowsPerPage - pagination.rowsPerPage + pagination.currentViewCount
    return pagination.hasNextPage ? max + 1 + '+' : max + ''
  }
  return pagination.totalCount + ''
}

const getList = async () => {
  filter.contextAppSystem.model = props.system
  await fetchList(props.system, pagination, filter)
  emit('countChange', calculateCount())
}

onMounted(() => {
  getList()
})

const columns = useTableColumns([
  { name: 'datetime', type: 'datetime' },
  { name: 'levelName' },
  { name: 'message' },
  { name: 'context.appVersion' },
  { name: 'context.contextId' },
  { name: 'context.userId' },
  { name: 'context.ip' },
])

defineExpose({
  resetFilter,
  submitFilter,
})
</script>

<template>
  <div>
    <ASystemEntityScope system="common" :subject="ENTITY">
      <ADatatable :columns="columns" :data="listItems" @row-click="onRowClick">
        <template #levelName="{ data }">
          <LogLevelChip :level="data" />
        </template>
        <template #message="{ data }">
          <div class="line-clamp-2">{{ data }}</div>
        </template>
        <template #context-contextId="{ data }">
          <ACopyText v-if="!isNull(data)" :value="data" />
        </template>
        <template #context-userId="{ data }">
          <ACopyText v-if="!isNull(data)" :value="data" />
        </template>
      </ADatatable>
      <ADatatablePagination v-model="pagination" @change="getList" />
    </ASystemEntityScope>
  </div>
</template>
