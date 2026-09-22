<script lang="ts" setup>
import { AActionCreateButton, ACard } from '@anzusystems/common-admin'
import { APermissionGroupDatatable } from '@anzusystems/common-admin/labs'
import { ACL, useAuth } from '@/domains/system/auth/auth'
import { damClient } from '@/shared/apiClients/damClient'
import { damUserSystemDescriptor } from '@/domains/system/descriptors/userSystemDescriptor'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_PERMISSION_GROUP_UI],
    layout: 'AppLayoutDrawer',
  },
})

const { can } = useAuth()
const router = useRouter()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [{ title: t('breadcrumb.permissionGroup.list'), routeName: '/(common)/permission-groups-new' }])
)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionCreateButton
        v-if="can(ACL.DAM_PERMISSION_GROUP_CREATE)"
        :route-name="'/(common)/permission-groups-new/new'"
      />
    </template>
  </ActionbarWrapper>

  <ACard>
    <VCardText>
      <APermissionGroupDatatable
        :client="damClient"
        system="dam"
        :end-point="damUserSystemDescriptor.endpoints.permissionGroup"
        :can-update="can(ACL.DAM_PERMISSION_GROUP_UPDATE)"
        :detail-route="(item) => ({ name: '/(common)/permission-groups-new/[id]', params: { id: String(item.id) } })"
        :edit-route="(item) => ({ name: '/(common)/permission-groups-new/[id]/edit', params: { id: String(item.id) } })"
        @row-click="
          (item) => router.push({ name: '/(common)/permission-groups-new/[id]', params: { id: String(item.id) } })
        "
      />
    </VCardText>
  </ACard>
</template>
