<script lang="ts" setup>
import {
  ADialogToolbar,
  AFormTextField,
  ARow,
  ASystemEntityScope,
  type PermissionGroup,
  usePermissionGroupFactory,
} from '@anzusystems/common-admin'
import { ENTITY, useCreatePermissionGroup } from '@/domains/common/permissionGroup/api/permissionGroupApi'
import { usePermissionGroupValidation } from '@/domains/common/permissionGroup/composables/permissionGroupValidations'
import type { AxiosInstance } from 'axios'

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
  (e: 'afterCreate', data: PermissionGroup): void
}>()

const { createPermissionGroup } = usePermissionGroupFactory()
const { executeRequest: apiCreatePermissionGroup } = useCreatePermissionGroup()
const permissionGroup = ref<PermissionGroup>(createPermissionGroup())
const dialog = ref(false)
const buttonLoading = ref(false)

const onClick = () => {
  permissionGroup.value = createPermissionGroup()
  dialog.value = true
}

const onCancel = () => {
  dialog.value = false
}

const router = useRouter()
const { v$ } = usePermissionGroupValidation(permissionGroup)
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
    const res = await apiCreatePermissionGroup({ object: permissionGroup.value })
    emit('afterCreate', res)
    showRecordWas('created')
    dialog.value = false
    if (!isUndefined(res.id) && !props.disableRedirect) {
      router.push({ name: '/(common)/permission-groups/[id]', params: { id: res.id } })
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
        {{ t('common.permissionGroup.meta.create') }}
      </ADialogToolbar>
      <VCardText>
        <ASystemEntityScope
          system="common"
          :subject="ENTITY"
        >
          <ARow>
            <AFormTextField
              v-model="permissionGroup.title"
              :v="v$.permissionGroup.title"
              data-cy="permissionGroup-title"
            />
          </ARow>
          <ARow>
            <AFormTextField
              v-model="permissionGroup.description"
              :v="v$.permissionGroup.description"
              data-cy="permissionGroup-description"
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
