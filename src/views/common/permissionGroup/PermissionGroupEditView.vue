<script lang="ts" setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import ASaveButton from '@/components/common/buttons/action/ASaveButton.vue'
import ASaveAndCloseButton from '@/components/common/buttons/action/ASaveAndCloseButton.vue'
import ACloseButton from '@/components/common/buttons/action/ACloseButton.vue'
import { ROUTE } from '@/router/routes'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import PermissionGroupEditForm from '@/views/common/permissionGroup/components/PermissionGroupEditForm.vue'
import { damClient } from '@/services/api/clients/damClient'
import { toInt } from '@anzusystems/common-admin'
import { usePermissionGroupActions } from '@/views/common/permissionGroup/composables/permissionGroupActions'

const { t } = useI18n({ useScope: 'global' })

const route = useRoute()
const id = toInt(route.params.id)

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
  <ActionbarTitleWrapper :heading="t('common.permissionGroup.meta.edit')" icon="mdi-folder-account-outline" />
  <ActionbarButtonsWrapper>
    <ASaveButton @save-record="updatePermissionGroup" :loading="loadingUpdatePermissionGroup"></ASaveButton>
    <ASaveAndCloseButton
      @save-record-and-close="updatePermissionGroup(true)"
      :loading="loadingUpdatePermissionGroup"
    ></ASaveAndCloseButton>
    <ACloseButton :route-name="ROUTE.COMMON.PERMISSION_GROUP.LIST"></ACloseButton>
  </ActionbarButtonsWrapper>
  <PermissionGroupEditForm :client="damClient" />
</template>
