<script lang="ts" setup>
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ADatetime, ARow, type DocId } from '@anzusystems/common-admin'
import TtsAudioStatusChip from '@/domains/coreDam/ttsNarrationRequest/components/TtsAudioStatusChip.vue'
import VoiceDiscriminatorChip from '@/domains/coreDam/voiceFamily/components/VoiceDiscriminatorChip.vue'
import CachedVoiceFamilyChip from '@/domains/coreDam/voiceFamily/components/CachedVoiceFamilyChip.vue'
import CachedTtsNarrationRequestChip from '@/domains/coreDam/ttsNarrationRequest/components/CachedTtsNarrationRequestChip.vue'
import { useAssetDetailSidebarTtsActions } from '@/domains/coreDam/asset/components/detail/composables/assetDetailSidebarTtsActions'

const props = withDefaults(
  defineProps<{
    assetId: DocId
  }>(),
  {}
)

const { t } = useI18n()
const { loading, detail, fetchData } = useAssetDetailSidebarTtsActions()

watch(
  () => props.assetId,
  (assetId) => fetchData(assetId),
  { immediate: true }
)
</script>

<template>
  <div
    v-if="loading"
    class="w-100 d-flex align-center justify-center pa-4"
  >
    <VProgressCircular
      indeterminate
      color="primary"
    />
  </div>
  <div
    v-else-if="!detail || !detail.tts"
    class="px-3 py-2 text-body-small"
  >
    {{ t('coreDam.asset.detail.tts.noEntry') }}
  </div>
  <div
    v-else
    class="px-3 py-2"
  >
    <ARow :title="t('coreDam.asset.detail.tts.status')">
      <TtsAudioStatusChip :status="detail.tts.status" />
    </ARow>
    <ARow :title="t('coreDam.asset.detail.tts.voiceFamily')">
      <CachedVoiceFamilyChip :id="detail.tts.voiceFamily" />
    </ARow>
    <ARow :title="t('coreDam.asset.detail.tts.provider')">
      <VoiceDiscriminatorChip :discriminator="detail.tts.provider" />
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
