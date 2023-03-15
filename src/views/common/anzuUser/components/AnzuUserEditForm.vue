<script lang="ts" setup>
import { ACopyText, AFormTextField, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import { useAnzuUserActions } from '@/views/common/anzuUser/composables/anzuUserActions'
import type { AxiosInstance } from 'axios'
import PermissionEditor from '@/views/common/permission/components/PermissionEditor.vue'
import { useI18n } from 'vue-i18n'
import PermissionGroupSelect from '@/views/common/permissionGroup/components/PermissionGroupSelect.vue'
import AnzuUserRoleSelect from '@/views/common/anzuUser/components/AnzuUserRoleSelect.vue'
import { computed } from 'vue'
import { usePermissionActions } from '@/views/common/permission/composables/permissionActions'
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
const { t } = useI18n()
</script>

<template>
  <ASystemEntityScope system="common" :subject="ENTITY">
    <VRow>
      <VCol cols="12">
        <VCard :loading="loadingAnzuUser" variant="flat">
          <VCardText>
            <VRow>
              <VCol cols="12" sm="3">
                <AFormTextField v-if="!isEdit" v-model.number="anzuUser.id" :v="v$.anzuUser.id" />
                <ARow v-else :title="t('common.anzuUser.model.id')">
                  <ACopyText :value="anzuUser.id" />
                </ARow>
              </VCol>
              <VCol cols="12" sm="7">
                <AFormTextField v-model="anzuUser.email" :v="v$.anzuUser.email" />
              </VCol>
              <VCol cols="12" sm="2">
                <VSwitch
                  v-model="anzuUser.enabled"
                  :label="t('common.anzuUser.model.enabled')"
                  color="success"
                  density="compact"
                  hide-details
                />
              </VCol>
            </VRow>
            <VRow>
              <VCol cols="12" sm="3">
                <AFormTextField v-model="anzuUser.person.firstName" :v="v$.anzuUser.person.firstName"></AFormTextField>
              </VCol>
              <VCol cols="12" sm="3">
                <AFormTextField v-model="anzuUser.person.lastName" :v="v$.anzuUser.person.lastName"></AFormTextField>
              </VCol>
              <VCol cols="12" sm="6">
                <AFormTextField v-model="anzuUser.person.fullName" :v="v$.anzuUser.person.fullName"></AFormTextField>
              </VCol>
            </VRow>
            <VRow>
              <VCol cols="12" sm="3">
                <AFormTextField v-model="anzuUser.avatar.color" :v="v$.anzuUser.avatar.color"></AFormTextField>
              </VCol>
              <VCol cols="12" sm="3">
                <AFormTextField v-model="anzuUser.avatar.text" :v="v$.anzuUser.avatar.text"></AFormTextField>
              </VCol>
            </VRow>
            <VRow>
              <VCol cols="12" sm="3">
                <AnzuUserRoleSelect v-model="anzuUser.roles" :client="client" />
              </VCol>
              <VCol cols="12" sm="9">
                <PermissionGroupSelect
                  v-model="anzuUser.permissionGroups"
                  :client="client"
                  :label="t('common.anzuUser.model.permissionGroups')"
                  multiple
                  clearable
                />
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
        />
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
