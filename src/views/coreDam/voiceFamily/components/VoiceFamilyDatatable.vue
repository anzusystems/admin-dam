<script lang="ts" setup>
import { onMounted } from 'vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/voiceFamilyApi'
import {
  ABooleanValue,
  ADatatableConfigButton,
  ADatatableOrdering,
  ADatatablePagination,
  ADatetime,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  createDatatableColumnsConfig,
  type DatatableOrderingOption,
  type DatatableOrderingOptions,
  useFilterHelpers,
} from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { useVoiceFamilyListActions } from '@/views/coreDam/voiceFamily/composables/voiceFamilyActions'
import VoiceFamilyFilter from '@/views/coreDam/voiceFamily/components/VoiceFamilyFilter.vue'
import { useVoiceFamilyListFilter } from '@/model/coreDam/filter/VoiceFamilyFilter'
import type { VoiceFamily } from '@/types/coreDam/VoiceFamily'
import { ACL, useAuth } from '@/composables/auth/auth'

type DatatableItem = VoiceFamily

const router = useRouter()
const filter = useVoiceFamilyListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems, datatableHiddenColumns } = useVoiceFamilyListActions()
const { can } = useAuth()

const getList = () => {
  fetchList(pagination, filter)
}

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id && can(ACL.DAM_TTS_VOICE_FAMILY_READ)) {
    router.push({ name: ROUTE.DAM.VOICE_FAMILY.DETAIL, params: { id: item.id } })
  }
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
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
pagination.sortBy = 'createdAt'

const customSort: DatatableOrderingOptions = [
  { id: 1, titleT: 'common.system.datatable.ordering.mostRecent', sortBy: { key: 'createdAt', order: 'desc' } },
  { id: 2, titleT: 'common.system.datatable.ordering.oldest', sortBy: { key: 'createdAt', order: 'asc' } },
]

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
    <VoiceFamilyFilter
      @submit-filter="submitFilter(filter, pagination, getList)"
      @reset-filter="resetFilter(filter, pagination, getList)"
    />
    <div>
      <div class="d-flex align-center">
        <VSpacer />
        <ADatatableOrdering
          :custom-options="customSort"
          @sort-by-change="sortByChange"
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
                :route-name="ROUTE.DAM.VOICE_FAMILY.DETAIL"
              />
            </Acl>
            <Acl :permission="ACL.DAM_TTS_VOICE_FAMILY_UPDATE">
              <ATableEditButton
                :record-id="item.id"
                :route-name="ROUTE.DAM.VOICE_FAMILY.EDIT"
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
