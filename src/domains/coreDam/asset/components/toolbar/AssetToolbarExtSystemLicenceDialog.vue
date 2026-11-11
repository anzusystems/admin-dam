<script lang="ts" setup>
import {
  ADamAssetLicenceRemoteAutocomplete,
  ADamExtSystemRemoteAutocomplete,
  ADialogToolbar,
  ASystemEntityScope,
  isArray,
  isInt,
  isNull,
  isUndefined,
  useAlerts,
  useDamConfigStore,
  useValidate,
} from '@anzusystems/common-admin'
import type { DamCurrentUserDto, IntegerId, IntegerIdNullable } from '@anzusystems/common-admin'
import useVuelidate from '@vuelidate/core'
import type { ErrorObject } from '@vuelidate/core'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'

import { useCurrentAssetLicence, useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import { fetchAssetLicence } from '@/domains/coreDam/assetLicence/api/assetLicenceApi'
import AssetLicenceByExtIdRemoteAutocomplete from '@/domains/coreDam/assetLicence/components/AssetLicenceByExtIdRemoteAutocomplete.vue'
import { ENTITY } from '@/domains/coreDam/extSystem/api/extSystemApi'
import ABtnAdvanced from '@/domains/coreDam/shared/components/ABtnAdvanced.vue'
import { updateCurrentUser } from '@/domains/coreDam/user/api/userApi'
import { useAuth } from '@/domains/system/auth/auth'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM, SYSTEM_DAM } from '@/shared/systems'

withDefaults(
  defineProps<{
    extSystemName: string
    licenceName: string
    dataCy?: string
  }>(),
  {
    dataCy: undefined,
  }
)
const modelValue = defineModel<boolean>({ required: true })
const dialog = computed({
  get() {
    return modelValue.value
  },
  set(newValue) {
    modelValue.value = newValue
  },
})

const { t } = useI18n()

const showAdvanced = ref(false)

const { currentExtSystemId } = useCurrentExtSystem()
const { currentAssetLicenceId } = useCurrentAssetLicence()
const assetDetailStore = useAssetDetailStore()
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
    return currentUser.value.userToExtSystemsDto.map((item) => ({
      value: item.id,
      title: item.name,
    }))
  }
  return []
})

const licenceItems = computed(() => {
  if (currentUser.value && currentUser.value.assetLicencesDto.length > 0 && !isUndefined(selectedExtSystem.value)) {
    return currentUser.value.assetLicencesDto
      .filter((licence) => licence.extSystem === selectedExtSystem.value)
      .map((item) => ({
        value: item.id,
        title: item.name,
      }))
  }
  return []
})

const damConfigStore = useDamConfigStore()
const { damPrvConfig } = storeToRefs(damConfigStore)

const allowSelect = computed(
  () => damPrvConfig.value.settings.allowSelectExtSystem && damPrvConfig.value.settings.allowSelectLicenceId
)

const onCancel = () => {
  /*
   * The change still goes through. The guard against a second confirm lives in this
   * dialog, so a reopened dialog would send the change again during the first reload.
   */
  if (saving.value) return
  dialog.value = false
}

/*
 * Blocks leaving the page while creating. The browser back button to an entry where
 * ADAM was loaded or reloaded bypasses Vuetify, which otherwise only closes the dialog.
 * Also blocks address changes: another provider's page is the same
 * router page and is fully re-rendered. A query-only change is allowed.
 */
onBeforeRouteLeave(() => !saving.value)
onBeforeRouteUpdate((to, from) => to.path === from.path || !saving.value)

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
  // A second confirm while the first is on its way would send the same change once more.
  if (saving.value) return
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
  /* The change ends in a page reload, which drops unsaved panel metadata. Ask before anything is sent. */
  const leavesUnsaved = assetDetailStore.panelHoldsUnsavedMetadata
  if (leavesUnsaved && !(await assetDetailStore.askToLeaveUnsaved())) {
    saving.value = false
    return
  }
  try {
    await fetchAssetLicence(selectedLicence.value)
    await updateCurrentUser({ selectedLicence: selectedLicence.value })
    dialog.value = false
    showRecordWas('updated')
    // Already given up above. Reset so the browser does not ask about them again on reload.
    if (leavesUnsaved) assetDetailStore.reset()
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
        @cancel="onCancel"
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
              <ADamExtSystemRemoteAutocomplete
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
              <ADamAssetLicenceRemoteAutocomplete
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
                <div class="text-body-small">
                  {{ t('system.mainBar.extSystemLicenceSwitch.currentExtSystem') }}: {{ currentExtSystemId }} ({{
                    extSystemName
                  }})<br />
                  {{ t('system.mainBar.extSystemLicenceSwitch.currentLicence') }}: {{ currentAssetLicenceId }} ({{
                    licenceName
                  }})<br />
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
            <div class="text-body-small font-weight-bold">
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
            <span>{{ t('system.mainBar.extSystemLicenceSwitch.extSystem') }}<span class="a-required-mark" /></span>
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
            <span>{{ t('system.mainBar.extSystemLicenceSwitch.licence') }}<span class="a-required-mark" /></span>
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
          :disabled="saving"
          data-cy="button-cancel"
          @click.stop="onCancel"
        >
          {{ t('common.button.cancel') }}
        </ABtnTertiary>
        <ABtnPrimary
          v-if="allowSelect"
          :disabled="isNull(selectedLicence)"
          :loading="saving"
          data-cy="button-confirm"
          @click.stop="onConfirm"
        >
          {{ t('system.mainBar.extSystemLicenceSwitch.confirm') }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
