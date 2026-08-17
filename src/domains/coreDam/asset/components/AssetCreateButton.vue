<script lang="ts" setup>
import {
  ADialogToolbar,
  AFormValueObjectOptionsSelect,
  ARow,
  type AssetDetailItemDto,
  ASystemEntityScope,
  useDamCachedUsers,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/author/api/authorApi'
import { useAssetFactory } from '@/domains/coreDam/asset/factory/AssetFactory'
import { useAssetType } from '@/domains/coreDam/asset/valueObject/DamAssetType'
import { createAsset } from '@/domains/coreDam/asset/api/assetApi'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import { useCurrentAssetLicence } from '@/domains/coreDam/asset/composables/currentExtSystem'
import type { AssetCreateDto } from '@/domains/coreDam/asset/types/Asset'

const emit = defineEmits<{
  (e: 'afterCreate', data: AssetDetailItemDto): void
}>()

const { t } = useI18n()
const { currentAssetLicenceId } = useCurrentAssetLicence()
const assetDetailStore = useAssetDetailStore()
const { addToCachedUsers, fetchCachedUsers } = useDamCachedUsers()

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

const { showRecordWas, showErrorsDefault } = useAlerts()

const showDetail = async (asset: AssetDetailItemDto) => {
  assetDetailStore.setView('queue')
  assetDetailStore.showLoader()
  assetDetailStore.showDetail()
  assetDetailStore.setAsset(asset)
  addToCachedUsers(assetDetailStore.asset?.createdBy, assetDetailStore.asset?.modifiedBy)
  fetchCachedUsers()
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
    showErrorsDefault(error)
  } finally {
    buttonLoading.value = false
  }
}

const { assetTypeOptions } = useAssetType()
</script>

<template>
  <VListItem
    :title="t('coreDam.asset.meta.createEmpty')"
    prepend-icon="mdi-plus"
    data-cy="button-main-empty-asset"
    @click.stop="onClick"
  />
  <VDialog v-model="dialog">
    <VCard
      v-if="dialog"
      width="500"
      class="mt-0 mr-auto ml-auto"
      data-cy="create-panel"
    >
      <ADialogToolbar @on-cancel="onCancel">
        <slot name="title">
          {{ t('coreDam.asset.meta.createEmpty') }}
        </slot>
      </ADialogToolbar>
      <VCardText>
        <ASystemEntityScope
          :system="SYSTEM_CORE_DAM"
          :subject="ENTITY"
        >
          <ARow>
            <AFormValueObjectOptionsSelect
              v-model="asset.type"
              :label="t('coreDam.author.model.type')"
              :items="assetTypeOptions"
              data-cy="author-type"
            />
          </ARow>
        </ASystemEntityScope>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <ABtnTertiary
          data-cy="button-cancel"
          @click.stop="onCancel"
        >
          {{ t('common.button.cancel') }}
        </ABtnTertiary>
        <ABtnPrimary
          :loading="buttonLoading"
          data-cy="button-confirm"
          @click.stop="onConfirm"
        >
          {{ t('common.button.create') }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
