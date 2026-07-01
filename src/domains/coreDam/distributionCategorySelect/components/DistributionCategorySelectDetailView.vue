<script lang="ts" setup>
import { AActionCloseButton, AActionEditButton, ACard, useI18n } from '@anzusystems/common-admin'
import { useDistributionCategorySelectDetailActions } from '@/domains/coreDam/distributionCategorySelect/composables/distributionCategorySelectActions'
import DistributionCategorySelectDetail from '@/domains/coreDam/distributionCategorySelect/components/DistributionCategorySelectDetail.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { ACL } from '@/domains/system/auth/auth'

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

const getDetail = () => {
  fetchData(id)
}

onMounted(() => {
  getDetail()
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
      <AActionCloseButton :route-name="'/(coreDam)/distribution-category-selects'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <DistributionCategorySelectDetail />
    </VCardText>
  </ACard>
</template>
