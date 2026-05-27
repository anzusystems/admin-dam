<script lang="ts" setup>
import UserDetail from '@/views/coreDam/user/components/UserDetail.vue'
import { useUserDetailActions } from '@/views/coreDam/user/composables/userActions'
import { useRoute } from 'vue-router'
import { AActionCloseButton, AActionEditButton, ACard, stringToInt } from '@anzusystems/common-admin'
import { onBeforeUnmount, onMounted } from 'vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const { detailLoading, fetchData, resetStore, user } = useUserDetailActions()

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
  <ActionbarWrapper :last-breadcrumb-title="user.id + ''">
    <template #buttons>
      <Acl :permission="ACL.DAM_USER_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :record-id="id"
          :route-name="'/(coreDam)/user/[id]/edit'"
        />
        <AActionEditButton
          v-if="!detailLoading"
          :record-id="id"
          :route-name="'/(common)/anzu-user/[id]/edit'"
          variant="secondary"
          button-t="coreDam.user.button.editPermissions"
        />
      </Acl>
      <AActionCloseButton :route-name="'/(coreDam)/user'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <UserDetail />
    </VCardText>
  </ACard>
</template>
