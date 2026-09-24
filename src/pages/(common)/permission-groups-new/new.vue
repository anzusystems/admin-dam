<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionSaveAndCloseButton,
  AActionSaveButton,
  ACard,
  APermissionGroupManage,
  defineBreadcrumbs,
  isNull,
  usePermissionGroupActions,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { ACL } from '@/domains/system/auth/auth'
import { damUserSystemDescriptor } from '@/domains/system/descriptors/userSystemDescriptor'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { damClient } from '@/shared/apiClients/damClient'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_PERMISSION_GROUP_CREATE],
    layout: 'AppLayoutDrawer',
  },
})

const {
  permissionGroup,
  loadingPermissionGroup,
  createPermissionGroup,
  loadingCreatePermissionGroup,
  resetPermissionGroupStore,
} = usePermissionGroupActions({
  client: damClient,
  system: 'dam',
  endPoint: damUserSystemDescriptor.endpoints.permissionGroup,
})

const router = useRouter()

// The library returns the saved record rather than navigating: it cannot know this app's typed
// route names.
const onCreate = async (close = false) => {
  const created = await createPermissionGroup()
  if (isNull(created)) return
  if (close) {
    router.push({ name: '/(common)/permission-groups-new' })

    return
  }
  router.push({ name: '/(common)/permission-groups-new/[id]', params: { id: String(created.id) } })
}

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.permissionGroup.list'), routeName: '/(common)/permission-groups-new' },
    {
      title: permissionGroup.value.title || t('breadcrumb.permissionGroup.create'),
      routeName: '/(common)/permission-groups-new/new',
    },
  ])
)

onMounted(() => {
  resetPermissionGroupStore()
})

onBeforeUnmount(() => {
  resetPermissionGroupStore()
})
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionSaveButton
        :loading="loadingCreatePermissionGroup"
        @save-record="onCreate()"
      />
      <AActionSaveAndCloseButton
        :loading="loadingCreatePermissionGroup"
        @save-record-and-close="onCreate(true)"
      />
      <AActionCloseButtonHistory :fallback-route-name="'/(common)/permission-groups-new'" />
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
