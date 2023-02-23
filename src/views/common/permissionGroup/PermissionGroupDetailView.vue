<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onBeforeUnmount, onMounted } from 'vue'
import { AActionCloseButton } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { AActionEditButton } from '@anzusystems/common-admin'
import { ACL } from '@/types/Permission'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { toInt } from '@anzusystems/common-admin'
import { usePermissionGroupActions } from '@/views/common/permissionGroup/composables/permissionGroupActions'
import { damClient } from '@/services/api/clients/damClient'
import { AActionDeleteButton } from '@anzusystems/common-admin'
import PermissionGroupDetail from '@/views/common/permissionGroup/components/PermissionGroupDetail.vue'

const route = useRoute()
const id = toInt(route.params.id)

const {
  deletePermissionGroup,
  fetchPermissionGroup,
  resetPermissionGroupStore,
  loadingPermissionGroup,
  loadingDeletePermissionGroup,
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

const { t } = useI18n()
</script>

<template>
  <ActionbarTitleWrapper :heading="t('common.permissionGroup.meta.detail')" icon="mdi-folder-account-outline" />
  <ActionbarButtonsWrapper>
    <Acl v-if="!loadingPermissionGroup" :permission="ACL.DAM_PERMISSION_GROUP_UPDATE">
      <AActionEditButton
        :record-id="id"
        :route-name="ROUTE.COMMON.PERMISSION_GROUP.EDIT"
        :loading="loadingDeletePermissionGroup"
      />
    </Acl>
    <Acl v-if="!loadingPermissionGroup" :permission="ACL.DAM_PERMISSION_GROUP_DELETE">
      <AActionDeleteButton :loading="loadingDeletePermissionGroup" @delete-record="deletePermissionGroup(id)" />
    </Acl>
    <AActionCloseButton :route-name="ROUTE.COMMON.PERMISSION_GROUP.LIST" />
  </ActionbarButtonsWrapper>
  <PermissionGroupDetail :client="damClient" />
</template>
