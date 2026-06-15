<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  ADatatableConfigButton,
  ADatetime,
  ATableCopyIdButton,
  ATableDetailButton,
  type DocId,
} from '@anzusystems/common-admin'
import {
  ADatatableOrdering,
  ADatatablePagination,
  createDatatableColumnsConfig,
  DatatablePaginationKey,
  FilterConfigKey,
  FilterDataKey,
  useFilterHelpers,
  usePagination,
} from '@anzusystems/common-admin/labs'
import { useDebounceFn } from '@vueuse/core'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/ttsNarrationRequest/api/ttsNarrationRequestApi'
import { isCancellableRequest, useTtsNarrationRequestListActions } from '@/domains/coreDam/ttsNarrationRequest/composables/ttsNarrationRequestActions'
import { useTtsNarrationRequestListFilter } from '@/domains/coreDam/ttsNarrationRequest/filter/TtsNarrationRequestFilter'
import TtsNarrationRequestFilter from '@/domains/coreDam/ttsNarrationRequest/components/TtsNarrationRequestFilter.vue'
import TtsRequestStatusChip from '@/domains/coreDam/ttsNarrationRequest/components/TtsRequestStatusChip.vue'
import TtsRequestModeChip from '@/domains/coreDam/ttsNarrationRequest/components/TtsRequestModeChip.vue'
import TtsCancelRequestDialog from '@/domains/coreDam/ttsNarrationRequest/components/TtsCancelRequestDialog.vue'
import type { TtsNarrationRequest } from '@/domains/coreDam/ttsNarrationRequest/types/TtsNarrationRequest'
import { ACL, useAuth } from '@/domains/system/auth/auth'

type DatatableItem = TtsNarrationRequest

const router = useRouter()
const { t } = useI18n()
const { can } = useAuth()

const { filterData, filterConfig } = useTtsNarrationRequestListFilter()
provide(FilterConfigKey, filterConfig)
provide(FilterDataKey, filterData)

const { fetchList, listItems, datatableHiddenColumns } = useTtsNarrationRequestListActions()
const { resetFilter, submitFilter, loadStoredFilters } = useFilterHelpers(filterData, filterConfig)

const { pagination } = usePagination(null)
provide(DatatablePaginationKey, pagination)

const cancelDialog = ref(false)
const cancelTargetRequestId = ref<DocId | null>(null)

const onRowClick = (_event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id && can(ACL.DAM_TTS_NARRATION_REQUEST_READ)) {
    router.push({ name: '/(coreDam)/tts-narration-requests/[id]', params: { id: item.id } })
  }
}

const openCancel = (requestId: DocId) => {
  cancelTargetRequestId.value = requestId
  cancelDialog.value = true
}

const { columnsVisible, columnsAll, columnsHidden } = createDatatableColumnsConfig(
  [
    { key: 'id', title: t('coreDam.ttsNarrationRequest.model.id') },
    { key: 'status', title: t('coreDam.ttsNarrationRequest.model.status') },
    { key: 'voiceFamilySlug', title: t('coreDam.ttsNarrationRequest.model.voiceFamilySlug') },
    { key: 'mode', title: t('coreDam.ttsNarrationRequest.model.mode') },
    { key: 'title', title: t('coreDam.ttsNarrationRequest.model.title') },
    { key: 'startedAt', title: t('coreDam.ttsNarrationRequest.model.startedAt') },
    { key: 'createdAt', title: t('common.model.tracking.created') },
  ],
  datatableHiddenColumns,
  SYSTEM_CORE_DAM,
  ENTITY
)

const getList = useDebounceFn(() => {
  fetchList(pagination, filterData, filterConfig)
})

const sortByChange = () => {
  submitFilter(pagination, getList)
}

const submitFilterAction = () => {
  submitFilter(pagination, getList)
}

const resetFilterAction = () => {
  resetFilter(pagination, getList)
}

const onCancelSuccess = () => {
  getList()
}

onMounted(() => {
  loadStoredFilters(pagination, getList)
})

defineExpose({
  refresh: getList,
})
</script>

<template>
  <div>
    <TtsNarrationRequestFilter
      @submit="submitFilterAction"
      @reset="resetFilterAction"
    />
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
      <template #item.status="{ item }: { item: DatatableItem }">
        <TtsRequestStatusChip :status="item.status" />
      </template>
      <template #item.mode="{ item }: { item: DatatableItem }">
        <TtsRequestModeChip :mode="item.mode" />
      </template>
      <template #item.startedAt="{ item }: { item: DatatableItem }">
        <ADatetime :date-time="item.startedAt" />
      </template>
      <template #item.createdAt="{ item }: { item: DatatableItem }">
        <ADatetime :date-time="item.createdAt" />
      </template>
      <template #item.actions="{ item }: { item: DatatableItem }">
        <div class="d-flex justify-end">
          <ATableCopyIdButton :id="item.id" />
          <Acl :permission="ACL.DAM_TTS_NARRATION_REQUEST_READ">
            <ATableDetailButton
              :record-id="item.id"
              :route-name="'/(coreDam)/tts-narration-requests/[id]'"
            />
          </Acl>
          <Acl :permission="ACL.DAM_TTS_NARRATION_REQUEST_CANCEL">
            <VBtn
              v-if="isCancellableRequest(item)"
              class="ml-1"
              icon
              :active="false"
              size="x-small"
              variant="text"
              data-cy="table-cancel-request"
              @click.stop="openCancel(item.id)"
            >
              <VIcon icon="mdi-cancel" />
              <VTooltip
                activator="parent"
                location="bottom"
              >
                {{ t('coreDam.ttsNarrationRequest.button.cancelRequest') }}
              </VTooltip>
            </VBtn>
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

    <TtsCancelRequestDialog
      v-model="cancelDialog"
      :request-id="cancelTargetRequestId"
      @on-success="onCancelSuccess"
    />
  </div>
</template>
