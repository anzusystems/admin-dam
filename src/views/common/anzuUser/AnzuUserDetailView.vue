<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onBeforeUnmount, onMounted } from 'vue'
import { AActionCloseButton, AActionEditButton, stringToInt } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'
import { damClient } from '@/services/api/clients/damClient'
import { useAnzuUserActions } from '@/views/common/anzuUser/composables/anzuUserActions'
import AnzuUserDetail from '@/views/common/anzuUser/components/AnzuUserDetail.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = stringToInt(route.params.id)

const { fetchAnzuUser, resetAnzuUserStore, loadingAnzuUser } = useAnzuUserActions(damClient)

const getDetail = () => {
  fetchAnzuUser(id)
}

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetAnzuUserStore()
})
</script>

<template>
  <ActionbarWrapper>
    <template #buttons>
      <Acl
        v-if="!loadingAnzuUser"
        :permission="ACL.DAM_USER_UPDATE"
      >
        <AActionEditButton
          :record-id="id"
          :route-name="ROUTE.COMMON.ANZU_USER.EDIT"
          :loading="loadingAnzuUser"
        />
      </Acl>
      <AActionCloseButton :route-name="ROUTE.COMMON.ANZU_USER.LIST" />
    </template>
  </ActionbarWrapper>

  <AnzuUserDetail :client="damClient" />
</template>
