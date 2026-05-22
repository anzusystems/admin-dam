<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  AActionCloseButton,
  ABooleanValue,
  ACard,
  ACopyText,
  ADatetime,
  ARow,
  AUserAndTimeTrackingFields,
} from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { fetchTtsNarrationRequest } from '@/services/api/coreDam/ttsNarrationRequestApi'
import type { TtsNarrationRequestDetail } from '@/types/coreDam/TtsNarrationRequest'
import type { VoiceDiscriminatorType } from '@/types/coreDam/Voice'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import CachedKeywordChip from '@/views/coreDam/keyword/components/CachedKeywordChip.vue'
import TtsRequestStatusChip from '@/views/coreDam/ttsNarrationRequest/components/TtsRequestStatusChip.vue'
import TtsRequestModeChip from '@/views/coreDam/ttsNarrationRequest/components/TtsRequestModeChip.vue'
import TtsAudioStatusChip from '@/views/coreDam/ttsNarrationRequest/components/TtsAudioStatusChip.vue'
import VoiceDiscriminatorChip from '@/views/coreDam/voiceFamily/components/VoiceDiscriminatorChip.vue'
import CachedVoiceFamilyChip from '@/views/coreDam/voiceFamily/components/CachedVoiceFamilyChip.vue'
import CachedAssetLicenceChip from '@/views/coreDam/assetLicence/components/CachedAssetLicenceChip.vue'
import CachedExtSystemChip from '@/views/coreDam/extSystem/components/CachedExtSystemChip.vue'
import AssetChip from '@/views/coreDam/asset/detail/components/AssetChip.vue'
import { useCachedKeywords } from '@/views/coreDam/keyword/composables/cachedKeywords'
import { useCachedAssetLicences } from '@/views/coreDam/assetLicence/composables/cachedAssetLicences'
import { useCachedExtSystems } from '@/views/coreDam/extSystem/composables/cachedExtSystems'
import { useCachedVoiceFamiliesById } from '@/views/coreDam/voiceFamily/composables/cachedVoiceFamilies'

const route = useRoute()
const { t } = useI18n()

const loading = ref(true)
const detail = ref<TtsNarrationRequestDetail | null>(null)

const { addToCachedKeywords, fetchCachedKeywords } = useCachedKeywords()
const { addToCachedAssetLicences, fetchCachedAssetLicences } = useCachedAssetLicences()
const { addToCachedExtSystems, fetchCachedExtSystems } = useCachedExtSystems()
const { addToCachedVoiceFamilies, fetchCachedVoiceFamilies } = useCachedVoiceFamiliesById()

onMounted(async () => {
  loading.value = true
  try {
    const data = await fetchTtsNarrationRequest(route.params.id as string)
    detail.value = data

    if (data) {
      const { request, ttsAsset } = data

      if (ttsAsset?.voiceFamilyKeywordId) addToCachedKeywords([ttsAsset.voiceFamilyKeywordId])
      if (request.assetLicenceId !== null) addToCachedAssetLicences([request.assetLicenceId])
      addToCachedExtSystems([request.extSystemId])
      if (ttsAsset?.voiceFamilyId) addToCachedVoiceFamilies([ttsAsset.voiceFamilyId])

      await Promise.all([
        fetchCachedKeywords(),
        fetchCachedAssetLicences(),
        fetchCachedExtSystems(),
        fetchCachedVoiceFamilies(),
      ])
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <ActionbarWrapper :last-breadcrumb-title="detail?.request.id ?? ''">
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
            <ACopyText :value="detail.request.id" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.status')">
            <TtsRequestStatusChip :status="detail.request.status" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.mode')">
            <TtsRequestModeChip :mode="detail.request.mode" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.extSystemId')">
            <CachedExtSystemChip :id="detail.request.extSystemId" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.assetLicenceId')">
            <template v-if="detail.request.assetLicenceId !== null">
              <CachedAssetLicenceChip :id="detail.request.assetLicenceId" />
            </template>
            <template v-else>
              —
            </template>
          </ARow>
          <ARow
            :title="t('coreDam.ttsNarrationRequest.detail.fields.voiceFamilySlug')"
            :value="detail.request.voiceFamilySlug"
          />
          <ARow
            :title="t('coreDam.ttsNarrationRequest.detail.fields.title')"
            :value="detail.request.title"
          />
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.openInitialKey')">
            <template v-if="detail.request.openInitialKey">
              <ACopyText :value="detail.request.openInitialKey" />
            </template>
            <template v-else>
              —
            </template>
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.stableAssetId')">
            <template v-if="detail.request.stableAssetId">
              <AssetChip :id="detail.request.stableAssetId" />
            </template>
            <template v-else>
              —
            </template>
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.resultAssetId')">
            <template v-if="detail.request.resultAssetId">
              <AssetChip :id="detail.request.resultAssetId" />
            </template>
            <template v-else>
              —
            </template>
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.cancelRequested')">
            <ABooleanValue
              chip
              :value="detail.request.cancelRequested"
            />
          </ARow>
          <ARow
            :title="t('coreDam.ttsNarrationRequest.detail.fields.failureReason')"
            :value="detail.request.failureReason"
          />
        </VCol>
        <VCol cols="4">
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.startedAt')">
            <ADatetime :date-time="detail.request.startedAt" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.extResourceName')">
            {{ detail.request.extRef.extResourceName }}
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.extId')">
            {{ detail.request.extRef.extId }}
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.extVersion')">
            {{ detail.request.extRef.extVersion }}
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.includeInRecommended')">
            <ABooleanValue
              chip
              :value="detail.request.includeInRecommended"
            />
          </ARow>
          <AUserAndTimeTrackingFields :data="detail.request" />
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
            <CachedVoiceFamilyChip :id="detail.ttsAsset.voiceFamilyId" />
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
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.assetStaging')">
            <ABooleanValue
              chip
              :value="detail.ttsAsset.staging"
            />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.voiceFamilyKeywordId')">
            <template v-if="detail.ttsAsset.voiceFamilyKeywordId">
              <CachedKeywordChip :id="detail.ttsAsset.voiceFamilyKeywordId" />
            </template>
            <template v-else>
              —
            </template>
          </ARow>
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
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.assetExtResourceName')">
            {{ detail.ttsAsset.extResourceName }}
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.assetExtId')">
            {{ detail.ttsAsset.extId }}
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
