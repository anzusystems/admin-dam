<script lang="ts" setup>
import {
  AFormDatetimePicker,
  AFormTextField,
  AFormTextarea,
  AFormValueObjectOptionsSelect,
  ARow,
  ASortableListEditor,
  ASystemEntityScope,
} from '@anzusystems/common-admin'
import type { ListEditorHandle, ListViewItem } from '@anzusystems/common-admin'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import ImagePreview from '@/domains/coreDam/asset/components/ImagePreview.vue'
import { DeviceType } from '@/domains/coreDam/asset/valueObject/DeviceType'
import { ExportType } from '@/domains/coreDam/asset/valueObject/ExportType'
import { ENTITY } from '@/domains/coreDam/podcast/api/podcastApi'
import PodcastExportDataManageDialog from '@/domains/coreDam/podcast/components/PodcastExportDataManageDialog.vue'
import { usePodcastEditActions } from '@/domains/coreDam/podcast/composables/podcastActions'
import {
  PodcastExportDataValidationSymbol,
  exportDataCombination,
  exportDataCombinationTaken,
} from '@/domains/coreDam/podcast/composables/podcastExportDataValidations'
import { usePodcastValidation } from '@/domains/coreDam/podcast/composables/podcastValidation'
import { usePodcastExportDataFactory } from '@/domains/coreDam/podcast/factory/PodcastExportDataFactory'
import { usePodcastOneStore } from '@/domains/coreDam/podcast/store/podcastStore'
import type { PodcastExportData } from '@/domains/coreDam/podcast/types/PodcastExportData'
import { usePodcastMode } from '@/domains/coreDam/podcast/valueObject/PodcastMode'
import DeviceTypeChip from '@/domains/coreDam/publicExport/components/DeviceTypeChip.vue'
import ExportTypeChip from '@/domains/coreDam/publicExport/components/ExportTypeChip.vue'
import DamTrackingFields from '@/domains/coreDam/shared/components/DamTrackingFields.vue'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const { podcast } = usePodcastEditActions()

const { v$ } = usePodcastValidation(podcast)

const { t } = useI18n()

const { podcastModeOptions } = usePodcastMode()

const { createDefaultWithPodcast: createPodcastExportData } = usePodcastExportDataFactory()

const podcastExportDataManageDialog = ref(false)
const managedPodcastExportData = ref<PodcastExportData | null>(null)
const addingNewExportData = ref(false)

// Export-data rows are edited in PodcastExportDataManageDialog (rich-text body), so the editor's
// built-in inline add is hidden and add is driven from here: create -> push -> open the dialog.
const exportDataEditor = ref<ListEditorHandle<PodcastExportData> | null>(null)
defineExpose({
  commit: (saved?: PodcastExportData[]) => exportDataEditor.value?.commit(saved),
})

const podcastOneStore = usePodcastOneStore()

// Every pair of export type and device type, the defaults first. The server takes each pair once per podcast.
const PAIRS = Object.values(ExportType).flatMap((exportType) =>
  Object.values(DeviceType).map((deviceType) => ({ exportType, deviceType }))
)

const exportDataRowError = (row: PodcastExportData) => {
  if (exportDataCombinationTaken(row, podcast.value.exportData)) {
    return t('coreDam.podcastExportData.validation.combinationTaken')
  }
  if (podcastOneStore.exportDataRefused.get(row.id) === exportDataCombination(row)) {
    return t('coreDam.podcastExportData.validation.combinationRefused')
  }

  return ''
}
const exportDataRowValid = (row: PodcastExportData) => !exportDataRowError(row)

const onAddExportData = () => {
  const item = createPodcastExportData(podcast.value.id)
  // The first pair no row holds yet. The defaults are taken in nearly every podcast.
  const free = PAIRS.find(
    (pair) => !podcast.value.exportData.some((row) => exportDataCombination(row) === exportDataCombination(pair))
  )
  if (free) Object.assign(item, free)
  podcast.value.exportData.push(item)
  managedPodcastExportData.value = item
  addingNewExportData.value = true
  podcastExportDataManageDialog.value = true
}

const onEditPodcastExportData = (vi: ListViewItem<PodcastExportData>) => {
  managedPodcastExportData.value = vi.raw
  addingNewExportData.value = false
  podcastExportDataManageDialog.value = true
}

const onCancel = () => {
  // A brand-new row was only pushed to open the dialog — drop it again if the user cancels.
  if (addingNewExportData.value && managedPodcastExportData.value) {
    const index = podcast.value.exportData.indexOf(managedPodcastExportData.value)
    if (index !== -1) podcast.value.exportData.splice(index, 1)
  }
  addingNewExportData.value = false
  managedPodcastExportData.value = null
}
</script>

