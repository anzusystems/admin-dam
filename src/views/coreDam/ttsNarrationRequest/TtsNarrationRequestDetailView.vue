<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useIntervalFn } from '@vueuse/core'
import {
  AActionCloseButton,
  ABooleanValue,
  ACard,
  ACopyText,
  ADatetime,
  ARow,
  AUserAndTimeTrackingFields,
  useAlerts,
} from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { fetchTtsNarrationRequest } from '@/services/api/coreDam/ttsNarrationRequestApi'
import {
  IN_PROGRESS_TTS_REQUEST_STATUSES,
  type TtsNarrationRequestDetail,
} from '@/types/coreDam/TtsNarrationRequest'
import type { VoiceDiscriminatorType } from '@/types/coreDam/Voice'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import TtsRequestStatusChip from '@/views/coreDam/ttsNarrationRequest/components/TtsRequestStatusChip.vue'
import TtsRequestModeChip from '@/views/coreDam/ttsNarrationRequest/components/TtsRequestModeChip.vue'
import TtsAudioStatusChip from '@/views/coreDam/ttsNarrationRequest/components/TtsAudioStatusChip.vue'
import VoiceDiscriminatorChip from '@/views/coreDam/voiceFamily/components/VoiceDiscriminatorChip.vue'
import CachedVoiceFamilyChip from '@/views/coreDam/voiceFamily/components/CachedVoiceFamilyChip.vue'
import CachedAssetLicenceChip from '@/views/coreDam/assetLicence/components/CachedAssetLicenceChip.vue'
import CachedExtSystemChip from '@/views/coreDam/extSystem/components/CachedExtSystemChip.vue'
import AssetChip from '@/views/coreDam/asset/detail/components/AssetChip.vue'
import { useCachedAssetLicences } from '@/views/coreDam/assetLicence/composables/cachedAssetLicences'
import { useCachedExtSystems } from '@/views/coreDam/extSystem/composables/cachedExtSystems'
import { useCachedVoiceFamiliesById } from '@/views/coreDam/voiceFamily/composables/cachedVoiceFamilies'

const route = useRoute()
const { t } = useI18n()
const { showErrorsDefault } = useAlerts()

const loading = ref(true)
const detail = ref<TtsNarrationRequestDetail | null>(null)

const { addToCachedAssetLicences, fetchCachedAssetLicences } = useCachedAssetLicences()
const { addToCachedExtSystems, fetchCachedExtSystems } = useCachedExtSystems()
const { addToCachedVoiceFamilies, fetchCachedVoiceFamilies } = useCachedVoiceFamiliesById()

const POLL_INTERVAL_MS = 5000

const isInProgress = (): boolean =>
  detail.value !== null && IN_PROGRESS_TTS_REQUEST_STATUSES.includes(detail.value.status)

const refresh = async () => {
  // Capture the route id at call time; if navigation happens while the request
  // is in-flight the resolved data belongs to a different route — discard it.
  const expectedId = route.params.id as string
  try {
    const data = await fetchTtsNarrationRequest(expectedId)
    if ((route.params.id as string) !== expectedId) return
    detail.value = data
    if (data?.ttsAsset?.voiceFamily) {
      addToCachedVoiceFamilies([data.ttsAsset.voiceFamily])
      await fetchCachedVoiceFamilies()
    }
    if (!isInProgress()) pausePolling()
  } catch (error) {
    if ((route.params.id as string) !== expectedId) return
    // Stop polling on error to avoid infinite retry on a persistent failure; show toast once.
    pausePolling()
    showErrorsDefault(error)
  }
}

const { pause: pausePolling, resume: resumePolling } = useIntervalFn(refresh, POLL_INTERVAL_MS, {
  immediate: false,
})

