<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCurrentAssetLicence, useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { useCurrentUser } from '@/composables/system/currentUser'
import type { IntegerId } from '@anzusystems/common-admin'
import { useAlerts } from '@anzusystems/common-admin'
import { isUndefined } from '@/utils/common'
import { minValue, required } from '@/plugins/validators'
import useVuelidate, { type ErrorObject } from '@vuelidate/core'
import { updateCurrentUser } from '@/services/api/dam/userApi'
import { useErrorHandler } from '@/composables/system/error'
import { damConfig } from '@/services/DamConfigService'
import ExtSystemSelect from '@/views/dam/extSystem/components/ExtSystemSelect.vue'
import AssetLicenceSelect from '@/views/dam/assetLicence/components/AssetLicenceSelect.vue'
import AssetLicenceByExtIdSelect from '@/views/dam/assetLicence/components/AssetLicenceByExtIdSelect.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/extSystemApi'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { fetchAssetLicence } from '@/services/api/dam/assetLicenceApi'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    extSystemName: string
    licenceName: string
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: boolean): void
}>()

const dialog = computed({
  get() {
    return props.modelValue
  },
  set(newValue) {
    emit('update:modelValue', newValue)
  },
})

const { t } = useI18n()

const { currentExtSystemId } = useCurrentExtSystem()
const { currentAssetLicenceId } = useCurrentAssetLicence()
const { currentUser, currentUserIsSuperAdmin } = useCurrentUser()

const saving = ref(false)
const selectedExtSystem = ref<null | IntegerId>(null)
const selectedLicence = ref<null | IntegerId>(null)

const selectedExtSystemSearch = ref<null | IntegerId>(null)
const selectedLicenceSearch = ref<null | IntegerId>(null)

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
  return damConfig.settings.allowSelectExtSystem && damConfig.settings.allowSelectLicenceId
})

const onCancel = () => {
  dialog.value = false
}

const rulesLicence = computed(() => ({
  selectedLicence: {
    required,
    minValue: minValue(1),
  },
}))
const validateLicence = useVuelidate(rulesLicence, { selectedLicence })

const errorMessageLicence = computed(() => {
  if (validateLicence.value.$errors?.length)
    return validateLicence.value.$errors.map((item: ErrorObject) => item.$message) as string[]
  return []
})

const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const onConfirm = async () => {
  saving.value = true
  validateLicence.value.$touch()
  if (
    validateLicence.value.$invalid ||
    !selectedLicence.value ||
    currentAssetLicenceId.value === selectedLicence.value
  ) {
    showValidationError()
    saving.value = false
    return
  }
  try {
    await fetchAssetLicence(selectedLicence.value)
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

const onSelectedExtSystemSearchChange = (value: IntegerId) => {
  if (value) {
    selectedExtSystem.value = value
    selectedLicence.value = null
  }
}

const onSelectedLicenceSearchChange = (value: IntegerId) => {
  if (value) selectedLicence.value = value
}

onMounted(async () => {
  selectedExtSystem.value = currentExtSystemId.value
  selectedLicence.value = currentAssetLicenceId.value
})
</script>

<template>
  <VDialog v-model="dialog" persistent :width="500" no-click-animation>
    <VCard v-if="dialog">
      <VToolbar class="pl-2" density="compact">
        <div class="d-block pl-0 w-100">
          <div class="text-h6">{{ t('system.mainBar.extSystemLicenceSwitch.title') }}</div>
        </div>
        <VSpacer />
        <VToolbarItems>
          <VBtn
            class="ml-2"
            icon="mdi-close"
            size="small"
            variant="text"
            data-cy="button-close"
            @click.stop="onCancel"
          />
        </VToolbarItems>
      </VToolbar>
      <VCardText v-if="currentUserIsSuperAdmin">
        <div class="mb-4 text-caption">
          Current ext system: {{ currentExtSystemId }} ({{ extSystemName }})<br />
          Current licence: {{ currentAssetLicenceId }} ({{ licenceName }})<br />
        </div>
        <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
          <VRow>
            <VCol class="text-caption font-weight-bold mb-4">
              {{ t('system.mainBar.extSystemLicenceSwitch.filters') }}
            </VCol>
          </VRow>
          <VRow>
            <VCol class="pt-2">
              <ExtSystemSelect
                v-model="selectedExtSystemSearch"
                :label="t('system.mainBar.extSystemLicenceSwitch.filter.extSystemName')"
                hide-details
                @update:model-value="onSelectedExtSystemSearchChange"
              />
            </VCol>
            <VCol>
              <VTextField
                v-model="selectedExtSystem"
                hide-details
                :label="t('system.mainBar.extSystemLicenceSwitch.filter.extSystemId')"
              />
            </VCol>
          </VRow>
          <VRow>
            <VCol>
              <AssetLicenceSelect
                v-model="selectedLicenceSearch"
                :label="t('system.mainBar.extSystemLicenceSwitch.filter.licenceName')"
                :ext-system-id="selectedExtSystem"
                hide-details
                @update:model-value="onSelectedLicenceSearchChange"
              />
            </VCol>
            <VCol>
              <AssetLicenceByExtIdSelect
                v-model="selectedLicenceSearch"
                :label="t('system.mainBar.extSystemLicenceSwitch.filter.licenceExtId')"
                :ext-system-id="selectedExtSystem"
                hide-details
                @update:model-value="onSelectedLicenceSearchChange"
              />
            </VCol>
          </VRow>
          <div class="d-flex align-center w-100">
            <div class="text-caption font-weight-bold">Change to licence ID: <span class="text-error">*</span></div>
            <div class="w-100"><VTextField v-model="selectedLicence" hide-details /></div>
          </div>
        </ASystemEntityScope>
      </VCardText>
      <VCardText v-else-if="allowSelect">
        <div class="mb-4">{{ t('system.mainBar.extSystemLicenceSwitch.description') }}</div>
        <VSelect
          v-model="selectedExtSystem"
          :items="extSystemsItems"
          :label="t('system.mainBar.extSystemLicenceSwitch.extSystem')"
          @update:model-value="selectedLicence = undefined"
        >
          <template #label>
            <span>{{ t('system.mainBar.extSystemLicenceSwitch.extSystem') }}<span class="required" /></span>
          </template>
        </VSelect>
        <VSelect
          v-model="selectedLicence"
          :items="licenceItems"
          :label="t('system.mainBar.extSystemLicenceSwitch.licence')"
          :error-messages="errorMessageLicence"
          @blur="validateLicence.$touch()"
        >
          <template #label>
            <span>{{ t('system.mainBar.extSystemLicenceSwitch.licence') }}<span class="required" /></span>
          </template>
        </VSelect>
      </VCardText>
      <VCardText v-else>
        <VRow>
          <VCol>{{ t('system.mainBar.extSystemLicenceSwitch.extSystem') }}</VCol>
          <VCol>{{ extSystemName }}</VCol>
        </VRow>
        <VRow>
          <VCol>{{ t('system.mainBar.extSystemLicenceSwitch.licence') }}</VCol>
          <VCol>{{ licenceName }}</VCol>
        </VRow>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn text data-cy="button-cancel" @click.stop="onCancel">
          {{ t('common.button.cancel') }}
        </VBtn>
        <VBtn v-if="allowSelect" color="warning" data-cy="button-confirm" @click.stop="onConfirm">
          {{ t('system.mainBar.extSystemLicenceSwitch.confirm') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
