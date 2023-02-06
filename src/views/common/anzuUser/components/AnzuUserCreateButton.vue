<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiHelper } from '@/composables/system/uiHelper'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import ABtn from '@/components/common/buttons/ABtn.vue'
import ATextField from '@/components/form/ATextField.vue'
import ARow from '@/components/common/ARow.vue'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { ENTITY, useAnzuUserApi } from '@/services/api/common/anzuUserApi'
import { isUndefined } from '@/utils/common'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { AnzuUser, useAnzuUserFactory } from '@anzusystems/common-admin'
import { AxiosInstance } from 'axios'
import { useAnzuUserValidation } from '@/views/common/anzuUser/composables/anzuUserValidations'
import AnzuUserRoleSelect from '@/views/common/anzuUser/components/AnzuUserRoleSelect.vue'
import PermissionGroupSelect from '@/views/common/permissionGroup/components/PermissionGroupSelect.vue'

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

const onClick = () => {
  anzuUser.value = createAnzuUser()
  dialog.value = true
}

const onCancel = () => {
  dialog.value = false
}

const router = useRouter()
const { v$ } = useAnzuUserValidation(anzuUser)
const { t } = useI18n({ useScope: 'global' })
const { btnDisable, btnEnable, btnLoadingOn, btnReset } = useUiHelper()
const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const onConfirm = async () => {
  try {
    btnDisable('create')
    v$.value.$touch()
    if (v$.value.$invalid) {
      showValidationError()
      btnEnable('create')
      return
    }
    btnLoadingOn('create')
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
    btnReset('create')
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
        <VBtn
          class="ml-2"
          icon="mdi-close"
          size="small"
          variant="text"
          @click.stop="onCancel"
          data-cy="button-close"
        ></VBtn>
      </VCardTitle>
      <ASystemEntityScope system="common" :subject="ENTITY">
        <VContainer class="pa-4" fluid>
          <ARow>
            <ATextField v-model.number="anzuUser.id" :v="v$.anzuUser.id"></ATextField>
          </ARow>
          <ARow>
            <ATextField v-model="anzuUser.email" :v="v$.anzuUser.email"></ATextField>
          </ARow>
          <ARow>
            <AnzuUserRoleSelect v-model="anzuUser.roles" :client="client"></AnzuUserRoleSelect>
          </ARow>
          <ARow>
            <PermissionGroupSelect
              v-model="anzuUser.permissionGroups"
              :client="client"
              :label="t('common.anzuUser.model.permissionGroups')"
              multiple
              clearable
            ></PermissionGroupSelect>
          </ARow>
        </VContainer>
      </ASystemEntityScope>
      <VCardActions>
        <VSpacer />
        <VBtn color="secondary" variant="text" @click.stop="onCancel" data-cy="button-cancel">
          {{ t('common.button.cancel') }}
        </VBtn>
        <ABtn color="success" @click.stop="onConfirm" btn-helper="create" data-cy="button-create-podcast">
          {{ t(buttonT) }}
        </ABtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
