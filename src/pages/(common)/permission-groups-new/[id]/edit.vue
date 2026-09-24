<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionSaveButton,
  ACard,
  APermissionGroupManage,
  defineBreadcrumbs,
  stringToInt,
  usePermissionGroupActions,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { ACL } from '@/domains/system/auth/auth'
import { damUserSystemDescriptor } from '@/domains/system/descriptors/userSystemDescriptor'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { damClient } from '@/shared/apiClients/damClient'

definePage({
  path: '/permission-groups-new/:id(\\d+)/edit',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_PERMISSION_GROUP_UPDATE],
    layout: 'AppLayoutDrawer',
  },
})

const route = useRoute('/(common)/permission-groups-new/[id]/edit')
const id = stringToInt(route.params.id)

const {
  permissionGroup,
  loadingPermissionGroup,
  loadingUpdatePermissionGroup,
  fetchPermissionGroup,
  updatePermissionGroup,
  resetPermissionGroupStore,
} = usePermissionGroupActions({
  client: damClient,
  system: 'dam',
  endPoint: damUserSystemDescriptor.endpoints.permissionGroup,
})

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.permissionGroup.list'), routeName: '/(common)/permission-groups-new' },
    {
      title: permissionGroup.value.title || t('breadcrumb.permissionGroup.edit'),
      routeName: '/(common)/permission-groups-new/[id]/edit',
      id,
    },
  ])
)

onMounted(() => {
  fetchPermissionGroup(id)
})

onBeforeUnmount(() => {
  resetPermissionGroupStore()
})
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionSaveButton
        :loading="loadingUpdatePermissionGroup"
        @save-record="updatePermissionGroup"
      />
      <AActionCloseButtonHistory
        :fallback-route-name="'/(common)/permission-groups-new'"
        :skip-route-names="['/(common)/permission-groups-new/[id]', '/(common)/permission-groups-new/new']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="loadingPermissionGroup">
    <VCardText>
      <APermissionGroupManage
        :client="damClient"
        system="dam"
      />
    </VCardText>
  </ACard>
</template>
