<script lang="ts" setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  AActionCloseButton,
  AActionSaveAndCloseButton,
  AActionSaveButton,
  stringToInt,
} from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import PermissionGroupEditForm from '@/views/common/permissionGroup/components/PermissionGroupEditForm.vue'
import { damClient } from '@/services/api/clients/damClient'
import { usePermissionGroupActions } from '@/views/common/permissionGroup/composables/permissionGroupActions'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = stringToInt(route.params.id)

const { resetPermissionGroupStore, fetchPermissionGroup, updatePermissionGroup, loadingUpdatePermissionGroup } =
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
        :loading="loadingUpdatePermissionGroup"
        @save-record="updatePermissionGroup"
      />
      <AActionSaveAndCloseButton
        :loading="loadingUpdatePermissionGroup"
        @save-record-and-close="updatePermissionGroup(true)"
      />
      <AActionCloseButton :route-name="ROUTE.COMMON.PERMISSION_GROUP.LIST" />
    </template>
  </ActionbarWrapper>

  <PermissionGroupEditForm :client="damClient" />
</template>
