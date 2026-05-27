<script lang="ts" setup>
import { AActionCloseButton, AActionEditButton, ACard, useI18n } from '@anzusystems/common-admin'
import ExtSystemDetail from '@/views/coreDam/extSystem/components/ExtSystemDetail.vue'
import { useExtSystemDetailActions } from '@/views/coreDam/extSystem/composables/extSystemActions'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const { detailLoading, fetchData, resetStore, extSystem } = useExtSystemDetailActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.extSystem.list'), routeName: '/(coreDam)/ext-system' },
    {
      title: extSystem.value.name || t('breadcrumb.coreDam.extSystem.detail'),
      routeName: '/(coreDam)/ext-system/[id]',
    },
  ])
)

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

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
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl :permission="ACL.DAM_EXT_SYSTEM_UPDATE">
        <AActionEditButton v-if="!detailLoading" :record-id="id" :route-name="'/(coreDam)/ext-system/[id]/edit'" />
      </Acl>
      <AActionCloseButton :route-name="'/(coreDam)/ext-system'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <ExtSystemDetail />
    </VCardText>
  </ACard>
</template>
