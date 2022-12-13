<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onBeforeUnmount, onMounted } from 'vue'
import ACloseButton from '@/components/common/buttons/action/ACloseButton.vue'
import { ROUTE } from '@/router/routes'
import { useLogDetailActions } from '@/views/common/log/composables/logActions'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import LogDetail from '@/views/common/log/components/LogDetail.vue'

const route = useRoute()
const id = route.params.id as string
const system = route.params.system as string
const type = route.params.type as string

const { fetchData, resetStore } = useLogDetailActions()

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
    <ACloseButton :route-name="ROUTE.COMMON.LOG.LIST"></ACloseButton>
  </ActionbarTitleWrapper>
  <LogDetail></LogDetail>
</template>
