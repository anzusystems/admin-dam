<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onBeforeUnmount, onMounted } from 'vue'
import ACloseButton from '@/components/common/buttons/action/ACloseButton.vue'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import AEditButton from '@/components/common/buttons/action/AEditButton.vue'
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

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.distributionCategory.meta.detail')" icon="mdi-folder-account-outline" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_UPDATE">
      <AEditButton v-if="!detailLoading" :record-id="id" :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY.EDIT" />
    </Acl>
    <ACloseButton :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY.LIST" />
  </ActionbarButtonsWrapper>
  <ACard :loading="detailLoading">
    <DistributionCategoryDetail />
  </ACard>
</template>
