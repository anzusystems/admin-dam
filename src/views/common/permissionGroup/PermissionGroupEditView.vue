<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { AActionCloseButton, AActionSaveButton, ACard, defineBreadcrumbs, stringToInt, useI18n } from '@anzusystems/common-admin'
import PermissionGroupEditForm from '@/views/common/permissionGroup/components/PermissionGroupEditForm.vue'
import { damClient } from '@/services/api/clients/damClient'
import { usePermissionGroupActions } from '@/views/common/permissionGroup/composables/permissionGroupActions'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

const { resetPermissionGroupStore, fetchPermissionGroup, updatePermissionGroup, detailLoading, saveButtonLoading } =
  usePermissionGroupActions(damClient)

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.permissionGroup.list'), routeName: '/(common)/permission-group' },
    {
      title: t('breadcrumb.permissionGroup.edit'),
      routeName: '/(common)/permission-group/[id]/edit',
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
      <AActionSaveButton
        :loading="saveButtonLoading"
        @save-record="updatePermissionGroup"
      />
      <AActionCloseButton :route-name="'/(common)/permission-group'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <PermissionGroupEditForm :client="damClient" />
    </VCardText>
  </ACard>
</template>
