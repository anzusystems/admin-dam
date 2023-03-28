<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { AActionCloseButton, ACard, stringToInt } from '@anzusystems/common-admin'
import { onBeforeUnmount, onMounted } from 'vue'
import { ROUTE } from '@/router/routes'
import { useJobDetailActions } from '@/views/coreDam/job/composables/jobActions'
import JobDetail from '@/views/coreDam/job/components/JobDetail.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

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
</script>

<template>
  <ActionbarWrapper>
    <template #buttons>
      <AActionCloseButton :route-name="ROUTE.DAM.JOB.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <JobDetail />
    </VCardText>
  </ACard>
</template>
