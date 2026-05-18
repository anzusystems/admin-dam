<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ADatatableConfigButton,
  ADatatableOrdering,
  ADatatablePagination,
  ADatetime,
  AJobStatusChip,
  ATableCopyIdButton,
  ATableDetailButton,
  createDatatableColumnsConfig,
  type DatatableOrderingOption,
  type IntegerId,
  useFilterHelpers,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/ttsAudioApi'
import { ROUTE } from '@/router/routes'
import { isCancellableJob, useTtsAudioListActions } from '@/views/coreDam/ttsAudio/composables/ttsAudioActions'
import { useTtsAudioListFilter } from '@/model/coreDam/filter/TtsAudioFilter'
import TtsAudioFilter from '@/views/coreDam/ttsAudio/components/TtsAudioFilter.vue'
import TtsCancelJobDialog from '@/views/coreDam/ttsAudio/dialogs/TtsCancelJobDialog.vue'
import type { JobAudioNarration } from '@/types/coreDam/TtsAudio'
import { ACL, useAuth } from '@/composables/auth/auth'

type DatatableItem = JobAudioNarration

const router = useRouter()
const { t } = useI18n()
const filter = useTtsAudioListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()
const { fetchList, listItems, datatableHiddenColumns } = useTtsAudioListActions()
const { can } = useAuth()

const cancelDialog = ref(false)
const cancelTargetJobId = ref<IntegerId | null>(null)

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id && can(ACL.DAM_JOB_READ)) {
    router.push({ name: ROUTE.DAM.JOB.DETAIL, params: { id: item.id } })
  }
}

const openCancel = (jobId: IntegerId) => {
  cancelTargetJobId.value = jobId
  cancelDialog.value = true
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
  [
    { key: 'id', title: t('common.job.model.id') },
    { key: 'status', title: t('common.job.model.status') },
    { key: 'voiceFamilySlug', title: t('coreDam.ttsAudio.model.voiceFamilySlug') },
    { key: 'mode', title: t('coreDam.ttsAudio.model.mode') },
    { key: 'title', title: t('coreDam.ttsAudio.model.title') },
    { key: 'startedAt', title: t('common.job.model.startedAt') },
    { key: 'finishedAt', title: t('common.job.model.finishedAt') },
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
        <template #item.status="{ item }: { item: DatatableItem }">
          <AJobStatusChip :value="item.status" />
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
            <Acl :permission="ACL.DAM_JOB_READ">
              <ATableDetailButton
                :record-id="item.id"
                :route-name="ROUTE.DAM.JOB.DETAIL"
              />
            </Acl>
            <Acl :permission="ACL.DAM_TTS_AUDIO_CANCEL_JOB">
              <VBtn
                v-if="isCancellableJob(item)"
                icon
                size="small"
                variant="text"
                color="error"
                :title="t('coreDam.ttsAudio.button.cancelJob')"
                @click.stop="openCancel(item.id)"
              >
                <VIcon>mdi-cancel</VIcon>
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
    </div>

    <TtsCancelJobDialog
      v-model="cancelDialog"
      :job-id="cancelTargetJobId"
      @on-success="onCancelSuccess"
    />
  </div>
</template>
