<script lang="ts" setup>
import type { Log } from '@anzusystems/common-admin'
import { ACopyText, ADatatableConfigButton, ADatetime } from '@anzusystems/common-admin'
import {
  ADatatablePagination,
  createDatatableColumnsConfig,
  DatatablePaginationKey,
  FilterConfigKey,
  FilterDataKey,
  useFilterHelpers,
  usePagination,
} from '@anzusystems/common-admin/labs'
import { useLogListActions } from '@/domains/common/log/composables/logActions'
import type { LogSystemType } from '@/domains/common/log/valueObject/LogSystem'

type DatatableItem = Log

const props = defineProps<{
  system: string
}>()

const emit = defineEmits<{
  (e: 'countChange', data: string): void
}>()

const router = useRouter()

const filterConfig = inject(FilterConfigKey)
const filterData = inject(FilterDataKey)
if (isUndefined(filterConfig) || isUndefined(filterData)) {
  throw new Error('Incorrect provide/inject config.')
}

const { resetFilter: resetFilterHelper, submitFilter: submitFilterHelper } = useFilterHelpers(filterData, filterConfig)
const { fetchList, listItems, datatableHiddenColumns } = useLogListActions()

const { pagination } = usePagination('id')
provide(DatatablePaginationKey, pagination)

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id) {
    if (!filterData.type) return
    router.push({
      name: '/(common)/logs/[system]/[type]/[id]',
      params: { id: String(item.id), system: item.context.appSystem, type: filterData.type as string },
    })
  }
}

const { columnsVisible, columnsAll, columnsHidden } = createDatatableColumnsConfig(
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
  filterData.contextAppSystem = props.system as LogSystemType
  await fetchList(props.system, pagination, filterData, filterConfig)
  emit('countChange', calculateCount())
}

const resetFilter = () => {
  resetFilterHelper(pagination, getList)
}

const submitFilter = () => {
  submitFilterHelper(pagination, getList)
}

const calculateCount = () => {
  if (!isNull(pagination.value.hasNextPage)) {
    const max =
      pagination.value.page * pagination.value.rowsPerPage -
      pagination.value.rowsPerPage +
      pagination.value.currentViewCount
    return pagination.value.hasNextPage ? max + 1 + '+' : max + ''
  }
  return pagination.value.totalCount + ''
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
                name: '/(common)/logs/[system]/[type]/[id]',
                params: { id: item.id, system: system, type: filterData.type as string },
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
