<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type {
  DamAssetType,
  DamDistributionRequirementsConfig,
  DamDistributionServiceName,
} from '@anzusystems/common-admin'
import {
  AFormDatetimePicker,
  AFormTextarea,
  AFormValueObjectOptionsSelect,
  AssetFileProcessStatus,
  ASystemEntityScope,
  type DocId,
  useAlerts,
  usePagination,
  useValidate,
} from '@anzusystems/common-admin'
import useVuelidate from '@vuelidate/core'
import type { DistributionYoutubeCreateRedistributeDto, DistributionYoutubeItem } from '@/types/coreDam/Distribution'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { useI18n } from 'vue-i18n'
import {
  createYoutubeDistribution,
  ENTITY,
  getYoutubeAuthUrl,
  prepareFormDataYoutubeDistribution,
  redistributeYoutubeDistribution,
} from '@/services/api/coreDam/distributionYoutubeApi'
import { useDistributionYoutubeFactory } from '@/model/coreDam/factory/DistributionYoutubeFactory'
import { distributionIsAuthorized, fetchAssetFileDistributionList } from '@/services/api/coreDam/distributionApi'
import {
  DistributionYoutubePrivacy,
  useDistributionYoutubePrivacy,
} from '@/model/coreDam/valueObject/DistributionYoutubePrivacy'
import DistributionYoutubeLanguageSelect from '@/views/coreDam/asset/detail/components/distribution/DistributionYoutubeLanguageSelect.vue'
import DistributionYoutubeTermOfUse from '@/views/coreDam/asset/detail/components/distribution/DistributionYoutubeTermOfUse.vue'
import DistributionYoutubePlaylistSelect from '@/views/coreDam/asset/detail/components/distribution/DistributionYoutubePlaylistSelect.vue'
import { useDistributionListStore } from '@/stores/coreDam/distributionListStore'
import { DistributionAuthStatus } from '@/types/coreDam/DistributionAuth'
import AssetDetailSlotSelect from '@/views/coreDam/asset/detail/components/AssetDetailSlotSelect.vue'
import { useDistributionFilter } from '@/model/coreDam/filter/DistributionFilter'
import type { AssetSlot } from '@/types/coreDam/AssetSlot'
import DistributionListItem from '@/views/coreDam/asset/detail/components/distribution/DistributionListItem.vue'
import { useAssetDetailDistributionDialog } from '@/views/coreDam/asset/detail/composables/assetDetailDistributionDialog'
import DistributionBlockedBy from '@/views/coreDam/asset/detail/components/distribution/DistributionBlockedBy.vue'
import YoutubeLogo from '@/views/coreDam/asset/detail/components/distribution/YoutubeLogo.vue'
import DistributionNewDialogYoutubeLogoutButton from '@/views/coreDam/asset/detail/components/distribution/DistributionNewDialogYoutubeLogoutButton.vue'

const props = withDefaults(
  defineProps<{
    distributionServiceName: DamDistributionServiceName
    assetType: DamAssetType
    config: DamDistributionRequirementsConfig
    assetId: DocId
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'closeDialog', reloadList: boolean): void
}>()

const existingDistributions = ref<Array<DistributionYoutubeItem>>([])

const { t } = useI18n()

const { createCreateDto } = useDistributionYoutubeFactory()
const distribution = ref<DistributionYoutubeCreateRedistributeDto>(createCreateDto())
const { redistributeMode, assetFileId, assetFileStatus, redistributeId } = useAssetDetailDistributionDialog()

const canDisplayForm = ref(false)
const saving = ref(false)

const authUrl = ref('')

const pagination = usePagination()
const filter = useDistributionFilter()
const distributionListStore = useDistributionListStore()

