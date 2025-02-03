<script lang="ts" setup>
import CachedDamUserChip from '@/components/CachedDamUserChip.vue'
import AssetCustomMetadataForm from '@/components/coreDam/customMetadata/AssetCustomMetadataForm.vue'
import { AssetMetadataValidationScopeSymbol } from '@/components/validationScopes'
import AssetMetadataAudioAttributes from '@/views/coreDam/asset/components/AssetMetadataAudioAttributes.vue'
import AssetMetadataImageAttributes from '@/views/coreDam/asset/components/AssetMetadataImageAttributes.vue'
import AssetMetadataVideoAttributes from '@/views/coreDam/asset/components/AssetMetadataVideoAttributes.vue'
import { useAssetDetailActions } from '@/views/coreDam/asset/detail/composables/assetDetailActions'
import AssetFileMainRoute from '@/views/coreDam/assetFileRoute/components/AssetFileMainRoute.vue'
import AuthorRemoteAutocompleteWithCached from '@/views/coreDam/author/components/AuthorRemoteAutocompleteWithCached.vue'
import { useAuthorAssetTypeConfig } from '@/views/coreDam/author/composables/authorConfig'
import KeywordRemoteAutocompleteWithCached from '@/views/coreDam/keyword/components/KeywordRemoteAutocompleteWithCached.vue'
import { useKeywordAssetTypeConfig } from '@/views/coreDam/keyword/composables/keywordConfig'
import type { AssetFile } from '@anzusystems/common-admin'
import {
  ACopyText,
  assetFileIsAudioFile,
  assetFileIsImageFile,
  assetFileIsVideoFile,
  ASystemEntityScope,
  DamAssetType,
  DamAssetTypeDefault,
  dateTimePretty,
  prettyBytes,
} from '@anzusystems/common-admin'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  (e: 'mainRouteChanged'): void
  (e: 'mainRouteChanged'): void
}>()

const { t } = useI18n()

const panels = ref(['metadata', 'file'])

const { asset, authorConflicts, metadataTouch, mainFileSingleUse } = useAssetDetailActions()

const assetType = computed(() => {
  return asset.value?.attributes.assetType || DamAssetTypeDefault
})

const isTypeImage = computed(() => {
  return assetType.value === DamAssetType.Image
})

const isTypeAudio = computed(() => {
  return assetType.value === DamAssetType.Audio
})

const isTypeVideo = computed(() => {
  return assetType.value === DamAssetType.Video
})

const assetMainFile = computed<null | AssetFile>(() => {
  return asset.value && asset.value.mainFile ? (asset.value.mainFile as AssetFile) : null
})

const routableAssetFile = computed(() => {
  if (asset?.value?.mainFile && !assetFileIsVideoFile(asset.value.mainFile)) return asset.value.mainFile
  return null
})

// eslint-disable-next-line vue/no-ref-object-reactivity-loss
const { keywordEnabled, keywordRequired } = useKeywordAssetTypeConfig(assetType.value)
// eslint-disable-next-line vue/no-ref-object-reactivity-loss
const { authorEnabled, authorRequired } = useAuthorAssetTypeConfig(assetType.value)

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
        <AssetCustomMetadataForm
          v-if="asset"
          v-model="asset.metadata.customData"
          :asset-type="assetType"
          @any-change="onAnyMetadataChange"
        >
          <template #after-pinned>
            <VRow
              v-if="keywordEnabled"
              dense
              class="my-2"
            >
              <VCol>
                <ASystemEntityScope
                  subject="keyword"
                  system="dam"
                >
                  <KeywordRemoteAutocompleteWithCached
                    v-model="asset.keywords"
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
              dense
              class="my-2"
            >
              <VCol>
                <ASystemEntityScope
                  subject="author"
                  system="dam"
                >
                  <AuthorRemoteAutocompleteWithCached
                    v-model="asset.authors"
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
              dense
              class="my-2"
            >
              <VCol>
                <VSwitch
                  v-model="mainFileSingleUse"
                  :label="t('common.damImage.asset.model.mainFileSingleUse')"
                />
              </VCol>
            </VRow>
          </template>
        </AssetCustomMetadataForm>
      </VExpansionPanelText>
    </VExpansionPanel>
    <VExpansionPanel
      elevation="0"
      :title="t('coreDam.asset.detail.info.file')"
      value="file"
    >
      <VExpansionPanelText class="text-caption">
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
          <VCol cols="9">
            {{ dateTimePretty(asset.createdAt) }}<br><CachedDamUserChip :id="asset.createdBy" />
          </VCol>
        </VRow>
        <VRow>
          <VCol cols="3">
            {{ t('common.model.tracking.modified') }}
          </VCol>
          <VCol cols="9">
            {{ dateTimePretty(asset.modifiedAt) }}<br><CachedDamUserChip :id="asset.modifiedBy" />
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
                @main-route-changed="emit('mainRouteChanged')"
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
