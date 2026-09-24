<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionSaveButton,
  ACard,
  defineBreadcrumbs,
  stringToInt,
  useI18n,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
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
      <AActionSaveButton
        :loading="saveButtonLoading"
        @save-record="updatePermissionGroup"
      />
      <AActionCloseButtonHistory
        :fallback-route-name="'/(common)/permission-groups'"
        :skip-route-names="['/(common)/permission-groups/[id]']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <PermissionGroupEditForm :client="damClient" />
    </VCardText>
  </ACard>
</template>
