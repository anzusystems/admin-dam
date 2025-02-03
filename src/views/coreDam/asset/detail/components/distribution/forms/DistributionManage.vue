<script lang="ts" setup>

import { useDistributionListStore } from '@/stores/coreDam/distributionListStore'
import { computed, ref } from 'vue'
import {
  ASortable,
  type DamAssetTypeType,
  type DocId,
  isString,
  type SortableItem,
  useAlerts
} from '@anzusystems/common-admin'
import {
  type DistributionItem,
  DistributionItemResourceName,
  type DistributionItemResourceNameType,
  type DistributionUpdateDto,
} from '@/types/coreDam/Distribution.ts'
import DistributionManageDialog
  from '@/views/coreDam/asset/detail/components/distribution/forms/DistributionManageDialog.vue'
import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore.ts'
import DistributionItemView from '@/views/coreDam/asset/detail/components/distribution/forms/DistributionItemView.vue'
import { useDistributionYoutubeFactory } from '@/model/coreDam/factory/DistributionYoutubeFactory.ts'
import { useDistributionJwFactory } from '@/model/coreDam/factory/DistributionJwFactory.ts'
import {
  distributionItemIsJwItem, distributionItemIsYoutubeItem, distributionItemIsCustomItem,
} from '@/types/coreDam/Distribution.ts'
import { useDistributionCustomFactory } from '@/model/coreDam/factory/DistributionCustomFactory.ts'
import { deleteDistribution } from '@/services/api/coreDam/distributionApi.ts'

const props = withDefaults(
  defineProps<{
    isActive: boolean,
    assetType: DamAssetTypeType
    assetId: DocId
  }>(),
  {
  }
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
    if (distributionItemIsJwItem(item))
      return createJwUpdateDtoFromItemDto(item)
    if (distributionItemIsYoutubeItem(item))
      return createYoutubeUpdateDtoFromItemDto(item)
  if (distributionItemIsCustomItem(item))
      return createCustomUpdateDtoFromItemDto(item)
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

const onDeleteDistributionItem = async (item: SortableItem) => {
  const distributionId = distributionListStore.list[item.index]?.id ?? null
  if (!isString(distributionId))
    return

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

const onEdit = (data: SortableItem<DistributionItem>) => {
  distributionContent.value = createUpdateDto(data.raw)
  distributionDialogEdit.value = true
  distributionManageDialog.value = true
}

const onDistributionTypeSelect = (value: DistributionItemResourceNameType) => {
  if (!isString(assetFileId.value)) {
    throw new Error('Asset file id is null')
  }
  if (value === DistributionItemResourceName.Jw) {
    distributionContent.value =  createDefaultUpdateDto(props.assetId, assetFileId.value)
  }
  if (value === DistributionItemResourceName.Youtube) {
    distributionContent.value =  createDefaultYoutubeUpdateDto(props.assetId, assetFileId.value)
  }
  if (value === DistributionItemResourceName.Custom) {
    distributionContent.value =  createDefaultCustomUpdateDto(props.assetId, assetFileId.value)
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
  <ASortable
    v-else
    v-model="distributionListStore.list"
    show-add-last-button
    show-delete-button
    disable-dragable
    show-edit-button
    @on-edit="onEdit"
    @on-add-last="onAddDistributionItem"
    @on-delete="onDeleteDistributionItem"
  >
    <template #item="{ item }: { item: SortableItem<DistributionItem> }">
      <DistributionItemView
        v-model="item.raw as DistributionItem"
        :asset-type="assetType"
      />
    </template>
  </ASortable>
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
