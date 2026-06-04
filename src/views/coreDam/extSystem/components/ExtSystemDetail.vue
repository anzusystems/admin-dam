<script lang="ts" setup>
import { computed } from 'vue'
import { ACachedChip, ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useExtSystemOneStore } from '@/stores/coreDam/extSystemStore'
import CachedDamUserChip from '@/components/CachedDamUserChip.vue'
import CachedVoiceFamilyChip from '@/views/coreDam/voiceFamily/components/CachedVoiceFamilyChip.vue'
import AssetChip from '@/views/coreDam/asset/detail/components/AssetChip.vue'
import { useTtsActiveProviderMode } from '@/model/coreDam/valueObject/TtsActiveProviderMode'
import { useCachedKeywords } from '@/views/coreDam/keyword/composables/cachedKeywords'
import { ROUTE } from '@/router/routes'

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
      <div class="text-h6 mb-2">
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
          :route="ROUTE.DAM.KEYWORD.DETAIL"
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
