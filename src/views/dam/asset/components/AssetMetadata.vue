<script lang="ts" setup>
import AssetCustomMetadataForm from '@/components/dam/customMetadata/AssetCustomMetadataForm.vue'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import KeywordSelect from '@/views/dam/keyword/components/KeywordSelect.vue'
import LazyUserChip from '@/views/dam/user/components/LazyUserChip.vue'
import AuthorSelect from '@/views/dam/author/components/AuthorSelect.vue'
import DColorBox from '@/components/common/DColorBox.vue'
import { useAssetDetailActions } from '@/views/dam/asset/detail/composables/assetDetailActions'
import { prettyDateTime } from '@/utils/datetime'
import { prettyBytes } from '@/utils/file'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AssetType } from '@/model/dam/valueObject/AssetType'
import type { AudioFile, DocumentFile, ImageFile, VideoFile } from '@/types/dam/File'
import { useKeywordAssetTypeConfig } from '@/views/dam/keyword/composables/keywordConfig'
import { useAuthorAssetTypeConfig } from '@/views/dam/author/composables/authorConfig'
import { AssetMetadataValidationScopeSymbol } from '@/components/validationScopes'

const { t } = useI18n({ useScope: 'global' })

const panels = ref(['metadata', 'file'])

const { asset, metadataTouch } = useAssetDetailActions()

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
          :asset-type="assetType"
          v-model="asset.metadata.customData"
          @any-change="onAnyMetadataChange"
        >
          <template #after-pinned>
            <VRow dense class="my-2" v-if="keywordEnabled">
              <VCol>
                <ASystemEntityScope subject="keyword" system="dam">
                  <KeywordSelect
                    label="Keywords"
                    v-model="asset.keywords"
                    :suggestions="asset.metadata.keywordSuggestions"
                    chips
                    clearable
                    multiple
                    @update:model-value="onAnyMetadataChange"
                    :required="keywordRequired"
                    :validation-scope="AssetMetadataValidationScopeSymbol"
                  />
                </ASystemEntityScope>
              </VCol>
            </VRow>
            <VRow dense class="my-2" v-if="authorEnabled">
              <VCol>
                <ASystemEntityScope subject="author" system="dam">
                  <AuthorSelect
                    label="Authors"
                    v-model="asset.authors"
                    :suggestions="asset.metadata.authorSuggestions"
                    chips
                    clearable
                    multiple
                    @update:model-value="onAnyMetadataChange"
                    :required="authorRequired"
                    :validation-scope="AssetMetadataValidationScopeSymbol"
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
          <VCol cols="9">{{ asset.id }}</VCol>
        </VRow>
        <VRow>
          <VCol>{{ t('coreDam.asset.detail.info.field.type') }}</VCol>
          <VCol cols="9">{{ asset.attributes.assetType }}</VCol>
        </VRow>
        <VRow>
          <VCol>{{ t('common.tracking.created') }}</VCol>
          <VCol cols="9"><LazyUserChip :id="asset.createdBy" /><br />{{ prettyDateTime(asset.createdAt) }}</VCol>
        </VRow>
        <VRow>
          <VCol>{{ t('common.tracking.modified') }}</VCol>
          <VCol cols="9"><LazyUserChip :id="asset.modifiedBy" /><br />{{ prettyDateTime(asset.modifiedAt) }}</VCol>
        </VRow>
        <div v-if="assetMainFile">
          <VRow>
            <VCol>{{ t('coreDam.asset.detail.info.field.mainFileId') }}</VCol>
            <VCol cols="9">{{ assetMainFile.id }}</VCol>
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
        <div v-if="assetMainFile && assetMainFile.imageAttributes && isTypeImage">
          <VRow>
            <VCol>{{ t('coreDam.asset.detail.info.field.dominantColor') }}</VCol>
            <VCol cols="9"><DColorBox :color="assetMainFile.imageAttributes.mostDominantColor" /></VCol>
          </VRow>
          <VRow>
            <VCol>{{ t('coreDam.asset.detail.info.field.width') }}</VCol>
            <VCol cols="9">{{ assetMainFile.imageAttributes.width }} px</VCol>
          </VRow>
          <VRow>
            <VCol>{{ t('coreDam.asset.detail.info.field.height') }}</VCol>
            <VCol cols="9">{{ assetMainFile.imageAttributes.height }} px</VCol>
          </VRow>
          <VRow>
            <VCol>{{ t('coreDam.asset.detail.info.field.ratio') }}</VCol>
            <VCol cols="9">
              {{ assetMainFile.imageAttributes.ratioWidth }} /
              {{ assetMainFile.imageAttributes.ratioHeight }}
            </VCol>
          </VRow>
        </div>
      </VExpansionPanelText>
    </VExpansionPanel>
  </VExpansionPanels>
</template>
