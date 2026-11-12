<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionSaveButton,
  ACard,
  defineBreadcrumbs,
  stringToInt,
  useRecordPage,
} from '@anzusystems/common-admin'
import { onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import PermissionGroupEditForm from '@/domains/common/permissionGroup/components/PermissionGroupEditForm.vue'
import { usePermissionGroupActions } from '@/domains/common/permissionGroup/composables/permissionGroupActions'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { damClient } from '@/shared/apiClients/damClient'

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

const { resetPermissionGroupStore, fetchPermissionGroup, updatePermissionGroup, detailLoading, saveButtonLoading } =
  usePermissionGroupActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(() => [
  { title: t('breadcrumb.permissionGroup.list'), routeName: '/(common)/permission-groups-backup' },
  {
    title: t('breadcrumb.permissionGroup.edit'),
    routeName: '/(common)/permission-groups-backup/[id]/edit',
  },
])

useRecordPage({
  fallbackRouteName: '/(common)/permission-groups-backup',
  skipRouteNames: ['/(common)/permission-groups-backup/[id]'],
  loading: detailLoading,
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
        v-if="!detailLoading"
        :loading="saveButtonLoading"
        @save-record="updatePermissionGroup"
      />
      <AActionCloseButtonHistory
        :fallback-route-name="'/(common)/permission-groups-backup'"
        :skip-route-names="['/(common)/permission-groups-backup/[id]']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <PermissionGroupEditForm :client="damClient" />
    </VCardText>
  </ACard>
</template>
