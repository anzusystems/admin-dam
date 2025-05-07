<script lang="ts" setup>
import type { Log } from '@anzusystems/common-admin'
import {
  ACopyText,
  ADatatableConfigButton,
  ADatatablePagination,
  ADatetime,
  createDatatableColumnsConfig,
  isNull,
  useFilterHelpers,
} from '@anzusystems/common-admin'
import { useLogFilter } from '@/model/common/filter/LogFilter'
import { ROUTE } from '@/router/routes'
import { useLogListActions } from '@/views/common/log/composables/logActions'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { LogSystemType } from '@/model/common/valueObject/LogSystem'

type DatatableItem = Log

const props = withDefaults(
  defineProps<{
    system: string
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'countChange', data: string): void
}>()

const router = useRouter()

const filter = useLogFilter()
const { resetFilter: resetFilterHelper, submitFilter: submitFilterHelper } = useFilterHelpers()
const { fetchList, listItems, datatableHiddenColumns } = useLogListActions()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id) {
    router.push({
      name: ROUTE.COMMON.LOG.DETAIL,
      params: { id: item.id, system: item.context.appSystem, type: filter.type.model },
    })
  }
}

const { columnsVisible, columnsAll, columnsHidden, pagination } = createDatatableColumnsConfig(
  [
    { key: 'id' },
    { key: 'datetime' },
    { key: 'levelName' },
    { key: 'message' },
    { key: 'context.appVersion' },
    { key: 'context.contextId' },
    { key: 'context.httpStatus' },
    { key: 'context.resourceName' },
    { key: 'context.resourceIds' },
    { key: 'context.userId' },
    { key: 'context.ip' },
  ],
  datatableHiddenColumns,
  'common',
  'log'
)

const getList = async () => {
  filter.contextAppSystem.model = props.system as LogSystemType
  await fetchList(props.system, pagination, filter)
  emit('countChange', calculateCount())
}

const resetFilter = () => {
  resetFilterHelper(filter, pagination, getList)
}

const submitFilter = () => {
  submitFilterHelper(filter, pagination, getList)
}

const calculateCount = () => {
  if (!isNull(pagination.hasNextPage)) {
    const max = pagination.page * pagination.rowsPerPage - pagination.rowsPerPage + pagination.currentViewCount
    return pagination.hasNextPage ? max + 1 + '+' : max + ''
  }
  return pagination.totalCount + ''
}

onMounted(() => {
  pagination.sortBy = 'id'
  getList()
})

defineExpose({
  refresh: getList,
  resetFilter,
  submitFilter,
})
</script>

<template>
  <div>
    <div>
      <div class="d-flex align-center">
        <VSpacer />
        <!--        <ADatatableOrdering @sort-by-change="sortByChange" />-->
        <ADatatableConfigButton
          v-model:columns-hidden="columnsHidden"
          :columns-all="columnsAll"
        />
      </div>
      <VDataTableServer
        class="a-datatable"
        :headers="columnsVisible"
        :items="listItems"
        :items-length="listItems.length"
        item-value="id"
        @click:row="onRowClick"
      >
        <template #item.datetime="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.datetime" />
        </template>
        <template #item.levelName="{ item }: { item: DatatableItem }">
          {{ item.levelName }}
          <!--          <LogLevelChip :level="item.levelName" />-->
        </template>
        <template #item.message="{ item }: { item: DatatableItem }">
          <div class="line-clamp-2">
            {{ item.message }}
          </div>
        </template>
        <template #item.context.resourceIds="{ item }: { item: DatatableItem }">
          {{ item.context.resourceIds.join(', ') }}
        </template>
        <template #item.context.contextId="{ item }: { item: DatatableItem }">
          <ACopyText :value="item.context.contextId" />
        </template>
        <template #item.context.userId="{ item }: { item: DatatableItem }">
          <ACopyText
            v-if="!isNull(item.context.userId)"
            :value="item.context.userId"
          />
        </template>
        <template #item.actions="{ item }: { item: DatatableItem }">
          <div class="d-flex justify-end">
            <VBtn
              :to="{
                name: ROUTE.COMMON.LOG.DETAIL,
                params: { id: item.id, system: system, type: filter.type.model },
              }"
              class="ml-1"
              icon="mdi-information-outline"
              size="x-small"
              variant="text"
            />
          </div>
        </template>
        <template #bottom>
          <ADatatablePagination
            v-model="pagination"
            @change="getList"
          />
        </template>
      </VDataTableServer>
    </div>
  </div>
</template>
