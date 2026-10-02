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
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import DamTrackingFields from '@/domains/coreDam/shared/components/DamTrackingFields.vue'
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

const { signal, leave } = useRecordPage({
  fallbackRouteName: '/(common)/permission-groups-new',
  skipRouteNames: ['/(common)/permission-groups-new/[id]', '/(common)/permission-groups-new/new'],
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
      <AActionSaveButton
        v-if="!loadingPermissionGroup"
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
      >
        <template #tracking>
          <DamTrackingFields :data="permissionGroup" />
        </template>
      </APermissionGroupManage>
    </VCardText>
  </ACard>
</template>
