<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ADialogToolbar,
  AFormTextField,
  type AnzuUser,
  ARow,
  ASystemEntityScope,
  isUndefined,
  useAlerts,
  useAnzuUserFactory,
} from '@anzusystems/common-admin'
import { ENTITY, useAnzuUserApi } from '@/services/api/common/anzuUserApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import type { AxiosInstance } from 'axios'
import { useAnzuUserCreateValidation } from '@/views/common/anzuUser/composables/anzuUserValidations'
import AnzuUserRoleSelect from '@/views/common/anzuUser/components/AnzuUserRoleSelect.vue'
import PermissionGroupRemoteAutocomplete from '@/views/common/permissionGroup/components/PermissionGroupRemoteAutocomplete.vue'

const props = withDefaults(
  defineProps<{
    client: () => AxiosInstance
    disableRedirect?: boolean
    buttonT?: string
    buttonClass?: string
    dataCy?: string
    disabled?: boolean | undefined
  }>(),
  {
    disableRedirect: false,
    buttonT: 'common.button.create',
    buttonClass: 'ml-2',
    dataCy: '',
    disabled: undefined,
  }
)
const emit = defineEmits<{
  (e: 'afterCreate', data: AnzuUser): void
}>()

const { createAnzuUser } = useAnzuUserFactory()
const { apiCreateAnzuUser } = useAnzuUserApi(props.client)
const anzuUser = ref<AnzuUser>(createAnzuUser())
const dialog = ref(false)
const buttonLoading = ref(false)

const onClick = () => {
  anzuUser.value = createAnzuUser()
  dialog.value = true
}

const onCancel = () => {
  dialog.value = false
}

const router = useRouter()
const { v$ } = useAnzuUserCreateValidation(anzuUser)
const { t } = useI18n()
const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const onConfirm = async () => {
  try {
    buttonLoading.value = true
    v$.value.$touch()
    if (v$.value.$invalid) {
      showValidationError()
      buttonLoading.value = false
      return
    }
    const res = await apiCreateAnzuUser(anzuUser.value)
    emit('afterCreate', res)
    showRecordWas('created')
    dialog.value = false
    if (!isUndefined(res.id) && !props.disableRedirect) {
      router.push({ name: ROUTE.COMMON.ANZU_USER.DETAIL, params: { id: res.id } })
    }
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    buttonLoading.value = false
  }
}
</script>

<template>
  <ABtnPrimary
    :class="buttonClass"
    :data-cy="dataCy"
    :disabled="disabled"
    rounded="pill"
    @click.stop="onClick"
  >
    {{ t(buttonT) }}
  </ABtnPrimary>
  <VDialog v-model="dialog">
    <VCard
      v-if="dialog"
      width="500"
      class="mt-0 mr-auto ml-auto"
      data-cy="create-panel"
    >
      <ADialogToolbar @on-cancel="onCancel">
        {{ t('common.anzuUser.meta.create') }}
      </ADialogToolbar>
      <VCardText>
        <ASystemEntityScope
          system="common"
          :subject="ENTITY"
        >
          <ARow>
            <AFormTextField
              v-model.number="anzuUser.id"
              :v="v$.anzuUser.id"
              data-cy="user-id"
            />
          </ARow>
          <ARow>
            <AFormTextField
              v-model="anzuUser.email"
              :v="v$.anzuUser.email"
              data-cy="user-email"
            />
          </ARow>
          <ARow>
            <AnzuUserRoleSelect
              v-model="anzuUser.roles"
              :client="client"
              data-cy="user-roles"
            />
          </ARow>
          <ARow>
            <PermissionGroupRemoteAutocomplete
              v-model="anzuUser.permissionGroups"
              :client="client"
              :label="t('common.anzuUser.model.permissionGroups')"
              multiple
              clearable
              data-cy="user-permissionGroups"
            />
          </ARow>
        </ASystemEntityScope>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <ABtnTertiary
          data-cy="button-cancel"
          @click.stop="onCancel"
        >
          {{ t('common.button.cancel') }}
        </ABtnTertiary>
        <ABtnPrimary
          :loading="buttonLoading"
          data-cy="button-confirm"
          @click.stop="onConfirm"
        >
          {{ t(buttonT) }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
