<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { AActionCloseButton, AActionEditButton, ACard, stringToInt } from '@anzusystems/common-admin'
import { onBeforeUnmount, onMounted } from 'vue'
import { ROUTE } from '@/router/routes'
import ExtSystemDetail from '@/views/coreDam/extSystem/components/ExtSystemDetail.vue'
import { useExtSystemDetailActions } from '@/views/coreDam/extSystem/composables/extSystemActions'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const { detailLoading, fetchData, resetStore, extSystem } = useExtSystemDetailActions()

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
  <ActionbarWrapper :last-breadcrumb-title="extSystem.name">
    <template #buttons>
      <Acl :permission="ACL.DAM_EXT_SYSTEM_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :record-id="id"
          :route-name="ROUTE.DAM.EXT_SYSTEM.EDIT"
        />
      </Acl>
      <AActionCloseButton :route-name="ROUTE.DAM.EXT_SYSTEM.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <ExtSystemDetail />
    </VCardText>
  </ACard>
</template>
