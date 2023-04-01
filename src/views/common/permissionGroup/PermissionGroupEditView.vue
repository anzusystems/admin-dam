<script lang="ts" setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { AActionCloseButton, AActionSaveButton, ACard, stringToInt } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import PermissionGroupEditForm from '@/views/common/permissionGroup/components/PermissionGroupEditForm.vue'
import { damClient } from '@/services/api/clients/damClient'
import { usePermissionGroupActions } from '@/views/common/permissionGroup/composables/permissionGroupActions'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = stringToInt(route.params.id)

const { resetPermissionGroupStore, fetchPermissionGroup, updatePermissionGroup, detailLoading } =
  usePermissionGroupActions(damClient)

const getData = () => {
  fetchPermissionGroup(id)
}

onMounted(() => {
  getData()
})

onBeforeUnmount(() => {
  resetPermissionGroupStore()
})
</script>

<template>
  <ActionbarWrapper>
    <template #buttons>
      <AActionSaveButton
        :loading="detailLoading"
        @save-record="updatePermissionGroup"
      />
      <AActionCloseButton :route-name="ROUTE.COMMON.PERMISSION_GROUP.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <PermissionGroupEditForm :client="damClient" />
    </VCardText>
  </ACard>
</template>
