<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionEditButton,
  ACard,
  defineBreadcrumbs,
  useRecordPage,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import DistributionCategorySelectDetail from '@/domains/coreDam/distributionCategorySelect/components/DistributionCategorySelectDetail.vue'
import { useDistributionCategorySelectDetailActions } from '@/domains/coreDam/distributionCategorySelect/composables/distributionCategorySelectActions'
import { ACL } from '@/domains/system/auth/auth'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const { detailLoading, fetchData, resetStore, distributionCategorySelect } =
  useDistributionCategorySelectDetailActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    {
      title: t('breadcrumb.coreDam.distributionCategorySelect.list'),
      routeName: '/(coreDam)/distribution-category-selects',
    },
    {
      title: distributionCategorySelect.value.id || t('breadcrumb.coreDam.distributionCategorySelect.detail'),
      routeName: '/(coreDam)/distribution-category-selects/[id]',
    },
  ])
)

const route = useRoute()
const id = (route.params as { id: string }).id.toString()

const { signal, leave } = useRecordPage({
  fallbackRouteName: '/(coreDam)/distribution-category-selects',
  skipRouteNames: ['/(coreDam)/distribution-category-selects/[id]/edit'],
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
      <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :record-id="id"
          :route-name="'/(coreDam)/distribution-category-selects/[id]/edit'"
        />
      </Acl>
      <AActionCloseButtonHistory
        :fallback-route-name="'/(coreDam)/distribution-category-selects'"
        :skip-route-names="['/(coreDam)/distribution-category-selects/[id]/edit']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <DistributionCategorySelectDetail />
    </VCardText>
  </ACard>
</template>
