<script lang="ts" setup>
import { useAuth } from '@/composables/auth/auth'
import { useCurrentAssetLicence, useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { SYSTEM_CORE_DAM, SYSTEM_DAM } from '@/model/systems'
import { damClient } from '@/services/api/clients/damClient'
import { fetchAssetLicence } from '@/services/api/coreDam/assetLicenceApi'
import { ENTITY } from '@/services/api/coreDam/extSystemApi'
import { updateCurrentUser } from '@/services/api/coreDam/userApi'
import AssetLicenceByExtIdRemoteAutocomplete from '@/views/coreDam/assetLicence/components/AssetLicenceByExtIdRemoteAutocomplete.vue'
import {
  ADialogToolbar,
  ASystemEntityScope,
  DamAssetLicenceRemoteAutocomplete,
  type DamCurrentUserDto,
  DamExtSystemRemoteAutocomplete,
  type IntegerId,
  type IntegerIdNullable,
  isArray,
  isInt,
  isNull,
  isUndefined,
  useAlerts,
  useDamConfigStore,
  useValidate,
} from '@anzusystems/common-admin'
import useVuelidate, { type ErrorObject } from '@vuelidate/core'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ABtnAdvanced from '@/components/ABtnAdvanced.vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    extSystemName: string
    licenceName: string
    dataCy?: string
  }>(),
  {
    dataCy: undefined,
  }
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

const showAdvanced = ref(false)

const { currentExtSystemId } = useCurrentExtSystem()
const { currentAssetLicenceId } = useCurrentAssetLicence()
const { useCurrentUser } = useAuth()
const { currentUser, isSuperAdmin } = useCurrentUser<DamCurrentUserDto>(SYSTEM_DAM)

const saving = ref(false)
const selectedExtSystem = ref<null | IntegerId>(null)
const selectedLicence = ref<null | IntegerId>(null)

const selectedExtSystemSearch = ref<null | IntegerId>(null)
const selectedLicenceSearch = ref<null | IntegerId>(null)
const selectedLicenceSearchByExtId = ref<null | IntegerId>(null)

const extSystemsItems = computed(() => {
  if (currentUser.value && currentUser.value.userToExtSystemsDto.length > 0) {
    return currentUser.value.userToExtSystemsDto.map((item) => {
      return {
        value: item.id,
        title: item.name,
      }
    })
  }
  return []
})

