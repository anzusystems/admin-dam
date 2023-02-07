<script lang="ts" setup>
import { ref } from 'vue'
import ARow from '@/components/common/ARow.vue'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/authorApi'
import AValueObjectOptionsSelect from '@/components/form/AValueObjectOptionsSelect.vue'
import { useAssetFactory } from '@/model/dam/factory/AssetFactory'
import { useAssetType } from '@/model/dam/valueObject/AssetType'
import { useI18n } from 'vue-i18n'
import type { AssetCreateDto, AssetDetailItemDto } from '@/types/dam/Asset'
import { createAsset } from '@/services/api/dam/assetApi'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import { useAssetDetailStore } from '@/stores/dam/assetDetailStore'
import { loadLazyUser } from '@/views/dam/user/composables/lazyUser'
import { useCurrentAssetLicence } from '@/composables/system/currentExtSystem'

const emit = defineEmits<{
  (e: 'afterCreate', data: AssetDetailItemDto): void
}>()

const { t } = useI18n({ useScope: 'global' })
const { currentAssetLicenceId } = useCurrentAssetLicence()

const { createCreateDto } = useAssetFactory()
const asset = ref<AssetCreateDto>(createCreateDto())
const dialog = ref(false)
const buttonLoading = ref(false)

const onClick = () => {
  asset.value = createCreateDto()
  dialog.value = true
}

const onCancel = () => {
  dialog.value = false
}

const { showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const showDetail = async (asset: AssetDetailItemDto) => {
  assetDetailStore.setView('queue')
  assetDetailStore.showLoader()
  assetDetailStore.showDetail()
  assetDetailStore.setAsset(asset)
  if (assetDetailStore.asset?.createdBy) {
    addToLazyUserBuffer(assetDetailStore.asset.createdBy)
  }
  if (assetDetailStore.asset?.modifiedBy) {
    addToLazyUserBuffer(assetDetailStore.asset.modifiedBy)
  }
  fetchLazyUser()
  assetDetailStore.hideLoader()
}

const onConfirm = async () => {
  try {
    buttonLoading.value = true
    const res = await createAsset(currentAssetLicenceId.value, asset.value)
    showRecordWas('created')
    dialog.value = false
    emit('afterCreate', res)
    await showDetail(res)
  } catch (error) {
    handleError(error)
  } finally {
    buttonLoading.value = false
  }
}

const assetDetailStore = useAssetDetailStore()
const { fetchLazyUser, addToLazyUserBuffer } = loadLazyUser()

const { assetTypeOptions } = useAssetType()
</script>

<template>
  <VListItem title="Create empty asset" @click.stop="onClick" prepend-icon="mdi-plus" />
  <VDialog v-model="dialog" persistent>
    <VCard v-if="dialog" width="500" class="mt-0 mr-auto ml-auto" data-cy="create-panel">
      <VCardTitle class="d-flex pr-2">
        <span>{{ t('coreDam.asset.meta.create') }}</span>
        <VSpacer />
        <VBtn
          class="ml-2"
          icon="mdi-close"
          size="small"
          variant="text"
          @click.stop="onCancel"
          data-cy="button-close"
        />
      </VCardTitle>
      <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
        <VContainer class="pa-4" fluid>
          <ARow>
            <AValueObjectOptionsSelect
              :label="t('coreDam.author.model.type')"
              v-model="asset.type"
              :items="assetTypeOptions"
              data-cy="author-type"
            />
          </ARow>
        </VContainer>
      </ASystemEntityScope>
      <VCardActions>
        <VSpacer />
        <VBtn color="secondary" variant="text" @click.stop="onCancel" data-cy="button-cancel">
          {{ t('common.button.cancel') }}
        </VBtn>
        <VBtn color="success" @click.stop="onConfirm" :loading="buttonLoading" data-cy="button-confirm">
          {{ t('common.button.create') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
