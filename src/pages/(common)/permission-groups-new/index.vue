<script lang="ts" setup>
import { AActionCreateButton, ACard, APermissionGroupDatatable, defineBreadcrumbs } from '@anzusystems/common-admin'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { ACL, useAuth } from '@/domains/system/auth/auth'
import { damUserSystemDescriptor } from '@/domains/system/descriptors/userSystemDescriptor'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { damClient } from '@/shared/apiClients/damClient'

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
