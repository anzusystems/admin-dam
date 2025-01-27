<script lang="ts" setup>
import { onMounted } from 'vue'
import {
  ADatatableConfigButton,
  ADatatablePagination,
  ADatetime,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  createDatatableColumnsConfig,
  useFilterHelpers,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/AuthorCleanPhraseApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import AuthorCleanPhraseFilter from '@/views/coreDam/authorCleanPhrase/components/AuthorCleanPhraseFilter.vue'
import type { AuthorCleanPhrase } from '@/types/coreDam/AuthorCleanPhrase'
import { ACL } from '@/composables/auth/auth'
import { useAuthorCleanPhraseListFilter } from '@/model/coreDam/filter/AuthorCleanPhraseFilter'
import { useAuthorCleanPhraseListActions } from '@/views/coreDam/authorCleanPhrase/composables/authorCleanPhraseActions'
import AuthorCleanPhraseTypeStatusChip from '@/views/coreDam/authorCleanPhrase/components/AuthorCleanPhraseTypeStatusChip.vue'
import AuthorCleanPhraseModeStatusChip from '@/views/coreDam/authorCleanPhrase/components/AuthorCleanPhraseModeStatusChip.vue'

type DatatableItem = AuthorCleanPhrase

const router = useRouter()
const filter = useAuthorCleanPhraseListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems, datatableHiddenColumns } = useAuthorCleanPhraseListActions()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  router.push({ name: ROUTE.DAM.AUTHOR_CLEAN_PHRASE.DETAIL, params: { id: item.id } })
}

const getList = () => {
  fetchList(pagination, filter)
}

const { columnsVisible, columnsAll, columnsHidden, pagination } = createDatatableColumnsConfig(
  [{ key: 'id' }, { key: 'phrase' }, { key: 'mode' }, { key: 'type' }, { key: 'createdAt' }, { key: 'modifiedAt' }],
  datatableHiddenColumns,
  SYSTEM_CORE_DAM,
  ENTITY
)

onMounted(() => {
  fetchList(pagination, filter)
})

defineExpose({
  refresh: getList,
})
</script>

<template>
  <div>
    <AuthorCleanPhraseFilter
      @submit-filter="submitFilter(filter, pagination, getList)"
      @reset-filter="resetFilter(filter, pagination, getList)"
    />
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
        <template #item.phrase="{ item }: { item: DatatableItem }">
          {{ item.phrase }}
        </template>
        <template #item.mode="{ item }: { item: DatatableItem }">
          <AuthorCleanPhraseModeStatusChip :status="item.mode" />
        </template>
        <template #item.type="{ item }: { item: DatatableItem }">
          <AuthorCleanPhraseTypeStatusChip :status="item.type" />
        </template>
        <template #item.createdAt="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.createdAt" />
        </template>
        <template #item.modifiedAt="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.modifiedAt" />
        </template>
        <template #item.actions="{ item }: { item: DatatableItem }">
          <div class="d-flex justify-end">
            <ATableCopyIdButton :id="item.id" />
            <Acl :permission="ACL.DAM_AUTHOR_CLEAN_PHRASE_READ">
              <ATableDetailButton
                :route-params="{ id: item.id }"
                :route-name="ROUTE.DAM.AUTHOR_CLEAN_PHRASE.DETAIL"
              />
            </Acl>
            <Acl :permission="ACL.DAM_AUTHOR_CLEAN_PHRASE_UPDATE">
              <ATableEditButton
                :route-params="{ id: item.id }"
                :route-name="ROUTE.DAM.AUTHOR_CLEAN_PHRASE.EDIT"
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
