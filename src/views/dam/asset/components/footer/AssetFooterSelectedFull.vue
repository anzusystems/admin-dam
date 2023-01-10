<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useUploadQueuesStore } from '@/stores/dam/uploadQueuesStore'
import { QUEUE_ID_MASS_EDIT } from '@/services/upload/uploadQueueIds'
import AssetQueueMassEditEditable from '@/views/dam/asset/components/queue/AssetQueueEditable.vue'
import { useAssetListStore } from '@/stores/dam/assetListStore'
import { useAssetFooterSelectedView } from '@/composables/system/assetFooterSelected'
import { bulkUpdateAssetsMetadata } from '@/services/api/dam/assetApi'
import { useTheme } from '@/composables/system/themeSettings'
import AssetFooterSelectedButtonClear from '@/views/dam/asset/components/footer/AssetFooterSelectedButtonClear.vue'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import { useUiHelper } from '@/composables/system/uiHelper'
import { useI18n } from 'vue-i18n'
import useVuelidate from '@vuelidate/core'

const { t } = useI18n({ useScope: 'global' })

const { toolbarColor } = useTheme()

const { footerViewSelected, showMinimalSelected, setMinimalSelected, autoShowSelected, hideSelected } =
  useAssetFooterSelectedView()

const assetListStore = useAssetListStore()
const uploadQueuesStore = useUploadQueuesStore()

const queueTotalCount = computed(() => {
  return uploadQueuesStore.getQueueTotalCount(QUEUE_ID_MASS_EDIT)
})

watch(queueTotalCount, (newValue, oldValue) => {
  if (newValue !== oldValue && newValue > 0) {
    autoShowSelected()
  }
})

const onClearConfirm = async () => {
  uploadQueuesStore.clearQueue(QUEUE_ID_MASS_EDIT)
  assetListStore.clearSelected()
  hideSelected()
}

const massOperations = ref(true)

const list = computed(() => {
  return uploadQueuesStore.getQueueItems(QUEUE_ID_MASS_EDIT)
})

const toggleMassOperations = async () => {
  massOperations.value = !massOperations.value
}

const { showRecordWas, showValidationError } = useAlerts()
const { handleError } = useErrorHandler()
const { btn, btnReset, btnLoadingOn, btnDisable, btnEnable } = useUiHelper()

const v$ = useVuelidate()

const onSave = async () => {
  if (list.value.length === 0) return
  btnDisable('save', 'saveAndClose')
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    btnEnable('save', 'saveAndClose')
    return
  }
  try {
    btnLoadingOn('save')
    btnDisable('saveAndClose')
    await bulkUpdateAssetsMetadata(list.value)
    showRecordWas('updated')
  } catch (error) {
    handleError(error)
  } finally {
    btnReset('save', 'saveAndClose')
  }
}

const onSaveAndClose = async () => {
  if (list.value.length === 0) return
  btnDisable('save', 'saveAndClose')
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    btnEnable('save', 'saveAndClose')
    return
  }
  try {
    btnLoadingOn('saveAndClose')
    btnDisable('save')
    await bulkUpdateAssetsMetadata(list.value)
    showRecordWas('updated')
    await onClearConfirm()
  } catch (error) {
    handleError(error)
  } finally {
    btnReset('save', 'saveAndClose')
  }
}
</script>

<template>
  <div
    class="asset-footer__selected pa-0"
    :class="'asset-footer--' + footerViewSelected + ' asset-footer__selected--' + footerViewSelected"
  >
    <div class="d-flex w-100 h-100 flex-column">
      <VToolbar class="w-100 system-border-b" :color="toolbarColor" density="compact" :height="64">
        <div class="d-flex align-center pa-2">
          <div>
            <span class="text-subtitle-2">Selected files: {{ queueTotalCount }}</span>
          </div>
        </div>
        <VSpacer></VSpacer>
        <div class="d-flex align-center">
          <VBtn
            @click.stop="onSaveAndClose"
            color="success"
            variant="flat"
            :height="36"
            class="mr-2"
            rounded="pill"
            :loading="btn.saveAndClose.loading"
            :disabled="btn.saveAndClose.disabled"
          >
            {{ t('coreDam.asset.selected.saveAndClose') }}
          </VBtn>
          <VBtn
            @click.stop="onSave"
            icon
            color="secondary"
            variant="flat"
            :height="36"
            :width="36"
            class="mr-2"
            :loading="btn.save.loading"
            :disabled="btn.save.disabled"
          >
            <VIcon icon="mdi-content-save" />
            <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.selected.save') }}</VTooltip>
          </VBtn>
          <AssetFooterSelectedButtonClear @confirm="onClearConfirm" variant="normal"></AssetFooterSelectedButtonClear>
          <VDivider vertical class="mx-4 my-2" />
          <VBtn
            @click.stop="toggleMassOperations"
            :height="36"
            :width="36"
            :active="massOperations"
            :variant="massOperations ? 'flat' : 'text'"
            :color="massOperations ? 'secondary' : ''"
            class="mr-2"
            icon
          >
            <VIcon icon="mdi-tag-text-outline" />
            <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.massOperations.title') }}</VTooltip>
          </VBtn>
          <VBtn
            v-show="showMinimalSelected"
            icon
            @click.stop="setMinimalSelected"
            variant="flat"
            :height="36"
            :width="36"
            rounded="circle"
            class="mr-2"
          >
            <VIcon icon="mdi-chevron-down"></VIcon>
            <VTooltip activator="parent" location="bottom">{{ t('common.modal.hide') }}</VTooltip>
          </VBtn>
        </div>
      </VToolbar>
      <AssetQueueMassEditEditable
        :queue-id="QUEUE_ID_MASS_EDIT"
        :mass-operations="massOperations"
      ></AssetQueueMassEditEditable>
    </div>
  </div>
</template>
