<script lang="ts" setup>
import { AAvatarColorPicker, ACopyText, AFormTextField, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import { useAnzuUserActions } from '@/views/common/anzuUser/composables/anzuUserActions'
import type { AxiosInstance } from 'axios'
import PermissionEditor from '@/views/common/permission/components/PermissionEditor.vue'
import { useI18n } from 'vue-i18n'
import PermissionGroupRemoteAutocomplete from '@/views/common/permissionGroup/components/PermissionGroupRemoteAutocomplete.vue'
import AnzuUserRoleSelect from '@/views/common/anzuUser/components/AnzuUserRoleSelect.vue'
import { computed } from 'vue'
import { usePermissionActions } from '@/views/common/permission/composables/permissionActions'
import { useAnzuUserEditValidation } from '@/views/common/anzuUser/composables/anzuUserValidations'
import { ENTITY } from '@/services/api/common/anzuUserApi'

const props = defineProps<{
  client: () => AxiosInstance
  isEdit?: boolean
}>()

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const { anzuUser } = useAnzuUserActions(props.client)
const { resolvePermissions } = usePermissionActions()
const resolvedPermissions = computed(() => {
  return resolvePermissions(anzuUser.value)
})
const { v$ } = useAnzuUserEditValidation(anzuUser)
const { t } = useI18n()

const autoFillTexts = () => {
  if (anzuUser.value.person.firstName.length === 0 || anzuUser.value.person.lastName.length === 0) return
  if (anzuUser.value.person.fullName.length === 0) {
    anzuUser.value.person.fullName = anzuUser.value.person.firstName + ' ' + anzuUser.value.person.lastName
  }
  if (anzuUser.value.avatar.text.length === 0) {
    anzuUser.value.avatar.text =
      anzuUser.value.person.firstName.slice(0, 1) + anzuUser.value.person.lastName.slice(0, 1)
  }
}
</script>

<template>
  <ASystemEntityScope
    system="common"
    :subject="ENTITY"
  >
    <VRow>
      <VCol cols="12">
        <VRow>
          <VCol
            cols="12"
            sm="3"
          >
            <AFormTextField
              v-if="!isEdit"
              v-model.number="anzuUser.id"
              :v="v$.anzuUser.id"
            />
            <ARow
              v-else
              :title="t('common.anzuUser.model.id')"
            >
              <ACopyText :value="`${anzuUser.id}`" />
            </ARow>
          </VCol>
          <VCol
            cols="12"
            sm="7"
          >
            <AFormTextField
              v-model="anzuUser.email"
              :v="v$.anzuUser.email"
            />
          </VCol>
          <VCol
            cols="12"
            sm="2"
          >
            <VSwitch
              v-model="anzuUser.enabled"
              :label="t('common.anzuUser.model.enabled')"
              color="success"
              density="compact"
              data-cy="enable-switch"
              hide-details
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="12"
            sm="3"
          >
            <AFormTextField
              v-model="anzuUser.person.firstName"
              :v="v$.anzuUser.person.firstName"
              data-cy="user-first-name"
              @focusout="autoFillTexts()"
            />
          </VCol>
          <VCol
            cols="12"
            sm="3"
          >
            <AFormTextField
              v-model="anzuUser.person.lastName"
              :v="v$.anzuUser.person.lastName"
              data-cy="user-last-name"
              @focusout="autoFillTexts()"
            />
          </VCol>
          <VCol
            cols="12"
            sm="6"
          >
            <AFormTextField
              v-model="anzuUser.person.fullName"
              :v="v$.anzuUser.person.fullName"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="12"
            sm="3"
          >
            <AAvatarColorPicker
              v-model="anzuUser.avatar.color"
              :label="t('common.anzuUser.model.avatar.color')"
              required
              random-color
            />
          </VCol>
          <VCol
            cols="12"
            sm="3"
          >
            <AFormTextField
              v-model="anzuUser.avatar.text"
              :v="v$.anzuUser.avatar.text"
              :maxlength="3"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="12"
            sm="3"
          >
            <AnzuUserRoleSelect
              v-model="anzuUser.roles"
              :client="client"
            />
          </VCol>
          <VCol
            cols="12"
            sm="9"
          >
            <PermissionGroupRemoteAutocomplete
              v-model="anzuUser.permissionGroups"
              :client="client"
              :label="t('common.anzuUser.model.permissionGroups')"
              multiple
              clearable
            />
          </VCol>
        </VRow>
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
