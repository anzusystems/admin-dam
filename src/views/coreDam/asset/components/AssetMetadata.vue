<script lang="ts" setup>
import AssetCustomMetadataForm from '@/components/coreDam/customMetadata/AssetCustomMetadataForm.vue'
import { ACopyText, ASystemEntityScope, dateTimePretty, prettyBytes } from '@anzusystems/common-admin'
import KeywordRemoteAutocompleteWithCached from '@/views/coreDam/keyword/components/KeywordRemoteAutocompleteWithCached.vue'
import CachedAnzuUserChip from '@/views/coreDam/user/components/CachedAnzuUserChip.vue'
import AuthorRemoteAutocompleteWithCached from '@/views/coreDam/author/components/AuthorRemoteAutocompleteWithCached.vue'
import { useAssetDetailActions } from '@/views/coreDam/asset/detail/composables/assetDetailActions'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AssetType } from '@/model/coreDam/valueObject/AssetType'
import type { AudioFile, DocumentFile, ImageFile, VideoFile } from '@/types/coreDam/File'
import { useKeywordAssetTypeConfig } from '@/views/coreDam/keyword/composables/keywordConfig'
import { useAuthorAssetTypeConfig } from '@/views/coreDam/author/composables/authorConfig'
import { AssetMetadataValidationScopeSymbol } from '@/components/validationScopes'
import AssetMetadataImageAttributes from '@/views/coreDam/asset/components/AssetMetadataImageAttributes.vue'
import { isImageFile } from '@/types/coreDam/File'

const { t } = useI18n()

const panels = ref(['metadata', 'file'])

const { asset, authorConflicts, metadataTouch } = useAssetDetailActions()

const assetType = computed(() => {
  return asset.value?.attributes.assetType || AssetType.Default
})

const isTypeImage = computed(() => {
  return assetType.value === AssetType.Image
})

const assetMainFile = computed<null | ImageFile | AudioFile | DocumentFile | VideoFile>(() => {
  return asset.value && asset.value.mainFile ? asset.value.mainFile : null
})

const { keywordEnabled, keywordRequired } = useKeywordAssetTypeConfig(assetType.value)
const { authorEnabled, authorRequired } = useAuthorAssetTypeConfig(assetType.value)

const onAnyMetadataChange = () => {
  metadataTouch()
}
</script>

<template>
  <VExpansionPanels v-if="asset" v-model="panels" multiple class="v-expansion-panels--compact">
    <VExpansionPanel elevation="0" :title="t('coreDam.asset.detail.info.metadata')" value="metadata">
      <VExpansionPanelText>
        <AssetCustomMetadataForm
          v-if="asset"
          v-model="asset.metadata.customData"
          :asset-type="assetType"
          @any-change="onAnyMetadataChange"
        >
          <template #after-pinned>
            <VRow v-if="keywordEnabled" dense class="my-2">
              <VCol>
                <ASystemEntityScope subject="keyword" system="dam">
                  <KeywordRemoteAutocompleteWithCached
                    v-model="asset.keywords"
                    :label="t('coreDam.asset.model.keywords')"
                    clearable
                    multiple
                    :required="keywordRequired"
                    :validation-scope="AssetMetadataValidationScopeSymbol"
                    @update:model-value="onAnyMetadataChange"
                  />
                </ASystemEntityScope>
              </VCol>
            </VRow>
            <VRow v-if="authorEnabled" dense class="my-2">
              <VCol>
                <ASystemEntityScope subject="author" system="dam">
                  <AuthorRemoteAutocompleteWithCached
                    v-model="asset.authors"
                    :label="t('coreDam.asset.model.authors')"
                    :author-conflicts="authorConflicts"
                    clearable
                    multiple
                    :required="authorRequired"
                    :validation-scope="AssetMetadataValidationScopeSymbol"
                    @update:model-value="onAnyMetadataChange"
                  />
                </ASystemEntityScope>
              </VCol>
            </VRow>
          </template>
        </AssetCustomMetadataForm>
      </VExpansionPanelText>
    </VExpansionPanel>
    <VExpansionPanel elevation="0" :title="t('coreDam.asset.detail.info.file')" value="file">
      <VExpansionPanelText class="text-caption">
        <!-- all types -->
        <VRow>
          <VCol>{{ t('coreDam.asset.detail.info.field.id') }}</VCol>
          <VCol cols="9"><ACopyText :value="asset.id" /></VCol>
        </VRow>
        <VRow>
          <VCol>{{ t('coreDam.asset.detail.info.field.type') }}</VCol>
          <VCol cols="9">{{ asset.attributes.assetType }}</VCol>
        </VRow>
        <VRow>
          <VCol>{{ t('common.model.tracking.created') }}</VCol>
          <VCol cols="9"><CachedAnzuUserChip :id="asset.createdBy" /><br />{{ dateTimePretty(asset.createdAt) }}</VCol>
        </VRow>
        <VRow>
          <VCol>{{ t('common.model.tracking.modified') }}</VCol>
          <VCol cols="9"
            ><CachedAnzuUserChip :id="asset.modifiedBy" /><br />{{ dateTimePretty(asset.modifiedAt) }}</VCol
          >
        </VRow>
        <div v-if="assetMainFile">
          <VRow>
            <VCol>{{ t('coreDam.asset.detail.info.field.mainFileId') }}</VCol>
            <VCol cols="9"><ACopyText :value="assetMainFile.id" /></VCol>
          </VRow>
          <VRow>
            <VCol>{{ t('coreDam.asset.detail.info.field.mimeType') }}</VCol>
            <VCol cols="9">{{ assetMainFile.fileAttributes.mimeType }}</VCol>
          </VRow>
          <VRow>
            <VCol>{{ t('coreDam.asset.detail.info.field.size') }}</VCol>
            <VCol cols="9">{{ prettyBytes(assetMainFile.fileAttributes.size) }}</VCol>
          </VRow>
        </div>
        <!-- image -->
        <AssetMetadataImageAttributes
          v-if="assetMainFile && isTypeImage && isImageFile(assetMainFile)"
          :file="assetMainFile"
        />
      </VExpansionPanelText>
    </VExpansionPanel>
  </VExpansionPanels>
</template>
