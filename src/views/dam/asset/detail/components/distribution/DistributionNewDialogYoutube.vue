<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { DistributionRequirementsConfig, DistributionServiceName } from '@/types/dam/DamConfig'
import type { DocId } from '@anzusystems/common-admin'
import { useAssetDetailStore } from '@/stores/dam/assetDetailStore'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import { maxLength, minLength, required, requiredIf } from '@/plugins/validators'
import useVuelidate from '@vuelidate/core'
import type { DistributionYoutubeCreateDto } from '@/types/dam/Distribution'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { useI18n } from 'vue-i18n'
import {
  createYoutubeDistribution,
  ENTITY,
  getYoutubeAuthUrl,
  prepareFormDataYoutubeDistribution,
} from '@/services/api/dam/distributionYoutubeApi'
import { useDistributionYoutubeFactory } from '@/model/dam/factory/DistributionYoutube'
import { distributionIsAuthorized } from '@/services/api/dam/distributionApi'
import AValueObjectOptionsSelect from '@/components/form/AValueObjectOptionsSelect.vue'
import {
  DistributionYoutubePrivacy,
  useDistributionYoutubePrivacy,
} from '@/model/dam/valueObject/DistributionYoutubePrivacy'
import ADatetimePicker from '@/components/common/ADatetimePicker.vue'
import DistributionYoutubeLanguageSelect from '@/views/dam/asset/detail/components/distribution/DistributionYoutubeLanguageSelect.vue'
import DistributionYoutubeTermOfUse from '@/views/dam/asset/detail/components/distribution/DistributionYoutubeTermOfUse.vue'
import DistributionYoutubePlaylistSelect from '@/views/dam/asset/detail/components/distribution/DistributionYoutubePlaylistSelect.vue'
import { useDistributionListStore } from '@/stores/dam/distributionListStore'
import { DistributionAuthStatus } from '@/types/dam/DistributionAuth'
import ATextarea from '@/components/form/ATextarea.vue'

const props = withDefaults(
  defineProps<{
    distributionServiceName: DistributionServiceName
    assetType: AssetType
    config: DistributionRequirementsConfig
    assetId: DocId
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'closeDialog', reloadList: boolean): void
}>()

const { t } = useI18n({ useScope: 'global' })

const { createCreateDto } = useDistributionYoutubeFactory()
const distribution = ref<DistributionYoutubeCreateDto>(createCreateDto())

const canDisplayForm = ref(false)
const saving = ref(false)

const authUrl = ref('')

const assetDetailStore = useAssetDetailStore()
const distributionListStore = useDistributionListStore()

const assetFileId = computed(() => {
  if (assetDetailStore.asset && assetDetailStore.asset.mainFile) return assetDetailStore.asset.mainFile.id
  return ''
})

const loadFormData = async () => {
  canDisplayForm.value = false
  const res = await prepareFormDataYoutubeDistribution(assetFileId.value, props.distributionServiceName)
  distribution.value = {
    publishAt: res.publishAt,
    distributionService: props.distributionServiceName,
    texts: {
      title: res.texts.title,
      description: res.texts.description,
      keywords: res.texts.keywords,
    },
    privacy: res.privacy,
    language: res.language,
    playlist: res.playlist,
    flags: {
      embeddable: res.flags.embeddable,
      forKids: res.flags.forKids,
      notifySubscribers: res.flags.notifySubscribers,
    },
  }
  canDisplayForm.value = true
}

const closeDialog = (reload = false) => {
  emit('closeDialog', reload)
}

const { showRecordWas, showValidationError } = useAlerts()
const { handleError } = useErrorHandler()
const { distributionYoutubePrivacyOptions } = useDistributionYoutubePrivacy()

const rules = computed(() => ({
  distribution: {
    texts: {
      title: {
        required,
        minLength: minLength(1),
        maxLength: maxLength(128),
      },
      description: {
        required,
        minLength: minLength(1),
        maxLength: maxLength(5000),
      },
    },
    publishAt: {
      required: requiredIf(distribution.value.privacy === DistributionYoutubePrivacy.Dynamic),
    },
  },
}))
const v$ = useVuelidate(rules, { distribution })

const checkAuthorized = async () => {
  if (props.config.requiredAuth) {
    const resIsAuthorized = await distributionIsAuthorized(props.distributionServiceName)
    if (resIsAuthorized.authorized) {
      distributionListStore.setAuthStatus(props.distributionServiceName, DistributionAuthStatus.Success)
      return
    }
    const resAuthUrl = await getYoutubeAuthUrl(props.distributionServiceName)
    authUrl.value = resAuthUrl.url
    distributionListStore.setAuthStatus(props.distributionServiceName, DistributionAuthStatus.WaitingForLogin)
  }
  // YouTube always requires auth for now
}

const submit = async () => {
  saving.value = true
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    saving.value = false
    return
  }
  try {
    await createYoutubeDistribution(assetFileId.value, distribution.value)
    showRecordWas('created')
    closeDialog(true)
  } catch (error) {
    handleError(error)
  } finally {
    saving.value = false
  }
}

