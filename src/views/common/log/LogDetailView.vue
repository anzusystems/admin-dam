<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onBeforeUnmount, onMounted } from 'vue'
import { AActionCloseButton, ACard } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useLogDetailActions } from '@/views/common/log/composables/logActions'
import LogDetail from '@/views/common/log/components/LogDetail.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = route.params.id as string
const system = route.params.system as string
const type = route.params.type as string

const { detailLoading, fetchData, resetStore } = useLogDetailActions()

const getDetail = () => {
  fetchData(id, system, type)
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
      <AActionCloseButton :route-name="ROUTE.COMMON.LOG.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <LogDetail />
    </VCardText>
  </ACard>
</template>
