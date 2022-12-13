<script setup lang="ts">
import { ref } from 'vue'
import { useUploadQueuesStore } from '@/stores/dam/uploadQueuesStore'
import { useI18n } from 'vue-i18n'
import AssetCustomMetadataFormMassOperations from '@/components/dam/customMetadata/AssetCustomMetadataFormMassOperations.vue'
import { AssetType } from '@/model/dam/valueObject/AssetType'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import KeywordSelect from '@/views/dam/keyword/components/KeywordSelect.vue'
import AuthorSelect from '@/views/dam/author/components/AuthorSelect.vue'

const props = withDefaults(
  defineProps<{
    queueId: string
  }>(),
  {}
)

const massOperationsData = ref({ image: {}, video: {}, audio: {}, document: {} })
const massOperationsKeywords = ref([])
const massOperationsAuthors = ref([])

const { t } = useI18n({ useScope: 'global' })

const panels = ref([])

const uploadQueuesStore = useUploadQueuesStore()

const fillEmptyField = (data: { assetType: AssetType; elementKey: string; value: any }) => {
  uploadQueuesStore.queueItemsReplaceEmptyCustomDataValue(props.queueId, data)
}
const replaceField = (data: { assetType: AssetType; elementKey: string; value: any }) => {
  uploadQueuesStore.queueItemsReplaceEmptyCustomDataValue(props.queueId, data, true)
}
const fillEmptyKeywords = () => {
  uploadQueuesStore.queueItemsReplaceEmptyKeywords(props.queueId, massOperationsKeywords.value)
}
const replaceKeywords = () => {
  uploadQueuesStore.queueItemsReplaceEmptyKeywords(props.queueId, massOperationsKeywords.value, true)
}
const fillEmptyAuthors = () => {
  uploadQueuesStore.queueItemsReplaceEmptyAuthors(props.queueId, massOperationsAuthors.value)
}
const replaceAuthors = () => {
  uploadQueuesStore.queueItemsReplaceEmptyAuthors(props.queueId, massOperationsAuthors.value, true)
}
const fillAll = (forceReplace = false) => {
  for (const [elementKey, value] of Object.entries(massOperationsData.value.image)) {
    uploadQueuesStore.queueItemsReplaceEmptyCustomDataValue(
      props.queueId,
      {
        assetType: AssetType.Image,
        elementKey,
        value,
      },
      forceReplace
    )
  }
  for (const [elementKey, value] of Object.entries(massOperationsData.value.video)) {
    uploadQueuesStore.queueItemsReplaceEmptyCustomDataValue(
      props.queueId,
      {
        assetType: AssetType.Video,
        elementKey,
        value,
      },
      forceReplace
    )
  }
  for (const [elementKey, value] of Object.entries(massOperationsData.value.audio)) {
    uploadQueuesStore.queueItemsReplaceEmptyCustomDataValue(
      props.queueId,
      {
        assetType: AssetType.Audio,
        elementKey,
        value,
      },
      forceReplace
    )
  }
  for (const [elementKey, value] of Object.entries(massOperationsData.value.document)) {
    uploadQueuesStore.queueItemsReplaceEmptyCustomDataValue(
      props.queueId,
      {
        assetType: AssetType.Document,
        elementKey,
        value,
      },
      forceReplace
    )
  }
}
const clearForm = () => {
  massOperationsData.value = { image: {}, video: {}, audio: {}, document: {} }
}
</script>

<template>
  <div class="sidebar-info d-flex w-100 h-100 flex-column">
    <div class="w-100 d-flex flex-column">
      <VTabs class="sidebar-info__tabs">
        <VTab>{{ t('coreDam.asset.massOperations.title') }}</VTab>
      </VTabs>
      <div class="sidebar-info__content">
        <div class="text-caption pa-3">{{ t('coreDam.asset.massOperations.description') }}</div>
        <VExpansionPanels v-model="panels" multiple class="v-expansion-panels--compact">
          <VExpansionPanel elevation="0" title="General" value="general">
            <VExpansionPanelText>
              <VRow dense class="my-2">
                <VCol>
                  <ASystemEntityScope subject="keyword" system="dam">
                    <div class="d-flex">
                      <div style="min-width: 292px">
                        <KeywordSelect label="Keywords" v-model="massOperationsKeywords" chips clearable multiple />
                      </div>
                      <VBtn
                        icon="mdi-file-arrow-left-right-outline"
                        size="small"
                        variant="text"
                        class="mr-1"
                        @click.stop="fillEmptyKeywords"
                      ></VBtn>
                      <VBtn
                        icon="mdi-file-replace-outline"
                        size="small"
                        variant="text"
                        @click.stop="replaceKeywords"
                      ></VBtn>
                    </div>
                  </ASystemEntityScope>
                </VCol>
              </VRow>
              <VRow dense class="my-2">
                <VCol>
                  <ASystemEntityScope subject="author" system="dam">
                    <div class="d-flex">
                      <div style="min-width: 292px">
                        <AuthorSelect label="Authors" v-model="massOperationsAuthors" chips clearable multiple />
                      </div>
                      <VBtn
                        icon="mdi-file-arrow-left-right-outline"
                        size="small"
                        variant="text"
                        class="mr-1"
                        @click.stop="fillEmptyAuthors"
                      ></VBtn>
                      <VBtn
                        icon="mdi-file-replace-outline"
                        size="small"
                        variant="text"
                        @click.stop="replaceAuthors"
                      ></VBtn>
                    </div>
                  </ASystemEntityScope>
                </VCol>
              </VRow>
            </VExpansionPanelText>
          </VExpansionPanel>
          <VExpansionPanel elevation="0" title="Image" value="image">
            <VExpansionPanelText>
              <AssetCustomMetadataFormMassOperations
                :asset-type="AssetType.Image"
                v-model="massOperationsData.image"
                @fill-empty-field="fillEmptyField"
                @replace-field="replaceField"
              />
            </VExpansionPanelText>
          </VExpansionPanel>
          <VExpansionPanel elevation="0" title="Video" value="video">
            <VExpansionPanelText>
              <AssetCustomMetadataFormMassOperations :asset-type="AssetType.Video" v-model="massOperationsData.video" />
            </VExpansionPanelText>
          </VExpansionPanel>
          <VExpansionPanel elevation="0" title="Audio" value="audio">
            <VExpansionPanelText>
              <AssetCustomMetadataFormMassOperations :asset-type="AssetType.Audio" v-model="massOperationsData.audio" />
            </VExpansionPanelText>
          </VExpansionPanel>
          <VExpansionPanel elevation="0" title="Document" value="document">
            <VExpansionPanelText>
              <AssetCustomMetadataFormMassOperations
                :asset-type="AssetType.Document"
                v-model="massOperationsData.document"
              />
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>
      </div>
      <div class="sidebar-info__actions pa-2 d-flex align-center justify-center">
        <VBtn class="mr-2" @click.stop="fillAll(false)" variant="flat" color="secondary" size="small">
          {{ t('coreDam.asset.massOperations.fillAllEmpty') }}
        </VBtn>
        <VBtn class="mr-2" @click.stop="fillAll(true)" variant="flat" color="secondary" size="small">
          {{ t('coreDam.asset.massOperations.replaceAll') }}
        </VBtn>
        <VBtn @click.stop="clearForm" variant="flat" color="secondary" size="small">
          {{ t('coreDam.asset.massOperations.clearForm') }}
        </VBtn>
      </div>
    </div>
  </div>
</template>
