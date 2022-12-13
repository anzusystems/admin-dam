<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/permissionGroupApi'
import { useI18n } from 'vue-i18n'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import ATextField from '@/components/form/ATextField.vue'
import ARow from '@/components/common/ARow.vue'
import UserSelect from '@/views/dam/user/components/UserSelect.vue'
import { usePermissionGroupEditActions } from '@/views/dam/permissionGroup/composables/permissionGroupActions'
import { usePermissionGroupValidation } from '@/views/dam/permissionGroup/composables/permissionGroupValidation'
import PermissionList from '@/views/dam/permissionGroup/components/PermissionList.vue'

const { loaded, permissionGroup } = usePermissionGroupEditActions()

const { v$ } = usePermissionGroupValidation(permissionGroup)

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <VRow>
      <VCol cols="12" md="8">
        <ARow>
          <ATextField
            v-model="permissionGroup.title"
            :v="v$.permissionGroup.title"
            data-cy="permission-group-title"
          ></ATextField>
        </ARow>
        <ARow>
          <ATextField
            v-model="permissionGroup.description"
            :v="v$.permissionGroup.description"
            data-cy="permission-group-description"
          ></ATextField>
        </ARow>
        <ARow>
          <UserSelect
            :label="t('coreDam.permissionGroup.model.users')"
            multiple
            v-model="permissionGroup.users"
            data-cy="ext-system-users"
          ></UserSelect>
        </ARow>
        <ARow>
          <VCol cols="12">
            <PermissionList v-if="loaded" v-model="permissionGroup.permissions"></PermissionList>
          </VCol>
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
