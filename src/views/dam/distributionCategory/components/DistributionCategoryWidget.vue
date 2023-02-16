<script lang="ts" setup>
import { useAssetDetailStore } from '@/stores/dam/assetDetailStore'
import { fetchDistributionCategory } from '@/services/api/dam/distributionCategoryApi'
import { computed, ref, watch } from 'vue'
import { isNull } from '@/utils/common'
import type { DocId } from '@anzusystems/common-admin'
import { DocIdNullable } from '@anzusystems/common-admin'
import type { DistributionCategory } from '@/types/dam/DistributionCategory'
import { useDistributionCategoryFactory } from '@/model/dam/factory/DistributionCategoryFactory'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { useI18n } from 'vue-i18n'
import DistributionCategoryWidgetDialog from '@/views/dam/distributionCategory/components/DistributionCategoryWidgetDialog.vue'

const { t } = useI18n({ useScope: 'global' })

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

const loadCategory = async (id: DocId) => {
  loading.value = true
  category.value = await fetchDistributionCategory(id)
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
    <VRow align="center">
      <VCol class="text-caption">Distribution category:</VCol>
    </VRow>
    <VRow v-if="!distributionCategoryId">
      <VCol>No distribution category selected</VCol>
      <VCol cols="auto">
        <VBtn variant="text" icon size="small" @click.stop="dialog = true">
          <VIcon icon="mdi-pencil" />
          <VTooltip activator="parent" location="bottom">{{ t('common.button.edit') }}</VTooltip>
        </VBtn>
      </VCol>
    </VRow>
    <VRow v-else-if="loading">
      <VCol class="d-flex w-100 h-100 justify-center align-center pa-2">
        <VProgressCircular indeterminate color="primary" />
      </VCol>
    </VRow>
    <VRow v-else align="center">
      <VCol>
        <div class="font-weight-bold">{{ category.name }}</div>
        <div v-for="item in category.selectedOptionsDetail" :key="item.id">
          <div>{{ item.serviceSlug }} - {{ item.name }}</div>
        </div>
      </VCol>
      <VCol cols="auto">
        <VBtn variant="text" icon size="small" @click.stop="dialog = true">
          <VIcon icon="mdi-pencil" />
          <VTooltip activator="parent" location="bottom">{{ t('common.button.edit') }}</VTooltip>
        </VBtn>
      </VCol>
    </VRow>
    <DistributionCategoryWidgetDialog
      v-if="assetId"
      v-model="dialog"
      :category-id="distributionCategoryId"
      :asset-id="assetId"
      @after-save="afterSave"
    />
  </div>
</template>
