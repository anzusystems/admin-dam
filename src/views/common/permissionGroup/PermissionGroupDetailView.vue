<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onBeforeUnmount, onMounted } from 'vue'
import ACloseButton from '@/components/common/buttons/action/ACloseButton.vue'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import AEditButton from '@/components/common/buttons/action/AEditButton.vue'
import { ACL } from '@/types/Permission'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { toInt } from '@anzusystems/common-admin'
import { usePermissionGroupActions } from '@/views/common/permissionGroup/composables/permissionGroupActions'
import { damClient } from '@/services/api/clients/damClient'
import ADeleteButton from '@/components/common/buttons/action/ADeleteButton.vue'
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

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ActionbarTitleWrapper :heading="t('common.permissionGroup.meta.detail')" icon="mdi-folder-account-outline" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_PERMISSION_GROUP_UPDATE" v-if="!loadingPermissionGroup">
      <AEditButton
        :record-id="id"
        :route-name="ROUTE.COMMON.PERMISSION_GROUP.EDIT"
        :loading="loadingDeletePermissionGroup"
      ></AEditButton>
    </Acl>
    <Acl :permission="ACL.DAM_PERMISSION_GROUP_DELETE" v-if="!loadingPermissionGroup">
      <ADeleteButton @delete-record="deletePermissionGroup(id)" :loading="loadingDeletePermissionGroup"></ADeleteButton>
    </Acl>
    <ACloseButton :route-name="ROUTE.COMMON.PERMISSION_GROUP.LIST"></ACloseButton>
  </ActionbarButtonsWrapper>
  <PermissionGroupDetail :client="damClient" />
</template>
