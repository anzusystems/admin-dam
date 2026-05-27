<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, useI18n } from '@anzusystems/common-admin'
import PermissionGroupEditForm from '@/views/common/permissionGroup/components/PermissionGroupEditForm.vue'
import { damClient } from '@/services/api/clients/damClient'
import { usePermissionGroupActions } from '@/views/common/permissionGroup/composables/permissionGroupActions'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

const { resetPermissionGroupStore, fetchPermissionGroup, updatePermissionGroup, detailLoading, saveButtonLoading } =
  usePermissionGroupActions(damClient)

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.permissionGroup.list'), routeName: '/(common)/permission-groups' },
    {
      title: t('breadcrumb.permissionGroup.edit'),
      routeName: '/(common)/permission-groups/[id]/edit',
    },
  ])
)

const getData = () => {
  fetchPermissionGroup(id)
}

onMounted(() => {
  getData()
})

onBeforeUnmount(() => {
  resetPermissionGroupStore()
})
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionSaveButton :loading="saveButtonLoading" @save-record="updatePermissionGroup" />
      <AActionCloseButton :route-name="'/(common)/permission-groups'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <PermissionGroupEditForm :client="damClient" />
    </VCardText>
  </ACard>
</template>
