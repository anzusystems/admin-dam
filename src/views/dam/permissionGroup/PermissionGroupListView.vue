<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import PermissionGroupDatatable from '@/views/dam/permissionGroup/components/PermissionGroupDatatable.vue'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { useI18n } from 'vue-i18n'
import PermissionGroupCreateButton from '@/views/dam/permissionGroup/components/PermissionGroupCreateButton.vue'
import { ACL } from '@/types/Permission'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { ref } from 'vue'

const { t } = useI18n({ useScope: 'global' })

const datatable = ref<InstanceType<typeof PermissionGroupDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.permissionGroup.meta.list')" icon="mdi-folder-account-outline" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_PERMISSION_GROUP_CREATE">
      <PermissionGroupCreateButton data-cy="button-create" disable-redirect @after-create="afterCreate" />
    </Acl>
  </ActionbarButtonsWrapper>
  <ACard loader="list">
    <PermissionGroupDatatable ref="datatable" />
  </ACard>
</template>
