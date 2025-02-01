<script lang="ts" setup>

import { useDistributionListStore } from '@/stores/coreDam/distributionListStore'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ASortable, type DamAssetTypeType, isString, type SortableItem } from '@anzusystems/common-admin'
import {
  type DistributionItem, DistributionItemResourceName, type DistributionItemResourceNameType,
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
  }>(),
  {
  }
)

const { t } = useI18n()

const assetDetailStore = useAssetDetailStore()
const distributionListStore = useDistributionListStore()

const distributionContent = ref<DistributionItem | null>()
const distributionManageDialog = ref(false)
const distributionDialogEdit = ref(false)

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

const onAddExternalLink = (beforeSortableItem: PublicExportPlacedContentItem | null) => {
  distributionContent.value = createDefaultUpdateDto(assetDetailStore.asset.id, assetDetailStore.asset.mainFile.id)
  distributionDialogEdit.value = false
  distributionManageDialog.value = true
}
const onDeleteExternalLink = async (item: SortableItem) => {
  console.log('delete', item)
  const distributionId = distributionListStore.list[item.index]?.id ?? null
  if (!isString(distributionId))
    return

  distributionListStore.showLoader()
  try {
    await deleteDistribution(distributionId)

    emit('onDistributionDelete')
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
  if (value === DistributionItemResourceName.Jw) {
    distributionContent.value =  createDefaultUpdateDto(assetDetailStore.asset.id, assetDetailStore.asset.mainFile.id)
  }
  if (value === DistributionItemResourceName.Youtube) {
    distributionContent.value =  createDefaultYoutubeUpdateDto(assetDetailStore.asset.id, assetDetailStore.asset.mainFile.id)
  }
  if (value === DistributionItemResourceName.Custom) {
    distributionContent.value =  createDefaultCustomUpdateDto(assetDetailStore.asset.id, assetDetailStore.asset.mainFile.id)
  }
}

const onDistributionUpsert = () => {
  closeDialog()
  emit('onDistributionUpsert')
}

const emit = defineEmits<{
  (e: 'onDistributionUpsert'): void
  (e: 'onDistributionDelete'): void
}>()

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
      @on-add-last="onAddExternalLink"
      @on-delete="onDeleteExternalLink"
    >
      <template #item="{ item }: { item: SortableItem<DistributionItem> }">
        <DistributionItemView v-model="item.raw" :asset-type="assetType"/>
      </template>
    </ASortable>
    <DistributionManageDialog
      v-model="distributionContent"
      :distribution-manage-dialog="distributionManageDialog"
      :asset-id="assetDetailStore.asset.id"
      :is-edit="distributionDialogEdit"
      @on-distribution-upsert="onDistributionUpsert"
      @on-cancel="closeDialog"
      @on-distribution-type-select="onDistributionTypeSelect"
    />
</template>
