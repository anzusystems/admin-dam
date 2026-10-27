<script lang="ts" setup>
import type { AssetFile } from '@anzusystems/common-admin'
import {
  ACopyText,
  ADamAssetCustomMetadataForm,
  ADamAuthorRemoteAutocompleteWithCached,
  ADamKeywordRemoteAutocompleteWithCached,
  ASystemEntityScope,
  DamAssetType,
  DamAssetTypeDefault,
  assetFileIsAudioFile,
  assetFileIsImageFile,
  assetFileIsVideoFile,
  dateTimePretty,
  prettyBytes,
  useDamAuthorAssetTypeConfig,
  useDamKeywordAssetTypeConfig,
} from '@anzusystems/common-admin'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AssetMetadataAudioAttributes from '@/domains/coreDam/asset/components/AssetMetadataAudioAttributes.vue'
import AssetMetadataImageAttributes from '@/domains/coreDam/asset/components/AssetMetadataImageAttributes.vue'
import AssetMetadataVideoAttributes from '@/domains/coreDam/asset/components/AssetMetadataVideoAttributes.vue'
import { useAssetDetailActions } from '@/domains/coreDam/asset/components/detail/composables/assetDetailActions'
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import AssetFileMainRoute from '@/domains/coreDam/shared/assetFileRoute/components/AssetFileMainRoute.vue'
import CachedDamUserChip from '@/domains/coreDam/shared/components/CachedDamUserChip.vue'
import { AssetMetadataValidationScopeSymbol } from '@/domains/coreDam/shared/validationScopes'

const { t } = useI18n()
const { currentExtSystemId } = useCurrentExtSystem()

const panels = ref(['metadata', 'file'])

const {
  asset,
  authorConflicts,
  metadataTouch,
  mainFileSingleUse,
  mainFileOverrideInternal,
  mainFileInternal,
  ttsAudio,
} = useAssetDetailActions()

const assetType = computed(() => asset.value?.attributes.assetType || DamAssetTypeDefault)

const isTypeImage = computed(() => assetType.value === DamAssetType.Image)

const isTypeAudio = computed(() => assetType.value === DamAssetType.Audio)

const isTypeVideo = computed(() => assetType.value === DamAssetType.Video)

const assetMainFile = computed<null | AssetFile>(() =>
  asset.value && asset.value.mainFile ? (asset.value.mainFile as AssetFile) : null
)

const routableAssetFile = computed(() => {
  if (asset?.value?.mainFile && !assetFileIsVideoFile(asset.value.mainFile)) return asset.value.mainFile
  return null
})

// useDamKeywordAssetTypeConfig takes a plain DamAssetTypeType and ext system, not refs, so the read is
// forced by its signature. Making the config reactive means changing that composable.
// eslint-disable-next-line vue/no-ref-object-reactivity-loss
const { keywordEnabled, keywordRequired } = useDamKeywordAssetTypeConfig(assetType.value, currentExtSystemId.value)

// useDamAuthorAssetTypeConfig takes a plain DamAssetTypeType and ext system, not refs, so the read is
// forced by its signature. Making the config reactive means changing that composable.
// eslint-disable-next-line vue/no-ref-object-reactivity-loss
const { authorEnabled, authorRequired } = useDamAuthorAssetTypeConfig(assetType.value, currentExtSystemId.value)

const onAnyMetadataChange = () => {
  metadataTouch()
}
</script>

