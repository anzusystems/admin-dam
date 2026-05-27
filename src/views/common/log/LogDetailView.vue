<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { AActionCloseButton, ACard, defineBreadcrumbs, useI18n } from '@anzusystems/common-admin'
import { useLogDetailActions } from '@/views/common/log/composables/logActions'
import LogDetail from '@/views/common/log/components/LogDetail.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = (route.params as { id: string }).id
const system = (route.params as { system: string }).system
const type = (route.params as { type: string }).type

const { detailLoading, fetchData, resetStore } = useLogDetailActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.log.list'), routeName: '/(common)/log' },
    {
      title: t('breadcrumb.log.detail'),
      routeName: '/(common)/log/[system]/[type]/[id]',
    },
  ])
)

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
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
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
