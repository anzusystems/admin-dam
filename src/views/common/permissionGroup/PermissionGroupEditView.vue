<script lang="ts" setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { AActionSaveButton } from '@anzusystems/common-admin'
import { AActionSaveAndCloseButton } from '@anzusystems/common-admin'
import { AActionCloseButton } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import PermissionGroupEditForm from '@/views/common/permissionGroup/components/PermissionGroupEditForm.vue'
import { damClient } from '@/services/api/clients/damClient'
import { stringToInt } from '@anzusystems/common-admin'
import { usePermissionGroupActions } from '@/views/common/permissionGroup/composables/permissionGroupActions'

const { t } = useI18n()

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
  <ActionbarTitleWrapper :heading="t('common.permissionGroup.meta.edit')" />
  <ActionbarButtonsWrapper>
    <AActionSaveButton :loading="loadingUpdatePermissionGroup" @save-record="updatePermissionGroup" />
    <AActionSaveAndCloseButton
      :loading="loadingUpdatePermissionGroup"
      @save-record-and-close="updatePermissionGroup(true)"
    />
    <AActionCloseButton :route-name="ROUTE.COMMON.PERMISSION_GROUP.LIST" />
  </ActionbarButtonsWrapper>
  <PermissionGroupEditForm :client="damClient" />
</template>