const licenceItems = computed(() => {
  if (currentUser.value && currentUser.value.assetLicencesDto.length > 0 && !isUndefined(selectedExtSystem.value)) {
    return currentUser.value.assetLicencesDto
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

const damConfigStore = useDamConfigStore()
const { damPrvConfig } = storeToRefs(damConfigStore)

const allowSelect = computed(() => {
  return damPrvConfig.value.settings.allowSelectExtSystem && damPrvConfig.value.settings.allowSelectLicenceId
})

const onCancel = () => {
  dialog.value = false
}

const { required, minValue } = useValidate()

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

const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const onConfirm = async () => {
  saving.value = true
  validateLicence.value.$touch()
  console.log(validateLicence.value)
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
    showErrorsDefault(error)
  } finally {
    saving.value = false
  }
}

const onSelectedExtSystemSearchChange = (value: IntegerIdNullable | IntegerId[]) => {
  selectedLicenceSearch.value = null
  if (isArray<IntegerIdNullable>(value) && value[0]) {
    selectedExtSystem.value = value[0]
    selectedLicence.value = null
    return
  }
  if (isInt(value)) {
    selectedExtSystem.value = value
    selectedLicence.value = null
  }
}

const onSelectedLicenceSearchChange = (value: IntegerIdNullable | IntegerId[]) => {
  if (isArray<IntegerIdNullable>(value) && value[0]) {
    selectedLicence.value = value[0]
    return
  }
  if (isInt(value) || isNull(value)) selectedLicence.value = value
  console.log(selectedLicence.value)
}

const onSelectedLicenceSearchByExtIdChange = (value: IntegerIdNullable | IntegerId[]) => {
  if (isArray<IntegerIdNullable>(value) && value[0]) {
    selectedLicence.value = value[0]
    selectedLicenceSearch.value = value[0]
    return
  }
  if (isInt(value) || isNull(value)) {
    selectedLicence.value = value
    selectedLicenceSearch.value = value
  }
}

onMounted(async () => {
  selectedExtSystem.value = currentExtSystemId.value
  selectedLicence.value = currentAssetLicenceId.value
  selectedExtSystemSearch.value = currentExtSystemId.value
  selectedLicenceSearch.value = currentAssetLicenceId.value
})
</script>

<template>
  <VDialog
    v-model="dialog"
    :width="500"
  >
    <VCard v-if="dialog">
      <ADialogToolbar
        data-cy="button-close"
        @on-cancel="onCancel"
      >
        {{ t('system.mainBar.extSystemLicenceSwitch.title') }}
      </ADialogToolbar>
      <VCardText v-if="isSuperAdmin">
        <ASystemEntityScope
          :system="SYSTEM_CORE_DAM"
          :subject="ENTITY"
        >
          <VRow>
            <VCol class="pt-2">
              <DamExtSystemRemoteAutocomplete
                v-model="selectedExtSystemSearch"
                :client="damClient"
                :label="t('system.mainBar.extSystemLicenceSwitch.filter.extSystemName')"
                hide-details
                clearable
                data-cy="field-name-ext-sys"
                @update:model-value="onSelectedExtSystemSearchChange"
              />
            </VCol>
          </VRow>
          <VRow>
            <VCol>
              <DamAssetLicenceRemoteAutocomplete
                v-model="selectedLicenceSearch"
                :client="damClient"
                :label="t('system.mainBar.extSystemLicenceSwitch.filter.licenceName')"
                :ext-system-id="selectedExtSystem"
                hide-details
                clearable
                data-cy="field-name-licence"
                @update:model-value="onSelectedLicenceSearchChange"
              />
            </VCol>
          </VRow>
          <VRow>
            <VCol>
              <ABtnAdvanced
                v-model="showAdvanced"
                class="mt-2 mb-4"
              />
            </VCol>
          </VRow>
          <div v-show="showAdvanced">
            <VRow>
              <VCol>
                <div class="text-caption">
                  {{ t('system.mainBar.extSystemLicenceSwitch.currentExtSystem') }}: {{ currentExtSystemId }} ({{
                    extSystemName
                  }})<br>
                  {{ t('system.mainBar.extSystemLicenceSwitch.currentLicence') }}: {{ currentAssetLicenceId }} ({{
                    licenceName
                  }})<br>
                </div>
              </VCol>
            </VRow>
            <VRow class="mb-4">
              <VCol>
                <AssetLicenceByExtIdRemoteAutocomplete
                  v-model="selectedLicenceSearchByExtId"
                  :label="t('system.mainBar.extSystemLicenceSwitch.filter.licenceExtId')"
                  :ext-system-id="selectedExtSystem"
                  hide-details
                  data-cy="field-id-licence"
                  @update:model-value="onSelectedLicenceSearchByExtIdChange"
                />
              </VCol>
            </VRow>
          </div>
          <div class="d-flex align-center w-100">
            <div class="text-caption font-weight-bold">
              {{ t('system.mainBar.extSystemLicenceSwitch.changeToLicenceId') }}: <span class="text-error">*</span>
            </div>
            <div class="w-100">
              <VTextField
                v-model="selectedLicence"
                data-cy="field-change-on-id-licence"
                hide-details
              />
            </div>
          </div>
        </ASystemEntityScope>
      </VCardText>
      <VCardText v-else-if="allowSelect">
        <div class="mb-4">
          {{ t('system.mainBar.extSystemLicenceSwitch.description') }}
        </div>
        <VSelect
          v-model="selectedExtSystem"
          :items="extSystemsItems"
          :label="t('system.mainBar.extSystemLicenceSwitch.extSystem')"
          @update:model-value="selectedLicence = null"
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
        <ABtnTertiary
          data-cy="button-cancel"
          @click.stop="onCancel"
        >
          {{ t('common.button.cancel') }}
        </ABtnTertiary>
        <ABtnPrimary
          v-if="allowSelect"
          :disabled="isNull(selectedLicence)"
          data-cy="button-confirm"
          @click.stop="onConfirm"
        >
          {{ t('system.mainBar.extSystemLicenceSwitch.confirm') }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
