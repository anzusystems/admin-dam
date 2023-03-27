<script lang="ts" setup>
import type { Log } from '@anzusystems/common-admin'
import {
  ACopyText,
  ADatatableConfigButton,
  ADatatablePagination,
  createDatatableColumnsConfig,
  type DatatableOrderingOption,
  isNull,
  useFilterHelpers,
} from '@anzusystems/common-admin'
import { useLogFilter } from '@/model/common/filter/LogFilter'
import { ROUTE } from '@/router/routes'
import { useLogListActions } from '@/views/common/log/composables/logActions'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

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

const onRowClick = (event: unknown, { item }: { item: { raw: Log } }) => {
  if (item.raw.id) {
    router.push({
      name: ROUTE.COMMON.LOG.DETAIL,
      params: { id: item.raw.id, system: item.raw.context.appSystem, type: filter.type.model },
    })
  }
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
  [
    { key: 'id' },
    { key: 'datetime' },
    { key: 'levelName' },
    { key: 'message' },
    { key: 'context.appVersion' },
    { key: 'context.contextId' },
    { key: 'context.userId' },
    { key: 'context.ip' },
  ],
  datatableHiddenColumns,
  'common',
  'log'
)
pagination.sortBy = 'id'

const getList = async () => {
  // filter.contextAppSystem.model = props.system
  // filter.contextAppSystem.touched = true
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

const sortByChange = (option: DatatableOrderingOption) => {
  updateSortBy(option.sortBy)
  getList()
}

onMounted(() => {
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
        <template #item.datetime="{ item }">
          <ADatetime :date-time="item.raw.datetime" />
        </template>
        <template #item.levelName="{ item }">
          <!--          <LogLevelChip :level="item.raw.levelName" />-->
        </template>
        <template #item.message="{ item }">
          <div class="line-clamp-2">
            {{ item.raw.message }}
          </div>
        </template>
        <template #item.context.contextId="{ item }">
          <ACopyText :value="item.raw.context.contextId" />
        </template>
        <template #item.context.userId="{ item }">
          <ACopyText
            v-if="!isNull(item.raw.context.userId)"
            :value="item.raw.context.userId"
          />
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex justify-end">
            <VBtn
              :to="{
                name: ROUTE.COMMON.LOG.DETAIL,
                params: { id: item.raw.id, system: system, type: filter.type.model },
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
