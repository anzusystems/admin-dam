<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useUploadQueuesStore } from '@/stores/coreDam/uploadQueuesStore'
import { QUEUE_ID_MASS_EDIT } from '@/services/upload/uploadQueueIds'
import AssetQueueEditable from '@/views/coreDam/asset/components/queue/AssetQueueEditable.vue'
import { useAssetListStore } from '@/stores/coreDam/assetListStore'
import { useAssetFooterSelectedView } from '@/composables/system/assetFooterSelected'
import { bulkUpdateAssetsMetadata } from '@/services/api/coreDam/assetApi'
import { useAlerts, useTheme } from '@anzusystems/common-admin'
import AssetFooterSelectedButtonClear from '@/views/coreDam/asset/components/footer/AssetFooterSelectedButtonClear.vue'
import { useI18n } from 'vue-i18n'
import useVuelidate from '@vuelidate/core'

const { t } = useI18n()

const { toolbarColor } = useTheme()

const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

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

const { showRecordWas, showValidationError, showErrorsDefault } = useAlerts()

const v$ = useVuelidate()

const onSave = async () => {
  if (list.value.length === 0) return
  saveButtonLoading.value = true
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    saveButtonLoading.value = false
    return
  }
  try {
    await bulkUpdateAssetsMetadata(list.value)
    showRecordWas('updated')
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    saveButtonLoading.value = false
  }
}

const onSaveAndClose = async () => {
  if (list.value.length === 0) return
  saveAndCloseButtonLoading.value = true
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    saveAndCloseButtonLoading.value = false
    return
  }
  try {
    await bulkUpdateAssetsMetadata(list.value)
    showRecordWas('updated')
    await onClearConfirm()
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    saveAndCloseButtonLoading.value = false
  }
}
</script>

<template>
  <div
    class="asset-footer__selected pa-0"
    :class="'asset-footer--' + footerViewSelected + ' asset-footer__selected--' + footerViewSelected"
  >
    <div class="d-flex w-100 h-100 flex-column">
      <VToolbar
        class="w-100 system-border-b pr-1"
        :color="toolbarColor"
        density="compact"
        :height="64"
      >
        <div class="d-flex align-center pa-2">
          <div>
            <span class="text-subtitle-2">{{ t('coreDam.asset.selected.selectedFiles') }}: {{ queueTotalCount }}</span>
          </div>
        </div>
        <VSpacer />
        <div class="d-flex align-center">
          <ABtnPrimary
            :height="36"
            class="mr-2"
            rounded="pill"
            :loading="saveAndCloseButtonLoading"
            :disabled="saveButtonLoading"
            @click.stop="onSaveAndClose"
          >
            {{ t('coreDam.asset.selected.saveAndClose') }}
          </ABtnPrimary>
          <VBtn
            icon
            :height="36"
            :width="36"
            :loading="saveButtonLoading"
            :disabled="saveAndCloseButtonLoading"
            @click.stop="onSave"
          >
            <VIcon icon="mdi-content-save" />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              {{ t('coreDam.asset.selected.save') }}
            </VTooltip>
          </VBtn>
          <VDivider
            vertical
            class="mx-4 my-2"
          />
          <VBtn
            :height="36"
            :width="36"
            :active="massOperations"
            :variant="massOperations ? 'flat' : 'text'"
            :color="massOperations ? 'secondary' : ''"
            class="mr-2"
            icon
            @click.stop="toggleMassOperations"
          >
            <VIcon icon="mdi-tag-text-outline" />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              {{ t('coreDam.asset.massOperations.title') }}
            </VTooltip>
          </VBtn>
          <VBtn
            v-show="showMinimalSelected"
            icon
            variant="flat"
            :height="36"
            :width="36"
            rounded="circle"
            class="mr-2"
            @click.stop="setMinimalSelected"
          >
            <VIcon icon="mdi-chevron-down" />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              {{ t('common.system.modal.hide') }}
            </VTooltip>
          </VBtn>
          <AssetFooterSelectedButtonClear
            variant="normal"
            @confirm="onClearConfirm"
          />
        </div>
      </VToolbar>
      <AssetQueueEditable
        :queue-id="QUEUE_ID_MASS_EDIT"
        :mass-operations="massOperations"
        disable-done-animation
      />
    </div>
  </div>
</template>
