<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ADatatableConfigButton,
  ADatatableOrdering,
  ADatatablePagination,
  ADatetime,
  ATableCopyIdButton,
  createDatatableColumnsConfig,
  type DatatableOrderingOption,
  type DocId,
  useFilterHelpers,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/ttsAudioApi'
import { isCancellableRequest, useTtsAudioListActions } from '@/views/coreDam/ttsAudio/composables/ttsAudioActions'
import { useTtsAudioListFilter } from '@/model/coreDam/filter/TtsAudioFilter'
import TtsAudioFilter from '@/views/coreDam/ttsAudio/components/TtsAudioFilter.vue'
import TtsRequestStatusChip from '@/views/coreDam/ttsAudio/components/TtsRequestStatusChip.vue'
import TtsCancelRequestDialog from '@/views/coreDam/ttsAudio/dialogs/TtsCancelRequestDialog.vue'
import type { TtsNarrationRequest } from '@/types/coreDam/TtsAudio'
import { ACL } from '@/composables/auth/auth'

type DatatableItem = TtsNarrationRequest

const { t } = useI18n()
const filter = useTtsAudioListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()
const { fetchList, listItems, datatableHiddenColumns } = useTtsAudioListActions()

const cancelDialog = ref(false)
const cancelTargetRequestId = ref<DocId | null>(null)

const openCancel = (requestId: DocId) => {
  cancelTargetRequestId.value = requestId
  cancelDialog.value = true
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
  [
    { key: 'id', title: t('common.model.id') },
    { key: 'status', title: t('coreDam.ttsAudio.model.status') },
    { key: 'voiceFamilySlug', title: t('coreDam.ttsAudio.model.voiceFamilySlug') },
    { key: 'mode', title: t('coreDam.ttsAudio.model.mode') },
    { key: 'title', title: t('coreDam.ttsAudio.model.title') },
    { key: 'startedAt', title: t('coreDam.ttsAudio.model.startedAt') },
    { key: 'finishedAt', title: t('coreDam.ttsAudio.model.finishedAt') },
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
    <TtsAudioFilter
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
    >
      <template #item.status="{ item }: { item: DatatableItem }">
        <TtsRequestStatusChip :status="item.status" />
      </template>
      <template #item.startedAt="{ item }: { item: DatatableItem }">
        <ADatetime :date-time="item.startedAt" />
      </template>
      <template #item.finishedAt="{ item }: { item: DatatableItem }">
        <ADatetime :date-time="item.finishedAt" />
      </template>
      <template #item.createdAt="{ item }: { item: DatatableItem }">
        <ADatetime :date-time="item.createdAt" />
      </template>
      <template #item.actions="{ item }: { item: DatatableItem }">
        <div class="d-flex justify-end">
          <ATableCopyIdButton :id="item.id" />
          <Acl :permission="ACL.DAM_TTS_AUDIO_CANCEL_REQUEST">
            <VBtn
              v-if="isCancellableRequest(item)"
              variant="text"
              icon
              size="small"
              class="mx-1"
              @click.stop="openCancel(item.id)"
            >
              <VIcon icon="mdi-cancel" />
              <VTooltip
                activator="parent"
                location="bottom"
              >
                {{ t('coreDam.ttsAudio.button.cancelRequest') }}
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
