<script lang="ts" setup>
import { onMounted } from 'vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/podcastApi'
import {
  ADatatableConfigButton,
  ADatatableOrdering,
  ADatatablePagination,
  ADatetime,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  createDatatableColumnsConfig,
  type DatatableOrderingOption,
  useFilterHelpers,
} from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { usePodcastListActions } from '@/views/coreDam/podcast/composables/podcastActions'
import PodcastFilter from '@/views/coreDam/podcast/components/PodcastFilter.vue'
import { usePodcastListFilter } from '@/model/coreDam/filter/PodcastFilter'
import PodcastLastImportStatusChip from '@/views/coreDam/podcast/components/PodcastLastImportStatusChip.vue'
import type { Podcast } from '@/types/coreDam/Podcast'

const router = useRouter()
const filter = usePodcastListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems, datatableHiddenColumns } = usePodcastListActions()
const getList = () => {
  fetchList(pagination, filter)
}

const onRowClick = (event: unknown, { item }: { item: { raw: Podcast } }) => {
  if (item.raw.id) {
    router.push({ name: ROUTE.DAM.PODCAST.DETAIL, params: { id: item.raw.id } })
  }
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
  [{ key: 'texts.title' }, { key: 'attributes.lastImportStatus' }, { key: 'createdAt' }, { key: 'modifiedAt' }],
  datatableHiddenColumns,
  SYSTEM_CORE_DAM,
  ENTITY
)

const sortByChange = (option: DatatableOrderingOption) => {
  updateSortBy(option.sortBy)
  getList()
}

onMounted(() => {
  getList()
})

defineExpose({
  refresh: getList,
})
</script>

<template>
  <div>
    <PodcastFilter
      @submit-filter="submitFilter(filter, pagination, getList)"
      @reset-filter="resetFilter(filter, pagination, getList)"
    />
    <div>
      <div class="d-flex align-center">
        <VSpacer />
        <ADatatableOrdering @sort-by-change="sortByChange" />
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
        <template #attributes.lastImportStatus="{ item }">
          <PodcastLastImportStatusChip :status="item.raw.attributes.lastImportStatus" />
        </template>
        <template #item.createdAt="{ item }">
          <ADatetime :date-time="item.raw.createdAt" />
        </template>
        <template #item.modifiedAt="{ item }">
          <ADatetime :date-time="item.raw.modifiedAt" />
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex justify-end">
            <ATableCopyIdButton :id="item.raw.id" />
            <ATableDetailButton
              :record-id="item.raw.id"
              :route-name="ROUTE.DAM.PODCAST.DETAIL"
            />
            <ATableEditButton
              :record-id="item.raw.id"
              :route-name="ROUTE.DAM.PODCAST.EDIT"
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