<template>
  <VExpansionPanels
    v-if="asset"
    v-model="panels"
    multiple
    class="v-expansion-panels--compact"
  >
    <VExpansionPanel
      elevation="0"
      :title="t('coreDam.asset.detail.info.metadata')"
      value="metadata"
    >
      <VExpansionPanelText>
        <ADamAssetCustomMetadataForm
          v-if="asset"
          v-model="asset.metadata.customData"
          :asset-type="assetType"
          :ext-system="currentExtSystemId"
          :validation-scope="AssetMetadataValidationScopeSymbol"
          @any-change="onAnyMetadataChange"
        >
          <template #after-pinned>
            <VRow
              v-if="keywordEnabled"
              density="compact"
              class="my-2"
            >
              <VCol>
                <ASystemEntityScope
                  subject="keyword"
                  system="dam"
                >
                  <ADamKeywordRemoteAutocompleteWithCached
                    v-model="asset.keywords"
                    :ext-system="currentExtSystemId"
                    :label="t('coreDam.asset.model.keywords')"
                    data-cy="custom-field-keywords"
                    clearable
                    multiple
                    :required="keywordRequired"
                    :validation-scope="AssetMetadataValidationScopeSymbol"
                    @update:model-value="onAnyMetadataChange"
                  />
                </ASystemEntityScope>
              </VCol>
            </VRow>
            <VRow
              v-if="authorEnabled"
              density="compact"
              class="my-2"
            >
              <VCol>
                <ASystemEntityScope
                  subject="author"
                  system="dam"
                >
                  <ADamAuthorRemoteAutocompleteWithCached
                    v-model="asset.authors"
                    :ext-system="currentExtSystemId"
                    :label="t('coreDam.asset.model.authors')"
                    :author-conflicts="authorConflicts"
                    data-cy="custom-field-authors"
                    clearable
                    multiple
                    :required="authorRequired"
                    :validation-scope="AssetMetadataValidationScopeSymbol"
                    @update:model-value="onAnyMetadataChange"
                  />
                </ASystemEntityScope>
              </VCol>
            </VRow>
            <VRow
              density="compact"
              class="my-2"
            >
              <VCol>
                <VSwitch
                  v-model="mainFileSingleUse"
                  :label="t('common.damImage.asset.model.mainFileSingleUse')"
                  @update:model-value="onAnyMetadataChange"
                />
              </VCol>
            </VRow>
            <VRow
              v-if="isTypeAudio"
              density="compact"
              class="my-2"
            >
              <VCol>
                <VSwitch
                  v-model="ttsAudio"
                  :label="t('coreDam.asset.model.ttsAudio')"
                  @update:model-value="onAnyMetadataChange"
                />
              </VCol>
            </VRow>
            <VRow
              v-if="isTypeImage && asset.mainFile"
              density="compact"
              class="my-2"
            >
              <VCol>
                <VSwitch
                  v-model="mainFileOverrideInternal"
                  :label="t('coreDam.asset.detail.info.field.flags.overrideInternal')"
                  @update:model-value="onAnyMetadataChange"
                />
              </VCol>
            </VRow>
            <VRow
              v-if="isTypeImage && asset.mainFile"
              density="compact"
              class="my-2"
            >
              <VCol>
                <VSwitch
                  v-model="mainFileInternal"
                  :disabled="!mainFileOverrideInternal"
                  :label="t('coreDam.asset.detail.info.field.flags.internal')"
                  @update:model-value="onAnyMetadataChange"
                />
              </VCol>
            </VRow>
          </template>
        </ADamAssetCustomMetadataForm>
      </VExpansionPanelText>
    </VExpansionPanel>
    <VExpansionPanel
      elevation="0"
      :title="t('coreDam.asset.detail.info.file')"
      value="file"
    >
      <VExpansionPanelText class="text-body-small">
        <!-- all types -->
        <VRow>
          <VCol cols="3">
            {{ t('coreDam.asset.detail.info.field.id') }}
          </VCol>
          <VCol cols="9">
            <ACopyText :value="asset.id" />
          </VCol>
        </VRow>
        <VRow>
          <VCol cols="3">
            {{ t('coreDam.asset.detail.info.field.type') }}
          </VCol>
          <VCol cols="9">
            {{ asset.attributes.assetType }}
          </VCol>
        </VRow>
        <VRow>
          <VCol cols="3">
            {{ t('common.model.tracking.created') }}
          </VCol>
          <VCol cols="9"> {{ dateTimePretty(asset.createdAt) }}<br /><CachedDamUserChip :id="asset.createdBy" /> </VCol>
        </VRow>
        <VRow>
          <VCol cols="3">
            {{ t('common.model.tracking.modified') }}
          </VCol>
          <VCol cols="9">
            {{ dateTimePretty(asset.modifiedAt) }}<br /><CachedDamUserChip :id="asset.modifiedBy" />
          </VCol>
        </VRow>
        <div v-if="assetMainFile">
          <VRow>
            <VCol cols="3">
              {{ t('coreDam.asset.detail.info.field.mainFileId') }}
            </VCol>
            <VCol cols="9">
              <ACopyText :value="assetMainFile.id" />
            </VCol>
          </VRow>
          <VRow v-if="routableAssetFile">
            <VCol
              cols="3"
              class="pt-4"
            >
              {{ t('coreDam.asset.detail.info.field.mainRoute') }}
            </VCol>
            <VCol cols="9">
              <AssetFileMainRoute
                :asset-file="routableAssetFile"
                :asset-type="assetType"
                :title="asset.texts.displayTitle"
                is-main-file
              />
            </VCol>
          </VRow>
          <VRow>
            <VCol cols="3">
              {{ t('coreDam.asset.detail.info.field.mimeType') }}
            </VCol>
            <VCol cols="9">
              {{ assetMainFile.fileAttributes.mimeType }}
            </VCol>
          </VRow>
          <VRow>
            <VCol cols="3">
              {{ t('coreDam.asset.detail.info.field.size') }}
            </VCol>
            <VCol cols="9">
              {{ prettyBytes(assetMainFile.fileAttributes.size) }}
            </VCol>
          </VRow>
          <!-- image -->
          <AssetMetadataImageAttributes
            v-if="isTypeImage && assetFileIsImageFile(assetMainFile)"
            :file="assetMainFile"
          />
          <!-- video -->
          <AssetMetadataVideoAttributes
            v-if="isTypeVideo && assetFileIsVideoFile(assetMainFile)"
            :file="assetMainFile"
          />
          <!-- audio -->
          <AssetMetadataAudioAttributes
            v-if="isTypeAudio && assetFileIsAudioFile(assetMainFile)"
            :file="assetMainFile"
          />
        </div>
      </VExpansionPanelText>
    </VExpansionPanel>
  </VExpansionPanels>
</template>
