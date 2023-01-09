<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { useCurrentAssetLicence } from '@/composables/system/currentLicence'
import { useCurrentUser } from '@/composables/system/currentUser'
import type { IntegerId } from '@/types/common'
import { isUndefined } from '@/utils/common'
import { minValue, required } from '@/plugins/validators'
import useVuelidate, { ErrorObject } from '@vuelidate/core'
import { useAlerts } from '@/composables/system/alerts'
import { updateCurrentUser } from '@/services/api/dam/userApi'
import { useErrorHandler } from '@/composables/system/error'

// todo: separate display button and update form

const { t } = useI18n({ useScope: 'global' })

const { currentExtSystem, currentExtSystemId } = useCurrentExtSystem()
const { currentAssetLicence, currentAssetLicenceId } = useCurrentAssetLicence()
const { currentUser } = useCurrentUser()

const dialog = ref(false)
const saving = ref(false)
const selectedExtSystem = ref<undefined | IntegerId>(undefined)
const selectedLicence = ref<undefined | IntegerId>(undefined)

const displayTextExtSystem = computed(() => {
  if (currentExtSystem.value) {
    return currentExtSystem.value.name
  }
  return ''
})

const displayTextLicence = computed(() => {
  if (currentAssetLicence.value) {
    return currentAssetLicence.value.name
  }
  return ''
})

const extSystemsItems = computed(() => {
  if (currentUser.value && currentUser.value.userToExtSystems.length > 0) {
    return currentUser.value.userToExtSystems.map((item) => {
      return {
        value: item.id,
        title: item.name,
      }
    })
  }
  return []
})

const licenceItems = computed(() => {
  if (currentUser.value && currentUser.value.assetLicences.length > 0 && !isUndefined(selectedExtSystem.value)) {
    return currentUser.value.assetLicences
      .filter((licence) => licence.extSystem === selectedExtSystem.value)
      .map((item) => {
        return {
          value: item.id,
          title: item.name,
        }
      })
  }
  return []
})

const allowSelect = computed(() => {
  return true
  // return damConfig.settings.allowSelectExtSystem && damConfig.settings.allowSelectLicenceId
})

const openDialog = () => {
  dialog.value = true
}

const onCancel = () => {
  dialog.value = false
}

const rulesExtSystem = computed(() => ({
  selectedExtSystem: {
    required,
    minValue: minValue(1),
  },
}))
const rulesLicence = computed(() => ({
  selectedLicence: {
    required,
    minValue: minValue(1),
  },
}))
const validateExtSystem = useVuelidate(rulesExtSystem, { selectedExtSystem })
const validateLicence = useVuelidate(rulesLicence, { selectedLicence })

const errorMessageExtSystem = computed(() => {
  if (validateExtSystem.value.$errors?.length)
    return validateExtSystem.value.$errors.map((item: ErrorObject) => item.$message) as string[]
  return []
})

const errorMessageLicence = computed(() => {
  if (validateLicence.value.$errors?.length)
    return validateLicence.value.$errors.map((item: ErrorObject) => item.$message) as string[]
  return []
})

const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const onConfirm = async () => {
  saving.value = true
  validateExtSystem.value.$touch()
  validateLicence.value.$touch()
  if (validateExtSystem.value.$invalid || validateLicence.value.$invalid || isUndefined(selectedLicence.value)) {
    showValidationError()
    saving.value = false
    return
  }
  try {
    await updateCurrentUser({ selectedLicence: selectedLicence.value })
    dialog.value = false
    showRecordWas('updated')
    window.location.reload()
  } catch (error) {
    handleError(error)
  } finally {
    saving.value = false
  }
}

watch(
  currentExtSystemId,
  (newValue, oldValue) => {
    if (newValue !== oldValue && newValue > 0) {
      selectedExtSystem.value = newValue
    }
  },
  { immediate: true }
)

watch(
  currentAssetLicenceId,
  (newValue, oldValue) => {
    if (newValue !== oldValue && newValue > 0) {
      selectedLicence.value = newValue
    }
  },
  { immediate: true }
)
</script>

<template>
  <VBtn variant="text" size="small" class="mx-1" @click.stop="openDialog">
    {{ displayTextLicence }}
    <VIcon icon="mdi-chevron-down" />
    <VTooltip activator="parent" location="bottom">
      {{ t('system.mainBar.extSystemLicenceSwitch.extSystem') }}: {{ displayTextExtSystem }}<br />
      {{ t('system.mainBar.extSystemLicenceSwitch.licence') }}: {{ displayTextLicence }}
    </VTooltip>
  </VBtn>
  <VDialog v-model="dialog" persistent :width="500" no-click-animation>
    <VCard v-if="dialog" data-cy="delete-panel">
      <VToolbar class="pl-2" density="compact">
        <div class="d-block pl-0 w-100">
          <div class="text-h6">{{ t('system.mainBar.extSystemLicenceSwitch.title') }}</div>
        </div>
        <VSpacer></VSpacer>
        <VToolbarItems>
          <VBtn
            class="ml-2"
            icon="mdi-close"
            size="small"
            variant="text"
            @click.stop="onCancel"
            data-cy="button-close"
          ></VBtn>
        </VToolbarItems>
      </VToolbar>
      <VCardText v-if="allowSelect">
        <div class="mb-4">{{ t('system.mainBar.extSystemLicenceSwitch.description') }}</div>
        <VSelect
          :items="extSystemsItems"
          v-model="selectedExtSystem"
          :label="t('system.mainBar.extSystemLicenceSwitch.extSystem')"
          @blur="validateExtSystem.$touch()"
          :error-messages="errorMessageExtSystem"
        >
          <template #label>
            <span>{{ t('system.mainBar.extSystemLicenceSwitch.extSystem') }}<span class="required"></span></span>
          </template>
        </VSelect>
        <VSelect
          :items="licenceItems"
          v-model="selectedLicence"
          :label="t('system.mainBar.extSystemLicenceSwitch.licence')"
          @blur="validateLicence.$touch()"
          :error-messages="errorMessageLicence"
        >
          <template #label>
            <span>{{ t('system.mainBar.extSystemLicenceSwitch.licence') }}<span class="required"></span></span>
          </template>
        </VSelect>
      </VCardText>
      <VCardText v-else>
        <VRow>
          <VCol>{{ t('system.mainBar.extSystemLicenceSwitch.extSystem') }}</VCol>
          <VCol>{{ displayTextExtSystem }}</VCol>
        </VRow>
        <VRow>
          <VCol>{{ t('system.mainBar.extSystemLicenceSwitch.licence') }}</VCol>
          <VCol>{{ displayTextLicence }}</VCol>
        </VRow>
      </VCardText>
      <VCardActions>
        <VSpacer></VSpacer>
        <VBtn text @click.stop="onCancel" data-cy="button-cancel">
          {{ t('common.button.cancel') }}
        </VBtn>
        <VBtn color="warning" @click.stop="onConfirm" data-cy="button-confirm" v-if="allowSelect">
          {{ t('system.mainBar.extSystemLicenceSwitch.confirm') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
