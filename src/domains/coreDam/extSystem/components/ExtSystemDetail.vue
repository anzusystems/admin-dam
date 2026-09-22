<script lang="ts" setup>
import { ACachedChip, ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { useExtSystemOneStore } from '@/domains/coreDam/extSystem/store/extSystemStore'
import CachedDamUserChip from '@/domains/coreDam/shared/components/CachedDamUserChip.vue'
import CachedVoiceFamilyChip from '@/domains/coreDam/voiceFamily/components/CachedVoiceFamilyChip.vue'
import AssetChip from '@/domains/coreDam/asset/components/detail/components/AssetChip.vue'
import { useTtsActiveProviderMode } from '@/domains/coreDam/ttsNarrationRequest/valueObject/TtsActiveProviderMode'
import { useCachedKeywords } from '@/domains/coreDam/keyword/composables/cachedKeywords'

const { extSystem } = storeToRefs(useExtSystemOneStore())

const { t } = useI18n()
const { getTtsActiveProviderModeOption } = useTtsActiveProviderMode()
const { getCachedKeyword } = useCachedKeywords()

const activeProviderModeLabel = computed(
  () => getTtsActiveProviderModeOption(extSystem.value.ttsSettings.activeProviderMode)?.title ?? '-'
)
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ARow
        :title="t('coreDam.extSystem.model.name')"
        :value="extSystem.name"
      />
      <ARow
        :title="t('coreDam.extSystem.model.slug')"
        :value="extSystem.slug"
      />
      <ARow :title="t('coreDam.extSystem.model.adminUsers')">
        <CachedDamUserChip
          v-for="userId in extSystem.adminUsers"
          :id="userId"
          :key="userId"
          class="mr-2 mt-2"
        />
      </ARow>

      <VDivider class="my-4" />
      <div class="text-headline-small mb-2">
        {{ t('coreDam.extSystem.ttsSettings.title') }}
      </div>
      <ARow
        :title="t('coreDam.extSystem.ttsSettings.activeProviderMode')"
        :value="activeProviderModeLabel"
      />
      <ARow :title="t('coreDam.extSystem.ttsSettings.defaultVoiceFamily')">
        <CachedVoiceFamilyChip
          v-if="extSystem.ttsSettings.defaultVoiceFamilyId"
          :id="extSystem.ttsSettings.defaultVoiceFamilyId"
        />
        <template v-else>
          —
        </template>
      </ARow>
      <ARow :title="t('coreDam.extSystem.ttsSettings.autoKeyword')">
        <ACachedChip
          v-if="extSystem.ttsSettings.autoKeywordId"
          :id="extSystem.ttsSettings.autoKeywordId"
          :get-cached-fn="getCachedKeyword"
          :route="'/(coreDam)/keywords/[id]'"
          display-text-path="name"
        />
        <template v-else>
          —
        </template>
      </ARow>
      <ARow :title="t('coreDam.extSystem.ttsSettings.ttsFreeAudioEpilogAsset')">
        <AssetChip
          v-if="extSystem.ttsFreeAudioEpilogAsset"
          :id="extSystem.ttsFreeAudioEpilogAsset"
        />
        <template v-else>
          —
        </template>
      </ARow>
    </VCol>
    <VCol cols="4">
      <ARow :title="t('coreDam.extSystem.model.id')">
        <ACopyText :value="extSystem.id" />
      </ARow>
      <AUserAndTimeTrackingFields :data="extSystem" />
    </VCol>
  </VRow>
</template>