onMounted(async () => {
  loading.value = true
  try {
    const data = await fetchTtsNarrationRequest(route.params.id as string)
    detail.value = data

    if (data) {
      if (data.assetLicenceId !== null) addToCachedAssetLicences([data.assetLicenceId])
      addToCachedExtSystems([data.extSystemId])
      if (data.ttsAsset?.voiceFamily) addToCachedVoiceFamilies([data.ttsAsset.voiceFamily])

      await Promise.all([
        fetchCachedAssetLicences(),
        fetchCachedExtSystems(),
        fetchCachedVoiceFamilies(),
      ])

      if (isInProgress()) resumePolling()
    }
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  pausePolling()
})
</script>

<template>
  <ActionbarWrapper :last-breadcrumb-title="detail?.id ?? ''">
    <template #buttons>
      <AActionCloseButton :route-name="ROUTE.DAM.TTS_NARRATION_REQUEST.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard
    :loading="loading"
    :title="t('coreDam.ttsNarrationRequest.detail.requestSection')"
  >
    <VCardText v-if="detail">
      <VRow>
        <VCol cols="8">
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.id')">
            <ACopyText :value="detail.id" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.status')">
            <TtsRequestStatusChip :status="detail.status" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.mode')">
            <TtsRequestModeChip :mode="detail.mode" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.extSystemId')">
            <CachedExtSystemChip :id="detail.extSystemId" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.assetLicenceId')">
            <template v-if="detail.assetLicenceId !== null">
              <CachedAssetLicenceChip :id="detail.assetLicenceId" />
            </template>
            <template v-else>
              —
            </template>
          </ARow>
          <ARow
            :title="t('coreDam.ttsNarrationRequest.detail.fields.voiceFamilySlug')"
            :value="detail.voiceFamilySlug"
          />
          <ARow
            :title="t('coreDam.ttsNarrationRequest.detail.fields.title')"
            :value="detail.title"
          />
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.stableAssetId')">
            <template v-if="detail.stableAssetId">
              <AssetChip :id="detail.stableAssetId" />
            </template>
            <template v-else>
              —
            </template>
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.resultAssetId')">
            <template v-if="detail.resultAssetId">
              <AssetChip :id="detail.resultAssetId" />
            </template>
            <template v-else>
              —
            </template>
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.cancelRequested')">
            <ABooleanValue
              chip
              :value="detail.cancelRequested"
            />
          </ARow>
          <ARow
            :title="t('coreDam.ttsNarrationRequest.detail.fields.failureReason')"
            :value="detail.failureReason"
          />
        </VCol>
        <VCol cols="4">
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.startedAt')">
            <ADatetime :date-time="detail.startedAt" />
          </ARow>
          <AUserAndTimeTrackingFields :data="detail" />
        </VCol>
      </VRow>
    </VCardText>
  </ACard>

  <ACard
    v-if="detail?.ttsAsset"
    :title="t('coreDam.ttsNarrationRequest.detail.ttsAssetSection')"
    class="mt-4"
  >
    <VCardText>
      <VRow>
        <VCol cols="8">
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.assetId')">
            <AssetChip :id="detail.ttsAsset.assetId" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.assetDiscriminator')">
            <VoiceDiscriminatorChip :discriminator="(detail.ttsAsset.discriminator as VoiceDiscriminatorType)" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.assetVoiceFamilyId')">
            <CachedVoiceFamilyChip :id="detail.ttsAsset.voiceFamily" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.externalVoiceId')">
            <ACopyText :value="detail.ttsAsset.externalVoiceId" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.assetStatus')">
            <TtsAudioStatusChip :status="detail.ttsAsset.status" />
          </ARow>
          <ARow
            :title="t('coreDam.ttsNarrationRequest.detail.fields.assetFailureReason')"
            :value="detail.ttsAsset.failureReason"
          />
        </VCol>
        <VCol cols="4">
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.assetCreatedAt')">
            <ADatetime :date-time="detail.ttsAsset.createdAt" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.assetModifiedAt')">
            <ADatetime :date-time="detail.ttsAsset.modifiedAt" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.sourceTextHash')">
            <ACopyText :value="detail.ttsAsset.sourceTextHash" />
          </ARow>
        </VCol>
      </VRow>
    </VCardText>
  </ACard>

  <ACard
    v-else-if="!loading"
    :title="t('coreDam.ttsNarrationRequest.detail.ttsAssetSection')"
    class="mt-4"
  >
    <VCardText>
      <p>{{ t('coreDam.ttsNarrationRequest.detail.noTtsAsset') }}</p>
    </VCardText>
  </ACard>
</template>
