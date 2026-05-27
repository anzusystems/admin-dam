<script lang="ts" setup>
import { AActionCloseButton, AActionEditButton, ACard, useI18n } from '@anzusystems/common-admin'
import { useDistributionCategoryDetailActions } from '@/views/coreDam/distributionCategory/composables/distributionCategoryActions'
import DistributionCategoryDetail from '@/views/coreDam/distributionCategory/components/DistributionCategoryDetail.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const { detailLoading, fetchData, resetStore, distributionCategory } = useDistributionCategoryDetailActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.distributionCategory.list'), routeName: '/(coreDam)/distribution-categories' },
    {
      title: distributionCategory.value.name || t('breadcrumb.coreDam.distributionCategory.detail'),
      routeName: '/(coreDam)/distribution-categories/[id]',
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
      <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :record-id="id"
          :route-name="'/(coreDam)/distribution-categories/[id]/edit'"
        />
      </Acl>
      <AActionCloseButton :route-name="'/(coreDam)/distribution-categories'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <DistributionCategoryDetail />
    </VCardText>
  </ACard>
</template>
