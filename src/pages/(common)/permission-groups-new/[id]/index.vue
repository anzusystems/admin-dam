<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionDeleteButton,
  AActionEditButton,
  ACard,
  APermissionGroupDetail,
  defineBreadcrumbs,
  stringToInt,
  usePageNavigation,
  usePermissionGroupActions,
  useRecordPage,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import DamTrackingFields from '@/domains/coreDam/shared/components/DamTrackingFields.vue'
import { ACL, useAuth } from '@/domains/system/auth/auth'
import { damUserSystemDescriptor } from '@/domains/system/descriptors/userSystemDescriptor'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { damClient } from '@/shared/apiClients/damClient'

definePage({
  path: '/permission-groups-new/:id(\\d+)',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_PERMISSION_GROUP_UI],
    layout: 'AppLayoutDrawer',
  },
})

const route = useRoute('/(common)/permission-groups-new/[id]')
const id = stringToInt(route.params.id)

const { can } = useAuth()
const {
  permissionGroup,
  loadingPermissionGroup,
  loadingDeletePermissionGroup,
  fetchPermissionGroup,
  deletePermissionGroup,
  resetPermissionGroupStore,
} = usePermissionGroupActions({
  client: damClient,
  system: 'dam',
  endPoint: damUserSystemDescriptor.endpoints.permissionGroup,
})

const { push } = usePageNavigation()

const onDelete = async () => {
  if (await deletePermissionGroup(id)) {
    push({ name: '/(common)/permission-groups-new' })
  }
}

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.permissionGroup.list'), routeName: '/(common)/permission-groups-new' },
    {
      title: permissionGroup.value.title || t('breadcrumb.permissionGroup.detail'),
      routeName: '/(common)/permission-groups-new/[id]',
      id,
    },
  ])
)

const { signal, leave } = useRecordPage({
  fallbackRouteName: '/(common)/permission-groups-new',
  skipRouteNames: ['/(common)/permission-groups-new/[id]/edit', '/(common)/permission-groups-new/new'],
  loading: loadingPermissionGroup,
})

onMounted(async () => {
  if ((await fetchPermissionGroup(id, { signal })) === false) await leave()
})

onBeforeUnmount(() => {
  resetPermissionGroupStore()
})
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionEditButton
        v-if="!loadingPermissionGroup && can(ACL.DAM_PERMISSION_GROUP_UPDATE)"
        :record-id="id"
        :route-name="'/(common)/permission-groups-new/[id]/edit'"
        :loading="loadingDeletePermissionGroup"
      />
      <AActionDeleteButton
        v-if="!loadingPermissionGroup && can(ACL.DAM_PERMISSION_GROUP_DELETE)"
        :loading="loadingDeletePermissionGroup"
        @delete-record="onDelete"
      />
      <AActionCloseButtonHistory
        :fallback-route-name="'/(common)/permission-groups-new'"
        :skip-route-names="['/(common)/permission-groups-new/[id]/edit', '/(common)/permission-groups-new/new']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="loadingPermissionGroup">
    <VCardText>
      <APermissionGroupDetail
        :client="damClient"
        system="dam"
      >
        <!-- Created and modified by whom -- what every group detail this replaces showed. -->
        <template #tracking>
          <DamTrackingFields :data="permissionGroup" />
        </template>
      </APermissionGroupDetail>
    </VCardText>
  </ACard>
</template>
