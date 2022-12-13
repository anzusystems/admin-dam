<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import ASaveButton from '@/components/common/buttons/action/ASaveButton.vue'
import ASaveAndCloseButton from '@/components/common/buttons/action/ASaveAndCloseButton.vue'
import ACloseButton from '@/components/common/buttons/action/ACloseButton.vue'
import { ROUTE } from '@/router/routes'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { useDistributionCategorySelectEditActions } from '@/views/dam/distributionCategorySelect/composables/distributionCategorySelectActions'
import DistributionCategorySelectEditForm from '@/views/dam/distributionCategorySelect/components/DistributionCategorySelectEditForm.vue'

const { t } = useI18n({ useScope: 'global' })

const route = useRoute()
const id = route.params.id.toString()

const { loaded, fetchData, resetStore, onUpdate } = useDistributionCategorySelectEditActions()

const getData = () => {
  fetchData(id)
}

onMounted(() => {
  getData()
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarTitleWrapper
    :heading="t('coreDam.distributionCategorySelect.meta.edit')"
    icon="mdi-folder-account-outline"
  />
  <ActionbarButtonsWrapper>
    <ASaveButton v-if="loaded" @save-record="onUpdate"></ASaveButton>
    <ASaveAndCloseButton v-if="loaded" @save-record-and-close="onUpdate(true)"></ASaveAndCloseButton>
    <ACloseButton :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.LIST"></ACloseButton>
  </ActionbarButtonsWrapper>
  <ACard loader="edit">
    <DistributionCategorySelectEditForm></DistributionCategorySelectEditForm>
  </ACard>
</template>
