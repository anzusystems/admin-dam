<script lang="ts" setup>
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { useI18n } from 'vue-i18n'
import { ACL } from '@/types/Permission'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { ref } from 'vue'
import PermissionGroupDatatable from '@/views/common/permissionGroup/components/PermissionGroupDatatable.vue'
import { damClient } from '@/services/api/clients/damClient'
import PermissionGroupCreateButton from '@/views/common/permissionGroup/components/PermissionGroupCreateButton.vue'

const { t } = useI18n()

const datatable = ref<InstanceType<typeof PermissionGroupDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}
</script>

<template>
  <ActionbarTitleWrapper :heading="t('common.permissionGroup.meta.list')" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_PERMISSION_GROUP_CREATE">
      <PermissionGroupCreateButton
        data-cy="button-create"
        disable-redirect
        :client="damClient"
        @after-create="afterCreate"
      />
    </Acl>
  </ActionbarButtonsWrapper>
  <PermissionGroupDatatable ref="datatable" :client="damClient" />
</template>
