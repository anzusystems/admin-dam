<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/extSystem/api/extSystemApi'
import { ACL } from '@/domains/system/auth/auth'
import { useExtSystemEditActions } from '@/domains/coreDam/extSystem/composables/extSystemActions'
import { useTtsActiveProviderMode } from '@/domains/coreDam/ttsNarrationRequest/valueObject/TtsActiveProviderMode'
import { useCurrentAssetLicence } from '@/domains/coreDam/asset/composables/currentExtSystem'
import {
  AAssetSelect,
  AFormValueObjectOptionsSelect,
  ARow,
  ASystemEntityScope,
  type AssetSelectReturnData,
  DamAssetType,
} from '@anzusystems/common-admin'
import { AFormRemoteAutocomplete, FilterInnerConfigKey, FilterInnerDataKey } from '@anzusystems/common-admin/labs'
import VoiceFamilyRemoteAutocomplete from '@/domains/coreDam/voiceFamily/components/VoiceFamilyRemoteAutocomplete.vue'
import AssetChip from '@/domains/coreDam/asset/components/detail/components/AssetChip.vue'
import { useKeywordSelectActions } from '@/domains/coreDam/keyword/composables/keywordActions'
import { useKeywordInnerFilter } from '@/domains/coreDam/keyword/filter/KeywordFilter'

const { extSystem } = useExtSystemEditActions()
const { valueObjectOptions } = useTtsActiveProviderMode()
const { currentAssetLicenceId } = useCurrentAssetLicence()
const { fetchItems: fetchKeywordItems, fetchItemsByIds: fetchKeywordItemsByIds } = useKeywordSelectActions()

const { filterConfig: keywordFilterConfig, filterData: keywordFilterData } = useKeywordInnerFilter()
provide(FilterInnerConfigKey, keywordFilterConfig)
provide(FilterInnerDataKey, keywordFilterData)

const { t } = useI18n()

const epilogLicenceIds = computed<IntegerId[]>(() => [currentAssetLicenceId.value])

const onEpilogSelect = (data: AssetSelectReturnData) => {
  if (data.type === 'assetId') {
    extSystem.value.ttsFreeAudioEpilogAsset = data.value[0] ?? null
  }
}

const clearEpilog = () => {
  extSystem.value.ttsFreeAudioEpilogAsset = null
}
</script>

<template>
  <Acl :permission="ACL.DAM_EXT_SYSTEM_UPDATE">
    <ASystemEntityScope
      :system="SYSTEM_CORE_DAM"
      :subject="ENTITY"
    >
      <VRow>
        <VCol
          cols="12"
          md="8"
        >
          <ARow>
            <AFormValueObjectOptionsSelect
              v-model="extSystem.ttsSettings.activeProviderMode"
              :label="t('coreDam.extSystem.ttsSettings.activeProviderMode')"
              :items="valueObjectOptions"
              data-cy="ext-system-tts-active-provider-mode"
            />
          </ARow>
          <ARow>
            <VoiceFamilyRemoteAutocomplete
              v-model="extSystem.ttsSettings.defaultVoiceFamilyId"
              :ext-system-id="extSystem.id"
              :label="t('coreDam.extSystem.ttsSettings.defaultVoiceFamily')"
              clearable
              data-cy="ext-system-tts-default-voice-family"
            />
          </ARow>
          <ARow>
            <AFormRemoteAutocomplete
              v-model="extSystem.ttsSettings.autoKeywordId"
              :label="t('coreDam.extSystem.ttsSettings.autoKeyword')"
              :fetch-items="fetchKeywordItems"
              :fetch-items-by-ids="fetchKeywordItemsByIds"
              clearable
              filter-by-field="text"
              min-search-text="common.damImage.keyword.filterMinChars"
              data-cy="ext-system-tts-auto-keyword"
            />
          </ARow>
          <ARow>
            <div class="font-weight-bold mb-1">
              {{ t('coreDam.extSystem.ttsSettings.ttsFreeAudioEpilogAsset') }}
            </div>
            <div class="d-flex align-center">
              <AssetChip
                v-if="extSystem.ttsFreeAudioEpilogAsset"
                :id="extSystem.ttsFreeAudioEpilogAsset"
              />
              <span v-else>—</span>
              <VBtn
                v-if="extSystem.ttsFreeAudioEpilogAsset"
                icon="mdi-trash-can-outline"
                variant="text"
                size="small"
                class="ml-2"
                data-cy="ext-system-tts-free-audio-epilog-asset-clear"
                @click.stop="clearEpilog"
              />
              <AAssetSelect
                :select-licences="epilogLicenceIds"
                :min-count="1"
                :max-count="1"
                return-type="assetId"
                :asset-type="DamAssetType.Audio"
                @on-confirm="onEpilogSelect"
              >
                <template #activator="{ props: assetSelectProps }">
                  <VBtn
                    v-bind="assetSelectProps"
                    variant="text"
                    size="small"
                    class="ml-2"
                    data-cy="ext-system-tts-free-audio-epilog-asset-select"
                  >
                    {{ t('coreDam.extSystem.ttsSettings.ttsFreeAudioEpilogAssetSelect') }}
                  </VBtn>
                </template>
              </AAssetSelect>
            </div>
          </ARow>
        </VCol>
      </VRow>
    </ASystemEntityScope>
  </Acl>
</template>
