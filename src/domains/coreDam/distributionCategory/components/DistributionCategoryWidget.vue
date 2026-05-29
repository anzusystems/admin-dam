<script lang="ts" setup>
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import { useFetchDistributionCategory } from '@/domains/coreDam/distributionCategory/api/distributionCategoryApi'
import { DamAssetTypeDefault } from '@anzusystems/common-admin'
import type { DistributionCategory } from '@/domains/coreDam/distributionCategory/types/DistributionCategory'
import { useDistributionCategoryFactory } from '@/domains/coreDam/distributionCategory/factory/DistributionCategoryFactory'
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import DistributionCategoryWidgetDialog from '@/domains/coreDam/distributionCategory/components/DistributionCategoryWidgetDialog.vue'

const { t } = useI18n()

const assetDetailStore = useAssetDetailStore()
const { createDefault } = useDistributionCategoryFactory()
const { currentExtSystemId } = useCurrentExtSystem()

const dialog = ref(false)
const loading = ref(false)
const category = ref<DistributionCategory>(createDefault(currentExtSystemId.value))

const assetId = computed(() => {
  return assetDetailStore.asset && assetDetailStore.asset.id ? assetDetailStore.asset.id : null
})

const distributionCategoryId = computed(() => {
  return assetDetailStore.asset && assetDetailStore.asset.distributionCategory
    ? assetDetailStore.asset.distributionCategory
    : null
})

const assetType = computed(() => {
  return assetDetailStore.asset && assetDetailStore.asset.attributes.assetType
    ? assetDetailStore.asset.attributes.assetType
    : DamAssetTypeDefault
})

const loadCategory = async (id: DocId) => {
  loading.value = true
  const { executeRequest: fetchDistributionCategory } = useFetchDistributionCategory()
  category.value = await fetchDistributionCategory({ urlParams: { id } })
  loading.value = false
}

const afterSave = async (categoryId: DocIdNullable) => {
  assetDetailStore.setDistributionCategory(categoryId)
}

watch(
  distributionCategoryId,
  (newValue, oldValue) => {
    if (newValue === oldValue) return
    if (isNull(newValue)) {
      category.value = createDefault(currentExtSystemId.value)
      return
    }
    loadCategory(newValue)
  },
  { immediate: true }
)
</script>

<template>
  <div class="d-flex flex-column w-100">
    <VRow class="align-center">
      <VCol class="text-body-small">
        {{ t('coreDam.distribution.common.select') }}:
      </VCol>
    </VRow>
    <VRow v-if="!distributionCategoryId">
      <VCol>{{ t('coreDam.distributionCategory.notSelected') }}</VCol>
      <VCol cols="auto">
        <VBtn
          variant="text"
          icon
          size="small"
          @click.stop="dialog = true"
        >
          <VIcon icon="mdi-pencil" />
          <VTooltip
            activator="parent"
            location="bottom"
          >
            {{ t('common.button.edit') }}
          </VTooltip>
        </VBtn>
      </VCol>
    </VRow>
    <VRow v-else-if="loading">
      <VCol class="d-flex w-100 h-100 justify-center align-center pa-2">
        <VProgressCircular
          indeterminate
          color="primary"
        />
      </VCol>
    </VRow>
    <VRow
      v-else
      class="align-center"
    >
      <VCol>
        <div class="font-weight-bold">
          {{ category.name }}
        </div>
        <div
          v-for="item in category.selectedOptionsDetail"
          :key="item.id"
        >
          <div>{{ item.serviceSlug }} - {{ item.name }}</div>
        </div>
      </VCol>
      <VCol cols="auto">
        <VBtn
          variant="text"
          icon
          size="small"
          @click.stop="dialog = true"
        >
          <VIcon icon="mdi-pencil" />
          <VTooltip
            activator="parent"
            location="bottom"
          >
            {{ t('common.button.edit') }}
          </VTooltip>
        </VBtn>
      </VCol>
    </VRow>
    <DistributionCategoryWidgetDialog
      v-if="assetId"
      v-model="dialog"
      :asset-type="assetType"
      :category-id="distributionCategoryId"
      :asset-id="assetId"
      @after-save="afterSave"
    />
  </div>
</template>
