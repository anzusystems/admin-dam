<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionSaveButton,
  ACard,
  APermissionGroupManage,
  defineBreadcrumbs,
  stringToInt,
  usePermissionGroupActions,
  useRecordPage,
} from '@anzusystems/common-admin'
import { onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import DamTrackingFields from '@/domains/coreDam/shared/components/DamTrackingFields.vue'
import { ACL } from '@/domains/system/auth/auth'
import { damUserSystemDescriptor } from '@/domains/system/descriptors/userSystemDescriptor'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { damClient } from '@/shared/apiClients/damClient'

definePage({
  path: '/permission-groups/:id(\\d+)/edit',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_PERMISSION_GROUP_UPDATE],
    layout: 'AppLayoutDrawer',
  },
})

const route = useRoute('/(common)/permission-groups/[id]/edit')
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

const breadcrumbs = defineBreadcrumbs(() => [
  { title: t('breadcrumb.permissionGroup.list'), routeName: '/(common)/permission-groups' },
  {
    title: permissionGroup.value.title || t('breadcrumb.permissionGroup.edit'),
    routeName: '/(common)/permission-groups/[id]/edit',
    id,
  },
])

useRecordPage({
  fallbackRouteName: '/(common)/permission-groups',
  skipRouteNames: ['/(common)/permission-groups/[id]', '/(common)/permission-groups/new'],
  loading: loadingPermissionGroup,
  load: (signal) => fetchPermissionGroup(id, { signal }),
})

onBeforeUnmount(() => {
  resetPermissionGroupStore()
})
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionSaveButton
        v-if="!loadingPermissionGroup"
        :loading="loadingUpdatePermissionGroup"
        @save-record="updatePermissionGroup"
      />
      <AActionCloseButtonHistory
        :fallback-route-name="'/(common)/permission-groups'"
        :skip-route-names="['/(common)/permission-groups/[id]', '/(common)/permission-groups/new']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="loadingPermissionGroup">
    <VCardText>
      <APermissionGroupManage
        :client="damClient"
        system="dam"
      >
        <template #tracking>
          <DamTrackingFields :data="permissionGroup" />
        </template>
      </APermissionGroupManage>
    </VCardText>
  </ACard>
</template>
