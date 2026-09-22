<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionDeleteButton,
  AActionEditButton,
  ACard,
  AUserAndTimeTrackingFields,
} from '@anzusystems/common-admin'
import { APermissionGroupDetail, usePermissionGroupActions } from '@anzusystems/common-admin/labs'
import { ACL, useAuth } from '@/domains/system/auth/auth'
import { damClient } from '@/shared/apiClients/damClient'
import { damUserSystemDescriptor } from '@/domains/system/descriptors/userSystemDescriptor'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

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

const router = useRouter()

const onDelete = async () => {
  if (await deletePermissionGroup(id)) {
    router.push({ name: '/(common)/permission-groups-new' })
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
          <AUserAndTimeTrackingFields :data="permissionGroup" />
        </template>
      </APermissionGroupDetail>
    </VCardText>
  </ACard>
</template>
