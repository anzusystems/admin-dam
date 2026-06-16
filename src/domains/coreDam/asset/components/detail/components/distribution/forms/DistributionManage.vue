<script lang="ts" setup>
import { useDistributionListStore } from '@/domains/coreDam/asset/store/distributionListStore'
import type { DamAssetTypeType } from '@anzusystems/common-admin'
import { AListEditor, type ListViewItem } from '@anzusystems/common-admin/labs'
import {
  type DistributionItem,
  distributionItemIsCustomItem,
  distributionItemIsJwItem,
  distributionItemIsYoutubeItem,
  DistributionItemResourceName,
  type DistributionItemResourceNameType,
  type DistributionUpdateDto,
} from '@/domains/coreDam/asset/types/Distribution'
import DistributionManageDialog from '@/domains/coreDam/asset/components/detail/components/distribution/forms/DistributionManageDialog.vue'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import DistributionItemView from '@/domains/coreDam/asset/components/detail/components/distribution/forms/DistributionItemView.vue'
import { useDistributionYoutubeFactory } from '@/domains/coreDam/asset/factory/DistributionYoutubeFactory'
import { useDistributionJwFactory } from '@/domains/coreDam/asset/factory/DistributionJwFactory'
import { useDistributionCustomFactory } from '@/domains/coreDam/asset/factory/DistributionCustomFactory'
import { deleteDistribution } from '@/domains/coreDam/asset/api/distributionApi'

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
  distributionManageDialog.value = true
}

const { showRecordWas, showErrorsDefault } = useAlerts()

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
  } finally {
    distributionListStore.hideLoader()
  }
}

const onEdit = (vi: ListViewItem<DistributionItem>) => {
  distributionContent.value = createUpdateDto(vi.raw)
  distributionDialogEdit.value = true
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
  <AListEditor
    v-else
    v-model="distributionListStore.list"
    add-label="coreDam.distribution.meta.create"
    :on-delete="onDeleteDistributionItem"
    @add="onAddDistributionItem"
    @edit="onEdit"
  >
    <template #item-compact="{ raw }: { raw: DistributionItem }">
      <DistributionItemView
        :model-value="raw"
        :asset-type="assetType"
      />
    </template>
  </AListEditor>
  <DistributionManageDialog
    v-if="distributionContent"
    v-model="distributionContent"
    :distribution-manage-dialog="distributionManageDialog"
    :asset-id="assetId"
    :is-edit="distributionDialogEdit"
    @on-distribution-upsert="onDistributionUpsert"
    @on-cancel="closeDialog"
    @on-distribution-type-select="onDistributionTypeSelect"
  />
</template>
