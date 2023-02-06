<script lang="ts" setup>
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { useAnzuUserActions } from '@/views/common/anzuUser/composables/anzuUserActions'
import type { AxiosInstance } from 'axios'
import PermissionEditor from '@/views/common/permission/components/PermissionEditor.vue'
import { useI18n } from 'vue-i18n'
import PermissionGroupSelect from '@/views/common/permissionGroup/components/PermissionGroupSelect.vue'
import AnzuUserRoleSelect from '@/views/common/anzuUser/components/AnzuUserRoleSelect.vue'
import ACopyText from '@/components/common/ACopyText.vue'
import { computed } from 'vue'
import { usePermissionActions } from '@/views/common/permission/composables/permissionActions'
import ATextField from '@/components/form/ATextField.vue'
import ARow from '@/components/common/ARow.vue'
import { useAnzuUserValidation } from '@/views/common/anzuUser/composables/anzuUserValidations'
import { ENTITY } from '@/services/api/common/anzuUserApi'

const props = defineProps<{
  client: () => AxiosInstance
  isEdit?: boolean
}>()
const { anzuUser, loadingAnzuUser } = useAnzuUserActions(props.client)
const { resolvePermissions } = usePermissionActions()
const resolvedPermissions = computed(() => {
  return resolvePermissions(anzuUser.value)
})
const { v$ } = useAnzuUserValidation(anzuUser)
const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ASystemEntityScope system="common" :subject="ENTITY">
    <VRow>
      <VCol cols="12">
        <VCard :loading="loadingAnzuUser" variant="flat">
          <VCardText>
            <VRow>
              <VCol cols="12" sm="3">
                <ATextField v-if="!isEdit" v-model.number="anzuUser.id" :v="v$.anzuUser.id"></ATextField>
                <ARow v-else :title="t('common.anzuUser.model.id')">
                  <ACopyText :value="anzuUser.id"></ACopyText>
                </ARow>
              </VCol>
              <VCol cols="12" sm="7">
                <ATextField v-model="anzuUser.email" :v="v$.anzuUser.email"></ATextField>
              </VCol>
              <VCol cols="12" sm="2">
                <VSwitch
                  v-model="anzuUser.enabled"
                  :label="t('common.anzuUser.model.enabled')"
                  color="success"
                  density="compact"
                  hide-details
                ></VSwitch>
              </VCol>
            </VRow>
            <VRow>
              <VCol cols="12" sm="3">
                <AnzuUserRoleSelect v-model="anzuUser.roles" :client="client"></AnzuUserRoleSelect>
              </VCol>
              <VCol cols="12" sm="9">
                <PermissionGroupSelect
                  v-model="anzuUser.permissionGroups"
                  :client="client"
                  :label="t('common.anzuUser.model.permissionGroups')"
                  multiple
                  clearable
                ></PermissionGroupSelect>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12">
        <PermissionEditor
          v-model="anzuUser.permissions"
          :resolved-permissions="resolvedPermissions"
          :roles="anzuUser.roles"
          :client="client"
          is-edit
        ></PermissionEditor>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
