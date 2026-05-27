<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import {
  AActionCloseButton,
  AActionDeleteButton,
  AActionEditButton,
  ACard,
  defineBreadcrumbs,
  stringToInt,
  useI18n,
} from '@anzusystems/common-admin'
import { usePermissionGroupActions } from '@/views/common/permissionGroup/composables/permissionGroupActions'
import { damClient } from '@/services/api/clients/damClient'
import PermissionGroupDetail from '@/views/common/permissionGroup/components/PermissionGroupDetail.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

const { deletePermissionGroup, fetchPermissionGroup, resetPermissionGroupStore, detailLoading } =
  usePermissionGroupActions(damClient)

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.permissionGroup.list'), routeName: '/(common)/permission-group' },
    {
      title: t('breadcrumb.permissionGroup.detail'),
      routeName: '/(common)/permission-group/[id]',
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
          :route-name="'/(common)/permission-group/[id]/edit'"
        />
      </Acl>
      <Acl
        v-if="!detailLoading"
        :permission="ACL.DAM_PERMISSION_GROUP_DELETE"
      >
        <AActionDeleteButton @delete-record="deletePermissionGroup(id)" />
      </Acl>
      <AActionCloseButton :route-name="'/(common)/permission-group'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <PermissionGroupDetail :client="damClient" />
    </VCardText>
  </ACard>
</template>