const distributionAuthStatus = computed(() => {
  const auth = distributionListStore.getDistributionAuth(props.distributionServiceName)
  if (auth) return auth.status
  return DistributionAuthStatus.Idle
})

watch(distributionAuthStatus, async (newValue) => {
  if (newValue === DistributionAuthStatus.Success) {
    await loadFormData()
  }
})

onMounted(async () => {
  distributionListStore.setAuthStatus(props.distributionServiceName)
  await checkAuthorized()
})

onUnmounted(async () => {
  distributionListStore.resetAuth(props.distributionServiceName)
})
</script>

<template>
  <VCardText>
    <div>
      <div v-if="canDisplayForm" class="pa-4">
        <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
          <VRow>
            <VCol cols="6">
              <VRow class="mb-6">
                <VCol class="text-caption"
                  >{{ t('coreDam.distribution.common.fileIdVersion') }}: {{ assetFileId }}</VCol
                >
              </VRow>
              <VRow class="mb-2">
                <VCol>
                  <ATextarea v-model="distribution.texts.title" :v="v$.distribution.texts.title" required></ATextarea>
                </VCol>
              </VRow>
              <VRow class="mb-2">
                <VCol>
                  <ATextarea
                    v-model="distribution.texts.description"
                    :v="v$.distribution.texts.description"
                    required
                  ></ATextarea>
                </VCol>
              </VRow>
              <VRow class="mb-2">
                <VCol>
                  <VCombobox
                    :label="t('coreDam.youtubeDistribution.model.texts.keywords')"
                    v-model="distribution.texts.keywords"
                    :items="[]"
                    multiple
                    chips
                    closable-chips
                  ></VCombobox>
                </VCol>
              </VRow>
              <VRow class="mb-2">
                <VCol>
                  <AValueObjectOptionsSelect
                    v-model="distribution.privacy"
                    :items="distributionYoutubePrivacyOptions"
                    :label="t('coreDam.youtubeDistribution.model.privacy')"
                  ></AValueObjectOptionsSelect>
                </VCol>
              </VRow>
              <VRow class="mb-2" v-if="distribution.privacy === DistributionYoutubePrivacy.Dynamic">
                <VCol>
                  <ADatetimePicker v-model="distribution.publishAt"></ADatetimePicker>
                </VCol>
              </VRow>
            </VCol>
            <VCol cols="6" class="pl-4">
              <VRow class="mb-2">
                <VCol>
                  <DistributionYoutubeLanguageSelect
                    v-model="distribution.language"
                    :label="t('coreDam.youtubeDistribution.model.language')"
                    :distribution-service-name="distributionServiceName"
                  />
                </VCol>
              </VRow>
              <VRow class="mb-2">
                <VCol>
                  <DistributionYoutubePlaylistSelect
                    v-model="distribution.playlist"
                    :label="t('coreDam.youtubeDistribution.model.playlist')"
                    :distribution-service-name="distributionServiceName"
                  />
                </VCol>
              </VRow>
              <VRow class="mb-2">
                <VCol>
                  <VSwitch
                    :label="t('coreDam.youtubeDistribution.model.flags.embeddable')"
                    v-model="distribution.flags.embeddable"
                    hide-details
                  ></VSwitch>
                </VCol>
              </VRow>
              <VRow class="mb-2">
                <VCol>
                  <VSwitch
                    :label="t('coreDam.youtubeDistribution.model.flags.forKids')"
                    v-model="distribution.flags.forKids"
                    hide-details
                  ></VSwitch>
                </VCol>
              </VRow>
              <VRow class="mb-2">
                <VCol>
                  <VSwitch
                    :label="t('coreDam.youtubeDistribution.model.flags.notifySubscribers')"
                    v-model="distribution.flags.notifySubscribers"
                    hide-details
                  ></VSwitch>
                </VCol>
              </VRow>
            </VCol>
          </VRow>
        </ASystemEntityScope>
      </div>
      <div
        v-else-if="distributionAuthStatus === DistributionAuthStatus.WaitingForLogin && authUrl.length > 0"
        class="pa-2 text-center"
      >
        <div class="pb-4">{{ t('coreDam.youtubeDistribution.loginDescription') }}</div>
        <VBtn color="primary" variant="flat" :href="authUrl" target="_blank">
          {{ t('coreDam.youtubeDistribution.loginButton') }}
        </VBtn>
      </div>
      <div
        v-else-if="distributionAuthStatus === DistributionAuthStatus.Error"
        class="d-flex w-100 h-100 justify-center align-center pa-2 text-error"
      >
        {{ t('coreDam.distribution.common.error') }}
      </div>
      <div v-else class="d-flex w-100 h-100 justify-center align-center pa-2">
        <VProgressCircular indeterminate color="primary"></VProgressCircular>
      </div>
    </div>
    <DistributionYoutubeTermOfUse class="pa-4 text-caption" />
  </VCardText>
  <VCardActions>
    <VSpacer></VSpacer>
    <VBtn color="success" @click.stop="submit" v-if="canDisplayForm" :loading="saving">
      {{ t('common.button.add') }}
    </VBtn>
    <VBtn text @click.stop="closeDialog(false)">{{ t('common.button.cancel') }}</VBtn>
  </VCardActions>
</template>