const loadFormData = async () => {
  canDisplayForm.value = false
  if (!assetFileId.value || assetFileStatus.value !== AssetFileProcessStatus.Processed) return
  filter.distributionService.model = props.distributionServiceName
  filter.id.model = redistributeId.value
  existingDistributions.value = await fetchAssetFileDistributionList<DistributionYoutubeItem>(
    assetFileId.value,
    pagination,
    filter
  )
  if (!redistributeMode.value && existingDistributions.value.length > 0) return
  if (redistributeMode.value && existingDistributions.value[0]) {
    distribution.value = {
      id: existingDistributions.value[0].id,
      distributionService: props.distributionServiceName,
      texts: {
        title: existingDistributions.value[0].texts.title,
        description: existingDistributions.value[0].texts.description,
        keywords: existingDistributions.value[0].texts.keywords,
      },
      privacy: existingDistributions.value[0].privacy,
      language: existingDistributions.value[0].language,
      playlist: existingDistributions.value[0].playlist,
      flags: {
        embeddable: existingDistributions.value[0].flags.embeddable,
        forKids: existingDistributions.value[0].flags.forKids,
        notifySubscribers: existingDistributions.value[0].flags.notifySubscribers,
      },
      blockedBy: existingDistributions.value[0].blockedBy,
      publishAt: existingDistributions.value[0].publishAt,
    }
    canDisplayForm.value = true
    return
  }
  const res = await prepareFormDataYoutubeDistribution(assetFileId.value, props.distributionServiceName)
  distribution.value = {
    id: '',
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
    blockedBy: res.blockedBy,
    publishAt: res.publishAt,
  }
  canDisplayForm.value = true
}

const closeDialog = (reload = false) => {
  emit('closeDialog', reload)
}

const { showRecordWas, showValidationError, showErrorsDefault } = useAlerts()
const { distributionYoutubePrivacyOptions } = useDistributionYoutubePrivacy()

const { required, requiredIf, minLength, maxLength } = useValidate()

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
    distributionService: {},
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

const submitRedistribute = async () => {
  if (!existingDistributions.value[0]?.id) return
  saving.value = true
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    saving.value = false
    return
  }
  try {
    await redistributeYoutubeDistribution(existingDistributions.value[0].id, distribution.value)
    showRecordWas('updated')
    await loadFormData()
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    saving.value = false
  }
}

const submitCreateNew = async () => {
  if (!assetFileId.value) return
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
    await loadFormData()
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    saving.value = false
  }
}

const submit = () => {
  if (redistributeMode.value) {
    submitRedistribute()
    return
  }
  submitCreateNew()
}

