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
import { useDistributionCategorySelectDetailActions } from '@/views/dam/distributionCategorySelect/composables/distributionCategorySelectActions'
import DistributionCategorySelectDetail from '@/views/dam/distributionCategorySelect/components/DistributionCategorySelectDetail.vue'

const { loaded, fetchData, resetStore } = useDistributionCategorySelectDetailActions()

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
  <ActionbarTitleWrapper
    :heading="t('coreDam.distributionCategorySelect.meta.detail')"
    icon="mdi-folder-account-outline"
  />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_UPDATE">
      <AEditButton
        v-if="loaded"
        :record-id="id"
        :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.EDIT"
      ></AEditButton>
    </Acl>
    <ACloseButton :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.LIST"></ACloseButton>
  </ActionbarButtonsWrapper>
  <DistributionCategorySelectDetail></DistributionCategorySelectDetail>
</template>
