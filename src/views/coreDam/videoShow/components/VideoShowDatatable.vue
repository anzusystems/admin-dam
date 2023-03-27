<script lang="ts" setup>
import { onMounted } from 'vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/videoShowApi'
import {
  ADatatableConfigButton,
  ADatatableOrdering,
  ADatatablePagination,
  ADatetime,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  createDatatableColumnsConfig,
  DatatableOrderingOption,
  useAcl,
  useFilterHelpers,
} from '@anzusystems/common-admin'
import { ACL, type AclValue } from '@/types/Permission'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { useVideoShowListActions } from '@/views/coreDam/videoShow/composables/videoShowActions'
import VideoShowFilter from '@/views/coreDam/videoShow/components/VideoShowFilter.vue'
import { useVideoShowListFilter } from '@/model/coreDam/filter/VideoShowFilter'
import type { VideoShow } from '@/types/coreDam/VideoShow'

const router = useRouter()
const filter = useVideoShowListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems, datatableHiddenColumns } = useVideoShowListActions()
const getList = () => {
  fetchList(pagination, filter)
}

const { can } = useAcl<AclValue>()

const onRowClick = (event: unknown, { item }: { item: { raw: VideoShow } }) => {
  if (item.raw.id && can(ACL.DAM_VIDEO_SHOW_VIEW)) {
    router.push({ name: ROUTE.DAM.VIDEO_SHOW.DETAIL, params: { id: item.raw.id } })
  }
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
  [{ key: 'texts.title' }, { key: 'createdAt' }, { key: 'modifiedAt' }],
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
    <VideoShowFilter
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
              :route-name="ROUTE.DAM.VIDEO_SHOW.DETAIL"
            />
            <ATableEditButton
              :record-id="item.raw.id"
              :route-name="ROUTE.DAM.VIDEO_SHOW.EDIT"
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
