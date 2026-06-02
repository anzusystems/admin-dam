<script lang="ts" setup>
import { computed } from 'vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/extSystemApi'
import { useI18n } from 'vue-i18n'
import { ACL } from '@/composables/auth/auth'
import { useExtSystemEditActions } from '@/views/coreDam/extSystem/composables/extSystemActions'
import { useTtsActiveProviderMode } from '@/model/coreDam/valueObject/TtsActiveProviderMode'
import { useCurrentAssetLicence } from '@/composables/system/currentExtSystem'
import {
  AAssetSelect,
  AFormRemoteAutocomplete,
  ARow,
  ASystemEntityScope,
  type AssetSelectReturnData,
  DamAssetLicenceRemoteAutocomplete,
  DamAssetType,
  type IntegerId,
} from '@anzusystems/common-admin'
import { damClient } from '@/services/api/clients/damClient'
import VoiceFamilyRemoteAutocomplete from '@/views/coreDam/voiceFamily/components/VoiceFamilyRemoteAutocomplete.vue'
import AssetChip from '@/views/coreDam/asset/detail/components/AssetChip.vue'
import { useKeywordSelectActions } from '@/views/coreDam/keyword/composables/keywordActions'
import { useKeywordFilter } from '@/model/coreDam/filter/KeywordFilter'

const { extSystem } = useExtSystemEditActions()
const { valueObjectOptions } = useTtsActiveProviderMode()
const { currentAssetLicenceId } = useCurrentAssetLicence()
const { fetchItems: fetchKeywordItems, fetchItemsByIds: fetchKeywordItemsByIds } = useKeywordSelectActions()
const keywordInnerFilter = useKeywordFilter()
const { t } = useI18n()

const epilogLicenceIds = computed<IntegerId[]>(() => {
  if (extSystem.value.ttsDefaultAssetLicence) {
    return [extSystem.value.ttsDefaultAssetLicence]
  }
  return [currentAssetLicenceId.value]
})

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
            <VSelect
              v-model="extSystem.ttsSettings.activeProviderMode"
              :label="t('coreDam.extSystem.ttsSettings.activeProviderMode')"
              :items="valueObjectOptions"
              item-title="title"
              item-value="value"
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
              :inner-filter="keywordInnerFilter"
              clearable
              filter-by-field="text"
              data-cy="ext-system-tts-auto-keyword"
            />
          </ARow>
          <ARow>
            <DamAssetLicenceRemoteAutocomplete
              v-model="extSystem.ttsDefaultAssetLicence"
              :client="damClient"
              :ext-system-id="extSystem.id"
              :label="t('coreDam.extSystem.ttsSettings.ttsDefaultAssetLicence')"
              clearable
              data-cy="ext-system-tts-default-asset-licence"
            />
          </ARow>
          <ARow>
            <div class="d-flex align-center ga-2">
              <div class="text-body-2 font-weight-medium mr-2">
                {{ t('coreDam.extSystem.ttsSettings.ttsFreeAudioEpilogAsset') }}:
              </div>
              <AssetChip
                v-if="extSystem.ttsFreeAudioEpilogAsset"
                :id="extSystem.ttsFreeAudioEpilogAsset"
              />
              <div
                v-else
                class="text-medium-emphasis text-body-2"
              >
                {{ t('coreDam.extSystem.ttsSettings.ttsFreeAudioEpilogAssetEmpty') }}
              </div>
              <VBtn
                v-if="extSystem.ttsFreeAudioEpilogAsset"
                icon="mdi-trash-can-outline"
                variant="text"
                size="small"
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
