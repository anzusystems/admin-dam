<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionDeleteButton,
  AActionEditButton,
  ACard,
  defineBreadcrumbs,
  stringToInt,
  useRecordPage,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import PermissionGroupDetail from '@/domains/common/permissionGroup/components/PermissionGroupDetail.vue'
import { usePermissionGroupActions } from '@/domains/common/permissionGroup/composables/permissionGroupActions'
import { ACL } from '@/domains/system/auth/auth'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { damClient } from '@/shared/apiClients/damClient'

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

const { deletePermissionGroup, fetchPermissionGroup, resetPermissionGroupStore, detailLoading } =
  usePermissionGroupActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.permissionGroup.list'), routeName: '/(common)/permission-groups' },
    {
      title: t('breadcrumb.permissionGroup.detail'),
      routeName: '/(common)/permission-groups/[id]',
    },
  ])
)

const { signal, leave } = useRecordPage({
  fallbackRouteName: '/(common)/permission-groups',
  skipRouteNames: ['/(common)/permission-groups/[id]/edit'],
  loading: detailLoading,
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
      <Acl
        v-if="!detailLoading"
        :permission="ACL.DAM_PERMISSION_GROUP_UPDATE"
      >
        <AActionEditButton
          :record-id="id"
          :route-name="'/(common)/permission-groups/[id]/edit'"
        />
      </Acl>
      <Acl
        v-if="!detailLoading"
        :permission="ACL.DAM_PERMISSION_GROUP_DELETE"
      >
        <AActionDeleteButton @delete-record="deletePermissionGroup(id)" />
      </Acl>
      <AActionCloseButtonHistory
        :fallback-route-name="'/(common)/permission-groups'"
        :skip-route-names="['/(common)/permission-groups/[id]/edit']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <PermissionGroupDetail :client="damClient" />
    </VCardText>
  </ACard>
</template>
