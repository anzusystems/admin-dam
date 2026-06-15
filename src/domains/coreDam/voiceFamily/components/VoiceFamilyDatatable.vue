<script lang="ts" setup>
import { onMounted } from 'vue'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/voiceFamily/api/voiceFamilyApi'
import {
  ABooleanValue,
  ADatatableConfigButton,
  ADatetime,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  type DatatableOrderingOption,
  type DatatableOrderingOptions,
  SortOrder,
} from '@anzusystems/common-admin'
import {
  ADatatableOrdering,
  ADatatablePagination,
  createDatatableColumnsConfig,
  DatatablePaginationKey,
  FilterConfigKey,
  FilterDataKey,
  type Pagination,
  useFilterHelpers,
  usePagination,
} from '@anzusystems/common-admin/labs'
import type { Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useVoiceFamilyListActions } from '@/domains/coreDam/voiceFamily/composables/voiceFamilyActions'
import VoiceFamilyFilter from '@/domains/coreDam/voiceFamily/components/VoiceFamilyFilter.vue'
import { useVoiceFamilyListFilter } from '@/domains/coreDam/voiceFamily/filter/VoiceFamilyFilter'
import type { VoiceFamily } from '@/domains/coreDam/voiceFamily/types/VoiceFamily'
import { ACL, useAuth } from '@/domains/system/auth/auth'

type DatatableItem = VoiceFamily

const router = useRouter()

const { filterData, filterConfig } = useVoiceFamilyListFilter()
provide(FilterConfigKey, filterConfig)
provide(FilterDataKey, filterData)

const { fetchList, listItems, datatableHiddenColumns } = useVoiceFamilyListActions()
const { resetFilter, submitFilter } = useFilterHelpers(filterData, filterConfig)
const { can } = useAuth()

const { pagination } = usePagination('createdAt')
provide(DatatablePaginationKey, pagination)

const getList = () => {
  fetchList(pagination, filterData, filterConfig)
}

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id && can(ACL.DAM_TTS_VOICE_FAMILY_READ)) {
    router.push({ name: '/(coreDam)/voice-families/[id]', params: { id: item.id } })
  }
}

const { columnsVisible, columnsAll, columnsHidden } = createDatatableColumnsConfig(
  [
    { key: 'id' },
    { key: 'slug' },
    { key: 'displayName' },
    { key: 'language' },
    { key: 'active' },
    { key: 'preferredProvider' },
    { key: 'modifiedAt' },
  ],
  datatableHiddenColumns,
  SYSTEM_CORE_DAM,
  ENTITY
)

const customSort: DatatableOrderingOptions = [
  { id: 1, titleT: 'common.system.datatable.ordering.mostRecent', sortBy: { key: 'createdAt', order: SortOrder.Desc } },
  { id: 2, titleT: 'common.system.datatable.ordering.oldest', sortBy: { key: 'createdAt', order: SortOrder.Asc } },
]

const paginationUpdateCustomCb = (option: DatatableOrderingOption, paginationRef: Ref<Pagination>) => {
  paginationRef.value.sortBy = option.sortBy ?? null
  submitFilter(pagination, getList)
}

const submitFilterAction = () => {
  submitFilter(pagination, getList)
}

const resetFilterAction = () => {
  resetFilter(pagination, getList)
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
    <VoiceFamilyFilter
      @submit="submitFilterAction"
      @reset="resetFilterAction"
    />
    <div>
      <div class="d-flex align-center">
        <VSpacer />
        <ADatatableOrdering
          :custom-options="customSort"
          :pagination-update-custom-cb="paginationUpdateCustomCb"
        />
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
        <template #item.active="{ item }: { item: DatatableItem }">
          <ABooleanValue
            chip
            :value="item.active"
          />
        </template>
        <template #item.modifiedAt="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.modifiedAt" />
        </template>
        <template #item.actions="{ item }: { item: DatatableItem }">
          <div class="d-flex justify-end">
            <ATableCopyIdButton :id="item.id" />
            <Acl :permission="ACL.DAM_TTS_VOICE_FAMILY_READ">
              <ATableDetailButton
                :record-id="item.id"
                :route-name="'/(coreDam)/voice-families/[id]'"
              />
            </Acl>
            <Acl :permission="ACL.DAM_TTS_VOICE_FAMILY_UPDATE">
              <ATableEditButton
                :record-id="item.id"
                :route-name="'/(coreDam)/voice-families/[id]/edit'"
              />
            </Acl>
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
