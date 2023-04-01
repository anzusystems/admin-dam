<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onBeforeUnmount, onMounted } from 'vue'
import {
  AActionCloseButton,
  AActionDeleteButton,
  AActionEditButton,
  ACard,
  stringToInt,
} from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { ACL } from '@/types/Permission'
import { usePermissionGroupActions } from '@/views/common/permissionGroup/composables/permissionGroupActions'
import { damClient } from '@/services/api/clients/damClient'
import PermissionGroupDetail from '@/views/common/permissionGroup/components/PermissionGroupDetail.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = stringToInt(route.params.id)

const {
  deletePermissionGroup,
  fetchPermissionGroup,
  resetPermissionGroupStore,
  detailLoading,
} = usePermissionGroupActions(damClient)

const getDetail = () => {
  fetchPermissionGroup(id)
}

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetPermissionGroupStore()
})
</script>

<template>
  <ActionbarWrapper>
    <template #buttons>
      <Acl
        v-if="!detailLoading"
        :permission="ACL.DAM_PERMISSION_GROUP_UPDATE"
      >
        <AActionEditButton
          :record-id="id"
          :route-name="ROUTE.COMMON.PERMISSION_GROUP.EDIT"
        />
      </Acl>
      <Acl
        v-if="!detailLoading"
        :permission="ACL.DAM_PERMISSION_GROUP_DELETE"
      >
        <AActionDeleteButton
          @delete-record="deletePermissionGroup(id)"
        />
      </Acl>
      <AActionCloseButton :route-name="ROUTE.COMMON.PERMISSION_GROUP.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <PermissionGroupDetail :client="damClient" />
    </VCardText>
  </ACard>
</template>
