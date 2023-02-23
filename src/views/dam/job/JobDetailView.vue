<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { ACard, toInt } from '@anzusystems/common-admin'
import { onBeforeUnmount, onMounted } from 'vue'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import { useJobDetailActions } from '@/views/dam/job/composables/jobActions'
import JobDetail from '@/views/dam/job/components/JobDetail.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import ACloseButton from '@/components/common/buttons/action/ACloseButton.vue'

const { detailLoading, fetchData, resetStore } = useJobDetailActions()

const route = useRoute()
const id = toInt(route.params.id)

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
  <ActionbarTitleWrapper :heading="t('job.meta.detail')" icon="mdi-folder-account-outline" />
  <ActionbarButtonsWrapper>
    <ACloseButton :route-name="ROUTE.DAM.JOB.LIST" />
  </ActionbarButtonsWrapper>
  <ACard :loading="detailLoading">
    <JobDetail />
  </ACard>
</template>
