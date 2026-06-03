<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ADatetime,
  ARow,
  type DocId,
  useAlerts,
} from '@anzusystems/common-admin'
import { fetchTtsAsset } from '@/services/api/coreDam/ttsAssetApi'
import type { TtsAssetDetail } from '@/types/coreDam/TtsAsset'
import TtsAudioStatusChip from '@/views/coreDam/ttsNarrationRequest/components/TtsAudioStatusChip.vue'
import VoiceDiscriminatorChip from '@/views/coreDam/voiceFamily/components/VoiceDiscriminatorChip.vue'
import CachedVoiceFamilyChip from '@/views/coreDam/voiceFamily/components/CachedVoiceFamilyChip.vue'
import CachedKeywordChip from '@/views/coreDam/keyword/components/CachedKeywordChip.vue'
import CachedTtsNarrationRequestChip from '@/views/coreDam/ttsNarrationRequest/components/CachedTtsNarrationRequestChip.vue'
import { useCachedVoiceFamiliesById } from '@/views/coreDam/voiceFamily/composables/cachedVoiceFamilies'
import { useCachedKeywords } from '@/views/coreDam/keyword/composables/cachedKeywords'
import { useCachedTtsNarrationRequests } from '@/views/coreDam/ttsNarrationRequest/composables/cachedTtsNarrationRequests'

const props = withDefaults(
  defineProps<{
    assetId: DocId
  }>(),
  {}
)

const { t } = useI18n()
const { showErrorsDefault } = useAlerts()

const loading = ref(false)
const detail = ref<TtsAssetDetail | null>(null)

const { addToCachedVoiceFamilies, fetchCachedVoiceFamilies } = useCachedVoiceFamiliesById()
const { addToCachedKeywords, fetchCachedKeywords } = useCachedKeywords()
const { addToCachedTtsNarrationRequests, fetchCachedTtsNarrationRequests } = useCachedTtsNarrationRequests()

const load = async () => {
  loading.value = true
  try {
    const data = await fetchTtsAsset(props.assetId)
    detail.value = data
    if (!data) return

    if (data.lastRequestId) addToCachedTtsNarrationRequests([data.lastRequestId])

    const tts = data.tts
    if (tts) {
      if (tts.voiceFamily) addToCachedVoiceFamilies([tts.voiceFamily])
      if (tts.voiceFamilyKeywordIds.length) addToCachedKeywords(tts.voiceFamilyKeywordIds)
    }

    await Promise.all([
      fetchCachedVoiceFamilies(),
      fetchCachedKeywords(),
      fetchCachedTtsNarrationRequests(),
    ])
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    loading.value = false
  }
}

watch(() => props.assetId, load, { immediate: true })
</script>

<template>
  <div
    v-if="loading"
    class="d-flex w-100 justify-center align-center pa-2"
  >
    <VProgressCircular
      indeterminate
      color="primary"
    />
  </div>
  <div
    v-else-if="!detail || !detail.tts"
    class="pa-4 text-caption"
  >
    {{ t('coreDam.asset.detail.tts.noEntry') }}
  </div>
  <div
    v-else
    class="px-2 py-2 tts-sidebar-panel"
  >
    <ARow :title="t('coreDam.asset.detail.tts.status')">
      <TtsAudioStatusChip :status="detail.tts.status" />
    </ARow>
    <ARow :title="t('coreDam.asset.detail.tts.voiceFamily')">
      <CachedVoiceFamilyChip :id="detail.tts.voiceFamily" />
    </ARow>
    <ARow :title="t('coreDam.asset.detail.tts.voice')">
      <VoiceDiscriminatorChip :discriminator="detail.tts.discriminator" />
    </ARow>
    <ARow
      v-if="detail.tts.voiceFamilyKeywordIds.length"
      :title="t('coreDam.asset.detail.tts.voiceFamilyKeyword')"
    >
      <CachedKeywordChip
        v-for="keywordId in detail.tts.voiceFamilyKeywordIds"
        :id="keywordId"
        :key="keywordId"
      />
    </ARow>
    <ARow
      v-if="detail.tts.failureReason"
      :title="t('coreDam.asset.detail.tts.failureReason')"
      :value="detail.tts.failureReason"
    />
    <ARow :title="t('coreDam.asset.detail.tts.createdAt')">
      <ADatetime :date-time="detail.tts.createdAt" />
    </ARow>
    <ARow
      v-if="detail.lastRequestId"
      :title="t('coreDam.asset.detail.tts.sourceRequest')"
    >
      <CachedTtsNarrationRequestChip :id="detail.lastRequestId" />
    </ARow>
  </div>
</template>

<style lang="scss" scoped>
.tts-sidebar-panel {
  // Narrow sidebar container has overflow-y:auto but no overflow-x clip — long UUIDs in
  // ACopyText / chip labels force a horizontal scrollbar without this guard.
  overflow-x: hidden;
  overflow-wrap: anywhere;
}
</style>
