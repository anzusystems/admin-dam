<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  ADatatableConfigButton,
  ADatatableOrdering,
  ADatatablePagination,
  ADatetime,
  ATableCopyIdButton,
  ATableDetailButton,
  createDatatableColumnsConfig,
  type DatatableOrderingOption,
  type DocId,
  useFilterHelpers,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/ttsNarrationRequestApi'
import { ROUTE } from '@/router/routes'
import { isCancellableRequest, useTtsNarrationRequestListActions } from '@/views/coreDam/ttsNarrationRequest/composables/ttsNarrationRequestActions'
import { useTtsNarrationRequestListFilter } from '@/model/coreDam/filter/TtsNarrationRequestFilter'
import TtsNarrationRequestFilter from '@/views/coreDam/ttsNarrationRequest/components/TtsNarrationRequestFilter.vue'
import TtsRequestStatusChip from '@/views/coreDam/ttsNarrationRequest/components/TtsRequestStatusChip.vue'
import TtsRequestModeChip from '@/views/coreDam/ttsNarrationRequest/components/TtsRequestModeChip.vue'
import TtsCancelRequestDialog from '@/views/coreDam/ttsNarrationRequest/dialogs/TtsCancelRequestDialog.vue'
import type { TtsNarrationRequest } from '@/types/coreDam/TtsNarrationRequest'
import { ACL, useAuth } from '@/composables/auth/auth'

type DatatableItem = TtsNarrationRequest

const router = useRouter()
const { t } = useI18n()
const { can } = useAuth()
const filter = useTtsNarrationRequestListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()
const { fetchList, listItems, datatableHiddenColumns } = useTtsNarrationRequestListActions()

const cancelDialog = ref(false)
const cancelTargetRequestId = ref<DocId | null>(null)

const onRowClick = (_event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id && can(ACL.DAM_TTS_NARRATION_REQUEST_READ)) {
    router.push({ name: ROUTE.DAM.TTS_NARRATION_REQUEST.DETAIL, params: { id: item.id } })
  }
}

const openCancel = (requestId: DocId) => {
  cancelTargetRequestId.value = requestId
  cancelDialog.value = true
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
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

const getList = () => {
  fetchList(pagination, filter)
}

const sortByChange = (option: DatatableOrderingOption) => {
  updateSortBy(option.sortBy)
  getList()
}

const onCancelSuccess = () => {
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
    <TtsNarrationRequestFilter
      @submit-filter="submitFilter(filter, pagination, getList)"
      @reset-filter="resetFilter(filter, pagination, getList)"
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
              :route-name="ROUTE.DAM.TTS_NARRATION_REQUEST.DETAIL"
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