const onLogout = async () => {
  closeDialog(true)
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

const activeSlotChange = async (slot: null | AssetSlot) => {
  if (!slot || !slot.assetFile) return
  assetFileId.value = slot.assetFile.id
  assetFileStatus.value = slot.assetFile.fileAttributes.status
  existingDistributions.value = []
  await loadFormData()
}

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
    <VRow
      v-if="!redistributeMode && distributionAuthStatus === DistributionAuthStatus.Success"
      class="mb-6"
    >
      <VCol>
        <AssetDetailSlotSelect @active-slot-change="activeSlotChange" />
      </VCol>
    </VRow>
    <div>
      <div
        v-if="assetFileStatus !== AssetFileProcessStatus.Processed"
        class="d-flex w-100 h-100 justify-center align-center pa-2"
      >
        {{ t('coreDam.distribution.common.assetFileStatusCantDistribute') }}
      </div>
      <div v-else-if="!redistributeMode && existingDistributions.length > 0">
        <DistributionListItem
          v-for="item in existingDistributions"
          :key="item.id"
          :item="item"
          :asset-type="assetType"
        />
      </div>
      <div
        v-else-if="canDisplayForm"
        class="pa-4"
      >
        <ASystemEntityScope
          :system="SYSTEM_CORE_DAM"
          :subject="ENTITY"
        >
          <VRow>
            <VCol cols="6">
              <VRow class="mb-2">
                <VCol>
                  <AFormTextarea
                    v-model="distribution.texts.title"
                    :v="v$.distribution.texts.title"
                    required
                  />
                </VCol>
              </VRow>
              <VRow class="mb-2">
                <VCol>
                  <AFormTextarea
                    v-model="distribution.texts.description"
                    :v="v$.distribution.texts.description"
                    required
                  />
                </VCol>
              </VRow>
              <VRow class="mb-2">
                <VCol>
                  <VCombobox
                    v-model="distribution.texts.keywords"
                    :label="t('coreDam.youtubeDistribution.model.texts.keywords')"
                    :items="[]"
                    chips
                    multiple
                    closable-chips
                  />
                </VCol>
              </VRow>
              <VRow class="mb-2">
                <VCol>
                  <AFormValueObjectOptionsSelect
                    v-model="distribution.privacy"
                    :items="distributionYoutubePrivacyOptions"
                    :label="t('coreDam.youtubeDistribution.model.privacy')"
                  />
                </VCol>
              </VRow>
              <VRow
                v-if="distribution.privacy === DistributionYoutubePrivacy.Dynamic"
                class="mb-2"
              >
                <VCol>
                  <AFormDatetimePicker v-model="distribution.publishAt" />
                </VCol>
              </VRow>
            </VCol>
            <VCol
              cols="6"
              class="pl-4"
            >
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
                    v-model="distribution.flags.embeddable"
                    :label="t('coreDam.youtubeDistribution.model.flags.embeddable')"
                    hide-details
                  />
                </VCol>
              </VRow>
              <VRow class="mb-2">
                <VCol>
                  <VSwitch
                    v-model="distribution.flags.forKids"
                    :label="t('coreDam.youtubeDistribution.model.flags.forKids')"
                    hide-details
                  />
                </VCol>
              </VRow>
              <VRow class="mb-2">
                <VCol>
                  <VSwitch
                    v-model="distribution.flags.notifySubscribers"
                    :label="t('coreDam.youtubeDistribution.model.flags.notifySubscribers')"
                    hide-details
                  />
                </VCol>
              </VRow>
            </VCol>
          </VRow>
          <VRow class="mb-2">
            <VCol>
              <DistributionBlockedBy
                v-model="distribution.blockedBy"
                :config="config"
                :distribution-service-name="distributionServiceName"
                :asset-file-id="assetFileId"
                :asset-type="assetType"
              />
            </VCol>
          </VRow>
        </ASystemEntityScope>
      </div>
      <div
        v-else-if="distributionAuthStatus === DistributionAuthStatus.WaitingForLogin && authUrl.length > 0"
        class="pa-2 text-center"
      >
        <div class="pb-4">
          {{ t('coreDam.youtubeDistribution.loginDescription') }}
        </div>
        <div class="w-100 d-flex align-center justify-center pa-6 pb-8">
          <YoutubeLogo />
        </div>
        <VBtn
          color="primary"
          variant="flat"
          :href="authUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t('coreDam.youtubeDistribution.loginButton') }}
        </VBtn>
      </div>
      <div
        v-else-if="distributionAuthStatus === DistributionAuthStatus.Error"
        class="d-flex w-100 h-100 justify-center align-center pa-2 text-error"
      >
        {{ t('coreDam.distribution.common.error') }}
      </div>
      <div
        v-else
        class="d-flex w-100 h-100 justify-center align-center pa-2"
      >
        <VProgressCircular
          indeterminate
          color="primary"
        />
      </div>
    </div>
    <DistributionYoutubeTermOfUse class="pa-4 text-caption" />
  </VCardText>
  <VCardActions>
    <DistributionNewDialogYoutubeLogoutButton
      v-if="distributionAuthStatus !== DistributionAuthStatus.WaitingForLogin"
      :distribution-service-name="distributionServiceName"
      @on-success-logout="onLogout"
    />
    <VSpacer />
    <ABtnTertiary @click.stop="closeDialog(false)">
      {{ t('common.button.cancel') }}
    </ABtnTertiary>
    <ABtnPrimary
      v-if="canDisplayForm"
      :loading="saving"
      @click.stop="submit"
    >
      <span v-if="redistributeMode">{{ t('common.button.confirm') }}</span>
      <span v-else>{{ t('common.button.add') }}</span>
    </ABtnPrimary>
  </VCardActions>
</template>
