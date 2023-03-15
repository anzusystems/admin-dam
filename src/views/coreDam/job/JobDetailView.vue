<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { AActionCloseButton, ACard, stringToInt } from '@anzusystems/common-admin'
import { onBeforeUnmount, onMounted } from 'vue'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import { useJobDetailActions } from '@/views/coreDam/job/composables/jobActions'
import JobDetail from '@/views/coreDam/job/components/JobDetail.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'

const { detailLoading, fetchData, resetStore } = useJobDetailActions()

const route = useRoute()
const id = stringToInt(route.params.id)

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
  <ActionbarTitleWrapper :heading="t('common.job.meta.detail')" />
  <ActionbarButtonsWrapper>
    <AActionCloseButton :route-name="ROUTE.DAM.JOB.LIST" />
  </ActionbarButtonsWrapper>
  <ACard :loading="detailLoading">
    <JobDetail />
  </ACard>
</template>
