<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onBeforeUnmount, onMounted } from 'vue'
import { AActionCloseButton, AActionEditButton, ACard, stringToInt } from '@anzusystems/common-admin'
import { damClient } from '@/services/api/clients/damClient'
import { useAnzuUserActions } from '@/views/common/anzuUser/composables/anzuUserActions'
import AnzuUserDetail from '@/views/common/anzuUser/components/AnzuUserDetail.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const route = useRoute()
const id = stringToInt(route.params.id)

const { fetchAnzuUser, resetAnzuUserStore, detailLoading } = useAnzuUserActions(damClient)

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
        v-if="!detailLoading"
        :permission="ACL.DAM_USER_UPDATE"
      >
        <AActionEditButton
          :record-id="id"
          :route-name="'/(common)/anzu-user/[id]/edit'"
          :loading="detailLoading"
        />
      </Acl>
      <AActionCloseButton :route-name="'/(common)/anzu-user'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AnzuUserDetail :client="damClient" />
    </VCardText>
  </ACard>
</template>
