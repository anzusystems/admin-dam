<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { DistributionRequirementsConfig, DistributionServiceName } from '@/types/dam/DamConfig'
import type { DocId } from '@anzusystems/common-admin'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import { maxLength, minLength, required, requiredIf } from '@/plugins/validators'
import useVuelidate from '@vuelidate/core'
import type { DistributionYoutubeCreateDto } from '@/types/dam/Distribution'
import { DistributionYoutubeItem } from '@/types/dam/Distribution'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { useI18n } from 'vue-i18n'
import {
  createYoutubeDistribution,
  ENTITY,
  getYoutubeAuthUrl,
  prepareFormDataYoutubeDistribution,
  redistributeYoutubeDistribution,
} from '@/services/api/dam/distributionYoutubeApi'
import { useDistributionYoutubeFactory } from '@/model/dam/factory/DistributionYoutube'
import { distributionIsAuthorized, fetchAssetFileDistributionList } from '@/services/api/dam/distributionApi'
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
import AssetDetailSlotSelect from '@/views/dam/asset/detail/components/AssetDetailSlotSelect.vue'
import { usePagination } from '@/composables/system/pagination'
import { useDistributionFilter } from '@/model/dam/filter/DistributionFilter'
import { AssetSlot } from '@/types/dam/AssetSlot'
import DistributionListItem from '@/views/dam/asset/detail/components/distribution/DistributionListItem.vue'
import { useAssetDetailDistributionDialog } from '@/views/dam/asset/detail/composables/assetDetailDistributionDialog'

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

const existingDistributions = ref<Array<DistributionYoutubeItem>>([])

const { t } = useI18n({ useScope: 'global' })

const { createCreateDto } = useDistributionYoutubeFactory()
const distribution = ref<DistributionYoutubeCreateDto>(createCreateDto())
const { redistributeMode, assetFileId } = useAssetDetailDistributionDialog()

const canDisplayForm = ref(false)
const saving = ref(false)

const authUrl = ref('')

const pagination = usePagination()
const filter = useDistributionFilter()
const distributionListStore = useDistributionListStore()

const loadFormData = async () => {
  canDisplayForm.value = false
  if (!assetFileId.value) return
  filter.distributionService.model = props.distributionServiceName
  existingDistributions.value = await fetchAssetFileDistributionList<DistributionYoutubeItem>(
    assetFileId.value,
    pagination,
    filter
  )
  if (!redistributeMode.value && existingDistributions.value.length > 0) return
  if (redistributeMode.value && existingDistributions.value[0]) {
    distribution.value = {
      publishAt: existingDistributions.value[0].publishAt,
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
    }
    canDisplayForm.value = true
    return
  }
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
    closeDialog(true)
  } catch (error) {
    handleError(error)
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
    closeDialog(true)
  } catch (error) {
    handleError(error)
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
    <VRow v-if="!redistributeMode && distributionAuthStatus === DistributionAuthStatus.Success" class="mb-6">
      <VCol>
        <AssetDetailSlotSelect @active-slot-change="activeSlotChange" />
      </VCol>
    </VRow>
    <div>
      <div v-if="!redistributeMode && existingDistributions.length > 0">
        <DistributionListItem
          v-for="item in existingDistributions"
          :key="item.id"
          :item="item"
          :asset-type="assetType"
        />
      </div>
      <div v-else-if="canDisplayForm" class="pa-4">
        <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
          <VRow>
            <VCol cols="6">
              <VRow class="mb-2">
                <VCol>
                  <ATextarea v-model="distribution.texts.title" :v="v$.distribution.texts.title" required />
                </VCol>
              </VRow>
              <VRow class="mb-2">
                <VCol>
                  <ATextarea v-model="distribution.texts.description" :v="v$.distribution.texts.description" required />
                </VCol>
              </VRow>
              <VRow class="mb-2">
                <VCol>
                  <VCombobox
                    v-model="distribution.texts.keywords"
                    :label="t('coreDam.youtubeDistribution.model.texts.keywords')"
                    :items="[]"
                    multiple
                    chips
                    closable-chips
                  />
                </VCol>
              </VRow>
              <VRow class="mb-2">
                <VCol>
                  <AValueObjectOptionsSelect
                    v-model="distribution.privacy"
                    :items="distributionYoutubePrivacyOptions"
                    :label="t('coreDam.youtubeDistribution.model.privacy')"
                  />
                </VCol>
              </VRow>
              <VRow v-if="distribution.privacy === DistributionYoutubePrivacy.Dynamic" class="mb-2">
                <VCol>
                  <ADatetimePicker v-model="distribution.publishAt" />
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
        <VProgressCircular indeterminate color="primary" />
      </div>
    </div>
    <DistributionYoutubeTermOfUse class="pa-4 text-caption" />
  </VCardText>
  <VCardActions>
    <VSpacer />
    <VBtn v-if="canDisplayForm" color="success" :loading="saving" @click.stop="submit">
      <span v-if="redistributeMode">{{ t('common.button.confirm') }}</span>
      <span v-else>{{ t('common.button.add') }}</span>
    </VBtn>
    <VBtn text @click.stop="closeDialog(false)">{{ t('common.button.cancel') }}</VBtn>
  </VCardActions>
</template>
