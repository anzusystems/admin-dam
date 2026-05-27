<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { AActionCloseButton, AActionEditButton, ACard, defineBreadcrumbs, useI18n } from '@anzusystems/common-admin'
import { useDistributionCategorySelectDetailActions } from '@/views/coreDam/distributionCategorySelect/composables/distributionCategorySelectActions'
import DistributionCategorySelectDetail from '@/views/coreDam/distributionCategorySelect/components/DistributionCategorySelectDetail.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const { detailLoading, fetchData, resetStore, distributionCategorySelect } =
  useDistributionCategorySelectDetailActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    {
      title: t('breadcrumb.coreDam.distributionCategorySelect.list'),
      routeName: '/(coreDam)/distribution-category-select',
    },
    {
      title: distributionCategorySelect.value.id || t('breadcrumb.coreDam.distributionCategorySelect.detail'),
      routeName: '/(coreDam)/distribution-category-select/[id]',
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
          :route-name="'/(coreDam)/distribution-category-select/[id]/edit'"
        />
      </Acl>
      <AActionCloseButton :route-name="'/(coreDam)/distribution-category-select'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <DistributionCategorySelectDetail />
    </VCardText>
  </ACard>
</template>
