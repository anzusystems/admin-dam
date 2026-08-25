<script lang="ts" setup>
import { AActionCloseButton, AActionDeleteButton, AActionEditButton, ACard, useI18n } from '@anzusystems/common-admin'
import { usePermissionGroupActions } from '@/domains/common/permissionGroup/composables/permissionGroupActions'
import { damClient } from '@/shared/apiClients/damClient'
import PermissionGroupDetail from '@/domains/common/permissionGroup/components/PermissionGroupDetail.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { ACL } from '@/domains/system/auth/auth'

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

const getDetail = () => {
  fetchPermissionGroup(id)
}

onMounted(() => {
  getDetail()
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
      <AActionCloseButton :route-name="'/(common)/permission-groups'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <PermissionGroupDetail :client="damClient" />
    </VCardText>
  </ACard>
</template>
