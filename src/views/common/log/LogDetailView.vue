<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onBeforeUnmount, onMounted } from 'vue'
import { AActionCloseButton, ACard } from '@anzusystems/common-admin'
import { useLogDetailActions } from '@/views/common/log/composables/logActions'
import LogDetail from '@/views/common/log/components/LogDetail.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = (route.params as { id: string }).id
const system = (route.params as { system: string }).system
const type = (route.params as { type: string }).type

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
      <AActionCloseButton :route-name="'/(common)/log'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <LogDetail />
    </VCardText>
  </ACard>
</template>
