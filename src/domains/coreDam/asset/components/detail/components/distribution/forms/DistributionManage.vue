<script lang="ts" setup>
import { AListEditor, isString, useAlerts, useDamConfigStore } from '@anzusystems/common-admin'
import type { DamAssetTypeType, DocId, ListViewItem } from '@anzusystems/common-admin'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { deleteDistribution } from '@/domains/coreDam/asset/api/distributionApi'
import DistributionItemView from '@/domains/coreDam/asset/components/detail/components/distribution/forms/DistributionItemView.vue'
import DistributionManageDialog from '@/domains/coreDam/asset/components/detail/components/distribution/forms/DistributionManageDialog.vue'
import { useDistributionServiceAllowed } from '@/domains/coreDam/asset/components/detail/composables/assetDetailDistributionDialog'
import { useDistributionCustomFactory } from '@/domains/coreDam/asset/factory/DistributionCustomFactory'
import { useDistributionJwFactory } from '@/domains/coreDam/asset/factory/DistributionJwFactory'
import { useDistributionYoutubeFactory } from '@/domains/coreDam/asset/factory/DistributionYoutubeFactory'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import { useDistributionListStore } from '@/domains/coreDam/asset/store/distributionListStore'
import {
  DistributionItemResourceName,
  distributionItemIsCustomItem,
  distributionItemIsJwItem,
  distributionItemIsYoutubeItem,
} from '@/domains/coreDam/asset/types/Distribution'
import type {
  DistributionItem,
  DistributionItemResourceNameType,
  DistributionUpdateDto,
} from '@/domains/coreDam/asset/types/Distribution'
import { ACL, useAuth } from '@/domains/system/auth/auth'

const props = withDefaults(
  defineProps<{
    isActive: boolean
    assetType: DamAssetTypeType
    assetId: DocId
  }>(),
  {}
)

const emit = defineEmits<{
  (e: 'onDistributionUpsert'): void
  (e: 'onDistributionDelete'): void
}>()

const assetDetailStore = useAssetDetailStore()
const distributionListStore = useDistributionListStore()

const distributionContent = ref<DistributionUpdateDto | null>()
const distributionManageDialog = ref(false)
const distributionDialogEdit = ref(false)
// core-dam checks the service on every write: one off the user's account is shown, not saved.
const distributionDialogReadonly = ref(false)
const isDistributionServiceAllowed = useDistributionServiceAllowed()
const damConfigStore = useDamConfigStore()
const anyServiceAllowed = computed(() =>
  Object.keys(damConfigStore.damPrvConfig.distributionServices).some(isDistributionServiceAllowed)
)

const assetFileId = computed(() => assetDetailStore.asset?.mainFile?.id)

const closeDialog = () => {
  distributionContent.value = null
  distributionManageDialog.value = false
  distributionDialogEdit.value = false
}

const { createJwUpdateDtoFromItemDto, createDefaultUpdateDto } = useDistributionJwFactory()
const { createYoutubeUpdateDtoFromItemDto, createDefaultYoutubeUpdateDto } = useDistributionYoutubeFactory()
const { createCustomUpdateDtoFromItemDto, createDefaultCustomUpdateDto } = useDistributionCustomFactory()

const createUpdateDto = (item: DistributionItem) => {
  if (distributionItemIsJwItem(item)) return createJwUpdateDtoFromItemDto(item)
  if (distributionItemIsYoutubeItem(item)) return createYoutubeUpdateDtoFromItemDto(item)
  if (distributionItemIsCustomItem(item)) return createCustomUpdateDtoFromItemDto(item)
  throw Error('Unknown distribution item type')
}

const onAddDistributionItem = () => {
  if (!isString(assetFileId.value)) {
    throw new Error('Asset file id is null')
  }
  distributionContent.value = createDefaultUpdateDto(props.assetId, assetFileId.value)
  distributionDialogEdit.value = false
  distributionDialogReadonly.value = false
  distributionManageDialog.value = true
}

const { showRecordWas, showErrorsDefault } = useAlerts()
const { t } = useI18n()
const { can } = useAuth()

const onDeleteDistributionItem = async (item: DistributionItem) => {
  const distributionId = item.id ?? null
  if (!isString(distributionId)) return

  distributionListStore.showLoader()
  try {
    await deleteDistribution(distributionId)
    emit('onDistributionDelete')
    showRecordWas('deleted')
  } catch (error) {
    showErrorsDefault(error)
    throw error // :on-delete — re-throw so the editor keeps the row instead of dropping it while it still exists on the server
  } finally {
    distributionListStore.hideLoader()
  }
}

const onEdit = (vi: ListViewItem<DistributionItem>) => {
  distributionContent.value = createUpdateDto(vi.raw)
  distributionDialogEdit.value = true
  distributionDialogReadonly.value = !isDistributionServiceAllowed(vi.raw.distributionService)
  distributionManageDialog.value = true
}

const onDistributionTypeSelect = (value: DistributionItemResourceNameType) => {
  if (!isString(assetFileId.value)) {
    throw new Error('Asset file id is null')
  }
  if (value === DistributionItemResourceName.Jw) {
    distributionContent.value = createDefaultUpdateDto(props.assetId, assetFileId.value)
  }
  if (value === DistributionItemResourceName.Youtube) {
    distributionContent.value = createDefaultYoutubeUpdateDto(props.assetId, assetFileId.value)
  }
  if (value === DistributionItemResourceName.Custom) {
    distributionContent.value = createDefaultCustomUpdateDto(props.assetId, assetFileId.value)
  }
}

const onDistributionUpsert = () => {
  closeDialog()
  emit('onDistributionUpsert')
}
</script>

<template>
  <div
    v-if="distributionListStore.loader"
    class="d-flex w-100 h-100 justify-center align-center pa-2"
  >
    <VProgressCircular
      indeterminate
      color="primary"
    />
  </div>
  <template v-else>
    <AListEditor
      v-model="distributionListStore.list"
      :show-add-button="false"
      :show-delete-button="can(ACL.DAM_DISTRIBUTION_DELETE)"
      :on-delete="onDeleteDistributionItem"
      delete-mode="immediate"
      disable-unsaved
      @edit="onEdit"
    >
      <template #item-compact="{ raw }: { raw: DistributionItem }">
        <DistributionItemView
          :model-value="raw"
          :asset-type="assetType"
        />
      </template>
    </AListEditor>
    <VBtn
      v-if="anyServiceAllowed"
      color="primary"
      variant="text"
      prepend-icon="mdi-plus"
      data-cy="button-add-distribution"
      @click="onAddDistributionItem"
    >
      {{ t('coreDam.distribution.meta.create') }}
    </VBtn>
  </template>
  <DistributionManageDialog
    v-if="distributionContent"
    v-model="distributionContent"
    :distribution-manage-dialog="distributionManageDialog"
    :asset-id="assetId"
    :is-edit="distributionDialogEdit"
    :readonly="distributionDialogReadonly"
    @on-distribution-upsert="onDistributionUpsert"
    @on-cancel="closeDialog"
    @on-distribution-type-select="onDistributionTypeSelect"
  />
</template>
