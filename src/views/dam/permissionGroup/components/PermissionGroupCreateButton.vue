<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiHelper } from '@/composables/system/uiHelper'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import { isUndefined } from '@/utils/common'
import { ROUTE } from '@/router/routes'
import ABtn from '@/components/common/buttons/ABtn.vue'
import ATextField from '@/components/form/ATextField.vue'
import ARow from '@/components/common/ARow.vue'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { usePermissionGroupFactory } from '@/model/dam/factory/PermissionGroupFactory'
import type { PermissionGroup } from '@/types/dam/PermissionGroup'
import { usePermissionGroupValidation } from '@/views/dam/permissionGroup/composables/permissionGroupValidation'
import { createPermissionGroup, ENTITY } from '@/services/api/dam/permissionGroupApi'
import { Podcast } from '@/types/dam/Podcast'

const props = withDefaults(
  defineProps<{
    disableRedirect?: boolean
    buttonT?: string
    buttonClass?: string
    dataCy?: string
  }>(),
  {
    disableRedirect: false,
    buttonT: 'common.button.create',
    buttonClass: 'ml-2',
    dataCy: '',
  }
)
const emit = defineEmits<{
  (e: 'afterCreate', data: PermissionGroup): void
}>()

const { createDefault } = usePermissionGroupFactory()
const permissionGroup = ref<PermissionGroup>(createDefault())
const dialog = ref(false)

const onClick = () => {
  permissionGroup.value = createDefault()
  dialog.value = true
}

const onCancel = () => {
  dialog.value = false
}

const router = useRouter()
const { v$ } = usePermissionGroupValidation(permissionGroup)
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
    const res = await createPermissionGroup(permissionGroup.value)
    emit('afterCreate', res)
    showRecordWas('created')
    dialog.value = false
    if (!isUndefined(res.id) && !props.disableRedirect) {
      router.push({ name: ROUTE.DAM.PERMISSION_GROUP.DETAIL, params: { id: res.id } })
    }
  } catch (error) {
    handleError(error)
  } finally {
    btnReset('create')
  }
}
</script>

<template>
  <VBtn :class="buttonClass" :data-cy="dataCy" color="success" rounded="pill" @click.stop="onClick">
    {{ t(buttonT) }}
  </VBtn>
  <VDialog v-model="dialog" persistent no-click-animation>
    <VCard v-if="dialog" width="500" class="mt-0 mr-auto ml-auto" data-cy="create-panel">
      <VCardTitle class="d-flex pr-2">
        <span>{{ t('coreDam.permissionGroup.meta.create') }}</span>
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
      <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
        <VContainer class="pa-4" fluid>
          <ARow>
            <ATextField
              :label="t('coreDam.permissionGroup.model.title')"
              v-model="permissionGroup.title"
              :v="v$.permissionGroup.title"
              required
              data-cy="permission-group-title"
            ></ATextField>
          </ARow>
          <ARow>
            <ATextField
              :label="t('coreDam.permissionGroup.model.description')"
              v-model="permissionGroup.description"
              :v="v$.permissionGroup.description"
              required
              data-cy="permission-group-description"
            ></ATextField>
          </ARow>
        </VContainer>
      </ASystemEntityScope>
      <VCardActions>
        <VSpacer />
        <VBtn color="secondary" variant="text" @click.stop="onCancel" data-cy="button-cancel">
          {{ t('common.button.cancel') }}
        </VBtn>
        <ABtn color="success" @click.stop="onConfirm" btn-helper="create" data-cy="button-confirm">
          {{ t(buttonT) }}
        </ABtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
