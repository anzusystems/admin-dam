<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onBeforeUnmount, onMounted } from 'vue'
import { AActionCloseButton, ACard } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useLogDetailActions } from '@/views/common/log/composables/logActions'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import LogDetail from '@/views/common/log/components/LogDetail.vue'

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
  <ActionbarTitleWrapper>
    <AActionCloseButton :route-name="ROUTE.COMMON.LOG.LIST" />
  </ActionbarTitleWrapper>
  <ACard :loading="detailLoading">
    <LogDetail />
  </ACard>
</template>
