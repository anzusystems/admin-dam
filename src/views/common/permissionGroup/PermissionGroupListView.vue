<script lang="ts" setup>
import PermissionGroupDatatable from '@/views/common/permissionGroup/components/PermissionGroupDatatable.vue'
import PermissionGroupCreateButton from '@/views/common/permissionGroup/components/PermissionGroupCreateButton.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { usePermissionGroupActions } from '@/views/common/permissionGroup/composables/permissionGroupActions'
import { damClient } from '@/services/api/clients/damClient'
import { ACard, useI18n } from '@anzusystems/common-admin'
import { ACL } from '@/composables/auth/auth'

const datatable = ref<InstanceType<typeof PermissionGroupDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}

const { listLoading } = usePermissionGroupActions(damClient)

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [{ title: t('breadcrumb.permissionGroup.list'), routeName: '/(common)/permission-groups' }])
)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl :permission="ACL.DAM_PERMISSION_GROUP_CREATE">
        <PermissionGroupCreateButton
          data-cy="button-create"
          disable-redirect
          :client="damClient"
          @after-create="afterCreate"
        />
      </Acl>
    </template>
  </ActionbarWrapper>

  <ACard :loading="listLoading">
    <VCardText>
      <PermissionGroupDatatable ref="datatable" />
    </VCardText>
  </ACard>
</template>
