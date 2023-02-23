<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onBeforeUnmount, onMounted } from 'vue'
import { AActionCloseButton } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { AActionEditButton } from '@anzusystems/common-admin'
import { ACL } from '@/types/Permission'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { useDistributionCategoryDetailActions } from '@/views/dam/distributionCategory/composables/distributionCategoryActions'
import DistributionCategoryDetail from '@/views/dam/distributionCategory/components/DistributionCategoryDetail.vue'

const { detailLoading, fetchData, resetStore } = useDistributionCategoryDetailActions()

const route = useRoute()
const id = route.params.id.toString()

const getDetail = () => {
  fetchData(id)
}

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetStore()
})

const { t } = useI18n()
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.distributionCategory.meta.detail')" icon="mdi-folder-account-outline" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_UPDATE">
      <AActionEditButton v-if="!detailLoading" :record-id="id" :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY.EDIT" />
    </Acl>
    <AActionCloseButton :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY.LIST" />
  </ActionbarButtonsWrapper>
  <ACard :loading="detailLoading">
    <DistributionCategoryDetail />
  </ACard>
</template>
