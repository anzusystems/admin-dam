<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  AFormTextField,
  type AnzuUser,
  ARow,
  ASystemEntityScope,
  isUndefined,
  useAlerts,
  useAnzuUserFactory,
  useErrorHandler,
} from '@anzusystems/common-admin'
import { ENTITY, useAnzuUserApi } from '@/services/api/common/anzuUserApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import type { AxiosInstance } from 'axios'
import { useAnzuUserValidation } from '@/views/common/anzuUser/composables/anzuUserValidations'
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
const { v$ } = useAnzuUserValidation(anzuUser)
const { t } = useI18n()
const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

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
    handleError(error)
  } finally {
    buttonLoading.value = false
  }
}
</script>

<template>
  <VBtn
    :class="buttonClass"
    :data-cy="dataCy"
    color="success"
    :disabled="disabled"
    rounded="pill"
    @click.stop="onClick"
  >
    {{ t(buttonT) }}
  </VBtn>
  <VDialog v-model="dialog" persistent>
    <VCard v-if="dialog" width="500" class="mt-0 mr-auto ml-auto" data-cy="create-panel">
      <VCardTitle class="d-flex pr-2">
        <span>{{ t('common.anzuUser.meta.create') }}</span>
        <VSpacer />
        <VBtn class="ml-2" icon="mdi-close" size="small" variant="text" data-cy="button-close" @click.stop="onCancel" />
      </VCardTitle>
      <ASystemEntityScope system="common" :subject="ENTITY">
        <VContainer class="pa-4" fluid>
          <ARow>
            <AFormTextField v-model.number="anzuUser.id" :v="v$.anzuUser.id" />
          </ARow>
          <ARow>
            <AFormTextField v-model="anzuUser.email" :v="v$.anzuUser.email" />
          </ARow>
          <ARow>
            <AnzuUserRoleSelect v-model="anzuUser.roles" :client="client" />
          </ARow>
          <ARow>
            <PermissionGroupRemoteAutocomplete
              v-model="anzuUser.permissionGroups"
              :client="client"
              :label="t('common.anzuUser.model.permissionGroups')"
              multiple
              clearable
            />
          </ARow>
        </VContainer>
      </ASystemEntityScope>
      <VCardActions>
        <VSpacer />
        <VBtn color="secondary" variant="text" data-cy="button-cancel" @click.stop="onCancel">
          {{ t('common.button.cancel') }}
        </VBtn>
        <VBtn color="success" :loading="buttonLoading" data-cy="button-create-podcast" @click.stop="onConfirm">
          {{ t(buttonT) }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
