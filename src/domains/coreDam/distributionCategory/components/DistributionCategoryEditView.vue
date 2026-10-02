<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionSaveButton,
  ACard,
  defineBreadcrumbs,
  useRecordPage,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import DistributionCategoryEditForm from '@/domains/coreDam/distributionCategory/components/DistributionCategoryEditForm.vue'
import { useDistributionCategoryEditActions } from '@/domains/coreDam/distributionCategory/composables/distributionCategoryActions'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const route = useRoute()
const id = (route.params as { id: string }).id.toString()

const {
  saveAndCloseButtonLoading,
  saveButtonLoading,
  detailLoading,
  fetchData,
  resetStore,
  onUpdate,
  distributionCategory,
} = useDistributionCategoryEditActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.distributionCategory.list'), routeName: '/(coreDam)/distribution-categories' },
    {
      title: distributionCategory.value.name || t('breadcrumb.coreDam.distributionCategory.edit'),
      routeName: '/(coreDam)/distribution-categories/[id]/edit',
    },
  ])
)

const { signal, leave } = useRecordPage({
  fallbackRouteName: '/(coreDam)/distribution-categories',
  skipRouteNames: ['/(coreDam)/distribution-categories/[id]'],
  loading: detailLoading,
})

onMounted(async () => {
  if ((await fetchData(id, { signal })) === false) await leave()
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionSaveButton
        v-if="!detailLoading"
        :loading="saveButtonLoading"
        :disabled="saveAndCloseButtonLoading"
        @save-record="onUpdate"
      />
      <AActionCloseButtonHistory
        :fallback-route-name="'/(coreDam)/distribution-categories'"
        :skip-route-names="['/(coreDam)/distribution-categories/[id]']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <DistributionCategoryEditForm />
    </VCardText>
  </ACard>
</template>