<template>
  <ASystemEntityScope
    :system="SYSTEM_CORE_DAM"
    :subject="ENTITY"
  >
    <VRow>
      <VCol
        cols="12"
        md="8"
      >
        <ARow>
          <AFormTextField
            v-model="podcast.texts.title"
            :label="t('coreDam.podcast.model.texts.title')"
            :v="v$.podcast.texts.title"
            data-cy="podcast-title"
          />
        </ARow>
        <ARow>
          <AFormTextarea
            v-model="podcast.texts.description"
            :label="t('coreDam.podcast.model.texts.description')"
            :v="v$.podcast.texts.description"
            data-cy="podcast-description"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model.number="podcast.attributes.webOrderPosition"
            :label="t('coreDam.podcast.model.attributes.webOrderPosition')"
            :v="v$.podcast.attributes.webOrderPosition"
            type="number"
            :step="1"
            data-cy="podcast-web-order-number"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model.number="podcast.attributes.mobileOrderPosition"
            :label="t('coreDam.podcastEpisode.model.attributes.mobileOrderPosition')"
            :v="v$.podcast.attributes.mobileOrderPosition"
            type="number"
            :step="1"
            data-cy="podcast-web-order-number"
          />
        </ARow>
        <ARow>
          <VSwitch
            v-model="podcast.flags.webPublicExportEnabled"
            class="pl-2"
            :label="t('coreDam.podcast.model.flags.webPublicExportEnabled')"
          />
        </ARow>
        <ARow>
          <VSwitch
            v-model="podcast.flags.mobilePublicExportEnabled"
            class="pl-2"
            :label="t('coreDam.podcast.model.flags.mobilePublicExportEnabled')"
          />
        </ARow>
        <ARow>
          <AFormValueObjectOptionsSelect
            v-model="podcast.attributes.mode"
            :label="t('coreDam.podcast.model.attributes.mode')"
            :items="podcastModeOptions"
            data-cy="podcast-mode"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="podcast.attributes.rssUrl"
            :label="t('coreDam.podcast.model.attributes.rssUrl')"
            :v="v$.podcast.attributes.rssUrl"
            data-cy="podcast-rss-url"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="podcast.attributes.extUrl"
            :label="t('coreDam.podcast.model.attributes.extUrl')"
            :v="v$.podcast.attributes.extUrl"
            data-cy="podcast-ext-url"
          />
        </ARow>
        <ARow>
          <AFormDatetimePicker
            v-model="podcast.dates.importFrom"
            :label="t('coreDam.podcast.model.dates.importFrom')"
            :v="v$.podcast.dates.importFrom"
            clearable
          />
        </ARow>
        <ARow :title="t('coreDam.podcast.model.exportData')">
          <ASortableListEditor
            ref="exportDataEditor"
            v-model="podcast.exportData"
            :show-add-button="false"
            :position="false"
            :show-reorder-toggle="false"
            disable-reorder
            :unsaved-section-label="t('coreDam.podcast.model.exportData')"
            :validate="exportDataRowValid"
            :validation-scope="PodcastExportDataValidationSymbol"
            @edit="onEditPodcastExportData"
          >
            <template #item-compact="{ raw }: { raw: PodcastExportData }">
              {{ t('coreDam.podcastExportData.model.exportType') }}:
              <ExportTypeChip :type="raw.exportType" />
              {{ t('coreDam.podcastExportData.model.deviceType') }}:
              <DeviceTypeChip :type="raw.deviceType" />
            </template>
            <template #after-item="{ raw }: { raw: PodcastExportData }">
              <div
                v-if="exportDataRowError(raw)"
                class="text-error text-body-small px-4 pb-2"
                data-cy="export-data-row-error"
              >
                {{ exportDataRowError(raw) }}
              </div>
            </template>
          </ASortableListEditor>
          <VBtn
            class="mt-2"
            color="primary"
            variant="text"
            prepend-icon="mdi-plus"
            data-cy="button-add-export-data"
            @click="onAddExportData"
          >
            {{ t('coreDam.podcastExportData.meta.create') }}
          </VBtn>
        </ARow>
      </VCol>
      <VCol
        cols="12"
        md="4"
      >
        <ARow
          :title="t('coreDam.podcast.model.imagePreview')"
          data-cy="select-image-preview"
        >
          <ImagePreview
            v-if="podcast.licence"
            v-model="podcast.imagePreview"
            :licence="podcast.licence"
            show-actions
          />
        </ARow>
        <ARow
          :title="t('coreDam.podcast.model.altImage')"
          data-cy="select-image-alt"
        >
          <ImagePreview
            v-if="podcast.licence"
            v-model="podcast.altImage"
            :licence="podcast.licence"
            show-actions
          />
        </ARow>
        <DamTrackingFields :data="podcast" />
      </VCol>
    </VRow>
    <PodcastExportDataManageDialog
      v-if="managedPodcastExportData"
      v-model="managedPodcastExportData"
      v-model:manage-dialog="podcastExportDataManageDialog"
      :rows="podcast.exportData"
      @on-cancel="onCancel"
    />
  </ASystemEntityScope>
</template>
