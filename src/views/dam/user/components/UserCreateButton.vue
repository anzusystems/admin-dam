<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { useCreateUserValidation } from '@/views/dam/user/composables/userValidation'
import { useUserFactory } from '@/model/dam/factory/UserFactory'
import { ref } from 'vue'
import type { CreateUser, User } from '@/types/dam/User'
import { useI18n } from 'vue-i18n'
import { useUiHelper } from '@/composables/system/uiHelper'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import { createUser, ENTITY } from '@/services/api/dam/userApi'
import { isUndefined } from '@/utils/common'
import { ROUTE } from '@/router/routes'
import ABtn from '@/components/common/buttons/ABtn.vue'
import ATextField from '@/components/form/ATextField.vue'
import ARow from '@/components/common/ARow.vue'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import ExtSystemSelect from '@/views/dam/extSystem/components/ExtSystemSelect.vue'
import ABooleanToggle from '@/components/form/ABooleanToggle.vue'
import ExternalProviderAssetSelect from '@/views/dam/externalProviderAsset/components/ExternalProviderAssetSelect.vue'
import DistributionServiceSelect from '@/views/dam/distribution/components/DistributionServiceSelect.vue'
import AssetLicenceSelect from '@/views/dam/assetLicence/components/AssetLicenceSelect.vue'
import { damPubConfig } from '@/services/DamConfigService'
import { UserAuthType } from '@/types/dam/DamConfig'
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
  (e: 'afterCreate', data: User): void
}>()

const { createDefaultForCreate } = useUserFactory()
const userCreate = ref<CreateUser>(createDefaultForCreate())
const dialog = ref(false)

const onClick = () => {
  userCreate.value = createDefaultForCreate()
  dialog.value = true
}

const onCancel = () => {
  dialog.value = false
}

const router = useRouter()
const { v$ } = useCreateUserValidation(userCreate, damPubConfig.userAuthType)
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
    const res = await createUser(userCreate.value)
    emit('afterCreate', res)
    showRecordWas('created')
    dialog.value = false
    if (!isUndefined(res.id) && !props.disableRedirect) {
      router.push({ name: ROUTE.DAM.USER.DETAIL, params: { id: res.id } })
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
        <span>{{ t('coreDam.user.meta.create') }}</span>
        <VSpacer></VSpacer>
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
          <ARow v-if="damPubConfig.userAuthType === UserAuthType.OAuth2">
            <ATextField v-model="userCreate.id" :v="v$.userCreate.id" required data-cy="user-id"></ATextField>
          </ARow>
          <ARow>
            <ATextField v-model="userCreate.email" :v="v$.userCreate.email" required data-cy="user-email"></ATextField>
          </ARow>
          <ARow>
            <ATextField
              v-model="userCreate.firstName"
              :v="v$.userCreate.firstName"
              data-cy="user-first-name"
            ></ATextField>
          </ARow>
          <ARow>
            <ATextField v-model="userCreate.lastName" :v="v$.userCreate.lastName" data-cy="user-last-name"></ATextField>
          </ARow>
          <ARow v-if="damPubConfig.userAuthType === UserAuthType.JsonCredentials">
            <ATextField
              v-model="userCreate.plainPassword"
              :v="v$.userCreate.plainPassword"
              required
              type="password"
              data-cy="user-password"
            ></ATextField>
          </ARow>
          <ARow>
            <AssetLicenceSelect
              :label="t('coreDam.user.model.assetLicences')"
              v-model="userCreate.assetLicences"
              :v="v$.userCreate.assetLicences"
              multiple
              data-cy="user-asset-licences"
            ></AssetLicenceSelect>
          </ARow>
          <ARow>
            <ExtSystemSelect
              :label="t('coreDam.user.model.adminToExtSystems')"
              v-model="userCreate.adminToExtSystems"
              multiple
            ></ExtSystemSelect>
          </ARow>
          <ARow>
            <ExternalProviderAssetSelect
              :label="t('coreDam.user.model.allowedAssetExternalProviders')"
              v-model="userCreate.allowedAssetExternalProviders"
              multiple
              data-cy="user-allowed-asset-external-providers"
            ></ExternalProviderAssetSelect>
          </ARow>
          <ARow>
            <DistributionServiceSelect
              :label="t('coreDam.user.model.allowedDistributionServices')"
              v-model="userCreate.allowedDistributionServices"
              multiple
              data-cy="user-allowed-distribution-services"
            ></DistributionServiceSelect>
          </ARow>
          <ARow>
            <ABooleanToggle
              :label="t('coreDam.user.model.enabled')"
              v-model="userCreate.enabled"
              data-cy="user-enabled"
            ></ABooleanToggle>
          </ARow>
          <ARow>
            <ABooleanToggle
              :label="t('coreDam.user.model.superAdmin')"
              v-model="userCreate.superAdmin"
              data-cy="user-super-admin"
            ></ABooleanToggle>
          </ARow>
        </VContainer>
      </ASystemEntityScope>
      <VCardActions>
        <VSpacer></VSpacer>
        <VBtn color="secondary" variant="text" @click.stop="onCancel" data-cy="button-cancel">
          {{ t('common.button.cancel') }}
        </VBtn>
        <ABtn color="success" @click.stop="onConfirm" btn-helper="create" data-cy="button-create">
          {{ t(buttonT) }}
        </ABtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
